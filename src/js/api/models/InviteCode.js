/**
 * 邀请码模型
 */

const mongoose = require('mongoose');

const InviteCodeSchema = new mongoose.Schema({
  // 邀请码
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 邀请码类型（例如：注册、VIP、活动等）
  type: {
    type: String,
    required: true,
    enum: ['register', 'vip', 'event', 'admin'],
    default: 'register'
  },
  
  // 创建者
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 当前使用次数
  uses: {
    type: Number,
    default: 0
  },
  
  // 最大使用次数
  maxUses: {
    type: Number,
    default: 1
  },
  
  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 过期时间
  expiresAt: {
    type: Date,
    default: function() {
      // 默认30天后过期
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  
  // 使用该邀请码的用户
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

// 添加方法检查邀请码是否有效
InviteCodeSchema.methods.isValid = function() {
  // 检查是否激活
  if (!this.isActive) return false;
  
  // 检查是否过期
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  
  // 检查使用次数
  if (this.uses >= this.maxUses) return false;
  
  return true;
};

module.exports = mongoose.model('InviteCode', InviteCodeSchema); 