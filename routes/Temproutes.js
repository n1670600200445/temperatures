const express=require('express');
const router=express.Router();
const Tempcontroller=require('../controllers/Tempcontroller');

router.get('/Temp', Tempcontroller.Temp);

// router.get('/Table', Tempcontroller.Table);

module.exports = router;