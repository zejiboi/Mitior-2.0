# Mitior OS (mOS) — Executive Business Operations Suite

> **Philosophy**: Absolute data sovereignty, offline-first responsiveness, and commercial SaaS scalability in a single unified architecture.

Mitior OS is a professional, high-performance operating system designed for business owners, project leads, and creators to **design, map, and execute company operations**. Combining strategic alignment toolsets with agile execution canvases, Mitior OS lets you model company structures, document standard operating procedures (SOPs), track financial values, and drive focus across teams.

It is uniquely engineered to run **offline-first as a native desktop application** or to be deployed instantly as a multi-tenant, revenue-generating **B2B SaaS application** on public cloud infrastructure.

---

## 🏢 Business Value & Core Modules

Mitior OS comes fully equipped with production-ready operational consoles:

### 1. 🧭 Clarity Compass
*   **Operational Telemetry**: Map executive visions directly to team execution levels.
*   **Organizational Hierarchy**: Draw, track, and align responsibilities and reporting paths dynamically.
*   **Friction Spotlights**: Trace operational overhead and resolve internal team overlaps before they escalate.

### 2. ⚡ Value Engine
*   **Strategic Planners**: Run direct simulations on project benefits, costs, risk coefficients, and ROI projection models.
*   **Financial modeling**: Map complex dynamic calculations with granular cost structures to calculate absolute commercial feasibility.

### 3. 📋 Playbook Folders & SOPs
*   **Process Institutionalization**: Build local repositories of standard-operating folders, guidelines, and manuals.
*   **Training & Checklists**: Maintain standard quality benchmarks, structured documentation, and action items.

### 4. 🏃 Sprint & Team Canvases
*   **Agile Task Boards**: Run daily operations, assign workloads, trace task progress, and visualize dependencies.
*   **Resource Allocation**: Visualize team availability, highlight bottlenecks, and manage group bandwidth.

### 5. 🎯 Executive Scorecards
*   **Telemetry Tracking**: Define KPIs, trace metrics over time, and measure project status.
*   **SaaS Validation Gates**: Control access to premium analytics modules using validation license structures.

---

## ⚡ Setup & Deployment Guidelines

### ☁️ Deploying on Render.com (Production SaaS)

Mitior OS is pre-packaged for instant deployment on [Render](https://render.com) as a highly-performant Web Service:

1.  **Create a New Web Service**:
    *   Connect your GitHub repository to Render.
    *   Set the Runtime environment to **Node**.

2.  **Configure Build & Start Commands**:
    *   **Build Command**: `npm install && npm run build`
    *   *This command compiles the React/Vite frontend and bundles the Express server using esbuild into `dist/server.cjs`.*
    *   **Start Command**: `npm start`
    *   *This command runs the compiled high-efficiency production node (`node dist/server.cjs`).*

3.  **Environment Variables**:
    *   `NODE_ENV`: `production`
    *   `APP_URL`: Your public web service URL (e.g., `https://mitior-os.onrender.com`)
    *   `GEMINI_API_KEY`: *(Optional)* Your server-side Gemini API key for AI-assisted operations modeling.
    *   `STRIPE_SECRET_KEY`: *(Optional)* Production card gateway key.
    *   `MPESA_CONSUMER_KEY` & `MPESA_CONSUMER_SECRET`: *(Optional)* Automated mobile payment gateway keys.
    *   *(Note: The server adaptively binds to Render's allocated environment `PORT` automatically.)*

---

### 💻 Local Desktop Setup (Personal & Workspace Offline Use)

Mitior OS includes fully automated, double-click launchers for complete offline execution—ideal for carrying your business workflows in private local files.

#### 🪟 Windows System Setup
1.  Right-click `installer.ps1` and select **Run with PowerShell** to create a native shortcut.
2.  Double-click **`launch.bat`** at the root of the project.
3.  The launcher automatically:
    *   Checks for the local Node.js environment.
    *   Installs standard package caches on first run.
    *   Launches an isolated Chrome/Edge frame instance pointing straight to your offline sovereign environment (`http://localhost:3000`).

#### 🍎 macOS / Linux Setup
1.  Open your terminal in the project directory.
2.  Make the launch script executable and run:
    ```bash
    chmod +x launch_mac.command
    ./launch_mac.command
    ```
3.  The system prepares production distribution builds and initiates a local browser node mapping all endpoints seamlessly.

---

## 📦 Tech Sandbox & Architecture Specifications

*   **Frontend**: React 19 + TypeScript (strict component typing)
*   **Compiler Bundle**: Vite 6 (Client Assets) + Esbuild (Server micro-bundle target)
*   **Backend Server**: Express 4 (offline JSON storage sync pipelines + security headers)
*   **Transitions Engine**: Motion (hardware-accelerated UX flow)
*   **Vector Accents**: Lucide React Symbols
*   **Telemetry Visuals**: Recharts 3
*   **Local Storage**: Single-file ACID JSON schema with automated workspace ZIP export backup pipelines under Settings.

---

*Engineered with precision for absolute commercial speed, lightweight footprints, and sovereign privacy.*
