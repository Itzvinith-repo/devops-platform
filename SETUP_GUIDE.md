# 🚀 DevOps Platform - Complete Setup Guide

## Overview
This is a **production-ready DevOps learning platform** with comprehensive content covering Linux, Docker, Kubernetes, CI/CD, and Cloud platforms. The application features real analytics, progress tracking, and a complete curriculum with 32 modules, 87+ labs, and 4 major projects.

---

## ✨ What's Included

### **Content Structure**
- **Part 1:** Linux Fundamentals & Automation (8 modules, 25+ labs)
- **Part 2:** Containerization with Docker (6 modules, 15+ labs)
- **Part 3:** Kubernetes Orchestration (7 modules, 20+ labs)
- **Part 4:** CI/CD & Automation (6 modules, 12+ labs)
- **Part 5:** Cloud Platforms & Infrastructure (5 modules, 15+ labs)

### **Features**
✅ **Complete Curriculum** - All content from PROGRESS_TRACKER_COMPLETE_CONTENT.md
✅ **Real Analytics** - Live progress tracking with statistics
✅ **Interactive Labs** - Step-by-step exercises with copy-to-clipboard
✅ **Admin Mode** - Full CRUD for courses, modules, labs, resources
✅ **Progress Tracking** - Mark labs complete, view completion history
✅ **Offline-First** - Runs completely offline with SQLite
✅ **Desktop App** - Native Windows application with Electron

---

## 📋 Prerequisites

### Required Software
- **Python 3.8+** (Tested with Python 3.13.2)
- **Node.js 16+** (Tested with Node.js v24.11.0)
- **Git** (for version control)

### Check Installations
```bash
python --version
node --version
npm --version
git --version
```

---

## 🚀 Quick Start (Recommended)

### Option 1: One-Click Launcher (Windows)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd devops-platform
   ```

2. **Double-click `start-desktop.bat`**
   - Automatically sets up Python virtual environment
   - Installs all dependencies
   - Seeds database with complete content
   - Launches Electron desktop app

3. **Wait for the app to open** (first launch takes 1-2 minutes)

That's it! The application will:
- Create a fresh database
- Populate it with all 32 modules and 87+ labs
- Create sample progress data
- Launch the desktop window

---

## 🔧 Manual Setup (Development)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Initialize database with content:**
   ```bash
   python run.py
   ```
   
   This will:
   - Delete existing database (if any)
   - Create fresh database schema
   - Parse `data/PROGRESS_TRACKER_COMPLETE_CONTENT.md`
   - Seed all courses, modules, labs, quizzes
   - Create sample progress data
   - Start Flask server on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   - Opens Vite dev server on `http://localhost:5173`

4. **Or run Electron desktop app:**
   ```bash
   npm run electron:dev
   ```
   - Starts both Vite and Electron
   - Opens native desktop window

---

## 📊 Database Seeding Details

### How It Works

The `backend/run.py` script includes a sophisticated markdown parser that:

1. **Reads** `backend/data/PROGRESS_TRACKER_COMPLETE_CONTENT.md`
2. **Parses** the structure:
   - `## PART X:` → Course
   - `### MODULE X.Y:` → Module
   - `#### THEORY:` → Module content
   - `#### LABS:` → Lab exercises
   - `#### QUIZZES:` → Quiz questions
3. **Seeds** the database with all content
4. **Creates** sample progress for demonstration

### Database Location
- **Development:** `backend/instance/devops_platform.db`
- **SQLite** database (portable, no server needed)

### Resetting Database

To start fresh:
```bash
cd backend
# Delete database
rm instance/devops_platform.db
# Or on Windows
del instance\devops_platform.db

# Re-run to recreate
python run.py
```

---

## 📈 Analytics & Progress Tracking

### How Analytics Work

The analytics dashboard (`/analytics`) shows **real-time statistics**:

1. **Overall Progress**
   - Total courses, modules, labs
   - Completion percentage
   - Visual progress ring

2. **Course Breakdown**
   - Per-course completion stats
   - Module counts
   - Lab completion ratios
   - Progress bars

3. **Recent Activity**
   - Last 8 completed labs
   - Completion timestamps
   - Quick navigation links

### Progress Tracking

- **Default User:** `local` (created automatically)
- **Mark Complete:** Click checkmark on lab detail page
- **View Progress:** Analytics page updates in real-time
- **Sample Data:** Initial setup creates 3 completed modules + 5 completed labs

### API Endpoints

```
GET  /api/progress/stats              # Analytics dashboard data
GET  /api/progress/labs                # All lab completion status
GET  /api/progress/module/:id          # Module-specific progress
GET  /api/progress/lab/:id             # Single lab status
POST /api/progress/lab/:id             # Toggle lab completion
```

---

## 🎨 Admin Mode

### Enabling Admin Mode

1. Click the **lock icon** in the navbar
2. Toggle switches from 🔒 to 🔓
3. Edit buttons appear on all content

### Admin Capabilities

- ✏️ **Create/Edit/Delete** Courses
- ✏️ **Create/Edit/Delete** Modules
- ✏️ **Create/Edit/Delete** Labs
- ✏️ **Create/Edit/Delete** Resources
- 📊 **Manage** all content via modal forms

**Note:** Admin mode is client-side only (no authentication). For production, implement backend auth.

---

## 🗂️ Project Structure

```
devops-platform/
├── backend/                      # Flask REST API
│   ├── app/
│   │   ├── models/               # SQLAlchemy models
│   │   │   └── __init__.py       # User, Course, Module, Lab, etc.
│   │   ├── routes/               # API endpoints
│   │   │   ├── course_routes.py  # CRUD for courses/modules
│   │   │   ├── lab_routes.py     # CRUD for labs
│   │   │   ├── resource_routes.py # CRUD for resources
│   │   │   └── progress_routes.py # Progress tracking & analytics
│   │   ├── __init__.py           # App factory
│   │   └── utils.py              # Validation utilities
│   ├── data/
│   │   └── PROGRESS_TRACKER_COMPLETE_CONTENT.md  # Full curriculum
│   ├── instance/
│   │   └── devops_platform.db    # SQLite database (created on first run)
│   ├── config.py                 # Configuration (dev/prod)
│   ├── run.py                    # Entry point + database seeding
│   └── requirements.txt          # Python dependencies
│
├── frontend/                     # React + Vite + Electron
│   ├── electron/
│   │   ├── main.cjs              # Electron main process
│   │   └── preload.cjs           # IPC bridge
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios API client
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TitleBar.jsx
│   │   │   ├── DevOpsModal.jsx
│   │   │   ├── CourseForm.jsx
│   │   │   ├── ModuleForm.jsx
│   │   │   ├── LabForm.jsx
│   │   │   └── ResourceForm.jsx
│   │   ├── context/
│   │   │   └── AdminContext.jsx  # Global admin mode state
│   │   ├── pages/                # Route pages
│   │   │   ├── Dashboard.jsx     # Course listing
│   │   │   ├── Analytics.jsx     # Progress analytics
│   │   │   ├── CourseDetail.jsx  # Course + modules
│   │   │   ├── ModuleDetail.jsx  # Module + labs
│   │   │   ├── LabDetail.jsx     # Lab exercise
│   │   │   └── Resources.jsx     # External resources
│   │   ├── styles/               # Global CSS
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Entry point
│   ├── package.json              # Node dependencies
│   └── vite.config.js            # Vite configuration
│
├── start-desktop.bat             # One-click launcher (Windows)
├── README.md                     # Project overview
├── SETUP_GUIDE.md                # This file
├── SECURITY.md                   # Security documentation
└── FIXES_SUMMARY.md              # Security fixes applied
```

---

## 🔒 Security Features

### Implemented Security

✅ **SECRET_KEY Enforcement** - Required in production
✅ **CORS Whitelisting** - Specific origins only
✅ **Input Validation** - Required fields, type checking, length limits
✅ **Error Handling** - Safe error messages, no stack traces
✅ **File Upload Restrictions** - 50MB limit, whitelist extensions
✅ **Production Defaults** - Safe configuration out of the box
✅ **Logging** - All routes have error logging
✅ **Sanitization** - String inputs sanitized

### Security Limitations

⚠️ **No Authentication** - Admin mode is client-side only
⚠️ **SQLite** - Not suitable for production (use PostgreSQL)
⚠️ **No Rate Limiting** - API can be abused
⚠️ **No HTTPS** - Needs reverse proxy for production

**For Production:** See `SECURITY.md` for hardening guide.

---

## 🧪 Testing the Application

### Verify Database Seeding

1. Start the backend: `python run.py`
2. Check console output:
   ```
   Deleted existing database: ...
   Seeding database from ...
   Seeded 5 courses with modules, labs, quizzes, and projects.
   Created sample progress entries for user 'local'.
   ```

3. Verify in browser:
   - Navigate to `http://localhost:5173`
   - Should see 5 courses on dashboard
   - Click "Analytics" - should show statistics

### Verify Analytics

1. Navigate to `/analytics`
2. Should see:
   - Overall progress ring (non-zero if sample data created)
   - Course breakdown with progress bars
   - Recent activity (if sample data exists)
   - Real numbers matching database

### Verify Progress Tracking

1. Click any course → module → lab
2. Click the checkmark button to mark complete
3. Navigate to `/analytics`
4. Should see updated statistics
5. Recent activity should show the completed lab

### Verify Admin Mode

1. Click lock icon in navbar
2. Toggle admin mode ON
3. Edit buttons should appear
4. Try creating a new course
5. Verify it appears on dashboard

---

## 🐛 Troubleshooting

### Database Not Seeding

**Problem:** No courses appear on dashboard

**Solution:**
```bash
cd backend
# Delete database
rm instance/devops_platform.db
# Verify markdown file exists
ls data/PROGRESS_TRACKER_COMPLETE_CONTENT.md
# Re-run
python run.py
```

### Analytics Shows Zero

**Problem:** Analytics shows 0% progress

**Solution:**
- This is normal on fresh install
- Mark some labs complete to see progress
- Or check if sample progress was created (should have 3 modules + 5 labs complete)

### Flask Not Starting

**Problem:** `ModuleNotFoundError` or import errors

**Solution:**
```bash
cd backend
# Ensure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
# Reinstall dependencies
pip install -r requirements.txt
```

### Electron Not Opening

**Problem:** Desktop window doesn't open

**Solution:**
```bash
cd frontend
# Reinstall dependencies
npm install
# Try dev mode first
npm run dev
# Then try electron
npm run electron:dev
```

### Port Already in Use

**Problem:** `Address already in use: 5000`

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Linux/Mac
# Kill the process or change port in run.py
```

---

## 📦 Building for Distribution

### Create Windows Installer

```bash
cd frontend
npm run electron:build
```

Output: `frontend/dist-electron/DevOps Platform Setup.exe`

### Distribution Package Includes
- Electron app bundle
- Built React frontend
- All dependencies
- Auto-starts Flask backend
- Self-contained (no Python/Node needed)

---

## 🎯 Next Steps

### For Learning
1. ✅ Start with Part 1: Linux Fundamentals
2. ✅ Complete labs in order
3. ✅ Mark labs complete as you finish
4. ✅ Track progress in Analytics
5. ✅ Complete projects for each part

### For Development
1. ✅ Add authentication (JWT/sessions)
2. ✅ Implement backend authorization
3. ✅ Add unit tests
4. ✅ Migrate to PostgreSQL for production
5. ✅ Add rate limiting
6. ✅ Implement user profiles
7. ✅ Add quiz scoring system
8. ✅ Build project submission system

---

## 📚 Additional Resources

- **README.md** - Project overview and features
- **SECURITY.md** - Security best practices
- **FIXES_SUMMARY.md** - Security fixes applied
- **backend/data/PROGRESS_TRACKER_COMPLETE_CONTENT.md** - Full curriculum

---

## 🤝 Support

### Common Questions

**Q: Can I add my own content?**
A: Yes! Use Admin Mode to create courses, modules, and labs.

**Q: Can I export my progress?**
A: Progress is stored in SQLite database. You can backup `instance/devops_platform.db`.

**Q: Can I use this for a team?**
A: Currently single-user. For multi-user, implement authentication and user management.

**Q: Can I deploy this online?**
A: Yes, but implement security features first (see SECURITY.md).

---

## 📄 License

Educational - For learning and personal portfolio purposes.

---

**Happy Learning! 🚀**
