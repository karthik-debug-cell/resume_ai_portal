# ResumeAI Portal – Setup Guide

## Folder Structure
```
resume_portal/
├── index.php               ← Public job listing & apply page
├── database.sql            ← Run this first in phpMyAdmin
├── includes/
│   ├── config.php          ← DB credentials (edit here)
│   ├── auth.php            ← Session/login logic
│   └── screening.php       ← Resume parsing & scoring
├── admin/
│   ├── login.php           ← Admin login
│   ├── dashboard.php       ← Candidate management
│   ├── jobs.php            ← Job management
│   ├── view_candidate.php  ← Candidate detail view
│   └── logout.php
└── uploads/
    └── resumes/            ← Uploaded resume files (auto-created)
```

## Installation Steps

1. **Copy folder** to `C:\xampp\htdocs\resume_portal\`

2. **Import database**
   - Open phpMyAdmin → http://localhost/phpmyadmin
   - Click **Import** → choose `database.sql` → Go

3. **Edit DB credentials** (if needed)
   - Open `includes/config.php`
   - Change `DB_USER` and `DB_PASS` to match your MySQL setup

4. **Set folder permissions** (Windows XAMPP — usually automatic)
   - Make sure `uploads/resumes/` folder is writable

5. **Visit the portal**
   - Public: http://localhost/resume_portal/
   - Admin:  http://localhost/resume_portal/admin/login.php
   - Login:  `admin` / `admin123`

## Common Errors Fixed
- `config.php: No such file or directory` → fixed: all includes now use correct `__DIR__` paths
- `applications` table error → fixed: code now uses `candidates` table consistently
- `experience_years` column error → fixed: code now uses `min_experience` (matching DB schema)
