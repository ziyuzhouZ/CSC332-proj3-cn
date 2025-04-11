import { socialManager } from './social.js';

class ProductManager {
    constructor() {
        this.state = {
            filters: {
                gender: 'all',
                category: 'all',
                minPrice: null,
                maxPrice: null,
                sort: 'default'
            },
            pagination: {
                currentPage: 1,
                totalPages: 1,
                pageSize: 12
            },
            loading: false
        };

        this.elements = {
            productsGrid: document.querySelector('.products-grid'),
            filterBar: document.querySelector('.filter-bar'),
            genderOptions: document.querySelectorAll('[data-gender]'),
            categoryOptions: document.querySelectorAll('[data-category]'),
            minPriceInput: document.getElementById('minPrice'),
            maxPriceInput: document.getElementById('maxPrice'),
            sortSelect: document.getElementById('sortSelect'),
            pagination: document.querySelector('.pagination'),
            prevButton: document.querySelector('.btn-prev'),
            nextButton: document.querySelector('.btn-next'),
            pageNumbers: document.querySelector('.page-numbers'),
            loadingOverlay: document.querySelector('.loading-overlay'),
            productTemplate: document.getElementById('productTemplate')
        };

        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        this.bindEvents();
        await this.loadProducts();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 性别筛选
        this.elements.genderOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.updateFilter('gender', option.dataset.gender);
            });
        });

        // 品类筛选
        this.elements.categoryOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.updateFilter('category', option.dataset.category);
            });
        });

        // 价格筛选
        const applyPriceFilter = () => {
            const minPrice = this.elements.minPriceInput.value;
            const maxPrice = this.elements.maxPriceInput.value;
            this.updateFilter('minPrice', minPrice ? Number(minPrice) : null);
            this.updateFilter('maxPrice', maxPrice ? Number(maxPrice) : null);
        };

        this.elements.filterBar.querySelector('.btn-apply').addEventListener('click', applyPriceFilter);

        // 排序
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.updateFilter('sort', e.target.value);
        });

        // 分页
        this.elements.prevButton.addEventListener('click', () => {
            if (this.state.pagination.currentPage > 1) {
                this.goToPage(this.state.pagination.currentPage - 1);
            }
        });

        this.elements.nextButton.addEventListener('click', () => {
            if (this.state.pagination.currentPage < this.state.pagination.totalPages) {
                this.goToPage(this.state.pagination.currentPage + 1);
            }
        });

        // 快速加入购物车
        this.elements.productsGrid.addEventListener('click', (e) => {
            const quickAddBtn = e.target.closest('.btn-quick-add');
            if (quickAddBtn) {
                const productCard = quickAddBtn.closest('.product-card');
                this.addToCart(productCard.dataset.id);
            }
        });

        // 收藏商品
        this.elements.productsGrid.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.btn-favorite');
            if (favoriteBtn) {
                const productCard = favoriteBtn.closest('.product-card');
                this.toggleFavorite(productCard.dataset.id, favoriteBtn);
            }
        });
    }

    /**
     * 更新筛选条件
     * @param {string} key - 筛选条件键名
     * @param {any} value - 筛选条件值
     */
    async updateFilter(key, value) {
        this.state.filters[key] = value;
        this.state.pagination.currentPage = 1;
        
        // 更新UI状态
        if (key === 'gender' || key === 'category') {
            const options = this.elements[`${key}Options`];
            options.forEach(option => {
                option.classList.toggle('active', option.dataset[key] === value);
            });
        }

        await this.loadProducts();
    }

    /**
     * 加载商品数据
     */
    async loadProducts() {
        try {
            this.setLoading(true);

            // 构建API请求参数
            const params = {
                ...this.state.filters,
                page: this.state.pagination.currentPage,
                pageSize: this.state.pagination.pageSize
            };

            // 模拟API请求
            const response = await this.fetchProducts(params);
            
            this.state.pagination.totalPages = Math.ceil(response.total / this.state.pagination.pageSize);
            this.renderProducts(response.products);
            this.updatePagination();

        } catch (error) {
            console.error('加载商品失败:', error);
            // 显示错误提示
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 模拟API请求
     * @param {Object} params - 请求参数
     * @returns {Promise} 商品数据
     */
    async fetchProducts(params) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 模拟数据
        return {
            products: Array(12).fill(null).map((_, index) => ({
                id: index + 1,
                name: '时尚连衣裙',
                image: '../public/images/products/product_1.jpg',
                currentPrice: 399,
                originalPrice: 599,
                discount: '6.7折'
            })),
            total: 100
        };
    }

    /**
     * 渲染商品列表
     * @param {Array} products - 商品数据
     */
    renderProducts(products) {
        const template = document.getElementById('productTemplate');
        const container = document.querySelector('.products-grid');
        container.setAttribute('role', 'grid');
        container.setAttribute('aria-label', '商品列表');

        products.forEach(product => {
            const element = template.content.cloneNode(true);
            const card = element.querySelector('.product-card');
            
            // 添加ARIA属性
            card.setAttribute('role', 'gridcell');
            card.setAttribute('aria-label', `${product.name} - ¥${product.currentPrice}`);
            
            // 设置图片
            const img = element.querySelector('img');
            img.src = product.image;
            img.alt = product.name;
            img.setAttribute('loading', 'lazy');
            
            // 添加快速购买按钮的ARIA属性
            const quickAddBtn = element.querySelector('.btn-quick-add');
            quickAddBtn.setAttribute('aria-label', `将 ${product.name} 加入购物车`);
            
            // 添加收藏按钮的ARIA属性
            const favoriteBtn = element.querySelector('.btn-favorite');
            favoriteBtn.setAttribute('aria-label', `收藏 ${product.name}`);
            favoriteBtn.setAttribute('aria-pressed', 'false');
            
            // 设置商品信息
            element.querySelector('.product-name').textContent = product.name;
            element.querySelector('.current-price').textContent = `¥${product.currentPrice}`;
            if (product.originalPrice) {
                element.querySelector('.original-price').textContent = `¥${product.originalPrice}`;
                element.querySelector('.discount-tag').textContent = product.discount;
            }
            
            // 添加商品链接
            const link = document.createElement('a');
            link.href = `product-detail.html?id=${product.id}`;
            link.setAttribute('aria-label', `查看 ${product.name} 的详细信息`);
            card.appendChild(link);
            
            container.appendChild(element);
        });
    }

    /**
     * 更新分页控件
     */
    updatePagination() {
        // 更新按钮状态
        this.elements.prevButton.disabled = this.state.pagination.currentPage === 1;
        this.elements.nextButton.disabled = 
            this.state.pagination.currentPage === this.state.pagination.totalPages;

        // 生成页码
        const pages = [];
        const current = this.state.pagination.currentPage;
        const total = this.state.pagination.totalPages;

        // 显示当前页码前后2页
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
            pages.push(i);
        }

        // 添加省略号
        if (pages[0] > 1) {
            pages.unshift(1);
            if (pages[1] > 2) pages.splice(1, 0, '...');
        }
        if (pages[pages.length - 1] < total) {
            if (pages[pages.length - 1] < total - 1) pages.push('...');
            pages.push(total);
        }

        // 渲染页码
        this.elements.pageNumbers.innerHTML = pages.map(page => {
            if (page === '...') {
                return '<span class="page-ellipsis">...</span>';
            }
            return `
                <button class="${page === current ? 'active' : ''}"
                        ${page === current ? 'disabled' : ''}
                        onclick="productManager.goToPage(${page})">
                    ${page}
                </button>
            `;
        }).join('');
    }

    /**
     * 跳转到指定页
     * @param {number} page - 页码
     */
    async goToPage(page) {
        if (page === this.state.pagination.currentPage) return;
        this.state.pagination.currentPage = page;
        await this.loadProducts();
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 添加到购物车
     * @param {string} productId - 商品ID
     */
    async addToCart(productId) {
        try {
            // 调用购物车API
            await this.addToCartAPI(productId);
            // 显示成功提示
            this.showToast('已添加到购物车');
            // 更新购物车计数
            this.updateCartCount();
        } catch (error) {
            this.showToast('添加失败，请重试', 'error');
        }
    }

    /**
     * 切换收藏状态
     * @param {string} productId - 商品ID
     * @param {HTMLElement} button - 收藏按钮
     */
    async toggleFavorite(productId, button) {
        try {
            const isFavorite = button.classList.contains('active');
            // 调用收藏API
            await this.toggleFavoriteAPI(productId, !isFavorite);
            // 更新按钮状态
            button.classList.toggle('active');
            // 显示提示
            this.showToast(isFavorite ? '已取消收藏' : '已加入收藏');
        } catch (error) {
            this.showToast('操作失败，请重试', 'error');
        }
    }

    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoading(loading) {
        this.state.loading = loading;
        this.elements.loadingOverlay.classList.toggle('visible', loading);
    }

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showToast(message, type = 'success') {
        // 使用全局的toast组件
        if (window.router && window.router.showToast) {
            window.router.showToast(message, type);
        } else {
            console.log(message);
        }
    }

    // API 模拟方法
    async addToCartAPI(productId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
    }

    async toggleFavoriteAPI(productId, favorite) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
    }

    async updateCartCount() {
        // 更新购物车图标的数字
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = parseInt(cartCount.textContent) || 0;
            cartCount.textContent = count + 1;
        }
    }
}

class ProductDetailManager {
    constructor() {
        this.state = {
            product: null,
            selectedColor: null,
            selectedSize: null,
            quantity: 1,
            loading: false,
            currentImageIndex: 0,
            favorite: false
        };

        this.elements = {
            mainImage: document.getElementById('mainImage'),
            thumbnailsTrack: document.querySelector('.thumbnails-track'),
            productTitle: document.querySelector('.product-title'),
            currentPrice: document.querySelector('.product-price .current-price'),
            originalPrice: document.querySelector('.product-price .original-price'),
            discountTag: document.querySelector('.product-price .discount-tag'),
            colorOptions: document.querySelector('.color-options'),
            sizeOptions: document.querySelector('.size-options'),
            quantityInput: document.querySelector('.quantity-selector input'),
            decreaseBtn: document.querySelector('.btn-decrease'),
            increaseBtn: document.querySelector('.btn-increase'),
            stockInfo: document.querySelector('.stock-info'),
            addCartBtn: document.querySelector('.btn-add-cart'),
            buyNowBtn: document.querySelector('.btn-buy-now'),
            favoriteBtn: document.querySelector('.btn-favorite'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabPanels: document.querySelectorAll('.tab-panel'),
            productDescription: document.querySelector('.product-description'),
            sizeChart: document.querySelector('.size-chart'),
            reviewsList: document.querySelector('.reviews-list'),
            similarProducts: document.querySelector('.similar-products .products-track'),
            fullscreenBtn: document.querySelector('.btn-fullscreen'),
            imageViewer: document.getElementById('imageViewer'),
            viewerImage: document.querySelector('.viewer-image img'),
            viewerThumbnails: document.querySelector('.viewer-thumbnails'),
            shareBtn: document.querySelector('.btn-share'),
            shareModal: document.getElementById('shareModal'),
            shareLink: document.getElementById('shareLink')
        };

        this.init();
    }

    async init() {
        try {
            await this.loadProductDetail();
            this.renderProductColors();
            this.renderProductSizes();
            this.bindEvents();
            this.checkIfFavorited();
            this.renderThumbnails();
            this.updateCartBadge();
        } catch (error) {
            console.error('初始化商品详情失败:', error);
        }
    }

    async loadProductDetail() {
        try {
            this.setLoading(true);
            const productId = new URLSearchParams(window.location.search).get('id');
            this.state.product = await this.fetchProductDetail(productId);
            
            document.title = `${this.state.product.name} - Fashion Store`;
            this.renderProductDetail();
        } catch (error) {
            console.error('加载商品详情失败:', error);
        } finally {
            this.setLoading(false);
        }
    }

    bindEvents() {
        // 数量输入框事件
        this.elements.quantityInput.addEventListener('change', (e) => {
            let quantity = parseInt(e.target.value);
            if (isNaN(quantity) || quantity < 1) quantity = 1;
            const maxStock = this.getStock(this.state.selectedColor, this.state.selectedSize);
            if (maxStock && quantity > maxStock) quantity = maxStock;
            this.updateQuantity(quantity);
        });

        // 减少数量按钮
        this.elements.decreaseBtn.addEventListener('click', () => {
            if (this.state.quantity > 1) {
                this.updateQuantity(this.state.quantity - 1);
            }
        });

        // 增加数量按钮
        this.elements.increaseBtn.addEventListener('click', () => {
            const maxStock = this.getStock(this.state.selectedColor, this.state.selectedSize);
            if (!maxStock || this.state.quantity < maxStock) {
                this.updateQuantity(this.state.quantity + 1);
            }
        });

        // 添加购物车
        this.elements.addCartBtn.addEventListener('click', () => this.addToCart());

        // 立即购买
        this.elements.buyNowBtn.addEventListener('click', (e) => this.buyNow(e));
        
        // 收藏按钮
        if (this.elements.favoriteBtn) {
            this.elements.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }
        
        // 选项卡切换
        if (this.elements.tabButtons) {
            this.elements.tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchTab(btn.dataset.tab);
                });
            });
        }
        
        // 全屏查看图片
        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen(true);
            });
        }
        
        // 关闭全屏查看
        const closeViewerBtn = document.querySelector('#imageViewer .btn-close');
        if (closeViewerBtn) {
            closeViewerBtn.addEventListener('click', () => {
                this.toggleFullscreen(false);
            });
        }
        
        // 图片查看器箭头按钮
        const prevArrow = document.querySelector('#imageViewer .viewer-arrow.prev');
        const nextArrow = document.querySelector('#imageViewer .viewer-arrow.next');
        
        if (prevArrow) {
            prevArrow.addEventListener('click', () => {
                const newIndex = (this.state.currentImageIndex - 1 + this.state.product.images.length) % this.state.product.images.length;
                this.switchImage(newIndex, true);
            });
        }
        
        if (nextArrow) {
            nextArrow.addEventListener('click', () => {
                const newIndex = (this.state.currentImageIndex + 1) % this.state.product.images.length;
                this.switchImage(newIndex, true);
            });
        }
    }

    // 渲染颜色选项
    renderProductColors() {
        if (!this.state.product || !this.state.product.colors) return;
        
        const colorOptions = this.elements.colorOptions;
        colorOptions.innerHTML = '';
        
        this.state.product.colors.forEach(color => {
            const colorOption = document.createElement('button');
            colorOption.className = 'color-option';
            colorOption.dataset.color = color.code;
            colorOption.style.backgroundColor = color.hex;
            colorOption.setAttribute('aria-label', `颜色：${color.name}`);
            
            colorOption.addEventListener('click', () => {
                this.selectColor(color.code);
            });
            
            colorOptions.appendChild(colorOption);
        });
        
        // 默认选中第一个颜色
        if (this.state.product.colors.length > 0) {
            this.selectColor(this.state.product.colors[0].code);
        }
    }
    
    // 渲染尺寸选项
    renderProductSizes() {
        if (!this.state.product || !this.state.product.sizes) return;
        
        const sizeOptions = this.elements.sizeOptions;
        sizeOptions.innerHTML = '';
        
        this.state.product.sizes.forEach(size => {
            const sizeOption = document.createElement('button');
            sizeOption.className = 'size-option';
            sizeOption.dataset.size = size;
            sizeOption.textContent = size;
            sizeOption.setAttribute('aria-label', `尺寸：${size}`);
            
            sizeOption.addEventListener('click', () => {
                this.selectSize(size);
            });
            
            sizeOptions.appendChild(sizeOption);
        });
    }
    
    // 选择颜色
    selectColor(color) {
        this.state.selectedColor = color;
        
        // 更新UI
        const colorOptions = this.elements.colorOptions.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === color);
        });
        
        this.clearError('color');
        this.updateStockInfo();
    }
    
    // 选择尺寸
    selectSize(size) {
        this.state.selectedSize = size;
        
        // 更新UI
        const sizeOptions = this.elements.sizeOptions.querySelectorAll('.size-option');
        sizeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.size === size);
        });
        
        this.clearError('size');
        this.updateStockInfo();
    }

    // 更新数量
    updateQuantity(quantity) {
        this.state.quantity = quantity;
        this.elements.quantityInput.value = quantity;
    }

    // 更新库存信息
    updateStockInfo() {
        const stock = this.getStock(this.state.selectedColor, this.state.selectedSize);
        const stockInfo = this.elements.stockInfo;
        
        if (!this.state.selectedColor || !this.state.selectedSize) {
            stockInfo.textContent = '请选择颜色和尺寸';
            stockInfo.classList.remove('low-stock', 'out-of-stock');
            return;
        }
        
        if (stock === 0) {
            stockInfo.textContent = '库存不足';
            stockInfo.classList.add('out-of-stock');
            stockInfo.classList.remove('low-stock');
        } else if (stock <= 5) {
            stockInfo.textContent = `库存紧张，剩余${stock}件`;
            stockInfo.classList.add('low-stock');
            stockInfo.classList.remove('out-of-stock');
        } else {
            stockInfo.textContent = '库存充足';
            stockInfo.classList.remove('low-stock', 'out-of-stock');
        }
        
        // 更新数量输入框的最大值
        this.elements.quantityInput.max = stock || 99;
        if (this.state.quantity > stock && stock > 0) {
            this.updateQuantity(stock);
        }
    }

    // 获取特定颜色和尺寸的库存
    getStock(color, size) {
        if (!this.state.product || !color || !size) return null;
        
        // 实际应用中，这里应该根据所选颜色和尺寸从商品数据中获取具体库存
        // 这里仅做示例
        const stockData = {
            'red-S': 2,
            'red-M': 10,
            'red-L': 5,
            'blue-S': 8,
            'blue-M': 15,
            'blue-L': 0,
            'black-S': 3,
            'black-M': 7,
            'black-L': 12
        };
        
        const key = `${color}-${size}`;
        return stockData[key] !== undefined ? stockData[key] : 99;
    }

    // 渲染商品详情
    renderProductDetail() {
        if (!this.state.product) return;
        
        // 更新页面标题和商品信息
        this.elements.productTitle.textContent = this.state.product.name;
        this.elements.currentPrice.textContent = `¥${this.state.product.currentPrice}`;
        
        if (this.state.product.originalPrice) {
            this.elements.originalPrice.textContent = `¥${this.state.product.originalPrice}`;
            this.elements.originalPrice.style.display = 'inline';
            
            if (this.state.product.discount) {
                this.elements.discountTag.textContent = this.state.product.discount;
                this.elements.discountTag.style.display = 'inline';
            }
        }
        
        // 更新主图
        if (this.state.product.images && this.state.product.images.length > 0) {
            this.elements.mainImage.src = this.state.product.images[0];
            this.elements.mainImage.alt = this.state.product.name;
        }
    }

    // 其他辅助方法
    fetchProductDetail(productId) {
        // 从shop.js中获取相同的产品数据
        // 在实际应用中应该通过API调用获取真实数据
        return new Promise(resolve => {
            setTimeout(() => {
                // 模拟从服务器获取产品数据
                const productData = this.getProductDataById(productId);
                if (productData) {
                    resolve({
                        id: productData.id,
                        name: productData.name,
                        currentPrice: productData.price,
                        originalPrice: productData.originalPrice,
                        discount: productData.originalPrice ? Math.round(productData.price / productData.originalPrice * 10) + "折" : null,
                        images: [
                            productData.image,
                            productData.image.replace('.jpg', '_2.jpg'),
                            productData.image.replace('.jpg', '_3.jpg')
                        ],
                        colors: this.getColorsFromData(productData.colors),
                        sizes: ['S', 'M', 'L'],
                        description: `<p>${productData.name}是一款高品质面料制作的时尚单品，适合各种场合穿着。</p>
                                    <p>产品特点：</p>
                                    <ul>
                                        <li>舒适面料</li>
                                        <li>时尚设计</li>
                                        <li>优质做工</li>
                                    </ul>`,
                        sizeChart: '<table><tr><th>尺码</th><th>胸围</th><th>腰围</th><th>臀围</th></tr><tr><td>S</td><td>86cm</td><td>70cm</td><td>92cm</td></tr><tr><td>M</td><td>90cm</td><td>74cm</td><td>96cm</td></tr><tr><td>L</td><td>94cm</td><td>78cm</td><td>100cm</td></tr></table>'
                    });
                } else {
                    // 如果找不到产品数据，返回默认数据
                    resolve({
                        id: productId || '1',
                        name: '时尚连衣裙',
                        currentPrice: 399,
                        originalPrice: 599,
                        discount: '6.7折',
                        images: [
                            '../public/images/products/product_1.jpg',
                            '../public/images/products/product_2.jpg',
                            '../public/images/products/product_3.jpg'
                        ],
                        colors: [
                            { name: '红色', code: 'red', hex: '#ff4444' },
                            { name: '蓝色', code: 'blue', hex: '#4444ff' },
                            { name: '黑色', code: 'black', hex: '#000000' }
                        ],
                        sizes: ['S', 'M', 'L'],
                        description: '<p>这是一款时尚连衣裙，采用高品质面料制作。</p>',
                        sizeChart: '<table><tr><th>尺码</th><th>胸围</th><th>腰围</th><th>臀围</th></tr><tr><td>S</td><td>86cm</td><td>70cm</td><td>92cm</td></tr><tr><td>M</td><td>90cm</td><td>74cm</td><td>96cm</td></tr><tr><td>L</td><td>94cm</td><td>78cm</td><td>100cm</td></tr></table>'
                    });
                }
            }, 500);
        });
    }
    
    // 获取产品数据辅助方法
    getProductDataById(productId) {
        // 定义与shop.js中相同的产品数据
        const products = [
            {
                id: 1,
                name: "优雅系带连衣裙",
                price: 399,
                originalPrice: 599,
                category: "women",
                colors: ["black", "white"],
                image: "../public/images/products/product_1.jpg"
            },
            {
                id: 2,
                name: "休闲棉麻衬衫",
                price: 199,
                originalPrice: 299,
                category: "men",
                colors: ["blue", "white"],
                image: "../public/images/products/product_2.jpg"
            },
            {
                id: 3,
                name: "简约百搭T恤",
                price: 99,
                originalPrice: 129,
                category: "men",
                colors: ["black", "gray", "white"],
                image: "../public/images/products/product_3.jpg"
            },
            {
                id: 4,
                name: "高腰阔腿牛仔裤",
                price: 259,
                originalPrice: 359,
                category: "women",
                colors: ["blue", "black"],
                image: "../public/images/products/product_4.jpg"
            },
            {
                id: 5,
                name: "轻薄防晒外套",
                price: 329,
                originalPrice: 459,
                category: "outerwear",
                colors: ["beige", "gray"],
                image: "../public/images/products/product_5.jpg"
            },
            {
                id: 6,
                name: "真丝印花围巾",
                price: 159,
                originalPrice: 199,
                category: "accessories",
                colors: ["multi"],
                image: "../public/images/products/product_6.jpg"
            },
            {
                id: 7,
                name: "复古格纹西装",
                price: 599,
                originalPrice: 799,
                category: "men",
                colors: ["gray", "brown"],
                image: "../public/images/products/product_7.jpg"
            },
            {
                id: 8,
                name: "蕾丝拼接连衣裙",
                price: 459,
                originalPrice: 599,
                category: "dresses",
                colors: ["white", "black"],
                image: "../public/images/products/product_8.jpg"
            },
            {
                id: 9,
                name: "针织开衫",
                price: 299,
                originalPrice: 399,
                category: "tops",
                colors: ["beige", "gray", "black"],
                image: "../public/images/products/product_9.jpg"
            },
            {
                id: 10,
                name: "皮革手提包",
                price: 499,
                originalPrice: 699,
                category: "accessories",
                colors: ["brown", "black"],
                image: "../public/images/products/product_10.jpg"
            },
            {
                id: 11,
                name: "纯棉休闲裤",
                price: 239,
                originalPrice: 299,
                category: "bottoms",
                colors: ["khaki", "navy"],
                image: "../public/images/products/product_11.jpg"
            },
            {
                id: 12,
                name: "运动休闲鞋",
                price: 359,
                originalPrice: 459,
                category: "accessories",
                colors: ["white", "black"],
                image: "../public/images/products/product_12.jpg"
            }
        ];
        
        // 查找匹配的产品
        const product = products.find(p => p.id === parseInt(productId));
        return product;
    }
    
    // 将颜色名称转换为颜色对象数组
    getColorsFromData(colorNames) {
        const colorMap = {
            'black': { name: '黑色', code: 'black', hex: '#000000' },
            'white': { name: '白色', code: 'white', hex: '#FFFFFF' },
            'gray': { name: '灰色', code: 'gray', hex: '#808080' },
            'blue': { name: '蓝色', code: 'blue', hex: '#4444FF' },
            'beige': { name: '米色', code: 'beige', hex: '#F5F5DC' },
            'brown': { name: '棕色', code: 'brown', hex: '#A52A2A' },
            'multi': { name: '多彩', code: 'multi', hex: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' },
            'khaki': { name: '卡其色', code: 'khaki', hex: '#C3B091' },
            'navy': { name: '藏青色', code: 'navy', hex: '#000080' }
        };
        
        return colorNames.map(color => colorMap[color] || { name: color, code: color, hex: '#000000' });
    }

    // 其他辅助方法
    setLoading(loading) {
        this.state.loading = loading;
        // 可以在这里实现加载状态的UI显示逻辑
    }

    // 添加到购物车
    async addToCart() {
        // 验证用户是否选择了颜色和尺寸
        if (!this.validateSelection()) {
            return;
        }
        
        try {
            // 创建购物车商品对象
            const cartItem = {
                id: this.state.product.id,
                name: this.state.product.name,
                price: this.state.product.currentPrice,
                originalPrice: this.state.product.originalPrice,
                image: this.state.product.images[0],
                color: this.state.selectedColor,
                size: this.state.selectedSize,
                quantity: this.state.quantity
            };
            
            // 导入并使用cartManager
            const { cartManager } = await import('./cart.js');
            cartManager.addItem(cartItem);
            
            // 显示成功提示
            alert("商品已成功添加到购物车!");
        } catch (error) {
            console.error("添加到购物车失败:", error);
            alert("添加失败，请重试");
        }
    }

    // 立即购买
    async buyNow(e) {
        // 阻止默认跳转行为
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        // 验证用户是否选择了颜色和尺寸
        if (!this.validateSelection()) {
            return;
        }
        
        try {
            // 创建购物车商品对象
            const cartItem = {
                id: this.state.product.id,
                name: this.state.product.name,
                price: this.state.product.currentPrice,
                originalPrice: this.state.product.originalPrice,
                image: this.state.product.images[0],
                color: this.state.selectedColor,
                size: this.state.selectedSize,
                quantity: this.state.quantity
            };
            
            // 导入并使用cartManager
            const { cartManager } = await import('./cart.js');
            cartManager.addItem(cartItem);
            
            // 跳转到结算页面
            window.location.href = "checkout.html";
        } catch (error) {
            console.error("立即购买失败:", error);
            alert("操作失败，请重试");
        }
    }
    
    // 验证用户选择
    validateSelection() {
        let isValid = true;
        
        if (!this.state.selectedColor) {
            this.showError('color', '请选择颜色');
            isValid = false;
        }
        
        if (!this.state.selectedSize) {
            this.showError('size', '请选择尺寸');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 显示错误信息
    showError(field, message) {
        const errorElement = document.querySelector(`.error-message[data-for="${field}"]`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }
    }
    
    // 清除错误信息
    clearError(field) {
        const errorElement = document.querySelector(`.error-message[data-for="${field}"]`);
        if (errorElement) {
            errorElement.classList.remove('visible');
        }
    }
    
    // 切换全屏模式
    toggleFullscreen(show) {
        const imageViewer = document.getElementById('imageViewer');
        if (!imageViewer) return;
        
        if (show) {
            imageViewer.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // 设置查看器中的图片
            const viewerImage = imageViewer.querySelector('.viewer-image img');
            if (viewerImage) {
                viewerImage.src = this.elements.mainImage.src;
            }
            
            // 加载缩略图
            const viewerThumbnails = imageViewer.querySelector('.viewer-thumbnails');
            if (viewerThumbnails && this.state.product.images) {
                viewerThumbnails.innerHTML = '';
                this.state.product.images.forEach((imgSrc, index) => {
                    const thumb = document.createElement('div');
                    thumb.className = `viewer-thumbnail ${index === this.state.currentImageIndex ? 'active' : ''}`;
                    thumb.innerHTML = `<img src="${imgSrc}" alt="${this.state.product.name}">`;
                    thumb.addEventListener('click', () => this.switchImage(index, true));
                    viewerThumbnails.appendChild(thumb);
                });
            }
        } else {
            imageViewer.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // 切换图片
    switchImage(index, inViewer = false) {
        if (!this.state.product || !this.state.product.images) return;
        
        const images = this.state.product.images;
        if (index < 0 || index >= images.length) return;
        
        this.state.currentImageIndex = index;
        
        // 更新主图
        if (!inViewer) {
            this.elements.mainImage.src = images[index];
            
            // 更新缩略图选中状态
            const thumbnails = this.elements.thumbnailsTrack?.querySelectorAll('.thumbnail-item');
            if (thumbnails) {
                thumbnails.forEach((item, i) => {
                    item.classList.toggle('active', i === index);
                });
            }
        } else {
            // 更新查看器图片
            const viewerImage = document.querySelector('#imageViewer .viewer-image img');
            if (viewerImage) {
                viewerImage.src = images[index];
            }
            
            // 更新查看器缩略图选中状态
            const viewerThumbnails = document.querySelectorAll('#imageViewer .viewer-thumbnail');
            if (viewerThumbnails) {
                viewerThumbnails.forEach((item, i) => {
                    item.classList.toggle('active', i === index);
                });
            }
        }
    }

    // 切换选项卡
    switchTab(tabId) {
        // 更新标签按钮状态
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // 更新标签面板状态
        this.elements.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabId);
        });
    }

    // 切换收藏状态
    async toggleFavorite() {
        this.state.favorite = !this.state.favorite;
        
        // 更新UI
        if (this.elements.favoriteBtn) {
            this.elements.favoriteBtn.classList.toggle('active', this.state.favorite);
        }
        
        try {
            // 在实际应用中，这里应该调用API保存收藏状态
            // 这里仅做前端状态更新
            const message = this.state.favorite ? "已添加到收藏" : "已从收藏中移除";
            alert(message);
            
            // 保存到本地存储（简单示例）
            this.updateLocalFavorites(this.state.product.id, this.state.favorite);
        } catch (error) {
            console.error("切换收藏状态失败:", error);
            // 恢复原状态
            this.state.favorite = !this.state.favorite;
            if (this.elements.favoriteBtn) {
                this.elements.favoriteBtn.classList.toggle('active', this.state.favorite);
            }
            alert("操作失败，请重试");
        }
    }
    
    // 更新本地收藏列表
    updateLocalFavorites(productId, isFavorite) {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        if (isFavorite) {
            // 添加到收藏
            if (!favorites.includes(productId)) {
                favorites.push(productId);
            }
        } else {
            // 从收藏中移除
            favorites = favorites.filter(id => id !== productId);
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    
    // 检查产品是否已收藏
    checkIfFavorited() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.state.favorite = favorites.includes(this.state.product.id);
        
        // 更新UI
        if (this.elements.favoriteBtn) {
            this.elements.favoriteBtn.classList.toggle('active', this.state.favorite);
        }
    }

    // 渲染缩略图
    renderThumbnails() {
        if (!this.state.product || !this.state.product.images || !this.elements.thumbnailsTrack) return;
        
        this.elements.thumbnailsTrack.innerHTML = '';
        
        this.state.product.images.forEach((imgSrc, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.index = index;
            thumbnail.innerHTML = `<img src="${imgSrc}" alt="${this.state.product.name}">`;
            
            thumbnail.addEventListener('click', () => {
                this.switchImage(index);
            });
            
            this.elements.thumbnailsTrack.appendChild(thumbnail);
        });
    }
}

// 根据页面类型初始化不同的管理器
document.addEventListener('DOMContentLoaded', () => {
    const isDetailPage = window.location.pathname.includes('product-detail.html');
    if (isDetailPage) {
        new ProductDetailManager();
    } else {
        new ProductManager();
    }
}); 