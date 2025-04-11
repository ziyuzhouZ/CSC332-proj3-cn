/**
 * 邀请码路由
 */

const express = require('express');
const router = express.Router();
const inviteCodeController = require('../controllers/inviteCode');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// 管理员路由 - 需要管理员权限
router.post('/', authMiddleware, adminMiddleware, inviteCodeController.createInviteCode);
router.get('/all', authMiddleware, adminMiddleware, inviteCodeController.getAllInviteCodes);

// 公共路由
router.post('/verify', inviteCodeController.verifyInviteCode);
router.post('/use', authMiddleware, inviteCodeController.useInviteCode);

module.exports = router; 