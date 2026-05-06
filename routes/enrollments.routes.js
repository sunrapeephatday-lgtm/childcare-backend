const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { authMiddleware } = require("../middlewares/auth");
const upload = multer({ storage: multer.memoryStorage() });

/* helper */
function toStr(v){
  if(!v || v==='-') return null;
  return String(v).trim()||null;
}

function safeJSON(v){
  if(!v) return {};
  if(typeof v==="object") return v;
  try{ return JSON.parse(v); }
  catch{ return {}; }
}

/* ================= MY ENROLLMENT (PARENT) ================= */
router.get("/my", authMiddleware, async (req, res) => {

  if (req.user.role !== "parent")
    return res.status(403).json({ error: "forbidden" });

  try {

    const [rows] = await pool.query(`
      SELECT 
        e.enrollment_id,
        e.status,
        e.note, 
        e.created_at,
        e.files_json
      FROM enrollments e
      WHERE e.created_by = ?
      ORDER BY e.created_at DESC
    `, [req.user.user_id]);

    if (!rows[0]) return res.json(null);

    let row = rows[0];

    /* ⭐ แปลง path เป็น URL เต็ม */
    let files = {};
    if (row.files_json) {
      const raw = typeof row.files_json === "string"
    ? JSON.parse(row.files_json)
    : row.files_json;

      const base = req.protocol + "://" + req.get("host");

      for (const k in raw) {
        files[k] = base + raw[k];
      }
    }

    row.files_json = files;

    res.json(row);

  } catch (err) {
    console.error("my enrollment error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* ================= UPDATE ENROLLMENT (ADMIN EDIT BEFORE APPROVE) ================= */
router.put("/:id", authMiddleware, async (req, res) => {

  if (req.user.role !== "admin")
    return res.status(403).json({ error: "forbidden" });

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    const [[row]] = await conn.query(
      "SELECT status FROM enrollments WHERE enrollment_id=?",
      [req.params.id]
    );

    if (!row)
      throw new Error("ไม่พบใบสมัคร");

    if (row.status !== "pending")
      throw new Error("ใบสมัครนี้อนุมัติแล้ว แก้ไขไม่ได้");

    const payload = req.body.extra_json || {};

    await conn.query(`
      UPDATE enrollments
      SET extra_json = ?
      WHERE enrollment_id = ?
    `, [
      JSON.stringify(payload),
      req.params.id
    ]);

    await conn.commit();

    res.json({ ok: true });

  } catch (err) {

    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });

  } finally {
    conn.release();
  }

});

/* ================= ADMIN LIST ================= */
router.get("/", authMiddleware, async (req, res) => {
  if(req.user.role!=="admin")
    return res.status(403).json({error:"forbidden"});

  try{
    const [rows]=await pool.query(`
      SELECT 
        e.enrollment_id,
        e.status,
        e.created_at,
        e.extra_json,
        c.child_id,
        se.classroom_id,
        cl.classroom_name
      FROM enrollments e
      LEFT JOIN children c 
        ON c.enrollment_id = e.enrollment_id
      LEFT JOIN student_enrollments se
        ON se.child_id = c.child_id
        AND se.status = 'studying'
      LEFT JOIN classrooms cl 
        ON cl.classroom_id = se.classroom_id
      ORDER BY e.created_at DESC
    `);
    res.json(rows);
  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }
});

/* ================= APPROVE ================= */
router.put("/:id/approve", authMiddleware, async (req, res) => {

  if (req.user.role !== "admin")
    return res.status(403).json({ error: "forbidden" });

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    /* ===== หา enrollment ===== */
    const [[enrollment]] = await conn.query(
      "SELECT * FROM enrollments WHERE enrollment_id=?",
      [req.params.id]
    );

    if (!enrollment) throw new Error("not found");

    if (enrollment.status !== "pending")
      throw new Error("ใบสมัครนี้ถูกดำเนินการแล้ว");

    if (enrollment.status !== "pending")
  throw new Error("ใบสมัครนี้ถูกดำเนินการแล้ว");

    // ดึง birth_date จาก extra_json
    const data = JSON.parse(enrollment.extra_json);

    /* ===== หา parent account ===== */
    const [[u]] = await conn.query(
      "SELECT parent_id, center_id FROM parents WHERE user_id=?",
      [enrollment.created_by]
    );

    if (!u) throw new Error("ไม่พบผู้ปกครอง");

    const parentId = u.parent_id;
    const centerId = u.center_id;

    /* ===== map ห้อง (คำนวณจากปีการศึกษา) ===== */
    const birth = new Date(data.birth_date);
    const now = new Date();

    // ===== ใช้ปีการศึกษา =====
    let thaiYear = now.getFullYear() + 543;
    if (now.getMonth() < 4) thaiYear--;

    // ===== cutoff 16 พ.ค. =====
    const cutoff = new Date(thaiYear - 543, 4, 16);

    let age = cutoff.getFullYear() - birth.getFullYear();

    const m = cutoff.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && cutoff.getDate() < birth.getDate())) {
      age--;
    }

    let classroomName = null;

    if (age < 3) {
      classroomName = "ห้องต่ำกว่า 3 ขวบ";
    } else {
      classroomName = "ห้อง 3 ขวบ";
    }

    const [[room]] = await conn.query(
      `SELECT classroom_id
       FROM classrooms
       WHERE classroom_name=? AND center_id=?`,
      [classroomName, centerId]
    );

    if (!room) throw new Error("ไม่พบห้องเรียน");

    const classroomId = room.classroom_id;



    /* ===== INSERT CHILD ===== */
    const [childRes] = await conn.query(`
      INSERT INTO children
      (
        enrollment_id,
        center_id,
        classroom_id,
        prefix,
        first_name,
        last_name,
        nickname,
        birth_date,
        citizen_id,
        apply_level,
        ethnicity,
        nationality,
        religion,
        blood,
        vaccine,
        weight,
        eight,
        treatment,
        enter_study,
        guardian_name,
        guardian_phone,
        father_prefix,
        father_firstname,
        father_lastname,
        father_phone,
        father_job,
        father_salary,
        mother_prefix,
        mother_firstname,
        mother_lastname,
        mother_phone,
        mother_job,
        mother_salary
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      enrollment.enrollment_id,
      centerId,
      classroomId,
      toStr(data.prefix),
      toStr(data.first_name),
      toStr(data.last_name),
      toStr(data.nickname),
      toStr(data.birth_date),
      toStr(data.citizen_id),
      classroomName === "ห้องต่ำกว่า 3 ขวบ"
        ? "อายุต่ำกว่า 3 ปี"
        : "อายุ 3 ปี",
      toStr(data.ethnicity),
      toStr(data.nationality),
      toStr(data.religion),
      toStr(data.blood_group),
      toStr(data.vaccine),
      toStr(data.weight),
      toStr(data.height),
      toStr(data.congenital_disease),
      new Date(),
      (toStr(data.caregiver_firstname) || "") + " " + (toStr(data.caregiver_lastname) || ""),
      toStr(data.caregiver_phone),
      toStr(data.father_prefix),
      toStr(data.father_firstname),
      toStr(data.father_lastname),
      toStr(data.father_phone),
      toStr(data.father_job),
      toStr(data.father_income),
      toStr(data.mother_prefix),
      toStr(data.mother_firstname),
      toStr(data.mother_lastname),
      toStr(data.mother_phone),
      toStr(data.mother_job),
      toStr(data.mother_income)
    ]);

    const childId = childRes.insertId;

    /* ===== INSERT student enrollment ===== */
    const academicYear = new Date().getFullYear() + 543;

    await conn.query(`
      INSERT INTO student_enrollments
      (enrollment_id,child_id,classroom_id,academic_year,status)
      VALUES (?,?,?,?, 'studying')
    `, [
      enrollment.enrollment_id,
      childId,
      classroomId,
      academicYear
    ]);

    /* ===== relation ผู้ปกครองหลัก ===== */
    await conn.query(`
      INSERT INTO relation
      (child_id,parent_id,relationship,is_primary)
      VALUES (?,?, 'ผู้ปกครอง',1)
    `, [childId, parentId]);

    /* ===== food allergy ===== */
    if (data.food_allergy) {
      await conn.query(`
        INSERT INTO child_food_allergies
        (child_id,food_name,note)
        VALUES (?,?,NULL)
      `, [childId, data.food_allergy]);
    }

    /* ===== address ทะเบียนบ้าน ===== */
    await conn.query(`
      INSERT INTO addresses
      (child_id,address_type,house_no,village,subdistrict,district,province,postal_code,created_by)
      VALUES (?,?,?,?,?,?,?,?,?)
    `, [
      childId,
      'ทะเบียนบ้าน',
      data.reg_house_no,
      data.reg_moo,
      data.reg_tambon,
      data.reg_amphur,
      data.reg_province,
      data.reg_postcode,
      req.user.user_id
    ]);

    /* ===== address ปัจจุบัน ===== */
    await conn.query(`
      INSERT INTO addresses
      (child_id,address_type,house_no,village,subdistrict,district,province,postal_code,created_by)
      VALUES (?,?,?,?,?,?,?,?,?)
    `, [
      childId,
      'ที่อยู่ปัจจุบัน',
      data.curr_house_no,
      data.curr_moo,
      data.curr_tambon,
      data.curr_amphur,
      data.curr_province,
      data.curr_postcode,
      req.user.user_id
    ]);

    /* ===== ย้ายไฟล์เข้า uploads table ===== */
    if (enrollment.files_json) {

      const files = typeof enrollment.files_json === "string"
        ? JSON.parse(enrollment.files_json)
        : enrollment.files_json;

      for (const key in files) {

        const filePath = files[key];
        const fileName = path.basename(filePath);

        await conn.query(`
          INSERT INTO uploads
          (file_name,file_path,child_id,parent_id,center_id)
          VALUES (?,?,?,?,?)
        `, [
          fileName,
          filePath,
          childId,
          parentId,
          centerId
        ]);
      }
    }

    /* ===== update enrollment ===== */
    await conn.query(`
      UPDATE enrollments
      SET status='approved',
          classroom_name=?,
          parent_id=?,
          approved_at=NOW(),
          approved_by=?
      WHERE enrollment_id=?
    `, [
      classroomName,
      parentId,
      req.user.user_id,
      enrollment.enrollment_id
    ]);

    await conn.commit();

    res.json({
      ok: true,
      child_id: childId,
    });

  } catch (err) {

    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });

  } finally {
    conn.release();
  }

});

router.put("/:id/reject", authMiddleware, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }

  try {

    const note = String(req.body.note || "").trim();

    if (!note) {
      return res.status(400).json({ error: "กรุณาระบุเหตุผล" });
    }

    const [[row]] = await pool.query(
      "SELECT status FROM enrollments WHERE enrollment_id=?",
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ error: "ไม่พบใบสมัคร" });
    }

    if (row.status !== "pending") {
      return res.status(400).json({ error: "ใบสมัครนี้ถูกดำเนินการแล้ว" });
    }

    await pool.query(`
      UPDATE enrollments
      SET status = 'rejected',
          note = ?,
          approved_at = NOW(),
          approved_by = ?
      WHERE enrollment_id = ?
    `, [
      note,
      req.user.user_id,
      req.params.id
    ]);

    res.json({ ok: true });

  } catch (err) {
    console.error("reject enrollment error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* ================= ADMIN DETAIL ================= */
router.get("/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "forbidden" });

  try {
    const [[row]] = await pool.query(
      "SELECT * FROM enrollments WHERE enrollment_id=?",
      [req.params.id]
    );

    if (!row)
      return res.status(404).json({ error: "not found" });

    res.json(row);
  } catch (err) {
    console.error("enrollment detail error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   CREATE ENROLLMENT (ผู้ปกครองสมัครเรียน + อัปโหลดไฟล์)
===================================================== */

router.post("/", authMiddleware, upload.any(), async (req, res) => {

  if (req.user.role !== "parent")
    return res.status(403).json({ error: "forbidden" });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* กันสมัครซ้ำ (ยัง pending อยู่) */
    const [rows] = await conn.query(
      "SELECT enrollment_id FROM enrollments WHERE created_by=? AND status='pending' FOR UPDATE",
      [req.user.user_id]
    );

    if (rows.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: "คุณมีใบสมัครที่รอดำเนินการอยู่แล้ว" });
    }

    /* ---------- รับ payload ---------- */

    let payload = {};
    let filesJson = {};   // ⭐ สำคัญ: ต้องอยู่นอก try

    if (!req.body || !req.body.payload)
      return res.status(400).json({ error: "payload missing" });

    try {
      payload = typeof req.body.payload === "string"
        ? JSON.parse(req.body.payload)
        : req.body.payload;
    } catch {
      return res.status(400).json({ error: "payload json invalid" });
    }


    /* ---------- จัดการไฟล์เอกสาร ---------- */

    if (req.files && req.files.length > 0) {

      const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "enrollments");

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      for (const file of req.files) {

        const ext = path.extname(file.originalname);
        const filename = Date.now() + "_" + file.fieldname + ext;
        const filepath = path.join(UPLOAD_DIR, filename);

        // เขียนไฟล์จาก RAM ลงเครื่อง
        fs.writeFileSync(filepath, file.buffer);

        // บันทึก path ลง DB
        filesJson[file.fieldname] = "/uploads/enrollments/" + filename;
      }
    }

    console.log("FILES JSON =", filesJson);

    const [[p]] = await conn.query(
      "SELECT center_id FROM parents WHERE user_id=?",
      [req.user.user_id]
    );

    if(!p){
      throw new Error("ไม่พบข้อมูลผู้ปกครอง");
    }

    await conn.query(`
      INSERT INTO enrollments
  (status, center_id, extra_json, files_json, created_by, created_at)
  VALUES ('pending', ?, ?, ?, ?, NOW())
    `, [
      p.center_id,
      JSON.stringify(payload),
      JSON.stringify(filesJson),
      req.user.user_id
    ]);

    await conn.commit();
    res.json({ ok: true });

  } catch (err) {
    await conn.rollback();
    console.error("create enrollment error:", err);
    res.status(500).json({ error: "server error" });
  } finally {
    conn.release();
  }
});

/* ================= CHECK DUPLICATE CHILD ================= */
router.get("/check/:citizen", authMiddleware, async (req, res) => {
  try {

    const [rows] = await pool.query(`
      SELECT child_id
      FROM children
      WHERE citizen_id = ?
      LIMIT 1
    `, [req.params.citizen]);

    res.json({
      exists: rows.length > 0
    });

  } catch (err) {
    console.error("check enrollment error:", err);
    res.status(500).json({ error: "server error" });
  }
});
/* ================= CHILD DROP OUT ================= */
router.put("/child/:id/drop", authMiddleware, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }

  try {

    const childId = req.params.id;

    /* ⭐ หา enrollment ปีปัจจุบัน */
    const [[row]] = await pool.query(`
      SELECT enrollment_id
      FROM student_enrollments
      WHERE child_id = ?
      AND status = 'studying'
      ORDER BY academic_year DESC
      LIMIT 1
    `, [childId]);

    if (!row) {
      return res.status(404).json({ error: "ไม่พบนักเรียนที่กำลังเรียน" });
    }

    /* ⭐ update เป็น transferred */
    await pool.query(`
      UPDATE student_enrollments
      SET status = 'transferred'
      WHERE enrollment_id = ?
    `, [row.enrollment_id]);

    res.json({ ok: true });

  } catch (err) {
    console.error("DROP ERROR =", err);
    res.status(500).json({ error: "drop failed" });
  }

});

module.exports=router;