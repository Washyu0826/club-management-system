# 📤 上傳到 GitHub 教學

## 方法一：使用 GitHub 網頁介面（最簡單）

### Step 1: 建立新的 Repository

1. 登入 [GitHub](https://github.com)
2. 點擊右上角的 `+` → `New repository`
3. 填寫資訊：
   - **Repository name**: `club-management-system`
   - **Description**: `社團管理系統 - 完整的後端 API 與資料庫設計`
   - **Public** 或 **Private**（看你想不想公開）
   - ⚠️ **不要**勾選 "Add a README file"（我們已經有了）
   - ⚠️ **不要**勾選 "Add .gitignore"（我們已經有了）
   - ⚠️ **不要**選擇 License（我們已經有了）
4. 點擊 `Create repository`

### Step 2: 上傳檔案

GitHub 會顯示一個空的 repository 頁面，你會看到上傳指令。

#### 選項 A：使用命令列（推薦）

在你的專案資料夾中執行：

```bash
# 進入專案目錄
cd club-management-system

# 初始化 Git（如果還沒有）
git init

# 添加所有檔案
git add .

# 第一次 commit
git commit -m "Initial commit: 完整的社團管理系統後端"

# 設定遠端 repository（替換成你的使用者名稱）
git remote add origin https://github.com/你的使用者名稱/club-management-system.git

# 設定主分支為 main
git branch -M main

# 推送到 GitHub
git push -u origin main
```

#### 選項 B：使用 GitHub Desktop（適合不熟命令列的人）

1. 下載並安裝 [GitHub Desktop](https://desktop.github.com/)
2. 登入你的 GitHub 帳號
3. 點擊 `File` → `Add Local Repository`
4. 選擇你的 `club-management-system` 資料夾
5. 如果提示需要初始化，點擊 `create a repository`
6. 在左下角輸入 commit 訊息：`Initial commit: 完整的社團管理系統後端`
7. 點擊 `Commit to main`
8. 點擊頂部的 `Publish repository`
9. 選擇是否公開，然後點擊 `Publish Repository`

#### 選項 C：直接在網頁上傳（適合小專案）

1. 在 GitHub repository 頁面
2. 點擊 `uploading an existing file`
3. 拖曳或選擇所有專案檔案
4. 輸入 commit 訊息
5. 點擊 `Commit changes`

⚠️ **注意**：這個方法不適合有很多檔案的專案，建議使用選項 A 或 B

---

## 方法二：Clone 我們的專案再推送（進階）

如果你想保留完整的 git 歷史：

```bash
# 下載專案
cd 你的工作目錄
# （確保已解壓縮 club-management-system.tar.gz）

cd club-management-system

# 初始化 Git
git init

# 添加所有檔案
git add .

# Commit
git commit -m "Initial commit: 社團管理系統 v1.0"

# 連結到你的 GitHub repository
git remote add origin https://github.com/你的使用者名稱/club-management-system.git

# 推送
git branch -M main
git push -u origin main
```

---

## 📝 上傳前檢查清單

確認以下檔案**不會**被上傳（因為 .gitignore）：

- ✅ `node_modules/` 資料夾
- ✅ `.env` 檔案
- ✅ `*.log` 檔案
- ✅ 個人設定檔案

確認以下檔案**會**被上傳：

- ✅ 所有 `.js` 檔案
- ✅ `package.json`
- ✅ `.env.example`（範例檔案）
- ✅ `README.md` 和其他文件
- ✅ `database/schema.sql`
- ✅ `.gitignore`
- ✅ `LICENSE`

---

## 🎨 美化你的 GitHub Repository

### 1. 加入 Repository 描述

在 repository 頁面右上角點擊 ⚙️ 圖示，加入：
- **Description**: `🎓 社團管理系統 | 完整的後端 API 與資料庫設計 | Node.js + PostgreSQL`
- **Website**: 如果有部署的話
- **Topics**: `nodejs`, `expressjs`, `postgresql`, `jwt`, `rest-api`, `club-management`, `taiwan`

### 2. 啟用 GitHub Features

在 Settings 中啟用：
- ✅ Issues（讓別人可以回報問題）
- ✅ Discussions（討論區）
- ✅ Projects（專案管理）

### 3. 建立 Release

當你完成重要版本時：

1. 到 repository 頁面
2. 點擊右側的 `Releases`
3. 點擊 `Create a new release`
4. 填寫：
   - **Tag**: `v1.0.0`
   - **Title**: `v1.0.0 - 初始版本`
   - **Description**: 列出主要功能
5. 點擊 `Publish release`

---

## 🔗 分享你的專案

上傳後，你可以分享：

```
https://github.com/你的使用者名稱/club-management-system
```

在 README 頂部加入 Badge：

```markdown
![GitHub](https://img.shields.io/github/license/你的使用者名稱/club-management-system)
![GitHub stars](https://img.shields.io/github/stars/你的使用者名稱/club-management-system)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
```

---

## 🚀 後續更新

當你修改程式碼後：

```bash
# 查看變更
git status

# 添加變更
git add .

# Commit
git commit -m "描述你的變更"

# 推送到 GitHub
git push
```

---

## 🆘 常見問題

### Q: 忘記設定 .gitignore，node_modules 被上傳了

```bash
# 移除 node_modules 但保留在本地
git rm -r --cached node_modules
git commit -m "Remove node_modules"
git push
```

### Q: 想要變更 commit 訊息

```bash
# 修改最後一次 commit
git commit --amend -m "新的訊息"
git push --force
```

### Q: 不小心上傳了 .env

```bash
# 立即移除
git rm --cached .env
git commit -m "Remove .env"
git push

# 然後到 GitHub Settings → Secrets 更新敏感資訊
```

### Q: Push 時要求輸入帳號密碼

GitHub 現在使用 Personal Access Token：

1. 到 GitHub Settings → Developer settings → Personal access tokens
2. 建立新的 token
3. 使用 token 作為密碼

或使用 SSH：

```bash
# 設定 SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 複製 public key
cat ~/.ssh/id_ed25519.pub

# 加入到 GitHub Settings → SSH Keys

# 更改 remote URL
git remote set-url origin git@github.com:你的使用者名稱/club-management-system.git
```

---

## ✨ 完成！

你的專案現在已經在 GitHub 上了！

接下來可以：
- 📝 在 README 中加入專案連結
- 🎨 自訂 GitHub Profile
- 📢 分享給社團成員
- 🚀 設定 CI/CD 自動部署

需要幫忙設定 CI/CD 或部署嗎？告訴我！ 😊
