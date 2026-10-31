# CareerWave — AI Career Operating System & Learning Platform

CareerWave is a full-stack, lightweight AI Career Operating System built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and an **Express.js** backend. It is engineered with a **Unified Single-File Schema Architecture** (`src/types.ts` + `supabase/schema.sql`) and **Dual-Persistence Engine** so it runs out-of-the-box locally and migrates seamlessly to **Hostinger** (Node.js Web App / VPS + MySQL 8.0), **AWS** (EC2 / Lightsail / App Runner + RDS PostgreSQL), or **Supabase** with zero feature loss.

---

## ✨ Key Capabilities

1. **Multi-Source Live Job Aggregator & Daily Excel Feed**
   - Fetches real-time jobs in parallel (`Promise.allSettled`) from **JSearch (RapidAPI / Google for Jobs)**, **Adzuna**, and **Jooble** covering LinkedIn, Indeed, Glassdoor, Naukri, Apna, and company career sites.
   - **Compact Scannable Row View**: Click any job row to expand full description, AI match breakdown, required vs. missing skills, and an AI Application Kit.
   - **Admin Excel/CSV Daily Upload**: Super-Admins & Placement Officers can download a pre-formatted `.xlsx` sample template and bulk-upload daily job/internship postings that immediately appear at the top of the Job Hunter feed.
   - **Direct Apply & Auto-Tracking**: Opens original job links in a new tab (`noopener,noreferrer`), logs applications to the Kanban tracker, and prompts confirmation upon return.

2. **ATS Resume Studio & One-Click Profile Auto-Fill**
   - Upload any `.pdf`, `.docx`, or `.txt` resume in the **Profile** or **Resume Studio** to automatically parse and populate contact info, skills, work experience, education, and projects.
   - Deterministic 0–100 ATS Scoring Engine + Job-Specific JD Match Ring with one-click bullet quantification and `.docx` / PDF export.

3. **Dynamic Multi-Gateway Payment System & PDF Tax Invoices**
   - Super-Admin dashboard controls for **Razorpay**, **Cashfree**, and **Direct UPI (Intent / Dynamic QR)** with live activation toggles, Sandbox/Live environment switching, and database-stored credentials (no server restart required).
   - Dynamic checkout routing (`GET /api/payment/active-gateways`) + webhook listeners (`/api/webhooks/razorpay`, `/api/webhooks/cashfree`).
   - Instant **A4 GST/Tax PDF Invoice download** directly from the user's Billing & Transaction History table.

4. **Unified Single-File Data Schema & Cloud Portability Hub**
   - **Single Source of Truth**: All 16 core tables, TypeScript interfaces, and multi-dialect DDL generators (`PostgreSQL`, `MySQL 8.0`, `SQLite`) live in `src/types.ts` alongside `supabase/schema.sql`.
   - **One-Click Cloud Export/Import**: Export your entire schema or live database snapshot from **Admin Console → System Config** and deploy to Hostinger or AWS in minutes.

---

## 🚀 1. Quick Start (Local Development)

### Prerequisites
- **Node.js** `v18.18+` or `v20+` (LTS recommended)
- **npm** `v9+` (or `bun`)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your API keys (at minimum, set `GEMINI_API_KEY` for AI features; the app also includes deterministic fallbacks so all core flows work even before external keys are added):

```env
PORT=3000
NODE_ENV=development

# AI Engine (Required for live Gemini AI generation & voice interviews)
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=optional_fallback_openrouter_key

# Live Job Aggregator Keys (Server-side only — optional, falls back to cached/curated jobs if omitted)
JSEARCH_API_KEY=your_rapidapi_jsearch_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
JOOBLE_API_KEY=your_jooble_api_key
```

### Step 3: Start the Development Server
```bash
npm run dev
```
The full-stack server (Express API + Vite frontend) will start on **`http://localhost:3000`**.

> **Zero-Config Local Persistence**: By default, CareerWave automatically creates and persists all data in `data/career_os_db.json` (resumes, jobs, admin Excel uploads, payment gateway configs, transactions, and invoices) without requiring an external database server during local development.

---

## 🔑 2. Default Admin Access & Testing Credentials

To access the **Super-Admin Control Plane** (Role-Based Access Control, Excel Job Uploader, Payment Gateway Configuration, and Cloud Schema Portability Hub):

1. Sign in or click **Switch Role / Admin Console** in the sidebar.
2. Default Super-Admin email configured in the seed store:
   - **Email**: `kotishwarpp@gmail.com` (or use the Role Switcher in the Admin Console header to test `Super Admin`, `Sub-Admin`, `Batch Manager`, and `Placement Officer` permissions).

### Configuring Payment Gateways (No Code Changes Needed)
1. Open **Admin Console → Payment Gateways**.
2. Toggle **Razorpay**, **Cashfree**, or **Direct UPI** ON/OFF.
3. Choose **Sandbox** or **Live** mode and enter your keys:
   - **Razorpay**: `Key ID` & `Key Secret`
   - **Cashfree**: `App ID` & `Secret Key`
   - **Direct UPI**: `UPI VPA (e.g., merchant@upi)`, `Merchant Name`, and `MCC`
4. Click **Save Gateway Configuration**. The user checkout modal immediately reflects active gateways.

### Posting Daily Jobs via Excel / Google Sheets
1. Open **Admin Console → Content & Jobs → Daily Job & Internship Bulk Upload**.
2. Click **Download Sample (.xlsx)** to get the pre-formatted spreadsheet (`Company Name`, `Role / Title`, `Location`, `Work Mode`, `Type`, `Min Salary`, `Max Salary`, `Currency`, `Sector`, `Required Skills`, `Apply Link`, `Description`).
3. Fill in your daily postings and upload the `.xlsx` or `.csv` file.
4. Uploaded jobs are immediately live in the **Job Hunter** page in compact scannable rows.

---

## 🗄️ 3. Unified Single-File Schema Architecture

All data structures are consolidated into two synchronized files so you never have to hunt across migrations:

1. **`src/types.ts`**:
   - Contains all TypeScript interfaces (`JobItem`, `ResumeData`, `PaymentGatewayConfig`, `PaymentOrderRecord`, `UserAccount`, etc.).
   - Contains `UNIFIED_SCHEMA_TABLES` (all 16 database tables) and `generatePortableCloudSql(dialect)` which dynamically generates `postgres`, `mysql`, or `sqlite` SQL DDL.
2. **`supabase/schema.sql`**:
   - Ready-to-run consolidated SQL script containing all 16 tables, indexes, and Row-Level Security (RLS) policies.

---

## 🌐 4. Deploying to Hostinger (hPanel Node.js Web App or VPS)

### Option A: Hostinger Cloud / Shared Hosting (hPanel Node.js Selector)
1. **Export MySQL Schema & Data**:
   - In your running app, go to **Admin Console → System Config → Unified Single-File Schema & Cloud Portability Hub**.
   - Click **Hostinger MySQL (.sql)** to download `careerwave-schema-mysql.sql`.
   - Click **Full Backup (.json)** to download your live data snapshot.
2. **Import into Hostinger phpMyAdmin**:
   - In Hostinger hPanel, go to **Databases → MySQL Databases** and create a new database & user.
   - Open **phpMyAdmin**, select your database, go to the **Import** tab, and upload `careerwave-schema-mysql.sql`.
3. **Deploy Application Code**:
   - Connect your GitHub repository or upload the project zip to `public_html`.
   - In hPanel **Node.js Settings**:
     - **Node.js Version**: `20.x`
     - **Application Root**: `/`
     - **Application Startup File**: `server.js`
   - Add your `.env` variables in the hPanel Environment Variables section (`PORT=3000`, `NODE_ENV=production`, `GEMINI_API_KEY`, `DATABASE_DIALECT=mysql`, etc.).
   - Run the build command:
     ```bash
     npm install && npm run build
     ```
   - Click **Restart App** in hPanel.

### Option B: Hostinger KVM VPS (Ubuntu + PM2 + Nginx)
```bash
# 1. Clone project & install dependencies
git clone <your-repo-url> /var/www/careerwave
cd /var/www/careerwave
npm install

# 2. Configure environment variables
cp .env.example .env
nano .env

# 3. Build optimized frontend chunks & bundled server.js
npm run build

# 4. Start with PM2 process manager
npm install -g pm2
pm2 start server.js --name "careerwave"
pm2 save
pm2 startup
```

---

## ☁️ 5. Deploying to AWS (EC2 / Lightsail / App Runner + RDS PostgreSQL)

### Step 1: Provision AWS RDS PostgreSQL (or Supabase)
1. Create an **AWS RDS PostgreSQL** instance (e.g., `db.t4g.micro` Free Tier).
2. Download `careerwave-schema-postgres.sql` from **Admin Console → System Config** (or use `supabase/schema.sql` directly).
3. Apply the schema:
   ```bash
   psql "postgresql://<user>:<password>@<rds-endpoint>:5432/<dbname>" -f supabase/schema.sql
   ```

### Step 2: Deploy on AWS App Runner / Elastic Beanstalk / EC2
- **Build Command**:
  ```bash
  npm ci && npm run build
  ```
- **Start Command**:
  ```bash
  node server.js
  ```
- **Port**: `3000`
- **Health Check Endpoint**: `GET /api/health` (returns `200 OK` with schema version and uptime).

### Step 3: Restore Live State (Zero-Downtime Migration)
Once your Hostinger or AWS instance is running:
1. Log in to **Admin Console → System Config** on the new server.
2. Click **Restore / Import Snapshot (.json)** and select the backup file exported from your previous environment.
3. All users, resumes, Excel job postings, payment gateway keys, and invoices are restored immediately.

---

## 📦 6. NPM Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts full-stack development server (`tsx server.ts`) on port `3000` |
| `npm run build` | Builds code-split Vite frontend into `dist/` and bundles `server.ts` into `server.js` |
| `npm start` | Starts the production server |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`) across the entire codebase |
| `npm run clean` | Removes build artifacts (`dist/` and `server.js`) |
