import { orderAPI } from './api.js';
import { router } from './router.js';
import { FormValidator } from './form.js';

class OrderManager {
    constructor() {
        // 状态管理
        this.state = {
            currentPage: 1,
            pageSize: 10,
            hasMore: true,
            loading: false,
            currentStatus: 'all',
            searchText: '',
            dateRange: {
                start: '',
                end: ''
            }
        };

        // DOM元素
        this.elements = {
            filterTabs: document.querySelector('.filter-tabs'),
            searchInput: document.getElementById('orderSearch'),
            searchBtn: document.querySelector('.btn-search'),
            startDate: document.getElementById('startDate'),
            endDate: document.getElementById('endDate'),
            ordersList: document.getElementById('ordersList'),
            loadMore: document.getElementById('loadMore'),
            emptyState: document.getElementById('emptyState'),
            cancelModal: document.getElementById('cancelModal'),
            reviewModal: document.getElementById('reviewModal'),
            orderTemplate: document.getElementById('orderTemplate')
        };

        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        this.bindEvents();
        await this.loadOrders();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 状态筛选
        this.elements.filterTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab-item');
            if (tab) {
                this.handleStatusFilter(tab);
            }
        });

        // 搜索
        this.elements.searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // 日期筛选
        this.elements.startDate.addEventListener('change', () => this.handleDateFilter());
        this.elements.endDate.addEventListener('change', () => this.handleDateFilter());

        // 加载更多
        this.elements.loadMore.querySelector('button').addEventListener('click', () => {
            if (!this.state.loading && this.state.hasMore) {
                this.loadOrders();
            }
        });

        // 取消订单模态框
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

        // 评价模态框
        const reviewModal = this.elements.reviewModal;
        reviewModal.querySelector('#closeReviewModal').addEventListener('click', () => {
            this.closeReviewModal();
        });
        reviewModal.querySelector('#cancelReviewBtn').addEventListener('click', () => {
            this.closeReviewModal();
        });
        reviewModal.querySelector('#submitReviewBtn').addEventListener('click', () => {
            this.submitReview();
        });
    }

    /**
     * 加载订单列表
     */
    async loadOrders() {
        if (this.state.loading || !this.state.hasMore) return;

        try {
            this.state.loading = true;
            this.updateLoadingState(true);

            const params = {
                page: this.state.currentPage,
                pageSize: this.state.pageSize,
                status: this.state.currentStatus === 'all' ? '' : this.state.currentStatus,
                search: this.state.searchText,
                startDate: this.state.dateRange.start,
                endDate: this.state.dateRange.end
            };

            const { orders, total } = await orderAPI.getOrders(params);
            
            if (this.state.currentPage === 1) {
                this.elements.ordersList.innerHTML = '';
            }

            this.renderOrders(orders);
            
            // 更新分页状态
            this.state.hasMore = orders.length === this.state.pageSize;
            this.state.currentPage++;
            
            // 更新UI状态
            this.updateEmptyState(this.state.currentPage === 1 && orders.length === 0);
            this.elements.loadMore.hidden = !this.state.hasMore;

        } catch (error) {
            router.showToast(error.message, 'error');
        } finally {
            this.state.loading = false;
            this.updateLoadingState(false);
        }
    }

    /**
     * 渲染订单列表
     * @param {Array} orders - 订单数据
     */
    renderOrders(orders) {
        const fragment = document.createDocumentFragment();

        orders.forEach(order => {
            const orderElement = this.createOrderElement(order);
            fragment.appendChild(orderElement);
        });

        this.elements.ordersList.appendChild(fragment);
    }

    /**
     * 创建订单元素
     * @param {Object} order - 订单数据
     * @returns {HTMLElement} 订单元素
     */
    createOrderElement(order) {
        const template = this.elements.orderTemplate;
        const clone = template.content.cloneNode(true);
        
        // 填充订单信息
        clone.querySelector('.order-time').textContent = new Date(order.createTime).toLocaleString();
        clone.querySelector('.order-number').textContent = order.orderNumber;
        clone.querySelector('.order-status').textContent = this.getStatusText(order.status);
        clone.querySelector('.order-status').className = `order-status ${order.status}`;
        
        // 填充商品列表
        const productList = clone.querySelector('.product-list');
        order.products.forEach(product => {
            const productElement = this.createProductElement(product);
            productList.appendChild(productElement);
        });
        
        // 填充订单汇总信息
        clone.querySelector('.product-count').textContent = order.products.length;
        clone.querySelector('.total-price').textContent = `¥${order.totalPrice.toFixed(2)}`;
        
        // 添加操作按钮
        const actionsContainer = clone.querySelector('.order-actions');
        this.createOrderActions(order, actionsContainer);
        
        return clone.firstElementChild;
    }

    /**
     * 创建商品元素
     * @param {Object} product - 商品数据
     * @returns {HTMLElement} 商品元素
     */
    createProductElement(product) {
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
        return element;
    }

    /**
     * 创建订单操作按钮
     * @param {Object} order - 订单数据
     * @param {HTMLElement} container - 按钮容器
     */
    createOrderActions(order, container) {
        const actions = {
            pending: [
                { text: '立即付款', class: 'btn-primary', handler: () => this.payOrder(order.id) },
                { text: '取消订单', class: 'btn-secondary', handler: () => this.showCancelModal(order.id) }
            ],
            processing: [
                { text: '查看物流', class: 'btn-secondary', handler: () => this.viewLogistics(order.id) }
            ],
            shipped: [
                { text: '确认收货', class: 'btn-primary', handler: () => this.confirmReceipt(order.id) },
                { text: '查看物流', class: 'btn-secondary', handler: () => this.viewLogistics(order.id) }
            ],
            completed: [
                { text: '评价', class: 'btn-primary', handler: () => this.showReviewModal(order) },
                { text: '再次购买', class: 'btn-secondary', handler: () => this.rebuyOrder(order.id) }
            ],
            cancelled: [
                { text: '删除订单', class: 'btn-secondary', handler: () => this.deleteOrder(order.id) }
            ]
        };

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
     * 处理状态筛选
     * @param {HTMLElement} tab - 状态标签元素
     */
    handleStatusFilter(tab) {
        const status = tab.dataset.status;
        if (status === this.state.currentStatus) return;

        // 更新UI
        this.elements.filterTabs.querySelector('.active').classList.remove('active');
        tab.classList.add('active');

        // 更新状态并重新加载
        this.state.currentStatus = status;
        this.state.currentPage = 1;
        this.state.hasMore = true;
        this.loadOrders();
    }

    /**
     * 处理搜索
     */
    handleSearch() {
        const searchText = this.elements.searchInput.value.trim();
        if (searchText === this.state.searchText) return;

        this.state.searchText = searchText;
        this.state.currentPage = 1;
        this.state.hasMore = true;
        this.loadOrders();
    }

    /**
     * 处理日期筛选
     */
    handleDateFilter() {
        const startDate = this.elements.startDate.value;
        const endDate = this.elements.endDate.value;

        if (startDate && endDate && startDate > endDate) {
            router.showToast('开始日期不能大于结束日期', 'warning');
            return;
        }

        this.state.dateRange = { start: startDate, end: endDate };
        this.state.currentPage = 1;
        this.state.hasMore = true;
        this.loadOrders();
    }

    /**
     * 显示取消订单模态框
     * @param {string} orderId - 订单ID
     */
    showCancelModal(orderId) {
        this.elements.cancelModal.dataset.orderId = orderId;
        this.elements.cancelModal.classList.add('visible');
    }

    /**
     * 关闭取消订单模态框
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
        const orderId = modal.dataset.orderId;
        const reasonSelect = modal.querySelector('#cancelReason');
        const otherReason = modal.querySelector('#otherReason');

        const reason = reasonSelect.value === 'other' ? otherReason.value : reasonSelect.value;

        if (!reason) {
            router.showToast('请选择或输入取消原因', 'warning');
            return;
        }

        try {
            await orderAPI.cancelOrder(orderId, { reason });
            this.closeCancelModal();
            router.showToast('订单已取消');
            this.refreshOrders();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 显示评价模态框
     * @param {Object} order - 订单数据
     */
    showReviewModal(order) {
        const modal = this.elements.reviewModal;
        const container = modal.querySelector('.review-products');
        
        // 清空之前的评价表单
        container.innerHTML = '';
        
        // 为每个商品创建评价表单
        order.products.forEach(product => {
            const reviewForm = this.createReviewForm(product);
            container.appendChild(reviewForm);
        });
        
        modal.dataset.orderId = order.id;
        modal.classList.add('visible');
    }

    /**
     * 创建评价表单
     * @param {Object} product - 商品数据
     * @returns {HTMLElement} 评价表单元素
     */
    createReviewForm(product) {
        const element = document.createElement('div');
        element.className = 'review-item';
        element.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="review-product-info">
                <h4 class="product-name">${product.name}</h4>
                <div class="rating-group">
                    <div class="rating-stars" data-product-id="${product.id}">
                        ${Array.from({ length: 5 }, (_, i) => `
                            <button type="button" class="star-btn" data-rating="${i + 1}">
                                <i class="icon-star"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <textarea class="review-content" 
                          placeholder="请输入评价内容（最少10个字）" 
                          rows="3"
                          data-product-id="${product.id}"></textarea>
            </div>
        `;

        // 绑定星级评分事件
        const starsContainer = element.querySelector('.rating-stars');
        starsContainer.addEventListener('click', (e) => {
            const starBtn = e.target.closest('.star-btn');
            if (!starBtn) return;

            const rating = parseInt(starBtn.dataset.rating);
            const stars = starsContainer.querySelectorAll('.star-btn');
            
            stars.forEach((star, index) => {
                star.classList.toggle('active', index < rating);
            });
        });

        return element;
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
    async submitReview() {
        const modal = this.elements.reviewModal;
        const orderId = modal.dataset.orderId;
        const reviews = [];

        // 收集所有商品的评价
        modal.querySelectorAll('.review-item').forEach(item => {
            const productId = item.querySelector('.rating-stars').dataset.productId;
            const rating = item.querySelectorAll('.star-btn.active').length;
            const content = item.querySelector('.review-content').value.trim();

            if (!rating) {
                router.showToast('请对所有商品进行星级评分', 'warning');
                return;
            }

            if (content.length < 10) {
                router.showToast('评价内容至少需要10个字', 'warning');
                return;
            }

            reviews.push({ productId, rating, content });
        });

        if (reviews.length === 0) return;

        try {
            await orderAPI.submitReview(orderId, { reviews });
            this.closeReviewModal();
            router.showToast('评价提交成功');
            this.refreshOrders();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 确认收货
     * @param {string} orderId - 订单ID
     */
    async confirmReceipt(orderId) {
        if (!confirm('确认已收到商品？')) return;

        try {
            await orderAPI.confirmReceipt(orderId);
            router.showToast('已确认收货');
            this.refreshOrders();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 刷新订单列表
     */
    refreshOrders() {
        this.state.currentPage = 1;
        this.state.hasMore = true;
        this.loadOrders();
    }

    /**
     * 更新加载状态
     * @param {boolean} loading - 是否加载中
     */
    updateLoadingState(loading) {
        const loadMoreBtn = this.elements.loadMore.querySelector('button');
        loadMoreBtn.classList.toggle('loading', loading);
    }

    /**
     * 更新空状态显示
     * @param {boolean} isEmpty - 是否为空
     */
    updateEmptyState(isEmpty) {
        this.elements.emptyState.hidden = !isEmpty;
        this.elements.ordersList.hidden = isEmpty;
    }

    /**
     * 获取状态文本
     * @param {string} status - 状态代码
     * @returns {string} 状态文本
     */
    getStatusText(status) {
        const statusMap = {
            pending: '待付款',
            processing: '待发货',
            shipped: '待收货',
            completed: '已完成',
            cancelled: '已取消'
        };
        return statusMap[status] || status;
    }

    /**
     * 支付订单
     * @param {string} orderId - 订单ID
     */
    async payOrder(orderId) {
        router.navigate(`/user/payment?id=${orderId}`);
    }

    async viewLogistics(orderId) {
        // 实现查看物流逻辑
    }

    async rebuyOrder(orderId) {
        // 实现再次购买逻辑
    }

    async deleteOrder(orderId) {
        // 实现删除订单逻辑
    }
}

// 当页面加载完成时初始化
window.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'orders') {
        new OrderManager();
    }
}); 