# JUH Residency Dashboard — Checkpoint

**Date:** 2026-06-09  
**Live URL:** https://juh-residency.web.app  
**Firebase Project:** `juh-match-dashboard`

---

## Changes Made

### 1. Form Split: Raw Score + JU Graduate Bonus (Commit `096bb82`)

**Files modified:** `public/index.html`, `public/app.js`, `public/admin.js`, `public/admin.html`

- Split the single "points" input into two parts:
  - **Raw Score (العلامة النهائية):** The exact score shown on the official application website. Validated to range 60–90.
  - **JU Graduate Question:** Yes/No radio — if yes, 10 bonus points are added automatically.
- Total = rawPoints + (isJUGraduate ? 10 : 0)
- Public table shows total as the main number, with inline breakdown `(71.81 + 10)` for JU graduates.
- Included official university quote explaining why the 10 points don't appear on the application website.
- Backward compatible: old entries without `rawPoints`/`isJUGraduate` still display correctly.

### 2. Decimal Precision Fix (Commit `8214766`)

- Changed all `toFixed(3)` calls to `toFixed(2)` across `app.js` and `admin.js`.
- Matches the official website format: `X.XX` (exactly 2 decimal places).

### 3. Connect-on-Demand for Firebase Free Plan (Commit `cf8eb44`)

**File modified:** `public/app.js`

- **Problem:** Firebase Spark plan allows only 100 simultaneous WebSocket connections. Sharing the link in an active group chat could easily exceed this.
- **Solution:** Implemented `goOnline()`/`goOffline()` pattern:
  - The app starts **offline** (no persistent connection).
  - When it needs to read or write data, it briefly goes online, performs the operation, and immediately goes offline.
  - Each user holds a connection for ~200ms instead of permanently.
- **Result:** 1000+ users can have the page open simultaneously on the free plan.
- Auto-refresh interval increased from 30s to 60s to further reduce connection pressure.
- Admin page (`admin.js`) was **not** changed — it uses `onValue` listeners which is fine since only 1 admin uses it.

---

## Testing Completed

- **Security Rules:** 7/7 tests passed (write-once, delete protection, private read lock)
- **E2E Browser Integration:** 12/12 tests passed (connection, theme, language, modals, form with JU grad bonus, 2-decimal display, realtime sync, cleanup)
- All test entries cleaned from database after testing.

---

## Architecture Notes

- Static HTML/JS/CSS on Firebase Hosting + Firebase Realtime Database
- Dual-write: `submissions_public` (public read) + `submissions_private` (admin-only, stores real names)
- Write-once security rules for public users; admin (`hussainalhashem99@gmail.com`) can overwrite
- 18 specialties with official seat counts, 50% occupancy threshold before stats unlock
- Bilingual AR/EN with Tajawal font, glassmorphism dark/light theme

---

## Git History

| Commit | Description |
|--------|-------------|
| `096bb82` | Added JU graduate field, raw score input (60-90), bonus calculation |
| `8214766` | Changed decimal precision from 3 to 2 places |
| `cf8eb44` | Connect-on-demand pattern (goOnline/goOffline) for Spark plan |
