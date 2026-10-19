# Phase 2: Architecture Decisions Record (ADR) — Mitior 2.0 (Agent B)

**Document Owner**: Agent B — Principal Software Architect

---

## ADR-001: Salted Cryptographic Hashing for Passwords & Security PINs
- **Status**: Accepted
- **Context**: `server.ts` stored unsalted SHA-256 password hashes and plaintext security PINs in `server_db.json`.
- **Decision**: Implement `hashSecretWithSalt(secret, existingSalt?)` and `verifySecret(secret, storedHash)` using Node's native `crypto.scryptSync` / salted SHA-256 (`<salt>:<hash>`), with backward-compatible verification for legacy unsalted 64-char hex hashes so existing records in `server_db.json` continue to work and upgrade transparently.
- **Consequences**: Eliminates plaintext PIN storage and rainbow-table risks with zero external native binary dependencies.

## ADR-002: Recovery-Token Guarded Password Reset Flow
- **Status**: Accepted
- **Context**: `POST /api/auth/reset-password` previously allowed unauthenticated callers to reset any user's password by supplying only `{ email, password }`.
- **Decision**:
  1. When `POST /api/auth/verify-code` succeeds for `{ email, code }`, the server generates a short-lived cryptographic `resetToken` (valid for 15 minutes) stored on the user record and returns it to the client.
  2. `POST /api/auth/reset-password` now requires either:
     - A valid `resetToken` or matching `recoveryCode` for the target email, OR
     - A valid Bearer session token belonging to that user (`Authorization: Bearer <token>`) plus current password verification when changing password from Settings.
- **Consequences**: Closes the critical account takeover vulnerability while keeping the 6-digit recovery code UX in `LoginAuthView.tsx` and the password update UX in `SettingsView.tsx` seamless.

## ADR-003: Exportable Express Factory & Dynamic Port Binding for Real Integration Testing
- **Status**: Accepted
- **Context**: Automated API and integration tests need to exercise the real `server.ts` routes against an isolated test database file without colliding with a running dev server on port 3000.
- **Decision**:
  1. Support `MITIOR_DB_PATH` environment variable in `server.ts` (defaulting to `./server_db.json`).
  2. Export `createApp()` / `startServer(port)` from `server.ts` and only auto-invoke `startServer()` when `server.ts` is executed directly as the main entrypoint (`process.env.NODE_ENV !== 'test'`).
- **Consequences**: Enables fast, deterministic, zero-mock integration testing of all REST endpoints and persistence behaviors.

## ADR-004: Typography & Zero-Scrollbar Ergonomic Architecture
- **Status**: Accepted
- **Context**: The SRS requires replacing `Manrope`/`Space Grotesk` with `Plus Jakarta Sans` (body, controls, tables, metrics) and `Outfit` (headings, titles, badges) preloaded with `font-display: swap`, alongside zero-scrollbar spacing utilities (`no-scrollbar`, `scrollbar-gutter: stable`).
- **Decision**:
  1. Add `<link rel="preconnect">` and Google Fonts stylesheet links with `display=swap` for `Plus Jakarta Sans`, `Outfit`, and `JetBrains Mono` in `index.html`.
  2. Configure `--font-sans: "Plus Jakarta Sans", ...` and `--font-display: "Outfit", ...` in `src/index.css`, and apply `font-family: var(--font-display)` to headings (`h1`–`h6`, `.font-display`).
  3. Define `.no-scrollbar` and `html { scrollbar-gutter: stable; }` in `src/index.css` and compact excessive vertical padding across views.

## ADR-005: Persistent Floating Bottom Dock & Workspace Navigation Sheet Modal
- **Status**: Accepted
- **Context**: Users scrolled halfway or to the bottom of a workspace node need immediate 1-click access to node switching, the full workspace navigation menu modal, theme switching, and returning to the top of the viewport.
- **Decision**: Implement a persistent floating dock in `src/App.tsx` pinned at `fixed bottom-3 left-1/2 -translate-x-1/2 z-40`, containing:
  - A `"Menu"` button that opens a centered/bottom pop-up Workspace Navigation Sheet Modal (`fixed inset-0 z-50`) regardless of scroll position.
  - Direct 1-click node switchers (including `"10. SRS Specs"`).
  - Dark/Light theme switcher.
  - Smooth `"Return to Top"` button (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
