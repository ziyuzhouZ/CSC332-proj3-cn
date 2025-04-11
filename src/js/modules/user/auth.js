// 导入 auth API 模块
import { getSession, logout } from '../auth/api.js';

// 检查登录状态
function checkAuth() {
    const session = getSession();
    if (!session) {
        // 未登录，重定向到登录页面
        window.location.href = '../auth/login.html';
        return false;
    }
    
    // 已登录，更新用户信息显示
    updateUserInfo(session.user);
    return true;
}

// 更新用户信息显示
function updateUserInfo(user) {
    // 更新用户名
    const usernameElement = document.querySelector('.username');
    if (usernameElement) {
        usernameElement.textContent = user.username || '用户';
    }
    
    // 更新用户头像
    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement && user.avatar) {
        avatarElement.src = user.avatar;
    }
    
    // 更新导航栏用户状态
    const userStatusElement = document.querySelector('.user-status');
    if (userStatusElement) {
        userStatusElement.innerHTML = `
            <div class="user-dropdown">
                <a class="user-link">
                    <span>${user.username}</span>
                </a>
            </div>
        `;
    }
    
    // 在控制台显示登录信息
    console.log('用户已登录:', user);
}

// 初始化登出功能
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // 确认是否登出
                if (confirm('确定要退出登录吗？')) {
                    await logout();
                    // 登出成功后跳转到首页
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.error('登出失败:', error);
                alert('登出失败，请重试');
            }
        });
        console.log('登出按钮已初始化');
    } else {
        console.error('未找到登出按钮');
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('用户中心页面加载，检查认证状态');
    if (checkAuth()) {
        console.log('用户已认证，初始化登出功能');
        initLogout();
    } else {
        console.log('用户未认证，重定向到登录页面');
    }
});

export { checkAuth, updateUserInfo }; 