const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { getDeals, getDeal, createDeal, updateDeal, deleteDeal, getPipelineSummary } = require('../controllers/dealController');

const router = Router();
router.use(auth);

router.get('/pipeline/summary', getPipelineSummary);
router.get('/',     getDeals);
router.get('/:id',  getDeal);
router.post('/',    createDeal);
router.put('/:id',  updateDeal);
router.delete('/:id', deleteDeal);

module.exports = router;
