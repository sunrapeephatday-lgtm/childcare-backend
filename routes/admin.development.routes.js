// backend/routes/development.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* =============================
   GET: รายการผลประเมิน (Admin)
   GET /api/admin/development
============================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }

    const [rows] = await pool.query(`
      SELECT
        a.assessment_id,
        a.assessment_date,
        a.total_score,
        a.result_level,
        c.prefix,
        c.first_name,
        c.last_name
      FROM development_assessments a
      JOIN children c ON c.child_id = a.child_id
      ORDER BY a.assessment_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("admin development list error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* ======================================
   GET: รายละเอียดผลประเมิน (รายข้อ)
   GET /api/admin/development/:id
====================================== */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }

    const assessmentId = req.params.id;

    const [[assessment]] = await pool.query(
      `SELECT * FROM development_assessments WHERE assessment_id = ?`,
      [assessmentId]
    );

    if (!assessment) {
      return res.status(404).json({ error: "not found" });
    }

    const [results] = await pool.query(
      `
      SELECT
        di.item_no,
        di.description,
        dr.level_id
      FROM development_results dr
      JOIN development_items di ON di.item_id = dr.item_id
      WHERE dr.assessment_id = ?
      ORDER BY di.item_no
      `,
      [assessmentId]
    );

    res.json({ assessment, results });
  } catch (err) {
    console.error("admin development detail error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
