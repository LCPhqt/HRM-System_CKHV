const { Router } = require('express');
const controller = require('../controllers/employee.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

// Áp dụng auth cho toàn bộ route nhân viên
router.use(authMiddleware);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
