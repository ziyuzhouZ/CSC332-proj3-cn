/**
 * 管理员路由
 */

const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../js/api/middleware/auth.js');
const { 
    createInviteCode, 
    getAllInviteCodes, 
    verifyInviteCode,
    useInviteCode 
} = require('../js/api/admin/sqlite-invites.js');

// 注意：管理员登录、注册、验证相关API已在server.js中定义，这里不再定义
// 以避免路由冲突

// 邀请码管理路由
router.post('/invites/create', requireAdminAuth, createInviteCode);
router.get('/invites', requireAdminAuth, getAllInviteCodes);
router.post('/invites/verify', verifyInviteCode);
router.post('/invites/use', useInviteCode);

module.exports = router; 