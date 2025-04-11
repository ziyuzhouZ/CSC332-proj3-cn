/**
 * 社交功能管理类
 */
class SocialManager {
    constructor() {
        this.state = {
            reviews: {
                page: 1,
                pageSize: 10,
                hasMore: true,
                loading: false,
                filter: 'all'
            },
            favorites: new Set(this.loadFavorites())
        };

        this.elements = {
            reviewsList: document.querySelector('.reviews-list'),
            loadMoreBtn: document.querySelector('.btn-load-more'),
            reviewFilters: document.querySelector('.review-filters'),
            shareModal: document.getElementById('shareModal'),
            shareLink: document.getElementById('shareLink'),
            favoriteBtn: document.querySelector('.btn-favorite'),
            ratingOverview: document.querySelector('.rating-overview'),
            ratingBars: document.querySelector('.rating-bars')
        };

        this.reviewTemplate = document.getElementById('reviewTemplate');
        this.productId = new URLSearchParams(window.location.search).get('id');
    }

    /**
     * 初始化社交功能
     */
    init() {
        this.bindEvents();
        this.loadReviews();
        this.updateFavoriteState();
    }

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 评论筛选
        this.elements.reviewFilters?.addEventListener('click', (e) => {
            const filterBtn = e.target.closest('.filter-btn');
            if (!filterBtn) return;

            this.elements.reviewFilters.querySelector('.active')?.classList.remove('active');
            filterBtn.classList.add('active');
            
            this.state.reviews.filter = filterBtn.dataset.filter;
            this.state.reviews.page = 1;
            this.elements.reviewsList.innerHTML = '';
            this.loadReviews();
        });

        // 加载更多评论
        this.elements.loadMoreBtn?.addEventListener('click', () => {
            if (!this.state.reviews.loading && this.state.reviews.hasMore) {
                this.state.reviews.page++;
                this.loadReviews();
            }
        });

        // 分享功能
        const shareBtn = document.querySelector('.btn-share');
        shareBtn?.addEventListener('click', () => this.showShareModal());

        // 复制分享链接
        const copyBtn = document.querySelector('.btn-copy');
        copyBtn?.addEventListener('click', () => this.copyShareLink());

        // 社交平台分享
        const sharePlatforms = document.querySelector('.share-platforms');
        sharePlatforms?.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('.share-btn');
            if (shareBtn) {
                this.shareToPlatform(shareBtn.classList[1]);
            }
        });

        // 关闭分享模态框
        this.elements.shareModal?.querySelector('.btn-close').addEventListener('click', () => {
            this.elements.shareModal.classList.remove('visible');
        });

        // 收藏功能
        this.elements.favoriteBtn?.addEventListener('click', () => this.toggleFavorite());

        // 点赞功能
        this.elements.reviewsList?.addEventListener('click', (e) => {
            const helpfulBtn = e.target.closest('.btn-helpful');
            if (helpfulBtn) {
                this.toggleHelpful(helpfulBtn);
            }
        });
    }

    /**
     * 加载评论列表
     */
    async loadReviews() {
        if (this.state.reviews.loading || !this.state.reviews.hasMore) return;

        this.state.reviews.loading = true;
        this.updateLoadingState(true);

        try {
            const response = await this.fetchReviews();
            this.renderReviews(response.reviews);
            this.updateReviewStats(response.stats);

            this.state.reviews.hasMore = response.reviews.length === this.state.reviews.pageSize;
            this.elements.loadMoreBtn.hidden = !this.state.reviews.hasMore;

        } catch (error) {
            console.error('加载评论失败:', error);
        } finally {
            this.state.reviews.loading = false;
            this.updateLoadingState(false);
        }
    }

    /**
     * 渲染评论列表
     * @param {Array} reviews - 评论数据
     */
    renderReviews(reviews) {
        const fragment = document.createDocumentFragment();

        reviews.forEach(review => {
            const element = this.reviewTemplate.content.cloneNode(true);
            const container = element.querySelector('.review-item');

            // 防XSS处理
            const avatar = container.querySelector('.avatar');
            avatar.src = this.sanitizeUrl(review.avatar);
            avatar.alt = this.sanitizeText(review.username);

            container.querySelector('.reviewer-name').textContent = this.sanitizeText(review.username);
            container.querySelector('.review-time').textContent = this.formatDate(review.time);
            container.querySelector('.review-text').textContent = this.sanitizeText(review.content);
            
            // 渲染星级
            this.renderStars(container.querySelector('.rating-stars'), review.rating);

            // 渲染媒体内容
            if (review.media?.length) {
                const mediaContainer = container.querySelector('.review-media');
                review.media.forEach(item => {
                    if (item.type === 'image') {
                        const img = document.createElement('img');
                        img.src = this.sanitizeUrl(item.url);
                        img.alt = '评论图片';
                        mediaContainer.appendChild(img);
                    } else if (item.type === 'video') {
                        const video = document.createElement('video');
                        video.src = this.sanitizeUrl(item.url);
                        video.controls = true;
                        mediaContainer.appendChild(video);
                    }
                });
            }

            // 规格信息
            container.querySelector('.color').textContent = this.sanitizeText(review.specs.color);
            container.querySelector('.size').textContent = this.sanitizeText(review.specs.size);

            // 点赞数
            const helpfulBtn = container.querySelector('.btn-helpful');
            helpfulBtn.querySelector('.count').textContent = review.helpful;
            if (review.isHelpful) {
                helpfulBtn.classList.add('active');
            }

            fragment.appendChild(container);
        });

        this.elements.reviewsList.appendChild(fragment);
    }

    /**
     * 更新评论统计
     * @param {Object} stats - 统计数据
     */
    updateReviewStats(stats) {
        if (!this.elements.ratingOverview) return;

        const averageRating = stats.averageRating.toFixed(1);
        this.elements.ratingOverview.querySelector('.rating-score').textContent = averageRating;
        this.elements.ratingOverview.querySelector('.total-reviews').textContent = 
            `(${stats.totalReviews}条评价)`;

        this.renderStars(
            this.elements.ratingOverview.querySelector('.rating-stars'),
            stats.averageRating
        );

        // 渲染评分分布
        this.elements.ratingBars.innerHTML = '';
        for (let i = 5; i >= 1; i--) {
            const percentage = (stats.ratingDistribution[i] || 0) / stats.totalReviews * 100;
            this.elements.ratingBars.innerHTML += `
                <div class="rating-bar">
                    <span class="star-label">${i}星</span>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="bar-percent">${percentage.toFixed(1)}%</span>
                </div>
            `;
        }
    }

    /**
     * 渲染星级
     * @param {HTMLElement} container - 星级容器
     * @param {number} rating - 评分
     */
    renderStars(container, rating) {
        container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = `icon-star${i <= rating ? ' filled' : ''}`;
            container.appendChild(star);
        }
    }

    /**
     * 显示分享模态框
     */
    showShareModal() {
        if (!this.elements.shareModal) return;

        // 生成带ref的短链接
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('ref', 'share');
        
        this.elements.shareLink.value = shareUrl.href;
        this.elements.shareModal.classList.add('visible');
    }

    /**
     * 复制分享链接
     */
    async copyShareLink() {
        try {
            await navigator.clipboard.writeText(this.elements.shareLink.value);
            this.showToast('链接已复制');
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('复制失败，请手动复制', 'error');
        }
    }

    /**
     * 分享到社交平台
     * @param {string} platform - 平台名称
     */
    shareToPlatform(platform) {
        const url = encodeURIComponent(this.elements.shareLink.value);
        const title = encodeURIComponent(document.querySelector('.product-title').textContent);
        
        let shareUrl;
        switch (platform) {
            case 'wechat':
                // 显示二维码
                break;
            case 'weibo':
                shareUrl = `http://service.weibo.com/share/share.php?url=${url}&title=${title}`;
                break;
            case 'qzone':
                shareUrl = `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${url}&title=${title}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=500');
        }
    }

    /**
     * 切换收藏状态
     */
    async toggleFavorite() {
        if (!this.elements.favoriteBtn) return;

        try {
            const isFavorite = this.state.favorites.has(this.productId);
            const success = await this.updateFavoriteAPI(!isFavorite);

            if (success) {
                if (isFavorite) {
                    this.state.favorites.delete(this.productId);
                } else {
                    this.state.favorites.add(this.productId);
                }
                this.saveFavorites();
                this.updateFavoriteState();
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            this.showToast('操作失败，请稍后重试', 'error');
        }
    }

    /**
     * 更新收藏按钮状态
     */
    updateFavoriteState() {
        if (!this.elements.favoriteBtn) return;

        const isFavorite = this.state.favorites.has(this.productId);
        this.elements.favoriteBtn.classList.toggle('active', isFavorite);
        this.elements.favoriteBtn.querySelector('span').textContent = 
            isFavorite ? '已收藏' : '收藏';
    }

    /**
     * 从本地存储加载收藏数据
     * @returns {Array} 收藏的商品ID列表
     */
    loadFavorites() {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    }

    /**
     * 保存收藏数据到本地存储
     */
    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify([...this.state.favorites]));
    }

    /**
     * 切换评论点赞状态
     * @param {HTMLElement} button - 点赞按钮
     */
    async toggleHelpful(button) {
        const reviewItem = button.closest('.review-item');
        if (!reviewItem || button.disabled) return;

        button.disabled = true;
        try {
            const isHelpful = button.classList.contains('active');
            const success = await this.updateHelpfulAPI(reviewItem.dataset.id, !isHelpful);

            if (success) {
                button.classList.toggle('active');
                const countElement = button.querySelector('.count');
                const count = parseInt(countElement.textContent);
                countElement.textContent = isHelpful ? count - 1 : count + 1;
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            this.showToast('操作失败，请稍后重试', 'error');
        } finally {
            button.disabled = false;
        }
    }

    /**
     * 更新加载状态
     * @param {boolean} loading - 是否加载中
     */
    updateLoadingState(loading) {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.classList.toggle('loading', loading);
            this.elements.loadMoreBtn.disabled = loading;
        }
    }

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showToast(message, type = 'success') {
        const toast = document.querySelector('.toast-share-success');
        if (!toast) return;

        toast.querySelector('span').textContent = message;
        toast.className = `toast-share-success ${type}`;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }

    /**
     * 格式化日期
     * @param {string|number} timestamp - 时间戳
     * @returns {string} 格式化后的日期
     */
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * 防XSS处理：清理文本
     * @param {string} text - 原始文本
     * @returns {string} 清理后的文本
     */
    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 防XSS处理：清理URL
     * @param {string} url - 原始URL
     * @returns {string} 清理后的URL
     */
    sanitizeUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.href;
        } catch {
            return '';
        }
    }

    /**
     * API请求：获取评论列表
     * @returns {Promise} 评论数据
     */
    async fetchReviews() {
        const params = new URLSearchParams({
            productId: this.productId,
            page: this.state.reviews.page,
            pageSize: this.state.reviews.pageSize,
            filter: this.state.reviews.filter
        });

        const response = await fetch(`/api/reviews?${params}`);
        if (!response.ok) throw new Error('获取评论失败');
        return response.json();
    }

    /**
     * API请求：更新收藏状态
     * @param {boolean} favorite - 是否收藏
     * @returns {Promise<boolean>} 操作是否成功
     */
    async updateFavoriteAPI(favorite) {
        const response = await fetch(`/api/favorites/${this.productId}`, {
            method: favorite ? 'PUT' : 'DELETE'
        });
        return response.ok;
    }

    /**
     * API请求：更新点赞状态
     * @param {string} reviewId - 评论ID
     * @param {boolean} helpful - 是否点赞
     * @returns {Promise<boolean>} 操作是否成功
     */
    async updateHelpfulAPI(reviewId, helpful) {
        const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
            method: helpful ? 'PUT' : 'DELETE'
        });
        return response.ok;
    }
}

// 导出社交功能管理器
export const socialManager = new SocialManager(); 