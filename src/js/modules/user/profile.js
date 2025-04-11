import { userAPI } from './api.js';
import { FormValidator } from './form.js';
import { router } from './router.js';

class ProfileManager {
    constructor() {
        this.form = document.getElementById('profileForm');
        this.editBtn = document.getElementById('editProfileBtn');
        this.cancelBtn = document.getElementById('cancelEditBtn');
        this.submitBtn = this.form.querySelector('button[type="submit"]');
        this.avatarInput = document.getElementById('avatarInput');
        this.avatarPreview = document.getElementById('avatarPreview');
        this.uploadBtn = document.getElementById('uploadAvatarBtn');
        this.avatarModal = document.getElementById('avatarModal');
        this.closeModalBtn = document.getElementById('closeAvatarModal');
        this.confirmCropBtn = document.getElementById('confirmCropBtn');
        this.cancelCropBtn = document.getElementById('cancelCropBtn');
        
        this.validator = new FormValidator(this.form);
        this.cropper = null;
        this.originalData = null;
        
        this.init();
    }
    
    /**
     * 初始化
     */
    async init() {
        await this.loadProfile();
        this.bindEvents();
    }
    
    /**
     * 加载用户信息
     */
    async loadProfile() {
        try {
            const data = await userAPI.getProfile();
            this.originalData = data;
            this.fillForm(data);
            await this.loadHistory();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }
    
    /**
     * 填充表单数据
     * @param {Object} data - 用户信息
     */
    fillForm(data) {
        const fields = ['username', 'nickname', 'email', 'phone', 'gender', 'birthday', 'bio'];
        fields.forEach(field => {
            const input = this.form.elements[field];
            if (input && data[field]) {
                input.value = data[field];
            }
        });
        
        if (data.avatar) {
            this.avatarPreview.src = data.avatar;
        }
    }
    
    /**
     * 加载修改历史
     */
    async loadHistory() {
        try {
            const history = await userAPI.getProfileHistory();
            this.renderHistory(history);
        } catch (error) {
            console.error('加载历史记录失败:', error);
        }
    }
    
    /**
     * 渲染修改历史
     * @param {Array} history - 历史记录
     */
    renderHistory(history) {
        const container = document.querySelector('.history-list');
        container.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-icon">
                    <i class="icon-${item.type}"></i>
                </div>
                <div class="history-content">
                    <h4 class="history-title">${item.title}</h4>
                    <time class="history-time">${new Date(item.time).toLocaleString()}</time>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 编辑按钮
        this.editBtn.addEventListener('click', () => this.startEdit());
        
        // 取消按钮
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        
        // 表单提交
        this.form.addEventListener('formSubmit', async (e) => {
            await this.saveProfile(e.detail.data);
        });
        
        // 头像上传
        this.uploadBtn.addEventListener('click', () => this.avatarInput.click());
        this.avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        
        // 模态框操作
        this.closeModalBtn.addEventListener('click', () => this.closeAvatarModal());
        this.cancelCropBtn.addEventListener('click', () => this.closeAvatarModal());
        this.confirmCropBtn.addEventListener('click', () => this.saveCroppedAvatar());
    }
    
    /**
     * 开始编辑
     */
    startEdit() {
        const fields = this.form.elements;
        for (let field of fields) {
            if (field.type !== 'submit' && field.type !== 'button') {
                field.disabled = false;
            }
        }
        
        this.editBtn.hidden = true;
        this.submitBtn.hidden = false;
        this.cancelBtn.hidden = false;
    }
    
    /**
     * 取消编辑
     */
    cancelEdit() {
        const fields = this.form.elements;
        for (let field of fields) {
            if (field.type !== 'submit' && field.type !== 'button') {
                field.disabled = true;
            }
        }
        
        this.fillForm(this.originalData);
        this.editBtn.hidden = false;
        this.submitBtn.hidden = true;
        this.cancelBtn.hidden = true;
    }
    
    /**
     * 保存用户信息
     * @param {Object} data - 表单数据
     */
    async saveProfile(data) {
        try {
            await userAPI.updateProfile(data);
            await this.loadProfile();
            this.cancelEdit();
            router.showToast('保存成功');
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }
    
    /**
     * 处理头像变更
     * @param {Event} event - 文件输入事件
     */
    handleAvatarChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            router.showToast('请选择图片文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showAvatarModal(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * 显示头像裁剪模态框
     * @param {string} imageUrl - 图片URL
     */
    showAvatarModal(imageUrl) {
        this.avatarModal.classList.add('visible');
        
        const image = new Image();
        image.src = imageUrl;
        
        const container = this.avatarModal.querySelector('.cropper-container');
        container.innerHTML = '';
        container.appendChild(image);
        
        this.cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
            movable: false,
            zoomable: false,
            rotatable: false,
            scalable: false
        });
    }
    
    /**
     * 关闭头像裁剪模态框
     */
    closeAvatarModal() {
        this.avatarModal.classList.remove('visible');
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }
    
    /**
     * 保存裁剪后的头像
     */
    async saveCroppedAvatar() {
        if (!this.cropper) return;
        
        try {
            const canvas = this.cropper.getCroppedCanvas({
                width: 200,
                height: 200
            });
            
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            const response = await userAPI.uploadAvatar(blob);
            this.avatarPreview.src = response.url;
            this.closeAvatarModal();
            router.showToast('头像上传成功');
            
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }
}

// 当页面加载完成时初始化
window.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'profile') {
        new ProfileManager();
    }
}); 