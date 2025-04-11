/**
 * 会话管理模块
 * 用于处理用户登录状态和导航栏显示
 */

// 检查用户是否已登录
function checkLoginStatus() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    const expiry = localStorage.getItem('session_expiry');
    
    console.log('检查登录状态:', !!token, !!userData, !!expiry);
    
    // 检查会话是否有效
    if (!token || !userData || !expiry || Date.now() > parseInt(expiry)) {
        console.log('未登录或会话已过期');
        return false;
    }
    
    console.log('用户已登录');
    return true;
}

// 获取当前登录用户信息
function getCurrentUser() {
    if (!checkLoginStatus()) {
        return null;
    }
    
    try {
        return JSON.parse(localStorage.getItem('user_data'));
    } catch (error) {
        console.error('解析用户数据出错:', error);
        return null;
    }
}

// 更新导航栏上的用户状态（用于所有页面）
function updateNavbarUserStatus() {
    const userStatusElem = document.querySelector('.user-status');
    if (!userStatusElem) {
        console.warn('未找到用户状态容器元素');
        return;
    }
    
    if (checkLoginStatus()) {
        try {
            const userData = getCurrentUser();
            if (userData) {
                userStatusElem.innerHTML = `
                    <div class="user-dropdown">
                        <a href="/html/user-center/index.html" class="user-link">
                            <span>${userData.username || '用户'}</span>
                        </a>
                    </div>
                `;
                console.log('已更新导航栏用户状态为已登录');
            }
        } catch (e) {
            console.error('更新用户状态出错', e);
        }
    } else {
        userStatusElem.innerHTML = `
            <a href="/html/auth/login.html" class="login-link">登录</a>
            <a href="/html/auth/register.html" class="register-link">注册</a>
        `;
        console.log('已更新导航栏用户状态为未登录');
    }
}

// 登出功能
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('session_expiry');
    console.log('用户已登出');
    
    // 重定向到首页
    window.location.href = '/html/index.html';
}

// Auth session management

/**
 * 检查管理员会话状态
 * 
 * @returns {Promise} 返回一个包含管理员信息的Promise
 */
function checkAdminSession() {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('admin_token');
        
        if (!token) {
            // 如果在管理页面但没有token，重定向到登录页面
            if (window.location.pathname.includes('/admin/') && 
                !window.location.pathname.includes('/admin/login.html') &&
                !window.location.pathname.includes('/admin/register.html')) {
                window.location.href = '/html/admin/login.html';
            }
            reject(new Error('未登录'));
            return;
        }
        
        // 验证token有效性
        fetch('/api/admin/auth/validate', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                // 处理未授权错误
                if (response.status === 401 || response.status === 403) {
                    // 清除本地存储
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_data');
                    
                    // 如果在管理页面，重定向到登录页面
                    if (window.location.pathname.includes('/admin/') && 
                        !window.location.pathname.includes('/admin/login.html') &&
                        !window.location.pathname.includes('/admin/register.html')) {
                        window.location.href = '/html/admin/login.html';
                    }
                }
                throw new Error('会话无效');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.admin) {
                resolve(data.admin);
            } else {
                throw new Error('验证失败');
            }
        })
        .catch(error => {
            console.error('会话验证错误:', error);
            localStorage.removeItem('admin_token');
            reject(error);
        });
    });
}

/**
 * 管理员登出
 */
function adminLogout() {
    localStorage.removeItem('admin_token');
    // 可以添加额外的登出逻辑，如通知服务器等
}

/**
 * 管理员登录
 * 
 * @param {Object} credentials - 包含用户名和密码的对象
 * @returns {Promise} 返回登录结果Promise
 */
function adminLogin(credentials) {
    return new Promise((resolve, reject) => {
        fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('登录失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.token) {
                localStorage.setItem('admin_token', data.token);
                resolve(data);
            } else {
                throw new Error(data.message || '登录失败');
            }
        })
        .catch(error => {
            console.error('登录错误:', error);
            reject(error);
        });
    });
}

/**
 * 管理员注册
 * 
 * @param {Object} userData - 包含注册数据的对象
 * @returns {Promise} 返回注册结果Promise
 */
function adminRegister(userData) {
    return new Promise((resolve, reject) => {
        fetch('/api/admin/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('注册失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                throw new Error(data.message || '注册失败');
            }
        })
        .catch(error => {
            console.error('注册错误:', error);
            reject(error);
        });
    });
}

/**
 * 验证邀请码
 * 
 * @param {string} inviteCode - 邀请码
 * @returns {Promise} 返回验证结果Promise
 */
function verifyInviteCode(inviteCode) {
    return new Promise((resolve, reject) => {
        fetch('/api/admin/auth/check-invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inviteCode })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('验证失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                throw new Error(data.message || '无效的邀请码');
            }
        })
        .catch(error => {
            console.error('邀请码验证错误:', error);
            reject(error);
        });
    });
}

// 导出模块函数
export {
    checkLoginStatus,
    getCurrentUser,
    updateNavbarUserStatus,
    logout,
    checkAdminSession,
    adminLogout,
    adminLogin,
    adminRegister,
    verifyInviteCode
}; 