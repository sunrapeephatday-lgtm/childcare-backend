// routes/classrooms.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

/// GET ห้องทั้งหมด (JOIN ชื่อศูนย์)
router.get("/", async (req, res) => {
  try {

    const { center_id } = req.query;

    let sql = `
      SELECT
        r.classroom_id,
        r.classroom_name,
        r.center_id,
        c.name AS center_name
      FROM classrooms r
      LEFT JOIN centers c
        ON r.center_id = c.center_id
    `;

    const params = [];

    if (center_id) {
      sql += " WHERE r.center_id = ?";
      params.push(center_id);
    }

    sql += " ORDER BY r.classroom_id DESC";

    const [rows] = await pool.query(sql, params);

    res.json({ rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/center/:centerId", async (req, res) => {
  try {
    const centerId = req.params.centerId;

    const [rows] = await pool.query(
      `SELECT classroom_id, classroom_name
       FROM classrooms
       WHERE center_id = ?
       ORDER BY classroom_name`,
      [centerId]
    );

    res.json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST เพิ่มห้อง
router.post("/", async (req, res) => {
  try {
    const { center_id, classroom_name } = req.body;

    await pool.query(
      `INSERT INTO classrooms (center_id, classroom_name, created_at)
       VALUES (?, ?, NOW())`,
      [center_id, classroom_name]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT แก้ห้อง
router.put("/:id", async (req, res) => {
  try {
    const { center_id, classroom_name } = req.body;

    await pool.query(
      `UPDATE classrooms
       SET center_id = ?, classroom_name = ?
       WHERE classroom_id = ?`,
      [center_id, classroom_name, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE ลบห้อง
router.delete("/:id", async (req, res) => {
  await pool.query(
    "DELETE FROM classrooms WHERE classroom_id=?",
    [req.params.id]
  );
  res.json({ ok: true });
});

module.exports = router;
