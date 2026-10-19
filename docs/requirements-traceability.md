# Requirements Traceability & Acceptance Verification Matrix — Mitior 2.0

**Date**: 2026-10-19  
**Baseline Contract**: `/SRS.md` (IEEE 830 Software Requirements Specification)  
**Test Suite Evidence**: `tests/app-and-api.test.ts` (`13/13` Passing), `npm run lint` (`0` Errors), `npm run build` (`0` Errors)

---

## Traceability Matrix

| Req ID | Category | Requirement Title | Implementation Location(s) | Verification Method & Test Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-NAV-01** | Navigation | Primary Sidebar, Header & 10-Module Switcher | `src/App.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-NAV-02** | Navigation | Persistent Floating Bottom Dock (`bottom-3 left-1/2 -translate-x-1/2 z-40`) & Pop-Up Navigation Sheet | `src/App.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-NAV-03** | Navigation | Zero-Scrollbar Spacing & Scrollbar Suppression (`no-scrollbar`, `scrollbar-gutter: stable`) | `src/index.css`, `src/App.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-NAV-04** | Navigation | Typography Revamp (`Plus Jakarta Sans` & `Outfit` with `font-display: swap`) & Metadata Sync | `index.html`, `src/index.css`, `metadata.json` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-SEC-01** | Security | Local & Server Account Authentication & Salted SHA-256 Hashing | `server.ts`, `src/components/LoginAuthView.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 2) | **Verified** |
| **FR-SEC-02** | Security | 4-Role Governance (`CEO`, `Fundi`, `Operator`, `Auditor`) | `src/types.ts`, `src/components/WorkspaceSelectorView.tsx`, `src/components/SettingsView.tsx`, `src/App.tsx` | Automated test & TypeScript compile check | **Verified** |
| **FR-SEC-03** | Security | 4-Digit Security Shield PIN Lock with Salted Cryptographic Storage | `server.ts`, `src/App.tsx`, `src/components/SettingsView.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 3) | **Verified** |
| **FR-SEC-04** | Security | Authenticated / Recovery-Token Verified Password Reset (`/api/auth/verify-code`, `/api/auth/reset-password`) | `server.ts`, `src/components/LoginAuthView.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 2 — verifies `401` on unauthenticated reset and `200` with `recoveryCode`) | **Verified** |
| **FR-ENG-01** | Value Engines | Dual Growth & Fulfillment Pipeline Canvas with Undo/Redo History | `src/components/ValueEngineView.tsx`, `src/App.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-ENG-02** | Value Engines | Power Stage to SOP Playbook Deep-Linking | `src/components/ValueEngineView.tsx`, `src/App.tsx` | Static & build verification | **Verified** |
| **FR-SOP-01** | Playbooks | Playbook Authoring, Step Dependencies & Progress Bar | `src/components/PlaybookFolderView.tsx` | Static & build verification | **Verified** |
| **FR-ORG-01** | Team Canvas | Hierarchical Organogram, Vacancy Toggle & Inline Feedback Banners | `src/components/TeamCanvasView.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 1 — zero `alert()` calls) | **Verified** |
| **FR-SCR-01** | Scorecard | 13-Week KPI Matrix, RAG Status & CSV Import/Export | `src/components/ScorecardView.tsx`, `src/components/SettingsView.tsx` | Static & build verification | **Verified** |
| **FR-SPR-01** | Sprints | Quarterly Rally Cry, Good/Better/Best Targets & Meeting Rhythms | `src/components/SprintCanvasView.tsx`, `src/types.ts` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-CMP-01** | Compass | Clarity Compass & Quantitative 4C Decision Evaluation Matrix (`0–100%`, `GO`/`NO-GO`) | `src/components/ClarityCompassView.tsx` | Static & build verification | **Verified** |
| **FR-SET-01** | Settings | Multi-Workspace Partitioning, JSON Snapshot Export/Import & Cloud Backups | `src/components/SettingsView.tsx`, `server.ts` | Automated test (`tests/app-and-api.test.ts` Suite 3) | **Verified** |
| **FR-SET-02** | Settings | Multi-Node Sync Codes (`S-OS-XXXX-YYYY`) with `workspaceData` Hydration | `server.ts`, `src/components/SettingsView.tsx`, `src/components/WorkspaceSelectorView.tsx`, `src/App.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 3) | **Verified** |
| **FR-SET-03** | Settings / SRS | Interactive In-App IEEE 830 SRS Viewer (`10. SRS Specs` & `Settings → 10. SRS Specification`) | `src/components/SrsDocumentView.tsx`, `SRS.md`, `server.ts` (`GET /api/srs`) | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **FR-LIC-01** | Licensing | SaaS License Tier Enforcement, Lipa Na M-Pesa & Card Checkout + Billing History | `src/components/CheckoutPortal.tsx`, `src/components/SettingsView.tsx`, `server.ts` | Automated test (`tests/app-and-api.test.ts` Suite 3) | **Verified** |
| **NFR-PER-01** | Performance | Sub-800ms Cold Render Typography (`font-display: swap`) & Fast Local Persistence | `index.html`, `src/index.css` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **NFR-REL-01** | Reliability | Zero Disruptive `window.alert()` Calls (Inline Feedback Banners Everywhere) | `src/components/TeamCanvasView.tsx`, `src/components/EnquiriesView.tsx`, `src/components/SettingsView.tsx`, `src/components/SrsDocumentView.tsx` | Automated test (`tests/app-and-api.test.ts` Suite 1) | **Verified** |
| **NFR-SEC-01** | Security | Per-Operation IP Rate Limiting (`ip:operationLabel`), Cross-Tenant Backup Isolation & Card Masking | `server.ts` | Automated test (`tests/app-and-api.test.ts` Suite 2 & Suite 3) | **Verified** |
