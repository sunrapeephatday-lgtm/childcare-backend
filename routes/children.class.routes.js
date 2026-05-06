const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/*
GET /api/children/class/full
ดึงข้อมูลเด็กที่กำลังเรียนในห้องครู + ที่อยู่
*/
router.get("/myclass", authMiddleware, async (req,res)=>{
  try {

    const teacher_id = req.user.teacher_id;

    const [[teacher]] = await pool.query(
      "SELECT classroom_id FROM teachers WHERE teacher_id=?",
      [teacher_id]
    );

    if (!teacher) return res.json({ rows: [] });

    const classroom_id = teacher.classroom_id;

   const [rows] = await pool.query(`
  SELECT
    c.*,
    c.note,
    se.academic_year,
    cr.classroom_name,

    a.house_no,
    a.village,
    a.subdistrict,
    a.district,
    a.province,
    a.postal_code

  FROM student_enrollments se
  JOIN children c 
    ON c.child_id = se.child_id

  JOIN classrooms cr
    ON cr.classroom_id = se.classroom_id

  LEFT JOIN addresses a 
    ON a.child_id = c.child_id
   AND a.address_type = 'ที่อยู่ปัจจุบัน'

  WHERE se.classroom_id = ?
    AND se.status = 'studying'

  ORDER BY c.first_name
`, [classroom_id]);

    res.json({
      total: rows.length,
      rows,
      classroom_name: rows[0]?.classroom_name || ""
    });

  } catch (err) {
    console.error("children myclass error:", err);
    res.status(500).json({ error:"server error" });
  }
});

router.put("/:childId/note", authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const { note } = req.body;

    await pool.query(
      `
      UPDATE children
      SET note = ?
      WHERE child_id = ?
      `,
      [note, childId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("update child note error:", err);
    res.status(500).json({ error: "server error" });
  }
});


module.exports = router;