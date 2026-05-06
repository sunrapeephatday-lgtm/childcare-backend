-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for carechild_db
CREATE DATABASE IF NOT EXISTS `carechild_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `carechild_db`;

-- Dumping structure for table carechild_db.academic_years
CREATE TABLE IF NOT EXISTS `academic_years` (
  `year` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`year`),
  UNIQUE KEY `year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.academic_years: ~3 rows (approximately)
DELETE FROM `academic_years`;
INSERT INTO `academic_years` (`year`, `is_active`) VALUES
	(2567, 0),
	(2568, 0),
	(2569, 1);

-- Dumping structure for table carechild_db.addresses
CREATE TABLE IF NOT EXISTS `addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `address_type` enum('ทะเบียนบ้าน','ที่อยู่ปัจจุบัน','ที่อยู่ผู้ปกครอง','ที่อยู่เด็ก','ที่อยู่ติดต่อ') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `village` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subdistrict` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `child_id` (`child_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `addresses_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.addresses: ~4 rows (approximately)
DELETE FROM `addresses`;
INSERT INTO `addresses` (`address_id`, `child_id`, `parent_id`, `address_type`, `house_no`, `village`, `subdistrict`, `district`, `province`, `postal_code`, `created_by`, `created_at`) VALUES
	(1, 1, NULL, 'ทะเบียนบ้าน', '12/5', '3', 'ในเมือง', 'เมือง', 'นครราชสีมา', '30130', 1, '2026-03-19 12:11:46'),
	(2, 1, NULL, 'ที่อยู่ปัจจุบัน', '315', '1', 'หนองน้ำแดง', 'ปากช่อง', 'นคราชสีมา', '30130', 1, '2026-03-19 12:11:46'),
	(3, 2, NULL, 'ทะเบียนบ้าน', '99/1', '5', 'หนองน้ำแดง', 'ปากช่อง', 'นครราชสีมา', '30130', 1, '2026-03-21 03:50:28'),
	(4, 2, NULL, 'ที่อยู่ปัจจุบัน', '99/1', '5', 'หนองน้ำแดง', 'ปากช่อง', 'นครราชสีมา', '30130', 1, '2026-03-21 03:50:28'),
	(5, 3, NULL, 'ทะเบียนบ้าน', '129', '7', 'กลางดง', 'ปากช่อง', 'นครราชสีมา', '30130', 1, '2026-04-05 12:39:42'),
	(6, 3, NULL, 'ที่อยู่ปัจจุบัน', '129', '7', 'กลางดง', 'ปากช่อง', 'นครราชสีมา', '30130', 1, '2026-04-05 12:39:42');

-- Dumping structure for table carechild_db.announcements
CREATE TABLE IF NOT EXISTS `announcements` (
  `announcement_id` int NOT NULL AUTO_INCREMENT,
  `center_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`announcement_id`),
  KEY `center_id` (`center_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.announcements: ~2 rows (approximately)
DELETE FROM `announcements`;
INSERT INTO `announcements` (`announcement_id`, `center_id`, `title`, `content`, `created_by`, `created_at`) VALUES
	(1, NULL, 'กิจกรรมวันเด็กแห่งชาติ', '🎈✨ วันเด็กแห่งชาติ ประจำปี 2569 ✨🎈\r\nขอเชิญผู้ใหญ่ใจดีทุกท่าน ร่วมสนับสนุนของขวัญ ของรางวัล อาหาร และเครื่องดื่ม\r\nเพื่อมอบความสุข รอยยิ้ม และความทรงจำดี ๆ ให้กับเด็ก ๆ\r\nในกิจกรรมวันเด็กแห่งชาติ ประจำปี 2569\r\n\r\n📅 วันพุธที่ 7 มกราคม 2569\r\n📞 ติดต่อสอบถามได้ที่ กองการศึกษา ศาสนา และวัฒนธรรม\r\n☎️ 044-000360', 1, '2026-01-18 03:28:35'),
	(2, NULL, 'โครงการเด็กปฐมวัยไม่จมน้ำ (สป.สช.)  ', 'ณ ศูนย์พัฒาเด็กเล็ก อบต.หนองน้ำแดง', 1, '2026-01-18 04:11:59');

-- Dumping structure for table carechild_db.attendance_records
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `record_date` date NOT NULL,
  `status` enum('มา','ลา','ขาด') NOT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uk_attendance` (`child_id`,`record_date`),
  KEY `child_id` (`child_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `fk_attendance_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `fk_attendance_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.attendance_records: ~2 rows (approximately)
DELETE FROM `attendance_records`;
INSERT INTO `attendance_records` (`attendance_id`, `child_id`, `teacher_id`, `record_date`, `status`, `note`, `created_at`) VALUES
	(5, 2, 2, '2026-03-22', 'มา', NULL, '2026-03-22 12:36:43'),
	(6, 2, 2, '2026-03-29', 'มา', NULL, '2026-03-29 07:14:23');

-- Dumping structure for table carechild_db.centers
CREATE TABLE IF NOT EXISTS `centers` (
  `center_id` int NOT NULL AUTO_INCREMENT,
  `school_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LGO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ORG_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.centers: ~1 rows (approximately)
DELETE FROM `centers`;
INSERT INTO `centers` (`center_id`, `school_id`, `name`, `district`, `province`, `phone`, `email`, `LGO`, `ORG_code`, `created_at`) VALUES
	(1, '3030615601', 'ศพด.ตำบลหนองน้ำแดง', 'ปากช่อง', 'นครราชสีมา', '044000360', 'www.nongnamdaeng.go.th', 'อบต.หนองน้ำแดง', '06302109', '2025-12-20 03:39:03');

-- Dumping structure for table carechild_db.children
CREATE TABLE IF NOT EXISTS `children` (
  `child_id` int NOT NULL AUTO_INCREMENT,
  `child_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classroom_id` int DEFAULT NULL,
  `prefix` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `citizen_id` varchar(13) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apply_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ethnicity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `treatment` text COLLATE utf8mb4_unicode_ci,
  `vaccine` text COLLATE utf8mb4_unicode_ci,
  `enter_study` date DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `enrollment_id` int DEFAULT NULL,
  `oral_health` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_weight` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_height` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reimbursment` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สิทธิ์เบิกจ่าย',
  `eat` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'การรับประทานอาหาร',
  `needs` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ความต้องการพิเศษ',
  `father_prefix` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_firstname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_lastname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_prefix` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_firstname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_lastname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_job` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_salary` decimal(10,2) DEFAULT NULL,
  `mother_job` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_salary` decimal(10,2) DEFAULT NULL,
  `center_id` int DEFAULT NULL,
  PRIMARY KEY (`child_id`),
  UNIQUE KEY `enrollment_id` (`enrollment_id`),
  UNIQUE KEY `uk_child_code` (`child_code`),
  UNIQUE KEY `uk_child_citizen` (`citizen_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `fk_child_center` (`center_id`),
  CONSTRAINT `children_ibfk_1` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`),
  CONSTRAINT `fk_child_center` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`),
  CONSTRAINT `fk_children_enrollment` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`enrollment_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.children: ~0 rows (approximately)
DELETE FROM `children`;
INSERT INTO `children` (`child_id`, `child_code`, `classroom_id`, `prefix`, `first_name`, `last_name`, `nickname`, `birth_date`, `citizen_id`, `apply_level`, `ethnicity`, `nationality`, `religion`, `blood`, `treatment`, `vaccine`, `enter_study`, `note`, `created_at`, `enrollment_id`, `oral_health`, `birth_weight`, `birth_height`, `reimbursment`, `eat`, `needs`, `father_prefix`, `father_firstname`, `father_lastname`, `father_phone`, `mother_prefix`, `mother_firstname`, `mother_lastname`, `mother_phone`, `guardian_name`, `guardian_phone`, `father_job`, `father_salary`, `mother_job`, `mother_salary`, `center_id`) VALUES
	(1, 'STD1773922306155', 1, 'เด็กชาย', 'ธันวา', 'ใจดี', 'วา', '2022-07-09', '1103700001111', 'ต่ำกว่า 3 ปี', 'ไทย', 'ไทย', 'พุทธ', 'O', 'ไม่มี', 'ได้รับวัคซีนแล้ว', NULL, NULL, '2026-03-19 12:11:46', 2, NULL, '25', '80', NULL, NULL, NULL, 'นาย', 'สมชาย', 'ใจดี', '0891110003', 'นาง', 'สมหญิง', 'ใจดี', '0891110002', NULL, NULL, 'ช่างไฟ', 15000.00, 'ค้าขาย', 12000.00, 1),
	(2, NULL, 1, 'เด็กชาย', 'ธนภัทร', 'สุขใจ', 'ต้นกล้า', '2022-06-10', '1234567830123', 'ต่ำกว่า 3 ปี', 'ไทย', 'ไทย', 'พุทธ', 'O', 'ไม่มี', 'ได้รับวัคซีนแล้ว', '2026-03-21', NULL, '2026-03-21 03:50:27', 1, NULL, '20', '50', NULL, NULL, NULL, 'นาย', 'สมชาย', 'สุขใจ', '0861234567', 'นาง', 'สมหญิง', 'สุขใจ', '0898765432', ' ', NULL, 'พนักงานบริษัท', 18000.00, 'ค้าขาย', 12000.00, 1),
	(3, '69035', 1, 'เด็กชาย', 'กิตติพงษ์', 'แสนดี', 'ต้น', '2023-02-02', '1103700007777', 'ต่ำกว่า 3 ปี', 'ไทย', 'ไทย', 'พุทธ', 'B', 'ไม่มี', 'ได้รับวัคซีนแล้ว', '2026-04-04', NULL, '2026-04-05 12:39:42', 3, NULL, '15', '94', NULL, NULL, NULL, 'นาย', 'วีระศักดิ์', 'แสนดี', '0843334444', 'นาง', 'จุฑามาศ', 'แสนดี', '0842223333', ' ', NULL, 'ผู้จัดการฝ่ายบุคคล', 30000.00, 'แม่บ้าน', 8000.00, 1);

-- Dumping structure for table carechild_db.child_food_allergies
CREATE TABLE IF NOT EXISTS `child_food_allergies` (
  `allergy_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int DEFAULT NULL,
  `food_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`allergy_id`),
  KEY `child_id` (`child_id`),
  CONSTRAINT `child_food_allergies_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.child_food_allergies: ~0 rows (approximately)
DELETE FROM `child_food_allergies`;
INSERT INTO `child_food_allergies` (`allergy_id`, `child_id`, `food_name`, `note`) VALUES
	(1, 1, 'นมวัว', NULL),
	(2, 2, 'แพ้นมวัว', NULL),
	(3, 3, 'กุ้ง', NULL);

-- Dumping structure for table carechild_db.classrooms
CREATE TABLE IF NOT EXISTS `classrooms` (
  `classroom_id` int NOT NULL AUTO_INCREMENT,
  `center_id` int NOT NULL,
  `classroom_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`classroom_id`),
  KEY `center_id` (`center_id`),
  CONSTRAINT `classrooms_ibfk_1` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.classrooms: ~3 rows (approximately)
DELETE FROM `classrooms`;
INSERT INTO `classrooms` (`classroom_id`, `center_id`, `classroom_name`, `created_at`) VALUES
	(1, 1, 'ห้องต่ำกว่า 3 ขวบ', '2025-12-20 03:46:30'),
	(2, 1, 'ห้อง 3 ขวบ', '2025-12-20 03:46:30'),
	(3, 1, 'จบการศึกษา', '2026-02-14 10:25:43');

-- Dumping structure for table carechild_db.daily_menu
CREATE TABLE IF NOT EXISTS `daily_menu` (
  `daily_menu_id` int NOT NULL AUTO_INCREMENT,
  `center_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `menu_date` date DEFAULT NULL,
  `main_menu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stir_menu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `soup_menu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fried_menu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dessert_menu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`daily_menu_id`),
  KEY `center_id` (`center_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `daily_menu_ibfk_1` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`),
  CONSTRAINT `daily_menu_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `teachers` (`teacher_id`),
  CONSTRAINT `daily_menu_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.daily_menu: ~0 rows (approximately)
DELETE FROM `daily_menu`;
INSERT INTO `daily_menu` (`daily_menu_id`, `center_id`, `teacher_id`, `menu_date`, `main_menu`, `stir_menu`, `soup_menu`, `fried_menu`, `dessert_menu`, `note`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
	(1, 1, 2, '2026-03-23', 'ข้าว', 'ผัดกกระเพรา', 'ต้มจืดเยื้อไผ่', 'ไก่ทอด', 'ขนมชั้น', '', NULL, '2026-03-23 06:27:48', NULL, NULL),
	(2, 1, 2, '2026-03-29', ' ก๋วยเตี๋ยวน้้าเส้นหมี่เหลืองไก่ตุ๋น ลูกชิ้น เลือด ถั่วงอก ผักกางตุ้ง', '', '', ' เกี๊ยวทอด', 'ขนมถ้วย', '', NULL, '2026-03-29 09:23:46', NULL, NULL);

-- Dumping structure for table carechild_db.development_assessments
CREATE TABLE IF NOT EXISTS `development_assessments` (
  `assessment_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `parent_id` int NOT NULL,
  `assessment_date` date NOT NULL,
  `total_good` int NOT NULL,
  `result_level` text,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assessment_id`),
  KEY `fk_dev_assess_child` (`child_id`),
  KEY `fk_dev_assess_parent` (`parent_id`),
  CONSTRAINT `fk_dev_assess_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dev_assess_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.development_assessments: ~4 rows (approximately)
DELETE FROM `development_assessments`;
INSERT INTO `development_assessments` (`assessment_id`, `child_id`, `parent_id`, `assessment_date`, `total_good`, `result_level`, `note`, `created_at`) VALUES
	(1, 2, 1, '2026-03-22', 29, 'ควรส่งเสริมเพิ่มเติม', NULL, '2026-03-22 05:29:44'),
	(2, 2, 1, '2026-03-22', 32, 'สมวัย', NULL, '2026-03-22 05:32:36'),
	(3, 2, 1, '2026-03-22', 9, 'ควรปรึกษาครูหรือผู้เชี่ยวชาญ', NULL, '2026-03-22 05:33:30'),
	(4, 2, 1, '2026-03-22', 0, 'ควรปรึกษาครูหรือผู้เชี่ยวชาญ', NULL, '2026-03-22 07:57:37');

-- Dumping structure for table carechild_db.development_items
CREATE TABLE IF NOT EXISTS `development_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_no` int NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.development_items: ~20 rows (approximately)
DELETE FROM `development_items`;
INSERT INTO `development_items` (`item_id`, `item_no`, `description`) VALUES
	(1, 1, 'เด็กสามารถวิ่งและหยุดได้เองโดยไม่ล้ม'),
	(2, 2, 'เด็กสามารถกระโดดสองเท้าพร้อมกันได้'),
	(3, 3, 'เด็กสามารถจับดินสอ/ช้อน/ชะแลงได้อย่างถูกวิธี'),
	(4, 4, 'เด็กสามารถวาดวงกลมหรือเส้นตรงได้'),
	(5, 5, 'เด็กสามารถช่วยตัวเองในการแต่งตัวบางส่วน (เช่น ใส่รองเท้า เสื้อผ้า)'),
	(6, 6, 'เด็กสามารถรอคอยได้เมื่อผู้ใหญ่บอกให้รอ'),
	(7, 7, 'เด็กแสดงออกด้วยสีหน้า/ท่าทางเมื่อดีใจ เสียใจ หรือโกรธ'),
	(8, 8, 'เด็กสงบอารมณ์ได้ภายในเวลาไม่นานเมื่อไม่พอใจ'),
	(9, 9, 'เด็กมีความมั่นใจเมื่อทำสิ่งใหม่ๆ'),
	(10, 10, 'เด็กกล้าแสดงออกในกิจกรรม เช่น พูด/ร้องเพลง/เล่านิทาน'),
	(11, 11, 'เด็กสามารถเล่นกับเพื่อนโดยไม่ทะเลาะบ่อย'),
	(12, 12, 'เด็กยอมแบ่งปันของเล่นหรือขนมกับผู้อื่น'),
	(13, 13, 'เด็กทักทายผู้ใหญ่หรือเพื่อนเมื่อเจอกัน'),
	(14, 14, 'เด็กทำตามข้อตกลงง่ายๆ ที่ผู้ใหญ่กำหนดได้'),
	(15, 15, 'เด็กสามารถขอโทษหรือขอบคุณได้เมื่อเหมาะสม'),
	(16, 16, 'เด็กสามารถฟังและทำตามคำสั่งง่ายๆ ได้ถูกต้อง'),
	(17, 17, 'เด็กสามารถเล่าเหตุการณ์หรือเล่าเรื่องสั้นๆ ได้'),
	(18, 18, 'เด็กรู้จักชื่อสิ่งของหรือบุคคลใกล้ตัวได้ถูกต้อง'),
	(19, 19, 'เด็กสามารถนับจำนวนสิ่งของ 1–10 ได้'),
	(20, 20, 'เด็กชอบซักถาม/สงสัยเกี่ยวกับสิ่งรอบตัว');

-- Dumping structure for table carechild_db.development_results
CREATE TABLE IF NOT EXISTS `development_results` (
  `result_id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `item_id` int NOT NULL,
  `level_id` tinyint NOT NULL COMMENT '3=ดี, 2=พอใช้, 1=ควรปรับปรุง',
  PRIMARY KEY (`result_id`),
  KEY `fk_dev_result_assessment` (`assessment_id`),
  KEY `fk_dev_result_item` (`item_id`),
  CONSTRAINT `fk_dev_result_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `development_assessments` (`assessment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dev_result_item` FOREIGN KEY (`item_id`) REFERENCES `development_items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.development_results: ~80 rows (approximately)
DELETE FROM `development_results`;
INSERT INTO `development_results` (`result_id`, `assessment_id`, `item_id`, `level_id`) VALUES
	(1, 1, 1, 3),
	(2, 1, 2, 3),
	(3, 1, 3, 3),
	(4, 1, 4, 3),
	(5, 1, 5, 3),
	(6, 1, 6, 2),
	(7, 1, 7, 2),
	(8, 1, 8, 2),
	(9, 1, 9, 2),
	(10, 1, 10, 2),
	(11, 1, 11, 2),
	(12, 1, 12, 2),
	(13, 1, 13, 2),
	(14, 1, 14, 2),
	(15, 1, 15, 2),
	(16, 1, 16, 2),
	(17, 1, 17, 3),
	(18, 1, 18, 3),
	(19, 1, 19, 3),
	(20, 1, 20, 3),
	(21, 2, 1, 3),
	(22, 2, 2, 3),
	(23, 2, 3, 3),
	(24, 2, 4, 3),
	(25, 2, 5, 3),
	(26, 2, 6, 3),
	(27, 2, 7, 3),
	(28, 2, 8, 3),
	(29, 2, 9, 3),
	(30, 2, 10, 3),
	(31, 2, 11, 3),
	(32, 2, 12, 3),
	(33, 2, 13, 2),
	(34, 2, 14, 2),
	(35, 2, 15, 2),
	(36, 2, 16, 2),
	(37, 2, 17, 2),
	(38, 2, 18, 2),
	(39, 2, 19, 2),
	(40, 2, 20, 2),
	(41, 3, 1, 1),
	(42, 3, 2, 1),
	(43, 3, 3, 1),
	(44, 3, 4, 2),
	(45, 3, 5, 2),
	(46, 3, 6, 2),
	(47, 3, 7, 2),
	(48, 3, 8, 2),
	(49, 3, 9, 1),
	(50, 3, 10, 1),
	(51, 3, 11, 1),
	(52, 3, 12, 1),
	(53, 3, 13, 1),
	(54, 3, 14, 1),
	(55, 3, 15, 1),
	(56, 3, 16, 2),
	(57, 3, 17, 2),
	(58, 3, 18, 2),
	(59, 3, 19, 2),
	(60, 3, 20, 1),
	(61, 4, 1, 1),
	(62, 4, 2, 1),
	(63, 4, 3, 1),
	(64, 4, 4, 1),
	(65, 4, 5, 1),
	(66, 4, 6, 1),
	(67, 4, 7, 1),
	(68, 4, 8, 1),
	(69, 4, 9, 1),
	(70, 4, 10, 1),
	(71, 4, 11, 1),
	(72, 4, 12, 1),
	(73, 4, 13, 1),
	(74, 4, 14, 1),
	(75, 4, 15, 1),
	(76, 4, 16, 1),
	(77, 4, 17, 1),
	(78, 4, 18, 1),
	(79, 4, 19, 1),
	(80, 4, 20, 1);

-- Dumping structure for table carechild_db.enrollments
CREATE TABLE IF NOT EXISTS `enrollments` (
  `enrollment_id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL,
  `center_id` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `extra_json` json DEFAULT NULL,
  `files_json` json DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  PRIMARY KEY (`enrollment_id`),
  KEY `parent_id` (`parent_id`),
  KEY `center_id` (`center_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`),
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.enrollments: ~0 rows (approximately)
DELETE FROM `enrollments`;
INSERT INTO `enrollments` (`enrollment_id`, `parent_id`, `center_id`, `status`, `note`, `extra_json`, `files_json`, `created_by`, `created_at`, `approved_at`, `approved_by`) VALUES
	(1, 1, 1, 'approved', NULL, '{"prefix": "เด็กชาย", "reg_moo": "5", "vaccine": "ได้รับวัคซีนแล้ว", "curr_moo": "5", "nickname": "ต้นกล้า", "religion": "พุทธ", "ethnicity": "ไทย", "last_name": "สุขใจ", "birth_date": "2022-06-10", "citizen_id": "1234567830123", "father_job": "พนักงานบริษัท", "first_name": "ธนภัทร", "mother_job": "ค้าขาย", "reg_amphur": "ปากช่อง", "reg_tambon": "หนองน้ำแดง", "apply_level": "ต่ำกว่า 3 ปี", "blood_group": "O", "child_order": "1", "curr_amphur": "ปากช่อง", "curr_tambon": "หนองน้ำแดง", "nationality": "ไทย", "birth_height": "50", "birth_weight": "20", "drug_allergy": "ไม่มี", "father_blood": "O", "father_phone": "0861234567", "food_allergy": "แพ้นมวัว", "mother_blood": "A", "mother_phone": "0898765432", "reg_house_no": "99/1", "reg_postcode": "30130", "reg_province": "นครราชสีมา", "sender_phone": "0898765432", "caregiver_job": "", "curr_house_no": "99/1", "curr_postcode": "30130", "curr_province": "นครราชสีมา", "father_idcard": "3456789012345", "father_income": "18000", "father_prefix": "นาย", "male_siblings": "ไม่", "mother_idcard": "2345678901234", "mother_income": "12000", "mother_prefix": "นาง", "sender_prefix": "นาง", "child_behavior": "เงียบๆ", "father_reg_moo": "5", "mother_reg_moo": "5", "total_siblings": "ไม่มี", "additional_info": "ไม่มี", "caregiver_phone": "", "emergency_phone": "0898765432", "father_curr_moo": "5", "father_lastname": "สุขใจ", "father_religion": "พุทธ", "female_siblings": "ไม่", "genetic_disease": "ไม่มี", "illness_history": "ไม่มี", "mother_curr_moo": "5", "mother_lastname": "สุขใจ", "mother_religion": "พุทธ", "previous_school": "ไม่เคย", "sender_lastname": "สุขใจ", "sender_relation": "มาราดา", "care_responsible": "บิดาและมารดา", "caregiver_income": "", "caregiver_prefix": "", "father_birthdate": "1990-07-09", "father_ethnicity": "ไทย", "father_firstname": "สมชาย", "mother_birthdate": "1995-03-15", "mother_ethnicity": "ไทย", "mother_firstname": "สมหญิง", "sender_firstname": "สมหญิง", "father_reg_amphur": "ปากช่อง", "father_reg_tambon": "หนองน้ำแดง", "mother_reg_amphur": "ปากช่อง", "mother_reg_tambon": "หนองน้ำแดง", "self_help_ability": "สามารถกินข้าวได้บางครั้ง", "caregiver_lastname": "", "congenital_disease": "ไม่มี", "father_curr_amphur": "ปากช่อง", "father_curr_tambon": "หนองน้ำแดง", "father_nationality": "ไทย", "mother_curr_amphur": "ปากช่อง", "mother_curr_tambon": "หนองน้ำแดง", "mother_nationality": "ไทย", "caregiver_firstname": "", "father_reg_house_no": "99/1", "father_reg_province": "นครราชสีมา", "mother_reg_house_no": "99/1", "mother_reg_province": "นครราชสีมา", "father_curr_house_no": "99/1", "father_curr_province": "นครราชสีมา", "mother_curr_house_no": "99/1", "mother_curr_province": "นครราชสีมา"}', '{"child_house_reg": "/uploads/enrollments/1773658891043_child_house_reg.png", "father_house_reg": "/uploads/enrollments/1773658891047_father_house_reg.jpg", "mother_house_reg": "/uploads/enrollments/1773658891048_mother_house_reg.jpg", "father_idcard_file": "/uploads/enrollments/1773658891044_father_idcard_file.png", "mother_idcard_file": "/uploads/enrollments/1773658891048_mother_idcard_file.jpg", "child_birth_certificate": "/uploads/enrollments/1773658891029_child_birth_certificate.jpg"}', 41, '2026-03-16 11:01:31', '2026-03-21 03:50:28', 1),
	(2, 2, 1, 'approved', NULL, '{"prefix": "เด็กชาย", "reg_moo": "3", "vaccine": "ได้รับวัคซีนแล้ว", "curr_moo": "1", "nickname": "วา", "reg_road": "มิตรภาพ", "religion": "พุทธ", "curr_road": "-", "ethnicity": "ไทย", "last_name": "ใจดี", "birth_date": "2022-07-10", "citizen_id": "1103700001111", "father_job": "ช่างไฟ", "first_name": "ธันวา", "mother_job": "ค้าขาย", "reg_amphur": "เมือง", "reg_tambon": "ในเมือง", "apply_level": "ต่ำกว่า 3 ปี", "blood_group": "O", "child_order": "2", "curr_amphur": "ปากช่อง", "curr_tambon": "หนองน้ำแดง", "nationality": "ไทย", "birth_height": "80", "birth_weight": "25", "drug_allergy": "ไม่มี", "father_blood": "B", "father_phone": "0891110003", "food_allergy": "นมวัว", "mother_blood": "A", "mother_phone": "0891110002", "reg_house_no": "12/5", "reg_postcode": "30130", "reg_province": "นครราชสีมา", "sender_phone": "0891110002", "caregiver_job": "", "curr_house_no": "315", "curr_postcode": "30130", "curr_province": "นคราชสีมา", "father_idcard": "1103700003333", "father_income": "15000", "father_prefix": "นาย", "male_siblings": "1", "mother_idcard": "1103700002222", "mother_income": "12000", "mother_prefix": "นาง", "sender_prefix": "นาง", "child_behavior": "ร่าเริง", "father_reg_moo": "3", "mother_reg_moo": "3", "total_siblings": "2", "additional_info": "ไม่มี", "caregiver_phone": "", "emergency_phone": "0891110002", "father_curr_moo": "1", "father_lastname": "ใจดี", "father_reg_road": "มิตรภาพ", "father_religion": "พุทธ", "female_siblings": "1", "genetic_disease": "ไม่มี", "illness_history": "ไม่มี", "mother_curr_moo": "1", "mother_lastname": "ใจดี", "mother_reg_road": "มิตรภาพ", "mother_religion": "พุทธ", "previous_school": "ไม่เคย", "sender_lastname": "ใจดี", "sender_relation": "แม่", "care_responsible": "บิดาและมารดา", "caregiver_income": "", "caregiver_prefix": "", "father_birthdate": "1990-05-10", "father_curr_road": "-", "father_ethnicity": "ไทย", "father_firstname": "สมชาย", "mother_birthdate": "1995-03-02", "mother_curr_road": "-", "mother_ethnicity": "ไทย", "mother_firstname": "สมหญิง", "sender_firstname": "สมหญิง", "father_reg_amphur": "เมือง", "father_reg_tambon": "ในเมือง", "mother_reg_amphur": "เมือง", "mother_reg_tambon": "ในเมือง", "self_help_ability": "กินข้าวเองได้", "caregiver_lastname": "", "congenital_disease": "ไม่มี", "father_curr_amphur": "ปากช่อง", "father_curr_tambon": "หนองน้ำแดง", "father_nationality": "ไทย", "mother_curr_amphur": "ปากช่อง", "mother_curr_tambon": "หนองน้ำแดง", "mother_nationality": "ไทย", "caregiver_firstname": "", "father_reg_house_no": "12/5", "father_reg_province": "นครราชสีมา", "mother_reg_house_no": "12/5", "mother_reg_province": "นครราชสีมา", "father_curr_house_no": "315", "father_curr_province": "นครราชสีมา", "mother_curr_house_no": "315", "mother_curr_province": "นครราชสีมา"}', '{"child_house_reg": "/uploads/enrollments/1773891910705_child_house_reg.jpg", "father_house_reg": "/uploads/enrollments/1773891910712_father_house_reg.jpg", "mother_house_reg": "/uploads/enrollments/1773891910715_mother_house_reg.png", "father_idcard_file": "/uploads/enrollments/1773891910709_father_idcard_file.jpg", "mother_idcard_file": "/uploads/enrollments/1773891910714_mother_idcard_file.jpg", "child_birth_certificate": "/uploads/enrollments/1773891910699_child_birth_certificate.png"}', 46, '2026-03-19 03:45:10', '2026-03-19 12:11:46', 1),
	(3, 3, 1, 'approved', NULL, '{"prefix": "เด็กชาย", "reg_moo": "7", "vaccine": "ได้รับวัคซีนแล้ว", "curr_moo": "7", "nickname": "ต้น", "reg_road": "มิตรภาพ", "religion": "พุทธ", "curr_road": "มิตรภาพ", "ethnicity": "ไทย", "last_name": "แสนดี", "birth_date": "2023-02-03", "citizen_id": "1103700007777", "father_job": "ผู้จัดการฝ่ายบุคคล", "first_name": "กิตติพงษ์", "mother_job": "แม่บ้าน", "reg_amphur": "ปากช่อง", "reg_tambon": "กลางดง", "apply_level": "ต่ำกว่า 3 ปี", "blood_group": "B", "child_order": "2", "curr_amphur": "ปากช่อง", "curr_tambon": "กลางดง", "nationality": "ไทย", "birth_height": "94", "birth_weight": "15", "drug_allergy": "ไม่แพ้ยา", "father_blood": "B", "father_phone": "0843334444", "food_allergy": "กุ้ง", "mother_blood": "B", "mother_phone": "0842223333", "reg_house_no": "129", "reg_postcode": "30130", "reg_province": "นครราชสีมา", "sender_phone": "0842223333", "caregiver_job": "", "curr_house_no": "129", "curr_postcode": "30130", "curr_province": "นครราชสีมา", "father_idcard": "1103700008888", "father_income": "30000", "father_prefix": "นาย", "male_siblings": "1", "mother_idcard": "1103700009999", "mother_income": "8000", "mother_prefix": "นาง", "sender_prefix": "นาง", "child_behavior": "ร่าเริงพูดเก่ง", "father_reg_moo": "7", "mother_reg_moo": "1", "total_siblings": "2", "additional_info": "ไม่มี", "caregiver_phone": "", "emergency_phone": "0842223333", "father_curr_moo": "7", "father_lastname": "แสนดี", "father_reg_road": "มิตรภาพ", "father_religion": "พุทธ", "female_siblings": "ไม่มี", "genetic_disease": "ไม่มี", "illness_history": "ไม่มี", "mother_curr_moo": "1", "mother_lastname": "แสนดี", "mother_reg_road": "มิตรภาพ", "mother_religion": "พุทธ", "previous_school": "ไม่เคย", "sender_lastname": "แสนดี", "sender_relation": "มารดา", "care_responsible": "บิดาและมารดา", "caregiver_income": "", "caregiver_prefix": "", "father_birthdate": "1998-10-05", "father_curr_road": "มิตรภาพ", "father_ethnicity": "ไทย", "father_firstname": "วีระศักดิ์", "mother_birthdate": "1999-03-10", "mother_curr_road": "มิตรภาพ", "mother_ethnicity": "ไทย", "mother_firstname": "จุฑามาศ", "sender_firstname": "จุฑามาศ", "father_reg_amphur": "ปากช่อง", "father_reg_tambon": "กลางดง", "mother_reg_amphur": "ปากช่อง", "mother_reg_tambon": "กลางดง", "self_help_ability": "กินข้าวเองได้บางครั้งใส่รองเท้าเองได้", "caregiver_lastname": "", "congenital_disease": "ไม่มี", "father_curr_amphur": "ปากช่อง", "father_curr_tambon": "กลางดง", "father_nationality": "ไทย", "mother_curr_amphur": "ปากช่อง", "mother_curr_tambon": "กลางดง", "mother_nationality": "ไทย", "caregiver_firstname": "", "father_reg_house_no": "129", "father_reg_province": "นครราชสีมา", "mother_reg_house_no": "129", "mother_reg_province": "นครราชสีมา", "father_curr_house_no": "129", "father_curr_province": "นครราชสีมา", "mother_curr_house_no": "129", "mother_curr_province": "นครราชสีมา"}', '{"child_house_reg": "/uploads/enrollments/1775391194453_child_house_reg.png", "father_house_reg": "/uploads/enrollments/1775391194456_father_house_reg.png", "mother_house_reg": "/uploads/enrollments/1775391194461_mother_house_reg.png", "father_idcard_file": "/uploads/enrollments/1775391194454_father_idcard_file.png", "mother_idcard_file": "/uploads/enrollments/1775391194460_mother_idcard_file.jpg", "child_birth_certificate": "/uploads/enrollments/1775391194451_child_birth_certificate.png"}', 52, '2026-04-05 12:13:14', '2026-04-05 12:39:42', 1);

-- Dumping structure for table carechild_db.health_evaluations
CREATE TABLE IF NOT EXISTS `health_evaluations` (
  `health_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `evaluation_date` date DEFAULT NULL,
  `hair_condition` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oral_cavity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fingernail` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toenail` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`health_id`),
  KEY `child_id` (`child_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `health_evaluations_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `health_evaluations_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.health_evaluations: ~5 rows (approximately)
DELETE FROM `health_evaluations`;
INSERT INTO `health_evaluations` (`health_id`, `child_id`, `teacher_id`, `evaluation_date`, `hair_condition`, `oral_cavity`, `fingernail`, `toenail`, `note`, `created_at`) VALUES
	(1, 1, 2, '2026-03-22', NULL, NULL, NULL, NULL, NULL, '2026-03-22 12:50:46'),
	(2, 2, 2, '2026-03-22', NULL, NULL, NULL, NULL, NULL, '2026-03-22 12:50:46'),
	(3, 2, 2, '2026-03-29', 'ดี', 'ดี', 'ปานกลาง', 'ดี', NULL, '2026-03-29 07:13:37'),
	(4, 2, 2, '2026-03-29', 'ดี', 'ดี', 'ดี', 'ดี', NULL, '2026-03-29 07:13:37'),
	(5, 2, 2, '2026-03-29', 'ดี', 'ปานกลาง', 'ปานกลาง', 'ดี', NULL, '2026-03-29 07:13:57');

-- Dumping structure for table carechild_db.images
CREATE TABLE IF NOT EXISTS `images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `ref_id` int DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ref_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `announcement_id` (`ref_id`),
  KEY `idx_images_ref` (`ref_type`,`ref_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.images: ~0 rows (approximately)
DELETE FROM `images`;
INSERT INTO `images` (`image_id`, `ref_id`, `image_url`, `created_at`, `ref_type`) VALUES
	(1, 50, '/uploads/1774069816252-pofi.jpg', '2026-03-21 12:10:16', 'user'),
	(2, 2, '/uploads/1775440736052-526313493_1174570298043919_2528327708251543478_n.jpg', '2026-04-06 08:58:56', 'announcement'),
	(3, 2, '/uploads/1775440736145-526323183_1174570541377228_5046944051812084424_n.jpg', '2026-04-06 08:58:56', 'announcement'),
	(4, 2, '/uploads/1775440736201-526554556_1174570448043904_511620717638604871_n.jpg', '2026-04-06 08:58:56', 'announcement'),
	(5, 2, '/uploads/1775440736218-526640768_1174570848043864_3318632806599150905_n.jpg', '2026-04-06 08:58:56', 'announcement'),
	(6, 2, '/uploads/1775440736246-526671130_1174570434710572_4497356262343125380_n.jpg', '2026-04-06 08:58:56', 'announcement'),
	(7, 1, '/uploads/1775440749620-605760134_1304834668340865_531717625413360787_n.jpg', '2026-04-06 08:59:09', 'announcement');

-- Dumping structure for table carechild_db.lunch_records
CREATE TABLE IF NOT EXISTS `lunch_records` (
  `lunch_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `record_date` date NOT NULL,
  `status` enum('รับประทาน','ยังไม่รับประทาน') DEFAULT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lunch_id`),
  UNIQUE KEY `uk_lunch` (`child_id`,`record_date`),
  KEY `child_id` (`child_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `fk_lunch_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `fk_lunch_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.lunch_records: ~0 rows (approximately)
DELETE FROM `lunch_records`;
INSERT INTO `lunch_records` (`lunch_id`, `child_id`, `teacher_id`, `record_date`, `status`, `note`, `created_at`) VALUES
	(1, 2, 2, '2026-03-23', 'รับประทาน', NULL, '2026-03-23 03:47:58'),
	(2, 2, 2, '2026-03-29', 'รับประทาน', NULL, '2026-03-29 08:17:18');

-- Dumping structure for table carechild_db.milk_records
CREATE TABLE IF NOT EXISTS `milk_records` (
  `milk_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `record_date` date NOT NULL,
  `status` enum('ดื่ม','ไม่ดื่ม') DEFAULT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`milk_id`),
  UNIQUE KEY `uk_milk` (`child_id`,`record_date`),
  KEY `child_id` (`child_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `fk_milk_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `fk_milk_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.milk_records: ~0 rows (approximately)
DELETE FROM `milk_records`;
INSERT INTO `milk_records` (`milk_id`, `child_id`, `teacher_id`, `record_date`, `status`, `note`, `created_at`) VALUES
	(1, 2, 2, '2026-03-23', 'ดื่ม', NULL, '2026-03-23 03:41:57');

-- Dumping structure for table carechild_db.monthly_measurements
CREATE TABLE IF NOT EXISTS `monthly_measurements` (
  `measurement_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `measurement_date` date DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`measurement_id`),
  KEY `child_id` (`child_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `monthly_measurements_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `monthly_measurements_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.monthly_measurements: ~2 rows (approximately)
DELETE FROM `monthly_measurements`;
INSERT INTO `monthly_measurements` (`measurement_id`, `child_id`, `teacher_id`, `measurement_date`, `weight`, `height`, `note`, `created_at`) VALUES
	(1, 2, 2, '2026-03-29', 21.00, 101.00, NULL, '2026-03-29 06:33:42'),
	(2, 2, 2, '2026-03-29', 21.00, 101.00, NULL, '2026-03-29 07:14:18');

-- Dumping structure for table carechild_db.parents
CREATE TABLE IF NOT EXISTS `parents` (
  `parent_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `prefix` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `center_id` int DEFAULT '1',
  PRIMARY KEY (`parent_id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_parents_user` (`user_id`),
  KEY `fk_parent_center` (`center_id`),
  CONSTRAINT `fk_parent_center` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`),
  CONSTRAINT `fk_parent_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.parents: ~1 rows (approximately)
DELETE FROM `parents`;
INSERT INTO `parents` (`parent_id`, `user_id`, `prefix`, `first_name`, `last_name`, `phone`, `created_at`, `center_id`) VALUES
	(1, 41, 'นาง', 'สมหญิง', 'สุขใจ', '0898765432', '2026-03-14 10:46:03', 1),
	(2, 46, 'นาง', 'สมหญิง', 'สุขใจ', '0891110002', '2026-03-19 03:26:56', 1),
	(3, 52, 'นาง', 'จุฑามาส', 'แสนดี', '0842223333', '2026-04-05 11:58:57', 1);

-- Dumping structure for table carechild_db.relation
CREATE TABLE IF NOT EXISTS `relation` (
  `relation_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `parent_id` int NOT NULL,
  `relationship` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0' COMMENT '1=ผู้ปกครองหลัก',
  PRIMARY KEY (`relation_id`),
  KEY `child_id` (`child_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `relation_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `relation_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.relation: ~0 rows (approximately)
DELETE FROM `relation`;
INSERT INTO `relation` (`relation_id`, `child_id`, `parent_id`, `relationship`, `is_primary`) VALUES
	(1, 1, 2, 'ผู้ปกครอง', 1),
	(2, 2, 1, 'ผู้ปกครอง', 1),
	(3, 3, 3, 'ผู้ปกครอง', 1);

-- Dumping structure for table carechild_db.student_enrollments
CREATE TABLE IF NOT EXISTS `student_enrollments` (
  `enrollment_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `classroom_id` int NOT NULL,
  `academic_year` int NOT NULL,
  `status` enum('studying','graduated','transferred') COLLATE utf8mb4_unicode_ci DEFAULT 'studying',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`enrollment_id`),
  KEY `child_id` (`child_id`),
  KEY `classroom_id` (`classroom_id`),
  CONSTRAINT `student_enrollments_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `student_enrollments_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.student_enrollments: ~2 rows (approximately)
DELETE FROM `student_enrollments`;
INSERT INTO `student_enrollments` (`enrollment_id`, `child_id`, `classroom_id`, `academic_year`, `status`, `created_at`) VALUES
	(1, 2, 1, 2569, 'studying', '2026-03-21 03:50:27'),
	(2, 1, 1, 2569, 'graduated', '2026-03-19 12:11:46'),
	(3, 3, 1, 2569, 'studying', '2026-04-05 12:39:42'),
	(4, 1, 2, 2570, 'transferred', '2026-03-21 03:41:09');

-- Dumping structure for table carechild_db.teachers
CREATE TABLE IF NOT EXISTS `teachers` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `center_id` int NOT NULL,
  `classroom_id` int DEFAULT NULL,
  `prefix` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `center_id` (`center_id`),
  KEY `classroom_id` (`classroom_id`),
  CONSTRAINT `fk_teacher_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`),
  CONSTRAINT `teachers_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.teachers: ~2 rows (approximately)
DELETE FROM `teachers`;
INSERT INTO `teachers` (`teacher_id`, `user_id`, `center_id`, `classroom_id`, `prefix`, `first_name`, `last_name`, `phone`, `created_at`) VALUES
	(1, 50, 1, 2, 'นาย', 'ระพีพัฒน์', 'ชมพัฒน์', '0611049169', '2026-03-21 05:08:28'),
	(2, 51, 1, 1, 'นางสาว', 'ปรียาภัทร', 'ชมพัฒน์', '0981914718', '2026-03-21 05:14:23');

-- Dumping structure for table carechild_db.toothbrush_records
CREATE TABLE IF NOT EXISTS `toothbrush_records` (
  `toothbrush_id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `record_date` date NOT NULL,
  `status` enum('แปรงฟันแล้ว','ยังไม่ได้แปรงฟัน') DEFAULT 'แปรงฟันแล้ว',
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`toothbrush_id`),
  UNIQUE KEY `uk_toothbrush` (`child_id`,`record_date`),
  KEY `child_id` (`child_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `fk_toothbrush_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `fk_toothbrush_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table carechild_db.toothbrush_records: ~0 rows (approximately)
DELETE FROM `toothbrush_records`;
INSERT INTO `toothbrush_records` (`toothbrush_id`, `child_id`, `teacher_id`, `record_date`, `status`, `note`, `created_at`) VALUES
	(1, 2, 2, '2026-03-23', 'แปรงฟันแล้ว', NULL, '2026-03-23 03:33:26'),
	(2, 2, 2, '2026-03-29', 'แปรงฟันแล้ว', NULL, '2026-03-29 07:57:41');

-- Dumping structure for table carechild_db.uploads
CREATE TABLE IF NOT EXISTS `uploads` (
  `upload_id` int NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `child_id` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `center_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`upload_id`),
  KEY `child_id` (`child_id`),
  KEY `parent_id` (`parent_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `center_id` (`center_id`),
  CONSTRAINT `uploads_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`),
  CONSTRAINT `uploads_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`),
  CONSTRAINT `uploads_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`),
  CONSTRAINT `uploads_ibfk_4` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.uploads: ~12 rows (approximately)
DELETE FROM `uploads`;
INSERT INTO `uploads` (`upload_id`, `file_name`, `file_path`, `child_id`, `parent_id`, `teacher_id`, `center_id`, `created_at`) VALUES
	(1, '1773891910705_child_house_reg.jpg', '/uploads/enrollments/1773891910705_child_house_reg.jpg', 1, 2, NULL, 1, '2026-03-19 12:11:46'),
	(2, '1773891910712_father_house_reg.jpg', '/uploads/enrollments/1773891910712_father_house_reg.jpg', 1, 2, NULL, 1, '2026-03-19 12:11:46'),
	(3, '1773891910715_mother_house_reg.png', '/uploads/enrollments/1773891910715_mother_house_reg.png', 1, 2, NULL, 1, '2026-03-19 12:11:46'),
	(4, '1773891910709_father_idcard_file.jpg', '/uploads/enrollments/1773891910709_father_idcard_file.jpg', 1, 2, NULL, 1, '2026-03-19 12:11:46'),
	(5, '1773891910714_mother_idcard_file.jpg', '/uploads/enrollments/1773891910714_mother_idcard_file.jpg', 1, 2, NULL, 1, '2026-03-19 12:11:46'),
	(6, '1773891910699_child_birth_certificate.png', '/uploads/enrollments/1773891910699_child_birth_certificate.png', 1, 2, NULL, 1, '2026-03-19 12:11:46'),
	(7, '1773658891043_child_house_reg.png', '/uploads/enrollments/1773658891043_child_house_reg.png', 2, 1, NULL, 1, '2026-03-21 03:50:28'),
	(8, '1773658891047_father_house_reg.jpg', '/uploads/enrollments/1773658891047_father_house_reg.jpg', 2, 1, NULL, 1, '2026-03-21 03:50:28'),
	(9, '1773658891048_mother_house_reg.jpg', '/uploads/enrollments/1773658891048_mother_house_reg.jpg', 2, 1, NULL, 1, '2026-03-21 03:50:28'),
	(10, '1773658891044_father_idcard_file.png', '/uploads/enrollments/1773658891044_father_idcard_file.png', 2, 1, NULL, 1, '2026-03-21 03:50:28'),
	(11, '1773658891048_mother_idcard_file.jpg', '/uploads/enrollments/1773658891048_mother_idcard_file.jpg', 2, 1, NULL, 1, '2026-03-21 03:50:28'),
	(12, '1773658891029_child_birth_certificate.jpg', '/uploads/enrollments/1773658891029_child_birth_certificate.jpg', 2, 1, NULL, 1, '2026-03-21 03:50:28'),
	(13, '1775391194453_child_house_reg.png', '/uploads/enrollments/1775391194453_child_house_reg.png', 3, 3, NULL, 1, '2026-04-05 12:39:42'),
	(14, '1775391194456_father_house_reg.png', '/uploads/enrollments/1775391194456_father_house_reg.png', 3, 3, NULL, 1, '2026-04-05 12:39:42'),
	(15, '1775391194461_mother_house_reg.png', '/uploads/enrollments/1775391194461_mother_house_reg.png', 3, 3, NULL, 1, '2026-04-05 12:39:42'),
	(16, '1775391194454_father_idcard_file.png', '/uploads/enrollments/1775391194454_father_idcard_file.png', 3, 3, NULL, 1, '2026-04-05 12:39:42'),
	(17, '1775391194460_mother_idcard_file.jpg', '/uploads/enrollments/1775391194460_mother_idcard_file.jpg', 3, 3, NULL, 1, '2026-04-05 12:39:42'),
	(18, '1775391194451_child_birth_certificate.png', '/uploads/enrollments/1775391194451_child_birth_certificate.png', 3, 3, NULL, 1, '2026-04-05 12:39:42');

-- Dumping structure for table carechild_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','teacher','parent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `center_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_otp` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_expire` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `center_id` (`center_id`),
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`center_id`) REFERENCES `centers` (`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table carechild_db.users: ~4 rows (approximately)
DELETE FROM `users`;
INSERT INTO `users` (`user_id`, `username`, `email`, `password`, `role`, `center_id`, `created_at`, `reset_otp`, `reset_expire`) VALUES
	(1, 'admin', NULL, '1234', 'admin', 1, '2025-12-20 04:42:48', NULL, NULL),
	(41, 'parent02', 'somying_parent@gmail.com', '123456', 'parent', 1, '2026-03-14 10:46:03', NULL, NULL),
	(46, 'parent03', 'somyingjai@gmail.com', '123456', 'parent', 1, '2026-03-19 03:26:56', NULL, NULL),
	(50, 'theacher1', 'sunwachiraza@gmail.com', '123456', 'teacher', 1, '2026-03-21 05:08:28', NULL, NULL),
	(51, 'theacher2', 'koysunday@gmail.com', '042522', 'teacher', 1, '2026-03-21 05:14:23', NULL, NULL),
	(52, 'parent4', 'jutha@gmail.com', '112233', 'parent', 1, '2026-04-05 11:58:57', NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
