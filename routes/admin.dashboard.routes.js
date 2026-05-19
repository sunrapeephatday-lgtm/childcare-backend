const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* ==================================================
   Dashboard: สรุปผลประเมินพัฒนาการ
================================================== */
router.get(
  "/dashboard/development-summary",
  authMiddleware,
  async (req, res) => {
    try {

      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "forbidden"
        });
      }

      const [rows] = await pool.query(`
        SELECT
          cl.classroom_id,
          cl.classroom_name,
          COUNT(DISTINCT da.assessment_id) AS assessment_count

        FROM classrooms cl

        LEFT JOIN children c
          ON c.classroom_id = cl.classroom_id

        LEFT JOIN development_assessments da
          ON da.child_id = c.child_id

        GROUP BY
          cl.classroom_id,
          cl.classroom_name

        ORDER BY cl.classroom_name
      `);

      res.json(rows);

    } catch (err) {

      console.error(
        "development summary error:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* ==================================================
   สรุปจำนวนเด็ก
================================================== */
router.get(
  "/children-count",
  authMiddleware,
  async (req, res) => {
    try {

      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "forbidden"
        });
      }

      const centerId = req.user.center_id;

      const [rows] = await pool.query(`
        SELECT

          COUNT(c.child_id) AS total,

          SUM(
            CASE
              WHEN c.prefix = 'เด็กชาย'
              THEN 1
              ELSE 0
            END
          ) AS boys,

          SUM(
            CASE
              WHEN c.prefix = 'เด็กหญิง'
              THEN 1
              ELSE 0
            END
          ) AS girls

        FROM children c

        JOIN classrooms cl
          ON cl.classroom_id = c.classroom_id

        WHERE cl.center_id = ?
      `, [centerId]);

      res.json(rows[0]);

    } catch (err) {

      console.error(
        "children-count error:",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* ==================================================
   🔍 SEARCH CHILD
================================================== */
router.get(
  "/search-child",
  authMiddleware,
  async (req, res) => {
    try {

      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "forbidden"
        });
      }

      const { q = "" } = req.query;

      const keyword = q.trim();

      const [rows] = await pool.query(`
        SELECT

          c.child_id,
          c.prefix,
          c.first_name,
          c.last_name,

          cl.classroom_name

        FROM children c

        LEFT JOIN classrooms cl
          ON cl.classroom_id = c.classroom_id

        WHERE

          c.prefix LIKE ? OR
          c.first_name LIKE ? OR
          c.last_name LIKE ? OR

          cl.classroom_name LIKE ? OR

          CONCAT(
            c.first_name,
            ' ',
            c.last_name
          ) LIKE ? OR

          CONCAT(
            c.prefix,
            c.first_name
          ) LIKE ? OR

          CONCAT(
            c.prefix,
            ' ',
            c.first_name
          ) LIKE ? OR

          CONCAT(
            c.prefix,
            c.first_name,
            ' ',
            c.last_name
          ) LIKE ? OR

          CONCAT(
            c.prefix,
            ' ',
            c.first_name,
            ' ',
            c.last_name
          ) LIKE ?

        ORDER BY
          c.first_name ASC
      `, [
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
      ]);

      res.json(rows);

    } catch (err) {

      console.error(
        "SEARCH ERROR =",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* ==================================================
   📋 CHILD MONTH DETAIL
================================================== */
router.get(
  "/child-month-detail/:childId",
  authMiddleware,
  async (req, res) => {
    try {

      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "forbidden"
        });
      }

      const { childId } = req.params;

      const { month, year } = req.query;

      /* attendance */

      const [attendance] = await pool.query(`
        SELECT
          record_date,
          status

        FROM attendance_records

        WHERE child_id = ?
        AND MONTH(record_date) = ?
        AND YEAR(record_date) = ?

        ORDER BY record_date DESC
      `, [
        childId,
        month,
        year
      ]);

      /* milk */

      let milk = [];

      try {

        const [rows] = await pool.query(`
          SELECT
            record_date,
            status

          FROM milk_records

          WHERE child_id = ?
          AND MONTH(record_date) = ?
          AND YEAR(record_date) = ?

          ORDER BY record_date DESC
        `, [
          childId,
          month,
          year
        ]);

        milk = rows;

      } catch (err) {
        console.log("milk_records not found");
      }

      /* lunch */

      let lunch = [];

      try {

        const [rows] = await pool.query(`
          SELECT
            record_date,
            status

          FROM lunch_records

          WHERE child_id = ?
          AND MONTH(record_date) = ?
          AND YEAR(record_date) = ?

          ORDER BY record_date DESC
        `, [
          childId,
          month,
          year
        ]);

        lunch = rows;

      } catch (err) {
        console.log("lunch_records not found");
      }

      /* toothbrush */

      let toothbrush = [];

      try {

        const [rows] = await pool.query(`
          SELECT
            record_date,
            status

          FROM toothbrush_records

          WHERE child_id = ?
          AND MONTH(record_date) = ?
          AND YEAR(record_date) = ?

          ORDER BY record_date DESC
        `, [
          childId,
          month,
          year
        ]);

        toothbrush = rows;

      } catch (err) {
        console.log("toothbrush_records not found");
      }

      /* health */

      let health = [];

      try {

        const [rows] = await pool.query(`
          SELECT
            evaluation_date,
            note

          FROM health_evaluations

          WHERE child_id = ?
          AND MONTH(evaluation_date) = ?
          AND YEAR(evaluation_date) = ?

          ORDER BY evaluation_date DESC
        `, [
          childId,
          month,
          year
        ]);

        health = rows;

      } catch (err) {
        console.log("health_evaluations not found");
      }

      /* measurements */

      let measurements = [];

      try {

        const [rows] = await pool.query(`
          SELECT
            measurement_date,
            weight,
            height

          FROM monthly_measurements

          WHERE child_id = ?
          AND MONTH(measurement_date) = ?
          AND YEAR(measurement_date) = ?

          ORDER BY measurement_date DESC
        `, [
          childId,
          month,
          year
        ]);

        measurements = rows;

      } catch (err) {
        console.log(
          "monthly_measurements not found"
        );
      }

      res.json({
        attendance,
        milk,
        lunch,
        toothbrush,
        health,
        measurements
      });

    } catch (err) {

      console.error(
        "DETAIL ERROR =",
        err
      );

      res.status(500).json({
        error: err.message
      });
    }
  }
);

module.exports = router;