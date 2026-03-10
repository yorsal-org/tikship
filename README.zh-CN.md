<div align="center">
  <img src="./public/logo.svg" alt="TikShip Logo" width="200" height="200" />
  <p><strong>将想法变成产品，将发布变成现金。</strong></p>
  <p>一人公司的快速启动平台。</p>
  
  <p>
    <a href="./README.md">English</a> | 
    <a href="./README.zh-CN.md">简体中文</a>
  </p>
</div>

---

> 基于 Next.js 16 App Router、Prisma 和 NextAuth 构建的企业级多语言管理后台 + 博客 + 电商系统。

## 🚀 核心特性

### 管理后台系统

- **完整的 RBAC 权限系统** - 角色、权限、用户-角色关系管理
- **管理员认证** - JWT Token 认证，24小时有效期
- **审计日志** - 记录所有关键操作（创建/更新/删除/查看/登录）
- **用户管理** - 前台用户的完整 CRUD 操作
- **内容管理** - 文章/页面管理，支持分类、标签、SEO 字段
- **产品管理** - 支持一次性支付和订阅模式
- **订单管理** - 完整的订单生命周期管理
- **仪表板** - 实时统计数据和图表展示

### 用户端功能

- **用户认证** - 邮箱密码登录 + Google OAuth 2.0
- **用户资料** - 个人信息管理、密码修改、头像上传
- **博客系统** - 文章列表、详情页、分类筛选
- **产品购买** - 支持 Stripe 和 PayPal 双支付方式
- **订单中心** - 查看订单历史、状态跟踪

### 支付集成

- **Stripe** - 一次性支付 + 订阅计费
- **PayPal** - 一次性支付 + 订阅计费
- **灵活配置** - 产品可选择单一或双支付方式
- **Webhook 处理** - 自动同步支付状态
- **邮件通知** - 支付成功/失败/过期自动发送邮件

### 技术亮点

- **多语言支持** - 中文、英文、西班牙语（基于 next-intl）
- **主题系统** - 33 种 DaisyUI 主题，支持亮色/暗色模式切换
- **文件上传** - 支持本地存储和 ImgBB 图床
- **邮件服务** - Resend 邮件发送（验证码、密码重置、订单通知）
- **API 文档** - OpenAPI 3.0 规范，交互式 API 文档
- **组件文档** - Storybook 组件库，100+ 交互式示例
- **安全防护** - CORS、CSRF、速率限制、输入验证
- **多数据库支持** - PostgreSQL / MySQL / SQLite

## 📦 技术栈

### 核心框架

- **Next.js 16.1.6** - React 全栈框架（App Router）
- **React 19.2.3** - UI 库
- **TypeScript 5** - 类型安全
- **Prisma 7.3** - ORM 数据库工具

### UI 组件

- **TailwindCSS 4** - 原子化 CSS 框架
- **DaisyUI 5.5** - UI 组件库（33 种主题）
- **Lucide React** - 图标库
- **Recharts** - 图表库
- **TipTap** - 富文本编辑器

### 认证与授权

- **NextAuth 4.24** - 用户认证
- **JWT** - 管理员 Token 认证
- **bcrypt** - 密码加密
- **自定义 RBAC** - 角色权限系统

### 支付集成

- **Stripe** - 支付处理
- **PayPal REST API v2** - 支付处理
- **Webhook 验证** - 安全的事件处理

### 国际化

- **next-intl 4.7** - 多语言支持
- **自动检测** - 浏览器语言检测
- **持久化** - localStorage 保存偏好

### 开发工具

- **Storybook 10.2** - 组件文档
- **ESLint 9** - 代码检查
- **Prettier** - 代码格式化
- **OpenAPI** - API 文档生成

### 数据库

- **PostgreSQL** - 生产推荐
- **MySQL** - 可选
- **SQLite** - 开发环境

## 🎯 项目结构

```
tikship/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── admin/             # 管理后台页面
│   │   ├── api/               # API 路由
│   │   ├── auth/              # 认证页面
│   │   ├── blog/              # 博客页面
│   │   ├── products/          # 产品页面
│   │   └── user/              # 用户中心
│   ├── components/            # React 组件
│   │   ├── admin/            # 管理后台组件
│   │   ├── auth/             # 认证组件
│   │   ├── layout/           # 布局组件
│   │   ├── providers/        # Context Providers
│   │   ├── theme/            # 主题组件
│   │   └── ui/               # 通用 UI 组件
│   ├── lib/                   # 业务逻辑库
│   │   ├── auth/             # 认证逻辑
│   │   ├── payment/          # 支付服务
│   │   ├── email/            # 邮件服务
│   │   ├── upload/           # 文件上传
│   │   ├── security/         # 安全功能
│   │   └── utils/            # 工具函数
│   ├── config/               # 配置文件
│   ├── hooks/                # 自定义 Hooks
│   ├── locales/              # 多语言文件
│   ├── types/                # TypeScript 类型
│   └── stories/              # Storybook Stories
├── prisma/
│   ├── schema.prisma         # 数据库模型
│   ├── migrations-*/         # 数据库迁移
│   └── data/                 # 种子数据
├── scripts/                   # 脚本工具
└── public/                    # 静态资源
```

## 🛠️ 快速开始

### 环境要求

- Node.js >= 20.9.0
- npm / pnpm / yarn
- PostgreSQL / MySQL / SQLite

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/yorsal-org/tikship
cd tikship
```

2. **初始化安装**

```bash
npm ci
npm run init
```

2.1 按照提示配置以下环境变量：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/tikship"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
...
```

2.2. **初始化种子数据（自动执行）**

```bash
npm run db:seed
```

这会创建：

- 所有系统权限
- 默认 `Admin` 角色（含 30 个基础权限）
- 超级管理员账号（用户名/邮箱/密码在 seed 完成后打印到控制台）

> 超级管理员信息通过环境变量配置（`ADMIN_USERNAME`、`ADMIN_EMAIL`、`ADMIN_NAME`），默认值为 `tikship` / `tikship@example.com`。密码为首次运行时随机生成的 8 位字符串，**请务必保存控制台输出中的密码**。

3. **（可选）生成测试数据**

```bash
npm run db:generate-test-data
```

生成 50 个用户、30 篇文章、12 个产品、100 个订单等测试数据

4. **启动开发服务器**

```bash
npm run dev
```

访问：

- 前台：http://localhost:3000
- 管理后台：http://localhost:3000/admin
- API 文档：http://localhost:3000/api-docs
- Storybook：`npm run storybook` 然后访问 http://localhost:6006

## 📚 核心功能详解

### 1. RBAC 权限系统

完整的基于角色的访问控制系统：

**权限分组**：

- 管理员用户管理（查看/创建/编辑/删除/分配角色）
- 角色管理（查看/创建/编辑/删除/分配权限）
- 权限管理（查看/创建/编辑/删除）
- 前台用户管理（查看/编辑/删除）
- 内容管理（文章/页面的 CRUD）
- 产品管理（查看/创建/编辑）
- 订单管理（查看/编辑）
- 审计日志（查看）

**使用示例**：

```typescript
// 检查权限
import { requireAdminAuth } from '@/lib/auth/admin'
import { PERMISSIONS } from '@/config/permissions'

export async function GET(req: NextRequest) {
  const admin = await requireAdminAuth(req, [PERMISSIONS.USER_VIEW])
  // 只有拥有 USER_VIEW 权限的管理员才能访问
}
```

### 2. 支付系统

支持 Stripe 和 PayPal 双支付方式：

**支付渠道管理**：

支付渠道（Stripe、PayPal）通过管理后台动态管理，支持新增、编辑和删除，无需修改代码即可控制启用的支付方式。

**支付模式**：

- `payment` - 一次性支付
- `subscription` - 订阅计费（月度/年度/周度）

**订单状态**：

- `pending` - 待处理
- `completed` - 已完成
- `failed` - 失败
- `expired` - 过期
- `refunded` - 已退款

**Webhook 事件处理**：

- Stripe：`checkout.session.completed`、`checkout.session.expired` 等
- PayPal：`PAYMENT.CAPTURE.COMPLETED`、`BILLING.SUBSCRIPTION.ACTIVATED` 等

### 3. 内容管理系统

功能完整的 CMS：

**文章类型**：

- `ARTICLE` - 博客文章
- `PAGE` - 静态页面

**文章状态**：

- `DRAFT` - 草稿
- `PUBLISHED` - 已发布
- `SCHEDULED` - 计划发布
- `TRASH` - 回收站

**SEO 优化**：

- 自定义 SEO 标题和描述
- 自动生成 slug
- 特色图片
- 分类和标签

**富文本编辑器**：

- 基于 TipTap
- 支持图片、链接、列表等
- 实时预览

### 4. 文件上传系统

灵活的文件上传方案：

**本地上传**：

- 文件存储在 `public/upload/YYYY-MM-DD/`
- 自动按日期组织
- 文件名：`{timestamp}-{random}.{ext}`

**ImgBB 图床**：

- 云端存储
- 无需本地空间
- 需要 API Key

**安全特性**：

- 文件类型白名单验证
- 文件大小限制（默认 5MB）
- 用户认证检查

### 5. 邮件通知系统

基于 Resend 的邮件服务：

**邮件类型**：

- 注册验证码
- 密码重置
- 订单成功通知
- 订单失败通知
- 订单过期通知

**邮件模板**：

- 响应式 HTML 模板
- 纯文本备用版本
- 品牌一致的设计

### 6. 多语言系统

基于 next-intl 的国际化方案：

**支持语言**：

- 英文（en）- 默认
- 简体中文（zh）
- 西班牙语（es）

**特性**：

- 自动检测浏览器语言
- localStorage 持久化
- 语言切换组件
- 命名空间组织

**使用示例**：

```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('common')
  return <h1>{t('welcome')}</h1>
}
```

### 7. 主题系统

自定义主题管理系统：

**主题模式**：

- `light` - 亮色模式
- `dark` - 暗色模式
- `system` - 跟随系统

**DaisyUI 主题**：

- 33 种预设主题
- 可自定义亮色/暗色主题
- 通过环境变量配置

### 8. API 文档系统

基于 OpenAPI 3.0 的交互式文档：

**特性**：

- 自动生成 API 文档
- 交互式测试界面
- 按标签分组
- 完整的请求/响应示例
- 认证说明

**生成文档**：

```bash
npm run openapi:generate
```

**访问文档**：

- 在线文档：http://localhost:3000/api-docs
- OpenAPI JSON：http://localhost:3000/openapi.json

### 9. Storybook 组件库

完整的组件文档系统：

**组件覆盖**：

- 12 个 UI 基础组件
- 1 个主题组件
- 1 个国际化组件
- 100+ 个交互式示例

**UI 组件**：

- Button、Input、Card、Alert
- Modal、Table、Pagination
- StatusBadge、StatsCard
- ImageUpload、DateTimePicker、Toast

**启动 Storybook**：

```bash
npm run storybook
```

访问：http://localhost:6006

### 10. 安全功能

多层安全防护：

**认证安全**：

- JWT Token 认证（管理员）
- Session 认证（用户）
- 密码强度验证
- 登录尝试限制

**API 安全**：

- CORS 配置（多域名支持）
- CSRF 保护
- 速率限制
- 输入验证

**数据安全**：

- Webhook 签名验证
- 支付金额验证
- SQL 注入防护（Prisma ORM）
- XSS 防护

**文件安全**：

- 文件类型白名单
- 文件大小限制
- 用户认证检查

## 🔧 常用命令

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

### 数据库命令

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npx prisma migrate dev

# 重置数据库
npx prisma migrate reset

# 初始化种子数据
npm run db:seed

# 生成测试数据
npm run db:generate-test-data

# 重置管理员密码
npm run db:reset-admin-password

# 切换数据库类型
npm run db:update-provider
```

### 文档命令

```bash
# 启动 Storybook
npm run storybook

# 构建 Storybook
npm run build-storybook

# 生成 OpenAPI 文档
npm run openapi:generate

# 验证 OpenAPI 规范
npm run openapi:validate
```

### 工具命令

```bash
# 检查 i18n 翻译键
npm run i18n:check

# 初始化环境变量
npm run setup:env

# 运行安装脚本
npm run init
```

## 🔐 默认账号

### 管理员账号（超级管理员）

超级管理员账号由 `npm run db:seed` 创建，凭证通过环境变量控制：

| 变量 | 默认值 |
|---|---|
| `ADMIN_USERNAME` | `tikship` |
| `ADMIN_EMAIL` | `tikship@example.com` |
| `ADMIN_NAME` | `Super Administrator` |
| 密码 | 随机 8 位字符（首次 seed 时打印到控制台） |

> 如果账号已存在，seed 会跳过创建，现有密码保持不变。可使用 `npm run db:reset-admin-password` 重置密码。

### 测试用户

运行 `npm run db:generate-test-data` 后会生成 50 个测试用户：

```
邮箱：john.doe@example.com
密码：User123!
```

## 🚢 部署指南

### 环境变量配置

生产环境需要配置以下环境变量：

```env
# 数据库（使用生产数据库）
DATABASE_URL="postgresql://..."

# NextAuth（使用强随机密钥）
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# 支付（使用生产密钥）
STRIPE_SECRET_KEY="sk_live_xxx"
PAYPAL_MODE="live"

# CORS（配置允许的域名）optional
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# 其他服务配置...
```

### 部署步骤

1. **构建项目**

```bash
npm run build
```

2. **运行数据库迁移**

```bash
npx prisma migrate deploy
```

3. **初始化种子数据**

```bash
npm run db:seed
```

4. **启动服务器**

```bash
npm start
```

### 推荐部署平台

- **Vercel** - Next.js 官方推荐
- **Railway** - 支持数据库和应用
- **Render** - 全栈应用部署
- **AWS / Azure / GCP** - 企业级部署

### 注意事项

- 使用 HTTPS（必需）
- 配置 Webhook URL
- 设置环境变量
- 配置域名白名单
- 定期备份数据库

### 代码规范

- 使用 TypeScript，避免使用 `any`
- 遵循 ESLint 规则
- 编写清晰的注释
- 更新相关文档

## 📝 更新日志

### v1.0.0 (2026-03-05)

**核心功能**：

- ✅ 完整的管理后台系统
- ✅ RBAC 权限系统
- ✅ 用户认证（邮箱 + Google OAuth）
- ✅ 内容管理系统（博客 + 页面）
- ✅ 产品和订单管理
- ✅ Stripe + PayPal 支付集成
- ✅ 多语言支持（中英西）
- ✅ 主题系统（33 种主题）
- ✅ 文件上传（本地 + ImgBB）
- ✅ 邮件通知系统
- ✅ API 文档（OpenAPI 3.0）
- ✅ Storybook 组件库
- ✅ 安全防护（CORS、CSRF、速率限制）
- ✅ 审计日志系统
- ✅ 测试数据生成器

## 📄 许可证 / 最终用户许可协议

EULA

## 💬 支持

如有问题或建议，请：

- 访问 API 文档：http://localhost:3000/api-docs
- 查看 Storybook：http://localhost:6006
- 查看官网教程和文档：https://www.tikship.top/docs
- 提交 Issue：http://github.com/yorsal/tikship
- 发送邮件至：support@tikship.top

## 🙏 致谢

感谢以下开源项目：

- Next.js
- React
- Prisma
- NextAuth
- TailwindCSS
- DaisyUI
- Stripe
- PayPal
- Resend
- Storybook

---

**Built with ❤️ by TikShip Team**
