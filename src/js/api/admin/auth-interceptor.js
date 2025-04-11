/**
 * 管理员认证拦截器
 * 拦截所有 fetch 请求，处理认证相关的响应
 */

// 确保只初始化一次拦截器
if (typeof window.adminAuthInterceptorInitialized === 'undefined') {
    console.log('初始化管理员认证拦截器');
    
    // 保存原始 fetch 方法
    const originalFetch = window.fetch;
    
    // 重写 fetch 方法 - 对特定的管理员API请求进行模拟响应
    window.fetch = async function(url, options) {
        const urlString = url.toString();
        
        // 匹配管理员API请求
        if (urlString.includes('/api/admin/auth/')) {
            console.log('拦截管理员API请求:', urlString);
            
            // 创建延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 模拟登录响应
            if (urlString.includes('/api/admin/auth/login')) {
                const body = JSON.parse(options.body);
                
                // 硬编码账号验证
                if (body.username === 'admin' && body.password === 'admin123') {
                    return new Response(JSON.stringify({
                        success: true,
                        token: 'mock-admin-token-' + Date.now(),
                        admin: {
                            id: 1,
                            username: body.username,
                            email: 'admin@example.com'
                        }
                    }));
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: '用户名或密码不正确'
                    }), { status: 401 });
                }
            }
            
            // 模拟注册响应
            if (urlString.includes('/api/admin/auth/register')) {
                const body = JSON.parse(options.body);
                
                // 验证邀请码
                if (body.inviteCode === '6666') {
                    return new Response(JSON.stringify({
                        success: true,
                        token: 'mock-admin-token-' + Date.now(),
                        admin: {
                            id: 1,
                            username: body.username,
                            email: body.email
                        }
                    }));
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: '邀请码无效'
                    }), { status: 400 });
                }
            }
            
            // 模拟验证响应
            if (urlString.includes('/api/admin/auth/validate')) {
                // 如果有认证头，则视为有效
                if (options.headers && options.headers.Authorization) {
                    return new Response(JSON.stringify({
                        success: true,
                        admin: {
                            id: 1,
                            username: 'admin',
                            email: 'admin@example.com'
                        }
                    }));
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: '未授权访问'
                    }), { status: 401 });
                }
            }
        }
        
        // 对于其他请求，使用原始fetch方法
        return originalFetch(url, options);
    };
    
    // 标记拦截器已初始化
    window.adminAuthInterceptorInitialized = true;
    
    // 检查是否在管理员页面但没有token
    document.addEventListener('DOMContentLoaded', function() {
        const isAdminPage = window.location.pathname.includes('/admin/') &&
                          !window.location.pathname.includes('/admin/login.html') &&
                          !window.location.pathname.includes('/admin/register.html');
        
        if (isAdminPage && !localStorage.getItem('admin_token')) {
            console.log('管理员页面但未登录，重定向到登录页面');
            window.location.href = '/html/admin/login.html';
        }
    });
} 