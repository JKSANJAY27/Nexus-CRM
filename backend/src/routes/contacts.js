const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { getContacts, getContact, createContact, updateContact, deleteContact } = require('../controllers/contactController');

const router = Router();
router.use(auth);

router.get('/',     getContacts);
router.get('/:id',  getContact);
router.post('/',    createContact);
router.put('/:id',  updateContact);
router.delete('/:id', deleteContact);

module.exports = router;
