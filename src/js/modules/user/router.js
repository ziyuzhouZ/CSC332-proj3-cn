// 路由配置
const routes = {
    profile: {
        title: '个人资料',
        path: '../user-center/profile.html'
    },
    orders: {
        title: '我的订单',
        path: '../user-center/orders/list.html'
    },
    'orders/detail': {
        title: '订单详情',
        path: '../user-center/orders/detail.html'
    },
    address: {
        title: '收货地址',
        path: '../user-center/settings/address.html'
    },
    security: {
        title: '账号安全',
        path: '../user-center/settings/security.html'
    },
    notifications: {
        title: '消息中心',
        path: '../user-center/settings/notifications.html'
    }
};

// 页面状态管理
const state = {
    currentPage: 'profile',
    pageStack: [],
    loading: false
};

// 工具函数
const utils = {
    /**
     * 显示加载动画
     */
    showLoading() {
        state.loading = true;
        document.querySelector('.loading-overlay').classList.add('visible');
    },

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        state.loading = false;
        document.querySelector('.loading-overlay').classList.remove('visible');
    },

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型（success/error/warning）
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="icon-${type}"></i>
            <span>${message}</span>
        `;

        document.querySelector('.toast-container').appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * 更新面包屑导航
     * @param {string} page - 页面标识
     */
    updateBreadcrumb(page) {
        const route = routes[page];
        if (!route) return;

        const breadcrumb = document.querySelector('.breadcrumb');
        breadcrumb.innerHTML = `
            <span>个人中心</span>
            <i class="icon-arrow-right"></i>
            <span>${route.title}</span>
        `;
    },

    /**
     * 更新页面标题
     * @param {string} page - 页面标识
     */
    updateTitle(page) {
        const route = routes[page];
        if (!route) return;

        document.querySelector('.page-title').textContent = route.title;
        document.title = `${route.title} - Fashion Store`;
    },

    /**
     * 更新菜单激活状态
     * @param {string} page - 页面标识
     */
    updateMenuState(page) {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }
};

/**
 * 加载页面内容
 * @param {string} page - 页面标识
 * @returns {Promise<void>}
 */
async function loadPage(page) {
    if (state.loading || !routes[page]) return;

    try {
        utils.showLoading();
        
        // 获取页面内容
        const response = await fetch(routes[page].path);
        if (!response.ok) throw new Error('页面加载失败');
        
        const html = await response.text();
        
        // 更新DOM
        document.getElementById('contentArea').innerHTML = html;
        
        // 更新状态
        state.currentPage = page;
        state.pageStack.push(page);
        
        // 更新UI
        utils.updateTitle(page);
        utils.updateBreadcrumb(page);
        utils.updateMenuState(page);
        
        // 触发页面加载完成事件
        window.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page } }));
        
    } catch (error) {
        console.error('页面加载错误:', error);
        utils.showToast('页面加载失败，请稍后重试', 'error');
    } finally {
        utils.hideLoading();
    }
}

/**
 * 初始化路由
 */
function initRouter() {
    // 绑定菜单点击事件
    document.querySelector('.user-menu').addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;

        const page = menuItem.dataset.page;
        if (page && page !== state.currentPage) {
            loadPage(page);
        }
    });

    // 处理浏览器后退事件
    window.addEventListener('popstate', () => {
        if (state.pageStack.length > 1) {
            state.pageStack.pop(); // 移除当前页面
            const previousPage = state.pageStack[state.pageStack.length - 1];
            loadPage(previousPage);
        }
    });

    // 加载初始页面
    const defaultPage = new URLSearchParams(window.location.search).get('page') || 'profile';
    loadPage(defaultPage);
}

// 初始化
document.addEventListener('DOMContentLoaded', initRouter);

// 导出工具函数供其他模块使用
export const router = {
    loadPage,
    ...utils
};
