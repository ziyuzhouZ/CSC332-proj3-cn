/**
 * 认证中间件
 */

/**
 * 验证管理员认证
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const requireAdminAuth = (req, res, next) => {
  try {
    // 从请求头中获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      // 检查请求是否为API请求
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: '未授权，请登录', redirect: '/html/admin/login.html' });
      } else {
        return res.redirect('/html/admin/login.html');
      }
    }

    // 使用server.js中的verifyAdminToken函数验证token
    try {
      const payload = Buffer.from(token, 'base64').toString('utf-8');
      const [adminId, username, timestamp] = payload.split(':');
      
      // 简单检查token是否有效（24小时过期）
      const now = Date.now();
      const issued = parseInt(timestamp, 10);
      if (now - issued > 24 * 60 * 60 * 1000) {
        throw new Error('Token已过期');
      }
      
      // 将管理员信息添加到请求对象中
      req.admin = { id: parseInt(adminId, 10), username };
      next();
    } catch (error) {
      console.error('认证错误:', error);
      // 检查请求是否为API请求
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: '认证失败，请重新登录', redirect: '/html/admin/login.html' });
      } else {
        return res.redirect('/html/admin/login.html');
      }
    }
  } catch (error) {
    console.error('认证错误:', error);
    // 检查请求是否为API请求
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: '认证失败，请重新登录', redirect: '/html/admin/login.html' });
    } else {
      return res.redirect('/html/admin/login.html');
    }
  }
};

/**
 * 验证用户认证
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const requireUserAuth = (req, res, next) => {
  try {
    // 从请求头中获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未授权，请登录' });
    }

    // 简单的token验证
    try {
      // 将用户信息添加到请求对象中
      // 注意：这里应该根据您的token结构进行解析
      // 如果您实现了JWT等功能，请适当修改此处
      req.user = { token };
      next();
    } catch (error) {
      console.error('认证错误:', error);
      return res.status(401).json({ error: '认证失败，请重新登录' });
    }
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({ error: '认证失败，请重新登录' });
  }
};

/**
 * 验证管理员Token
 * @param {Object} req - 请求对象
 * @returns {Object|null} 管理员信息或null
 */
const verifyAdminToken = (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return null;
    }

    // 解析token
    const payload = Buffer.from(token, 'base64').toString('utf-8');
    const [adminId, username, timestamp] = payload.split(':');
    
    // 检查token是否过期（24小时）
    const now = Date.now();
    const issued = parseInt(timestamp, 10);
    if (now - issued > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return { 
      adminId: parseInt(adminId, 10), 
      username 
    };
  } catch (error) {
    console.error('验证管理员Token错误:', error);
    return null;
  }
};

module.exports = {
  requireAdminAuth,
  requireUserAuth,
  verifyAdminToken
}; 