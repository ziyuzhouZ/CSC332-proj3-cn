/**
 * API基础URL
 */
const API_BASE_URL = '/api';

/**
 * 会话管理
 */
const SESSION = {
    TOKEN_KEY: 'auth_token',
    USER_DATA_KEY: 'user_data',
    EXPIRY_KEY: 'session_expiry',
    EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24小时
};

/**
 * 获取会话信息
 * @returns {Object|null} 会话信息
 */
function getSession() {
    const token = localStorage.getItem(SESSION.TOKEN_KEY);
    const userData = localStorage.getItem(SESSION.USER_DATA_KEY);
    const expiry = localStorage.getItem(SESSION.EXPIRY_KEY);

    if (!token || !userData || !expiry) {
        return null;
    }

    if (Date.now() > parseInt(expiry)) {
        clearSession();
        return null;
    }

    return { 
        token, 
        user: JSON.parse(userData)
    };
}

/**
 * 检查是否是管理员
 * @returns {Boolean} 是否是管理员
 */
function isAdmin() {
    const session = getSession();
    if (!session || !session.user) {
        return false;
    }
    
    return session.user.role === 'admin';
}

/**
 * 设置会话信息
 * @param {string} token - JWT令牌
 * @param {Object} userData - 用户数据
 */
function setSession(token, userData) {
    localStorage.setItem(SESSION.TOKEN_KEY, token);
    localStorage.setItem(SESSION.USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION.EXPIRY_KEY, Date.now() + SESSION.EXPIRY_TIME);
}

/**
 * 清除会话信息
 */
function clearSession() {
    localStorage.removeItem(SESSION.TOKEN_KEY);
    localStorage.removeItem(SESSION.USER_DATA_KEY);
    localStorage.removeItem(SESSION.EXPIRY_KEY);
}

/**
 * 安全地解析JSON响应
 * @param {Response} response - fetch响应对象 
 * @returns {Promise<Object>} 解析后的JSON对象
 */
async function safeParseJSON(response) {
    try {
        // 首先检查响应状态
        if (!response.ok) {
            throw new Error(`服务器返回错误: ${response.status}`);
        }
        
        // 检查内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('响应不是JSON格式');
        }
        
        // 获取响应文本
        const text = await response.text();
        
        // 确保文本不为空
        if (!text.trim()) {
            throw new Error('响应内容为空');
        }
        
        // 尝试解析JSON
        return JSON.parse(text);
    } catch (error) {
        console.error('JSON解析错误:', error);
        throw error;
    }
}

/**
 * API请求工具
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise} API响应
 */
async function fetchAPI(endpoint, options = {}) {
    const session = getSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(session && { 'Authorization': `Bearer ${session.token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        return await safeParseJSON(response);
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

/**
 * 登录
 * @param {Object} credentials - 登录凭证
 * @returns {Promise} 登录响应
 */
async function login(credentials) {
    const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });

    if (data.token) {
        setSession(data.token, data.user);
    }

    return data;
}

/**
 * 注册
 * @param {Object} userData - 用户数据
 * @returns {Promise} 注册响应
 */
async function register(userData) {
    return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

/**
 * 检查用户名
 * @param {string} username - 用户名
 * @returns {Promise} 检查响应
 */
async function checkUsername(username) {
    return fetchAPI(`/auth/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET' // 明确指定GET方法
    });
}

/**
 * 登出
 * @returns {Promise<Object>} 登出响应
 */
async function logout() {
    // 清除会话信息
    clearSession();
    
    // 返回成功状态，而不是自动跳转
    return { success: true };
}

/**
 * 初始化会话监控
 */
function initSessionMonitor() {
    // 检查登录状态
    const session = getSession();
    
    // 为登录页面添加特殊逻辑
    if (window.location.pathname.includes('/auth/login.html') && session) {
        if (isAdmin() && window.location.search.includes('redirect=admin')) {
            window.location.href = '/html/admin/dashboard.html';
        } else {
            window.location.href = '/html/index.html';
        }
        return;
    }
    
    // 为管理员页面添加特殊保护
    if (window.location.pathname.includes('/admin/') && (!session || !isAdmin())) {
        window.location.href = '/html/auth/login.html?redirect=admin';
        return;
    }
    
    // 为需要登录的页面添加保护
    if (!session && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/html/auth/login.html';
        return;
    }
}

/**
 * 获取门店列表
 * @returns {Promise} API响应
 */
async function getStores() {
    return fetchAPI('/admin/stores', {
        method: 'GET'
    });
}

/**
 * 获取门店详情
 * @param {number} storeId - 门店ID
 * @param {string} dateFilter - 日期筛选条件（today/week/month/custom）
 * @param {string} startDate - 自定义开始日期（可选）
 * @param {string} endDate - 自定义结束日期（可选）
 * @returns {Promise} API响应
 */
async function getStoreDetails(storeId, dateFilter, startDate, endDate) {
    let url = `/admin/stores/${storeId}?dateFilter=${dateFilter}`;
    
    if (dateFilter === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    
    return fetchAPI(url, {
        method: 'GET'
    });
}

/**
 * 获取销售汇总
 * @param {string} period - 时间周期（day/week/month）
 * @returns {Promise} API响应
 */
async function getSales(period = 'month') {
    return fetchAPI(`/admin/sales?period=${period}`, {
        method: 'GET'
    });
}

/**
 * 获取订单列表
 * @param {string} status - 订单状态（pending/shipped/completed/all）
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @returns {Promise} API响应
 */
async function getOrders(status = 'all', page = 1, limit = 20) {
    return fetchAPI(`/admin/orders?status=${status}&page=${page}&limit=${limit}`, {
        method: 'GET'
    });
}

// 导出API函数
export {
    login,
    register,
    checkUsername,
    logout,
    getSession,
    initSessionMonitor,
    safeParseJSON,
    isAdmin,
    getStores,
    getStoreDetails,
    getSales,
    getOrders
}; 