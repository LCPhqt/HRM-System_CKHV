const { Router } = require('express');
const employeeRoutes = require('./employee.routes');

const router = Router();

// Healthcheck cho monitoring
router.get('/health', (req, res) => res.json({ status: 'ok' }));
// Nhóm route nhân viên
router.use('/employees', employeeRoutes);

module.exports = router;
