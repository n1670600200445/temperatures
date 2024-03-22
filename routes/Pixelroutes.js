const express = require('express');
const router = express.Router();
const Pixelcontroller = require('../controllers/Pixelcontroller'); // ตรวจสอบ path และชื่อไฟล์ว่าถูกต้องหรือไม่

router.get('/Pixel', Pixelcontroller.Pixel);
// router.post('/save', Pixelcontroller.save);

module.exports = router;
