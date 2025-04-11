export class Carousel {
    constructor(element, options = {}) {
        this.carousel = element;
        this.track = element.querySelector('.carousel-track');
        this.slides = Array.from(this.track.children);
        this.nextButton = element.querySelector('.carousel-btn.next');
        this.prevButton = element.querySelector('.carousel-btn.prev');
        this.dotsContainer = element.querySelector('.carousel-dots');
        
        // 配置选项
        this.options = {
            interval: options.interval || 5000,
            transition: options.transition || 500,
            autoplay: options.autoplay !== undefined ? options.autoplay : true
        };

        this.currentSlide = 0;
        this.slideCount = this.slides.length;
        this.isMoving = false;

        this.tabs = document.querySelectorAll('.carousel-tab');
        this.init();
    }

    init() {
        // 创建指示点
        this.createDots();
        
        // 绑定事件
        this.nextButton.addEventListener('click', () => this.next());
        this.prevButton.addEventListener('click', () => this.prev());
        
        // 触摸事件支持
        this.initTouchEvents();
        
        // 自动播放
        if (this.options.autoplay) {
            this.startAutoplay();
            
            // 鼠标悬停时暂停
            this.carousel.addEventListener('mouseenter', () => this.stopAutoplay());
            this.carousel.addEventListener('mouseleave', () => this.startAutoplay());
        }

        // 更新初始状态
        this.updateDots();

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });
    }

    createDots() {
        for (let i = 0; i < this.slideCount; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.dotsContainer.appendChild(dot);
        }
    }

    updateDots() {
        const dots = this.dotsContainer.children;
        Array.from(dots).forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    next() {
        if (this.isMoving) return;
        this.goToSlide((this.currentSlide + 1) % this.slideCount);
    }

    prev() {
        if (this.isMoving) return;
        this.goToSlide(this.currentSlide === 0 ? this.slideCount - 1 : this.currentSlide - 1);
    }

    goToSlide(index) {
        if (this.isMoving || index === this.currentSlide) return;

        this.isMoving = true;
        const offset = -index * 100;
        
        this.track.style.transform = `translateX(${offset}%)`;
        this.track.style.transition = `transform ${this.options.transition}ms ease`;

        this.currentSlide = index;
        this.updateDots();

        // 过渡结束后重置状态
        setTimeout(() => {
            this.isMoving = false;
        }, this.options.transition);
    }

    initTouchEvents() {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const handleTouchStart = (e) => {
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            isDragging = true;
            this.stopAutoplay();
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const diff = currentX - startX;
            
            if (Math.abs(diff) > 50) {
                isDragging = false;
                if (diff > 0) {
                    this.prev();
                } else {
                    this.next();
                }
            }
        };

        const handleTouchEnd = () => {
            isDragging = false;
            this.startAutoplay();
        };

        // 触摸事件
        this.carousel.addEventListener('touchstart', handleTouchStart);
        this.carousel.addEventListener('touchmove', handleTouchMove);
        this.carousel.addEventListener('touchend', handleTouchEnd);

        // 鼠标事件
        this.carousel.addEventListener('mousedown', handleTouchStart);
        this.carousel.addEventListener('mousemove', handleTouchMove);
        this.carousel.addEventListener('mouseup', handleTouchEnd);
        this.carousel.addEventListener('mouseleave', handleTouchEnd);
    }

    startAutoplay() {
        if (this.options.autoplay && !this.autoplayInterval) {
            this.autoplayInterval = setInterval(() => this.next(), this.options.interval);
        }
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    switchTab(clickedTab) {
        // Remove active class from all tabs and slides
        this.tabs.forEach(tab => tab.classList.remove('active'));
        this.slides.forEach(slide => slide.classList.remove('active'));

        // Add active class to clicked tab
        clickedTab.classList.add('active');

        // Find and activate corresponding slide
        const tabName = clickedTab.dataset.tab;
        const targetSlide = Array.from(this.slides).find(
            slide => slide.dataset.tab === tabName
        );

        if (targetSlide) {
            targetSlide.classList.add('active');
        }
    }
}

// 初始化轮播图
document.addEventListener('DOMContentLoaded', () => {
    const carouselElement = document.querySelector('.hero-carousel');
    if (carouselElement) {
        new Carousel(carouselElement, {
            interval: 5000,
            transition: 500,
            autoplay: true
        });
    }
}); 