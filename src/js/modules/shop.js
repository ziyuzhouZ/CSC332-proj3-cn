// 导入购物车管理器
import { cartManager, CartManager } from './cart.js';

// 商品数据示例
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

class ShopManager {
    constructor() {
        console.log('初始化ShopManager');
        this.products = products;
        this.filteredProducts = [...products];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filters = {
            gender: 'all',
            category: 'all',
            categories: new Set(),
            colors: new Set(),
            priceRange: {
                min: 0,
                max: 10000
            },
            searchQuery: "",
            sort: "newest"
        };

        this.init();
    }

    init() {
        this.initSearchBar();
        this.initFilters();
        this.initLoadMore();
        this.renderProducts();
        // 绑定购物车相关事件
        this.bindCartEvents();
    }

    initSearchBar() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.querySelector('.search-btn');

        // 如果搜索元素不存在，则跳过
        if (!searchInput || !searchBtn) {
            console.log('搜索栏元素不存在');
            return;
        }

        // 实时搜索
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.filters.searchQuery = e.target.value.toLowerCase();
                this.updateProducts();
            }, 300);
        });

        // 搜索按钮点击
        searchBtn.addEventListener('click', () => {
            this.filters.searchQuery = searchInput.value.toLowerCase();
            this.updateProducts();
        });
    }

    initFilters() {
        // 分类筛选
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.categories.clear();
                Array.from(categoryFilter.selectedOptions).forEach(option => {
                    this.filters.categories.add(option.value);
                });
                this.updateProducts();
            });
        }

        // 性别和分类按钮筛选
        this.initFilterButtons('gender');
        this.initFilterButtons('category');

        // 价格范围筛选
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        const priceMinInput = document.getElementById('minPrice');
        const priceMaxInput = document.getElementById('maxPrice');
        const applyBtn = document.querySelector('.btn-apply');

        if (priceMinInput && priceMaxInput && applyBtn) {
            // 点击确定按钮应用价格筛选
            applyBtn.addEventListener('click', () => {
                const min = priceMinInput.value ? parseInt(priceMinInput.value) : 0;
                const max = priceMaxInput.value ? parseInt(priceMaxInput.value) : 10000;
                this.filters.priceRange.min = min;
                this.filters.priceRange.max = max;
                this.updateProducts();
            });
        }

        // 排序选择
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.filters.sort = sortSelect.value;
                this.sortProducts();
                this.renderProducts();
            });
        }

        // 颜色筛选
        const colorOptions = document.querySelectorAll('.color-option input');
        colorOptions.forEach(option => {
            option.addEventListener('change', () => {
                if (option.checked) {
                    this.filters.colors.add(option.value);
                } else {
                    this.filters.colors.delete(option.value);
                }
                this.updateProducts();
            });
        });
    }

    // 初始化过滤按钮
    initFilterButtons(type) {
        const buttons = document.querySelectorAll(`[data-${type}]`);
        if (!buttons.length) return;
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除其他按钮的激活状态
                buttons.forEach(btn => btn.classList.remove('active'));
                // 激活当前按钮
                button.classList.add('active');
                
                // 更新过滤条件
                const value = button.dataset[type];
                if (value === 'all') {
                    this.filters[type] = 'all';
                } else {
                    this.filters[type] = value;
                }
                
                this.updateProducts();
            });
        });
    }

    // 排序商品
    sortProducts() {
        const { sort } = this.filters;
        
        if (sort === 'price-asc') {
            this.filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            this.filteredProducts.sort((a, b) => b.price - a.price);
        } else if (sort === 'newest') {
            // 假设有个上架时间字段，这里简单按ID排序
            this.filteredProducts.sort((a, b) => b.id - a.id);
        } else if (sort === 'popular') {
            // 这里可以加入更复杂的计算，如评分、销量等
            this.filteredProducts.sort((a, b) => b.id - a.id);
        }
    }

    initLoadMore() {
        const loadMoreBtn = document.querySelector('.btn-load-more');
        if (!loadMoreBtn) return;
        
        loadMoreBtn.addEventListener('click', () => {
            this.currentPage++;
            this.renderProducts(true);
        });
    }

    // 绑定购物车相关事件
    bindCartEvents() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) {
            console.error('找不到商品网格元素');
            return;
        }

        console.log('绑定购物车事件到商品网格');
        
        productsGrid.addEventListener('click', (e) => {
            // 检查是否点击了快速添加按钮
            const quickAddBtn = e.target.closest('.btn-quick-add');
            if (quickAddBtn) {
                console.log('快速添加按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                // 获取商品数据
                const productCard = quickAddBtn.closest('.product-card');
                const productId = productCard.dataset.id;
                console.log('商品ID:', productId);
                
                // 查找商品信息
                const product = this.findProductById(parseInt(productId));
                if (product) {
                    console.log('找到商品:', product);
                    this.addToCart(product);
                } else {
                    console.error('未找到商品:', productId);
                }
            }
        });
    }

    // 通过ID查找商品
    findProductById(id) {
        return this.products.find(product => product.id === id);
    }

    // 添加商品到购物车
    addToCart(product) {
        console.log('添加商品到购物车:', product);
        
        // 准备商品数据
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            image: product.image,
            quantity: 1,
            // 默认选择颜色和尺寸 (在实际应用中应让用户选择)
            color: product.colors ? product.colors[0] : '默认',
            size: 'M'
        };
        
        // 使用导入的cartManager或全局window.cartManager
        const cart = cartManager || window.cartManager;
        
        // 检查购物车管理器是否存在
        if (cart) {
            try {
                cart.addToCart(cartItem);
                this.showAddToCartAnimation(product);
                this.showToast('已添加到购物车');
            } catch (error) {
                console.error('调用购物车管理器失败:', error);
                this.showToast('添加失败，请重试', 'error');
            }
        } else {
            console.error('购物车管理器未初始化');
            this.showToast('添加失败，请重试', 'error');
        }
    }

    // 显示加入购物车动画
    showAddToCartAnimation(product) {
        // 找到当前商品卡片和目标购物车图标
        const productCard = document.querySelector(`.product-card[data-id="${product.id}"]`);
        const cartIcon = document.querySelector('.cart-icon');
        const cartBadge = document.querySelector('.cart-badge');
        
        if (!productCard || !cartIcon) {
            console.error('无法找到商品卡片或购物车图标', product.id);
            return;
        }
        
        console.log('开始执行加入购物车动画');
        
        // 获取起点（商品图片）和终点（购物车图标）的位置
        const productImage = productCard.querySelector('.product-image');
        const startRect = productImage.getBoundingClientRect();
        const endRect = cartIcon.getBoundingClientRect();
        
        // 创建飞入元素
        const flyItem = document.createElement('div');
        flyItem.className = 'fly-item';
        
        // 获取商品图片创建克隆
        const productImg = productImage.querySelector('img');
        const imgClone = document.createElement('img');
        imgClone.src = productImg.src;
        imgClone.alt = productImg.alt;
        flyItem.appendChild(imgClone);
        
        // 计算终点相对于起点的位置差异 (考虑窗口滚动位置)
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        const endX = (endRect.left + endRect.width/2) - (startRect.left + startRect.width/2) + scrollX;
        const endY = (endRect.top + endRect.height/2) - (startRect.top + startRect.height/2) + scrollY;
        
        console.log('动画坐标计算:', {startRect, endRect, endX, endY});
        
        // 设置飞入元素的初始位置和样式
        Object.assign(flyItem.style, {
            position: 'fixed',
            left: `${startRect.left + scrollX}px`,
            top: `${startRect.top + scrollY}px`,
            width: `${startRect.width}px`,
            height: `${startRect.height}px`,
            zIndex: 9999,
            '--end-x': `${endX}px`,
            '--end-y': `${endY}px`
        });
        
        // 添加到页面
        document.body.appendChild(flyItem);
        console.log('飞入元素添加到页面');
        
        // 添加动画结束监听
        flyItem.addEventListener('animationend', () => {
            console.log('飞入动画结束');
            flyItem.remove();
            
            // 添加购物车徽章的脉冲动画
            if (cartBadge) {
                cartBadge.classList.add('pulse');
                setTimeout(() => {
                    cartBadge.classList.remove('pulse');
                }, 750);
            }
        });
    }

    // 显示提示消息
    showToast(message, type = 'success') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="icon-${type === 'success' ? 'check' : 'warning'}"></i>
            <span>${message}</span>
        `;
        
        // 添加到页面
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            const newContainer = document.createElement('div');
            newContainer.className = 'toast-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(toast);
        } else {
            toastContainer.appendChild(toast);
        }
        
        // 自动消失
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    updateProducts() {
        this.currentPage = 1;
        this.filteredProducts = this.products.filter(product => {
            // 搜索过滤
            if (this.filters.searchQuery && 
                !product.name.toLowerCase().includes(this.filters.searchQuery)) {
                return false;
            }

            // 性别过滤
            if (this.filters.gender && this.filters.gender !== 'all' && 
                product.category !== this.filters.gender) {
                return false;
            }

            // 品类过滤
            if (this.filters.category && this.filters.category !== 'all' && 
                product.category !== this.filters.category) {
                return false;
            }

            // 分类过滤 (多选)
            if (this.filters.categories.size > 0 && 
                !this.filters.categories.has(product.category)) {
                return false;
            }

            // 价格过滤
            if (product.price < this.filters.priceRange.min || 
                product.price > this.filters.priceRange.max) {
                return false;
            }

            // 颜色过滤
            if (this.filters.colors.size > 0 && 
                !product.colors.some(color => this.filters.colors.has(color))) {
                return false;
            }

            return true;
        });

        this.sortProducts();
        this.renderProducts();
    }

    renderProducts(append = false) {
        const grid = document.querySelector('.products-grid');
        const loadMoreBtn = document.querySelector('.btn-load-more');
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = this.currentPage * this.itemsPerPage;
        const productsToShow = this.filteredProducts.slice(start, end);

        if (!append) {
            grid.innerHTML = '';
        }

        productsToShow.forEach(product => {
            const card = this.createProductCard(product);
            grid.appendChild(card);
        });

        // 更新加载更多按钮状态
        loadMoreBtn.style.display = 
            end < this.filteredProducts.length ? 'inline-block' : 'none';
    }

    createProductCard(product) {
        const article = document.createElement('article');
        article.className = 'product-card';
        article.dataset.id = product.id;

        article.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <button class="btn-quick-add">
                    <i class="icon-cart"></i>
                    <span>加入购物车</span>
                </button>
                <button class="btn-favorite">
                    <i class="icon-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">¥${product.price}</span>
                    ${product.originalPrice ? 
                        `<span class="original-price">¥${product.originalPrice}</span>` : 
                        ''}
                </div>
            </div>
        `;

        // 添加点击事件 - 产品详情页
        article.addEventListener('click', (e) => {
            // 不是点击购物车按钮时才跳转
            if (!e.target.closest('.btn-quick-add') && !e.target.closest('.btn-favorite')) {
                window.location.href = `product-detail.html?id=${product.id}`;
            }
        });

        return article;
    }

    showQuickView(product) {
        // 实现快速查看弹窗逻辑
        console.log('Quick view:', product);
    }
}

// 初始化商店管理器
let shopManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('商店管理器初始化');
    shopManager = new ShopManager();
    // 为非模块脚本提供访问
    window.shopManager = shopManager;
});

export { shopManager, ShopManager }; 