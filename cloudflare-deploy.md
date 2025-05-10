# Cloudflare Pages 部署指南

本文档提供了将OCR识别应用部署到Cloudflare Pages的详细步骤。

## 前提条件

1. 已有Cloudflare账号
2. 应用代码已推送到GitHub、GitLab或Bitbucket等Git仓库
3. 已完成本地代码构建测试

## 部署步骤

### 1. 登录Cloudflare

访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并登录您的账号。

### 2. 创建Pages项目

1. 在左侧导航中，点击"Pages"
2. 点击"创建项目"按钮
3. 选择"连接到Git"

### 3. 连接代码仓库

1. 选择您的代码托管平台（GitHub、GitLab等）
2. 授权Cloudflare访问您的仓库
3. 从列表中选择包含OCR应用的仓库

### 4. 配置构建设置

填写以下构建配置信息：

- **项目名称**：image-ocr-app（或您喜欢的名称）
- **生产分支**：main（或您的主分支名）
- **框架预设**：选择 `Next.js (Static HTML Export)`
- **构建命令**：系统会自动填入 `npx next build`
- **构建输出目录**：`out`
- **根目录**：`/`（保持默认）
- **环境变量**：无需添加

在高级选项中（如需要）：
- **Node.js版本**：选择16.x或更高版本

### 5. 开始构建与部署

点击"保存并部署"按钮。Cloudflare将开始从您的仓库获取代码并构建应用。

### 6. 监控部署状态

在项目概览页面，您可以查看部署进度和构建日志。

### 7. 测试部署的应用

部署完成后，Cloudflare会提供一个默认域名（如`项目名称.pages.dev`）。点击该链接确认应用是否正常运行。

### 8. 配置自定义域名（可选）

如果您想使用自己的域名：

1. 在项目页面，点击"自定义域"选项卡
2. 点击"设置自定义域"按钮
3. 输入您的域名
4. 按照向导完成DNS设置

## 构建过程说明

当选择框架预设为`Next.js (Static HTML Export)`时，Cloudflare会自动执行以下步骤：

1. 安装项目依赖（`npm install`）
2. 执行构建命令（`npx next build`）
3. 将构建输出目录（`out`）中的文件部署到Cloudflare的全球网络

## 常见问题排查

### 部署失败

检查构建日志找出错误原因。常见问题包括：

- 依赖安装失败：确保package.json文件中的依赖版本兼容
- 构建错误：检查代码语法问题
- 路径问题：确认构建输出目录设置正确

### 应用不完整或样式丢失

- 确保构建输出包含所有必要的静态资源
- 检查是否正确引用了CSS和JavaScript文件

### API请求失败

- 确认n8n服务器已配置允许Cloudflare Pages域名的CORS请求（例如`项目名称.pages.dev`）
- 检查浏览器控制台是否有跨域错误

## 自动化部署

Cloudflare Pages会自动监控您的Git仓库。每当您推送更改到主分支时，将触发新的构建和部署。

## 其他资源

- [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)
- [Next.js静态导出指南](https://nextjs.org/docs/advanced-features/static-html-export) 