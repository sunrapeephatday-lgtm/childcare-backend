const jwt = require("jsonwebtoken");
const pool = require("../db");   // <<< เพิ่ม
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ===== ตรวจ token ===== */
async function authMiddleware(req, res, next) {

 console.log("HEADERS =", req.headers);
  console.log("AUTH =", req.headers.authorization);

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

const user = {
  user_id: payload.user_id,
  role: payload.role,
  center_id: payload.center_id || null,
  teacher_id: payload.teacher_id || null,
  parent_id: payload.parent_id || null
};

req.user = user;   // ⭐ ต้องตั้งก่อน

console.log("LOGIN USER =", req.user);

    /* ===== ถ้าเป็นครู ===== */
    if (user.role === "teacher") {
      const [t] = await pool.query(
        "SELECT teacher_id FROM teachers WHERE user_id = ?",
        [user.user_id]
      );
      if (t.length) user.teacher_id = t[0].teacher_id;
    }

    /* ===== ถ้าเป็นผู้ปกครอง ===== */
    if (user.role === "parent") {
  const [p] = await pool.query(
    "SELECT parent_id FROM parents WHERE user_id = ? LIMIT 1",
    [user.user_id]
  );

  if (p.length) {
    user.parent_id = p[0].parent_id;
  } else {
    user.parent_id = null;
  }
}

    req.user = user;
    next();

  } catch (err) {
    console.error("Invalid token", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ===== ตรวจสิทธิ์ตาม role ===== */
function permit(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  permit,
};
