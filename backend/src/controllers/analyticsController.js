const pool         = require('../config/database');
const contactRepo  = require('../db/repository/ContactRepository');
const dealRepo     = require('../db/repository/DealRepository');
const activityRepo = require('../db/repository/ActivityRepository');

// GET /analytics/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant;

    const [
      totalContacts,
      totalDeals,
      pipelineSummary,
      recentActivities,
    ] = await Promise.all([
      contactRepo.count(tenantId),
      dealRepo.count(tenantId),
      dealRepo.getPipelineSummary(tenantId),
      activityRepo.getRecentForTenant(tenantId, 5),
    ]);

    // Revenue metrics
    const wonDeals = pipelineSummary.find(s => s.stage === 'closed_won');
    const totalRevenue  = parseFloat(wonDeals?.total_value || 0);
    const totalPipeline = pipelineSummary.reduce((s, r) => s + parseFloat(r.total_value || 0), 0);

    res.json({
      metrics: {
        total_contacts:   totalContacts,
        total_deals:      totalDeals,
        total_revenue:    totalRevenue,
        pipeline_value:   totalPipeline,
      },
      pipeline_by_stage: pipelineSummary,
      recent_activities:  recentActivities,
    });
  } catch (err) { next(err); }
};

module.exports = { getDashboard };
