# 🚀 快速開始指南

## 📋 檢查清單

在開始之前，請確認你已經安裝：
- ✅ Node.js (v18 或更新)
- ✅ PostgreSQL (v14 或更新)
- ✅ Git

## 🏃 5分鐘快速啟動

### Step 1: 設定資料庫

```bash
# 建立資料庫
createdb club_management

# 或使用 psql
psql -U postgres
CREATE DATABASE club_management;
\q

# 匯入 schema
cd database
psql -U postgres -d club_management -f schema.sql
```

### Step 2: 安裝後端依賴

```bash
cd backend
npm install
```

### Step 3: 設定環境變數

```bash
# 複製環境變數範例檔案
cp .env.example .env

# 編輯 .env 檔案，填入你的資料庫資訊
nano .env  # 或使用任何文字編輯器
```

`.env` 最小設定：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=club_management
DB_USER=postgres
DB_PASSWORD=你的密碼
JWT_SECRET=隨機生成的秘鑰
PORT=5000
```

### Step 4: 啟動伺服器

```bash
# 開發模式（推薦，會自動重啟）
npm run dev

# 或正式模式
npm start
```

### Step 5: 測試 API

開啟瀏覽器或使用 curl：

```bash
# 健康檢查
curl http://localhost:5000/health

# 查看所有端點
curl http://localhost:5000/
```

## 🧪 測試 API 範例

### 1. 註冊第一個使用者（社長）

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "president",
    "password": "password123",
    "role": "president",
    "name": "社長名字",
    "email": "president@club.com",
    "student_id": "A123456789",
    "department": "資訊工程學系",
    "grade": "大四",
    "generation": 15,
    "phone": "0912345678",
    "department_id": 1
  }'
```

回應會包含 `token`，請複製它！

### 2. 登入

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "president",
    "password": "password123"
  }'
```

### 3. 測試需要認證的 API（用上面的 token）

```bash
# 獲取社員列表
curl -X GET http://localhost:5000/api/members \
  -H "Authorization: Bearer 你的token"

# 獲取組別列表
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer 你的token"
```

## 🎯 建議的測試順序

1. ✅ 註冊社長帳號
2. ✅ 註冊幾個幹部和社員帳號
3. ✅ 新增一些檔案索引
4. ✅ 發佈公告
5. ✅ 建立活動
6. ✅ 測試報名功能
7. ✅ 測試權限控制

## 🐛 常見問題

### 資料庫連接失敗
```
Error: connect ECONNREFUSED
```
**解決方案**:
- 確認 PostgreSQL 服務已啟動
- 檢查 `.env` 中的資料庫連線資訊
- 確認資料庫已建立

### JWT 錯誤
```
Error: 未提供認證令牌
```
**解決方案**:
- 確認請求 header 包含 `Authorization: Bearer token`
- 檢查 token 是否過期（預設 7 天）

### 權限錯誤
```
Error: 權限不足
```
**解決方案**:
- 確認使用者角色正確
- 幹部只能編輯自己組別的資料

## 📱 使用 Postman 測試

1. 匯入 API collection（如果有的話）
2. 設定環境變數：
   - `baseUrl`: `http://localhost:5000`
   - `token`: 從登入取得的 JWT
3. 開始測試各個端點

## 🎨 下一步：開發前端

後端 API 已經完成，接下來可以：

1. **使用 React 開發前端**
   ```bash
   cd frontend
   npx create-react-app .
   npm install axios react-router-dom
   ```

2. **或使用 Postman/Insomnia 測試 API**

3. **開始編寫前端頁面**
   - 登入/註冊
   - 社員列表
   - 檔案瀏覽
   - 公告牆
   - 活動頁面

## 💡 小技巧

- 使用 `npm run dev` 開發，程式碼改變會自動重啟
- 查看 `backend/README.md` 了解完整 API 文件
- 所有 API 都有錯誤處理和驗證
- JWT token 預設 7 天有效

## 🆘 需要幫助？

如果遇到問題：
1. 檢查終端機的錯誤訊息
2. 查看 `backend/README.md` 的故障排除章節
3. 確認所有依賴都已正確安裝

---

**恭喜！🎉 你的社團管理系統後端已經啟動了！**
