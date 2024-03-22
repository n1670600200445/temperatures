const express=require('express');
const router=express.Router();
const Tablecontroller=require('../controllers/Tablecontroller');

// router.get('/Dist', Tempcontroller.Dist);

router.get('/Table', Tablecontroller.Table);

module.exports = router;