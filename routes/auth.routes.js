const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ================= UPLOAD ================= */

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});

const upload = multer({ storage });

/* ================= EMAIL OTP ================= */

async function sendEmailOTP(to, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
      }
    });

    const info = await transporter.sendMail({
      // 👇 แก้ตรงนี้
      from: `"ChildCare System" <${process.env.GMAIL_USER}>`,

      to,
      subject: "OTP รีเซ็ตรหัสผ่าน",

      // 👇 เพิ่มอันนี้ (สำคัญมาก)
      text: `OTP ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`,

      html: `
        <div style="font-family:sans-serif">
          <h2>รหัส OTP สำหรับเปลี่ยนรหัสผ่าน</h2>
          <h1 style="color:#28a745">${otp}</h1>
          <p>หมดอายุใน 5 นาที</p>
        </div>
      `
    });

    console.log("✅ EMAIL SENT:", info.response);

  } catch (err) {
    console.error("❌ EMAIL ERROR:", err.message);
    throw err;
  }
}

/* ================= SMS MOCK ================= */

async function sendSMSOTP(phone, otp){
  console.log("📱 OTP PHONE =", phone, "OTP =", otp);
}

/* ================= LOGIN ================= */

router.post("/login", async (req,res)=>{

  const { username, password } = req.body;

  try{

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username=? AND password=?",
      [username,password]
    );

    if(!rows.length)
      return res.status(401).json({error:"username/password ไม่ถูกต้อง"});

    const user = rows[0];

    let parentId = null;

    if(user.role==="parent"){
      const [p] = await pool.query(
        "SELECT parent_id FROM parents WHERE user_id=? LIMIT 1",
        [user.user_id]
      );
      if(p.length) parentId = p[0].parent_id;
    }

    const token = jwt.sign({
      user_id:user.user_id,
      role:user.role,
      center_id:user.center_id,
      teacher_id:user.teacher_id || null,
      parent_id:parentId
    }, JWT_SECRET,{expiresIn:"7d"});

    res.json({
      token,
      user:{
        user_id:user.user_id,
        username:user.username,
        role:user.role,
        center_id:user.center_id,
        parent_id:parentId
      }
    });

  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }

});

/* ================= REGISTER ================= */

router.post("/register", upload.single("avatar"), async (req,res)=>{

  const {
    username,password,email,center_id,
    prefix,first_name,last_name,phone
  } = req.body;

  if(!/^0[0-9]{9}$/.test(phone))
    return res.status(400).json({error:"เบอร์โทรไม่ถูกต้อง"});

  const conn = await pool.getConnection();

  try{

    await conn.beginTransaction();

    const [u] = await conn.query(
      "SELECT user_id FROM users WHERE username=?",
      [username]
    );
    if(u.length){
      await conn.rollback();
      return res.status(400).json({error:"username ถูกใช้แล้ว"});
    }

    const [e] = await conn.query(
      "SELECT user_id FROM users WHERE email=?",
      [email]
    );
    if(e.length){
      await conn.rollback();
      return res.status(400).json({error:"email ถูกใช้แล้ว"});
    }

    const [userRes] = await conn.query(`
      INSERT INTO users
      (username,email,password,role,center_id,created_at)
      VALUES (?,?,?,'parent',?,NOW())
    `,[username,email,password,center_id || null]);

    const userId = userRes.insertId;

    await conn.query(`
  INSERT INTO parents
  (user_id,center_id,prefix,first_name,last_name,phone,created_at)
  VALUES (?,?,?,?,?,?,NOW())
`,[
  userId,
  center_id,
  prefix,
  first_name,
  last_name,
  phone
]);

    if(req.file){
      const url = "/uploads/"+req.file.filename;
      await conn.query(`
        INSERT INTO images
        (ref_type,ref_id,image_url,created_at)
        VALUES ('user',?,?,NOW())
      `,[userId,url]);
    }

    await conn.commit();

    res.json({ok:true});

  }catch(err){
    await conn.rollback();
    console.error(err);
    res.status(500).json({error:"server error"});
  }finally{
    conn.release();
  }

});

/* ================= FORGOT PASSWORD ================= */

router.post("/forgot-password", async (req,res)=>{

  const { email, phone } = req.body;

  try{

    let user = null;

    if(email){
      const [r] = await pool.query(
        "SELECT user_id,email FROM users WHERE email=?",
        [email]
      );
      if(!r.length)
        return res.status(404).json({error:"ไม่พบ email"});
      user = r[0];
    }

    else if(phone){
      const [r] = await pool.query(`
        SELECT u.user_id,u.email,p.phone
        FROM users u
        JOIN parents p ON p.user_id=u.user_id
        WHERE p.phone=?`,[phone]);

      if(!r.length)
        return res.status(404).json({error:"ไม่พบเบอร์"});
      user = r[0];
    }

    else{
      return res.status(400).json({error:"กรอก email หรือ phone"});
    }

    const otp = Math.floor(100000+Math.random()*900000).toString();
    const expire = new Date(Date.now()+5*60*1000);
    console.log("OTP =", otp);
    await pool.query(`
      UPDATE users
      SET reset_otp=?, reset_expire=?
      WHERE user_id=?`,
      [otp,expire,user.user_id]
    );

    if(email) await sendEmailOTP(user.email,otp);
    if(phone) await sendSMSOTP(phone,otp);

    res.json({ok:true,user_id:user.user_id});

  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }

});

/* ================= RESET PASSWORD ================= */

router.post("/reset-password", async (req,res)=>{

  const { user_id, otp, newPassword } = req.body;

  try{

    const [rows] = await pool.query(`
      SELECT reset_otp,reset_expire
      FROM users WHERE user_id=?`,
      [user_id]
    );

    if(!rows.length)
      return res.status(404).json({error:"ไม่พบผู้ใช้"});

    const user = rows[0];

    if(user.reset_otp !== otp)
      return res.status(400).json({error:"OTP ไม่ถูกต้อง"});

    if(new Date() > new Date(user.reset_expire))
      return res.status(400).json({error:"OTP หมดอายุ"});

    await pool.query(`
      UPDATE users
      SET password=?, reset_otp=NULL, reset_expire=NULL
      WHERE user_id=?`,
      [newPassword,user_id]
    );

    res.json({ok:true});

  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }

});

module.exports = router;