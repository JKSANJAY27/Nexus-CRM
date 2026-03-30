const { Router } = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { getUsers, createUser } = require('../controllers/userController');

const router = Router();

router.use(auth);

router.get('/',  getUsers);
router.post('/', requireRole('admin'), createUser);

module.exports = router;
