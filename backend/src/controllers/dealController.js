const dealRepo = require('../db/repository/DealRepository');

// GET /deals
const getDeals = async (req, res, next) => {
  try {
    const { stage } = req.query;
    const deals = stage
      ? await dealRepo.findByStage(req.tenant.tenantId, stage)
      : await dealRepo.findWithContactInfo(req.tenant.tenantId);
    res.json(deals);
  } catch (err) { next(err); }
};

// GET /deals/:id
const getDeal = async (req, res, next) => {
  try {
    const deal = await dealRepo.findById(req.params.id, req.tenant.tenantId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (err) { next(err); }
};

// POST /deals
const createDeal = async (req, res, next) => {
  try {
    const { contact_id, title, value, stage, assigned_to, expected_close } = req.body;
    const deal = await dealRepo.create(req.tenant.tenantId, {
      contact_id,
      title:          title.trim(),
      value:          parseFloat(value) || 0,
      stage:          stage || 'prospecting',
      created_by:     req.tenant.userId,
      assigned_to:    assigned_to || req.tenant.userId,
      expected_close: expected_close || null,
    });
    res.status(201).json(deal);
  } catch (err) { next(err); }
};

// PUT /deals/:id
const updateDeal = async (req, res, next) => {
  try {
    const allowed = ['title','value','stage','assigned_to','expected_close','contact_id'];
    const data    = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const deal    = await dealRepo.update(req.params.id, req.tenant.tenantId, data);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (err) { next(err); }
};

// DELETE /deals/:id
const deleteDeal = async (req, res, next) => {
  try {
    const deleted = await dealRepo.delete(req.params.id, req.tenant.tenantId);
    if (!deleted) return res.status(404).json({ error: 'Deal not found' });
    res.json({ message: 'Deal deleted' });
  } catch (err) { next(err); }
};

// GET /deals/pipeline/summary
const getPipelineSummary = async (req, res, next) => {
  try {
    const summary = await dealRepo.getPipelineSummary(req.tenant.tenantId);
    res.json(summary);
  } catch (err) { next(err); }
};

module.exports = { getDeals, getDeal, createDeal, updateDeal, deleteDeal, getPipelineSummary };
