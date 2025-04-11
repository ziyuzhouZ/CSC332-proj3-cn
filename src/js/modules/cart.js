/**
 * 购物车管理类
 */
class CartManager {
    constructor() {
        console.log('CartManager 初始化');
        this.STORAGE_KEY = 'cart_items';
        this.SHIPPING_THRESHOLD = 99; // 免运费阈值
        this.SHIPPING_FEE = 10; // 基础运费

        this.state = {
            items: this.loadCartItems(),
            selectedIds: new Set(),
            drawerVisible: false
        };

        this.elements = {
            container: document.querySelector('.cart-container'),
            cartList: document.querySelector('.cart-list'),
            itemCount: document.querySelector('.item-count'),
            emptyCart: document.querySelector('.empty-cart'),
            cartContent: document.querySelector('.cart-content'),
            selectAll: document.getElementById('selectAll'),
            selectedCount: document.querySelectorAll('.selected-count'),
            totalPrice: document.querySelector('.total-price'),
            discountAmount: document.querySelector('.discount-amount'),
            shippingFee: document.querySelector('.shipping-fee'),
            finalPrice: document.querySelectorAll('.final-price'),
            checkoutBtn: document.querySelectorAll('.btn-checkout'),
            clearBtn: document.querySelector('.btn-clear'),
            drawer: document.querySelector('.cart-drawer'),
            drawerContent: document.querySelector('.drawer-content'),
            closeDrawer: document.querySelector('.cart-drawer .btn-close'),
            removeModal: document.getElementById('removeModal'),
            confirmRemove: document.getElementById('confirmRemove'),
            cancelRemove: document.getElementById('cancelRemove'),
            cartBadge: document.querySelector('.cart-badge')
        };

        this.itemTemplate = document.getElementById('cartItemTemplate');
        this.pendingRemoveId = null;

        this.init();
    }

    /**
     * 初始化购物车
     */
    init() {
        // 先更新购物车徽章数量 - 这需要在所有页面都执行
        this.updateCartBadge();
        
        // 如果在购物车页面，绑定事件并渲染购物车
        if (this.isCartPage()) {
            this.bindEvents();
            this.renderCart();
        } else {
            // 非购物车页面只需添加商品到购物车的功能
            this.initQuickAddToCart();
        }
    }
    
    /**
     * 判断当前是否在购物车页面
     * @returns {boolean} 是否在购物车页面
     */
    isCartPage() {
        return window.location.pathname.includes('cart.html');
    }
    
    /**
     * 初始化快速添加到购物车功能
     */
    initQuickAddToCart() {
        // 在非购物车页面，监听添加购物车按钮
        document.addEventListener('click', (e) => {
            const quickAddBtn = e.target.closest('.btn-quick-add');
            if (quickAddBtn) {
                const productCard = quickAddBtn.closest('.product-card');
                if (productCard && productCard.dataset.id) {
                    // 这里仅示例，实际应调用API获取商品完整信息
                    this.quickAddToCart(productCard.dataset.id);
                }
            }
        });
    }
    
    /**
     * 快速添加商品到购物车
     * @param {string} productId - 商品ID
     */
    quickAddToCart(productId) {
        // 实际应用中应调用API获取完整商品信息
        console.log('快速添加商品到购物车:', productId);
        
        // 示例：添加一个默认商品
        const newItem = {
            id: productId,
            name: '快速添加的商品',
            price: 199,
            originalPrice: 299,
            color: '默认颜色',
            size: '默认尺寸',
            quantity: 1,
            image: '../public/images/products/product_' + (Math.floor(Math.random() * 12) + 1) + '.jpg'
        };
        
        this.addItem(newItem);
        
        // 显示提示
        this.showToast('已添加到购物车');
    }
    
    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     */
    showToast(message) {
        // 简单的提示实现
        alert(message);
    }

    /**
     * 从本地存储加载购物车数据
     * @returns {Array} 购物车商品列表
     */
    loadCartItems() {
        try {
            console.log('加载购物车数据');
            const items = localStorage.getItem(this.STORAGE_KEY);
            const parsedItems = items ? JSON.parse(items) : [];
            console.log('已加载购物车项目数量:', parsedItems.length);
            return parsedItems;
        } catch (error) {
            console.error('加载购物车数据失败:', error);
            return [];
        }
    }

    /**
     * 保存购物车数据到本地存储
     */
    saveCartItems() {
        try {
            console.log('保存购物车数据，项目数量:', this.state.items.length);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state.items));
            this.updateCartBadge();
        } catch (error) {
            console.error('保存购物车数据失败:', error);
        }
    }
    
    /**
     * 添加商品到购物车
     * @param {Object} item - 商品数据
     */
    addItem(item) {
        // 检查是否已存在相同商品（相同ID和规格）
        const existingItemIndex = this.state.items.findIndex(i => 
            i.id === item.id && i.color === item.color && i.size === item.size
        );
        
        if (existingItemIndex >= 0) {
            // 已存在，增加数量
            this.state.items[existingItemIndex].quantity += item.quantity || 1;
        } else {
            // 不存在，添加新商品
            this.state.items.push(item);
        }
        
        this.saveCartItems();
        
        // 如果在购物车页面，更新UI
        if (this.isCartPage()) {
            this.renderCart();
        }
    }

    /**
     * 更新购物车徽章
     */
    updateCartBadge() {
        // 在所有页面都需要查找并更新购物车徽章
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            const totalItems = this.getTotalQuantity();
            cartBadge.textContent = totalItems;
            
            // 添加动画效果
            cartBadge.classList.add('pulse');
            setTimeout(() => {
                cartBadge.classList.remove('pulse');
            }, 800);
        }
    }
    
    /**
     * 获取购物车商品总数量
     * @returns {number} 总数量
     */
    getTotalQuantity() {
        return this.state.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    /**
     * 获取购物车选中商品总价
     * @returns {number} 总价
     */
    getSelectedTotalPrice() {
        return this.state.items
            .filter(item => this.state.selectedIds.has(item.id))
            .reduce((total, item) => total + item.price * item.quantity, 0);
    }
    
    /**
     * 获取购物车所有商品总价
     * @returns {number} 总价
     */
    getTotalPrice() {
        return this.state.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 全选/取消全选
        if (!this.elements.selectAll) {
            console.error("未找到全选复选框");
        } else {
            this.elements.selectAll.addEventListener('change', () => {
                const checked = this.elements.selectAll.checked;
                this.toggleSelectAll(checked);
            });
        }

        // 清空购物车
        if (!this.elements.clearBtn) {
            console.error("未找到清空购物车按钮");
        } else {
            this.elements.clearBtn.addEventListener('click', () => {
                if (confirm('确定要清空购物车吗？')) {
                    this.clearCart();
                }
            });
        }

        // 结算按钮
        if (!this.elements.checkoutBtn || this.elements.checkoutBtn.length === 0) {
            console.error("未找到结算按钮");
        } else {
            this.elements.checkoutBtn.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.checkout();
                });
            });
        }

        // 移动端抽屉
        if (this.elements.closeDrawer) {
            this.elements.closeDrawer.addEventListener('click', () => {
                this.toggleDrawer(false);
            });
        }

        // 删除确认框
        if (this.elements.confirmRemove) {
            this.elements.confirmRemove.addEventListener('click', () => {
                this.removeItem(this.pendingRemoveId);
                this.closeRemoveModal();
            });
        }

        if (this.elements.cancelRemove) {
            this.elements.cancelRemove.addEventListener('click', () => {
                this.closeRemoveModal();
            });
        }

        // 重要：确保购物车列表存在
        if (!this.elements.cartList) {
            console.error("未找到购物车列表元素");
            return;
        }

        // 直接为所有减少按钮添加事件监听
        document.querySelectorAll('.btn-decrease').forEach(btn => {
            const item = btn.closest('.cart-item');
            if (item) {
                const id = item.dataset.id;
                btn.addEventListener('click', () => {
                    console.log("减少按钮被点击，商品ID:", id);
                    this.updateItemQuantity(id, -1);
                });
            }
        });

        // 直接为所有增加按钮添加事件监听
        document.querySelectorAll('.btn-increase').forEach(btn => {
            const item = btn.closest('.cart-item');
            if (item) {
                const id = item.dataset.id;
                btn.addEventListener('click', () => {
                    console.log("增加按钮被点击，商品ID:", id);
                    this.updateItemQuantity(id, 1);
                });
            }
        });

        // 仍然保留事件委托，以防有新添加的元素
        this.elements.cartList.addEventListener('click', (e) => {
            // 找到最近的商品项
            const item = e.target.closest('.cart-item');
            if (!item) return;

            const id = item.dataset.id;
            console.log("点击了商品项", id, e.target);

            // 选择商品
            if (e.target.classList.contains('select-item')) {
                this.toggleSelectItem(id, e.target.checked);
            }

            // 删除商品
            if (e.target.closest('.btn-remove')) {
                this.showRemoveModal(id);
            }
        });

        // 监听数量输入框变化
        this.elements.cartList.addEventListener('change', (e) => {
            if (e.target.matches('.item-quantity input')) {
                const item = e.target.closest('.cart-item');
                if (!item) return;
                
                const id = item.dataset.id;
                const quantity = parseInt(e.target.value) || 1;
                console.log("数量输入框变化", id, quantity);
                this.setItemQuantity(id, quantity);
            }
        });
    }
    
    /**
     * 重新绑定商品项事件
     * 在renderCart之后调用，确保新添加的元素也有事件处理
     */
    rebindItemEvents() {
        console.log("重新绑定商品项事件");
        
        // 重新绑定减少按钮事件
        document.querySelectorAll('.btn-decrease').forEach(btn => {
            const item = btn.closest('.cart-item');
            if (item) {
                const id = item.dataset.id;
                // 先移除旧事件，避免重复绑定
                btn.replaceWith(btn.cloneNode(true));
                const newBtn = item.querySelector('.btn-decrease');
                newBtn.addEventListener('click', () => {
                    console.log("减少按钮被点击(重新绑定)，商品ID:", id);
                    this.updateItemQuantity(id, -1);
                });
            }
        });
        
        // 重新绑定增加按钮事件
        document.querySelectorAll('.btn-increase').forEach(btn => {
            const item = btn.closest('.cart-item');
            if (item) {
                const id = item.dataset.id;
                // 先移除旧事件，避免重复绑定
                btn.replaceWith(btn.cloneNode(true));
                const newBtn = item.querySelector('.btn-increase');
                newBtn.addEventListener('click', () => {
                    console.log("增加按钮被点击(重新绑定)，商品ID:", id);
                    this.updateItemQuantity(id, 1);
                });
            }
        });
    }
    
    /**
     * 渲染购物车
     */
    renderCart() {
        if (this.state.items.length === 0) {
            this.elements.emptyCart.hidden = false;
            this.elements.cartContent.hidden = true;
            return;
        }

        this.elements.emptyCart.hidden = true;
        this.elements.cartContent.hidden = false;
        this.elements.cartList.innerHTML = '';
        this.elements.itemCount.textContent = `${this.state.items.length}件商品`;

        this.state.items.forEach(item => {
            const element = this.createCartItemElement(item);
            this.elements.cartList.appendChild(element);
        });

        this.updateTotalPrice();
        
        // 渲染后重新绑定事件
        setTimeout(() => this.rebindItemEvents(), 0);
    }

    /**
     * 创建购物车商品元素
     * @param {Object} item - 商品数据
     * @returns {HTMLElement} 商品元素
     */
    createCartItemElement(item) {
        if (!this.itemTemplate) {
            console.error("找不到商品模板");
            return document.createElement('div');
        }
        
        // 从模板克隆元素
        const element = this.itemTemplate.content.cloneNode(true);
        const container = element.querySelector('.cart-item');
        
        if (!container) {
            console.error("模板中找不到.cart-item元素");
            return document.createElement('div');
        }

        // 设置商品ID
        container.dataset.id = item.id;
        
        // 设置选中状态
        const checkbox = container.querySelector('.select-item');
        if (checkbox) {
            checkbox.checked = this.state.selectedIds.has(item.id);
        }
        
        // 设置图片
        const img = container.querySelector('.item-image img');
        if (img) {
            img.src = item.image;
            img.alt = item.name;
        }
        
        // 设置商品信息
        const nameElement = container.querySelector('.item-name');
        if (nameElement) nameElement.textContent = item.name;
        
        const colorElement = container.querySelector('.color');
        if (colorElement) colorElement.textContent = item.color;
        
        const sizeElement = container.querySelector('.size');
        if (sizeElement) sizeElement.textContent = item.size;
        
        // 设置价格
        const priceElement = container.querySelector('.current-price');
        if (priceElement) priceElement.textContent = `¥${item.price.toFixed(2)}`;
        
        // 设置原价（如果有）
        const originalPriceElement = container.querySelector('.original-price');
        if (originalPriceElement && item.originalPrice && item.originalPrice > item.price) {
            originalPriceElement.textContent = `¥${item.originalPrice.toFixed(2)}`;
            originalPriceElement.style.display = 'inline';
        } else if (originalPriceElement) {
            originalPriceElement.style.display = 'none';
        }

        // 设置数量
        const quantityInput = container.querySelector('.item-quantity input');
        if (quantityInput) {
            quantityInput.value = item.quantity;
            quantityInput.max = item.stock || 99;
        }
        
        // 设置按钮状态
        const decreaseBtn = container.querySelector('.btn-decrease');
        if (decreaseBtn) decreaseBtn.disabled = item.quantity <= 1;
        
        const increaseBtn = container.querySelector('.btn-increase');
        if (increaseBtn) increaseBtn.disabled = item.quantity >= (item.stock || 99);
        
        // 设置小计
        const subtotal = container.querySelector('.amount');
        if (subtotal) subtotal.textContent = `¥${(item.price * item.quantity).toFixed(2)}`;

        return element;
    }

    /**
     * 切换商品选择状态
     * @param {string} id - 商品ID
     * @param {boolean} checked - 是否选中
     */
    toggleSelectItem(id, checked) {
        console.log(`切换商品 ${id} 选中状态为 ${checked}`);
        
        if (checked) {
            this.state.selectedIds.add(id);
        } else {
            this.state.selectedIds.delete(id);
        }

        // 更新全选状态
        this.updateSelectAllState();
        // 更新总价
        this.updateTotalPrice();
        
        // 保存选中状态到localStorage
        this.saveCartItems();
    }

    /**
     * 切换全选状态
     * @param {boolean} checked - 是否全选
     */
    toggleSelectAll(checked) {
        const checkboxes = this.elements.cartList.querySelectorAll('.select-item');
        
        // 先更新DOM中复选框的checked状态
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        // 更新数据模型中的选中状态
        if (checked) {
            // 全选
            this.state.items.forEach(item => {
                this.state.selectedIds.add(item.id);
            });
        } else {
            // 全不选
            this.state.selectedIds.clear();
        }
        
        // 更新总价
        this.updateTotalPrice();
        
        // 保存选中状态到localStorage
        this.saveCartItems();
    }

    /**
     * 更新全选状态
     */
    updateSelectAllState() {
        const allChecked = this.state.items.length > 0 && 
            this.state.items.every(item => this.state.selectedIds.has(item.id));
        
        if (this.elements.selectAll) {
            this.elements.selectAll.checked = allChecked;
        }
    }

    /**
     * 更新总价
     */
    updateTotalPrice() {
        console.log("更新总价计算");
        let totalPrice = 0;          // 当前价格总和
        let originalTotalPrice = 0;  // 原价总和
        let discountAmount = 0;      // 折扣金额
        
        // 检查所有需要的元素是否存在
        if (!this.elements.totalPrice || !this.elements.discountAmount || 
            !this.elements.shippingFee || !this.elements.finalPrice) {
            console.error("更新总价失败：找不到必要的DOM元素");
            return;
        }

        // 计算总价和折扣
        this.state.items.forEach(item => {
            if (this.state.selectedIds.has(item.id)) {
                console.log(`计算选中商品 ${item.id}, 价格: ${item.price}, 数量: ${item.quantity}`);
                
                // 计算当前价格总和
                const actualTotal = item.price * item.quantity;
                totalPrice += actualTotal;
                
                // 计算原价总和（如果有原价就用原价，否则使用当前价格）
                const originalTotal = (item.originalPrice || item.price) * item.quantity;
                originalTotalPrice += originalTotal;
            }
        });
        
        // 计算折扣金额（原价总和 - 当前价格总和）
        discountAmount = originalTotalPrice - totalPrice;

        console.log("计算结果 - 原价总和:", originalTotalPrice, "当前价格总和:", totalPrice, "折扣:", discountAmount);

        // 计算运费
        const shippingFee = totalPrice >= this.SHIPPING_THRESHOLD ? 0 : this.SHIPPING_FEE;
        const finalPrice = totalPrice + shippingFee;

        // 更新UI - 这里原价总和显示在"商品总额"中
        this.elements.totalPrice.textContent = `¥${originalTotalPrice.toFixed(2)}`;
        this.elements.discountAmount.textContent = `-¥${discountAmount.toFixed(2)}`;
        this.elements.shippingFee.textContent = `¥${shippingFee.toFixed(2)}`;
        
        // 更新所有最终价格显示
        this.elements.finalPrice.forEach(el => {
            el.textContent = `¥${finalPrice.toFixed(2)}`;
        });

        // 更新选中商品数量
        const selectedCount = this.state.selectedIds.size;
        this.elements.selectedCount.forEach(el => {
            el.textContent = selectedCount;
        });

        // 更新结算按钮状态
        this.elements.checkoutBtn.forEach(btn => {
            btn.disabled = selectedCount === 0;
        });
    }

    /**
     * 显示删除确认框
     * @param {string} id - 商品ID
     */
    showRemoveModal(id) {
        this.pendingRemoveId = id;
        this.elements.removeModal.classList.add('visible');
    }

    /**
     * 关闭删除确认框
     */
    closeRemoveModal() {
        this.elements.removeModal.classList.remove('visible');
        this.pendingRemoveId = null;
    }

    /**
     * 移除商品
     * @param {string} id - 商品ID
     */
    removeItem(id) {
        this.state.items = this.state.items.filter(item => item.id !== id);
        this.state.selectedIds.delete(id);
        this.saveCartItems();
        this.renderCart();
    }

    /**
     * 清空购物车
     */
    clearCart() {
        console.log("正在清空购物车...");
        
        // 清空商品列表和选中ID
        this.state.items = [];
        this.state.selectedIds.clear();
        
        // 保存到localStorage（这会同时更新购物车徽章）
        this.saveCartItems();
        
        // 验证购物车是否清空
        const storedItems = localStorage.getItem(this.STORAGE_KEY);
        console.log("验证：localStorage购物车数据", storedItems);
        
        // 确保DOM已加载，再更新UI
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateCartUI();
            });
        } else {
            this.updateCartUI();
        }
    }
    
    /**
     * 更新购物车UI（清空购物车后调用）
     */
    updateCartUI() {
        console.log("更新购物车UI，购物车是否为空:", this.state.items.length === 0);
        
        // 确保元素存在
        if (!this.elements.emptyCart || !this.elements.cartContent) {
            console.error("找不到购物车UI元素");
            return;
        }
        
        if (this.state.items.length === 0) {
            // 显示空购物车状态
            this.elements.emptyCart.hidden = false;
            this.elements.cartContent.hidden = true;
            
            // 清空商品列表
            if (this.elements.cartList) {
                this.elements.cartList.innerHTML = '';
            }
            
            // 重置商品计数
            if (this.elements.itemCount) {
                this.elements.itemCount.textContent = '0件商品';
            }
            
            // 重置价格
            if (this.elements.totalPrice) this.elements.totalPrice.textContent = '¥0.00';
            if (this.elements.discountAmount) this.elements.discountAmount.textContent = '-¥0.00';
            if (this.elements.shippingFee) this.elements.shippingFee.textContent = '¥0.00';
            
            this.elements.finalPrice.forEach(el => {
                el.textContent = '¥0.00';
            });
            
            this.elements.selectedCount.forEach(el => {
                el.textContent = '0';
            });
            
            // 禁用结算按钮
            this.elements.checkoutBtn.forEach(btn => {
                btn.disabled = true;
            });
            
            // 更新全选状态
            if (this.elements.selectAll) {
                this.elements.selectAll.checked = false;
            }
        } else {
            // 如果仍有商品，重新渲染购物车
            this.renderCart();
        }
    }

    /**
     * 切换移动端抽屉状态
     * @param {boolean} visible - 是否显示
     */
    toggleDrawer(visible) {
        this.state.drawerVisible = visible;
        this.elements.drawer.classList.toggle('visible', visible);
        document.body.style.overflow = visible ? 'hidden' : '';
    }

    /**
     * 结算
     */
    checkout() {
        const selectedItems = this.state.items.filter(item => 
            this.state.selectedIds.has(item.id)
        );

        if (selectedItems.length === 0) return;

        const queryString = selectedItems
            .map(item => `items[]=${item.id}`)
            .join('&');

        window.location.href = `/checkout?${queryString}`;
    }

    /**
     * 更新商品数量
     * @param {string} id - 商品ID
     * @param {number} delta - 数量变化值
     */
    updateItemQuantity(id, delta) {
        console.log("更新商品数量", id, delta);
        
        // 查找要更新的商品
        const itemIndex = this.state.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error("找不到商品:", id);
            return false;
        }
        
        const item = this.state.items[itemIndex];
        const newQuantity = item.quantity + delta;
        
        // 设置新数量
        this.setItemQuantity(id, newQuantity);
        
        // 返回true表示操作成功，用于内联事件处理
        return true;
    }

    /**
     * 设置商品数量
     * @param {string} id - 商品ID
     * @param {number} quantity - 新数量
     */
    setItemQuantity(id, quantity) {
        console.log("设置商品数量", id, quantity);
        
        // 查找要更新的商品
        const itemIndex = this.state.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error("找不到商品:", id);
            return false;
        }
        
        const item = this.state.items[itemIndex];
        
        // 限制数量范围
        const maxStock = item.stock || 99;
        quantity = Math.max(1, Math.min(quantity, maxStock));
        
        if (quantity === item.quantity) return true;
        
        // 更新数量
        this.state.items[itemIndex].quantity = quantity;
        
        // 保存到localStorage
        this.saveCartItems();

        // 更新UI
        const element = document.querySelector(`.cart-item[data-id="${id}"]`);
        if (element) {
            const quantityInput = element.querySelector('.item-quantity input');
            const decreaseBtn = element.querySelector('.btn-decrease');
            const increaseBtn = element.querySelector('.btn-increase');
            const subtotal = element.querySelector('.amount');
            
            if (quantityInput) quantityInput.value = quantity;
            if (decreaseBtn) decreaseBtn.disabled = quantity <= 1;
            if (increaseBtn) increaseBtn.disabled = quantity >= maxStock;
            if (subtotal) subtotal.textContent = `¥${(item.price * quantity).toFixed(2)}`;
            
            // 更新总价
            this.updateTotalPrice();
        } else {
            console.error("找不到购物车商品元素:", id);
        }
        
        // 返回true表示操作成功，用于内联事件处理
        return true;
    }
}

// 初始化购物车并导出
let cartManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('初始化全局购物车管理器');
    cartManager = new CartManager();
    // 为非模块脚本提供访问
    window.cartManager = cartManager;
});

export { cartManager, CartManager };
