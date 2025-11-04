-- 社團管理系統資料庫 Schema
-- PostgreSQL

-- 使用者表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('president', 'advisor', 'officer', 'member', 'alumni')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 組別表
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入五個組別
INSERT INTO departments (name, description) VALUES
    ('會長組', '負責社團整體營運與決策'),
    ('活動組', '規劃與執行社團活動'),
    ('行銷組', '社團宣傳與品牌經營'),
    ('課程組', '課程規劃與講師邀請'),
    ('公關組', '對外聯繫與合作洽談');

-- 社員資料表
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(20),
    department VARCHAR(100), -- 系級
    grade VARCHAR(20), -- 年級
    position VARCHAR(50), -- 社團職位
    department_id INTEGER REFERENCES departments(id), -- 所屬組別
    generation INTEGER, -- 第幾屆
    phone VARCHAR(20),
    email VARCHAR(100),
    skills TEXT[], -- 專長（陣列）
    interests TEXT[], -- 興趣（陣列）
    industry VARCHAR(100), -- 產業
    job_role VARCHAR(100), -- 工作職位 (PM, HR, 行銷等)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'alumni', 'inactive')),
    joined_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 檔案分類表
CREATE TABLE file_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設檔案分類
INSERT INTO file_categories (name, description) VALUES
    ('會議紀錄', '各種會議的紀錄文件'),
    ('活動企劃', '活動規劃相關文件');

-- 檔案索引表
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES file_categories(id),
    year INTEGER NOT NULL, -- 年度
    department_id INTEGER REFERENCES departments(id), -- 所屬組別
    google_drive_url TEXT NOT NULL,
    file_type VARCHAR(50), -- pdf, docx, xlsx, etc.
    description TEXT,
    tags TEXT[], -- 標籤陣列
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 公告表
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    department_id INTEGER REFERENCES departments(id), -- NULL 表示全社團公告
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活動表
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INTEGER REFERENCES departments(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活動報名表
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'absent', 'cancelled')),
    notes TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, member_id)
);

-- 留言表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id), -- 支援回覆留言
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_members_name ON members(name);
CREATE INDEX idx_members_generation ON members(generation);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_files_year ON files(year);
CREATE INDEX idx_files_department ON files(department_id);
CREATE INDEX idx_files_category ON files(category_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

-- 更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為各表添加自動更新 updated_at 的觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
