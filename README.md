# Fashion Website

一个现代化的时尚电商网站，使用原生JavaScript构建。

## 项目结构

```
fashion-website/
├── src/
│   ├── html/                     # HTML页面
│   │   ├── index.html           # 首页
│   │   ├── shop.html            # 商品列表页
│   │   ├── product-detail.html  # 商品详情页
│   │   ├── cart.html            # 购物车页面
│   │   ├── checkout.html        # 结算页面
│   │   ├── deals.html           # 特惠活动页面
│   │   ├── auth/                # 认证相关页面
│   │   ├── user-center/         # 用户中心页面
│   │   └── about-pages/         # 关于我们等信息页面
│   │   └── admin/               # 管理后台页面（未完全实现）
│   │
│   ├── css/                     # 样式文件
│   │   ├── main.css            # 主样式文件
│   │   ├── components/         # 组件样式
│   │   └── pages/             # 页面特定样式
│   │
│   ├── js/                      # JavaScript文件
│   │   ├── main.js            # 主入口文件
│   │   ├── modules/           # 功能模块
│   │   │   ├── cart.js        # 购物车管理
│   │   │   ├── product.js     # 商品详情管理
│   │   │   ├── shop.js        # 商品列表管理
│   │   │   ├── auth/          # 认证相关功能
│   │   │   └── user/          # 用户中心功能
│   │   └── utils/             # 工具函数
│   │   └── lib/               # 第三方库（暂时为空）
│   │
│   └── public/                  # 静态资源
│       ├── images/            # 图片资源
│       └── fonts/            # 字体文件
│
├── server.js                    # 简易后端服务器
├── package.json                 # 项目依赖配置
├── start.sh                     # 启动脚本
├── dev.sh                       # 开发环境脚本
└── README.md                    # 项目说明文档
```

## 功能模块

### 1. 首页 (index.html)
- 轮播展示
- 新品推荐
- 热门分类
- 品牌故事
- 导航菜单

### 2. 商品展示
- 商品列表页 (shop.html)
  - 分类筛选
  - 价格排序
  - 分页功能
  - 快速添加到购物车
- 商品详情页 (product-detail.html)
  - 图片画廊
  - 规格选择
  - 数量选择
  - 加入购物车
  - 立即购买
  - 商品评论
  - 分享功能
  - 收藏功能

### 3. 购物车系统 (cart.html)
- 商品列表展示
- 数量修改（增加/减少）
- 商品选择（单选/全选）
- 价格计算（原价、折扣、总价）
- 清空购物车
- 结算功能
- 购物车图标数量同步

### 4. 营销功能 (deals.html)
- 限时特惠
- 优惠券领取
- 积分商城
- 会员专享价
- 促销活动

### 5. 用户中心
- 个人信息管理
- 订单管理
- 收货地址管理
- 收藏夹
- 积分明细

### 6. 认证系统
- 用户注册
- 用户登录
- 密码找回
- 第三方登录

## 最近改进

### 购物车功能改进
- 修复了加减按钮不响应问题
- 改进了商品选择后价格更新
- 完善了全选功能
- 优化了清空购物车功能
- 实现了购物车图标数量在全站实时更新
- 优化了价格计算逻辑

### 商品详情页改进
- 产品详情页数据与shop.js数据同步
- 添加到购物车后自动更新购物车图标
- 完善了颜色和尺寸选择功能
- 优化了图片浏览体验
- 实现了收藏功能

## 页面关联关系

1. 首页 (index.html)
   - → 商品列表页 (shop.html)
   - → 商品详情页 (product-detail.html)
   - → 特惠活动页 (deals.html)
   - → 购物车 (cart.html)
   - → 用户中心
   - → 登录/注册页面

2. 商品列表页 (shop.html)
   - → 商品详情页 (product-detail.html)
   - → 购物车 (cart.html)

3. 商品详情页 (product-detail.html)
   - → 购物车 (cart.html)
   - → 结算页面 (checkout.html)
   - → 评论区

4. 购物车 (cart.html)
   - → 结算页面 (checkout.html)
   - → 商品详情页 (product-detail.html)
   - → 商品列表页 (shop.html)

5. 结算页面 (checkout.html)
   - → 支付页面
   - → 购物车 (cart.html)

6. 特惠活动页 (deals.html)
   - → 商品详情页 (product-detail.html)
   - → 购物车 (cart.html)
   - → 积分商城

## 技术栈

- 原生JavaScript (ES6+)
- CSS3 (Flexbox & Grid)
- HTML5
- 本地存储 (LocalStorage)
- 模块化开发
- SQLite3 (用于认证系统)
- Express.js (简易后端服务)

## 数据存储

项目使用LocalStorage存储以下数据：

1. 购物车商品信息 (`cart_items`)
2. 用户会话信息 (`auth_token`)
3. 用户收藏商品信息 (`favorites`)
4. 浏览历史记录 (`view_history`)

## 待完成功能

1. 用户系统
   - 完善用户个人中心
   - 订单管理系统
   - 收货地址管理
   - 优惠券管理

2. 支付系统
   - 订单确认页
   - 支付流程
   - 订单状态跟踪

3. 搜索系统
   - 商品搜索
   - 搜索历史
   - 热门搜索推荐

4. 性能优化
   - 图片懒加载
   - 资源压缩
   - 缓存策略
   - 性能监控

5. 后台管理
   - 商品管理
   - 订单管理
   - 用户管理
   - 营销活动管理

## 开发指南

1. 克隆项目
```bash
git clone [repository-url]
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
./dev.sh
# 或者
npm run dev
```

4. 启动认证系统
```bash
./start.sh
# 或者
node server.js
```

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 认证系统

详细的认证系统说明请参考 [README-auth.md](./README-auth.md)

## 管理员系统

本项目现已实现管理员后台系统，支持:
- 管理员登录认证
- 基于邀请码的注册
- 销售数据分析
- 门店及订单管理

管理员系统详细说明请参考 [README-admin.md](./README-admin.md)

## 许可证

MIT

## 路由说明

### 页面路由
```
/ (index.html)                    # 首页
/shop                             # 商品列表页
  ?category={category}            # 按分类筛选
  ?page={page}                    # 分页
  ?sort={sort}                    # 排序方式
/product-detail                   # 商品详情页
  ?id={productId}                # 商品ID
/cart                            # 购物车页面
/checkout                        # 结算页面
  ?from=cart                     # 从购物车结算
  ?from=buy_now&product={id}     # 立即购买
/deals                           # 特惠活动页面
/auth/
  login                          # 登录页面
  register                       # 注册页面
/user-center/                    # 用户中心
  profile                        # 个人资料
  orders/                        # 订单管理
    list                        # 订单列表
    detail?id={orderId}         # 订单详情
/about-pages/                    # 关于页面
  brand-story                   # 品牌故事
  contact                       # 联系我们
  careers                       # 加入我们
  shopping-guide                # 购物指南
  shipping-returns              # 退换政策
  faq                          # 常见问题
```

### 动态路由处理
1. 商品详情页 (product-detail.html)
   - URL参数: id（必需）
   - 回退逻辑：无效ID跳转到商品列表页

2. 订单详情页 (orders/detail.html)
   - URL参数: id（必需）
   - 回退逻辑：无效ID跳转到订单列表页

3. 结算页面 (checkout.html)
   - URL参数: from（必需，cart或buy_now）
   - 商品参数: product（立即购买时必需）
   - 回退逻辑：参数无效跳转到购物车页面

### 页面访问控制
- 用户中心页面需要登录
- 结算页面需要登录
- 特惠活动页面的会员专区需要登录
