const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

router.get("/me", authMiddleware, async (req,res)=>{
  try{

    const userId = req.user.user_id;

    const [rows] = await pool.query(
      "SELECT teacher_id FROM teachers WHERE user_id=?",
      [userId]
    );

    if(!rows.length)
      return res.status(404).json({ error:"teacher not found" });

    res.json({ teacher_id: rows[0].teacher_id });

  }catch(err){
    console.error(err);
    res.status(500).json({ error:"server error" });
  }
});

/* =====================================================
   GET /api/lunch-eating/today
   ===================================================== */
router.get("/today", async (req, res) => {
  const { teacher_id, date } = req.query;
  if (!teacher_id || !date) {
    return res.status(400).json({ error: "teacher_id and date required" });
  }

  try {

    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );
    if (!teacher) return res.json({ rows: [] });

    const classroom_id = teacher.classroom_id;

    const [rows] = await pool.query(
      `
      SELECT 
        c.child_id,
        c.prefix,
        c.first_name,
        c.last_name,
        c.nickname,
        lr.lunch_id,
        IFNULL(lr.status,'รับประทาน') AS status,
        lr.note
      FROM student_enrollments se
      JOIN children c ON c.child_id = se.child_id

      LEFT JOIN lunch_records lr
        ON lr.child_id = c.child_id
       AND lr.record_date = ?

      WHERE se.classroom_id = ?
        AND se.status = 'studying'

      ORDER BY c.child_id
      `,
      [date, classroom_id]
    );

    res.json({
      rows: rows.map(r => ({
        child_id: r.child_id,
        log_id: r.lunch_id || null,
        name: `${r.prefix}${r.first_name} ${r.last_name}`,
        nickname: r.nickname,
        status: r.status,
        note: r.note || ""
      }))
    });

  } catch (err) {
    console.error("lunch today error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   GET /api/lunch-eating/history
   ===================================================== */
router.get("/history", async (req, res) => {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return res.status(400).json({ error: "teacher_id required" });
  }

  try {
    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );
    if (!teacher) return res.json({ rows: [] });

    const [rows] = await pool.query(
      `
      SELECT
        lr.record_date,
        c.prefix,
        c.first_name,
        c.last_name,
        lr.status,
        lr.note
      FROM lunch_records lr
      JOIN children c ON lr.child_id = c.child_id
      WHERE c.classroom_id = ?
      ORDER BY lr.record_date DESC, c.child_id
      `,
      [teacher.classroom_id]
    );

    res.json({ rows });
  } catch (err) {
    console.error("lunch history error:", err);
    res.status(500).json({ error: "history error" });
  }
});

/* =====================================================
   POST /api/lunch-eating/save
   ===================================================== */
router.post("/save", async (req, res) => {
  const { teacher_id, date, items } = req.body;
  if (!teacher_id || !date || !Array.isArray(items)) {
    return res.status(400).json({ error: "invalid payload" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let saved = 0;

    for (const it of items) {
      if (it.log_id) {
        // UPDATE
        await conn.query(
          `
          UPDATE lunch_records
          SET status = ?, note = ?
          WHERE lunch_id = ?
          `,
          [it.status, it.note || null, it.log_id]
        );
      } else {
        // INSERT
        await conn.query(
          `
          INSERT INTO lunch_records
            (child_id, teacher_id, record_date, status, note, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
          `,
          [
            it.child_id,
            teacher_id,
            date,
            it.status,
            it.note || null
          ]
        );
      }
      saved++;
    }

    await conn.commit();
    res.json({ saved });
  } catch (err) {
    await conn.rollback();
    console.error("lunch save error:", err);
    res.status(500).json({ error: "save error" });
  } finally {
    conn.release();
  }
});

router.get("/summary-by-classroom", async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const [rows] = await pool.query(`
      SELECT 
        cr.classroom_name,

        COUNT(
          CASE
            WHEN c.prefix = 'เด็กชาย'
             AND lr.status = 'รับประทาน'
            THEN lr.lunch_id
          END
        ) AS male_total,

        COUNT(
          CASE
            WHEN c.prefix = 'เด็กหญิง'
             AND lr.status = 'รับประทาน'
            THEN lr.lunch_id
          END
        ) AS female_total

      FROM classrooms cr

      LEFT JOIN student_enrollments se
        ON se.classroom_id = cr.classroom_id
       AND se.status = 'studying'

      LEFT JOIN children c
        ON c.child_id = se.child_id

      LEFT JOIN lunch_records lr
        ON lr.child_id = se.child_id
       AND MONTH(lr.record_date) = ?
       AND YEAR(lr.record_date) = ?

      WHERE cr.classroom_name <> 'จบการศึกษา'

      GROUP BY cr.classroom_id, cr.classroom_name
      ORDER BY cr.classroom_id
    `, [month, year]);

    res.json(rows);

  } catch (err) {
    console.error("GET /summary-by-classroom err", err);
    res.status(500).json({ error: "failed to fetch lunch summary" });
  }
});

module.exports = router;
