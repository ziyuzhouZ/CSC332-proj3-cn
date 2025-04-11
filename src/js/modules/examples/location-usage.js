/**
 * 位置服务模块使用示例
 * 展示如何整合地理位置功能到网站页面中
 */

import LocationService from '../location.js';
import ScreenUtils from '../screen.js';

// 初始化服务
const location = LocationService.init();
const screen = ScreenUtils.init();

/**
 * 初始化门店位置功能
 * @param {string} containerId 容器ID
 * @param {Object} options 配置选项
 */
function initStoreLocator(containerId = 'store-locator', options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('找不到门店定位器容器');
    return;
  }
  
  // 创建必要的DOM结构
  setupLocatorUI(container);
  
  // 加载所有门店数据
  loadStoreList();
  
  // 尝试获取用户位置并更新最近门店
  tryGetUserLocation();
  
  // 绑定事件处理
  bindEvents();
  
  console.log('门店定位器已初始化');
}

/**
 * 设置定位器UI结构
 * @param {HTMLElement} container 容器元素
 */
function setupLocatorUI(container) {
  container.innerHTML = `
    <div class="store-locator">
      <div class="location-consent">
        <div class="consent-message">
          <p>为了向您推荐最近的门店，我们需要访问您的位置信息。</p>
          <p class="privacy-note">您的位置信息仅用于门店推荐，不会用于其他目的。</p>
        </div>
        <div class="consent-actions">
          <button id="allow-location" class="btn btn-primary">允许访问位置</button>
          <button id="deny-location" class="btn btn-secondary">暂不允许</button>
        </div>
      </div>
      
      <div class="location-status" style="display: none;">
        <div class="current-location">
          <span class="location-icon">📍</span>
          <span id="location-display">未获取位置</span>
          <span id="location-source" class="source-tag"></span>
        </div>
        <button id="update-location" class="btn btn-sm">更新位置</button>
      </div>
      
      <div class="manual-location" style="display: none;">
        <h4>手动设置位置</h4>
        <div class="input-group">
          <input type="text" id="manual-address" placeholder="城市或地址" class="form-control">
          <button id="search-address" class="btn btn-primary">搜索</button>
        </div>
      </div>
      
      <div class="nearest-store" style="display: none;">
        <h3>最近的门店</h3>
        <div id="nearest-store-details" class="store-card"></div>
      </div>
      
      <div class="store-list">
        <h3>全部门店</h3>
        <div id="stores-container"></div>
      </div>
    </div>
  `;
}

/**
 * 绑定事件处理函数
 */
function bindEvents() {
  // 同意位置访问
  const allowBtn = document.getElementById('allow-location');
  if (allowBtn) {
    allowBtn.addEventListener('click', () => {
      location.setLocationConsent(true);
      
      // 更新UI显示
      document.querySelector('.location-consent').style.display = 'none';
      document.querySelector('.location-status').style.display = 'block';
      
      // 尝试获取位置
      tryGetUserLocation();
    });
  }
  
  // 拒绝位置访问
  const denyBtn = document.getElementById('deny-location');
  if (denyBtn) {
    denyBtn.addEventListener('click', () => {
      location.setLocationConsent(false);
      
      // 更新UI显示
      document.querySelector('.location-consent').style.display = 'none';
      document.querySelector('.manual-location').style.display = 'block';
      document.querySelector('.location-status').style.display = 'block';
      document.getElementById('location-display').textContent = '请手动设置位置';
    });
  }
  
  // 更新位置按钮
  const updateBtn = document.getElementById('update-location');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      tryGetUserLocation(true);
    });
  }
  
  // 地址搜索按钮
  const searchBtn = document.getElementById('search-address');
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      const address = document.getElementById('manual-address').value.trim();
      if (!address) {
        alert('请输入有效地址');
        return;
      }
      
      try {
        await searchAddress(address);
      } catch (error) {
        console.error('地址搜索失败', error);
        alert('无法找到该地址的位置信息，请尝试其他地址');
      }
    });
  }
  
  // 响应屏幕尺寸变化，调整布局
  screen.onResize(() => {
    adjustLocatorLayout();
  });
}

/**
 * 尝试获取用户位置
 * @param {boolean} force 是否强制刷新
 */
async function tryGetUserLocation(force = false) {
  // 检查是否有位置访问权限
  const hasConsent = location.getLocationConsent();
  
  // 如果没有同意，显示同意对话框
  if (!hasConsent) {
    document.querySelector('.location-consent').style.display = 'block';
    return;
  }
  
  // 显示位置状态区域
  document.querySelector('.location-status').style.display = 'block';
  document.querySelector('.location-consent').style.display = 'none';
  
  // 更新位置状态显示
  const locationDisplay = document.getElementById('location-display');
  const locationSource = document.getElementById('location-source');
  
  try {
    // 显示加载状态
    locationDisplay.textContent = '正在获取位置...';
    
    // 获取用户坐标
    let coordinates;
    
    if (force) {
      // 强制刷新位置
      coordinates = await location.requestLocationPermission();
    } else {
      // 尝试获取已有位置或新位置
      coordinates = await location.getUserCoordinates().catch(() => 
        location.requestLocationPermission()
      );
    }
    
    // 更新位置显示
    locationDisplay.textContent = formatLocationDisplay(coordinates);
    
    // 显示位置来源
    const status = location.getUserLocationStatus();
    if (status.source === 'gps') {
      locationSource.textContent = 'GPS';
      locationSource.className = 'source-tag source-gps';
    } else if (status.source === 'ip') {
      locationSource.textContent = 'IP定位';
      locationSource.className = 'source-tag source-ip';
    } else if (status.source === 'manual') {
      locationSource.textContent = '手动设置';
      locationSource.className = 'source-tag source-manual';
    }
    
    // 更新最近门店显示
    updateNearestStore(coordinates);
    
    // 更新门店列表排序
    sortStoresByDistance(coordinates);
    
  } catch (error) {
    console.error('获取位置失败', error);
    
    // 显示错误状态
    locationDisplay.textContent = '位置获取失败';
    
    // 显示手动位置输入
    document.querySelector('.manual-location').style.display = 'block';
  }
}

/**
 * 格式化位置显示信息
 * @param {Object} coordinates 坐标对象
 * @returns {string} 格式化的位置显示
 */
function formatLocationDisplay(coordinates) {
  if (coordinates.locationName) {
    return coordinates.locationName;
  }
  
  // 如果没有名称，则显示坐标（保留3位小数）
  const lat = parseFloat(coordinates.lat).toFixed(3);
  const lng = parseFloat(coordinates.lng).toFixed(3);
  return `位置: ${lat}, ${lng}`;
}

/**
 * 加载门店列表
 */
function loadStoreList() {
  const storesContainer = document.getElementById('stores-container');
  if (!storesContainer) return;
  
  const stores = location.getAllStores();
  
  if (stores.length === 0) {
    storesContainer.innerHTML = '<p>暂无门店信息</p>';
    return;
  }
  
  storesContainer.innerHTML = stores.map(store => createStoreCard(store)).join('');
}

/**
 * 创建门店卡片HTML
 * @param {Object} store 门店信息
 * @param {number} distance 距离（可选）
 * @returns {string} 门店卡片HTML
 */
function createStoreCard(store, distance = null) {
  const distanceDisplay = distance !== null ? 
    `<div class="store-distance">${distance.toFixed(1)} 公里</div>` : '';
  
  return `
    <div class="store-card" data-id="${store.id}">
      <h4 class="store-name">${store.name}</h4>
      <div class="store-address">${store.address}</div>
      <div class="store-hours"><span>营业时间:</span> ${store.openingHours}</div>
      <div class="store-contact"><span>联系电话:</span> ${store.contact}</div>
      ${distanceDisplay}
      <a href="https://maps.google.com/?q=${store.lat},${store.lng}" target="_blank" class="btn btn-sm">查看地图</a>
    </div>
  `;
}

/**
 * 更新最近门店显示
 * @param {Object} coordinates 坐标对象
 */
function updateNearestStore(coordinates) {
  const nearestStoreDetails = document.getElementById('nearest-store-details');
  if (!nearestStoreDetails) return;
  
  try {
    const nearest = location.findNearestStore(coordinates);
    
    if (nearest) {
      // 显示最近门店区域
      document.querySelector('.nearest-store').style.display = 'block';
      
      // 更新最近门店详情
      nearestStoreDetails.innerHTML = createStoreCard(nearest, nearest.distance);
    }
  } catch (error) {
    console.error('获取最近门店失败', error);
    nearestStoreDetails.innerHTML = '<p>无法获取最近门店信息</p>';
  }
}

/**
 * 按距离排序门店列表
 * @param {Object} coordinates 坐标对象
 */
function sortStoresByDistance(coordinates) {
  const storesContainer = document.getElementById('stores-container');
  if (!storesContainer) return;
  
  try {
    const sortedStores = location.getStoresByDistance(coordinates);
    storesContainer.innerHTML = sortedStores.map(store => 
      createStoreCard(store, store.distance)
    ).join('');
  } catch (error) {
    console.error('按距离排序门店失败', error);
  }
}

/**
 * 搜索地址并更新位置
 * @param {string} address 地址文本
 */
async function searchAddress(address) {
  try {
    // 使用Nominatim API (OpenStreetMap)进行地理编码
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('地址搜索API请求失败');
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('无法找到该地址');
    }
    
    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // 设置手动位置
    location.setManualLocation(lat, lng, address);
    
    // 更新UI
    document.getElementById('location-display').textContent = address;
    const locationSource = document.getElementById('location-source');
    locationSource.textContent = '手动设置';
    locationSource.className = 'source-tag source-manual';
    
    // 更新最近门店和排序
    const coordinates = { lat, lng };
    updateNearestStore(coordinates);
    sortStoresByDistance(coordinates);
    
    return { lat, lng };
  } catch (error) {
    console.error('地址搜索失败', error);
    throw error;
  }
}

/**
 * 根据屏幕尺寸调整布局
 */
function adjustLocatorLayout() {
  const breakpoint = screen.getCurrentBreakpoint();
  const container = document.querySelector('.store-locator');
  
  if (!container) return;
  
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    // 移动端布局
    container.classList.add('mobile-layout');
    container.classList.remove('desktop-layout');
  } else {
    // 桌面端布局
    container.classList.add('desktop-layout');
    container.classList.remove('mobile-layout');
  }
}

// 导出功能供其他模块使用
export {
  initStoreLocator,
  tryGetUserLocation,
  updateNearestStore
}; 