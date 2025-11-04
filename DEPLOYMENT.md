# 🚀 部署指南

本指南說明如何將社團管理系統部署到各種平台。

## 📋 目錄

- [Railway 部署](#railway-部署推薦)
- [Render 部署](#render-部署)
- [Heroku 部署](#heroku-部署)
- [Vercel 部署（前端）](#vercel-部署前端)
- [VPS 自架](#vps-自架)

---

## Railway 部署（推薦）

Railway 提供簡單的部署流程和免費額度。

### Step 1: 準備工作

1. 註冊 [Railway](https://railway.app/) 帳號
2. 安裝 Railway CLI（可選）
   ```bash
   npm install -g @railway/cli
   ```

### Step 2: 創建專案

**方式 A：透過 GitHub（推薦）**

1. 將專案推送到 GitHub
2. 到 Railway Dashboard
3. 點擊 "New Project"
4. 選擇 "Deploy from GitHub repo"
5. 選擇你的 repository
6. Railway 會自動偵測並部署

**方式 B：透過 CLI**

```bash
# 登入
railway login

# 在專案目錄中初始化
cd club-management-system/backend
railway init

# 部署
railway up
```

### Step 3: 設定資料庫

1. 在 Railway 專案中點擊 "New"
2. 選擇 "Database" → "PostgreSQL"
3. Railway 會自動建立資料庫並提供連線資訊

### Step 4: 設定環境變數

在 Railway 專案設定中加入：

```
DB_HOST=${{ Postgres.PGHOST }}
DB_PORT=${{ Postgres.PGPORT }}
DB_NAME=${{ Postgres.PGDATABASE }}
DB_USER=${{ Postgres.PGUSER }}
DB_PASSWORD=${{ Postgres.PGPASSWORD }}
JWT_SECRET=你的隨機秘鑰
PORT=5000
NODE_ENV=production
```

### Step 5: 匯入資料庫 Schema

使用 Railway CLI 或資料庫管理工具：

```bash
# 使用 Railway CLI
railway run psql -f database/schema.sql
```

### Step 6: 完成！

你的 API 現在運行在：`https://你的專案名稱.up.railway.app`

---

## Render 部署

Render 提供免費方案，但有一些限制。

### Step 1: 準備

1. 註冊 [Render](https://render.com/) 帳號
2. 連結 GitHub 帳號

### Step 2: 創建 Web Service

1. 到 Render Dashboard
2. 點擊 "New +" → "Web Service"
3. 連結你的 GitHub repository
4. 設定：
   - **Name**: `club-management-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: 選擇 Free

### Step 3: 創建 PostgreSQL

1. 點擊 "New +" → "PostgreSQL"
2. 選擇 Free 方案
3. 記下連線資訊

### Step 4: 設定環境變數

在 Web Service 設定中加入環境變數。

### Step 5: 匯入 Schema

1. 連接到資料庫
2. 執行 `database/schema.sql`

### 注意事項

⚠️ Free 方案會在閒置 15 分鐘後休眠，首次請求會較慢。

---

## Heroku 部署

### Step 1: 安裝 Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# 下載安裝程式

# Ubuntu
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: 登入並創建應用

```bash
heroku login
cd club-management-system/backend
heroku create 你的應用名稱
```

### Step 3: 添加 PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 4: 設定環境變數

```bash
heroku config:set JWT_SECRET=你的秘鑰
heroku config:set NODE_ENV=production
```

### Step 5: 創建 Procfile

在 backend 目錄創建 `Procfile`：

```
web: node server.js
```

### Step 6: 部署

```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

### Step 7: 匯入 Schema

```bash
heroku pg:psql < ../database/schema.sql
```

---

## Vercel 部署（前端）

當前端開發完成後：

```bash
cd frontend
npx vercel

# 設定環境變數
vercel env add REACT_APP_API_URL
```

---

## VPS 自架

適合想要完全控制的進階使用者。

### 需求

- Ubuntu 20.04+ VPS
- 至少 1GB RAM
- Root 權限

### Step 1: 安裝依賴

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安裝 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安裝 Nginx
sudo apt install -y nginx

# 安裝 PM2
sudo npm install -g pm2
```

### Step 2: 設定 PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE club_management;
CREATE USER clubadmin WITH ENCRYPTED PASSWORD '你的密碼';
GRANT ALL PRIVILEGES ON DATABASE club_management TO clubadmin;
\q
```

### Step 3: 部署應用

```bash
# Clone 專案
cd /var/www
git clone https://github.com/你的使用者名稱/club-management-system.git
cd club-management-system/backend

# 安裝依賴
npm install --production

# 設定環境變數
cp .env.example .env
nano .env  # 編輯設定

# 匯入 Schema
psql -U clubadmin -d club_management -f ../database/schema.sql
```

### Step 4: 使用 PM2 運行

```bash
pm2 start server.js --name club-api
pm2 startup
pm2 save
```

### Step 5: 設定 Nginx

創建 `/etc/nginx/sites-available/club-management`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

啟用設定：

```bash
sudo ln -s /etc/nginx/sites-available/club-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: 設定 SSL（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 安全建議

### 生產環境檢查清單

- [ ] 使用強密碼和隨機 JWT_SECRET
- [ ] 啟用 HTTPS
- [ ] 設定防火牆
- [ ] 定期備份資料庫
- [ ] 監控錯誤日誌
- [ ] 設定 CORS 只允許特定 origin
- [ ] 使用環境變數儲存敏感資訊
- [ ] 定期更新依賴套件

### 環境變數範例（生產環境）

```env
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=club_management_prod
DB_USER=secure_user
DB_PASSWORD=very_strong_password_here
JWT_SECRET=use_a_long_random_string_minimum_32_characters
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

## 📊 監控與維護

### 日誌管理

**Railway/Render**: 內建日誌查看

**VPS**: 使用 PM2
```bash
pm2 logs club-api
pm2 monit
```

### 資料庫備份

```bash
# 備份
pg_dump -U username -d club_management > backup_$(date +%Y%m%d).sql

# 還原
psql -U username -d club_management < backup_20240101.sql
```

### 自動備份腳本

創建 `/home/user/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U clubadmin club_management > $BACKUP_DIR/backup_$DATE.sql

# 保留最近 7 天的備份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

設定 crontab：
```bash
crontab -e
# 每天凌晨 2 點備份
0 2 * * * /home/user/backup.sh
```

---

## 🆘 故障排除

### 應用無法啟動

1. 檢查環境變數是否正確
2. 確認資料庫連線
3. 查看錯誤日誌

### 資料庫連線失敗

1. 確認資料庫服務運行中
2. 檢查防火牆設定
3. 驗證連線字串

### 效能問題

1. 檢查資料庫索引
2. 增加資料庫連接池大小
3. 使用 CDN 加速靜態資源
4. 考慮增加伺服器資源

---

## 📚 相關資源

- [Railway 文件](https://docs.railway.app/)
- [Render 文件](https://render.com/docs)
- [Heroku 文件](https://devcenter.heroku.com/)
- [PM2 文件](https://pm2.keymetrics.io/)
- [Nginx 文件](https://nginx.org/en/docs/)

---

需要幫助嗎？在 GitHub 開 Issue！
