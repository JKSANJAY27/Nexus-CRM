const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { getDashboard } = require('../controllers/analyticsController');

const router = Router();
router.use(auth);

router.get('/dashboard', getDashboard);

module.exports = router;
