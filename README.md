# Jordan University Hospital (JUH) Residency Coordination Dashboard

A high-performance, responsive, and bilingual (Arabic/English) web application designed to orchestrate and rank postgraduate medical residency matching points in real-time. Built specifically for Jordan University Hospital (JUH) accepted candidates for the academic year 2026.

## 🔗 Live Deployments

* **Public Web Portal**: [https://juh-residency.web.app](https://juh-residency.web.app)
* **Administrative Console**: [https://juh-residency.web.app/admin](https://juh-residency.web.app/admin) (Restricted OAuth)

---

## 🚀 Key Technical Highlights & Architecture

### 1. "Fetch-Once" High Scalability Protocol (Option B)
To circumvent the strict 100-connection concurrent limit of the free-tier Firebase Spark plan, this dashboard implements a high-performance **Fetch-Once architecture**:
* Upon load, the application opens a database connection via `get()`, retrieves the necessary data payload in `< 100ms`, and immediately closes the socket.
* A **30-second silent background poll** keeps data fresh without long-lived active WebSockets.
* A manual **"Refresh Data" button** located prominently in the centered hero header allows instant updates with visual loading cues and cubic-bezier rotational animations (🔄).
* This setup easily handles **500+ simultaneous users** while remaining 100% free of charge.

### 2. Privacy-First Identity Layer & Anti-Trolling Safeguards
Due to the sensitivity of competitive scores, the platform provides robust privacy protection:
* **Anonymous Verification Mapping**: Symmetrical split database model. Real names are exclusively written to `/submissions_private` (restricted read) to cross-reference entries against the official hospital list.
* Public leaderboard data is written to `/submissions_public` using a **cryptographically safe, 4-digit numeric anonymized ID** (e.g., `8301`).
* **50% Seat Occupancy Locking**: Max/min statistics and public ranks for any specialty remain completely locked and invisible until at least 50% of that specialty's official seat capacity has been filled. This prevents early data panic and protects individual candidate profiles from deductive isolation.

### 3. Comprehensive Security Lockdown
* Production Realtime Database rules (`database.rules.json`) strictly enforce a **Write-Once policy** for guests. Once a record is written, public users can neither edit nor delete it.
* Database reads and writes on private namespaces are restricted exclusively to a single designated administrator email: `hussainalhashem99@gmail.com`.
* Front-end panels intercept unauthorized sessions and sign out mismatched credentials instantly.

### 4. Bilingual Translation & RTL Engine
* Real-time Arabic-to-English translation across all forms, dynamic rankings, stats lists, reassurance modals, and table fields.
* Automatic layout adjustment (RTL for Arabic, LTR for English) matching academic standards.
* Microsoft Excel-friendly CSV exporters for both public users (anonymous) and administrators (complete audit trail) equipped with a **UTF-8 Byte Order Mark (BOM)** to prevent Arabic character corruption.

---

## 📁 Repository Directory Structure

```text
├── public/
│   ├── index.html       # Public landing page and match dashboard layout
│   ├── style.css        # Premium Mint & Emerald Dark Mode CSS styling
│   ├── app.js           # Public frontend logic & Firebase fetch-once client
│   ├── admin.html       # Secure Administrator Panel layout
│   ├── admin.js         # Admin panel OAuth controller, secure editor & exporter
│   └── runner.html      # Interactive Glassmorphic Frontend Test Runner
├── .firebaserc          # Firebase environment project definitions
├── .gitignore           # File exclusion mapping for remote repository
├── checkpoint.html      # Project development history and phase documentation
├── database.rules.json  # production Firebase Realtime Database Security Policies
├── delete-mock-data.js  # Script to bulk-delete and purge mock entries safely
├── firebase.json        # Firebase Hosting, Database, and Clean URL configuration
├── generate-mock-data.js# Script to generate realistic mock distribution data
├── package.json         # Node dependencies configuration (Puppeteer tests)
├── README.md            # Technical overview documentation
├── specialties.csv      # CSV data source of specialty capacities
├── test-integration.js  # Puppeteer End-to-End Headless integration tests
└── test-security.js     # Native HTTPS backend REST database security probe
```

---

## 🧪 Testing and Verification Suite

The repository is equipped with a robust dual-layer testing infrastructure:

### 1. Interactive Frontend Test Runner
Access `runner.html` or navigate directly inside a browser to execute **15+ automated assertions**:
* Dynamic dictionary key availability.
* 4-character numeric ID constraints.
* Rank status calculation formulas.
* 50% seat occupancy threshold locks.
* Local storage theme classes.

### 2. Live Backend Security REST Probe
Execute the backend security checker to assert database rule enforcement:
```bash
node test-security.js
```
* Assures public read access is enabled.
* Assures public write-once is active (blocks tampered updates).
* Assures guest deletions are rejected (HTTP 401/403).
* Assures private namespaces are locked (confidential names).

### 3. E2E Headless Browser Integration Tests
Execute the Puppeteer suite to launch a headless Chrome instance and simulate candidate actions:
```bash
node test-integration.js
```
* Simulates navigation, theme changing, language translation, reassurance modals, form input, loading states, success modal, real-time dashboard updates, and automates clean-up.

---

## 📁 Deploying and Running Locally

### Prerequisites
* Install Node.js (v18+ recommended)
* Install Firebase CLI: `npm install -g firebase-tools`

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/hussainalhashem100-glitch/juh-residency-dashboard.git
   cd juh-residency-dashboard
   ```
2. **Install Testing Dependencies**:
   ```bash
   npm install
   ```
3. **Run E2E Suite**:
   ```bash
   node test-integration.js
   ```
4. **Deploy Updates to Firebase**:
   ```bash
   firebase deploy
   ```
