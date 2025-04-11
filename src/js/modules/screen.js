/**
 * 响应式屏幕工具模块
 * 提供屏幕尺寸变化监控、方向检测和相关事件处理
 */

// 存储屏幕状态的数据结构
const screenState = {
  width: window.innerWidth,
  height: window.innerHeight,
  orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  breakpoints: {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1600
  }
};

// 事件监听器存储
const eventListeners = {
  resize: [],
  orientationChange: []
};

// 本地存储键名
const STORAGE_KEY = 'screen_preferences';

/**
 * 初始化屏幕监控
 * @param {Object} options 可选的配置项
 */
function init(options = {}) {
  // 合并用户提供的断点设置
  if (options.breakpoints) {
    screenState.breakpoints = {
      ...screenState.breakpoints,
      ...options.breakpoints
    };
  }

  // 从本地存储加载用户偏好设置
  loadPreferences();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 初始化完成后立即触发一次更新
  updateScreenState();
  
  console.log('屏幕响应式工具已初始化', screenState);
  
  return {
    getScreenState,
    getCurrentBreakpoint,
    isBreakpoint,
    onResize,
    onOrientationChange,
    savePreference,
    removeEventListener
  };
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 防抖函数实现
  let resizeTimeout;
  
  // 监听窗口大小变化事件
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateScreenState();
    }, 100); // 100ms的防抖间隔
  });
  
  // 监听设备方向变化事件
  window.addEventListener('orientationchange', () => {
    updateScreenState();
  });
}

/**
 * 更新屏幕状态并触发相应事件
 */
function updateScreenState() {
  const prevState = { ...screenState };
  
  // 更新尺寸
  screenState.width = window.innerWidth;
  screenState.height = window.innerHeight;
  
  // 更新方向
  const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  const orientationChanged = screenState.orientation !== newOrientation;
  screenState.orientation = newOrientation;
  
  // 触发resize事件
  eventListeners.resize.forEach(callback => {
    try {
      callback(screenState);
    } catch (error) {
      console.error('屏幕尺寸变化事件回调执行出错:', error);
    }
  });
  
  // 如果方向发生变化，触发orientationChange事件
  if (orientationChanged) {
    eventListeners.orientationChange.forEach(callback => {
      try {
        callback(screenState);
      } catch (error) {
        console.error('屏幕方向变化事件回调执行出错:', error);
      }
    });
  }
}

/**
 * 获取当前屏幕状态
 * @returns {Object} 当前屏幕状态
 */
function getScreenState() {
  return { ...screenState };
}

/**
 * 获取当前匹配的断点
 * @returns {string} 断点名称 (xs, sm, md, lg, xl)
 */
function getCurrentBreakpoint() {
  const { width, breakpoints } = screenState;
  
  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'sm';
  if (width < breakpoints.md) return 'md';
  if (width < breakpoints.lg) return 'lg';
  if (width < breakpoints.xl) return 'xl';
  return 'xxl';
}

/**
 * 检查当前是否匹配指定断点
 * @param {string} breakpoint 断点名称
 * @returns {boolean} 是否匹配
 */
function isBreakpoint(breakpoint) {
  return getCurrentBreakpoint() === breakpoint;
}

/**
 * 注册屏幕尺寸变化回调
 * @param {Function} callback 回调函数
 * @returns {string} 事件ID，用于移除监听器
 */
function onResize(callback) {
  if (typeof callback !== 'function') {
    throw new Error('回调必须是一个函数');
  }
  
  const eventId = generateEventId();
  eventListeners.resize.push(callback);
  return eventId;
}

/**
 * 注册屏幕方向变化回调
 * @param {Function} callback 回调函数
 * @returns {string} 事件ID，用于移除监听器
 */
function onOrientationChange(callback) {
  if (typeof callback !== 'function') {
    throw new Error('回调必须是一个函数');
  }
  
  const eventId = generateEventId();
  eventListeners.orientationChange.push(callback);
  return eventId;
}

/**
 * 移除事件监听器
 * @param {string} eventType 事件类型 ('resize' 或 'orientationChange')
 * @param {Function} callback 要移除的回调函数
 */
function removeEventListener(eventType, callback) {
  if (!eventListeners[eventType]) {
    return;
  }
  
  const index = eventListeners[eventType].indexOf(callback);
  if (index !== -1) {
    eventListeners[eventType].splice(index, 1);
  }
}

/**
 * 生成唯一的事件ID
 * @returns {string} 唯一ID
 */
function generateEventId() {
  return `screen_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 保存用户屏幕偏好设置到本地存储
 * @param {string} key 设置键名
 * @param {*} value 设置值
 */
function savePreference(key, value) {
  try {
    const preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    preferences[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('保存屏幕偏好设置失败:', error);
    return false;
  }
}

/**
 * 从本地存储加载用户偏好设置
 */
function loadPreferences() {
  try {
    const preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // 应用已保存的偏好设置
    if (preferences.breakpoints) {
      screenState.breakpoints = {
        ...screenState.breakpoints,
        ...preferences.breakpoints
      };
    }
  } catch (error) {
    console.error('加载屏幕偏好设置失败:', error);
  }
}

// 导出模块
export default {
  init,
  getScreenState,
  getCurrentBreakpoint,
  isBreakpoint,
  onResize,
  onOrientationChange,
  savePreference
}; 