const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* ===== ME ===== */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await pool.query(
      "SELECT teacher_id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "teacher not found" });

    res.json({ teacher_id: rows[0].teacher_id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});


/* ===== TODAY ===== */
router.get("/today", async (req, res) => {
  const teacher_id = Number(req.query.teacher_id);
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  if (!teacher_id)
    return res.status(400).json({ error: "teacher_id required" });

  try {

    /* ⭐ หา classroom ก่อน */
    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id=?",
      [teacher_id]
    );

    if (!teacher)
      return res.json({ rows: [] });

    const classroom_id = teacher.classroom_id;

    /* ⭐ เอาเฉพาะเด็กที่กำลังเรียน */
    const [children] = await pool.query(
      `SELECT 
          c.child_id,
          c.prefix,
          c.first_name,
          c.last_name,
          c.nickname
       FROM student_enrollments se
       JOIN children c ON c.child_id = se.child_id
       WHERE se.classroom_id = ?
         AND se.status = 'studying'`,
      [classroom_id]
    );

    /* ⭐ record วันนี้ */
    const [records] = await pool.query(
      `SELECT child_id, status, note
       FROM milk_records
       WHERE teacher_id=? AND record_date=?`,
      [teacher_id, date]
    );

    const map = {};
    records.forEach(r => {
      map[r.child_id] = {
        status: r.status,
        note: r.note
      };
    });

    const rows = children.map(c => ({
      child_id: c.child_id,
      name: `${c.prefix}${c.first_name} ${c.last_name}`,
      nickname: c.nickname,
      status: map[c.child_id]?.status || "ดื่ม",
      note: map[c.child_id]?.note || ""
    }));

    res.json({ rows });

  } catch (err) {
    console.error("MILK TODAY ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});


/* ===== HISTORY ===== */
router.get("/history", async (req, res) => {
  const teacher_id = Number(req.query.teacher_id);
  if (!teacher_id)
    return res.status(400).json({ error: "teacher_id required" });

  try {

    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id=?",
      [teacher_id]
    );

    if (!teacher)
      return res.json({ rows: [] });

    const [rows] = await pool.query(
      `SELECT 
          r.record_date,
          c.prefix, c.first_name, c.last_name,
          r.status
       FROM milk_records r
       JOIN children c ON r.child_id = c.child_id
       WHERE c.classroom_id=?
       ORDER BY r.record_date DESC`,
      [teacher.classroom_id]
    );

    res.json({ rows });

  } catch (err) {
    console.error("MILK HISTORY ERROR:", err);
    res.status(500).json({ error: "history error" });
  }
});


/* ===== SAVE ===== */
router.post("/save", async (req, res) => {
  const { teacher_id, date, items } = req.body;

  if (!teacher_id || !Array.isArray(items))
    return res.status(400).json({ error: "invalid payload" });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const it of items) {
      await conn.query(
        `INSERT INTO milk_records
         (child_id, teacher_id, record_date, status, note)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note)`,
        [it.child_id, teacher_id, date, it.status, it.note || null]
      );
    }

    await conn.commit();
    res.json({ saved: items.length });

  } catch (err) {
    await conn.rollback();
    console.error("MILK SAVE ERROR:", err);
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
             AND mr.status = 'ดื่ม'
            THEN mr.milk_id
          END
        ) AS male_total,

        COUNT(
          CASE
            WHEN c.prefix = 'เด็กหญิง'
             AND mr.status = 'ดื่ม'
            THEN mr.milk_id
          END
        ) AS female_total

      FROM classrooms cr

      LEFT JOIN student_enrollments se
        ON se.classroom_id = cr.classroom_id
       AND se.status = 'studying'

      LEFT JOIN children c
        ON c.child_id = se.child_id

      LEFT JOIN milk_records mr
        ON mr.child_id = se.child_id
       AND MONTH(mr.record_date) = ?
       AND YEAR(mr.record_date) = ?

      WHERE cr.classroom_name <> 'จบการศึกษา'

      GROUP BY cr.classroom_id, cr.classroom_name
      ORDER BY cr.classroom_id
    `, [month, year]);

    res.json(rows);

  } catch (err) {
    console.error("GET /summary-by-classroom err", err);
    res.status(500).json({ error: "failed to fetch milk summary" });
  }
});

module.exports = router;
