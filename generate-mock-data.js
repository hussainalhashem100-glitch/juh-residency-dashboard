const https = require('https');
const fs = require('fs');

const DB_URL = "https://juh-match-dashboard-default-rtdb.europe-west1.firebasedatabase.app";

const specialties = [
    { name: "طب وجراحة العيون", seats: 3 },
    { name: "جراحة الكلى والمسالك البولية", seats: 3 },
    { name: "جراحة العظام والمفاصل", seats: 3 },
    { name: "جراحة الأنف والأذن والحنجرة", seats: 1 },
    { name: "الجراحة العامة", seats: 11 },
    { name: "أمراض النساء والولادة", seats: 5 },
    { name: "الأشعة التشخيصية", seats: 4 },
    { name: "الطب النووي", seats: 1 },
    { name: "الطب الطبيعي والتأهيل", seats: 1 },
    { name: "الأمراض الباطنية", seats: 15 },
    { name: "الأمراض الجلدية والتناسلية", seats: 2 },
    { name: "التخدير والعناية الحثيثة", seats: 15 },
    { name: "طب الأطفال", seats: 10 },
    { name: "الطب الشرعي", seats: 2 },
    { name: "طب المختبرات السريري/الأحياء الدقيقة", seats: 1 },
    { name: "علم الأمراض", seats: 1 },
    { name: "طب الأسرة", seats: 2 },
    { name: "طب الطوارىء والحوادث", seats: 6 }
];

const mockNames = [
    "محمد أحمد الحسين", "سارة محمود علي", "عبد الله عمر الخطيب", "رانية حسن المصري",
    "يزن خالد الزعبي", "فاطمة يوسف حداد", "أحمد إبراهيم عبيدات", "منى عبد الرحمن القضاة",
    "عادل فيصل التميمي", "دينا سامي النابلسي", "عمر سليمان الشريف", "لينا عادل مسعد",
    "خليل إبراهيم الكردي", "حلا ماجد غانم", "طارق زياد الكيالي", "نور هشام جابر",
    "محمود سعيد عبد الهادي", "شذى سمير حوراني", "ياسين توفيق البستنجي", "أمل عدنان عساف",
    "حسين طلال الهاشم", "روان فوزي الدجاني", "ماجد عبد المجيد الحوراني", "هديل باسم التل",
    "فيصل منذر الرشيد", "ميساء جمال الكردي", "بلال رشاد الصبيح", "رشا نضال بدران",
    "إيهاب كمال الحلبي", "إيمان وجيه السعيد", "سامر عدلي العمد", "خلود محمد البخيت",
    "باسل سليم حداد", "نادية شريف بركات", "هاني جميل القاسم", "صفاء كمال الشلبي",
    "رائد وليد طوقان", "منى عاطف الزعبي", "أنس نبيل المصري", "هبة مفيد قطيشات",
    "عصام مازن غرايبة", "لجين سمير طاشمان", "بهاء أديب العتوم", "تغريد شريف حداد",
    "مأمون زياد الشبول", "ربى فايز النمري", "مؤيد كمال القضاة", "نغم عماد الفايز",
    "سامية منير التل", "أمجد زهير المصري"
];

function makeRequest(method, path, body) {
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
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data ? JSON.parse(data) : null);
                } else {
                    reject(new Error(`Status: ${res.statusCode}, Body: ${data}`));
                }
            });
        });
        req.on('error', (err) => reject(err));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function generateNumericUid() {
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

async function generate() {
    console.log("Generating 50 high-fidelity mock candidate entries...");
    const keys = [];

    for (let i = 0; i < 50; i++) {
        // Distribute specialties unevenly to showcase different threshold levels
        let specIndex;
        if (i < 4) {
            // Ophthalmology (seats: 3) - 4 entries (133% occupancy -> unlocked)
            specIndex = specialties.findIndex(s => s.name === "طب وجراحة العيون");
        } else if (i < 6) {
            // Family Medicine (seats: 2) - 2 entries (100% occupancy -> unlocked)
            specIndex = specialties.findIndex(s => s.name === "طب الأسرة");
        } else if (i < 12) {
            // Pediatrics (seats: 10) - 6 entries (60% occupancy -> unlocked)
            specIndex = specialties.findIndex(s => s.name === "طب الأطفال");
        } else if (i < 17) {
            // General Surgery (seats: 11) - 5 entries (45% occupancy -> LOCKED, progress bar)
            specIndex = specialties.findIndex(s => s.name === "الجراحة العامة");
        } else if (i < 20) {
            // Internal Medicine (seats: 15) - 3 entries (20% occupancy -> LOCKED, progress bar)
            specIndex = specialties.findIndex(s => s.name === "الأمراض الباطنية");
        } else {
            // Distribute randomly across others
            specIndex = Math.floor(Math.random() * specialties.length);
        }

        const specialtyObj = specialties[specIndex];
        const isPublic = Math.random() >= 0.4; // 60% public, 40% private
        const name = mockNames[i];
        
        const displayId = isPublic ? name : generateNumericUid();
        const points = parseFloat((75 + Math.random() * 23).toFixed(3)); // realistic points 75 - 98
        const timestamp = Date.now() - (50 - i) * 60000; // staggered in time

        const key = `mock_candidate_${i}_${Math.floor(Math.random() * 100000)}`;
        
        const publicRecord = {
            displayId: displayId,
            isPublic: isPublic,
            points: points,
            specialty: specialtyObj.name,
            timestamp: timestamp
        };

        const privateRecord = {
            name: name,
            email: `mock_${i}@juh-residency.edu`,
            timestamp: timestamp
        };

        try {
            // Write new records (PUT is allowed for non-existent IDs under !data.exists())
            await makeRequest('PUT', `/submissions_public/${key}.json`, publicRecord);
            await makeRequest('PUT', `/submissions_private/${key}.json`, privateRecord);
            keys.push(key);
            console.log(`[${i+1}/50] Created entry: ${isPublic ? 'Public' : 'Private (' + displayId + ')'} | ${specialtyObj.name} | ${points} points`);
        } catch (err) {
            console.error(`[${i+1}/50] Failed to write entry: ${err.message}`);
        }
    }

    // Save generated keys to mock-ids.json
    fs.writeFileSync('mock-ids.json', JSON.stringify(keys, null, 4));
    console.log("\nMock data generation finished!");
    console.log("Keys saved to 'mock-ids.json' for easy bulk cleanup later.");
}

generate();
