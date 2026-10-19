# Final Defect Register — Mitior 2.0

**Date**: 2026-10-19  
**Total Defects Logged**: 7  
**Total Defects Remediated & Verified**: 7  
**Open Defects Remaining**: **0**

---

## Complete Defect & Remediation Register

| ID | Discovered In | Severity | Component / File | Description | Resolution & Test Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Baseline Audit | **Critical** | `server.ts`, `LoginAuthView.tsx` | Unauthenticated `/api/auth/reset-password` allowed password overwrite without recovery code or session token. | Added `/api/auth/verify-code` (10-min TTL 6-digit recovery code) and required valid `recoveryCode` or active Bearer session in `/api/auth/reset-password` (`401` otherwise). Verified in `tests/app-and-api.test.ts`. | **CLOSED** |
| **SEC-02** | Baseline Audit | **High** | `server.ts` | Security Shield 4-digit PINs were persisted in cleartext in `server_db.json`. | Implemented `hashPin()` and `verifyPin()` using 12-byte random cryptographic salt + SHA-256 (`salt:digest`) and `crypto.timingSafeEqual`. Verified in `tests/app-and-api.test.ts`. | **CLOSED** |
| **SEC-03** | Baseline Audit | **High** | `server.ts` | User passwords used unsalted SHA-256 hashes. | Upgraded `hashPassword()` and `verifyPassword()` to 16-byte salted SHA-256 (`salt:digest`) with `crypto.timingSafeEqual` and automatic upgrade on login. Verified in `tests/app-and-api.test.ts`. | **CLOSED** |
| **SEC-04** | Test Suite Run | **Medium** | `server.ts` (`ipRateLimiter`) | `ipRateLimiter` keyed `rateLimitsLog` only by `ip` instead of `ip:operationLabel`, causing different endpoints to share a single rate-limit bucket. | Scoped `limiterKey` to `${ip}:${operationLabel}`. Verified in `tests/app-and-api.test.ts`. | **CLOSED** |
| **REL-01** | Baseline Audit | **Medium** | `src/components/SettingsView.tsx` | `loadPaymentHistory` called `/api/checkout/history` without `Authorization` header (`401`). | Added `headers: getAuthHeaders()` to `fetch("/api/checkout/history")`. Verified in `tests/app-and-api.test.ts`. | **CLOSED** |
| **REL-02** | Baseline Audit | **Medium** | `server.ts`, `SettingsView.tsx`, `WorkspaceSelectorView.tsx`, `App.tsx` | Sync Codes did not store or hydrate `workspaceData` snapshots when nodes joined a workspace. | Added `workspaceData` persistence to `/api/sync-codes/create` and `/api/sync-codes/verify/:code` and hydrated state in `App.tsx`. Verified in `tests/app-and-api.test.ts`. | **CLOSED** |
| **QA-DEF-01** | QA Cycle 1 (Agent F) | **Low** | `src/components/SrsDocumentView.tsx` | `SrsDocumentView` called `res.text()` on `GET /api/srs` instead of extracting `data.markdown` from the JSON response. | Updated `SrsDocumentView.tsx` (`L403-415`) to parse `application/json` and extract `data.markdown`. Verified in QA Cycle 2. | **CLOSED** |
