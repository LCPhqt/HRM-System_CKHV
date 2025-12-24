const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const {
  getMyProfile,
  updateMyProfile,
  listProfiles,
  getProfile,
  deleteProfile,
  updateProfileByAdmin,
  bootstrapProfile
} = require('../controllers/profileController');

const router = express.Router();

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, updateMyProfile);

router.get('/', requireAuth, requireRole('admin'), listProfiles);
router.get('/:id', requireAuth, requireRole('admin'), getProfile);
router.put('/:id', requireAuth, requireRole('admin'), updateProfileByAdmin);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProfile);
// Dùng khi bootstrap từ identity-service
router.post('/bootstrap', bootstrapProfile);

module.exports = router;

