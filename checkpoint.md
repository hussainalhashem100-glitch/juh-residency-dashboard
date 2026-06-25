# JUH Residency Dashboard — Checkpoint

**Date:** 2026-06-25  
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

### 4. Device Fingerprinting (Anti-Spam) (Commit `4de6faa`)

**File modified:** `public/app.js`

- Implemented client-side device fingerprinting using `localStorage` (`juh_dashboard_submitted`).
- Prevents users from submitting multiple entries in a row from the same browser.
- Displays an alert if a user tries to submit again, protecting database integrity.

### 5. Visibility Threshold Adjustment to 1% (Commit `a526e49`)

**File modified:** `public/app.js`

- Lowered the specialty visibility threshold from 30% to 1%.
- Shows data for specialties even if only 1 entry has been submitted, allowing wider visibility for low-entry fields.

### 6. Total Submissions Counter (Commit `09ddcc7` and `c87dbb6`)

**Files modified:** `public/index.html`, `public/app.js`

- Added a "Total Submissions" counter showing the current number of entries out of 86.
- Styled the counter to look clean, modern, and color-neutral to align with the dashboard's design.
- Incremented cache-busting version query string to `v=15` to force clients to load the updated scripts.

### 7. Telegram Notifications for New Entries

**Files modified:** `public/app.js`, `public/index.html`

- Integrated Telegram Bot API (`sendMessage`) to notify the admin immediately upon new submission.
- The HTTP request is sent directly from the client (`app.js`) because Cloud Functions cannot be used due to GCP billing restrictions.
- **Security Note:** The bot token is visible in the frontend source code. This is an accepted tradeoff since the bot is exclusively created for receiving these specific notifications.
- The message includes the submitter's Name, Specialty, and Points formatted using Markdown.
- Incremented cache-busting version query string to `v=16`.

### 8. Official Specialty Cutoffs Ingestion & Update

**Files modified:** `checkpoint.md`

- Ingested the official lowest competitive points for the 18 medical specialties from `Least points.png` into the database.
- Added them anonymously with display names as `"Least points"`, `isPublic: false`, and secure random 4-digit codes.
- Subsequently processed updated cutoffs from `Least points (Updated).png` after some candidates skipped/declined their seats, updating 8 specialties.
- Processed V3 cutoffs from `Least points V3.png` after more candidate skips. Added these new cutoffs as *additional* entries in the database to preserve the progress data, bringing total database submissions to 54.
- Cleaned up the database by purging the temporary security probe records (`Secret Probe Candidate Name` / `TEST`) generated during verification.

---

## Testing Completed

- **Anti-Spam Verification:** Validated that consecutive submissions are blocked and throw the appropriate alert.
- **Telegram Webhook Check:** Ensured that we correctly pass the payload (Name, Specialty, Points) to the Chat ID.
- **Threshold & UI Stats Check:** Verified that all specialties with at least 1 entry display correctly, and verified that the total submission counter updates dynamically.
- All test entries cleaned from database after testing.
- **Live Backend Security Rules Validation:** Run `test-security.js` to assert guest Write-Once and admin-only rules.
- **Connect-on-Demand E2E Check:** Run `test-connection.js` to verify frontend formatting, theme toggling, and DB REST fetches.

---

## Architecture Notes

- Static HTML/JS/CSS on Firebase Hosting + Firebase Realtime Database
- Dual-write: `submissions_public` (public read) + `submissions_private` (admin-only, stores real names)
- Write-once security rules for public users; admin (`hussainalhashem99@gmail.com`) can overwrite
- 18 specialties with official seat counts, 1% occupancy threshold before stats unlock
- Bilingual AR/EN with Tajawal font, glassmorphism dark/light theme

---

## Git History

| Commit | Description |
|--------|-------------|
| `8e369a7` | DOCS: update checkpoint.md with V3 specialty cutoff additions |
| `7854f09` | DOCS: update checkpoint.md with specialty cutoff ingestion |
| `c87dbb6` | UI: simplify total submissions counter design |
| `09ddcc7` | FEAT: add total submissions counter UI |
| `a526e49` | FEAT: update minimum entries threshold to 1% |
| `4de6faa` | FEAT: add LocalStorage device fingerprinting to prevent spam |
| `799b961` | FEAT: update minimum entries threshold to 30% |
| `096bb82` | Added JU graduate field, raw score input (60-90), bonus calculation |
| `8214766` | Changed decimal precision from 3 to 2 places |
| `cf8eb44` | Connect-on-demand pattern (goOnline/goOffline) for Spark plan |