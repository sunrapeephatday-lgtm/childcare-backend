const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/*
================================================
 GET : /api/children/my
 ผู้ปกครองดูข้อมูลบุตรของตัวเอง
================================================
*/
router.get("/my", authMiddleware, async (req, res) => {
  try {

    // ✔ อนุญาตเฉพาะ parent
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "forbidden" });
    }

    const userId = req.user.user_id;

    // ⭐ แก้ตรงนี้ (หา parent_id จาก table parents)
    const [[parentRow]] = await pool.query(
      `SELECT parent_id 
       FROM parents 
       WHERE user_id = ?`,
      [userId]
    );

    if (!parentRow) {
      return res.json([]);
    }

    const parentId = parentRow.parent_id;

    /*
    ========================================================
      ดึงเด็ก + ผู้ปกครองทั้งหมดของเด็ก + ครู + ที่อยู่
    ========================================================
    */
    const [rows] = await pool.query(
  `
  SELECT DISTINCT
      c.child_id,
      c.prefix,
      c.first_name,
      c.last_name,
      c.nickname,
      c.birth_date,
      c.citizen_id,
      c.ethnicity,
      c.nationality,
      c.religion,
      c.classroom_id,
      c.note,
      (
          SELECT GROUP_CONCAT(
              CONCAT(
                  r2.relationship, ': ',
                  p2.prefix, p2.first_name, ' ', p2.last_name,
                  ' (', IFNULL(p2.phone,'-'), ')'
              )
              SEPARATOR '||'
          )
          FROM relation r2
          JOIN parents p2 ON p2.parent_id = r2.parent_id
          WHERE r2.child_id = c.child_id
      ) AS parents_info,

      a.house_no,
      a.village,
      a.subdistrict,
      a.district,
      a.province,

      t.prefix     AS teacher_prefix,
      t.first_name AS teacher_firstname,
      t.last_name  AS teacher_lastname,
      t.phone      AS teacher_phone,

      (
        SELECT COUNT(*)
        FROM attendance_records ar
        WHERE ar.child_id = c.child_id
          AND ar.status = 'มา'
      ) AS attendance_score,

      (
        SELECT COUNT(*)
        FROM milk_records mr
        WHERE mr.child_id = c.child_id
          AND mr.status = 'ดื่ม'
      ) AS milk_score,

      (
        SELECT COUNT(*)
        FROM toothbrush_records tr
        WHERE tr.child_id = c.child_id
          AND tr.status = 'แปรงฟันแล้ว'
      ) AS toothbrush_score,

      (
        SELECT COUNT(*)
        FROM lunch_records lr
        WHERE lr.child_id = c.child_id
          AND lr.status = 'รับประทาน'
      ) AS lunch_score,

      (
        SELECT mm.weight
        FROM monthly_measurements mm
        WHERE mm.child_id = c.child_id
        ORDER BY mm.measurement_date DESC, mm.measurement_id DESC
        LIMIT 1
      ) AS latest_weight,

      (
        SELECT mm.height
        FROM monthly_measurements mm
        WHERE mm.child_id = c.child_id
        ORDER BY mm.measurement_date DESC, mm.measurement_id DESC
        LIMIT 1
      ) AS latest_height,

      (
        SELECT he.note
        FROM health_evaluations he
        WHERE he.child_id = c.child_id
        ORDER BY he.evaluation_date DESC, he.health_id DESC
        LIMIT 1
      ) AS latest_health_note,

(
  SELECT he.hair_condition
  FROM health_evaluations he
  WHERE he.child_id = c.child_id
  ORDER BY he.evaluation_date DESC, he.health_id DESC
  LIMIT 1
) AS latest_hair_condition,

(
  SELECT he.oral_cavity
  FROM health_evaluations he
  WHERE he.child_id = c.child_id
  ORDER BY he.evaluation_date DESC, he.health_id DESC
  LIMIT 1
) AS latest_oral_cavity,

(
  SELECT he.fingernail
  FROM health_evaluations he
  WHERE he.child_id = c.child_id
  ORDER BY he.evaluation_date DESC, he.health_id DESC
  LIMIT 1
) AS latest_fingernail,

(
  SELECT he.toenail
  FROM health_evaluations he
  WHERE he.child_id = c.child_id
  ORDER BY he.evaluation_date DESC, he.health_id DESC
  LIMIT 1
) AS latest_toenail

  FROM children c

  JOIN relation r
    ON r.child_id = c.child_id
   AND r.parent_id = ?

  LEFT JOIN addresses a
    ON a.child_id = c.child_id
   AND a.address_type = 'ที่อยู่ปัจจุบัน'

  LEFT JOIN teachers t
    ON t.classroom_id = c.classroom_id
  `,
  [parentId]
);

    res.json(rows);

  } catch (err) {
    console.error("children/my error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;