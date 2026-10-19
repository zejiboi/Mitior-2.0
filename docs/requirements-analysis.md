# Phase 2: Requirements Analysis — Mitior 2.0 (Agent A)

**Document Owner**: Agent A — Product & SRS Analyst  
**Source Inputs**: `/SRS.md`, `SYSTEM_REQUIREMENTS.md`, `README.md`, `metadata.json`, and baseline codebase (`8c342d0`).

---

## 1. Executive Summary
Mitior 2.0 (Mitior OS / mOS) is a local-first, autonomous Business Operating System that unifies strategic planning, value engine pipelines, SOP playbooks, organizational accountability, weekly scorecards, 90-day sprint execution, customer enquiry tracking, and IEEE 830 specification compliance into a 10-node workstation console.

Our comprehensive extraction identified **36 discrete requirements** across **11 Functional Categories** and **3 Non-Functional Categories**, classified by criticality (`Critical / Release Blocker`, `High`, `Medium`).

---

## 2. User Roles & Operational Authority Matrix

| Role Identifier | Title | Persona Description | Mutating Capabilities | Read/Export Capabilities |
|---|---|---|---|---|
| `ceo` | **CEO / Executive Admin** | Founder, Managing Director, or Workspace Owner | Full CRUD across all 10 nodes; issue Sync Codes; manage PIN security; upgrade license tier; trigger server snapshots; factory reset. | Full access + JSON/CSV/SRS export. |
| `fundi` | **Fundi (Systems & Process Specialist)** | Operations Engineer, Technical Lead, or Systems Builder | Full CRUD on Value Engine (`02`), Playbooks (`03`), Sprint Canvas (`06`), and Enquiries (`09`); update KPI actuals; cannot wipe workspace or alter billing/PIN security. | Full access + JSON/CSV/SRS export. |
| `operator` | **Operator (Execution Specialist)** | Team Member, Department Coordinator, or Staff Executor | Toggle Playbook checklist steps (`03`), log weekly Scorecard actuals (`05`), update assigned Sprint tasks (`06`), and process Enquiries (`09`). | Full read access across operational nodes + SRS export. |
| `auditor` | **Auditor (Compliance & Governance Reviewer)** | External/Internal Auditor, Board Observer, or QA Inspector | **Read-Only Mode**: Cannot mutate, delete, or overwrite operational records. | Full read access to all 10 nodes, audit logs, and 1-click SRS/CSV/JSON compliance exports. |

---

## 3. Extracted Functional Requirements Inventory

### 3.1 Navigation, Typography & Ergonomics (`[FR-NAV]`)
| ID | Criticality | Requirement Statement | Baseline Status |
|---|---|---|---|
| `FR-NAV-01` | **Critical** | Provide 10-node navigation (`01. Overview` through `10. SRS Specs`) in top navbar and bottom dock. | Partial (Only 1–8 in navbar; 9 & 10 missing) |
| `FR-NAV-02` | **Critical** | Pin a persistent floating bottom dock (`bottom-3 left-1/2 -translate-x-1/2 z-40`) with `"Menu"` pop-up workspace navigation sheet modal, 1-click node switchers, theme toggle, and smooth `"Return to Top"`. | Missing |
| `FR-NAV-03` | **Critical** | Replace legacy fonts with **Plus Jakarta Sans** (body, controls, tables, metrics) and **Outfit** (headings, titles, badges), preloaded via Google Fonts with `font-display: swap`. | Missing (Uses `Space Grotesk` & `Manrope`) |
| `FR-NAV-04` | **High** | Compact vertical padding and grid gaps across headers, cards, and canvas containers; provide global scrollbar suppression (`no-scrollbar`, `scrollbar-gutter: stable`). | Partial |
| `FR-NAV-05` | **Critical** | Replace all browser `window.alert()` / `alert()` calls with inline feedback banners and synchronize OpenGraph/meta descriptions in `index.html` with `metadata.json`. | Defective (10 `alert()` calls present; `index.html` unsynced) |
| `FR-NAV-06` | **Critical** | Implement interactive `SrsDocumentView.tsx` accessible via `"10. SRS Specs"` in navbar, bottom dock, and `Settings → 10. SRS Specification`, with instant keyword/ID search, category filter, 1-click `"Download SRS.md"`, and `"Copy Raw Markdown"`. | Missing |

### 3.2 Authentication, RBAC & Session Security (`[FR-SEC]`)
| ID | Criticality | Requirement Statement | Baseline Status |
|---|---|---|---|
| `FR-SEC-01` | **Critical** | Local account signup, login, session persistence (`/api/auth/me`), and logout with Bearer token authentication. | Implemented |
| `FR-SEC-02` | **Critical** | Password reset (`/api/auth/reset-password`) must verify a valid 6-digit recovery code or active session token before updating credentials. | Defective (Unauthenticated overwrite) |
| `FR-SEC-03` | **High** | Support all 4 SRS user roles (`CEO`, `Fundi`, `Operator`, `Auditor`) in workspace setup, header badge, and role-based UI/action guards. | Partial (Only `ceo` and `employee`) |
| `FR-SEC-04` | **High** | Cryptographically hash Security PINs on the server and enforce workspace PIN lock/unlock overlay. | Defective (Plaintext PIN stored in `server_db.json`) |

### 3.3 Operational Modules (`[FR-ENG]`, `[FR-SOP]`, `[FR-ORG]`, `[FR-SCR]`, `[FR-SPR]`, `[FR-CMP]`, `[FR-ENQ]`, `[FR-SET]`, `[FR-LIC]`)
| ID | Criticality | Requirement Statement | Baseline Status |
|---|---|---|---|
| `FR-ENG-01` | **High** | Multi-pipeline (`Growth`, `Fulfillment`, `Innovation`) Value Engine node creation, editing, deletion, and stage ordering. | Implemented |
| `FR-ENG-02` | **High** | Automated bottleneck flagging (`conversionRate < 50%` or `status === 'Bottleneck'`) and SOP playbook linking. | Implemented |
| `FR-ENG-03` | **Medium** | Enforce license tier node & team seat limits (`Free`: 10 nodes / 4 seats; `Starter`: 20 nodes / 8 seats; `Pro`/`Enterprise`: unlimited). | Implemented |
| `FR-SOP-01` | **High** | SOP Playbook creation, editing, deletion, category filtering, and keyword search. | Implemented |
| `FR-SOP-02` | **High** | Interactive Playbook checklist step toggling with automatic `completionRate` recalculation. | Implemented |
| `FR-ORG-01` | **High** | Team Canvas roster CRUD, Core Accountability Bullets (CABs), capacity tracking, and hiring vacancy status. | Implemented |
| `FR-ORG-02` | **High** | Founder root profile deletion protection with inline feedback banner (no `alert()`). | Partial (Uses `alert()`) |
| `FR-ORG-03` | **Medium** | Live autogenerated hierarchical reporting flowchart (`OrgHierarchyChart.tsx`). | Implemented |
| `FR-SCR-01` | **High** | Weekly KPI Scorecard metric CRUD and automated status classification (`On Track`, `At Risk`, `Off Track`). | Implemented |
| `FR-SCR-02` | **High** | 4-week rolling metric history (`W1`–`W4`) with trend visualization on Scorecard and Overview. | Implemented |
| `FR-SPR-01` | **High** | 90-Day Quarterly Rocks and Monthly Milestones (`M1`–`M3`) management. | Implemented |
| `FR-SPR-02` | **High** | Weekly sprint task board CRUD and status transitions (`Todo`, `In Progress`, `Done`). | Implemented |
| `FR-CMP-01` | **High** | Strategic Clarity Compass editor (Mission, 3-Year North Star, Core Values, 4C Strategic Anchors). | Implemented |
| `FR-CMP-02` | **High** | Interactive Quantitative Decision Evaluation Matrix (`1–5` scoring across Company, Customer, Culture, Competition; `0–100%` score; `GO`/`NO-GO` verdict). | Missing in UI (Type exists in `src/types.ts`) |
| `FR-ENQ-01` | **High** | Customer Enquiries & SLA pipeline management (`09. Enquiries`) with inline feedback banner. | Partial (Uses `alert()`, missing nav link) |
| `FR-SET-01` | **Critical** | Bidirectional Sync Code (`S-OS-XXXX-YYYY`) creation and workspace payload synchronization for joining team members. | Partial (Metadata only; workspace payload not synced) |
| `FR-SET-02` | **High** | Server snapshot backup creation, listing, and 1-click workspace restoration. | Implemented |
| `FR-SET-03` | **High** | Full JSON workspace import/export and CSV export without browser alerts. | Partial (Uses `alert()`) |
| `FR-LIC-01` | **High** | Lipa Na M-Pesa STK Push and Credit Card checkout with deterministic local sandbox fallback. | Implemented |
| `FR-LIC-02` | **High** | Authenticated billing transaction ledger (`GET /api/checkout/history`) displayed in Settings. | Defective (Missing `Authorization` header in `SettingsView.tsx`) |
| `FR-LIC-03` | **Medium** | Enterprise offline workstation bundle compiler and download. | Implemented |

---

## 4. Non-Functional Requirements Inventory

| ID | Category | Requirement Statement | Target Metric |
|---|---|---|---|
| `NFR-PER-01` | Performance | Preload `Plus Jakarta Sans` and `Outfit` fonts with `font-display: swap` for fast cold render. | `< 800ms` local cold render |
| `NFR-PER-02` | Performance | Instant client-side node transitions and zero layout shift via `scrollbar-gutter: stable`. | `< 50ms` view switch |
| `NFR-PER-03` | Performance | Instant keyword/category filtering in `SrsDocumentView.tsx`. | `< 16ms` filter update |
| `NFR-REL-01` | Reliability | Atomic persistence to `localStorage` and server state sync (`server_db.json`). | Zero data loss across reloads/restarts |
| `NFR-REL-02` | Reliability | Safe JSON parsing fallback on corrupted storage payloads. | Zero unhandled exceptions |
| `NFR-SEC-01` | Security | Salted cryptographic hashing for user passwords and security PINs. | Zero plaintext secrets in `server_db.json` |
| `NFR-SEC-02` | Security | Server-side session token verification on all protected API endpoints. | `401 Unauthorized` on unauthenticated calls |
| `NFR-SEC-03` | Security | Strict isolation of server environment variables (`.env`). | Zero secret leakage in client bundle |

---

## 5. Identified Ambiguities, Contradictions & Resolutions
1. **Navigation Node Numbering (`08. Settings`, `09. Enquiries`, `10. SRS Specs`)**:
   - *Observation*: The baseline navbar listed nodes `01` through `08` (ending at `08. Settings`), while `EnquiriesView.tsx` existed as a hidden 9th view and the prompt specifies `"10. SRS Specs"` in the navigation bar, bottom dock pop-up menu, and under `Settings → 10. SRS Specification`.
   - *Resolution*: Expose all 10 nodes (`01. Overview` through `08. Settings`, `09. Enquiries`, and `10. SRS Specs`) in the navigation bar, workspace sheet modal, and bottom dock, and add the `10. SRS Specification` tab inside `SettingsView.tsx`.
2. **User Roles (`CEO, Fundi, Operator, Auditor` vs `'ceo' | 'employee'`)**:
   - *Observation*: The SRS defines 4 roles (`CEO`, `Fundi`, `Operator`, `Auditor`), whereas the baseline code used `'ceo' | 'employee'`.
   - *Resolution*: Extend the role model to support `'ceo' | 'fundi' | 'operator' | 'auditor'` (while preserving `'employee'` as an alias for `'operator'` so existing saved workspaces continue to work seamlessly).
