/**
 * 位置服务模块
 * 提供用户位置获取和最近门店推荐功能
 */

// 导入屏幕工具以便在界面上进行响应式调整
import ScreenUtils from './screen.js';

// 存储键名
const STORAGE_KEY = 'user_location_preferences';

// 地球半径（单位：公里）
const EARTH_RADIUS_KM = 6371;

// 隐私同意状态
const consentStatus = {
  locationTracking: false,
  lastUpdated: null
};

// 用户位置信息
const userLocation = {
  lat: null,
  lng: null,
  accuracy: null,
  source: null, // 'gps', 'ip', 'manual'
  timestamp: null
};

// 门店数据
const stores = [
  {
    id: 1,
    name: "Hanes Mall分店",
    address: "3320 Silas Creek Pkwy, Winston-Salem, NC 27103",
    lat: 36.063882,
    lng: -80.331560,
    openingHours: "周一至周六 10:00-20:00",
    contact: "(336) 555-0101"
  },
  {
    id: 2,
    name: "大学区分店",
    address: "1834 Wake Forest Rd, Winston-Salem, NC 27109",
    lat: 36.133661,
    lng: -80.275294,
    openingHours: "周一至周五 9:00-17:00",
    contact: "(336) 555-0202"
  },
  {
    id: 3,
    name: "市中心分店",
    address: "455 Vine St, Winston-Salem, NC 27101",
    lat: 36.097179,
    lng: -80.244566,
    openingHours: "周一至周五 10:00-18:00, 周六 10:00-16:00",
    contact: "(336) 555-0303"
  }
];

/**
 * 初始化位置服务
 * @param {Object} options 可选配置参数
 * @returns {Object} 位置服务API
 */
function init(options = {}) {
  // 从本地存储加载用户位置偏好
  loadUserPreferences();
  
  // 加载隐私同意状态
  loadConsentStatus();
  
  // 检查是否允许自动定位
  if (consentStatus.locationTracking) {
    // 尝试获取用户位置
    getUserLocation();
  }
  
  console.log('位置服务已初始化');
  
  // 返回公开API
  return {
    requestLocationPermission,
    getUserCoordinates,
    getAllStores,
    findNearestStore,
    getStoresByDistance,
    calculateDistance,
    setManualLocation,
    getLocationConsent,
    setLocationConsent,
    getUserLocationStatus
  };
}

/**
 * 请求位置权限并获取用户位置
 * @returns {Promise<Object>} 用户位置
 */
function requestLocationPermission() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("浏览器不支持地理位置功能"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 更新用户位置
        userLocation.lat = position.coords.latitude;
        userLocation.lng = position.coords.longitude;
        userLocation.accuracy = position.coords.accuracy;
        userLocation.source = 'gps';
        userLocation.timestamp = Date.now();
        
        // 更新隐私同意状态
        consentStatus.locationTracking = true;
        consentStatus.lastUpdated = Date.now();
        
        // 保存到本地存储
        saveUserPreferences();
        saveConsentStatus();
        
        console.log('已获取用户GPS位置', userLocation);
        resolve(userLocation);
      },
      async (error) => {
        console.warn('GPS定位失败，尝试IP定位', error);
        
        // 降级到IP定位
        try {
          const ipLocation = await getLocationByIP();
          resolve(ipLocation);
        } catch (ipError) {
          console.error('IP定位也失败，需要手动输入位置', ipError);
          reject(new Error('位置获取失败，请手动输入您的位置'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10分钟
      }
    );
  });
}

/**
 * 通过IP地址获取大致位置
 * @returns {Promise<Object>} 用户位置
 */
async function getLocationByIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`IP定位API响应错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 更新用户位置
    userLocation.lat = data.latitude;
    userLocation.lng = data.longitude;
    userLocation.accuracy = 10000; // IP定位精度较低，约10公里
    userLocation.source = 'ip';
    userLocation.timestamp = Date.now();
    
    // 保存到本地存储
    saveUserPreferences();
    
    console.log('已获取用户IP位置', userLocation);
    return userLocation;
  } catch (error) {
    console.error('IP定位请求失败', error);
    throw error;
  }
}

/**
 * 获取用户当前坐标
 * @returns {Promise<Object>} 用户坐标
 */
async function getUserCoordinates() {
  // 如果已有用户位置数据且不超过30分钟，直接返回
  if (userLocation.lat && userLocation.lng && 
      userLocation.timestamp && 
      (Date.now() - userLocation.timestamp < 30 * 60 * 1000)) {
    return { lat: userLocation.lat, lng: userLocation.lng };
  }
  
  // 否则重新获取
  if (consentStatus.locationTracking) {
    try {
      await requestLocationPermission();
      return { lat: userLocation.lat, lng: userLocation.lng };
    } catch (error) {
      console.error('获取用户坐标失败', error);
      throw error;
    }
  } else {
    throw new Error('用户未授权位置访问权限');
  }
}

/**
 * 设置用户手动输入的位置
 * @param {number} lat 纬度
 * @param {number} lng 经度
 * @param {string} locationName 位置名称（可选）
 */
function setManualLocation(lat, lng, locationName = '') {
  if (typeof lat !== 'number' || typeof lng !== 'number' ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('无效的坐标值');
  }
  
  userLocation.lat = lat;
  userLocation.lng = lng;
  userLocation.accuracy = null;
  userLocation.source = 'manual';
  userLocation.timestamp = Date.now();
  userLocation.locationName = locationName;
  
  // 保存到本地存储
  saveUserPreferences();
  
  console.log('已设置手动位置', userLocation);
  return userLocation;
}

/**
 * 使用Haversine公式计算两点间的距离
 * @param {number} lat1 第一点纬度
 * @param {number} lng1 第一点经度
 * @param {number} lat2 第二点纬度
 * @param {number} lng2 第二点经度
 * @returns {number} 距离（公里）
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  // 转换为弧度
  const toRad = (value) => value * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * 获取所有门店列表
 * @returns {Array} 门店列表
 */
function getAllStores() {
  return [...stores];
}

/**
 * 根据用户位置查找最近的门店
 * @param {Object} coordinates 坐标对象 {lat, lng}
 * @returns {Object} 最近的门店信息及距离
 */
function findNearestStore(coordinates = null) {
  if (!coordinates) {
    if (!userLocation.lat || !userLocation.lng) {
      throw new Error('未提供坐标且无法获取用户位置');
    }
    coordinates = { lat: userLocation.lat, lng: userLocation.lng };
  }
  
  let nearestStore = null;
  let minDistance = Infinity;
  
  stores.forEach(store => {
    const distance = calculateDistance(
      coordinates.lat, coordinates.lng,
      store.lat, store.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStore = { ...store, distance };
    }
  });
  
  return nearestStore;
}

/**
 * 获取按距离排序的门店列表
 * @param {Object} coordinates 坐标对象 {lat, lng}
 * @returns {Array} 按距离排序的门店列表
 */
function getStoresByDistance(coordinates = null) {
  if (!coordinates) {
    if (!userLocation.lat || !userLocation.lng) {
      throw new Error('未提供坐标且无法获取用户位置');
    }
    coordinates = { lat: userLocation.lat, lng: userLocation.lng };
  }
  
  return stores.map(store => {
    const distance = calculateDistance(
      coordinates.lat, coordinates.lng,
      store.lat, store.lng
    );
    
    return { ...store, distance };
  }).sort((a, b) => a.distance - b.distance);
}

/**
 * 获取用户位置隐私同意状态
 * @returns {boolean} 是否同意位置追踪
 */
function getLocationConsent() {
  return consentStatus.locationTracking;
}

/**
 * 设置用户位置隐私同意状态
 * @param {boolean} consent 是否同意
 */
function setLocationConsent(consent) {
  consentStatus.locationTracking = !!consent;
  consentStatus.lastUpdated = Date.now();
  saveConsentStatus();
  
  // 如果用户同意，尝试获取位置
  if (consent) {
    requestLocationPermission().catch(error => {
      console.warn('自动获取位置失败', error);
    });
  }
  
  return consentStatus.locationTracking;
}

/**
 * 获取用户位置
 * 如果有权限，则自动获取；否则不执行任何操作
 */
function getUserLocation() {
  if (consentStatus.locationTracking) {
    requestLocationPermission().catch(error => {
      console.warn('自动获取位置失败', error);
    });
  }
}

/**
 * 获取用户位置状态信息
 * @returns {Object} 位置状态
 */
function getUserLocationStatus() {
  return {
    available: !!(userLocation.lat && userLocation.lng),
    consent: consentStatus.locationTracking,
    source: userLocation.source,
    timestamp: userLocation.timestamp,
    lastUpdated: consentStatus.lastUpdated
  };
}

/**
 * 保存用户位置偏好到本地存储
 */
function saveUserPreferences() {
  try {
    const preferences = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      locationName: userLocation.locationName,
      source: userLocation.source,
      timestamp: userLocation.timestamp
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('保存位置偏好失败', error);
  }
}

/**
 * 从本地存储加载用户位置偏好
 */
function loadUserPreferences() {
  try {
    const storedPreferences = localStorage.getItem(STORAGE_KEY);
    
    if (storedPreferences) {
      const preferences = JSON.parse(storedPreferences);
      
      userLocation.lat = preferences.lat || null;
      userLocation.lng = preferences.lng || null;
      userLocation.locationName = preferences.locationName || '';
      userLocation.source = preferences.source || null;
      userLocation.timestamp = preferences.timestamp || null;
    }
  } catch (error) {
    console.error('加载位置偏好失败', error);
  }
}

/**
 * 保存隐私同意状态到本地存储
 */
function saveConsentStatus() {
  try {
    localStorage.setItem('location_consent', JSON.stringify(consentStatus));
  } catch (error) {
    console.error('保存隐私同意状态失败', error);
  }
}

/**
 * 从本地存储加载隐私同意状态
 */
function loadConsentStatus() {
  try {
    const storedConsent = localStorage.getItem('location_consent');
    
    if (storedConsent) {
      const parsed = JSON.parse(storedConsent);
      consentStatus.locationTracking = !!parsed.locationTracking;
      consentStatus.lastUpdated = parsed.lastUpdated || null;
    }
  } catch (error) {
    console.error('加载隐私同意状态失败', error);
  }
}

/**
 * 初始化门店数据（仅供测试使用）
 * 实际应用中可能从API获取
 */
function initializeStoreData() {
  console.log('门店数据已初始化，共 ' + stores.length + ' 家门店');
  return stores;
}

// 导出模块
export default {
  init,
  initializeStoreData,
  calculateDistance,
  getAllStores
}; 