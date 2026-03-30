const contactRepo = require('../db/repository/ContactRepository');

// GET /contacts
const getContacts = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let contacts;
    if (search) {
      contacts = await contactRepo.searchContacts(req.tenant.tenantId, search);
    } else if (status) {
      contacts = await contactRepo.findByStatus(req.tenant.tenantId, status);
    } else {
      contacts = await contactRepo.findWithDealsCount(req.tenant.tenantId);
    }
    res.json(contacts);
  } catch (err) { next(err); }
};

// GET /contacts/:id
const getContact = async (req, res, next) => {
  try {
    const contact = await contactRepo.findById(req.params.id, req.tenant.tenantId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) { next(err); }
};

// POST /contacts
const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, company, status } = req.body;
    const contact = await contactRepo.create(req.tenant.tenantId, {
      name: name.trim(),
      email:   email?.toLowerCase().trim(),
      phone:   phone?.trim(),
      company: company?.trim(),
      status:  status || 'lead',
      assigned_to: req.tenant.userId,
    });
    res.status(201).json(contact);
  } catch (err) { next(err); }
};

// PUT /contacts/:id
const updateContact = async (req, res, next) => {
  try {
    const allowed = ['name','email','phone','company','status','assigned_to'];
    const data    = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const contact = await contactRepo.update(req.params.id, req.tenant.tenantId, data);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) { next(err); }
};

// DELETE /contacts/:id
const deleteContact = async (req, res, next) => {
  try {
    const deleted = await contactRepo.delete(req.params.id, req.tenant.tenantId);
    if (!deleted) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) { next(err); }
};

module.exports = { getContacts, getContact, createContact, updateContact, deleteContact };
