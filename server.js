console.log("🔥 RUNNING SERVER.JS FILE 🔥");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

/* =====================================================
   CORS  (รองรับ: localhost + มือถือ + cloudflare tunnel)
===================================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  /https:\/\/.*\.trycloudflare\.com$/   // <-- ตัวสำคัญ (มือถือเข้าเว็บได้)
];


app.use(cors({
  origin: true,
  credentials: true
}));

/* ===== EXPRESS 5 PREFLIGHT FIX ===== */
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(204);
  }
  next();
});

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* serve uploads (รูป / เอกสาร) */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use("/uploads", express.static(UPLOAD_DIR));

/* =====================================================
   ROUTE LOADER
===================================================== */

function safeRequireRoute(relPath) {
  try {
    return require(relPath);
  } catch (err) {
    console.error(`[routes] failed loading ${relPath}:`, err.message);
    return null;
  }
}

/* =====================================================
   ROUTES
===================================================== */

const authRoutes = safeRequireRoute("./routes/auth.routes");
const announcementsRoutes = safeRequireRoute("./routes/announcements.routes");
const filesRoutes = safeRequireRoute("./routes/files.routes");
const enrollmentsRoutes = safeRequireRoute("./routes/enrollments.routes");
const teacherRoutes = safeRequireRoute("./routes/teacher.routes");
const admissionRoutes = safeRequireRoute("./routes/admissions.routes");
const measurementsRoutes = safeRequireRoute("./routes/measurements.routes");
const healthRoutes = safeRequireRoute("./routes/health.routes");
const brushingsRoutes = safeRequireRoute("./routes/brushings.routes");
const milkRoutes = safeRequireRoute("./routes/milk.routes");
const lunchRoutes = safeRequireRoute("./routes/lunch.routes");
const lunchEatingRoutes = safeRequireRoute("./routes/lunchEating.routes");
const adminUsersRoutes = safeRequireRoute("./routes/admin.users.routes");
const childrenClassRoutes = safeRequireRoute("./routes/children.class.routes");
const dailyMenuRoutes = safeRequireRoute("./routes/daily.menu.routes");
const centersRoutes = safeRequireRoute("./routes/centers.routes");
const developmentRoutes = safeRequireRoute("./routes/development.routes");
const childrenRoutes = safeRequireRoute("./routes/children.routes");
const adminDevelopmentRoutes = safeRequireRoute("./routes/admin.development.routes");
const adminDashboardRoutes = safeRequireRoute("./routes/admin.dashboard.routes");
const adminRoutes = safeRequireRoute("./routes/admin.routes");
const teacherMenuRoutes = safeRequireRoute("./routes/teacher.menu.routes");
const checkinsRoutes = safeRequireRoute("./routes/checkins.routes");
const usersRoutes = safeRequireRoute("./routes/users.routes");
const classroomsRoutes = safeRequireRoute("./routes/classrooms.routes");
const adminTeachersRoutes = safeRequireRoute("./routes/admin.teachers.routes");
const studentsRoutes = safeRequireRoute("./routes/students.routes");

/* register routes */

if (authRoutes) app.use("/api/auth", authRoutes);
if (childrenClassRoutes) app.use("/api/children/class", childrenClassRoutes);
if (announcementsRoutes) app.use("/api/announcements", announcementsRoutes);
if (filesRoutes) app.use("/api/files", filesRoutes);
if (enrollmentsRoutes) app.use("/api/enrollments", enrollmentsRoutes);
if (teacherRoutes) app.use("/api/teacher", teacherRoutes);
if (admissionRoutes) app.use("/api/admission", admissionRoutes);
if (measurementsRoutes) app.use("/api/measurements", measurementsRoutes);
if (healthRoutes) app.use("/api/health", healthRoutes);
if (brushingsRoutes) app.use("/api/brushings", brushingsRoutes);
if (milkRoutes) app.use("/api/milk", milkRoutes);
if (lunchRoutes) app.use("/api/lunch", lunchRoutes);
if (lunchEatingRoutes) app.use("/api/lunch-eating", lunchEatingRoutes);
if (adminUsersRoutes) app.use("/api/admin/users", adminUsersRoutes);
if (developmentRoutes) app.use("/api/development", developmentRoutes);
if (dailyMenuRoutes) app.use("/api/daily-menu", dailyMenuRoutes);
if (centersRoutes) app.use("/api/centers", centersRoutes);
if (childrenRoutes) app.use("/api/children", childrenRoutes);
if (adminDevelopmentRoutes) app.use("/api/admin/development", adminDevelopmentRoutes);
if (adminDashboardRoutes) app.use("/api/admin/dashboard", adminDashboardRoutes);
if (adminRoutes) app.use("/api/admin", adminRoutes);
if (teacherMenuRoutes) app.use("/api/teacher", teacherMenuRoutes);
if (checkinsRoutes) app.use("/api/checkins", checkinsRoutes);
if (usersRoutes) app.use("/api/users", usersRoutes);
if (adminTeachersRoutes) app.use("/api/admin/teachers", adminTeachersRoutes);
if (classroomsRoutes) app.use("/api/classrooms", classroomsRoutes);
if (studentsRoutes) app.use("/api/students", studentsRoutes);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Backend running on port", PORT);
});
