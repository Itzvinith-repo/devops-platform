# 🚀 DevOps Platform — Desktop Learning App

A **native Windows desktop application** for mastering DevOps and SRE engineering. Built with Electron, React, and Flask — this is a fully offline, self-contained learning tool with interactive labs, full CRUD content management, and a premium glassmorphic UI.

---

## ✨ Features

- 📚 **Comprehensive Curriculum** — 4 learning paths, 12+ modules, 20+ hands-on labs
- 🖥️ **Native Desktop App** — Electron-powered, runs completely offline (no browser needed)
- 🔐 **Admin Mode** — Full CRUD controls to add, edit, and delete courses, modules, labs & resources
- 🧪 **Interactive Labs** — Step-by-step terminal exercises with command walkthroughs
- 🔍 **Smart Resource Search** — Filter and discover curated external references
- 🎨 **Premium Glassmorphic UI** — Dark mode, neon glows, Framer Motion animations throughout
- 🗄️ **Local SQLite Database** — All data stored locally, no internet required

---

## 🗂️ Project Structure

```
devops-platform/
├── backend/                  # Flask REST API
│   ├── app/
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── routes/           # CRUD API endpoints
│   │   └── resources/        # Static resources & PDFs
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── frontend/                 # React + Vite app
│   ├── electron/             # Electron main & preload scripts
│   │   ├── main.cjs          # App entry, backend lifecycle, window mgmt
│   │   └── preload.cjs       # IPC bridge for window controls
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, Modal, Forms
│   │   ├── context/          # AdminContext (global admin toggle)
│   │   ├── pages/            # Dashboard, CourseDetail, LabDetail, Resources
│   │   ├── api/              # API client (full CRUD)
│   │   └── styles/           # Global CSS (glassmorphism design system)
│   ├── vite.config.js
│   └── package.json
├── start-desktop.bat         # One-click launcher script
└── README.md
```

---

## 🚀 Running the App

### Quick Start (Recommended)

Simply double-click **`start-desktop.bat`** in the project root.

It will automatically:
- Set up the Python virtual environment if missing
- Install Node.js dependencies if missing
- Start the Flask backend and launch the Electron window

### Development Mode (Manual)

```bash
# From the frontend directory:
npm run electron:dev
```

This runs the Vite dev server + Electron concurrently with live-reload.

### Build a Distributable Installer

```bash
# From the frontend directory:
npm run electron:build
```

Outputs a standalone Windows installer to `frontend/dist-electron/`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/` | List all courses |
| POST | `/api/courses/` | Create a new course |
| PUT | `/api/courses/<id>` | Update a course |
| DELETE | `/api/courses/<id>` | Delete a course |
| GET | `/api/courses/<id>/modules/` | List modules for a course |
| POST | `/api/courses/<id>/modules/` | Add a module |
| PUT | `/api/courses/<id>/modules/<mid>` | Update a module |
| DELETE | `/api/courses/<id>/modules/<mid>` | Delete a module |
| GET/POST/PUT/DELETE | `/api/labs/<id>` | Full CRUD for labs |
| GET/POST/PUT/DELETE | `/api/resources/<id>` | Full CRUD for resources |

---

## 🛠️ Tech Stack

**Backend:** Flask · SQLAlchemy · Flask-CORS · SQLite

**Frontend:** React 18 · Vite · Framer Motion · React Router (HashRouter) · Vanilla CSS

**Desktop:** Electron · electron-builder · concurrently · wait-on

---

## 📖 Learning Paths

1. **Foundations** — Linux fundamentals, Bash scripting, user management
2. **Containerization** — Docker, image management, container networking
3. **Orchestration** — Kubernetes, deployments, services, namespaces
4. **CI/CD & DevSecOps** — Pipelines, automation, security scanning

---

## 🔮 Future Enhancements

- [ ] User authentication & learner profiles
- [ ] Built-in PDF viewer
- [ ] Quiz & assessment engine
- [ ] Certification generation
- [ ] Code snippet playground / terminal emulator
- [ ] Video lesson integration
- [ ] Progress sync across devices

---

## 📜 License

Educational — For learning and personal portfolio purposes.
