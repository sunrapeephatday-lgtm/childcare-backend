// backend/routes/admissions.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db.js');
 // ใช้ mysql2/promise pool
// ถ้าต้องการอัปโหลดไฟล์ ให้เพิ่ม multer เหมือน enrollments route

/**
 * POST /api/admission
 * payload: {
 *   student_prefix, student_firstname, student_lastname, student_nickname,
 *   student_idcard, birth_date, gender,
 *   mother_prefix, mother_name, mother_lastname, mother_idcard, mother_phone, mother_address,
 *   father_prefix, father_name, father_lastname, father_idcard, father_phone, father_address,
 *   class_assigned, start_date, notes, created_by, center_id
 * }
 */
router.post('/', async (req, res) => {
  const body = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) สร้าง child ในตาราง children
    // ปรับชื่อคอลัมน์ใน INSERT ให้ตรงกับ schema ของคุณ (ตรวจสอบ children table ถ้าจำเป็น)
    const insertChildSql = `
      INSERT INTO children
      (prefix, first_name, last_name, nickname, citizen_id, birth_date, gender, created_by, center_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const childParams = [
      body.student_prefix || null,
      body.student_firstname || null,
      body.student_lastname || null,
      body.student_nickname || null,
      body.student_idcard || null,
      body.birth_date || null,
      body.gender || (body.student_prefix && body.student_prefix.includes('ชาย') ? 'ชาย' : 'หญิง'),
      body.created_by ? parseInt(body.created_by) : null,
      body.center_id ? parseInt(body.center_id) : null
    ];

    const [childRes] = await conn.query(insertChildSql, childParams);
    const childId = childRes.insertId;

    // 2) สร้าง parent(s) ถ้ามี แล้วคืน parent_id
    // เราสร้างแยกแม่และพ่อ (ถ้ามี) แล้วเก็บ relation
    const parentIds = []; // เก็บ parent_id ที่สร้าง

    async function createParent(pfx, name, lastname, idcard, phone, address, role) {
      if (!name && !idcard && !phone) return null;
      const insertParentSql = `
        INSERT INTO parents
        (prefix, name, last_name, idcard, phone, address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      const [r] = await conn.query(insertParentSql, [
        pfx || null,
        name || null,
        lastname || null,
        idcard || null,
        phone || null,
        address || null
      ]);
      const pid = r.insertId;

      // ผูก relation (parent <-> child)
      // ตาราง relation อาจชื่อแตกต่างกัน ปรับได้ตาม DB
      const insertRelSql = `
        INSERT INTO relation (parent_id, child_id, relation_type, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      await conn.query(insertRelSql, [pid, childId, role || 'parent']);
      return pid;
    }

    const mId = await createParent(
      body.mother_prefix, body.mother_name, body.mother_lastname, body.mother_idcard, body.mother_phone, body.mother_address, 'mother'
    );
    if (mId) parentIds.push(mId);

    const fId = await createParent(
      body.father_prefix, body.father_name, body.father_lastname, body.father_idcard, body.father_phone, body.father_address, 'father'
    );
    if (fId) parentIds.push(fId);

    // 3) (option) สร้าง address แยก ถ้าตาราง addresses มีใช้งาน
    if (body.home_address) {
      const insertAddrSql = `
        INSERT INTO addresses (child_id, address_text, created_at) VALUES (?, ?, NOW())
      `;
      await conn.query(insertAddrSql, [childId, body.home_address]);
    }

    // 4) update enrollments record (ถ้ามาจาก enrollment_id) ให้ผูก child_id และสถานะ approved (ถ้ามี)
    if (body.enrollment_id) {
      const updEnrollSql = `UPDATE enrollments SET child_id = ?, status = 'admitted' WHERE enrollment_id = ?`;
      await conn.query(updEnrollSql, [childId, body.enrollment_id]);
    }

    await conn.commit();

    res.json({
      ok: true,
      child_id: childId,
      parent_ids: parentIds,
      message: 'มอบตัวสำเร็จ'
    });
  } catch (err) {
    await conn.rollback();
    console.error('admission create err:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
