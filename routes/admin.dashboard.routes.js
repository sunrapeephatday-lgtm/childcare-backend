const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* ==================================================
   Dashboard: สรุปผลประเมินพัฒนาการ แยกตามห้อง
   - นับเด็กที่มีผลประเมินแล้ว
   - ใช้ DISTINCT child_id
================================================== */
router.get("/dashboard/development-summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }

    const [rows] = await pool.query(`
      SELECT
        cl.classroom_id,
        cl.name AS classroom_name,
        COUNT(DISTINCT da.assessment_id) AS assessment_count
      FROM classrooms cl
      LEFT JOIN children c ON c.classroom_id = cl.classroom_id
      LEFT JOIN development_assessments da ON da.child_id = c.child_id
      GROUP BY cl.classroom_id, cl.name
      ORDER BY cl.name
    `);

    res.json(rows);
  } catch (err) {
    console.error("development summary error:", err);
    res.status(500).json({ error: "server error" });
  }
});
/* =========================
   สรุปจำนวนเด็ก (รวม / ชาย / หญิง)
========================= */
router.get(
  "/children-count",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("REQ.USER =", req.user);
      console.log("CENTER_ID FROM TOKEN =", req.user.center_id);

      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const centerId = req.user.center_id;

      const [rows] = await pool.query(
        `
        SELECT
          COUNT(c.child_id) AS total,
          SUM(CASE WHEN c.prefix = 'เด็กชาย' THEN 1 ELSE 0 END) AS boys,
          SUM(CASE WHEN c.prefix = 'เด็กหญิง' THEN 1 ELSE 0 END) AS girls
        FROM children c
        JOIN classrooms cl ON cl.classroom_id = c.classroom_id
        WHERE cl.center_id = ?
        `,
        [centerId]
      );

      res.json(rows[0]);
    } catch (err) {
      console.error("children-count error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

// 🔍 SEARCH CHILD
router.get("/search-child", async (req, res) => {
  try {
    const { q, month, year } = req.query;

    // ✅ เพิ่มบรรทัดนี้ — แปลง พ.ศ. → ค.ศ.
    const ceYear = Number(year) > 2500 ? Number(year) - 543 : Number(year);

    const [rows] = await pool.query(`
      SELECT 
        c.child_id,
        c.prefix,
        c.first_name,
        c.last_name,
        cl.name AS classroom_name,  -- ✅ แก้จาก cl.classroom_name

        ar.status AS attendance,
        mr.status AS milk,
        lr.status AS lunch,
        tr.status AS toothbrush,

        he.note AS health_note,
        mm.weight,
        mm.height

      FROM children c
      LEFT JOIN classrooms cl ON cl.classroom_id = c.classroom_id

      LEFT JOIN attendance_records ar 
        ON ar.child_id = c.child_id 
        AND MONTH(ar.record_date) = ?
        AND YEAR(ar.record_date) = ?
        AND ar.record_date = (SELECT MAX(record_date) FROM attendance_records WHERE child_id = c.child_id AND MONTH(record_date) = ? AND YEAR(record_date) = ?)

      LEFT JOIN milk_records mr 
        ON mr.child_id = c.child_id 
        AND MONTH(mr.record_date) = ?
        AND YEAR(mr.record_date) = ?
        AND mr.record_date = (SELECT MAX(record_date) FROM milk_records WHERE child_id = c.child_id AND MONTH(record_date) = ? AND YEAR(record_date) = ?)

      LEFT JOIN lunch_records lr 
        ON lr.child_id = c.child_id 
        AND MONTH(lr.record_date) = ?
        AND YEAR(lr.record_date) = ?
        AND lr.record_date = (SELECT MAX(record_date) FROM lunch_records WHERE child_id = c.child_id AND MONTH(record_date) = ? AND YEAR(record_date) = ?)

      LEFT JOIN toothbrush_records tr 
        ON tr.child_id = c.child_id 
        AND MONTH(tr.record_date) = ?
        AND YEAR(tr.record_date) = ?
        AND tr.record_date = (SELECT MAX(record_date) FROM toothbrush_records WHERE child_id = c.child_id AND MONTH(record_date) = ? AND YEAR(record_date) = ?)

      LEFT JOIN health_evaluations he 
        ON he.child_id = c.child_id 
        AND MONTH(he.evaluation_date) = ?
        AND YEAR(he.evaluation_date) = ?
        AND he.evaluation_date = (SELECT MAX(evaluation_date) FROM health_evaluations WHERE child_id = c.child_id AND MONTH(evaluation_date) = ? AND YEAR(evaluation_date) = ?)

      LEFT JOIN monthly_measurements mm 
        ON mm.child_id = c.child_id 
        AND MONTH(mm.measurement_date) = ?
        AND YEAR(mm.measurement_date) = ?
        AND mm.measurement_date = (SELECT MAX(measurement_date) FROM monthly_measurements WHERE child_id = c.child_id AND MONTH(measurement_date) = ? AND YEAR(measurement_date) = ?)

      WHERE 
        c.prefix LIKE ? OR
        c.first_name LIKE ? OR
        c.last_name LIKE ? OR
        cl.name LIKE ? OR           -- ✅ แก้จาก cl.classroom_name

        CONCAT(c.prefix, c.first_name) LIKE ? OR
        CONCAT(c.prefix, ' ', c.first_name) LIKE ? OR
        CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR
        CONCAT(c.prefix, c.first_name, ' ', c.last_name) LIKE ? OR
        CONCAT(c.prefix, ' ', c.first_name, ' ', c.last_name) LIKE ?
    `, [
      month, ceYear, month, ceYear,  // ✅ ใช้ ceYear แทน year
      month, ceYear, month, ceYear,
      month, ceYear, month, ceYear,
      month, ceYear, month, ceYear,
      month, ceYear, month, ceYear,
      month, ceYear, month, ceYear,
      `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`,
      `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`,
    ]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "search error" });
  }
});

module.exports = router;
