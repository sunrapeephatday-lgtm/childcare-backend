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

    if (!rows.length) {
      return res.status(404).json({ error: "teacher not found" });
    }

    res.json({
      teacher_id: rows[0].teacher_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});


/* ===== TODAY ===== */
router.get("/today", async (req, res) => {
  try {
    const teacher_id = parseInt(req.query.teacher_id, 10);
    if (!teacher_id)
      return res.status(400).json({ error: "teacher_id required" });

    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    if (!teacher) return res.json({ rows: [] });

    const classroom_id = teacher.classroom_id;

    /* ⭐ ใช้ enrollment เหมือน checkins */
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
         AND se.status = 'studying'
       ORDER BY c.first_name`,
      [classroom_id]
    );

    if (!children.length) return res.json({ rows: [] });

    const ids = children.map(c => c.child_id);
    const placeholders = ids.map(() => "?").join(",");

    /* ⭐ เช็คว่ามี record วันนี้ไหม */
    const [records] = await pool.query(
      `SELECT child_id, status, note
       FROM toothbrush_records
       WHERE record_date = CURDATE()
         AND teacher_id = ?
         AND child_id IN (${placeholders})`,
      [teacher_id, ...ids]
    );

    const map = {};
    records.forEach(r => map[r.child_id] = r);

    const rows = children.map(c => ({
      child_id: c.child_id,
      name: `${c.prefix || ""}${c.first_name} ${c.last_name}`,
      nickname: c.nickname,
      status: map[c.child_id]?.status || "แปรงฟันแล้ว",
      note: map[c.child_id]?.note || ""
    }));

    res.json({ rows });

  } catch (err) {
    console.error("BRUSH TODAY ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});


/* ===== HISTORY ===== */
router.get("/history", async (req, res) => {
  try {
    const teacher_id = parseInt(req.query.teacher_id, 10);
    if (!teacher_id)
      return res.status(400).json({ error: "teacher_id required" });

    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    if (!teacher) return res.json({ rows: [] });

    const [rows] = await pool.query(
      `SELECT 
          r.record_date,
          r.status,
          r.note,
          c.prefix,
          c.first_name,
          c.last_name
       FROM toothbrush_records r
       JOIN children c ON c.child_id = r.child_id
       WHERE r.teacher_id = ?
       ORDER BY r.record_date DESC, c.first_name`,
      [teacher_id]
    );

    res.json({ rows });

  } catch (err) {
    console.error("BRUSH HISTORY ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});


/* ===== SAVE ===== */
router.post("/", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items required" });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const it of items) {

      // ⭐ เช็คว่ามี record วันนี้หรือยัง
      const [exist] = await conn.query(
        `SELECT toothbrush_id
         FROM toothbrush_records
         WHERE child_id = ?
           AND teacher_id = ?
           AND record_date = CURDATE()`,
        [it.child_id, it.created_by]
      );

      if (exist.length) {

        // ⭐ UPDATE
        await conn.query(
          `UPDATE toothbrush_records
           SET status = ?, note = ?
           WHERE toothbrush_id = ?`,
          [it.status, it.note || null, exist[0].toothbrush_id]
        );

      } else {

        // ⭐ INSERT
        await conn.query(
          `INSERT INTO toothbrush_records
           (child_id, teacher_id, record_date, status, note, created_at)
           VALUES (?, ?, CURDATE(), ?, ?, NOW())`,
          [it.child_id, it.created_by, it.status, it.note || null]
        );

      }
    }

    await conn.commit();
    res.json({ ok: true });

  } catch (err) {
    await conn.rollback();
    console.error(err);
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
             AND tr.status = 'แปรงฟันแล้ว'
            THEN tr.toothbrush_id
          END
        ) AS male_total,

        COUNT(
          CASE
            WHEN c.prefix = 'เด็กหญิง'
             AND tr.status = 'แปรงฟันแล้ว'
            THEN tr.toothbrush_id
          END
        ) AS female_total

      FROM classrooms cr

      LEFT JOIN student_enrollments se
        ON se.classroom_id = cr.classroom_id
       AND se.status = 'studying'

      LEFT JOIN children c
        ON c.child_id = se.child_id

      LEFT JOIN toothbrush_records tr
        ON tr.child_id = se.child_id
       AND MONTH(tr.record_date) = ?
       AND YEAR(tr.record_date) = ?

      WHERE cr.classroom_name <> 'จบการศึกษา'

      GROUP BY cr.classroom_id, cr.classroom_name
      ORDER BY cr.classroom_id
    `, [month, year]);

    res.json(rows);

  } catch (err) {
    console.error("GET /summary-by-classroom err", err);
    res.status(500).json({ error: "failed to fetch toothbrush summary" });
  }
});

module.exports = router;