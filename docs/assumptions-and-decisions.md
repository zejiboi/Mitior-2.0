# Phase 2: Assumptions & Product Decisions — Mitior 2.0 (Agent A)

**Document Owner**: Agent A — Product & SRS Analyst

---

## 1. Recorded Assumptions & Engineering Decisions

### Decision 1: Backward-Compatible Four-Role Governance (`CEO`, `Fundi`, `Operator`, `Auditor`)
- **Context**: The SRS specifies four distinct user roles (`CEO`, `Fundi`, `Operator`, `Auditor`), whereas the existing baseline codebase only stored `'ceo' | 'employee'` in `localStorage` (`sOS_user_role`).
- **Decision**: Expand `UserRole` to `'ceo' | 'fundi' | 'operator' | 'auditor' | 'employee'`. Normalize `'employee'` to `'operator'` in role permission helpers while exposing all 4 explicit roles (`CEO`, `Fundi`, `Operator`, `Auditor`) in `WorkspaceSelectorView.tsx`, the top header role badge, and `SettingsView.tsx`.
- **Reversibility**: 100% reversible and backward-compatible with any existing `localStorage` state.

### Decision 2: Dual-Source SRS Document Delivery (`/SRS.md` + `SrsDocumentView.tsx`)
- **Context**: The SRS must exist as a canonical IEEE 830 Markdown file at `/SRS.md` AND be rendered interactively inside `SrsDocumentView.tsx` with instant keyword search across requirement IDs/categories, 1-click `"Download SRS.md"`, and `"Copy Raw Markdown"`.
- **Decision**:
  1. Author the complete IEEE 830 specification at `/SRS.md`.
  2. Expose `GET /api/srs` on `server.ts` to serve the live `/SRS.md` file content, while also bundling the structured requirements dataset and canonical raw markdown fallback directly inside `src/components/SrsDocumentView.tsx` so the viewer works 100% offline even in static preview mode.
  3. Wire `SrsDocumentView.tsx` to both the main workspace navigation (`"10. SRS Specs"`, `activeTab === 'srs'`) and `SettingsView.tsx` (`10. SRS Specification` sub-tab).

### Decision 3: Password Hashing & PIN Hashing Backward Compatibility
- **Context**: `server.ts` previously used unsalted SHA-256 for passwords and stored Security PINs in plaintext (`pinHash: cleanPin`).
- **Decision**:
  1. Upgrade password and PIN hashing in `server.ts` to use salted HMAC-SHA256 (`scryptSync` / salted SHA-256 with per-record salt formatted as `salt:hash`), while retaining a transparent fallback comparator for any pre-existing unsalted SHA-256 password or legacy PIN in `server_db.json` and automatically upgrading the hash on next login/verify.
  2. Require either a valid 6-digit `recoveryCode` (or a one-time `resetToken` issued by `/api/auth/verify-code`) or an active authenticated session token on `POST /api/auth/reset-password`.

### Decision 4: Sync Code Workspace State Hydration
- **Context**: In the baseline repository, `POST /api/sync-codes` stored only project name and description, so when a team member entered a sync code (`S-OS-XXXX-YYYY`) in `WorkspaceSelectorView.tsx`, their workspace loaded generic demo data instead of the administrator's actual workspace state.
- **Decision**: Attach the workspace state snapshot (`workspaceData`) to sync code records on `POST /api/sync-codes` (and allow updating it via `PUT /api/sync-codes/:code` or automatic workspace sync), and return `workspaceData` from `GET /api/sync-codes/verify/:code` so joining team members immediately hydrate the shared workspace.

### Decision 5: Free-Tier Local Persistence vs. Paid Cloud Snapshot Tiers
- **Context**: `server.ts` enforces `requirePaidTier` on `/api/sync-codes` and `/api/backups`, which is an explicit product licensing boundary (`Free` vs `Starter`/`Professional`/`Enterprise`).
- **Decision**: Preserve the licensing tier checks for multi-device cloud backup and sync code issuance, while ensuring that local persistence (`localStorage` + user session state) and the built-in Sandbox Checkout upgrade flow (`CheckoutPortal.tsx`) allow any local evaluator or automated test to upgrade to `Starter`, `Professional`, or `Enterprise` in one click without requiring external payment credentials.
