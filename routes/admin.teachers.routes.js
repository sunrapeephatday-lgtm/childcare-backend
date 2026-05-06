const express = require("express");
const router = express.Router();
const db = require("../db"); // path ตามที่คุณใช้จริง

// =======================
// เพิ่มข้อมูลครู
// =======================
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      center_id,
      classroom_id,
      prefix,
      first_name,
      last_name,
      phone,
      email,
    } = req.body;

    await db.query(
      `INSERT INTO teachers
       (user_id, center_id, classroom_id, prefix,
        first_name, last_name, phone, email, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id,
        center_id,
        classroom_id,
        prefix,
        first_name,
        last_name,
        phone,
        email,
      ]
    );

    res.json({ message: "เพิ่มข้อมูลครูแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เพิ่มข้อมูลครูล้มเหลว" });
  }
});

// =======================
// ดึงข้อมูลครูทั้งหมด (JOIN ครบ)
// =======================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.teacher_id,
        t.user_id,
        t.prefix,
        t.first_name,
        t.last_name,
        t.phone,
        u.username,
        c.name AS center_name,
        r.classroom_name,
        t.created_at
      FROM teachers t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN centers c ON t.center_id = c.center_id
      LEFT JOIN classrooms r ON t.classroom_id = r.classroom_id
      ORDER BY t.teacher_id DESC
    `);

    res.json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดข้อมูลครูล้มเหลว" });
  }
});

// =======================
// ดึงข้อมูลครูรายคน
// =======================
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        t.*,
        u.username,
        c.name AS center_name,
        r.classroom_name
      FROM teachers t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN centers c ON t.center_id = c.center_id
      LEFT JOIN classrooms r ON t.classroom_id = r.classroom_id
      WHERE t.teacher_id = ?
      `,
      [req.params.id]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดข้อมูลครูล้มเหลว" });
  }
});
// =======================
// แก้ไขข้อมูลครู
// =======================
router.put("/:id", async (req, res) => {
  try {
    const {
      center_id,
      classroom_id,
      prefix,
      first_name,
      last_name,
      phone
    } = req.body;

    await db.query(
      `UPDATE teachers SET
        center_id = ?,
        classroom_id = ?,
        prefix = ?,
        first_name = ?,
        last_name = ?,
        phone = ?
       WHERE teacher_id = ?`,
      [
        center_id,
        classroom_id,
        prefix,
        first_name,
        last_name,
        phone,
        req.params.id
      ]
    );

    res.json({ message: "แก้ไขข้อมูลครูแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "แก้ไขข้อมูลครูล้มเหลว" });
  }
});

router.put("/:id/resign", async (req, res) => {
  try {
    const teacherId = req.params.id;

    const [[teacher]] = await db.query(
      "SELECT user_id FROM teachers WHERE teacher_id = ?",
      [teacherId]
    );

    if (!teacher) {
      return res.status(404).json({ error: "ไม่พบข้อมูลครู" });
    }

    await db.query(
  `
  UPDATE teachers
  SET classroom_id = NULL
  WHERE teacher_id = ?
  `,
  [teacherId]
);

    await db.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?",
      [teacher.user_id]
    );

    res.json({ message: "ครูลาออกเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ลาออกไม่สำเร็จ" });
  }
});

module.exports = router;
