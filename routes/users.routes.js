// backend/routes/users.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ดึงรูปโปรไฟล์ user
router.get("/:id/avatar", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [[row]] = await pool.query(
      `
      SELECT image_url 
      FROM images 
      WHERE ref_type = 'user' 
      AND ref_id = ?
      ORDER BY image_id DESC
      LIMIT 1
      `,
      [id]
    );

    if (!row) return res.json({});
    res.json(row);
  } catch (err) {
    console.error("get avatar error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/summary/roles", async (req, res) => {
  try {

    const [rows] = await pool.query(`
      SELECT role, COUNT(*) AS total
      FROM users
      GROUP BY role
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
