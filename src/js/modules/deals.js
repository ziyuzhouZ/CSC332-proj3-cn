/**
 * 营销功能管理类
 */
class DealsManager {
    constructor() {
        this.state = {
            countdown: {
                endTime: new Date('2024-12-31 23:59:59').getTime(),
                timer: null
            },
            coupons: new Set(this.loadCoupons()),
            points: parseInt(localStorage.getItem('userPoints')) || 0
        };

        this.elements = {
            countdownTimer: document.querySelector('.countdown-timer'),
            couponsGrid: document.querySelector('.coupons-grid'),
            dealsGrid: document.querySelector('.deals-grid'),
            pointsGrid: document.querySelector('.points-grid'),
            pointsModal: document.getElementById('pointsModal'),
            toastSuccess: document.querySelector('.toast-success')
        };

        this.templates = {
            dealProduct: document.getElementById('dealProductTemplate'),
            pointsProduct: document.getElementById('pointsProductTemplate')
        };

        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        this.startCountdown();
        this.bindEvents();
        await this.loadDeals();
        await this.loadPointsProducts();
        this.updatePointsDisplay();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 优惠券领取
        this.elements.couponsGrid?.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-get-coupon');
            if (button) {
                const couponCard = button.closest('.coupon-card');
                this.getCoupon(couponCard.dataset.id);
            }
        });

        // 特惠商品购买
        this.elements.dealsGrid?.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-buy');
            if (button) {
                const productCard = button.closest('.product-card');
                this.buyProduct(productCard.dataset.id);
            }
        });

        // 积分兑换
        this.elements.pointsGrid?.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-exchange');
            if (button) {
                const pointsCard = button.closest('.points-card');
                this.exchangeProduct(pointsCard.dataset.id);
            }
        });

        // 关闭积分不足提示
        this.elements.pointsModal?.querySelector('.btn-close').addEventListener('click', () => {
            this.elements.pointsModal.classList.remove('visible');
        });

        // 去购物按钮
        this.elements.pointsModal?.querySelector('.btn-primary').addEventListener('click', () => {
            this.elements.pointsModal.classList.remove('visible');
            router.navigate('/shop');
        });
    }

    /**
     * 启动倒计时
     */
    startCountdown() {
        if (!this.elements.countdownTimer) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = this.state.countdown.endTime - now;

            if (distance < 0) {
                clearInterval(this.state.countdown.timer);
                this.elements.countdownTimer.innerHTML = '活动已结束';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.elements.countdownTimer.querySelector('.days').textContent = 
                days.toString().padStart(2, '0');
            this.elements.countdownTimer.querySelector('.hours').textContent = 
                hours.toString().padStart(2, '0');
            this.elements.countdownTimer.querySelector('.minutes').textContent = 
                minutes.toString().padStart(2, '0');
            this.elements.countdownTimer.querySelector('.seconds').textContent = 
                seconds.toString().padStart(2, '0');
        };

        updateCountdown();
        this.state.countdown.timer = setInterval(updateCountdown, 1000);
    }

    /**
     * 加载特惠商品
     */
    async loadDeals() {
        if (!this.elements.dealsGrid) return;

        try {
            const deals = await this.fetchDeals();
            this.renderDeals(deals);
        } catch (error) {
            console.error('加载特惠商品失败:', error);
        }
    }

    /**
     * 渲染特惠商品
     * @param {Array} deals - 特惠商品数据
     */
    renderDeals(deals) {
        this.elements.dealsGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        deals.forEach(deal => {
            const element = this.templates.dealProduct.content.cloneNode(true);
            const card = element.querySelector('.product-card');

            card.dataset.id = deal.id;
            
            const img = card.querySelector('img');
            img.src = deal.image;
            img.alt = deal.name;

            card.querySelector('.product-name').textContent = deal.name;
            card.querySelector('.current-price').textContent = `¥${deal.price}`;
            card.querySelector('.original-price').textContent = `¥${deal.originalPrice}`;
            card.querySelector('.discount-amount').textContent = deal.discount;
            card.querySelector('.points-amount').textContent = Math.floor(deal.price * 0.01);

            if (deal.memberOnly) {
                card.querySelector('.member-price').style.display = 'block';
            }

            fragment.appendChild(card);
        });

        this.elements.dealsGrid.appendChild(fragment);
    }

    /**
     * 加载积分商品
     */
    async loadPointsProducts() {
        if (!this.elements.pointsGrid) return;

        try {
            const products = await this.fetchPointsProducts();
            this.renderPointsProducts(products);
        } catch (error) {
            console.error('加载积分商品失败:', error);
        }
    }

    /**
     * 渲染积分商品
     * @param {Array} products - 积分商品数据
     */
    renderPointsProducts(products) {
        this.elements.pointsGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        products.forEach(product => {
            const element = this.templates.pointsProduct.content.cloneNode(true);
            const card = element.querySelector('.points-card');

            card.dataset.id = product.id;
            
            const img = card.querySelector('img');
            img.src = product.image;
            img.alt = product.name;

            card.querySelector('.product-name').textContent = product.name;
            card.querySelector('.points-amount').textContent = product.points;
            
            const progress = (product.stock / product.totalStock) * 100;
            card.querySelector('.progress').style.width = `${progress}%`;
            card.querySelector('.stock-amount').textContent = product.stock;

            const button = card.querySelector('.btn-exchange');
            if (product.stock === 0) {
                button.disabled = true;
                button.textContent = '已抢光';
            }

            fragment.appendChild(card);
        });

        this.elements.pointsGrid.appendChild(fragment);
    }

    /**
     * 领取优惠券
     * @param {string} couponId - 优惠券ID
     */
    async getCoupon(couponId) {
        try {
            const coupon = await this.getCouponAPI(couponId);
            
            if (coupon.memberOnly && !this.checkMemberStatus()) {
                router.showToast('仅限会员领取', 'error');
                return;
            }

            if (this.state.coupons.has(couponId)) {
                router.showToast('您已领取过该优惠券', 'error');
                return;
            }

            this.state.coupons.add(couponId);
            this.saveCoupons();
            this.showToast('优惠券领取成功');

        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 购买特惠商品
     * @param {string} productId - 商品ID
     */
    async buyProduct(productId) {
        try {
            const product = await this.getProductAPI(productId);
            
            if (product.memberOnly && !this.checkMemberStatus()) {
                router.showToast('会员专享价格', 'error');
                return;
            }

            // 添加到购物车并跳转
            await this.addToCartAPI(productId);
            router.navigate('/cart');

        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 积分兑换商品
     * @param {string} productId - 商品ID
     */
    async exchangeProduct(productId) {
        try {
            const product = await this.getPointsProductAPI(productId);
            
            if (this.state.points < product.points) {
                this.showPointsGapModal(product.points - this.state.points);
                return;
            }

            if (product.stock === 0) {
                router.showToast('商品已抢光', 'error');
                return;
            }

            await this.exchangeAPI(productId);
            this.state.points -= product.points;
            localStorage.setItem('userPoints', this.state.points);
            this.updatePointsDisplay();
            router.showToast('兑换成功');

        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 显示积分差距提示
     * @param {number} gap - 差距积分
     */
    showPointsGapModal(gap) {
        if (!this.elements.pointsModal) return;

        this.elements.pointsModal.querySelector('.current-points').textContent = this.state.points;
        this.elements.pointsModal.querySelector('.points-gap').textContent = gap;
        this.elements.pointsModal.classList.add('visible');
    }

    /**
     * 更新积分显示
     */
    updatePointsDisplay() {
        const pointsDisplay = document.querySelector('.user-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = this.state.points;
        }
    }

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     */
    showToast(message) {
        if (!this.elements.toastSuccess) return;

        this.elements.toastSuccess.querySelector('span').textContent = message;
        this.elements.toastSuccess.classList.add('visible');

        setTimeout(() => {
            this.elements.toastSuccess.classList.remove('visible');
        }, 3000);
    }

    /**
     * 检查会员状态
     * @returns {boolean} 是否是会员
     */
    checkMemberStatus() {
        // 从localStorage或API获取会员状态
        return localStorage.getItem('isMember') === 'true';
    }

    /**
     * 从本地存储加载优惠券
     * @returns {Array} 优惠券ID列表
     */
    loadCoupons() {
        const coupons = localStorage.getItem('coupons');
        return coupons ? JSON.parse(coupons) : [];
    }

    /**
     * 保存优惠券到本地存储
     */
    saveCoupons() {
        localStorage.setItem('coupons', JSON.stringify([...this.state.coupons]));
    }

    // API 模拟方法
    async fetchDeals() {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            {
                id: '1',
                name: '夏季连衣裙',
                image: '/images/products/dress_1.jpg',
                price: 199,
                originalPrice: 399,
                discount: '5折',
                memberOnly: true
            },
            // 更多商品...
        ];
    }

    async fetchPointsProducts() {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            {
                id: '1',
                name: '限量版T恤',
                image: '/images/products/tshirt_1.jpg',
                points: 2000,
                stock: 50,
                totalStock: 100
            },
            // 更多商品...
        ];
    }

    async getCouponAPI(couponId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            id: couponId,
            amount: 50,
            condition: 299,
            memberOnly: true
        };
    }

    async getProductAPI(productId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            id: productId,
            memberOnly: true
        };
    }

    async getPointsProductAPI(productId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            id: productId,
            points: 2000,
            stock: 50
        };
    }

    async addToCartAPI(productId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
    }

    async exchangeAPI(productId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
    }
}

// 初始化营销功能
document.addEventListener('DOMContentLoaded', () => {
    new DealsManager();
}); 