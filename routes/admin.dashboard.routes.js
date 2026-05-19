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

    // ✅ แปลง พ.ศ. → ค.ศ.
    const ceYear = Number(year) > 2500 ? Number(year) - 543 : Number(year);

    // ค้นหารายชื่อเด็กก่อน
    const [children] = await pool.query(`
      SELECT 
        c.child_id,
        c.prefix,
        c.first_name,
        c.last_name,
        cl.classroom_name
      FROM children c
      LEFT JOIN classrooms cl ON cl.classroom_id = c.classroom_id
      WHERE 
        c.prefix LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR
        cl.classroom_name LIKE ? OR
        CONCAT(c.prefix, ' ', c.first_name, ' ', c.last_name) LIKE ?
    `, Array(5).fill(`%${q}%`));

    if (children.length === 0) return res.json([]);

    const childIds = children.map(c => c.child_id);
    const placeholders = childIds.map(() => "?").join(",");

    // ✅ ดึงข้อมูลรายวันทุกตาราง
    const [[attendance], [milk], [lunch], [toothbrush], [health], [measurements]] =
      await Promise.all([
        pool.query(`SELECT child_id, DAY(record_date) AS day, status
          FROM attendance_records
          WHERE child_id IN (${placeholders}) AND MONTH(record_date)=? AND YEAR(record_date)=?`,
          [...childIds, month, ceYear]),

        pool.query(`SELECT child_id, DAY(record_date) AS day, status
          FROM milk_records
          WHERE child_id IN (${placeholders}) AND MONTH(record_date)=? AND YEAR(record_date)=?`,
          [...childIds, month, ceYear]),

        pool.query(`SELECT child_id, DAY(record_date) AS day, status
          FROM lunch_records
          WHERE child_id IN (${placeholders}) AND MONTH(record_date)=? AND YEAR(record_date)=?`,
          [...childIds, month, ceYear]),

        pool.query(`SELECT child_id, DAY(record_date) AS day, status
          FROM toothbrush_records
          WHERE child_id IN (${placeholders}) AND MONTH(record_date)=? AND YEAR(record_date)=?`,
          [...childIds, month, ceYear]),

        pool.query(`SELECT child_id, DAY(evaluation_date) AS day, note AS status
          FROM health_evaluations
          WHERE child_id IN (${placeholders}) AND MONTH(evaluation_date)=? AND YEAR(evaluation_date)=?`,
          [...childIds, month, ceYear]),

        pool.query(`SELECT child_id, DAY(measurement_date) AS day, weight, height
          FROM monthly_measurements
          WHERE child_id IN (${placeholders}) AND MONTH(measurement_date)=? AND YEAR(measurement_date)=?`,
          [...childIds, month, ceYear]),
      ]);

    // จัดข้อมูลเป็น Map [child_id][day]
    const toMap = (rows) => rows.reduce((acc, r) => {
      if (!acc[r.child_id]) acc[r.child_id] = {};
      acc[r.child_id][r.day] = r.status;
      return acc;
    }, {});

    const attMap   = toMap(attendance);
    const milkMap  = toMap(milk);
    const lunchMap = toMap(lunch);
    const toothMap = toMap(toothbrush);
    const healthMap = toMap(health);

    const measureMap = measurements.reduce((acc, r) => {
      if (!acc[r.child_id]) acc[r.child_id] = {};
      acc[r.child_id][r.day] = { weight: r.weight, height: r.height };
      return acc;
    }, {});

    // รวมข้อมูลกับรายชื่อเด็ก
    const result = children.map(c => ({
      ...c,
      dailyData: {
        attendance:  attMap[c.child_id]   || {},
        milk:        milkMap[c.child_id]  || {},
        lunch:       lunchMap[c.child_id] || {},
        toothbrush:  toothMap[c.child_id] || {},
        health:      healthMap[c.child_id]|| {},
        measurements: measureMap[c.child_id] || {},
      }
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "search error" });
  }
});

module.exports = router;
