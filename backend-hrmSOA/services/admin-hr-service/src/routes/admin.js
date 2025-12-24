const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { listEmployees, getEmployee, updateEmployee, deleteEmployee, createEmployee } = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireRole('admin'), (req, _res, next) => {
  req.token = (req.headers.authorization || '').replace('Bearer ', '');
  return next();
});

router.get('/employees', listEmployees);
router.get('/employees/:id', getEmployee);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

module.exports = router;

