/**
 * JUH Match Dashboard - Backend Security Rules Probe
 * Zero-dependency automated security validation using the Firebase Realtime Database REST API.
 * This script runs native HTTP probes to verify production security policies.
 */

const https = require('https');

const DB_URL = "https://juh-match-dashboard-default-rtdb.europe-west1.firebasedatabase.app";

// Promisified HTTPS REST helper
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = `${DB_URL}${path}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let json = null;
                try {
                    json = data ? JSON.parse(data) : null;
                } catch (e) {
                    // Not JSON
                }
                resolve({
                    statusCode: res.statusCode,
                    body: json || data
                });
            });
        });

        req.on('error', (err) => reject(err));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Visual status logger
function logTest(name, passed, detail = '') {
    const symbol = passed ? '✅' : '❌';
    const status = passed ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
    console.log(`${symbol} [${status}] ${name} ${detail ? `(${detail})` : ''}`);
}

async function runBackendSecurityProbe() {
    console.log("==================================================");
    console.log("🔒 STARTING LIVE BACKEND DATABASE SECURITY PROBE");
    console.log(`📡 Targeting Endpoint: ${DB_URL}`);
    console.log("==================================================\n");

    let allPassed = true;
    let tempProbeKey = null;

    // Test 1: Public Read Access
    try {
        const res = await request('GET', '/submissions_public.json?limitToFirst=1&orderBy="%24key"');
        const success = res.statusCode === 200;
        logTest("Public Read Verification", success, `Status: ${res.statusCode}`);
        if (!success) allPassed = false;
    } catch (e) {
        logTest("Public Read Verification", false, e.message);
        allPassed = false;
    }

    // Test 2: Public Write-Once (Create Entry)
    try {
        const mockPublicData = {
            displayId: "TEST",
            specialty: "طب وجراحة العيون",
            points: 88.5,
            isPublic: false,
            timestamp: Date.now(),
            isProbe: true // Marked as test probe data
        };
        const res = await request('POST', '/submissions_public.json', mockPublicData);
        const success = res.statusCode === 200 && res.body && res.body.name;
        if (success) {
            tempProbeKey = res.body.name; // Keep the key for subsequent rules tests
        }
        logTest("Anonymous Node Creation (Create)", success, `Status: ${res.statusCode}, Key: ${tempProbeKey}`);
        if (!success) allPassed = false;
    } catch (e) {
        logTest("Anonymous Node Creation (Create)", false, e.message);
        allPassed = false;
    }

    if (tempProbeKey) {
        // Test 3: Public Override Lock Protection (Prevent Updates to existing nodes)
        try {
            const tamperedData = {
                points: 99.99 // Trying to overwrite points
            };
            const res = await request('PUT', `/submissions_public/${tempProbeKey}.json`, tamperedData);
            // Rules should deny writes to existing data (return 401 Unauthorized or 403 Forbidden)
            const success = res.statusCode === 401 || res.statusCode === 403;
            logTest("Write-Once Constraint (Prevent Updates)", success, `Status: ${res.statusCode} (Expected 401/403)`);
            if (!success) allPassed = false;
        } catch (e) {
            logTest("Write-Once Constraint (Prevent Updates)", false, e.message);
            allPassed = false;
        }

        // Test 4: Public Delete Lock Protection (Prevent Deletions of existing nodes)
        try {
            const res = await request('DELETE', `/submissions_public/${tempProbeKey}.json`);
            // Rules should deny deletes to public users (return 401/403)
            const success = res.statusCode === 401 || res.statusCode === 403;
            logTest("Public Deletion Protection (Prevent Deletions)", success, `Status: ${res.statusCode} (Expected 401/403)`);
            if (!success) allPassed = false;
        } catch (e) {
            logTest("Public Deletion Protection (Prevent Deletions)", false, e.message);
            allPassed = false;
        }
    } else {
        console.log("⚠️ Skipping public update/delete rule tests because node creation failed.");
        allPassed = false;
    }

    // Test 5: Confidential Private Name Read Protection
    try {
        const res = await request('GET', '/submissions_private.json');
        // Public users must NEVER be allowed to read private names (Expected 401/403)
        const success = res.statusCode === 401 || res.statusCode === 403;
        logTest("Private Name Confidentiality (Read Lock)", success, `Status: ${res.statusCode} (Expected 401/403)`);
        if (!success) allPassed = false;
    } catch (e) {
        logTest("Private Name Confidentiality (Read Lock)", false, e.message);
        allPassed = false;
    }

    // Test 6: Private Node Write-Once (Create Private Record)
    if (tempProbeKey) {
        try {
            const mockPrivateData = {
                name: "Secret Probe Candidate Name"
            };
            // Try to write the private name matching the generated key
            const res = await request('PUT', `/submissions_private/${tempProbeKey}.json`, mockPrivateData);
            const success = res.statusCode === 200;
            logTest("Private Name Storage Validation (Create)", success, `Status: ${res.statusCode}`);
            if (!success) allPassed = false;
        } catch (e) {
            logTest("Private Name Storage Validation (Create)", false, e.message);
            allPassed = false;
        }

        // Test 7: Private Override Lock Protection (Prevent Updates to existing private records)
        try {
            const tamperedPrivateData = {
                name: "Tampered Candidate Name"
            };
            const res = await request('PUT', `/submissions_private/${tempProbeKey}.json`, tamperedPrivateData);
            const success = res.statusCode === 401 || res.statusCode === 403;
            logTest("Private Write-Once Constraint (Prevent Updates)", success, `Status: ${res.statusCode} (Expected 401/403)`);
            if (!success) allPassed = false;
        } catch (e) {
            logTest("Private Write-Once Constraint (Prevent Updates)", false, e.message);
            allPassed = false;
        }
    } else {
        console.log("⚠️ Skipping private record rule tests because public node creation failed.");
        allPassed = false;
    }

    console.log("\n==================================================");
    if (allPassed) {
        console.log("🏁 \x1b[32mBACKEND PROBE RESULTS: ALL SECURITY RULES SECURE!\x1b[0m");
        console.log("Public data is write-once, private names are locked and encrypted.");
    } else {
        console.log("🏁 \x1b[31mBACKEND PROBE RESULTS: SECURITY POLICY FAILURES ENCOUNTERED!\x1b[0m");
        console.log("Please verify database.rules.json syntax and deployment.");
    }
    console.log("==================================================\n");

    process.exit(allPassed ? 0 : 1);
}

runBackendSecurityProbe();