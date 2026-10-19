# Testing & Verification Guide — Mitior 2.0

**Date**: 2026-10-19  
**Test Runner**: Node.js Native Test Runner via `tsx --test` (`tests/app-and-api.test.ts`)

---

## 1. Running the Automated Test Suite

Execute the complete unit, integration, security, and SRS compliance test suite with:

```bash
npm test
```

### What `npm test` Verifies:
1. **IEEE 830 SRS Specification & Endpoint (`GET /api/srs`)**:
   - Confirms `/SRS.md` exists at repository root and contains all IEEE 830 sections, 4 user roles (`CEO`, `Fundi`, `Operator`, `Auditor`), and all functional (`[FR-*]`) and non-functional (`[NFR-*]`) requirement blocks.
   - Verifies `GET /api/srs` returns HTTP `200` with `version: "2.0.0"` and the raw markdown content.
2. **Typography, Zero-Scrollbar Ergonomics & Floating Bottom Dock**:
   - Verifies **Plus Jakarta Sans** and **Outfit** fonts are preloaded with `display=swap` in `index.html` and mapped to `--font-sans` and `--font-display` in `src/index.css`.
   - Verifies OpenGraph and meta descriptions in `index.html` match `metadata.json`.
   - Verifies `scrollbar-gutter: stable` and `.no-scrollbar` utilities in `src/index.css`.
   - Verifies `src/App.tsx` renders the persistent floating bottom dock (`bottom-3 left-1/2 -translate-x-1/2 z-40`), pop-up **Workspace Navigation Sheet Modal**, and **10. SRS Specs** navigation item.
   - Scans every `.tsx` component in `src/components/` to assert **zero** `alert()` calls exist.
3. **Cryptographic Security & Authentication Lifecycle**:
   - Verifies `hashPassword`/`verifyPassword` and `hashPin`/`verifyPin` use salted SHA-256 (`salt:digest`) with `crypto.timingSafeEqual`.
   - Verifies `POST /api/auth/signup`, duplicate rejection (`409`), `POST /api/auth/login`, **unauthenticated password reset rejection (`401`)**, recovery code generation (`POST /api/auth/verify-code`), and verified password reset (`200`).
4. **Multi-Node Sync Codes, Cloud Backups, Salted PIN Lock & Billing**:
   - Verifies `POST /api/sync-codes/create` persists `workspaceData` and `GET /api/sync-codes/verify/:code` returns `workspaceData`.
   - Verifies `POST /api/db/backup`, `GET /api/db/backups/:userId`, `GET /api/db/restore/:backupId`, and cross-tenant isolation (`401`).
   - Verifies `POST /api/security/pin/set` writes salted PIN hashes to disk (never cleartext), rejects invalid PINs (`401`), and verifies/removes valid PINs (`200`).
   - Verifies `POST /api/checkout/card-pay` masks card numbers (`Card ending in *4444`) and `GET /api/checkout/history` returns authenticated billing records.

---

## 2. Static Type Checking & Production Build Verification

```bash
# TypeScript strict type-checking
npm run lint

# Production frontend (Vite) + backend (esbuild) build
npm run build

# End-to-end installation & runtime verification script
bash scripts/verify-installation.sh
```
