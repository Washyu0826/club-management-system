# 社團管理系統 - 後端 API

## 技術架構

- **框架**: Express.js
- **資料庫**: PostgreSQL
- **認證**: JWT (JSON Web Token)
- **密碼加密**: bcryptjs

## 安裝步驟

### 1. 安裝依賴套件

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並填入設定：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=club_management
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. 建立資料庫

```bash
# 登入 PostgreSQL
psql -U postgres

# 創建資料庫
CREATE DATABASE club_management;

# 連接到資料庫
\c club_management

# 執行 schema
\i ../database/schema.sql
```

或者使用指令：

```bash
psql -U postgres -d club_management -f ../database/schema.sql
```

### 4. 啟動伺服器

開發模式（自動重啟）：
```bash
npm run dev
```

正式模式：
```bash
npm start
```

## API 端點

### 認證相關 (`/api/auth`)

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| POST | `/register` | 註冊新使用者 | 公開 |
| POST | `/login` | 登入 | 公開 |
| GET | `/me` | 獲取當前使用者資訊 | 需認證 |

### 社員管理 (`/api/members`)

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| GET | `/` | 獲取社員列表 | 需認證 |
| GET | `/:id` | 獲取單一社員資料 | 需認證 |
| PUT | `/:id` | 更新社員資料 | 本人/社長/顧問 |
| DELETE | `/:id` | 刪除社員 | 社長/顧問 |
| GET | `/stats/overview` | 獲取統計資料 | 需認證 |

**查詢參數**:
- `generation`: 篩選屆數
- `department_id`: 篩選組別
- `status`: 篩選狀態 (active/alumni/inactive)
- `search`: 搜尋姓名或學號
- `industry`: 篩選產業
- `job_role`: 篩選職位

### 檔案管理 (`/api/files`)

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| GET | `/` | 獲取檔案列表 | 需認證 |
| GET | `/:id` | 獲取單一檔案資訊 | 需認證 |
| POST | `/` | 新增檔案 | 社長/顧問/幹部（限自己組別） |
| PUT | `/:id` | 更新檔案資訊 | 社長/顧問/幹部（限自己組別） |
| DELETE | `/:id` | 刪除檔案 | 社長/顧問/幹部（限自己組別） |
| GET | `/categories/list` | 獲取所有分類 | 需認證 |
| POST | `/categories` | 新增分類 | 社長/顧問 |
| GET | `/stats/overview` | 獲取統計資料 | 需認證 |

**查詢參數**:
- `year`: 篩選年度
- `department_id`: 篩選組別
- `category_id`: 篩選分類
- `search`: 搜尋標題或描述
- `tags`: 篩選標籤（逗號分隔）

### 社群功能 (`/api/community`)

**公告**:

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| GET | `/announcements` | 獲取公告列表 | 需認證 |
| GET | `/announcements/:id` | 獲取單一公告 | 需認證 |
| POST | `/announcements` | 新增公告 | 幹部以上 |
| PUT | `/announcements/:id` | 更新公告 | 幹部以上（限自己組別） |
| DELETE | `/announcements/:id` | 刪除公告 | 幹部以上（限自己組別） |
| POST | `/announcements/:id/comments` | 新增留言 | 需認證 |

**活動**:

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| GET | `/events` | 獲取活動列表 | 需認證 |
| GET | `/events/:id` | 獲取單一活動 | 需認證 |
| POST | `/events` | 新增活動 | 幹部以上 |
| POST | `/events/:id/register` | 報名活動 | 需認證 |
| DELETE | `/events/:id/register` | 取消報名 | 需認證 |

### 組別管理 (`/api/departments`)

| 方法 | 端點 | 說明 | 權限 |
|------|------|------|------|
| GET | `/` | 獲取所有組別 | 需認證 |
| GET | `/:id` | 獲取單一組別詳細資訊 | 需認證 |

## 權限等級

1. **社長 (president)**: 完整權限
2. **顧問 (advisor)**: 完整權限
3. **幹部 (officer)**: 所屬組別檔案編輯權 + 自己資料編輯權
4. **社員 (member)**: 檔案檢視 + 自己資料編輯權
5. **校友 (alumni)**: 檔案檢視 + 自己資料編輯權

## 請求範例

### 註冊

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "role": "member",
    "name": "王小明",
    "email": "john@example.com",
    "student_id": "B10901001",
    "department": "資訊工程學系",
    "grade": "大三",
    "generation": 15,
    "phone": "0912345678"
  }'
```

### 登入

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

### 獲取社員列表（需要 token）

```bash
curl -X GET http://localhost:5000/api/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 新增檔案

```bash
curl -X POST http://localhost:5000/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2024春季大會會議記錄",
    "category_id": 1,
    "year": 2024,
    "department_id": 1,
    "google_drive_url": "https://drive.google.com/file/d/xxx",
    "file_type": "pdf",
    "description": "討論年度活動規劃",
    "tags": ["會議", "春季", "2024"]
  }'
```

## 資料庫結構

詳見 `../database/schema.sql`

主要資料表：
- `users` - 使用者帳號
- `members` - 社員資料
- `departments` - 組別
- `files` - 檔案索引
- `file_categories` - 檔案分類
- `announcements` - 公告
- `events` - 活動
- `registrations` - 活動報名
- `comments` - 留言

## 開發注意事項

1. **密碼安全**: 使用 bcrypt 加密，不可明碼儲存
2. **JWT Token**: 預設 7 天有效期
3. **錯誤處理**: 所有 API 都有適當的錯誤處理
4. **權限檢查**: 使用 middleware 進行權限驗證
5. **SQL Injection**: 使用 parameterized queries 防止注入攻擊
6. **CORS**: 已設定 CORS 允許前端請求

## 部署建議

### Railway / Render

1. 連結 GitHub repository
2. 設定環境變數
3. 選擇 PostgreSQL 附加服務
4. 設定啟動指令：`npm start`

### Heroku

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

## 故障排除

### 資料庫連接失敗
- 檢查 `.env` 設定
- 確認 PostgreSQL 服務已啟動
- 檢查防火牆設定

### JWT 驗證失敗
- 確認 token 格式正確（Bearer token）
- 檢查 token 是否過期
- 確認 JWT_SECRET 設定正確

### 權限錯誤
- 確認使用者角色正確
- 檢查路由的權限中介層設定

## 授權

MIT License
