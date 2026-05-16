const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const { authMiddleware } = require("../middlewares/auth");
/**
 * GET /api/checkins/today?teacher_id=#
 */
router.get('/today', async (req, res) => {
  const teacher_id = parseInt(req.query.teacher_id, 10);
  if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });

  try {
    const [trows] = await pool.query(
      'SELECT classroom_id FROM teachers WHERE teacher_id = ?',
      [teacher_id]
    );
    if (!trows.length) return res.status(404).json({ error: 'teacher not found' });

    const classroom_id = trows[0].classroom_id;

    const [children] = await pool.query(
  `SELECT c.child_id, c.prefix, c.first_name, c.last_name, c.nickname
   FROM student_enrollments se
   JOIN children c ON c.child_id = se.child_id
   WHERE se.classroom_id = ?
     AND se.status = 'studying'`,
  [classroom_id]
);

    if (!children.length) {
      return res.json({
        date: new Date().toISOString().slice(0,10),
        classroom_id,
        rows: []
      });
    }

    const ids = children.map(c => c.child_id);
    const placeholders = ids.map(() => '?').join(',');

    const [checks] = await pool.query(
      `SELECT attendance_id, child_id, status, note
       FROM attendance_records
       WHERE record_date = CURDATE()
         AND child_id IN (${placeholders})
         AND teacher_id = ?`,
      [...ids, teacher_id]
    );

    const map = {};
    for (const ch of checks) map[ch.child_id] = ch;

    const rows = children.map(c => ({
      child_id: c.child_id,
      name: `${c.prefix || ''}${c.first_name} ${c.last_name}`,
      nickname: c.nickname,
      status: map[c.child_id]?.status || 'มา',
      note: map[c.child_id]?.note || "",
      attendance_id: map[c.child_id]?.attendance_id || null
    }));

    res.json({
      date: new Date().toISOString().slice(0,10),
      classroom_id,
      rows
    });
  } catch (err) {
    console.error('GET /api/checkins/today err', err);
    res.status(500).json({ error: 'failed to fetch todays attendance' });
  }
});

/**
 * POST /api/checkins
 */
router.post('/', async (req, res) => {
  const { child_id, status = 'ขาด', note = null, teacher_id } = req.body;
  if (!child_id || !teacher_id)
    return res.status(400).json({ error: 'child_id & teacher_id required' });

  try {
    const [existing] = await pool.query(
      `SELECT attendance_id FROM attendance_records
       WHERE child_id = ? AND teacher_id = ? AND record_date = CURDATE() LIMIT 1`,
      [child_id, teacher_id]
    );

    if (existing.length) {
      const id = existing[0].attendance_id;
      await pool.query(
        `UPDATE attendance_records
         SET status=?, note=?, created_at=CURRENT_TIMESTAMP
         WHERE attendance_id=?`,
        [status, note, id]
      );
      return res.json({ ok: true, action: 'updated', attendance_id: id });
    } else {
      const [ins] = await pool.query(
        `INSERT INTO attendance_records
         (child_id, teacher_id, record_date, status, note, created_at)
         VALUES (?, ?, CURDATE(), ?, ?, CURRENT_TIMESTAMP)`,
        [child_id, teacher_id, status, note]
      );
      return res.json({ ok: true, action: 'inserted', attendance_id: ins.insertId });
    }
  } catch (err) {
    console.error('POST /api/checkins err', err);
    res.status(500).json({ error: 'failed to save attendance' });
  }
});

/**
 * GET /api/checkins/history?teacher_id=#
 */
router.get("/history", async (req, res) => {
  try {
    const teacher_id = parseInt(req.query.teacher_id, 10);
    if (!teacher_id) {
      return res.status(400).json({ error: "teacher_id required" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        ar.record_date,
        ch.prefix,
        ch.first_name,
        ch.last_name,
        ch.nickname,
        ar.status,
        ar.note
      FROM attendance_records ar
      JOIN children ch ON ch.child_id = ar.child_id
      WHERE ar.teacher_id = ?
      ORDER BY ar.record_date DESC, ch.first_name
      `,
      [teacher_id]
    );

    res.json({ rows });
  } catch (err) {
    console.error("GET /api/checkins/history err", err);
    res.status(500).json({ error: "failed to fetch history" });
  }
});
/**
 * GET /api/checkins/monthly?teacher_id=&year=&month=
 */
router.get("/monthly", async (req, res) => {
  try {
    const { teacher_id, year, month } = req.query;

    if (!teacher_id || !year || !month) {
      return res.status(400).json({ error: "teacher_id, year, month required" });
    }

    const [rows] = await pool.query(`
      SELECT
        ar.child_id,
        ar.record_date,
        ar.status,
        ch.prefix,
        ch.first_name,
        ch.last_name
      FROM attendance_records ar
      JOIN children ch ON ch.child_id = ar.child_id
      WHERE ar.teacher_id = ?
        AND YEAR(ar.record_date) = ?
        AND MONTH(ar.record_date) = ?
      ORDER BY ch.first_name, ar.record_date
    `, [teacher_id, year, month]);

    res.json({ rows });
  } catch (err) {
    console.error("GET /api/checkins/monthly err", err);
    res.status(500).json({ error: "failed to fetch monthly attendance" });
  }
});

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

router.get("/attendance-by-classroom", async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const [rows] = await pool.query(`
  SELECT 
    cr.classroom_name,
COUNT(
  CASE
    WHEN c.prefix = 'เด็กชาย'
     AND ar.status = 'มา'
    THEN ar.attendance_id
  END
) AS male_attendance,

COUNT(
  CASE
    WHEN c.prefix = 'เด็กหญิง'
     AND ar.status = 'มา'
    THEN ar.attendance_id
  END
) AS female_attendance

  FROM classrooms cr

  LEFT JOIN student_enrollments se
    ON se.classroom_id = cr.classroom_id
   AND se.status = 'studying'

  LEFT JOIN children c
    ON c.child_id = se.child_id

  LEFT JOIN attendance_records ar
    ON ar.child_id = se.child_id
   AND MONTH(ar.record_date) = ?
   AND YEAR(ar.record_date) = ?

  WHERE cr.classroom_name <> 'จบการศึกษา'

  GROUP BY cr.classroom_id, cr.classroom_name
  ORDER BY cr.classroom_id
`, [month, year]);

    res.json(rows);
  } catch (err) {
    console.error("GET /attendance-by-classroom err", err);
    res.status(500).json({ error: "failed to fetch attendance summary" });
  }
});

module.exports = router;
