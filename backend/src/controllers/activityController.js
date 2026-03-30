const activityRepo = require('../db/repository/ActivityRepository');

// GET /activities
const getActivities = async (req, res, next) => {
  try {
    const activities = await activityRepo.findWithDetails(req.tenant.tenantId);
    res.json(activities);
  } catch (err) { next(err); }
};

// POST /activities
const createActivity = async (req, res, next) => {
  try {
    const { deal_id, contact_id, type, notes } = req.body;
    const activity = await activityRepo.create(req.tenant.tenantId, {
      deal_id:    deal_id    || null,
      contact_id: contact_id || null,
      type,
      notes:      notes?.trim() || null,
      created_by: req.tenant.userId,
    });
    res.status(201).json(activity);
  } catch (err) { next(err); }
};

module.exports = { getActivities, createActivity };
