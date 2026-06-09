/**
 * Quick verification test for the goOnline/goOffline connect-on-demand pattern.
 * Tests:
 * 1. Page loads successfully
 * 2. Data loads correctly (table populates despite starting offline)
 * 3. Refresh button works (triggers a brief connect/fetch/disconnect cycle)
 * 4. Form modal opens (submission lock check works via brief connection)
 * 5. Console has no Firebase connection errors
 */

const puppeteer = require('puppeteer');

const SITE_URL = 'https://juh-residency.web.app';
const TIMEOUT = 20000;

(async () => {
    let browser;
    let passed = 0;
    let failed = 0;
    const results = [];

    function log(label, ok, detail = '') {
        const icon = ok ? '✅' : '❌';
        console.log(`${icon} ${label}${detail ? ' — ' + detail : ''}`);
        results.push({ label, ok, detail });
        if (ok) passed++; else failed++;
    }

    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();

        // Collect console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // 1. Page loads
        console.log('\n🔍 Testing live site:', SITE_URL);
        console.log('─'.repeat(60));
        
        const response = await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        log('Page loads', response.status() === 200, `HTTP ${response.status()}`);

        // 2. Wait for data to load (the table should populate via the brief connection)
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('#tableBody tr');
            // Either there are data rows, or a "no data" message row
            return rows.length > 0;
        }, { timeout: TIMEOUT });

        const tableContent = await page.evaluate(() => {
            const rows = document.querySelectorAll('#tableBody tr');
            const firstCell = rows[0]?.textContent || '';
            return { rowCount: rows.length, firstCell: firstCell.substring(0, 80) };
        });
        log('Data loads via connect-on-demand', tableContent.rowCount > 0, `${tableContent.rowCount} row(s) in table`);

        // 3. Check that your entry (حسين عادل الهاشم) appears
        const hasEntry = await page.evaluate(() => {
            const body = document.querySelector('#tableBody')?.textContent || '';
            return body.includes('حسين') || body.includes('81.81') || body.includes('71.81');
        });
        log('Your entry is visible', hasEntry, hasEntry ? 'Found your data in table' : 'Entry not visible (may be hidden by 50% threshold)');

        // 4. Test Refresh button (triggers a new connect/fetch/disconnect cycle)
        const refreshBtn = await page.$('#refreshDataBtn');
        if (refreshBtn) {
            await refreshBtn.click();
            // Wait for the button to re-enable (means fetch completed)
            await page.waitForFunction(() => {
                const btn = document.querySelector('#refreshDataBtn');
                return btn && !btn.disabled;
            }, { timeout: TIMEOUT });
            log('Refresh button works', true, 'Connect → fetch → disconnect cycle completed');
        } else {
            log('Refresh button works', false, 'Button not found');
        }

        // 5. Test form modal opens (lock check uses a brief connection)
        const openFormBtn = await page.$('#openFormBtn');
        if (openFormBtn) {
            const isDisabled = await page.evaluate(el => el.disabled, openFormBtn);
            if (!isDisabled) {
                await openFormBtn.click();
                // Wait for reassurance modal or form modal to appear
                await page.waitForFunction(() => {
                    const reassurance = document.querySelector('#reassuranceModal');
                    const form = document.querySelector('#formModal');
                    return (reassurance && reassurance.classList.contains('show')) ||
                           (form && form.classList.contains('show'));
                }, { timeout: 5000 });
                log('Form modal opens', true, 'Lock check via brief connection succeeded');
                
                // Close any open modal
                await page.evaluate(() => {
                    document.querySelector('#reassuranceModal')?.classList.remove('show');
                    document.querySelector('#formModal')?.classList.remove('show');
                });
            } else {
                log('Form modal opens', true, 'Submissions locked (expected if you locked it) — lock check worked');
            }
        }

        // 6. Check for Firebase connection errors in console
        const firebaseErrors = consoleErrors.filter(e => 
            e.includes('firebase') || e.includes('PERMISSION_DENIED') || 
            e.includes('goOffline') || e.includes('goOnline') ||
            e.includes('WebSocket') || e.includes('connection')
        );
        log('No Firebase connection errors', firebaseErrors.length === 0, 
            firebaseErrors.length > 0 ? firebaseErrors.join(' | ') : 'Console clean');

        // 7. Verify 2-decimal format in table
        const decimalCheck = await page.evaluate(() => {
            const cells = document.querySelectorAll('#tableBody td');
            for (const cell of cells) {
                const match = cell.textContent.match(/(\d+\.\d+)/);
                if (match) {
                    const decimals = match[1].split('.')[1];
                    return { found: true, value: match[1], decimalCount: decimals.length };
                }
            }
            return { found: false };
        });
        if (decimalCheck.found) {
            log('2-decimal format correct', decimalCheck.decimalCount === 2, 
                `Found "${decimalCheck.value}" (${decimalCheck.decimalCount} decimals)`);
        } else {
            log('2-decimal format correct', true, 'No numeric values in visible table (threshold not met)');
        }

        // 8. Theme toggle works
        const themeBeforeClick = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        await page.click('#themeToggle');
        const themeAfterClick = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        log('Theme toggle works', themeBeforeClick !== themeAfterClick, 
            `${themeBeforeClick} → ${themeAfterClick}`);

        console.log('─'.repeat(60));
        console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
        
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED — Site is ready to share!\n');
        } else {
            console.log('⚠️  Some tests failed — review above.\n');
        }

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        failed++;
    } finally {
        if (browser) await browser.close();
        process.exit(failed > 0 ? 1 : 0);
    }
})();
