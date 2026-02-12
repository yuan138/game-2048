---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 30460221009ac2621733d216565d4b0bd39c7034ee4db7adc96fa1bb39546312252e8138d70221008522b390836d515e49a421ebebaac5b2673cc0376dbe5616d0e065ff101b3929
    ReservedCode2: 304502205186ea1281adff5577637b37060860ac267bf59abcce98358ed963d382353d1c022100c1559298e060f4eddd439771564fd012dac74fa4fbb3b9695fde60b74c2dbbbe
---

# 🚀 2048 游戏 - 外网部署指南

## 快速部署 (5分钟)

### 方式一：使用 Railway (推荐 ⭐)

**Railway 是最简单的部署方式，支持一键部署**

1. **准备代码**
   ```bash
   # 在GitHub上创建新仓库，上传以下文件：
   # - server.js
   # - package.json
   # - index.html
   # - login.html
   # - data.json (空文件 {})
   ```

2. **部署步骤**
   - 访问 https://railway.app
   - 用 GitHub 登录
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库
   - Railway 会自动检测 Node.js 并部署

3. **访问游戏**
   - Railway 会提供随机域名
   - 访问: `[你的域名]/login.html`

---

### 方式二：使用 Render

1. **准备代码** (同上)

2. **部署步骤**
   - 访问 https://render.com
   - 用 GitHub 登录
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库
   - 设置:
     - Build Command: `npm install`
     - Start Command: `npm start`
   - 点击 "Create Web Service"

3. **访问游戏**
   - Render 提供免费域名: `https://[你的服务名].onrender.com`

---

### 方式三：使用 Coolify (自托管)

**Coolify 是开源的自托管平台，可在VPS上部署**

1. **准备VPS**
   - 需要 1GB+ 内存
   - 安装 Docker

2. **安装 Coolify**
   ```bash
   sudo su -
   apt update && apt install docker-compose
   docker run -d --pull=always -p 8000:8000 \
     -v "/var/lib/coolify:/etc/coolify" \
     --name coolify \
     andrasbacsai/coolify:latest
   ```

3. **配置**
   - 访问 `http://你的VPS:8000`
   - 注册账号
   - 连接 GitHub 仓库
   - 一键部署

---

### 方式四：传统 VPS 部署

**适用于阿里云、腾讯云、华为云等**

#### 1. 连接服务器
```bash
ssh root@你的服务器IP
```

#### 2. 安装 Node.js
```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

#### 3. 上传代码
```bash
# 方法1: 使用 git
git clone 你的仓库
cd 你的项目目录

# 方法2: 使用 scp 上传
scp -r ./2048-game root@你的服务器IP:/var/www/
```

#### 4. 安装并启动
```bash
cd /var/www/2048-game
chmod +x start.sh
./start.sh

# 或手动
npm install --production
npm start
```

#### 5. 配置反向代理 (Nginx)
```bash
apt install nginx
cat > /etc/nginx/sites-available/2048 <<EOF
server {
    listen 80;
    server_name 你的域名或IP;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -s /etc/nginx/sites-available/2048 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 6. 配置域名 (可选)
- 在域名服务商处添加 A 记录指向服务器 IP

---

## 域名配置

### 国内域名 (需要备案)
- 阿里云: https://wanwang.aliyun.com
- 腾讯云: https://dnspod.cloud.tencent.com

### 国外域名 (不需要备案)
- Namecheap: https://www.namecheap.com
- GoDaddy: https://www.godaddy.com

---

## HTTPS 配置

### 使用 Let's Encrypt (免费)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d 你的域名
```

### 或者使用 Cloudflare (推荐)
1. 注册 https://cloudflare.com
2. 添加域名
3. 修改域名 DNS 服务器
4. 开启 "Always Use HTTPS"

---

## 数据备份

### 手动备份
```bash
# 备份 data.json
cp /var/www/2048-game/data.json /backup/2048-$(date +%Y%m%d).json
```

### 自动备份 (crontab)
```bash
crontab -e
# 添加以下行，每天凌晨2点备份
0 2 * * * cp /var/www/2048-game/data.json /backup/2048-$(date +\%Y\%m\%d).json
```

---

## 常见问题

### Q: 端口被占用?
```bash
# 查看占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 进程ID
```

### Q: 内存不足?
- Railway/Render 免费套餐限制 512MB 内存
- 建议: 使用更小的图片、优化代码

### Q: 数据库丢失?
- 确保 `data.json` 已提交到 Git
- 或配置外部数据库 (MongoDB Atlas)

---

## 监控和维护

### 查看日志
```bash
# 本地
npm start

# 生产环境 (systemd)
journalctl -u 2048 -f
```

### 重启服务
```bash
# systemd
systemctl restart 2048

# Docker
docker restart 2048-game
```

### 检查状态
```bash
# API 健康检查
curl http://localhost:3000/api/health
```

---

## 性能优化

### 1. 开启 Gzip 压缩
```javascript
// server.js 中添加
const compression = require('compression');
app.use(compression());
```

### 2. 使用 CDN
- 将静态文件部署到 CDN
- 或使用 Cloudflare

### 3. 开启缓存
```javascript
// 静态文件缓存
app.use(express.static(__dirname, {
    maxAge: '1d',
    etag: false
}));
```

---

## 联系与支持

- **问题反馈**: 在 GitHub 仓库提 Issue
- **功能建议**: 欢迎提出改进建议
- **贡献代码**: Fork 后提交 Pull Request

---

**🎮 祝你部署顺利，游戏愉快！**
