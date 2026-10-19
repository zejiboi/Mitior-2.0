# Security, Data Integrity & Reliability Audit — Mitior 2.0

**Date**: 2026-10-19  
**Engineer**: Agent E (Security, Data Integrity & Reliability Engineer)

---

## 1. Vulnerabilities Identified & Remediated

| ID | Severity | Vulnerability / Defect | Location | Remediation Implemented | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Critical** | Unauthenticated `/api/auth/reset-password` allowed any caller to overwrite any user's password by supplying `{ email, password }` without a recovery token or session. | `server.ts`, `src/components/LoginAuthView.tsx` | Added `POST /api/auth/verify-code` (10-minute TTL 6-digit recovery token) and enforced that `POST /api/auth/reset-password` requires either a valid `recoveryCode` or an active Bearer session token belonging to that account (`401 Unauthorized` otherwise). | **RESOLVED & VERIFIED** |
| **SEC-02** | **High** | Security Shield 4-digit PINs were stored in cleartext (`pinHash: cleanPin`) in `server_db.json`. | `server.ts` (`/api/security/pin/set`) | Implemented `hashPin()` and `verifyPin()` using a 12-byte random cryptographic salt + SHA-256 (`salt:digest`) and `crypto.timingSafeEqual`. | **RESOLVED & VERIFIED** |
| **SEC-03** | **High** | User passwords used unsalted SHA-256 (`crypto.createHash("sha256")`), vulnerable to rainbow table lookups. | `server.ts` (`hashPassword`) | Upgraded `hashPassword()` to generate a 16-byte random cryptographic salt (`salt:digest`) and `verifyPassword()` to use `crypto.timingSafeEqual` with automatic upgrade of legacy hashes on login. | **RESOLVED & VERIFIED** |
| **REL-01** | **Medium** | `loadPaymentHistory()` in `SettingsView.tsx` called `GET /api/checkout/history` without `Authorization` headers, causing `401 Unauthorized` responses. | `src/components/SettingsView.tsx` | Passed `headers: getAuthHeaders()` to `fetch("/api/checkout/history")`. | **RESOLVED & VERIFIED** |
| **REL-02** | **Medium** | Multi-Node Sync Codes (`/api/sync-codes/create` & `/api/sync-codes/verify/:code`) only stored project metadata without the workspace payload (`workspaceData`). | `server.ts`, `SettingsView.tsx`, `WorkspaceSelectorView.tsx`, `App.tsx` | Added `workspaceData` snapshot persistence on Sync Code creation and automatic hydration when joining a node via Sync Code. | **RESOLVED & VERIFIED** |

---

## 2. Security Controls Verified
1. **Rate Limiting**: `ipRateLimiter` protects `/api/auth/signup`, `/api/auth/login`, `/api/auth/verify-code`, `/api/auth/reset-password`, `/api/sync-codes/create`, `/api/checkout/mpesa-push`, and `/api/checkout/card-pay`.
2. **Cross-Tenant Backup Isolation**: `POST /api/db/backup`, `GET /api/db/backups/:userId`, `GET /api/db/restore/:backupId`, and `DELETE /api/db/backup/:backupId` enforce `checkAuth(req, userId)` so tenants cannot read, restore, or delete another user's backups (`401 Unauthorized`).
3. **Payload Size & PCI Guardrails**: Express JSON body limit (`6mb`) and backup endpoint payload cap (`5MB` max, `413 Payload Too Large`), plus card number masking (`Card ending in *XXXX`) in payment logs.
4. **Webhook Signature Secret**: `POST /api/checkout/mpesa-callback` validates `req.query.secret` against `MPESA_CALLBACK_SECRET` before processing STK callbacks.
