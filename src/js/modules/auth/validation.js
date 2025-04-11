/**
 * 密码强度检查
 * @param {string} password - 要检查的密码
 * @returns {Object} 包含密码强度评分和模式匹配结果
 */
function checkPasswordStrength(password) {
    let strength = 0;
    const patterns = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength += patterns.length ? 1 : 0;
    strength += (patterns.lowercase && patterns.uppercase) ? 1 : 0;
    strength += patterns.numbers ? 1 : 0;
    strength += patterns.special ? 1 : 0;

    return {
        score: strength,
        level: strength <= 1 ? 'weak' : strength <= 2 ? 'medium' : 'strong',
        patterns
    };
}

/**
 * 验证码倒计时
 * @param {HTMLButtonElement} button - 发送验证码按钮
 */
function startCountdown(button) {
    let timer = 60;
    button.disabled = true;
    
    const updateButton = () => {
        button.querySelector('.countdown').textContent = `(${timer}s)`;
        if (timer === 0) {
            clearInterval(interval);
            button.disabled = false;
            button.querySelector('span:first-child').textContent = '重新发送';
            button.querySelector('.countdown').textContent = '';
        }
        timer--;
    };

    updateButton();
    const interval = setInterval(updateButton, 1000);
}

/**
 * 显示错误提示
 * @param {HTMLElement} input - 输入元素
 * @param {string} message - 错误信息
 */
function showError(input, message) {
    const tooltip = input.closest('.input-group').querySelector('.error-tooltip');
    tooltip.querySelector('span').textContent = message;
    tooltip.classList.add('visible');
    input.classList.add('error');
}

/**
 * 隐藏错误提示
 * @param {HTMLElement} input - 输入元素
 */
function hideError(input) {
    const tooltip = input.closest('.input-group').querySelector('.error-tooltip');
    tooltip.classList.remove('visible');
    input.classList.remove('error');
}

// 导入API模块
import { checkUsername, safeParseJSON, login, register } from './api.js';

/**
 * 用户名验证
 * @param {string} username - 要验证的用户名
 * @returns {Promise<boolean>} 用户名是否已存在
 */
async function validateUsername(username) {
    try {
        // 使用api.js中的checkUsername函数
        const data = await checkUsername(username);
        return data.exists;
    } catch (error) {
        console.error('验证用户名出错:', error);
        return false;
    }
}

/**
 * 初始化表单验证
 */
function initFormValidation() {
    // 检测是否是注册表单
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        initRegisterForm(registerForm);
    } else if (loginForm) {
        initLoginForm(loginForm);
    }
}

/**
 * 初始化注册表单
 * @param {HTMLFormElement} form - 注册表单
 */
function initRegisterForm(form) {
    // 密码强度检查
    const passwordInput = form.querySelector('input[name="password"]');
    if (passwordInput) {
        const strengthBar = form.querySelector('.strength-level');
        const strengthText = form.querySelector('.strength-text');

        passwordInput.addEventListener('input', () => {
            const { level, patterns } = checkPasswordStrength(passwordInput.value);
            
            strengthBar.className = 'strength-level ' + level;
            strengthText.textContent = `密码强度：${
                level === 'weak' ? '弱' : 
                level === 'medium' ? '中' : '强'
            }`;

            if (!patterns.length) {
                showError(passwordInput, '密码长度至少为8位');
            } else if (!(patterns.lowercase && patterns.uppercase)) {
                showError(passwordInput, '密码需包含大小写字母');
            } else if (!patterns.numbers) {
                showError(passwordInput, '密码需包含数字');
            } else {
                hideError(passwordInput);
            }
        });
    }

    // 确认密码验证
    const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value !== passwordInput.value) {
                showError(confirmPasswordInput, '两次输入的密码不一致');
            } else {
                hideError(confirmPasswordInput);
            }
        });
    }

    // 用户名验证
    const usernameInput = form.querySelector('input[name="username"]');
    if (usernameInput) {
        let timeout;
        usernameInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                if (usernameInput.value.length < 3) {
                    showError(usernameInput, '用户名至少需要3个字符');
                    return;
                }

                const exists = await validateUsername(usernameInput.value);
                if (exists) {
                    showError(usernameInput, '该用户名已被使用');
                } else {
                    hideError(usernameInput);
                }
            }, 500);
        });
    }

    // 密码显示切换
    const toggleButtons = form.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.querySelector('i').className = `icon-${type === 'password' ? 'eye' : 'eye-off'}`;
        });
    });

    // 注册表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');

        try {
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            // 使用api.js中的register函数替代直接fetch
            const data = await register(userData);
            
            // 显示成功消息
            form.closest('.auth-card').style.display = 'none';
            document.querySelector('.success-message').classList.add('visible');
        } catch (error) {
            alert(error.message || '注册过程中出现错误');
        } finally {
            submitButton.classList.remove('loading');
        }
    });
}

/**
 * 初始化登录表单
 * @param {HTMLFormElement} form - 登录表单
 */
function initLoginForm(form) {
    // 密码显示切换
    const toggleButtons = form.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.querySelector('i').className = `icon-${type === 'password' ? 'eye' : 'eye-off'}`;
        });
    });

    // 登录表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');

        try {
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            // 使用api.js中的login函数替代直接fetch
            const data = await login(credentials);
            
            // 显示成功动画
            const animation = document.querySelector('#successAnimation');
            if (animation) {
                animation.style.display = 'block';
            }
            
            // 跳转到用户中心，而不是首页
            setTimeout(() => {
                window.location.href = '../user-center/index.html';
            }, 1000);
        } catch (error) {
            alert(error.message || '登录过程中出现错误');
        } finally {
            submitButton.classList.remove('loading');
        }
    });
}

// 初始化表单验证
document.addEventListener('DOMContentLoaded', initFormValidation); 