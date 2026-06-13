-- ============================================================
-- AI-Based Resume Screening Portal - Database Setup
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS resume_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE resume_portal;

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    description TEXT,
    required_skills TEXT,
    preferred_skills TEXT,
    min_experience INT DEFAULT 0,
    keywords TEXT,
    status ENUM('active','closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    resume_file VARCHAR(300),
    resume_text LONGTEXT,
    job_id INT,
    match_score DECIMAL(5,2) DEFAULT 0,
    matched_skills TEXT,
    missing_skills TEXT,
    status ENUM('pending','reviewed','shortlisted','rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin (password: admin123)
INSERT INTO admin_users (username, password, email)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@portal.com')
ON DUPLICATE KEY UPDATE username=username;

-- Sample job listings
INSERT INTO jobs (title, department, description, required_skills, preferred_skills, min_experience, keywords) VALUES
('Full Stack Developer', 'Engineering', 'We are looking for a skilled Full Stack Developer to join our team.', 'PHP,JavaScript,MySQL,HTML,CSS', 'React,Laravel,Docker', 2, 'web,backend,frontend,api'),
('Data Analyst', 'Analytics', 'Analyze complex data sets to provide business insights.', 'Python,SQL,Excel,Data Analysis', 'Tableau,Power BI,Machine Learning', 1, 'data,analytics,reports,statistics'),
('UI/UX Designer', 'Design', 'Create intuitive and beautiful user experiences.', 'Figma,Adobe XD,CSS,HTML', 'React,Prototyping,User Research', 1, 'design,ui,ux,interface,wireframe');
