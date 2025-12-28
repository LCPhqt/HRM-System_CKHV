const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const {
  getMyProfile,
  updateMyProfile,
  listProfiles,
  listPublicProfiles,     // ✅ thêm
  getProfile,
  deleteProfile,
  updateProfileByAdmin,
  bootstrapProfile
} = require('../controllers/profileController');

const router = express.Router();

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, updateMyProfile);

//  STAFF + ADMIN: chỉ xem danh sách public
router.get('/public', requireAuth, listPublicProfiles);

//  ADMIN ONLY: danh sách đầy đủ
router.get('/', requireAuth, requireRole('admin'), listProfiles);
router.get('/:id', requireAuth, requireRole('admin'), getProfile);
router.put('/:id', requireAuth, requireRole('admin'), updateProfileByAdmin);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProfile);

// Dùng khi bootstrap từ identity-service
router.post('/bootstrap', bootstrapProfile);

module.exports = router;
