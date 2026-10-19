# Release Notes — Mitior 2.0 (Mitior OS / mOS v2.0.0)

**Release Date**: 2026-10-19  
**Release Version**: `2.0.0`

---

## Highlights & New Capabilities

1. **IEEE 830 Software Requirements Specification (`/SRS.md`) & Interactive In-App Viewer (`SrsDocumentView.tsx`)**:
   - Full IEEE 830 specification covering Scope, Product Perspective, 4 User Roles (`CEO`, `Fundi`, `Operator`, `Auditor`), Operating Environments, Data Sovereignty, Functional Requirements (`[FR-NAV]` through `[FR-LIC]`), Non-Functional Requirements (`[NFR-PER]`, `[NFR-REL]`, `[NFR-SEC]`), Data Schemas, and Traceability Matrix.
   - Accessible via **"10. SRS Specs"** in the sidebar, header, persistent bottom dock, and pop-up navigation sheet, as well as under **Settings → 10. SRS Specification**.
   - Includes instant keyword search filtering across requirement IDs and categories, 1-click **"Download SRS.md"**, and **"Copy Raw Markdown"**.

2. **Typography Revamp (`Plus Jakarta Sans` & `Outfit`)**:
   - Replaced previous fonts with **Plus Jakarta Sans** (body text, controls, tables, metrics) and **Outfit** (headings, titles, badges), preloaded via Google Fonts with `font-display: swap`.
   - Synchronized OpenGraph and meta descriptions in `index.html` with `metadata.json`.

3. **Zero-Scrollbar Spacing, Ergonomics & Persistent Floating Bottom Dock**:
   - Compacted vertical padding and grid gaps across headers, cards, and containers; injected global scrollbar suppression utilities (`no-scrollbar`, `scrollbar-gutter: stable`).
   - Pinned a persistent floating quick-access dock (`bottom-3 left-1/2 -translate-x-1/2 z-40`) with a **"Menu"** button that pops up the **Workspace Navigation Sheet Modal** from any scroll position, 1-click node switchers, dark/light theme toggle, and smooth **"Return to Top"** action.

4. **4-Role Governance (`CEO`, `Fundi`, `Operator`, `Auditor`) & Quantitative 4C Decision Matrix**:
   - Full 4-tier RBAC across workspace initialization and Settings.
   - Interactive Quantitative 4C Decision Evaluation Matrix in `ClarityCompassView.tsx` (`1–5` sliders across Company, Customer, Culture, Competitive; real-time `0–100%` score; `GO`/`NO-GO` verdict).

5. **Codebase Hardening & Security Upgrades**:
   - Replaced 100% of browser `window.alert()` calls with inline feedback banners.
   - Salted SHA-256 (`salt:digest`) with `crypto.timingSafeEqual` for passwords and 4-digit security PINs.
   - Recovery-token verified `/api/auth/reset-password` and `workspaceData` synchronization across Multi-Node Sync Codes.
