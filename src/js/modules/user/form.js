/**
 * 表单验证规则
 */
const rules = {
    // 用户名验证规则
    username: {
        required: true,
        pattern: /^[a-zA-Z0-9_-]{3,20}$/,
        message: {
            required: '请输入用户名',
            pattern: '用户名只能包含字母、数字、下划线和连字符，长度3-20位'
        }
    },
    
    // 手机号验证规则
    phone: {
        required: true,
        pattern: /^1[3-9]\d{9}$/,
        message: {
            required: '请输入手机号',
            pattern: '请输入正确的手机号'
        }
    },
    
    // 邮箱验证规则
    email: {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: {
            required: '请输入邮箱',
            pattern: '请输入正确的邮箱地址'
        }
    },
    
    // 密码验证规则
    password: {
        required: true,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message: {
            required: '请输入密码',
            pattern: '密码必须包含大小写字母和数字，长度至少8位'
        }
    },
    
    // 确认密码验证规则
    confirmPassword: {
        required: true,
        validator: (value, form) => value === form.password.value,
        message: {
            required: '请确认密码',
            validator: '两次输入的密码不一致'
        }
    },
    
    // 地址验证规则
    address: {
        required: true,
        minLength: 5,
        maxLength: 100,
        message: {
            required: '请输入详细地址',
            minLength: '地址长度不能少于5个字符',
            maxLength: '地址长度不能超过100个字符'
        }
    }
};

/**
 * 表单验证器
 */
class FormValidator {
    /**
     * 构造函数
     * @param {HTMLFormElement} form - 表单元素
     * @param {Object} customRules - 自定义验证规则
     */
    constructor(form, customRules = {}) {
        this.form = form;
        this.rules = { ...rules, ...customRules };
        this.errors = new Map();
        
        this.bindEvents();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 实时验证
        this.form.addEventListener('input', (e) => {
            const field = e.target;
            const name = field.name;
            
            if (this.rules[name]) {
                this.validateField(field);
            }
        });
        
        // 提交验证
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.validateForm()) {
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                
                // 触发表单提交事件
                this.form.dispatchEvent(new CustomEvent('formSubmit', {
                    detail: { data }
                }));
            }
        });
    }
    
    /**
     * 验证单个字段
     * @param {HTMLElement} field - 表单字段
     * @returns {boolean} 验证结果
     */
    validateField(field) {
        const name = field.name;
        const value = field.value;
        const rule = this.rules[name];
        
        if (!rule) return true;
        
        // 清除之前的错误
        this.clearError(field);
        
        // 必填验证
        if (rule.required && !value) {
            this.showError(field, rule.message.required);
            return false;
        }
        
        // 正则验证
        if (rule.pattern && !rule.pattern.test(value)) {
            this.showError(field, rule.message.pattern);
            return false;
        }
        
        // 长度验证
        if (rule.minLength && value.length < rule.minLength) {
            this.showError(field, rule.message.minLength);
            return false;
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
            this.showError(field, rule.message.maxLength);
            return false;
        }
        
        // 自定义验证
        if (rule.validator && !rule.validator(value, this.form)) {
            this.showError(field, rule.message.validator);
            return false;
        }
        
        return true;
    }
    
    /**
     * 验证整个表单
     * @returns {boolean} 验证结果
     */
    validateForm() {
        let isValid = true;
        
        // 清除所有错误
        this.clearAllErrors();
        
        // 验证所有字段
        for (const [name, rule] of Object.entries(this.rules)) {
            const field = this.form.elements[name];
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * 显示错误信息
     * @param {HTMLElement} field - 表单字段
     * @param {string} message - 错误信息
     */
    showError(field, message) {
        const errorElement = this.createErrorElement(message);
        field.classList.add('error');
        field.parentNode.appendChild(errorElement);
        this.errors.set(field, errorElement);
    }
    
    /**
     * 清除字段错误
     * @param {HTMLElement} field - 表单字段
     */
    clearError(field) {
        const errorElement = this.errors.get(field);
        if (errorElement) {
            errorElement.remove();
            this.errors.delete(field);
        }
        field.classList.remove('error');
    }
    
    /**
     * 清除所有错误
     */
    clearAllErrors() {
        for (const [field] of this.errors) {
            this.clearError(field);
        }
    }
    
    /**
     * 创建错误提示元素
     * @param {string} message - 错误信息
     * @returns {HTMLElement} 错误提示元素
     */
    createErrorElement(message) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;
        return error;
    }
}

/**
 * 地址表单验证器
 */
export class AddressFormValidator extends FormValidator {
    constructor(form) {
        super(form, {
            // 收货人姓名验证规则
            receiver: {
                required: true,
                pattern: /^[\u4e00-\u9fa5a-zA-Z]{2,20}$/,
                message: {
                    required: '请输入收货人姓名',
                    pattern: '收货人姓名只能包含中文或英文，长度2-20位'
                }
            },
            
            // 邮政编码验证规则
            zipCode: {
                required: true,
                pattern: /^\d{6}$/,
                message: {
                    required: '请输入邮政编码',
                    pattern: '请输入正确的邮政编码'
                }
            }
        });
        
        // 省市区联动
        this.initRegionSelect();
    }
    
    /**
     * 初始化省市区选择器
     */
    initRegionSelect() {
        const provinceSelect = this.form.querySelector('[name="province"]');
        const citySelect = this.form.querySelector('[name="city"]');
        const districtSelect = this.form.querySelector('[name="district"]');
        
        if (!provinceSelect || !citySelect || !districtSelect) return;
        
        // 加载省份数据
        this.loadProvinces(provinceSelect);
        
        // 省份变化时加载城市
        provinceSelect.addEventListener('change', () => {
            this.loadCities(citySelect, provinceSelect.value);
            districtSelect.innerHTML = '<option value="">请选择区/县</option>';
        });
        
        // 城市变化时加载区县
        citySelect.addEventListener('change', () => {
            this.loadDistricts(districtSelect, provinceSelect.value, citySelect.value);
        });
    }
    
    /**
     * 加载省份数据
     * @param {HTMLSelectElement} select - 省份选择器
     */
    async loadProvinces(select) {
        try {
            const response = await fetch('/api/regions/provinces');
            const provinces = await response.json();
            
            select.innerHTML = provinces.map(p => 
                `<option value="${p.code}">${p.name}</option>`
            ).join('');
        } catch (error) {
            console.error('加载省份数据失败:', error);
        }
    }
    
    /**
     * 加载城市数据
     * @param {HTMLSelectElement} select - 城市选择器
     * @param {string} provinceCode - 省份代码
     */
    async loadCities(select, provinceCode) {
        try {
            const response = await fetch(`/api/regions/cities?province=${provinceCode}`);
            const cities = await response.json();
            
            select.innerHTML = cities.map(c => 
                `<option value="${c.code}">${c.name}</option>`
            ).join('');
        } catch (error) {
            console.error('加载城市数据失败:', error);
        }
    }
    
    /**
     * 加载区县数据
     * @param {HTMLSelectElement} select - 区县选择器
     * @param {string} provinceCode - 省份代码
     * @param {string} cityCode - 城市代码
     */
    async loadDistricts(select, provinceCode, cityCode) {
        try {
            const response = await fetch(
                `/api/regions/districts?province=${provinceCode}&city=${cityCode}`
            );
            const districts = await response.json();
            
            select.innerHTML = districts.map(d => 
                `<option value="${d.code}">${d.name}</option>`
            ).join('');
        } catch (error) {
            console.error('加载区县数据失败:', error);
        }
    }
}

// 导出验证器
export { FormValidator };
