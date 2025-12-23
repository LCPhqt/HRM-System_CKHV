const express = require('express');
const { listUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listUsers);
router.get('/:id', requireAuth, requireRole('admin'), getUser);
router.put('/:id', requireAuth, requireRole('admin'), updateUser);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

module.exports = router;

