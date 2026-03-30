const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { getActivities, createActivity } = require('../controllers/activityController');

const router = Router();
router.use(auth);

router.get('/',  getActivities);
router.post('/', createActivity);

module.exports = router;
