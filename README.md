# 🎓 社團管理系統 Club Management System

<div align="center">

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D14-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

一個功能完整的社團管理系統，支援社員管理、檔案分類、活動報名、公告發佈等功能。

[功能特色](#-核心功能) •
[快速開始](#-快速開始) •
[API 文件](./backend/README.md) •
[專案摘要](./PROJECT_SUMMARY.md) •
[貢獻指南](./CONTRIBUTING.md)

</div>

---

## ✨ 核心功能

### 📋 社員人脈簿
- ✅ 完整的社員資料管理（基本資料 + 進階資訊）
- ✅ 支援搜尋、篩選（依屆數、組別、產業、職位）
- ✅ 分類管理：依產業和職位分類
- ✅ 統計分析：社員分布統計圖表

### 📁 檔案管理系統
- ✅ 三層分類：年度 → 組別 → 活動/會議
- ✅ Google Drive 整合（儲存連結，避免流量問題）
- ✅ 多重標籤系統
- ✅ 權限管理：不同角色有不同編輯權限
- ✅ 檔案統計：依年度、組別、分類統計

### 🎯 活動管理
- ✅ 活動建立與編輯
- ✅ 線上報名系統
- ✅ 參與人數管理（含上限設定）
- ✅ 報名狀態追蹤

### 📢 公告系統
- ✅ 多層級公告（全社團/組別）
- ✅ 置頂功能
- ✅ 留言與討論功能
- ✅ 支援回覆留言

### 👥 組別管理
- ✅ 5個組別：會長組、活動組、行銷組、課程組、公關組
- ✅ 組員統計
- ✅ 組別檔案檢視

### 🔐 權限系統
- ✅ 5種角色：社長、顧問、幹部、社員、校友
- ✅ 細緻的權限控制
- ✅ 幹部只能編輯所屬組別資料

## 🏗️ 技術架構

### 後端
- **框架**: Express.js (Node.js)
- **資料庫**: PostgreSQL
- **認證**: JWT
- **密碼加密**: bcryptjs

### 前端（待開發）
- **框架**: React
- **樣式**: Tailwind CSS
- **狀態管理**: Context API / Zustand
- **HTTP 客戶端**: Axios

## 📦 專案結構

```
club-management-system/
├── backend/              # 後端 API
│   ├── config/          # 資料庫設定
│   ├── middleware/      # 中介層（認證、權限）
│   ├── routes/          # API 路由
│   ├── server.js        # 主伺服器檔案
│   ├── package.json
│   └── README.md
├── database/            # 資料庫結構
│   └── schema.sql      # PostgreSQL Schema
├── frontend/           # 前端應用（待開發）
└── README.md           # 本檔案
```

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- PostgreSQL 14+
- npm 或 yarn

### 1. 安裝後端

```bash
cd backend
npm install
```

### 2. 設定資料庫

```bash
# 建立資料庫
createdb club_management

# 執行 schema
psql -d club_management -f ../database/schema.sql
```

### 3. 設定環境變數

```bash
cd backend
cp .env.example .env
# 編輯 .env 填入資料庫連線資訊
```

### 4. 啟動後端伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:5000` 啟動

### 5. 測試 API

```bash
# 健康檢查
curl http://localhost:5000/health

# 查看 API 端點
curl http://localhost:5000/
```

## 📖 API 文件

詳見 [後端 README](./backend/README.md)

### 主要端點

- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `GET /api/members` - 獲取社員列表
- `GET /api/files` - 獲取檔案列表
- `GET /api/community/announcements` - 獲取公告
- `GET /api/community/events` - 獲取活動列表
- `GET /api/departments` - 獲取組別資訊

## 👥 使用者角色與權限

| 角色 | 權限說明 |
|------|---------|
| 社長 | 完整系統權限，可管理所有資料 |
| 顧問 | 完整系統權限，可管理所有資料 |
| 幹部 | 可編輯所屬組別的檔案和公告，可管理自己的資料 |
| 社員 | 可查看所有檔案，可編輯自己的資料，可報名活動 |
| 校友 | 可查看所有檔案，可編輯自己的資料 |

## 🗂️ 資料庫設計

### 主要資料表

1. **users** - 使用者帳號
2. **members** - 社員詳細資料
3. **departments** - 組別（5個固定組別）
4. **files** - 檔案索引（連結到 Google Drive）
5. **file_categories** - 檔案分類（會議記錄、活動企劃）
6. **announcements** - 公告
7. **events** - 活動
8. **registrations** - 活動報名記錄
9. **comments** - 留言

詳細 schema 請參考 [database/schema.sql](./database/schema.sql)

## 🔧 開發路線圖

### Phase 1: 基礎建設 （進行中）
- [x] 資料庫設計
- [x] 後端 API 開發
- [x] 認證系統
- [x] 權限管理

### Phase 2: 前端開發
- [ ] 登入/註冊頁面
- [ ] 社員管理介面
- [ ] 檔案瀏覽系統
- [ ] 響應式設計

### Phase 3: 進階功能
- [ ] Google Drive API 整合
- [ ] 財務紀錄模組
- [ ] 任務分配系統
- [ ] 數據統計儀表板
- [ ] 匯出功能（Excel/PDF）

### Phase 4: 優化與部署
- [ ] 效能優化
- [ ] 單元測試
- [ ] 部署到雲端平台
- [ ] CI/CD 設定

## 🎨 預覽畫面

（待前端開發完成後加入截圖）

## 📝 開發指南

### 新增 API 端點

1. 在 `backend/routes/` 建立新的路由檔案
2. 在 `server.js` 匯入並註冊路由
3. 加入適當的權限中介層
4. 更新 API 文件

### 資料庫變更

1. 修改 `database/schema.sql`
2. 建立 migration script
3. 更新相關的 API 路由
4. 測試資料完整性

## 🤝 貢獻指南

歡迎提交 Pull Request！

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

MIT License - 詳見 [LICENSE](./LICENSE)

## 🤝 貢獻

歡迎貢獻！請閱讀 [貢獻指南](./CONTRIBUTING.md) 了解如何參與。

## 📧 聯絡方式

如有問題或建議，歡迎：
- 開 [Issue](../../issues)
- 提交 [Pull Request](../../pulls)
- 在 [Discussions](../../discussions) 中討論

## 🙏 致謝

感謝所有貢獻者和使用者！

## 📊 專案狀態

- ✅ **Phase 1: 後端 API** - 進行中
- 🚧 **Phase 2: 前端開發** - 規劃中
- ⏳ **Phase 3: 進階功能** - 規劃中
- ⏳ **Phase 4: 部署上線** - 規劃中

---

<div align="center">

**⭐ 如果這個專案對你有幫助，請給個 Star！**


</div>
