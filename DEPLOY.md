---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304402200d8cd9bcaa1962a331b451351e14325cf370743eec3c4ef158e0e818fda56db402203e7d0ba024d88774ccc09414a508929e75e58a7aa1c3634733f4974eb7cd8dc6
    ReservedCode2: 30440220736745f7e7777f5baaccc8df178b08a1ef2afc760867779badc85530752401ac022045c71898f38fb98889e712bef6c31f8819deb833f3458e3197a8ee39c1e38960
---

# 2048 游戏 - 用户登录版部署指南

## 本地运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问游戏
- 登录页面: http://localhost:3001/login.html
- 游戏页面: http://localhost:3001/index.html

## 云平台部署

### Render.com (推荐 - 免费)

1. 注册账号: https://render.com

2. 创建新的 Web Service:
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`

3. 环境变量 (可选):
   - PORT: 端口号 (默认3001)

### Railway.app

1. 注册账号: https://railway.app

2. 部署步骤:
   - New Project → Deploy from GitHub
   - 选择你的仓库
   - 自动检测Node.js配置

### Vercel (需要改造为无服务器函数)

需要将server.js改造为API路由。

## 功能说明

- ✅ 用户注册/登录
- ✅ 游戏进度自动保存
- ✅ 最高分记录
- ✅ 数据持久化存储

## 技术栈

- 前端: HTML5 + CSS3 + Vanilla JavaScript
- 后端: Node.js + Express
- 存储: JSON文件 (data.json)
- 安全: JWT认证 + bcrypt加密
