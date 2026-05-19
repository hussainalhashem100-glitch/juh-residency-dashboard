const fs = require('fs');
const { execSync } = require('child_process');

async function clean() {
    if (!fs.existsSync('mock-ids.json')) {
        console.log("No mock-ids.json file found! Already cleaned up?");
        return;
    }

    const keys = JSON.parse(fs.readFileSync('mock-ids.json', 'utf8'));
    console.log(`Compiling bulk purge payload for ${keys.length} candidates...`);

    // Build a single deep patch payload to delete all keys at once
    const patchPayload = {};
    keys.forEach(k => {
        patchPayload[`submissions_public/${k}`] = null;
        patchPayload[`submissions_private/${k}`] = null;
    });

    // Write temporary update payload file
    const payloadFile = 'bulk-delete-payload.json';
    fs.writeFileSync(payloadFile, JSON.stringify(patchPayload, null, 4));

    console.log("Executing bulk deletion transaction on Europe-West1 database...");
    try {
        execSync(`firebase database:update "/" ${payloadFile} -y --instance juh-match-dashboard-default-rtdb`, { stdio: 'inherit' });
        console.log("Database transaction succeeded! Mock records successfully deleted.");
        
        // Clean up helper files
        try { fs.unlinkSync(payloadFile); } catch (e) {}
        try { fs.unlinkSync('mock-ids.json'); } catch (e) {}
        try { fs.unlinkSync('generate-mock-data.js'); } catch (e) {}
        console.log("Local scripts and key caches deleted successfully.");
    } catch (e) {
        console.error("Bulk deletion failed:", e.message);
    }
}

clean();
