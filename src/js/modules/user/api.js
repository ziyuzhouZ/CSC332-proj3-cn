import { getSession } from '../auth/api.js';

const API_BASE_URL = 'https://api.fashion-store.com';

/**
 * API请求工具
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise} API响应
 */
async function fetchAPI(endpoint, options = {}) {
    const session = getSession();
    if (!session) {
        throw new Error('未登录');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'X-Device-ID': session.deviceId,
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

/**
 * 用户信息相关API
 */
export const userAPI = {
    /**
     * 获取用户信息
     * @returns {Promise} 用户信息
     */
    async getProfile() {
        return fetchAPI('/user/profile');
    },

    /**
     * 更新用户信息
     * @param {Object} data - 用户信息
     * @returns {Promise} 更新结果
     */
    async updateProfile(data) {
        return fetchAPI('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * 上传头像
     * @param {File} file - 头像文件
     * @returns {Promise} 上传结果
     */
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        return fetchAPI('/user/avatar', {
            method: 'POST',
            headers: {
                // 不设置Content-Type，让浏览器自动设置
            },
            body: formData
        });
    }
};

/**
 * 订单相关API
 */
export const orderAPI = {
    /**
     * 获取订单列表
     * @param {Object} params - 查询参数
     * @returns {Promise} 订单列表
     */
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/user/orders?${queryString}`);
    },

    /**
     * 获取订单详情
     * @param {string} orderId - 订单ID
     * @returns {Promise} 订单详情
     */
    async getOrderDetail(orderId) {
        return fetchAPI(`/user/orders/${orderId}`);
    },

    /**
     * 取消订单
     * @param {string} orderId - 订单ID
     * @returns {Promise} 取消结果
     */
    async cancelOrder(orderId) {
        return fetchAPI(`/user/orders/${orderId}/cancel`, {
            method: 'POST'
        });
    },

    /**
     * 确认收货
     * @param {string} orderId - 订单ID
     * @returns {Promise} 确认结果
     */
    async confirmReceipt(orderId) {
        return fetchAPI(`/user/orders/${orderId}/confirm`, {
            method: 'POST'
        });
    },

    /**
     * 创建支付订单
     * @param {string} orderId - 订单ID
     * @returns {Promise} 支付订单信息
     */
    async createPayment(orderId) {
        return fetchAPI(`/user/orders/${orderId}/payment`, {
            method: 'POST'
        });
    },

    /**
     * 查询支付状态
     * @param {string} orderId - 订单ID
     * @returns {Promise} 支付状态
     */
    async checkPaymentStatus(orderId) {
        return fetchAPI(`/user/orders/${orderId}/payment/status`);
    },

    /**
     * 取消支付
     * @param {string} orderId - 订单ID
     * @returns {Promise} 取消结果
     */
    async cancelPayment(orderId) {
        return fetchAPI(`/user/orders/${orderId}/payment/cancel`, {
            method: 'POST'
        });
    },

    /**
     * 导出订单列表
     * @param {Object} params - 导出参数
     * @returns {Promise} 导出结果
     */
    async exportOrders(params) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/user/orders/export?${queryString}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.ms-excel'
            }
        });
        
        if (!response.ok) {
            throw new Error('导出失败');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `订单列表_${new Date().toLocaleDateString()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    /**
     * 导出订单详情
     * @param {string} orderId - 订单ID
     * @returns {Promise} 导出结果
     */
    async exportOrderDetail(orderId) {
        const response = await fetch(`/user/orders/${orderId}/export`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.ms-excel'
            }
        });
        
        if (!response.ok) {
            throw new Error('导出失败');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `订单详情_${orderId}_${new Date().toLocaleDateString()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    /**
     * 提交订单评价
     * @param {string} orderId - 订单ID
     * @param {Array} reviews - 评价数据数组
     * @returns {Promise} 提交结果
     */
    async submitReviews(orderId, reviews) {
        return fetchAPI(`/user/orders/${orderId}/reviews`, {
            method: 'POST',
            body: JSON.stringify({ reviews })
        });
    },

    /**
     * 获取订单评价
     * @param {string} orderId - 订单ID
     * @returns {Promise} 评价数据
     */
    async getReviews(orderId) {
        return fetchAPI(`/user/orders/${orderId}/reviews`);
    },

    /**
     * 追加评价
     * @param {string} orderId - 订单ID
     * @param {string} reviewId - 评价ID
     * @param {Object} data - 追加评价数据
     * @returns {Promise} 提交结果
     */
    async appendReview(orderId, reviewId, data) {
        return fetchAPI(`/user/orders/${orderId}/reviews/${reviewId}/append`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

/**
 * 地址相关API
 */
export const addressAPI = {
    /**
     * 获取地址列表
     * @returns {Promise} 地址列表
     */
    async getAddresses() {
        return fetchAPI('/user/addresses');
    },

    /**
     * 添加地址
     * @param {Object} address - 地址信息
     * @returns {Promise} 添加结果
     */
    async addAddress(address) {
        return fetchAPI('/user/addresses', {
            method: 'POST',
            body: JSON.stringify(address)
        });
    },

    /**
     * 更新地址
     * @param {string} id - 地址ID
     * @param {Object} address - 地址信息
     * @returns {Promise} 更新结果
     */
    async updateAddress(id, address) {
        return fetchAPI(`/user/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(address)
        });
    },

    /**
     * 删除地址
     * @param {string} id - 地址ID
     * @returns {Promise} 删除结果
     */
    async deleteAddress(id) {
        return fetchAPI(`/user/addresses/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * 设置默认地址
     * @param {string} id - 地址ID
     * @returns {Promise} 设置结果
     */
    async setDefaultAddress(id) {
        return fetchAPI(`/user/addresses/${id}/default`, {
            method: 'POST'
        });
    }
};

/**
 * 安全相关API
 */
export const securityAPI = {
    /**
     * 修改密码
     * @param {Object} data - 密码信息
     * @returns {Promise} 修改结果
     */
    async changePassword(data) {
        return fetchAPI('/user/security/password', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * 绑定手机号
     * @param {Object} data - 手机号信息
     * @returns {Promise} 绑定结果
     */
    async bindPhone(data) {
        return fetchAPI('/user/security/phone', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * 获取安全日志
     * @returns {Promise} 安全日志
     */
    async getSecurityLogs() {
        return fetchAPI('/user/security/logs');
    }
};

/**
 * 消息相关API
 */
export const notificationAPI = {
    /**
     * 获取消息列表
     * @param {Object} params - 查询参数
     * @returns {Promise} 消息列表
     */
    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/user/notifications?${queryString}`);
    },

    /**
     * 标记消息为已读
     * @param {string} id - 消息ID
     * @returns {Promise} 标记结果
     */
    async markAsRead(id) {
        return fetchAPI(`/user/notifications/${id}/read`, {
            method: 'POST'
        });
    },

    /**
     * 删除消息
     * @param {string} id - 消息ID
     * @returns {Promise} 删除结果
     */
    async deleteNotification(id) {
        return fetchAPI(`/user/notifications/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * 获取未读消息数量
     * @returns {Promise} 未读数量
     */
    async getUnreadCount() {
        return fetchAPI('/user/notifications/unread/count');
    }
};
