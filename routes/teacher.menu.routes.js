const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middlewares/auth");

/* GET เมนูของครู (ตาม center) */
router.get("/daily-menu", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "forbidden" });
    }

    const center_id = req.user.center_id;
    const teacher_id = req.user.teacher_id;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM daily_menu
      WHERE center_id = ?
      ORDER BY menu_date DESC
      `,
      [center_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

/* CREATE / UPDATE */
router.post("/daily-menu", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "forbidden" });
    }

    const {
      menu_date,
      main_menu,
      stir_menu,
      soup_menu,
      fried_menu,
      dessert_menu,
      note
    } = req.body;

    const center_id = req.user.center_id;
    const teacher_id = req.user.teacher_id;

    const [exists] = await pool.query(
      "SELECT daily_menu_id FROM daily_menu WHERE menu_date = ? AND center_id = ?",
      [menu_date, center_id]
    );

    if (exists.length > 0) {
      await pool.query(
        `
        UPDATE daily_menu SET
          main_menu = ?, stir_menu = ?, soup_menu = ?,
          fried_menu = ?, dessert_menu = ?, note = ?,
          teacher_id = ?, updated_at = NOW()
        WHERE menu_date = ? AND center_id = ?
        `,
        [
          main_menu,
          stir_menu,
          soup_menu,
          fried_menu,
          dessert_menu,
          note,
          teacher_id,
          menu_date,
          center_id
        ]
      );
    } else {
      await pool.query(
        `
        INSERT INTO daily_menu
        (center_id, teacher_id, menu_date, main_menu, stir_menu, soup_menu, fried_menu, dessert_menu, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          center_id,
          teacher_id,
          menu_date,
          main_menu,
          stir_menu,
          soup_menu,
          fried_menu,
          dessert_menu,
          note
        ]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "cannot save daily menu" });
  }
});

/* ===== CHECK FOOD ALLERGY ===== */
router.get("/daily-menu/check-allergy", authMiddleware, async (req,res)=>{
  try{

    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "forbidden" });
    }

    const { food } = req.query;
    const center_id = req.user.center_id;

    if(!food){
      return res.json([]);
    }

    const [rows] = await pool.query(`
  SELECT 
    c.child_id,
    c.prefix,
    c.first_name,
    c.last_name,
    a.food_name
  FROM child_food_allergies a
  JOIN children c ON c.child_id = a.child_id
  JOIN student_enrollments se ON se.child_id = c.child_id
  WHERE c.center_id = ?
  AND se.status = 'studying'
  AND se.academic_year = YEAR(CURDATE())+543
  AND a.food_name LIKE ?
`,[center_id, `%${food}%`]);

    res.json(rows);

  }catch(err){
    console.error(err);
    res.status(500).json({error:"server error"});
  }
});
module.exports = router;
