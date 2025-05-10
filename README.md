# 图片OCR文字识别应用

这是一个基于Next.js和Bootstrap构建的图片OCR文字识别应用，可以直接粘贴图片进行文字识别。

## 功能特点

- 支持粘贴图片（Ctrl+V / Cmd+V）
- 使用n8n工作流进行图片文字识别
- 响应式设计，适配移动端和桌面端
- 识别结果可以直接复制
- 使用Bootstrap UI框架美化界面

## 使用技术

- Next.js - React框架
- TypeScript - 类型安全
- Bootstrap - UI框架
- React Hooks - 状态管理
- Fetch API - 网络请求

## 快速开始

1. 安装依赖：

```bash
npm install
# 或
yarn
```

2. 开发模式运行：

```bash
npm run dev
# 或
yarn dev
```

3. 访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 配置n8n

在使用前，请确保n8n工作流已经配置好。默认Webhook URL为：

```
N8N_WEBHOOK_URL
```

如需修改，请在 `pages/index.tsx` 文件中更新 `N8N_WEBHOOK_URL` 变量。

## 构建生产版本

```bash
npm run build
npm run start
# 或
yarn build
yarn start
```

## 部署到Cloudflare Pages

### 准备工作

1. 确保已将代码推送到GitHub、GitLab或Bitbucket等Git仓库
2. 注册Cloudflare账号并登录Cloudflare Dashboard

### 部署步骤

1. 在Cloudflare Dashboard中，进入Pages选项
2. 点击"创建项目"
3. 选择并连接你的Git仓库提供商
4. 选择包含本应用的仓库
5. 配置构建设置：
   - 框架预设：选择 `Next.js (Static HTML Export)`
   - 构建命令：系统会自动填入 `npx next build`
   - 构建输出目录：`out`
   - 根目录：保持默认值 `/`
   - Node.js版本：选择16.x或更高版本
6. 点击"保存并部署"

### 自定义域名

1. 部署完成后，Cloudflare会提供一个默认域名（类似于`项目名称.pages.dev`）
2. 如需配置自定义域名，在项目页面点击"自定义域"选项
3. 按照Cloudflare提供的指南添加你的域名
4. 配置DNS记录指向你的Cloudflare Pages网站

### 注意事项

- 本应用已经配置为静态导出，适合在Cloudflare Pages上运行
- 如果API请求跨域，请确保n8n服务配置了正确的CORS设置，允许来自你的Cloudflare Pages域名的请求
- 每次提交代码到主分支时，Cloudflare Pages会自动重新部署 