const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* =============================
   TEST ROOT: /api/development
============================= */
router.get("/", authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

/* =============================
   GET: รายการหัวข้อประเมิน
   /api/development/items
============================= */
router.get("/items", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT item_id, item_no, description
      FROM development_items
      ORDER BY item_no
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET ITEMS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   POST: บันทึกผลประเมิน
   /api/development
============================= */
router.post("/", authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    // ตรวจสอบสิทธิ์
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "forbidden" });
    }

    const { child_id, results } = req.body;
    const parent_id = req.user.parent_id;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!child_id || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: "invalid payload" });
    }

    // ตรวจสอบ parent_id
    if (!parent_id) {
      return res.status(400).json({ error: "parent_id missing in token" });
    }

    // =========================
    // จำกัดให้ประเมินได้ไม่เกิน 2 ครั้ง
    // =========================
    const [[countRow]] = await conn.query(`
      SELECT COUNT(*) AS total
      FROM development_assessments
      WHERE child_id = ?
    `, [child_id]);

    if (countRow.total >= 2) {
      return res.status(400).json({
        error: "เด็กคนนี้ประเมินครบ 2 ครั้งแล้ว"
      });
    }

    // =========================
    // นับจำนวนข้อแต่ละระดับ
    // =========================
    const totalLevel3 = results.filter(r => r.level_id === 3).length;
    const totalLevel2 = results.filter(r => r.level_id === 2).length;
    const totalLevel1 = results.filter(r => r.level_id === 1).length;

    // =========================
    // คำนวณคะแนนรวม
    // 3 = 2 คะแนน
    // 2 = 1 คะแนน
    // 1 = 0 คะแนน
    // คะแนนเต็ม 20 ข้อ = 40 คะแนน
    // =========================
    const totalScore = results.reduce((sum, r) => {
      if (r.level_id === 3) return sum + 2;
      if (r.level_id === 2) return sum + 1;
      return sum;
    }, 0);

    // =========================
    // สรุประดับพัฒนาการ
    // =========================
    let resultLevel = "";

    if (totalScore >= 30) {
      resultLevel = "สมวัย";
    } else if (totalScore >= 20) {
      resultLevel = "ควรส่งเสริมเพิ่มเติม";
    } else {
      resultLevel = "ควรปรึกษาครูหรือผู้เชี่ยวชาญ";
    }

    // =========================
    // บันทึกข้อมูล
    // =========================
    await conn.beginTransaction();

    const [assessRes] = await conn.query(`
      INSERT INTO development_assessments
      (
        child_id,
        parent_id,
        assessment_date,
        total_good,
        total_score,
        result_level
      )
      VALUES (?, ?, CURDATE(), ?, ?, ?)
    `, [
      child_id,
      parent_id,
      totalLevel3,
      totalScore,
      resultLevel
    ]);

    const assessmentId = assessRes.insertId;

    for (const r of results) {
      await conn.query(`
        INSERT INTO development_results
        (
          assessment_id,
          item_id,
          level_id
        )
        VALUES (?, ?, ?)
      `, [
        assessmentId,
        r.item_id,
        r.level_id
      ]);
    }

    await conn.commit();

    res.json({
      ok: true,
      assessment_id: assessmentId,

      // จำนวนข้อแต่ละระดับ
      total_level_3: totalLevel3,
      total_level_2: totalLevel2,
      total_level_1: totalLevel1,

      // จำนวนข้อที่ทำได้สม่ำเสมอ
      total_good: totalLevel3,

      // คะแนนรวม
      total_score: totalScore,

      // ระดับพัฒนาการ
      result_level: resultLevel
    });

  } catch (err) {
    await conn.rollback();
    console.error("POST DEV ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* =============================
   GET: ประวัติรายเด็ก
   /api/development/child/:childId/progress
============================= */
router.get("/child/:childId/progress", authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;

    // ตรวจสอบสิทธิ์สำหรับผู้ปกครอง
    if (req.user.role === "parent") {
      const [[rel]] = await pool.query(`
        SELECT 1
        FROM relation
        WHERE parent_id = ?
        AND child_id = ?
      `, [req.user.parent_id, childId]);

      if (!rel) {
        return res.status(403).json({ error: "forbidden" });
      }
    }

    const [rows] = await pool.query(`
      SELECT
        assessment_id,
        assessment_date,
        total_good,
        total_score,
        result_level
      FROM development_assessments
      WHERE child_id = ?
      ORDER BY assessment_date DESC
    `, [childId]);

    res.json(rows);

  } catch (err) {
    console.error("GET PROGRESS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;