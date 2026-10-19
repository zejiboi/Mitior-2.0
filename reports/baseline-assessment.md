# Phase 1: Baseline Repository & Runtime Assessment — Mitior 2.0 (Mitior OS)

**Date**: 2026-10-19  
**Source Repository**: `https://github.com/zejiboi/Mitior-2.0` (`main` branch, commit `8c342d0`)  
**Workspace**: `/Users/leekitulu/Desktop/PROJECT MITIOR`

---

## 1. Repository Structure & Technology Stack

### Directory Layout (Baseline)
- `server.ts` — Single-file Node.js + Express 4.21.2 backend server (`http://localhost:3000`) serving REST API endpoints (`/api/health`, `/api/auth/*`, `/api/sync-codes/*`, `/api/backups/*`, `/api/security/*`, `/api/checkout/*`, `/api/system/*`) and embedding Vite middleware in development or serving `dist/` in production.
- `src/App.tsx` — Main application state container, session manager, security PIN lock screen, top navigation bar, and workspace node router.
- `src/types.ts` — Shared TypeScript domain interfaces (`EngineNode`, `Playbook`, `TeamMember`, `ScorecardMetric`, `SprintPlan`, `ClarityCompass`, `DecisionEvaluation`, `Enquiry`, `ActivityLog`).
- `src/index.css` — Tailwind CSS v4 (`@tailwindcss/vite`) stylesheet, design tokens, and dark-mode overrides.
- `src/components/` — 16 modular view components:
  - `LandingPageView.tsx` — Public product landing page, pricing grid, and offline compiler preview.
  - `LoginAuthView.tsx` — Authentication portal (Sign In, Sign Up, Password Reset, 6-Digit Recovery Code verification).
  - `WorkspaceSelectorView.tsx` — Role and workspace initialization selector.
  - `OnboardingPreloadView.tsx` & `OnboardingWizard.tsx` — Preload transition and video academy modal.
  - `DashboardOverview.tsx` — Node 01: Executive command overview, operational vitals, Recharts trends, and quick launch cards.
  - `ValueEngineView.tsx` — Node 02: Growth/Fulfillment/Innovation Value Engine builder with bottleneck diagnostics.
  - `PlaybookFolderView.tsx` — Node 03: Standard Operating Procedure (SOP) library, step checklists, and execution progress.
  - `TeamCanvasView.tsx` & `OrgHierarchyChart.tsx` — Node 04: Accountability Canvas, CAB ownership, and live hierarchical org tree.
  - `ScorecardView.tsx` — Node 05: Weekly KPI Scorecard with 4-week rolling trend history and status calculation.
  - `SprintCanvasView.tsx` — Node 06: 90-Day Quarterly Rocks, Monthly milestones, and Weekly task execution board.
  - `ClarityCompassView.tsx` — Node 07: Strategic North Star, 3-Year Target, Core Values, and Customer/Company/Competition anchors.
  - `SettingsView.tsx` — Node 08: Workspace configuration, team access, sync codes, backups, security PIN, licensing, and exports.
  - `EnquiriesView.tsx` — Node 09: Customer enquiries pipeline and SLA tracker (currently not exposed in top nav or bottom dock).
  - `CheckoutPortal.tsx` — Lipa Na M-Pesa (Safaricom Daraja API + sandbox fallback) and Stripe card licensing checkout modal.
  - `DesktopInstallerModal.tsx` — Local desktop packaging and installation guide modal.

### Technology Stack
| Layer | Package / Tool | Version |
|---|---|---|
| Frontend UI | React + React DOM | `19.0.1` |
| Language | TypeScript | `~5.8.2` |
| Bundler / Dev Server | Vite | `6.2.3` (resolved `6.4.3`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | `4.1.14` |
| Animations | `motion` (Framer Motion) | `12.23.24` |
| Charts | `recharts` | `3.8.1` |
| Icons | `lucide-react` | `0.546.0` |
| Backend Server | `express` + `tsx` | `4.21.2` / `4.21.0` |
| Production Server Bundler | `esbuild` | `0.25.0` |
| Persistence | Local JSON File (`server_db.json`) + `localStorage` | Native `fs` + Web Storage |

---

## 2. Baseline Build, Lint, and Test Verification

- **`npm install`**: Succeeded (255 packages installed in 6s).
- **`npm run lint` (`tsc --noEmit`)**: Passed with 0 TypeScript errors on baseline commit `8c342d0`.
- **`npm run build`**: Passed (`vite build` + `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs`).
- **Automated Tests**: **NONE**. The repository has no unit, integration, API, or end-to-end test suite configured in `package.json`.

---

## 3. Baseline Deficiencies & Gaps Against the SRS Contract

### A. Missing Explicit SRS & Feature Deliverables
1. **Missing `/SRS.md`**: The IEEE 830 Software Requirements Specification (`/SRS.md`) covering Scope, Product Perspective, User Roles (`CEO`, `Fundi`, `Operator`, `Auditor`), Operating Environments, Data Sovereignty, Functional Requirements (`[FR-NAV]`, `[FR-SEC]`, `[FR-ENG]`, `[FR-SOP]`, `[FR-ORG]`, `[FR-SCR]`, `[FR-SPR]`, `[FR-CMP]`, `[FR-SET]`, `[FR-LIC]`), Non-Functional Requirements (`[NFR-PER]`, `[NFR-REL]`, `[NFR-SEC]`), Data Schemas, and Traceability Matrix is absent from the repository root.
2. **Missing Interactive In-App SRS Viewer (`src/components/SrsDocumentView.tsx`)**:
   - Not implemented.
   - `"10. SRS Specs"` is missing from the main navigation bar, bottom dock pop-up menu, and `Settings → 10. SRS Specification`.
   - Missing instant keyword search filtering across requirement IDs and categories, 1-click `"Download SRS.md"` export button, and `"Copy Raw Markdown"` button.
3. **Typography Not Revamped**:
   - `src/index.css` still loads `Space Grotesk` and `Manrope` instead of **Plus Jakarta Sans** (body text, controls, tables, metrics) and **Outfit** (headings, titles, badges).
   - `index.html` does not preload Google Fonts with `font-display: swap`.
4. **Missing Persistent Bottom Dock & Menu Pop-Up Accessibility**:
   - `src/App.tsx` lacks the pinned floating quick-access dock (`bottom-3 left-1/2 -translate-x-1/2 z-40`).
   - Missing the `"Menu"` button on the floating dock that opens the workspace navigation sheet modal from any scroll position, 1-click node switchers, dark/light theme switch, and smooth `"Return to Top"` action.
5. **Scrollbars & Ergonomics**:
   - Missing global scrollbar suppression utilities (`no-scrollbar`, `scrollbar-gutter: stable`) and compacted vertical padding/grid gaps across headers, cards, and canvas containers.
6. **Disruptive Browser `window.alert` / `alert()` Calls**:
   - Found 10 `alert(...)` invocations across `src/components/SettingsView.tsx` (6 calls), `src/components/TeamCanvasView.tsx` (3 calls), and `src/components/EnquiriesView.tsx` (1 call).
7. **Unsynchronized `index.html` Metadata**:
   - `index.html` has `<title>My Google AI Studio App</title>` and no OpenGraph/meta description tags matching `metadata.json`.

### B. Functional, Security, and Data Persistence Defects
1. **Unauthenticated Account Takeover on `/api/auth/reset-password` (`server.ts:753`)**:
   - `POST /api/auth/reset-password` accepts `{ email, password }` and overwrites the user's password hash without verifying a recovery code, reset token, or existing session.
2. **Broken Billing History Fetch (`SettingsView.tsx:516`)**:
   - `fetch("/api/checkout/history")` omits `headers: getAuthHeaders()`, causing `GET /api/checkout/history` (protected by `requireLoggedInUser`) to always fail with `401 Unauthorized`.
3. **Plaintext PIN Storage (`server.ts:1063`)**:
   - Security PINs are stored as plaintext (`pinHash: cleanPin`) in `server_db.json` instead of being cryptographically hashed.
4. **Incomplete User Role Model**:
   - SRS defines 4 operational roles (`CEO`, `Fundi`, `Operator`, `Auditor`), whereas the baseline UI only exposes `'ceo' | 'employee'` and lacks role-appropriate permissions (e.g., `Auditor` read-only inspection, `Fundi` technical/SOP/engine specialist, `Operator` execution specialist, `CEO` full executive control).
5. **Sync Code & Workspace Persistence Gap**:
   - Generating a Sync Code (`S-OS-XXXX-YYYY`) stores metadata in `server_db.json`, and verifying it in `WorkspaceSelectorView.tsx` returns project metadata, but the creator's actual workspace state (`nodes`, `playbooks`, `teamMembers`, `scorecard`, `sprintPlan`, `compass`) is never attached to or retrieved via the sync code or automatically persisted to the server unless the user manually clicks "Sync Active" on a paid tier.
6. **Missing Decision Evaluation Matrix UI in `ClarityCompassView.tsx`**:
   - `src/types.ts` defines `DecisionEvaluation` (`companyScore`, `customerScore`, `cultureScore`, `competitiveScore`, `totalPercentage`, `status`), and `ClarityCompass` includes `evaluations?: DecisionEvaluation[]`, but `ClarityCompassView.tsx` has no UI to evaluate strategic decisions against the Clarity Compass.
7. **Node 09 (Enquiries) Unreachable in Navigation**:
   - `EnquiriesView.tsx` is imported and rendered when `activeTab === 'enquiries'`, and `DashboardOverview` links to it, but it is missing from the main navigation list (`navItems` in `App.tsx` jumps from `08. Settings` or omits `09. Enquiries` and `10. SRS Specs`).
