const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const {
  createRun,
  listRuns,
  getRun,
  updateRun,
  deleteRun,
  upsertItem,
  updateItem,
  recalc,
  exportCsv
} = require('../controllers/payrollController');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/runs', listRuns);
router.post('/runs', createRun);
router.get('/runs/:id', getRun);
router.put('/runs/:id', updateRun);
router.delete('/runs/:id', deleteRun);

router.post('/runs/:id/items', upsertItem); // upsert by user_id
router.put('/runs/:id/items/:itemId', updateItem);

router.post('/runs/:id/recalc', recalc);
router.get('/runs/:id/export', exportCsv);

module.exports = router;

