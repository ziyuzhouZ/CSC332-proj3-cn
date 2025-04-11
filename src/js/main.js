// 下拉菜单功能
document.querySelector('.nav-item').addEventListener('mouseover', function() {
    document.querySelector('.dropdown-menu').style.display = 'block';
});

// 轮播图功能
let currentSlide = 0;
function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

// 产品卡片点击事件
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function() {
        window.location.href = 'product-detail.html?id=' + this.dataset.id;
    });
});

// 导入屏幕响应式工具
import ScreenUtils from './modules/screen.js';

// 导航菜单处理
document.addEventListener('DOMContentLoaded', () => {
    // 初始化屏幕响应式工具
    const screen = ScreenUtils.init();
    
    // 根据屏幕尺寸自动调整导航栏样式
    function adjustNavigation() {
        const navLinks = document.querySelector('.nav-links');
        const breakpoint = screen.getCurrentBreakpoint();
        
        if (breakpoint === 'xs' || breakpoint === 'sm') {
            navLinks?.classList.add('mobile-nav');
        } else {
            navLinks?.classList.remove('mobile-nav');
            // 确保菜单在桌面端可见
            navLinks?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }
    
    // 初始调整和监听变化
    adjustNavigation();
    screen.onResize(adjustNavigation);
    
    // 移动端菜单切换
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // 更新菜单图标状态
            const spans = menuToggle.getElementsByTagName('span');
            Array.from(spans).forEach((span, index) => {
                span.style.transform = navLinks.classList.contains('active')
                    ? index === 0 ? 'rotate(45deg) translate(5px, 5px)'
                        : index === 1 ? 'scale(0)'
                            : 'rotate(-45deg) translate(5px, -5px)'
                    : '';
            });
        });
    }

    // 处理下拉菜单在移动端的展开/收起
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                const { width } = screen.getScreenState();
                if (width <= 768) {
                    e.preventDefault();
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
    });
});

// 滚动处理
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (header) {
        // 向下滚动时隐藏导航栏，向上滚动时显示
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        // 添加阴影效果
        if (scrollTop > 0) {
            header.style.boxShadow = 'var(--shadow-md)';
        } else {
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    }
    
    lastScrollTop = scrollTop;
});

// 购物车计数器模拟
const cartCount = document.querySelector('.cart-count');
if (cartCount) {
    // 从localStorage获取购物车数量
    const count = localStorage.getItem('cartCount') || 0;
    cartCount.textContent = count;
}

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 页面加载动画
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// 响应式图片加载
function loadResponsiveImages() {
    const images = document.querySelectorAll('img[data-src]');
    const config = {
        rootMargin: '50px 0px',
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries, self) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.onload = () => img.classList.add('loaded');
                self.unobserve(img);
            }
        });
    }, config);

    images.forEach(img => observer.observe(img));
}

// 初始化响应式图片加载
if ('IntersectionObserver' in window) {
    loadResponsiveImages();
}