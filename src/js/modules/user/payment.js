import { orderAPI } from './api.js';
import { router } from './router.js';
import QRCode from '/js/lib/qrcode.min.js';

class PaymentManager {
    constructor() {
        this.orderId = new URLSearchParams(window.location.search).get('id');
        if (!this.orderId) {
            router.showToast('订单ID不能为空', 'error');
            router.navigate('/user/orders');
            return;
        }

        this.elements = {
            container: document.querySelector('.payment-container'),
            orderNumber: document.querySelector('.order-number'),
            productsTotal: document.querySelector('.products-total'),
            shippingFee: document.querySelector('.shipping-fee'),
            discountAmount: document.querySelector('.discount-amount'),
            paymentTotal: document.querySelector('.payment-total'),
            methodsList: document.querySelector('.methods-list'),
            confirmPayment: document.getElementById('confirmPayment'),
            cancelPayment: document.getElementById('cancelPayment'),
            qrcodeModal: document.getElementById('qrcodeModal'),
            qrcodeImage: document.getElementById('qrcodeImage'),
            paymentAmount: document.querySelector('.payment-amount'),
            paymentMethodName: document.querySelector('.payment-method-name'),
            closeQrcodeModal: document.getElementById('closeQrcodeModal'),
            cancelQrcodePayment: document.getElementById('cancelQrcodePayment'),
            resultModal: document.getElementById('resultModal'),
            resultIcon: document.querySelector('.result-icon i'),
            resultTitle: document.querySelector('.result-title'),
            resultDesc: document.querySelector('.result-desc'),
            closeResultModal: document.getElementById('closeResultModal'),
            viewOrder: document.getElementById('viewOrder')
        };

        this.qrcode = null;
        this.checkStatusTimer = null;
        this.orderData = null;

        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        this.bindEvents();
        await this.loadOrderInfo();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 确认支付按钮
        this.elements.confirmPayment.addEventListener('click', () => {
            this.handlePayment();
        });

        // 取消支付按钮
        this.elements.cancelPayment.addEventListener('click', () => {
            if (confirm('确定要取消支付吗？')) {
                router.navigate('/user/orders');
            }
        });

        // 二维码模态框
        this.elements.closeQrcodeModal.addEventListener('click', () => {
            this.closeQrcodeModal();
        });

        this.elements.cancelQrcodePayment.addEventListener('click', () => {
            this.closeQrcodeModal();
        });

        // 结果模态框
        this.elements.closeResultModal.addEventListener('click', () => {
            this.closeResultModal();
        });

        this.elements.viewOrder.addEventListener('click', () => {
            router.navigate(`/user/orders/detail?id=${this.orderId}`);
        });
    }

    /**
     * 加载订单信息
     */
    async loadOrderInfo() {
        try {
            const order = await orderAPI.getOrderDetail(this.orderId);
            this.orderData = order;
            this.renderOrderInfo(order);
        } catch (error) {
            router.showToast(error.message, 'error');
            router.navigate('/user/orders');
        }
    }

    /**
     * 渲染订单信息
     * @param {Object} order - 订单数据
     */
    renderOrderInfo(order) {
        this.elements.orderNumber.textContent = order.orderNumber;
        this.elements.productsTotal.textContent = `¥${order.productsTotal.toFixed(2)}`;
        this.elements.shippingFee.textContent = `¥${order.shippingFee.toFixed(2)}`;
        this.elements.discountAmount.textContent = `¥${order.discountAmount.toFixed(2)}`;
        this.elements.paymentTotal.textContent = `¥${order.paymentTotal.toFixed(2)}`;
    }

    /**
     * 处理支付
     */
    async handlePayment() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (!selectedMethod) {
            router.showToast('请选择支付方式', 'warning');
            return;
        }

        try {
            const paymentMethod = selectedMethod.value;
            const result = await orderAPI.createPayment(this.orderId);
            
            // 显示支付二维码
            this.showQrcodeModal(result.qrcode, paymentMethod);
            
            // 开始轮询支付状态
            this.startCheckingPaymentStatus();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * 显示支付二维码模态框
     * @param {string} qrcodeUrl - 二维码链接
     * @param {string} method - 支付方式
     */
    showQrcodeModal(qrcodeUrl, method) {
        // 清除旧的二维码
        this.elements.qrcodeImage.innerHTML = '';
        
        // 创建新的二维码
        this.qrcode = new QRCode(this.elements.qrcodeImage, {
            text: qrcodeUrl,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // 更新支付信息
        this.elements.paymentAmount.textContent = this.orderData.paymentTotal.toFixed(2);
        this.elements.paymentMethodName.textContent = this.getMethodName(method);

        // 显示模态框
        this.elements.qrcodeModal.classList.add('visible');
    }

    /**
     * 关闭支付二维码模态框
     */
    closeQrcodeModal() {
        this.elements.qrcodeModal.classList.remove('visible');
        this.stopCheckingPaymentStatus();
        
        if (this.qrcode) {
            this.qrcode.clear();
            this.qrcode = null;
        }
    }

    /**
     * 开始轮询支付状态
     */
    startCheckingPaymentStatus() {
        this.checkStatusTimer = setInterval(async () => {
            try {
                const status = await orderAPI.checkPaymentStatus(this.orderId);
                if (status.paid) {
                    this.stopCheckingPaymentStatus();
                    this.closeQrcodeModal();
                    this.showPaymentResult(true);
                }
            } catch (error) {
                console.error('检查支付状态失败:', error);
            }
        }, 3000); // 每3秒检查一次
    }

    /**
     * 停止轮询支付状态
     */
    stopCheckingPaymentStatus() {
        if (this.checkStatusTimer) {
            clearInterval(this.checkStatusTimer);
            this.checkStatusTimer = null;
        }
    }

    /**
     * 显示支付结果
     * @param {boolean} success - 是否支付成功
     */
    showPaymentResult(success) {
        this.elements.resultIcon.className = success ? 'icon-success' : 'icon-error';
        this.elements.resultTitle.textContent = success ? '支付成功' : '支付失败';
        this.elements.resultDesc.textContent = success ? 
            '您的订单已支付成功，正在处理中' : 
            '支付失败，请重新尝试';
        this.elements.resultModal.classList.add('visible');
    }

    /**
     * 关闭支付结果模态框
     */
    closeResultModal() {
        this.elements.resultModal.classList.remove('visible');
    }

    /**
     * 获取支付方式名称
     * @param {string} method - 支付方式代码
     * @returns {string} 支付方式名称
     */
    getMethodName(method) {
        const methodMap = {
            alipay: '支付宝',
            wechat: '微信支付',
            unionpay: '银联支付'
        };
        return methodMap[method] || method;
    }
}

// 当页面加载完成时初始化
window.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'payment') {
        new PaymentManager();
    }
}); 