const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

router.get(
  "/dashboard/development-summary",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const [rows] = await pool.query(`
        SELECT
          cl.classroom_id,
          cl.classroom_name,
          COUNT(DISTINCT c.child_id) AS children_count,
          COALESCE(SUM(a.total_good), 0) AS total_good_sum,
          COALESCE(AVG(a.total_good), 0) AS avg_good,
          CASE
            WHEN AVG(a.total_good) >= 15 THEN 'สมวัย'
            WHEN AVG(a.total_good) >= 10 THEN 'ควรส่งเสริมเพิ่มเติม'
            ELSE 'ควรปรึกษาครู'
          END AS result_level
        FROM classrooms cl
        LEFT JOIN children c ON c.classroom_id = cl.classroom_id
        LEFT JOIN development_assessments a ON a.child_id = c.child_id
        GROUP BY cl.classroom_id, cl.classroom_name
        ORDER BY cl.classroom_id
      `);

      res.json(rows);
    } catch (err) {
      console.error("dashboard development-summary error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

module.exports = router;
