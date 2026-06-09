/**
 * JUH Match Dashboard - E2E Browser Integration Test Suite
 * Automated headless browser validation using Puppeteer.
 * Assures frontend button clicks, modals, forms, connection states, and live reactivity sync roundtrips.
 */

const puppeteer = require('puppeteer');
const https = require('https');
const { execSync } = require('child_process');

const SITE_URL = "https://juh-residency.web.app";
const DB_URL = "https://juh-match-dashboard-default-rtdb.europe-west1.firebasedatabase.app";

// Helper for programmatic HTTPS request (used to fetch data and check rules)
function dbRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = `${DB_URL}${path}`;
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let json = null;
                try { json = data ? JSON.parse(data) : null; } catch (e) {}
                resolve({ statusCode: res.statusCode, body: json || data });
            });
        });
        req.on('error', (err) => reject(err));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function logStep(name, status, detail = '') {
    const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
    const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[36m';
    console.log(`${symbol} [${color}${status}\x1b[0m] ${name} ${detail ? `| ${detail}` : ''}`);
}

async function runE2ETests() {
    console.log("\n=======================================================");
    console.log("🚀 STARTING AUTOMATED BROWSER E2E INTEGRATION SUITE");
    console.log(`🌐 Target Website: ${SITE_URL}`);
    console.log("=======================================================\n");

    let browser;
    let allPassed = true;
    let testRecordKey = null;
    let extractedAnonymousId = null;

    try {
        logStep("Launcher", "INFO", "Launching headless Chromium browser...");
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 1. Connection and Landing Page Connection Handshake
        logStep("Connection", "INFO", `Navigating to ${SITE_URL}...`);
        await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        const pageTitle = await page.title();
        
        // Correct title check (matches "JUH")
        const connectionSuccess = pageTitle.includes("JUH");
        
        logStep("Connection Handshake", connectionSuccess ? "PASS" : "FAIL", `Page Title: "${pageTitle}"`);
        if (!connectionSuccess) allPassed = false;

        // 2. Interactive Theme Switcher Button Test
        logStep("Theme Switcher", "INFO", "Testing light/dark theme toggle button...");
        const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        await page.click('#themeToggle');
        const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        const expectedToggledTheme = initialTheme === 'dark' ? 'light' : 'dark';
        
        const themeSuccess = toggledTheme === expectedToggledTheme;
        logStep("Theme Switching", themeSuccess ? "PASS" : "FAIL", `Initial: ${initialTheme}, Clicked Theme: ${toggledTheme}`);
        if (!themeSuccess) allPassed = false;
        
        // Restore initial theme
        await page.click('#themeToggle');

        // 3. Interactive Bilingual Language Button Test
        logStep("Language Toggle", "INFO", "Testing dynamic bilingual translation engine toggle...");
        const initialLangText = await page.evaluate(() => document.getElementById('langToggle').textContent.trim());
        await page.click('#langToggle');
        const toggledLangText = await page.evaluate(() => document.getElementById('langToggle').textContent.trim());
        const expectedLangToggleText = initialLangText.includes('English') ? 'العربية' : 'English';
        const docDir = await page.evaluate(() => document.documentElement.dir);
        
        const langSuccess = toggledLangText.includes(expectedLangToggleText);
        logStep("Language Translation", langSuccess ? "PASS" : "FAIL", `Initial selector: "${initialLangText}", Toggled selector: "${toggledLangText}", Direction: ${docDir}`);
        if (!langSuccess) allPassed = false;

        // Restore language to Arabic for the rest of tests
        if (docDir === 'ltr') {
            await page.click('#langToggle');
        }

        // 4. Modal Flow Transitions & Close Button Verification
        logStep("Privacy Modal Transition", "INFO", "Opening Privacy Reassurance Popup...");
        await page.click('#openFormBtn');
        
        // Assert reassurance modal is active
        const isReassuranceVisible = await page.evaluate(() => document.getElementById('reassuranceModal').classList.contains('show'));
        logStep("Reassurance Overlay Visible", isReassuranceVisible ? "PASS" : "FAIL");
        if (!isReassuranceVisible) allPassed = false;

        // Click Proceed button inside reassurance
        logStep("Reassurance Transition", "INFO", "Clicking proceed to entry form...");
        await page.click('#proceedToFormBtn');

        // Assert reassurance closed, form modal opened
        const reassuranceClosed = await page.evaluate(() => !document.getElementById('reassuranceModal').classList.contains('show'));
        const formOpened = await page.evaluate(() => document.getElementById('formModal').classList.contains('show'));
        const transitionSuccess = reassuranceClosed && formOpened;
        
        logStep("Entry Form Modal Transition", transitionSuccess ? "PASS" : "FAIL", `Form Active: ${formOpened}, Reassurance Closed: ${reassuranceClosed}`);
        if (!transitionSuccess) allPassed = false;

        // Click close ("X") button on form modal to test dismissals
        logStep("Close Button Handshake", "INFO", "Verifying the modal 'X' close button is clickable...");
        await page.click('#closeFormBtn');
        const formClosed = await page.evaluate(() => !document.getElementById('formModal').classList.contains('show'));
        
        logStep("Modal Close Button Action", formClosed ? "PASS" : "FAIL");
        if (!formClosed) allPassed = false;

        // 5. Data Entry, Submission Loader, & Database Lifecycle
        logStep("Form Submission Suite", "INFO", "Reopening form and simulating points data entry...");
        await page.click('#openFormBtn');
        await page.click('#proceedToFormBtn');

        // Fill candidate fields
        await page.type('#fullName', 'فحص آلي تكاملي');
        
        // Select anonymous option (No to share name)
        await page.evaluate(() => {
            const radioNo = document.querySelector('input[name="isPublic"][value="no"]');
            if (radioNo) radioNo.click();
        });
        
        // Select specialty: الطب الشرعي (Forensic Medicine)
        await page.select('#specialtySelect', 'الطب الشرعي');
        
        // Input raw score (must be 60-90)
        await page.type('#pointsInput', '72.45');
        
        // Select JU Graduate: Yes (+10 points)
        await page.evaluate(() => {
            const radioYes = document.querySelector('input[name="isJUGraduate"][value="yes"]');
            if (radioYes) radioYes.click();
        });

        // Click submit and check immediate loading indicator state
        logStep("Form Submission Loader", "INFO", "Submitting form, checking button disabled state...");
        const submitBtn = await page.$('#submitBtn');
        await submitBtn.click();
        
        const btnText = await page.evaluate(() => document.getElementById('submitBtn').textContent.trim());
        const isBtnDisabled = await page.evaluate(() => document.getElementById('submitBtn').disabled);
        
        const loaderSuccess = isBtnDisabled && btnText.includes('جاري الإرسال');
        logStep("Submission Loading Indicator", loaderSuccess ? "PASS" : "FAIL", `Button Text: "${btnText}", Disabled: ${isBtnDisabled}`);
        if (!loaderSuccess) allPassed = false;

        // Wait for database sync completion (Success Modal to show)
        logStep("Database Handshake", "INFO", "Waiting for Firebase Realtime Database save transaction...");
        await page.waitForSelector('#successModal.show', { timeout: 15000 });
        const successModalVisible = await page.evaluate(() => document.getElementById('successModal').classList.contains('show'));
        
        logStep("Success Modal Callback", successModalVisible ? "PASS" : "FAIL");
        if (!successModalVisible) allPassed = false;

        // Extract and validate the anonymous UID format
        extractedAnonymousId = await page.evaluate(() => document.getElementById('generatedUid').textContent.trim());
        const isValidFormat = /^[0-9]{4}$/.test(extractedAnonymousId) && !extractedAnonymousId.startsWith('JUH-');
        
        logStep("Secure 4-Char ID Generation", isValidFormat ? "PASS" : "FAIL", `Generated ID: "${extractedAnonymousId}"`);
        if (!isValidFormat) allPassed = false;

        // Close success modal
        await page.click('#closeSuccessBtn');

        // 6. Real-time Reactive Dashboard Sync Test
        logStep("Real-time Reactivity", "INFO", "Filtering table by specialty to verify immediate dashboard sync...");
        await page.select('#specialtyFilter', 'الطب الشرعي');
        
        // Wait a brief moment for rows rendering
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Evaluate the DOM table rows
        const tableRows = await page.evaluate(() => {
            const rows = [];
            const cells = document.querySelectorAll('#tableBody tr');
            cells.forEach(row => {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 3) {
                    rows.push({
                        nameOrId: tds[0].textContent.trim(),
                        specialty: tds[1].textContent.trim(),
                        points: parseFloat(tds[2].textContent.trim()),
                        badge: tds[3].textContent.trim()
                    });
                }
            });
            return rows;
        });

        // Find our entry by points and anonymous ID
        const matchedRow = tableRows.find(r => r.nameOrId === extractedAnonymousId && r.points === 82.45);
        const reactivitySuccess = !!matchedRow;
        
        logStep("Real-time Dashboard Update", reactivitySuccess ? "PASS" : "FAIL", matchedRow ? `Located row: [${matchedRow.nameOrId} | ${matchedRow.specialty} | ${matchedRow.points} | ${matchedRow.badge}]` : "Record not located in live table rendering.");
        if (!reactivitySuccess) allPassed = false;

    } catch (error) {
        logStep("E2E Test Engine", "FAIL", `Script crashed: ${error.message}`);
        allPassed = false;
    } finally {
        if (browser) {
            logStep("Launcher", "INFO", "Closing browser session...");
            await browser.close();
        }

        // 7. Live Database Mock Clean-up & Security Rules Validation
        if (extractedAnonymousId) {
            logStep("Database Cleanup & Security Rules Validation", "INFO", `Validating rules & purging mock test entry "${extractedAnonymousId}"...`);
            try {
                const response = await dbRequest('GET', '/submissions_public.json');
                if (response.statusCode === 200 && response.body) {
                    const keys = Object.keys(response.body);
                    const targetKey = keys.find(k => response.body[k].displayId === extractedAnonymousId);
                    
                    if (targetKey) {
                        testRecordKey = targetKey;
                        
                        // Verification 7.1: Guest Delete Lock (Expect 401/403 rule restriction)
                        logStep("Security Check", "INFO", "Attempting public guest delete (expected to be blocked by write-once rules)...");
                        const delPublicGuest = await dbRequest('DELETE', `/submissions_public/${testRecordKey}.json`);
                        const isGuestBlocked = delPublicGuest.statusCode === 401 || delPublicGuest.statusCode === 403;
                        
                        logStep("Guest Delete Restriction", isGuestBlocked ? "PASS" : "FAIL", `Guest status response: ${delPublicGuest.statusCode} (Expected 401/403)`);
                        if (!isGuestBlocked) allPassed = false;
                        
                        // Verification 7.2: Administrative CLI Purge
                        logStep("Admin CLI Cleanup", "INFO", "Executing administrative command-line delete...");
                        try {
                            execSync(`firebase database:remove -f "/submissions_public/${testRecordKey}" --instance juh-match-dashboard-default-rtdb`, { stdio: 'ignore' });
                            execSync(`firebase database:remove -f "/submissions_private/${testRecordKey}" --instance juh-match-dashboard-default-rtdb`, { stdio: 'ignore' });
                            
                            logStep("Mock Entry Removal", "PASS", `Successfully purged database key: ${testRecordKey}`);
                        } catch (cliErr) {
                            logStep("Mock Entry Removal", "FAIL", `CLI removal failed: ${cliErr.message}`);
                            allPassed = false;
                        }
                    } else {
                        logStep("Mock Entry Removal", "FAIL", "Record key could not be located in database.");
                        allPassed = false;
                    }
                } else {
                    logStep("Mock Entry Removal", "FAIL", `Unable to query records. HTTP Status: ${response.statusCode}`);
                    allPassed = false;
                }
            } catch (e) {
                logStep("Mock Entry Removal", "FAIL", `Cleanup error: ${e.message}`);
                allPassed = false;
            }
        }

        console.log("\n=======================================================");
        if (allPassed) {
            console.log("🏁 \x1b[32mE2E INTEGRATION RESULTS: ALL FRONTEND AND BUTTON TESTS PASSED!\x1b[0m");
            console.log("Live dashboard connections, modal loops, and data reactivity sync successfully.");
        } else {
            console.log("🏁 \x1b[31mE2E INTEGRATION RESULTS: TEST FAILURES ENCOUNTERED!\x1b[0m");
            console.log("Review detailed assertions logs printed above.");
        }
        console.log("=======================================================\n");

        process.exit(allPassed ? 0 : 1);
    }
}

runE2ETests();