/**
 * 屏幕响应式工具使用示例
 * 展示在各种场景下的应用方法
 */

import ScreenUtils from '../screen.js';

// 初始化屏幕工具
const screen = ScreenUtils.init({
  // 可选：自定义断点
  breakpoints: {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1600
  }
});

/**
 * 示例1：商品列表页动态调整列数
 */
function adjustProductGrid() {
  const productGrid = document.querySelector('.product-grid');
  if (!productGrid) return;
  
  // 获取当前断点
  const breakpoint = screen.getCurrentBreakpoint();
  
  // 根据不同断点设置不同的列数
  switch (breakpoint) {
    case 'xs':
      productGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
      break;
    case 'sm':
      productGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      break;
    case 'md':
      productGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      break;
    case 'lg':
    case 'xl':
    default:
      productGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      break;
  }
  
  // 保存用户偏好到本地存储
  screen.savePreference('productGridColumns', 
    breakpoint === 'lg' ? 4 : 
    breakpoint === 'md' ? 3 : 
    breakpoint === 'sm' ? 2 : 1
  );
  
  console.log(`商品列表已调整为${screen.getCurrentBreakpoint()}尺寸布局`);
}

/**
 * 示例2：商品详情图库布局切换
 */
function adjustProductGallery() {
  const galleryContainer = document.querySelector('.product-gallery');
  if (!galleryContainer) return;
  
  const thumbnailContainer = document.querySelector('.gallery-thumbnails');
  
  // 获取当前屏幕状态
  const { orientation, width } = screen.getScreenState();
  
  // 根据屏幕方向调整图库布局
  if (orientation === 'landscape') {
    // 横屏：缩略图在左侧
    galleryContainer.classList.remove('gallery-vertical');
    galleryContainer.classList.add('gallery-horizontal');
    
    if (thumbnailContainer) {
      thumbnailContainer.style.display = 'flex';
      thumbnailContainer.style.flexDirection = 'column';
    }
  } else {
    // 竖屏：缩略图在底部
    galleryContainer.classList.remove('gallery-horizontal');
    galleryContainer.classList.add('gallery-vertical');
    
    if (thumbnailContainer) {
      thumbnailContainer.style.display = 'flex';
      thumbnailContainer.style.flexDirection = 'row';
    }
  }
  
  // 在小屏幕上简化图库
  if (width < 576) {
    galleryContainer.classList.add('gallery-simplified');
  } else {
    galleryContainer.classList.remove('gallery-simplified');
  }
  
  console.log(`商品图库已切换为${orientation}布局`);
}

/**
 * 示例3：购物车在不同设备的显示优化
 */
function optimizeShoppingCart() {
  const cartContainer = document.querySelector('.shopping-cart');
  if (!cartContainer) return;
  
  const { width } = screen.getScreenState();
  const breakpoint = screen.getCurrentBreakpoint();
  
  // 购物车表格转换为卡片视图
  const cartTable = document.querySelector('.cart-table');
  const cartItems = document.querySelectorAll('.cart-item');
  
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    // 移动端：使用卡片视图
    if (cartTable) {
      cartTable.style.display = 'none';
    }
    
    cartItems.forEach(item => {
      item.classList.add('cart-item-card');
    });
    
    // 简化价格显示
    document.querySelectorAll('.price-details').forEach(detail => {
      detail.classList.add('simplified');
    });
  } else {
    // 桌面端：使用表格视图
    if (cartTable) {
      cartTable.style.display = 'table';
    }
    
    cartItems.forEach(item => {
      item.classList.remove('cart-item-card');
    });
    
    // 完整价格显示
    document.querySelectorAll('.price-details').forEach(detail => {
      detail.classList.remove('simplified');
    });
  }
  
  console.log(`购物车已为${breakpoint}断点优化显示`);
}

/**
 * 初始化所有响应式功能
 */
function initResponsiveFeatures() {
  // 首次执行
  adjustProductGrid();
  adjustProductGallery();
  optimizeShoppingCart();
  
  // 监听屏幕尺寸变化
  screen.onResize(() => {
    adjustProductGrid();
    adjustProductGallery();
    optimizeShoppingCart();
  });
  
  // 仅监听方向变化
  screen.onOrientationChange(() => {
    // 仅调整依赖于方向的元素
    adjustProductGallery();
  });
}

// 文档加载完成后初始化
document.addEventListener('DOMContentLoaded', initResponsiveFeatures);

// 导出功能供其他模块使用
export {
  adjustProductGrid,
  adjustProductGallery,
  optimizeShoppingCart,
  initResponsiveFeatures
}; 