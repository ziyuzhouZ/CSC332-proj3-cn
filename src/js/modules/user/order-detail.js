import { orderAPI } from './api.js';
import { router } from './router.js';

class OrderDetailManager {
    constructor() {
        this.orderId = new URLSearchParams(window.location.search).get('id');
        if (!this.orderId) {
            router.showToast('订单ID不能为空', 'error');
            router.navigate('/user/orders');
            return;
        }

        this.elements = {
            container: document.querySelector('.order-detail-container'),
            statusInfo: document.querySelector('.status-info'),
            statusDesc: document.querySelector('.status-desc'),
            statusActions: document.querySelector('.status-actions'),
            logisticsProgress: document.querySelector('.logistics-progress'),
            progressBar: document.querySelector('.progress-bar'),
            progressNodes: document.querySelector('.progress-nodes'),
            logisticsDetail: document.querySelector('.logistics-detail'),
            orderNumber: document.querySelector('.order-number'),
            createTime: document.querySelector('.create-time'),
            paymentMethod: document.querySelector('.payment-method'),
            paymentTime: document.querySelector('.payment-time'),
            receiverName: document.querySelector('.receiver-name'),
            receiverPhone: document.querySelector('.receiver-phone'),
            receiverAddress: document.querySelector('.receiver-address'),
            productList: document.querySelector('.product-list'),
            productsTotal: document.querySelector('.products-total'),
            shippingFee: document.querySelector('.shipping-fee'),
            discountAmount: document.querySelector('.discount-amount'),
            paymentTotal: document.querySelector('.payment-total'),
            cancelModal: document.getElementById('cancelModal'),
            logisticsModal: document.getElementById('logisticsModal'),
            logisticsTimeline: document.querySelector('.logistics-timeline'),
            reviewModal: document.getElementById('reviewModal'),
            appendReviewModal: document.getElementById('appendReviewModal')
        };

        this.logisticsTimer = null;
        this.lastLogisticsUpdate = null;

        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        this.bindEvents();
        await this.loadOrderDetail();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 取消订单模态框事件
        const cancelModal = this.elements.cancelModal;
        cancelModal.querySelector('#closeCancelModal').addEventListener('click', () => {
            this.closeCancelModal();
        });
        cancelModal.querySelector('#cancelCancelBtn').addEventListener('click', () => {
            this.closeCancelModal();
        });
        cancelModal.querySelector('#confirmCancelBtn').addEventListener('click', () => {
            this.confirmCancelOrder();
        });
        cancelModal.querySelector('#cancelReason').addEventListener('change', (e) => {
            const otherGroup = cancelModal.querySelector('#otherReasonGroup');
            otherGroup.hidden = e.target.value !== 'other';
        });

        // 物流详情模态框事件
        const logisticsModal = this.elements.logisticsModal;
        logisticsModal.querySelector('#closeLogisticsModal').addEventListener('click', () => {
            this.closeLogisticsModal();
        });

        // 评价模态框事件
        const reviewModal = this.elements.reviewModal;
        reviewModal.querySelector('#closeReviewModal').addEventListener('click', () => {
            this.closeReviewModal();
        });
        reviewModal.querySelector('#submitReviews').addEventListener('click', () => {
            this.submitReviews();
        });

        // 追加评价模态框事件
        const appendReviewModal = this.elements.appendReviewModal;
        appendReviewModal.querySelector('#closeAppendReviewModal').addEventListener('click', () => {
            this.closeAppendReviewModal();
        });
        appendReviewModal.querySelector('#submitAppendReview').addEventListener('click', () => {
            this.submitAppendReview();
        });
    }

    /**
     * 加载订单详情
     */
    async loadOrderDetail() {
        try {
            const order = await orderAPI.getOrderDetail(this.orderId);
            this.renderOrderDetail(order);
            
            if (['processing', 'shipped'].includes(order.status)) {
                await this.loadLogistics();
            }
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 渲染订单详情
     * @param {Object} order - 订单数据
     */
    renderOrderDetail(order) {
        // 更新状态信息
        this.elements.statusDesc.textContent = this.getStatusDesc(order.status);
        this.updateStatusActions(order);

        // 更新订单信息
        this.elements.orderNumber.textContent = order.orderNumber;
        this.elements.createTime.textContent = new Date(order.createTime).toLocaleString();
        this.elements.paymentMethod.textContent = order.paymentMethod || '-';
        this.elements.paymentTime.textContent = order.paymentTime ? 
            new Date(order.paymentTime).toLocaleString() : '-';

        // 更新收货信息
        this.elements.receiverName.textContent = order.receiver.name;
        this.elements.receiverPhone.textContent = order.receiver.phone;
        this.elements.receiverAddress.textContent = 
            `${order.receiver.province} ${order.receiver.city} ${order.receiver.district} ${order.receiver.address}`;

        // 渲染商品列表
        this.renderProducts(order.products);

        // 更新订单汇总
        this.elements.productsTotal.textContent = `¥${order.productsTotal.toFixed(2)}`;
        this.elements.shippingFee.textContent = `¥${order.shippingFee.toFixed(2)}`;
        this.elements.discountAmount.textContent = `-¥${order.discountAmount.toFixed(2)}`;
        this.elements.paymentTotal.textContent = `¥${order.paymentTotal.toFixed(2)}`;
    }

    /**
     * 渲染商品列表
     * @param {Array} products - 商品数据
     */
    renderProducts(products) {
        const productList = this.elements.productList;
        productList.innerHTML = '';

        products.forEach(product => {
            const element = document.createElement('div');
            element.className = 'product-item';
            element.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-specs">${product.specs}</p>
                    <div class="product-price">
                        <span class="unit-price">¥${product.price.toFixed(2)}</span>
                        <span class="quantity">x${product.quantity}</span>
                    </div>
                </div>
            `;
            productList.appendChild(element);
        });
    }

    /**
     * 更新订单状态操作按钮
     * @param {Object} order - 订单数据
     */
    updateStatusActions(order) {
        const actions = {
            pending: [
                { text: '立即付款', class: 'btn-primary', handler: () => this.payOrder() },
                { text: '取消订单', class: 'btn-secondary', handler: () => this.showCancelModal() }
            ],
            processing: [
                { text: '查看物流', class: 'btn-secondary', handler: () => this.showLogisticsModal() }
            ],
            shipped: [
                { text: '确认收货', class: 'btn-primary', handler: () => this.confirmReceipt() },
                { text: '查看物流', class: 'btn-secondary', handler: () => this.showLogisticsModal() }
            ],
            completed: [
                { text: '再次购买', class: 'btn-primary', handler: () => this.rebuyOrder() },
                { text: '删除订单', class: 'btn-secondary', handler: () => this.deleteOrder() }
            ],
            cancelled: [
                { text: '删除订单', class: 'btn-secondary', handler: () => this.deleteOrder() }
            ]
        };

        const container = this.elements.statusActions;
        container.innerHTML = '';

        const orderActions = actions[order.status] || [];
        orderActions.forEach(action => {
            const button = document.createElement('button');
            button.className = action.class;
            button.textContent = action.text;
            button.addEventListener('click', action.handler);
            container.appendChild(button);
        });
    }

    /**
     * 加载物流信息
     */
    async loadLogistics() {
        try {
            const logistics = await orderAPI.getLogistics(this.orderId);
            this.renderLogistics(logistics);
            this.lastLogisticsUpdate = Date.now();
            
            // 如果订单未签收，启动自动更新
            if (logistics.status !== 'delivered') {
                this.startLogisticsUpdate();
            }
        } catch (error) {
            console.error('加载物流信息失败:', error);
            this.elements.logisticsProgress.hidden = true;
        }
    }

    /**
     * 渲染物流信息
     * @param {Object} logistics - 物流数据
     */
    renderLogistics(logistics) {
        this.elements.logisticsProgress.hidden = false;

        // 更新进度条
        const progress = this.calculateProgress(logistics.status);
        this.elements.progressBar.style.width = `${progress}%`;

        // 更新节点
        this.renderProgressNodes(logistics);

        // 更新物流时间线
        this.renderLogisticsTimeline(logistics);
    }

    /**
     * 渲染物流进度节点
     * @param {Object} logistics - 物流数据
     */
    renderProgressNodes(logistics) {
        const nodes = [
            { status: 'pending', label: '待发货' },
            { status: 'processing', label: '运输中' },
            { status: 'arrived', label: '已送达' }
        ];

        const container = this.elements.progressNodes;
        container.innerHTML = '';

        nodes.forEach((node, index) => {
            const element = document.createElement('div');
            element.className = `progress-node ${
                logistics.status === node.status ? 'active' : 
                index < nodes.findIndex(n => n.status === logistics.status) ? 'completed' : ''
            }`;
            
            const label = document.createElement('span');
            label.className = 'node-label';
            label.textContent = node.label;
            element.appendChild(label);

            container.appendChild(element);
        });
    }

    /**
     * 渲染物流时间线
     * @param {Object} logistics - 物流数据
     */
    renderLogisticsTimeline(logistics) {
        const container = this.elements.logisticsTimeline;
        container.innerHTML = '';

        logistics.traces.forEach((trace, index) => {
            const element = document.createElement('div');
            element.className = `timeline-item ${index === 0 ? 'active' : ''}`;
            element.innerHTML = `
                <div class="timeline-node"></div>
                <div class="timeline-content">
                    <div class="timeline-time">${new Date(trace.time).toLocaleString()}</div>
                    <p class="timeline-desc">${trace.description}</p>
                </div>
            `;
            container.appendChild(element);
        });
    }

    /**
     * 计算物流进度百分比
     * @param {string} status - 物流状态
     * @returns {number} 进度百分比
     */
    calculateProgress(status) {
        const progressMap = {
            pending: 0,
            processing: 50,
            arrived: 100
        };
        return progressMap[status] || 0;
    }

    /**
     * 获取状态描述
     * @param {string} status - 订单状态
     * @returns {string} 状态描述
     */
    getStatusDesc(status) {
        const descMap = {
            pending: '等待付款',
            processing: '商家正在处理您的订单',
            shipped: '商品正在配送中',
            completed: '交易已完成',
            cancelled: '订单已取消'
        };
        return descMap[status] || status;
    }

    /**
     * 显示取消订单确认框
     */
    showCancelModal() {
        this.elements.cancelModal.classList.add('visible');
    }

    /**
     * 关闭取消订单确认框
     */
    closeCancelModal() {
        const modal = this.elements.cancelModal;
        modal.classList.remove('visible');
        modal.querySelector('#cancelReason').value = '';
        modal.querySelector('#otherReason').value = '';
        modal.querySelector('#otherReasonGroup').hidden = true;
    }

    /**
     * 确认取消订单
     */
    async confirmCancelOrder() {
        const modal = this.elements.cancelModal;
        const reasonSelect = modal.querySelector('#cancelReason');
        const otherReason = modal.querySelector('#otherReason');

        const reason = reasonSelect.value === 'other' ? otherReason.value : reasonSelect.value;

        if (!reason) {
            router.showToast('请选择或输入取消原因', 'warning');
            return;
        }

        try {
            await orderAPI.cancelOrder(this.orderId, { reason });
            this.closeCancelModal();
            router.showToast('订单已取消');
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 显示物流详情模态框
     */
    showLogisticsModal() {
        this.elements.logisticsModal.classList.add('visible');
        
        // 添加刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn-refresh';
        refreshBtn.innerHTML = '<i class="icon-refresh"></i>';
        refreshBtn.addEventListener('click', () => this.refreshLogistics());
        
        const modalHeader = document.querySelector('#logisticsModal .modal-header');
        modalHeader.insertBefore(refreshBtn, modalHeader.lastElementChild);
    }

    /**
     * 关闭物流详情模态框
     */
    closeLogisticsModal() {
        this.elements.logisticsModal.classList.remove('visible');
        this.stopLogisticsUpdate();
    }

    /**
     * 支付订单
     */
    async payOrder() {
        router.navigate(`/user/payment?id=${this.orderId}`);
    }

    /**
     * 确认收货
     */
    async confirmReceipt() {
        if (!confirm('确认已收到商品？')) return;

        try {
            await orderAPI.confirmReceipt(this.orderId);
            router.showToast('已确认收货');
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 再次购买
     */
    async rebuyOrder() {
        try {
            await orderAPI.rebuyOrder(this.orderId);
            router.navigate('/cart');
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 删除订单
     */
    async deleteOrder() {
        if (!confirm('确定要删除该订单吗？删除后将无法恢复。')) return;

        try {
            await orderAPI.deleteOrder(this.orderId);
            router.showToast('订单已删除');
            router.navigate('/user/orders');
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 开始自动更新物流信息
     */
    startLogisticsUpdate() {
        // 清除现有的定时器
        this.stopLogisticsUpdate();
        
        // 设置新的定时器，每5分钟更新一次
        this.logisticsTimer = setInterval(async () => {
            // 如果距离上次更新不足5分钟，跳过
            if (Date.now() - this.lastLogisticsUpdate < 5 * 60 * 1000) {
                return;
            }
            await this.loadLogistics();
        }, 5 * 60 * 1000);
    }

    /**
     * 停止自动更新物流信息
     */
    stopLogisticsUpdate() {
        if (this.logisticsTimer) {
            clearInterval(this.logisticsTimer);
            this.logisticsTimer = null;
        }
    }

    /**
     * 手动刷新物流信息
     */
    async refreshLogistics() {
        // 如果距离上次更新不足1分钟，提示用户稍后再试
        if (this.lastLogisticsUpdate && Date.now() - this.lastLogisticsUpdate < 60 * 1000) {
            router.showToast('请稍后再试', 'warning');
            return;
        }
        
        await this.loadLogistics();
        router.showToast('物流信息已更新');
    }

    /**
     * 显示评价模态框
     */
    showReviewModal() {
        const modal = this.elements.reviewModal;
        modal.classList.add('visible');
        
        // 清空之前的评价表单
        const reviewForms = modal.querySelectorAll('.review-form');
        reviewForms.forEach(form => form.reset());
        
        // 重置图片上传
        const imageUploads = modal.querySelectorAll('.image-upload');
        imageUploads.forEach(upload => {
            upload.querySelector('.preview').innerHTML = '';
            upload.querySelector('input[type="file"]').value = '';
        });
    }

    /**
     * 关闭评价模态框
     */
    closeReviewModal() {
        this.elements.reviewModal.classList.remove('visible');
    }

    /**
     * 提交评价
     */
    async submitReviews() {
        const modal = this.elements.reviewModal;
        const forms = modal.querySelectorAll('.review-form');
        const reviews = [];

        // 收集所有商品的评价数据
        for (const form of forms) {
            const productId = form.dataset.productId;
            const rating = form.querySelector('input[name="rating"]:checked')?.value;
            const content = form.querySelector('textarea[name="content"]').value.trim();
            const imageInput = form.querySelector('input[type="file"]');
            
            if (!rating) {
                router.showToast('请为所有商品选择评分', 'warning');
                return;
            }
            
            if (!content) {
                router.showToast('请填写评价内容', 'warning');
                return;
            }

            const review = {
                productId,
                rating: parseInt(rating),
                content
            };

            // 如果有上传图片，添加到评价数据中
            if (imageInput.files.length > 0) {
                const formData = new FormData();
                for (const file of imageInput.files) {
                    formData.append('images', file);
                }
                
                try {
                    const uploadResult = await this.uploadReviewImages(formData);
                    review.images = uploadResult.urls;
                } catch (error) {
                    router.showToast('图片上传失败', 'error');
                    return;
                }
            }

            reviews.push(review);
        }

        try {
            await orderAPI.submitReviews(this.orderId, reviews);
            this.closeReviewModal();
            router.showToast('评价提交成功');
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 上传评价图片
     * @param {FormData} formData - 包含图片文件的FormData对象
     * @returns {Promise} 上传结果
     */
    async uploadReviewImages(formData) {
        const response = await fetch('/api/upload/images', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('图片上传失败');
        }
        
        return response.json();
    }

    /**
     * 显示追加评价模态框
     * @param {string} reviewId - 评价ID
     */
    showAppendReviewModal(reviewId) {
        const modal = this.elements.appendReviewModal;
        modal.dataset.reviewId = reviewId;
        modal.classList.add('visible');
        
        // 清空表单
        modal.querySelector('textarea').value = '';
        modal.querySelector('.image-upload .preview').innerHTML = '';
        modal.querySelector('input[type="file"]').value = '';
    }

    /**
     * 关闭追加评价模态框
     */
    closeAppendReviewModal() {
        this.elements.appendReviewModal.classList.remove('visible');
    }

    /**
     * 提交追加评价
     */
    async submitAppendReview() {
        const modal = this.elements.appendReviewModal;
        const reviewId = modal.dataset.reviewId;
        const content = modal.querySelector('textarea').value.trim();
        const imageInput = modal.querySelector('input[type="file"]');

        if (!content) {
            router.showToast('请填写追评内容', 'warning');
            return;
        }

        const data = { content };

        // 如果有上传图片，添加到评价数据中
        if (imageInput.files.length > 0) {
            const formData = new FormData();
            for (const file of imageInput.files) {
                formData.append('images', file);
            }
            
            try {
                const uploadResult = await this.uploadReviewImages(formData);
                data.images = uploadResult.urls;
            } catch (error) {
                router.showToast('图片上传失败', 'error');
                return;
            }
        }

        try {
            await orderAPI.appendReview(this.orderId, reviewId, data);
            this.closeAppendReviewModal();
            router.showToast('追评提交成功');
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }
}

// 当页面加载完成时初始化
window.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'order-detail') {
        new OrderDetailManager();
    }
}); 