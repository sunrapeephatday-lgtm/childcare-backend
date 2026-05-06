const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const { authMiddleware } = require("../middlewares/auth");

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
/**
 * ✅ GET เด็กในห้อง + น้ำหนักส่วนสูงเดือนปัจจุบัน
 * /api/measurements/today?teacher_id=#
 */
router.get('/today', async (req, res) => {
  const teacher_id = parseInt(req.query.teacher_id, 10);

  const selectedMonth = parseInt(req.query.month, 10);
  const selectedYear = parseInt(req.query.year, 10);

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id required' });
  }

  try {
    const [trows] = await pool.query(
      'SELECT classroom_id FROM teachers WHERE teacher_id = ?',
      [teacher_id]
    );

    if (!trows.length) {
      return res.status(404).json({ error: 'teacher not found' });
    }

    const classroom_id = trows[0].classroom_id;

    const [children] = await pool.query(
      `
      SELECT
        c.child_id,
        c.prefix,
        c.first_name,
        c.last_name,
        c.nickname
      FROM student_enrollments se
      JOIN children c ON c.child_id = se.child_id
      WHERE se.classroom_id = ?
      AND se.status = 'studying'
      `,
      [classroom_id]
    );

    const now = new Date();

    const year = selectedYear || now.getFullYear();
    const month = selectedMonth || (now.getMonth() + 1);

    let measurements = [];

    if (children.length) {
      const ids = children.map(c => c.child_id);
      const placeholders = ids.map(() => '?').join(',');

     const [rows] = await pool.query(
  `
  SELECT
    m.*,
    DATE_FORMAT(m.measurement_date,'%Y-%m-%d') AS measurement_date_str
  FROM monthly_measurements m
  INNER JOIN (
    SELECT
      child_id,
      MAX(measurement_date) AS latest_date
    FROM monthly_measurements
    WHERE child_id IN (${placeholders})
    GROUP BY child_id
  ) latest
    ON latest.child_id = m.child_id
   AND latest.latest_date = m.measurement_date
  `,
  [...ids]
);

      measurements = rows;
    }

    const map = {};
    for (const m of measurements) {
      map[m.child_id] = {
        measurement_id: m.measurement_id,
        measurement_date: m.measurement_date_str,
        weight: m.weight,
        height: m.height,
        note: m.note
      };
    }

    const rowsOut = children.map(c => ({
      child_id: c.child_id,
      name: `${c.prefix || ''}${c.first_name} ${c.last_name}`,
      nickname: c.nickname,
      measurement: map[c.child_id] || null
    }));

    res.json({
      classroom_id,
      year,
      month,
      rows: rowsOut
    });

  } catch (err) {
    console.error('GET measurements today error', err);
    res.status(500).json({ error: 'failed to fetch measurements' });
  }
});


/**
 * ✅ POST บันทึกน้ำหนักส่วนสูง
 */
router.post('/', async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items))
    return res.status(400).json({ error: 'items array required' });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    let saved = 0;

    for (const it of items) {
      const child_id = it.child_id;
      const teacher_id = it.teacher_id;
      const measurement_date =
        it.measurement_date || new Date().toISOString().slice(0, 10);

      const weight = it.weight || null;
      const height = it.height || null;
      const note = it.note || null;

      if (!child_id || !teacher_id) continue;
      if (!weight && !height) continue;

      const [exist] = await conn.query(
  `
  SELECT measurement_id
  FROM monthly_measurements
  WHERE child_id = ?
    AND YEAR(measurement_date) = YEAR(?)
    AND MONTH(measurement_date) = MONTH(?)
  LIMIT 1
  `,
  [child_id, measurement_date, measurement_date]
);

if (exist.length) {
  await conn.query(
    `
    UPDATE monthly_measurements
    SET
      teacher_id = ?,
      measurement_date = ?,
      weight = ?,
      height = ?,
      note = ?
    WHERE measurement_id = ?
    `,
    [
      teacher_id,
      measurement_date,
      weight,
      height,
      note,
      exist[0].measurement_id
    ]
  );
} else {
  await conn.query(
    `
    INSERT INTO monthly_measurements
    (child_id, teacher_id, measurement_date, weight, height, note)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [child_id, teacher_id, measurement_date, weight, height, note]
  );
}

      saved++;
    }

    await conn.commit();
    res.json({ ok: true, saved });

  } catch (err) {
    await conn.rollback();
    console.error('POST measurements error', err);
    res.status(500).json({ error: 'failed to save measurements' });
  } finally {
    conn.release();
  }
});


/**
 * ✅ history
 */
router.get('/history', async (req, res) => {
  const teacher_id = parseInt(req.query.teacher_id, 10);
  if (!teacher_id)
    return res.status(400).json({ error: 'teacher_id required' });

  try {
    const [trows] = await pool.query(
      'SELECT classroom_id FROM teachers WHERE teacher_id = ?',
      [teacher_id]
    );

    if (!trows.length)
      return res.status(404).json({ error: 'teacher not found' });

    const classroom_id = trows[0].classroom_id;

    const [rows] = await pool.query(
      `
      SELECT
        m.measurement_date,
        m.weight,
        m.height,
        m.note,
        c.prefix,
        c.first_name,
        c.last_name
      FROM monthly_measurements m
      JOIN children c ON c.child_id = m.child_id
      JOIN student_enrollments se ON se.child_id = c.child_id
      WHERE se.classroom_id = ?
      AND se.status = 'studying'
      ORDER BY m.measurement_date DESC
      `,
      [classroom_id]
    );

    res.json({ rows });

  } catch (err) {
    console.error('GET measurement history error', err);
    res.status(500).json({ error: 'failed to fetch history' });
  }
});

module.exports = router;