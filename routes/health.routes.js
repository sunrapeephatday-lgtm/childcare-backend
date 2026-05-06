const express = require("express");
const router = express.Router();
const pool = require("../db");
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

/* ===== TODAY ===== */
router.get("/today", async (req, res) => {
  const teacher_id = parseInt(req.query.teacher_id, 10);
  if (!teacher_id) return res.status(400).json({ error: "teacher_id required" });

  const [t] = await pool.query(
    "SELECT classroom_id FROM teachers WHERE teacher_id = ?",
    [teacher_id]
  );
  if (!t.length) return res.json({ rows: [] });

  const classroom_id = t[0].classroom_id;

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

  const ids = children.map((c) => c.child_id);
  if (!ids.length) return res.json({ rows: [] });

  const [evals] = await pool.query(
    `SELECT h.*
     FROM health_evaluations h
     JOIN (
       SELECT child_id, MAX(created_at) max_created
       FROM health_evaluations
       WHERE child_id IN (?)
       GROUP BY child_id
     ) t ON h.child_id = t.child_id AND h.created_at = t.max_created`,
    [ids]
  );

  const map = {};
  evals.forEach((e) => (map[e.child_id] = e));

  const rows = children.map((c) => ({
  child_id: c.child_id,
  name: `${c.prefix}${c.first_name} ${c.last_name}`,
  nickname: c.nickname,
  evaluation: map[c.child_id]
    ? {
        hair_condition: map[c.child_id].hair_condition,
        oral_cavity: map[c.child_id].oral_cavity,
        fingernail: map[c.child_id].fingernail,
        toenail: map[c.child_id].toenail,
        note: map[c.child_id].note,
      }
    : null,
}));

  res.json({ rows });
});

/* ===== HISTORY ===== */
router.get("/history", async (req, res) => {
  const teacher_id = parseInt(req.query.teacher_id, 10);
  if (!teacher_id) return res.status(400).json({ error: "teacher_id required" });

  const [t] = await pool.query(
    "SELECT classroom_id FROM teachers WHERE teacher_id = ?",
    [teacher_id]
  );
  if (!t.length) return res.json({ rows: [] });

  const classroom_id = t[0].classroom_id;

  const [rows] = await pool.query(
  `SELECT
    h.evaluation_date,
    c.prefix,
    c.first_name,
    c.last_name,
    h.hair_condition,
    h.oral_cavity,
    h.fingernail,
    h.toenail,
    h.note
   FROM health_evaluations h
   JOIN children c ON h.child_id = c.child_id
   WHERE c.classroom_id = ?
   ORDER BY h.evaluation_date DESC, c.child_id`,
  [classroom_id]
);

  res.json({ rows });
});

/* ===== SAVE ===== */
router.post("/", async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items required" });

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    let saved = 0;
    for (const it of items) {
      if (!it.child_id || !it.created_by) continue;

      const [exists] = await conn.query(
  `SELECT health_id
   FROM health_evaluations
   WHERE child_id = ?
     AND evaluation_date = CURDATE()
   LIMIT 1`,
  [it.child_id]
);

if (exists.length) {
  await conn.query(
    `UPDATE health_evaluations
     SET
       teacher_id = ?,
       hair_condition = ?,
       oral_cavity = ?,
       fingernail = ?,
       toenail = ?,
       note = ?
     WHERE health_id = ?`,
    [
      it.created_by,
      it.hair_condition,
      it.oral_cavity,
      it.fingernail,
      it.toenail,
      it.note || null,
      exists[0].health_id,
    ]
  );
} else {
  await conn.query(
    `INSERT INTO health_evaluations
     (
       child_id,
       teacher_id,
       evaluation_date,
       hair_condition,
       oral_cavity,
       fingernail,
       toenail,
       note,
       created_at
     )
     VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, NOW())`,
    [
      it.child_id,
      it.created_by,
      it.hair_condition,
      it.oral_cavity,
      it.fingernail,
      it.toenail,
      it.note || null,
    ]
  );
}
      saved++;
    }

    await conn.commit();
    res.json({ ok: true, saved });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "failed save" });
  } finally {
    conn.release();
  }
});

router.get("/summary-by-classroom", async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const [rows] = await pool.query(
      `
      SELECT
        cl.classroom_name,

        SUM(
          CASE
            WHEN (
              he.hair_condition = 'ดี' AND
              he.oral_cavity = 'ดี' AND
              he.fingernail = 'ดี' AND
              he.toenail = 'ดี'
            )
            THEN 1 ELSE 0
          END
        ) AS good_total,

        SUM(
          CASE
            WHEN (
              he.hair_condition = 'ปานกลาง' OR
              he.oral_cavity = 'ปานกลาง' OR
              he.fingernail = 'ปานกลาง' OR
              he.toenail = 'ปานกลาง'
            )
            THEN 1 ELSE 0
          END
        ) AS medium_total,

        SUM(
          CASE
            WHEN (
              he.hair_condition = 'ปรับปรุง' OR
              he.oral_cavity = 'ปรับปรุง' OR
              he.fingernail = 'ปรับปรุง' OR
              he.toenail = 'ปรับปรุง'
            )
            THEN 1 ELSE 0
          END
        ) AS improve_total

      FROM health_evaluations he

      JOIN children c
        ON c.child_id = he.child_id

      JOIN student_enrollments se
        ON se.child_id = c.child_id
        AND se.status = 'studying'

      JOIN classrooms cl
        ON cl.classroom_id = se.classroom_id

      WHERE MONTH(he.evaluation_date) = ?
        AND YEAR(he.evaluation_date) = ?

      GROUP BY cl.classroom_id, cl.classroom_name
      ORDER BY cl.classroom_id
      `,
      [month, year]
    );

    res.json(rows);
  } catch (err) {
    console.error("health summary-by-classroom error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
