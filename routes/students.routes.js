const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* ================= LIST STUDENTS ================= */
router.get("/", authMiddleware, async (req,res)=>{
  try{

    const [rows] = await pool.query(`
      SELECT 
        c.child_id,
        c.child_code,
        c.prefix,
        c.first_name,
        c.last_name,
        cl.classroom_name,
        se.academic_year,
        se.status
      FROM children c
      LEFT JOIN student_enrollments se 
        ON se.child_id = c.child_id
        AND se.status = 'studying'
      LEFT JOIN classrooms cl 
        ON cl.classroom_id = se.classroom_id
      ORDER BY c.child_id DESC
    `);

    res.json(rows);

  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }
});

/* ================= GET ONE ================= */
router.get("/:id", authMiddleware, async (req,res)=>{
  try{

   const [[row]] = await pool.query(`
  SELECT 
    c.*,
    se.classroom_id,
    cl.classroom_name
  FROM children c
  LEFT JOIN student_enrollments se 
    ON se.child_id = c.child_id
    AND se.status = 'studying'
  LEFT JOIN classrooms cl
    ON cl.classroom_id = se.classroom_id
  WHERE c.child_id=?
`,[req.params.id]);

    if(!row)
      return res.status(404).json({error:"not found"});

    res.json(row);

  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }
});

/* ================= UPDATE ================= */
router.put("/:id", authMiddleware, async (req,res)=>{

  if(req.user.role !== "admin")
    return res.status(403).json({error:"forbidden"});

  try{

    const d = req.body;

if (d.enter_study) {
  d.enter_study = String(d.enter_study).split("T")[0];
}

    await pool.query(`
      UPDATE children SET
        child_code=?,
        prefix=?,
        first_name=?,
        last_name=?,
        nickname=?,
        birth_date=?,
        citizen_id=?,
        apply_level=?,
        ethnicity=?,
        nationality=?,
        religion=?,
        blood=?,
        treatment=?,
        vaccine=?,
        enter_study=?,
        note=?,
        oral_health=?,
        birth_weight=?,
        birth_height=?,
        reimbursment=?,
        eat=?,
        needs=?,
        father_prefix=?,
        father_firstname=?,
        father_lastname=?,
        father_phone=?,
        father_job=?,
        father_salary=?,
        mother_prefix=?,
        mother_firstname=?,
        mother_lastname=?,
        mother_phone=?,
        mother_job=?,
        mother_salary=?,
        guardian_name=?,
        guardian_phone=?
      WHERE child_id=?
    `,[
      d.child_code,
      d.prefix,
      d.first_name,
      d.last_name,
      d.nickname,
      d.birth_date,
      d.citizen_id,
      d.apply_level,
      d.ethnicity,
      d.nationality,
      d.religion,
      d.blood,
      d.treatment,
      d.vaccine,
      d.enter_study,
      d.note,
      d.oral_health,
      d.birth_weight,
      d.birth_height,
      d.reimbursment,
      d.eat,
      d.needs,
      d.father_prefix,
      d.father_firstname,
      d.father_lastname,
      d.father_phone,
      d.father_job,
      d.father_salary,
      d.mother_prefix,
      d.mother_firstname,
      d.mother_lastname,
      d.mother_phone,
      d.mother_job,
      d.mother_salary,
      d.guardian_name,
      d.guardian_phone,
      req.params.id
    ]);

    if (d.classroom_id) {
  await pool.query(`
    UPDATE student_enrollments
    SET classroom_id = ?
    WHERE child_id = ?
    AND status = 'studying'
  `, [
    d.classroom_id,
    req.params.id
  ]);
}

res.json({ ok: true });

    res.json({ok:true});

  }catch(err){
    console.error(err);
    res.status(500).json({error:"update failed"});
  }

});
/* ================= PROMOTE SELECTED ================= */
router.post("/promote", authMiddleware, async (req, res) => {

  if (req.user.role !== "admin")
    return res.status(403).json({ error: "forbidden" });

  const { ids } = req.body;

  if (!ids || ids.length === 0)
    return res.status(400).json({ error: "no students selected" });

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    /* ⭐ หาปีปัจจุบัน */
    const [[yearRow]] = await conn.query(`
      SELECT academic_year
      FROM student_enrollments
      ORDER BY academic_year DESC
      LIMIT 1
    `);

    if (!yearRow)
      throw new Error("ไม่พบปีการศึกษา");

    const currentYear = yearRow.academic_year;
    const nextYear = currentYear + 1;

    /* ⭐ ดึงเฉพาะเด็กที่เลือก */
    const [students] = await conn.query(`
      SELECT child_id, classroom_id
      FROM student_enrollments
      WHERE academic_year = ?
      AND status = 'studying'
      AND child_id IN (?)
    `, [currentYear, ids]);

    /* ⭐ update ปีเก่า */
    await conn.query(`
      UPDATE student_enrollments
      SET status = 'graduated'
      WHERE academic_year = ?
      AND child_id IN (?)
    `, [currentYear, ids]);

    let graduated = 0;
    let promoted = 0;

    for (const s of students) {

      /* ⭐ logic ห้องสุดท้าย = จบ */
      if (s.classroom_id >= 3) {
        graduated++;
        continue;
      }

      const newRoom = s.classroom_id + 1;

      await conn.query(`
        INSERT INTO student_enrollments
        (child_id, classroom_id, academic_year, status)
        VALUES (?, ?, ?, 'studying')
      `, [
        s.child_id,
        newRoom,
        nextYear
      ]);

      promoted++;
    }

    await conn.commit();

    res.json({
      ok: true,
      promoted,
      graduated,
      new_year: nextYear
    });

  } catch (err) {

    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "promote failed" });

  } finally {
    conn.release();
  }

});

module.exports = router;