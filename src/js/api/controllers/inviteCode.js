/**
 * 邀请码控制器
 */

const crypto = require('crypto');
const InviteCode = require('../models/InviteCode');

/**
 * 创建邀请码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createInviteCode = async (req, res) => {
  try {
    const { type, maxUses, expiration } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: '请提供邀请码类型' });
    }
    
    // 生成唯一的邀请码
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const inviteCode = new InviteCode({
      code,
      type,
      createdBy: req.admin.id,
      maxUses: maxUses || 1,
      expiresAt: expiration ? new Date(expiration) : undefined
    });
    
    await inviteCode.save();
    
    res.status(201).json({
      success: true,
      data: inviteCode
    });
  } catch (error) {
    console.error('创建邀请码错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 获取所有邀请码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getAllInviteCodes = async (req, res) => {
  try {
    const inviteCodes = await InviteCode.find()
      .sort({ createdAt: -1 }) // 按创建时间降序排序
      .populate('createdBy', 'username'); // 获取创建者的用户名
      
    res.status(200).json({
      success: true,
      count: inviteCodes.length,
      data: inviteCodes
    });
  } catch (error) {
    console.error('获取邀请码错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 验证邀请码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.verifyInviteCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '请提供邀请码' });
    }
    
    const inviteCode = await InviteCode.findOne({ code });
    
    if (!inviteCode) {
      return res.status(404).json({ error: '无效的邀请码' });
    }
    
    // 检查邀请码是否过期
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return res.status(400).json({ error: '邀请码已过期' });
    }
    
    // 检查邀请码是否已达到最大使用次数
    if (inviteCode.uses >= inviteCode.maxUses) {
      return res.status(400).json({ error: '邀请码已达到最大使用次数' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        type: inviteCode.type,
        remainingUses: inviteCode.maxUses - inviteCode.uses
      }
    });
  } catch (error) {
    console.error('验证邀请码错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 使用邀请码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.useInviteCode = async (req, res) => {
  try {
    const { code, userId } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '请提供邀请码' });
    }
    
    const inviteCode = await InviteCode.findOne({ code });
    
    if (!inviteCode) {
      return res.status(404).json({ error: '无效的邀请码' });
    }
    
    // 检查邀请码是否过期
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return res.status(400).json({ error: '邀请码已过期' });
    }
    
    // 检查邀请码是否已达到最大使用次数
    if (inviteCode.uses >= inviteCode.maxUses) {
      return res.status(400).json({ error: '邀请码已达到最大使用次数' });
    }
    
    // 更新邀请码使用信息
    inviteCode.uses += 1;
    
    if (userId) {
      inviteCode.usedBy.push(userId);
    }
    
    await inviteCode.save();
    
    res.status(200).json({
      success: true,
      data: inviteCode
    });
  } catch (error) {
    console.error('使用邀请码错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}; 