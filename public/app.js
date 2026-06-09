import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  projectId: "juh-match-dashboard",
  appId: "1:560492773876:web:49cbeefc8e7592505cb9a1",
  storageBucket: "juh-match-dashboard.firebasestorage.app",
  apiKey: "AIzaSyBmrcr1ZN3yUgbyNvt1imLpo0vp7O8kyYY",
  authDomain: "juh-match-dashboard.firebaseapp.com",
  messagingSenderId: "560492773876",
  databaseURL: "https://juh-match-dashboard-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Specialty Data with Official Seats
const specialtiesWithSeats = {
    "طب وجراحة العيون": 3,
    "جراحة الكلى والمسالك البولية": 3,
    "جراحة العظام والمفاصل": 3,
    "جراحة الأنف والأذن والحنجرة": 1,
    "الجراحة العامة": 11,
    "أمراض النساء والولادة": 5,
    "الأشعة التشخيصية": 4,
    "الطب النووي": 1,
    "الطب الطبيعي والتأهيل": 1,
    "الأمراض الباطنية": 15,
    "الأمراض الجلدية والتناسلية": 2,
    "التخدير والعناية الحثيثة": 15,
    "طب الأطفال": 10,
    "الطب الشرعي": 2,
    "طب المختبرات السريري/الأحياء الدقيقة": 1,
    "علم الأمراض": 1,
    "طب الأسرة": 2,
    "طب الطوارىء والحوادث": 6
};

const specialties = Object.keys(specialtiesWithSeats);

// Specialty AR/EN Translation Dictionary
const specialtyTranslations = {
    "طب وجراحة العيون": "Ophthalmology",
    "جراحة الكلى والمسالك البولية": "Urology",
    "جراحة العظام والمفاصل": "Orthopedic Surgery",
    "جراحة الأنف والأذن والحنجرة": "ENT Surgery",
    "الجراحة العامة": "General Surgery",
    "أمراض النساء والولادة": "OB/GYN",
    "الأشعة التشخيصية": "Diagnostic Radiology",
    "الطب النووي": "Nuclear Medicine",
    "الطب الطبيعي والتأهيل": "Physical Medicine & Rehab",
    "الأمراض الباطنية": "Internal Medicine",
    "الأمراض الجلدية والتناسلية": "Dermatology & Venereology",
    "التخدير والعناية الحثيثة": "Anesthesia & ICU",
    "طب الأطفال": "Pediatrics",
    "الطب الشرعي": "Forensic Medicine",
    "طب المختبرات السريري/الأحياء الدقيقة": "Clinical Pathology & Microbiology",
    "علم الأمراض": "Histopathology",
    "طب الأسرة": "Family Medicine",
    "طب الطوارىء والحوادث": "Emergency Medicine"
};

let allSubmissions = [];
let currentFilter = "all";
let isEn = false;

// DOM Elements
const specialtyFilter = document.getElementById('specialtyFilter');
const specialtySelect = document.getElementById('specialtySelect');
const statsGrid = document.getElementById('statsGrid');
const tableBody = document.getElementById('tableBody');
const formModal = document.getElementById('formModal');
const successModal = document.getElementById('successModal');
const submissionForm = document.getElementById('submissionForm');

// Reassurance Modal DOM Elements
const reassuranceModal = document.getElementById('reassuranceModal');
const reassuranceTitle = document.getElementById('reassuranceTitle');
const reassuranceBody = document.getElementById('reassuranceBody');
const cancelReassuranceBtn = document.getElementById('cancelReassuranceBtn');
const proceedToFormBtn = document.getElementById('proceedToFormBtn');
const closeReassuranceBtn = document.getElementById('closeReassuranceBtn');

const themeToggle = document.getElementById('themeToggle');
const themeToggleIcon = document.getElementById('themeToggleIcon');
const langToggle = document.getElementById('langToggle');

// Theme Switcher Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

initTheme();

// Initialize Dropdowns
function initDropdowns() {
    specialtyFilter.innerHTML = '';
    specialtySelect.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = "all";
    allOpt.textContent = isEn ? "All Specialties" : "جميع التخصصات";
    specialtyFilter.appendChild(allOpt);

    const selectPlaceholder = document.createElement('option');
    selectPlaceholder.value = "";
    selectPlaceholder.textContent = isEn ? "Choose specialty..." : "اختر التخصص...";
    selectPlaceholder.disabled = true;
    selectPlaceholder.selected = true;
    specialtySelect.appendChild(selectPlaceholder);

    specialties.forEach(spec => {
        const specName = isEn ? specialtyTranslations[spec] : spec;
        
        const opt1 = document.createElement('option');
        opt1.value = spec;
        opt1.textContent = specName;
        specialtyFilter.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = spec;
        opt2.textContent = specName;
        specialtySelect.appendChild(opt2);
    });
}
initDropdowns();

// Reassurance modal update helper
function updateReassuranceContent() {
    const t = translations[isEn ? 'en' : 'ar'];
    reassuranceTitle.textContent = t.reassuranceTitle;
    reassuranceBody.innerHTML = t.reassuranceBody;
    cancelReassuranceBtn.textContent = t.cancelReassuranceBtn;
    proceedToFormBtn.textContent = t.proceedToFormBtn;
}

// Modals
document.getElementById('openFormBtn').addEventListener('click', () => {
    updateReassuranceContent();
    reassuranceModal.classList.add('show');
});
closeReassuranceBtn.addEventListener('click', () => reassuranceModal.classList.remove('show'));
cancelReassuranceBtn.addEventListener('click', () => reassuranceModal.classList.remove('show'));
proceedToFormBtn.addEventListener('click', () => {
    reassuranceModal.classList.remove('show');
    formModal.classList.add('show');
});
document.getElementById('closeFormBtn').addEventListener('click', () => formModal.classList.remove('show'));
document.getElementById('closeSuccessBtn').addEventListener('click', () => successModal.classList.remove('show'));
window.addEventListener('click', (e) => {
    if (e.target === reassuranceModal) reassuranceModal.classList.remove('show');
    if (e.target === formModal) formModal.classList.remove('show');
    if (e.target === successModal) successModal.classList.remove('show');
});

// Form Submission
submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = isEn ? 'Submitting...' : 'جاري الإرسال...';

    // Safety check against submissions when locked
    try {
        const settingsSnap = await get(ref(db, 'settings'));
        if (settingsSnap.val()?.isLocked) {
            alert(isEn ? "Submissions are closed. Data filling is completed." : "عذراً، تم الانتهاء من تعبئة البيانات والتسجيل مغلق حالياً.");
            submitBtn.disabled = false;
            submitBtn.textContent = isEn ? 'Submit Points' : 'إرسال البيانات';
            return;
        }
    } catch (err) {
        console.error("Lock check error:", err);
    }
    const name = document.getElementById('fullName').value.trim();
    const isPublic = document.querySelector('input[name="isPublic"]:checked').value === 'yes';
    const specialty = document.getElementById('specialtySelect').value;
    const rawPoints = parseFloat(document.getElementById('pointsInput').value);
    const isJUGraduate = document.querySelector('input[name="isJUGraduate"]:checked')?.value === 'yes';
    const juBonus = isJUGraduate ? 10 : 0;
    const points = rawPoints + juBonus;

    if (rawPoints < 60 || rawPoints > 90) {
        alert(isEn 
            ? "Please enter your final score exactly as shown on the official application website (between 60 and 90), without the University of Jordan graduate bonus."
            : "الرجاء إدخال العلامة النهائية كما تظهر بالضبط في موقع التقديم الرسمي (بين 60 و 90)، بدون علامات خريجي الجامعة الأردنية.");
        submitBtn.disabled = false;
        submitBtn.textContent = isEn ? 'Submit Points' : 'إرسال البيانات';
        return;
    }

    // Generate unique ID if private (exactly 4 numeric digits, e.g. 8301)
    let uid = '';
    const chars = '0123456789';
    for (let i = 0; i < 4; i++) {
        uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const displayId = isPublic ? name : uid;

    const data = {
        name: name,
        isPublic: isPublic,
        displayId: displayId,
        specialty: specialty,
        points: points,
        rawPoints: rawPoints,
        isJUGraduate: isJUGraduate,
        timestamp: Date.now()
    };

    try {
        const publicRef = ref(db, 'submissions_public');
        const newSubmissionRef = push(publicRef);
        await set(newSubmissionRef, data);
        
        const privateRef = ref(db, 'submissions_private/' + newSubmissionRef.key);
        await set(privateRef, { name: name });
        
        // Success
        formModal.classList.remove('show');
        submissionForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = isEn ? 'Submit Points' : 'إرسال البيانات';
        
        if (!isPublic) {
            document.getElementById('uidContainer').style.display = 'block';
            document.getElementById('generatedUid').textContent = uid;
        } else {
            document.getElementById('uidContainer').style.display = 'none';
        }
        successModal.classList.add('show');
        
        // Symmetrically fetch new data immediately to sync local dashboard under Fetch-Once architecture
        fetchSettingsAndData();
        
    } catch (error) {
        console.error("Error adding document: ", error);
        alert(isEn 
            ? "An error occurred while submitting. Please try again."
            : "حدث خطأ أثناء إرسال البيانات. الرجاء المحاولة مرة أخرى.");
        submitBtn.disabled = false;
        submitBtn.textContent = isEn ? 'Submit Points' : 'إرسال البيانات';
    }
});

// Fetch Data Once (Fetch-Once architecture for Spark plan)
async function fetchSubmissions() {
    try {
        const publicRef = ref(db, 'submissions_public');
        const snapshot = await get(publicRef);
        const data = snapshot.val();
        allSubmissions = [];
        if (data) {
            Object.keys(data).forEach(key => {
                allSubmissions.push({ id: key, ...data[key] });
            });
        }
        // Sort descending by points globally and per specialty for rank calculations
        allSubmissions.sort((a, b) => b.points - a.points);
        updateDashboard();
    } catch (error) {
        console.error("Error fetching submissions:", error);
    }
}

// Filter Event
specialtyFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    updateTable();
});

function updateDashboard() {
    updateStats();
    updateTable();
}

// Calculate occupancy and threshold parameters
function getSpecialtyStats(specName) {
    const specSubmissions = allSubmissions.filter(s => s.specialty === specName);
    const seats = specialtiesWithSeats[specName];
    const threshold = Math.ceil(seats * 0.5);
    const count = specSubmissions.length;
    const isAdequate = count >= threshold;

    let max = 0;
    let min = 0;
    
    if (count > 0) {
        // Since allSubmissions is sorted descending, we can easily locate max/min points
        const pointsArray = specSubmissions.map(s => s.points);
        max = Math.max(...pointsArray);
        min = Math.min(...pointsArray);
    }

    return { count, seats, threshold, isAdequate, max, min, submissions: specSubmissions };
}

function updateTable() {
    tableBody.innerHTML = '';
    
    let filtered = [];

    if (currentFilter === 'all') {
        // Master view: Hide submissions from specialties that haven't crossed the 50% threshold
        filtered = allSubmissions.filter(sub => {
            const stats = getSpecialtyStats(sub.specialty);
            return stats.isAdequate;
        });
    } else {
        // Individual specialty selected
        const stats = getSpecialtyStats(currentFilter);
        if (!stats.isAdequate) {
            const reqEntries = stats.threshold;
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem; color: var(--text-muted);">
                ${isEn 
                    ? `Results hidden until at least 50% of seats are filled. Current progress: ${stats.count} / ${reqEntries} required entries.`
                    : `تم إخفاء النتائج مؤقتاً لحين ملء 50% من مقاعد التخصص كحد أدنى. الإدخالات الحالية: ${stats.count} من أصل ${reqEntries} إدخالات مطلوبة.`}
            </td></tr>`;
            return;
        }
        filtered = stats.submissions;
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">${isEn ? "No submissions visible yet" : "لا توجد إدخالات معروضة حالياً"}</td></tr>`;
        return;
    }

    filtered.forEach(sub => {
        // Calculate rank within their specific specialty
        const specSubmissions = allSubmissions.filter(s => s.specialty === sub.specialty);
        // Find index of this sub in the sorted array of its specialty
        const rank = specSubmissions.findIndex(s => s.id === sub.id) + 1;
        const seats = specialtiesWithSeats[sub.specialty];

        const tr = document.createElement('tr');
        const d = new Date(sub.timestamp);
        const timeStr = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        
        // Status Badge Logic (Beautiful glassmorphism matching green dark mode)
        let statusBadge = '';
        if (rank <= seats) {
            statusBadge = `<span class="badge-matched">${isEn ? 'Within Seats' : 'ضمن المقاعد'} #${rank}</span>`;
        } else {
            const waitlistRank = rank - seats;
            statusBadge = `<span class="badge-waitlist">${isEn ? 'Waitlist' : 'قائمة الانتظار'} #${waitlistRank}</span>`;
        }

        const displayName = sub.displayId;
        const highlightClass = !sub.isPublic ? 'style="color: var(--text-muted); font-family: monospace; letter-spacing: 1px;"' : 'style="font-weight: 500;"';
        
        const specDisplayName = isEn ? specialtyTranslations[sub.specialty] : sub.specialty;

        tr.innerHTML = `
            <td ${highlightClass}>${displayName}</td>
            <td>${specDisplayName}</td>
            <td style="color: var(--primary); font-weight: 700;">${sub.points.toFixed(2)}${sub.isJUGraduate && sub.rawPoints != null ? ' <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400;">(' + sub.rawPoints.toFixed(2) + ' + 10)</span>' : ''}</td>
            <td>${statusBadge}</td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${timeStr}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateStats() {
    statsGrid.innerHTML = '';
    
    // Sort all specialties by number of submissions descending
    const sortedSpecs = specialties.sort((a, b) => {
        const statsA = getSpecialtyStats(a);
        const statsB = getSpecialtyStats(b);
        return statsB.count - statsA.count;
    });

    sortedSpecs.forEach(spec => {
        const s = getSpecialtyStats(spec);
        if (s.count === 0) return; // Only show specialties that have at least 1 submission

        const card = document.createElement('div');
        card.className = 'stat-card';

        const specDisplayName = isEn ? specialtyTranslations[spec] : spec;
        const fillPercentage = Math.min(100, (s.count / s.seats) * 100);

        let bodyContent = '';
        if (s.isAdequate) {
            // Crossed 50%: Show live stats
            bodyContent = `
                <div class="stat-row">
                    <span style="color: var(--text-muted);">${isEn ? 'Highest Point:' : 'أعلى علامة:'}</span>
                    <span class="stat-val" style="color: var(--success);">${s.max.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span style="color: var(--text-muted);">${isEn ? 'Lowest Point:' : 'أقل علامة:'}</span>
                    <span class="stat-val" style="color: var(--danger);">${s.min.toFixed(2)}</span>
                </div>
            `;
        } else {
            // Below 50%: Hide max/min and show a friendly note
            const reqEntries = s.threshold;
            bodyContent = `
                <div class="stat-waiting-message">
                    ${isEn 
                        ? `Stats locked. Needs ${reqEntries - s.count} more entries to unlock.`
                        : `الإحصائيات مغلقة. يتبقى ${reqEntries - s.count} إدخالات للعرض.`}
                </div>
            `;
        }

        card.innerHTML = `
            <h3>
                <span>${specDisplayName}</span>
                <span class="stat-seats-badge">${s.count}/${s.seats} ${isEn ? 'Seats' : 'مقاعد'}</span>
            </h3>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${fillPercentage}%"></div>
            </div>
            ${bodyContent}
        `;
        statsGrid.appendChild(card);
    });

    if (statsGrid.children.length === 0) {
        statsGrid.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">${isEn ? 'Awaiting first submission...' : 'في انتظار أول إدخال للبيانات...'}</p>`;
    }
}

// Translations Dictionary
const translations = {
    ar: {
        reassuranceTitle: "تعهد الخصوصية وموثوقية البيانات",
        reassuranceBody: `
            <p>زميلنا الطبيب الكريم، نحن نفهم تماماً حساسية مشاركة العلامات والنقاط التنافسية. لذلك تم تصميم هذه المنصة مع مراعاة قصوى لخصوصيتك وسرية بياناتك:</p>
            <ul>
                <li><strong>الأسماء سرية تماماً:</strong> اسمك لن يظهر أبداً للعامة إذا اخترت خيار (لا) عند تعبئة النموذج. سيتم استبدال اسمك تلقائياً برمز عشوائي آمن من 4 خانات (مثل <code>XXXX</code>).</li>
                <li><strong>منع الإدخالات الوهمية:</strong> الاسم مطلوب لغرض واحد فقط وهو التحقق ومطابقة اسمك مع قائمة القبول الرسمية لمستشفى الجامعة الأردنية لمنع التلاعب وتخريب البيانات.</li>
                <li><strong>صلاحيات محدودة جداً:</strong> الاسم الحقيقي لا يظهر إلا للآدمن فقط (منسق المنصة) لغايات التحقق والتأكيد، ولن يتم مشاركته أو استخدامه لأي غرض آخر مطلقاً.</li>
            </ul>
            <p style="font-weight: 500; color: var(--primary);">مشاركتك الصادقة تساهم في رسم صورة دقيقة وواضحة لفرص الجميع.</p>
        `,
        cancelReassuranceBtn: "إلغاء",
        proceedToFormBtn: "فهمت، الانتقال لتعبئة البيانات",
        disclaimer: "تنويه هام: هذه منصة تعاونية تطوعية غير رسمية أعدّها أطباء الامتياز وليست تابعة رسمياً لمستشفى الجامعة الأردنية. تعتمد مصداقية النتائج كلياً على أمانة المشاركين ومشاركتهم الفعالة.",
        mainTitle: "قاعدة بيانات تنسيق أطباء الإقامة - مستشفى الجامعة الأردنية",
        mainSubtitle: "مبادرة تعاونية غير رسمية لتنظيم وترتيب نقاط الأطباء المقبولين رسمياً للعام الدراسي 2026. يتم مطابقة وتدقيق الأسماء المدخلة مع القوائم الرسمية للجامعة لضمان دقة البيانات ومنع الإدخالات غير المصرح بها.",
        openFormBtn: "مشاركة نقاطي التنافسية",
        statsTitle: "إحصائيات التخصصات الإجمالية",
        tableTitle: "جميع الإدخالات",
        thName: "الاسم / الرمز",
        thSpecialty: "التخصص",
        thPoints: "النقاط",
        thStatus: "الحالة",
        thTime: "وقت الإدخال",
        lblExportCsv: "تصدير إلى CSV",
        lblRefresh: "تحديث البيانات",
        modalTitle: "إدخال بيانات القبول",
        modalDesc: "هذا النموذج مخصص حصرياً للأطباء المقبولين رسمياً في برنامج الإقامة. يرجى كتابة الاسم الثلاثي باللغة العربية مطابقاً للقوائم الرسمية للتحقق ومطابقة البيانات مع قائمة القبول الصادرة عن مستشفى الجامعة الأردنية ومنع الإدخالات غير المصرح بها. لن يتم نشر الاسم للعامة في حال اخترت \"لا\".",
        lblFullName: "الاسم الثلاثي (بالعربية)",
        lblShareName: "هل ترغب بمشاركة اسمك للعامة؟",
        lblYes: "نعم",
        lblNo: "لا",
        lblSpecialty: "التخصص المقبول فيه",
        lblPointsInput: "العلامة النهائية (كما تظهر في موقع التقديم)",
        lblPointsNote: "أدخل العلامة النهائية كما تظهر بالضبط في موقع التقديم الرسمي (بدون علامات خريجي الجامعة الأردنية).",
        lblJUGraduate: "هل أنت خريج الجامعة الأردنية (بكالوريوس)؟",
        lblJUYes2: "نعم (+10 نقاط)",
        lblJUNo2: "لا",
        lblJUNote: "حسب ما أعلنت الجامعة: \"أن العلامات العشر (10) المخصصة لخريجي درجة البكالوريوس من الجامعة الأردنية لا تظهر ضمن المجموع النهائي في طلب التقديم، وتم احتسابها وإضافتها عند إجراء المفاضلة النهائية بين المتقدمين.\"",
        submitBtn: "إرسال البيانات",
        successTitle: "تم بنجاح!",
        successDesc: "شكراً لمشاركتك. لقد تم حفظ بياناتك بنجاح.",
        uidInstruction: "الرجاء تصوير الشاشة (Screenshot) للاحتفاظ برمزك الخاص:",
        closeSuccessBtn: "إغلاق"
    },
    en: {
        reassuranceTitle: "Privacy Commitment & Data Integrity",
        reassuranceBody: `
            <p>Dear Colleague, we fully understand the sensitivity around sharing competitive scores. Therefore, this platform has been engineered with your privacy as our absolute priority:</p>
            <ul>
                <li><strong>Strictly Confidential:</strong> Your real name will never be displayed publicly if you choose 'No'. It will be replaced automatically by a secure random 4-character ID (e.g., <code>XXXX</code>).</li>
                <li><strong>Anti-Trolling Verification:</strong> We only request your full name to verify it against the official Jordan University Hospital accepted list. This ensures data authenticity and prevents fake entries.</li>
                <li><strong>Restricted Admin View:</strong> Real names are only visible to the dashboard administrator solely for verification purposes, and will never be shared or used for any other reason.</li>
            </ul>
            <p style="font-weight: 500; color: var(--primary);">Your authentic contribution helps create a clear and transparent coordination map for everyone.</p>
        `,
        cancelReassuranceBtn: "Cancel",
        proceedToFormBtn: "I understand, proceed to form",
        disclaimer: "Important Notice: This is an unofficial, voluntary collaborative database organized by interns and is not affiliated with Jordan University Hospital. Credibility depends entirely on active and honest participant contributions.",
        mainTitle: "Residency Coordination Platform - Jordan University Hospital",
        mainSubtitle: "An unofficial collaborative database to organize and rank competitive points strictly for officially accepted residency physicians (2026). Entered names are verified against official university lists to ensure data integrity and prevent unauthorized entries.",
        openFormBtn: "Contribute Competitive Points",
        statsTitle: "Overall Specialty Statistics",
        tableTitle: "All Submissions",
        thName: "Name / ID",
        thSpecialty: "Specialty",
        thPoints: "Points",
        thStatus: "Status",
        thTime: "Entry Time",
        lblExportCsv: "Export to CSV",
        lblRefresh: "Refresh Data",
        modalTitle: "Submit Matching Data",
        modalDesc: "This form is strictly for officially accepted residency candidates. Please enter your full name in Arabic exactly as it appears in the official lists for verification against the Jordan University Hospital admission list to prevent unauthorized entries. Your name will not be published if you select 'No'.",
        lblFullName: "Full Name (Arabic)",
        lblShareName: "Do you want to publish your name?",
        lblYes: "Yes",
        lblNo: "No",
        lblSpecialty: "Accepted Specialty",
        lblPointsInput: "Final Score (as shown on the official application website)",
        lblPointsNote: "Enter your final score exactly as it appears on the official application website (without University of Jordan graduate bonus).",
        lblJUGraduate: "Are you a University of Jordan graduate (Bachelor's)?",
        lblJUYes2: "Yes (+10 points)",
        lblJUNo2: "No",
        lblJUNote: "As the university announced: \"The ten (10) marks allocated for University of Jordan bachelor's graduates do not appear in the final total on the application, but were calculated and added during the final selection process among applicants.\"",
        submitBtn: "Submit Points",
        successTitle: "Success!",
        successDesc: "Thank you for sharing. Your data has been saved successfully.",
        uidInstruction: "Please screenshot this box to keep your private code:",
        closeSuccessBtn: "Close"
    }
};

// Robust Bilingual Toggle Engine
langToggle.addEventListener('click', () => {
    isEn = !isEn;
    document.documentElement.dir = isEn ? 'ltr' : 'rtl';
    langToggle.textContent = isEn ? 'العربية' : 'English';

    const t = translations[isEn ? 'en' : 'ar'];

    // disclaimer text
    document.getElementById('disclaimerText').textContent = t.disclaimer;
    document.getElementById('mainTitle').textContent = t.mainTitle;
    document.getElementById('mainSubtitle').textContent = t.mainSubtitle;
    if (isSystemLocked) {
        document.getElementById('openFormBtn').textContent = isEn ? "Submissions Closed (Filling Completed)" : "التسجيل مغلق (تم الانتهاء من التعبئة)";
    } else {
        document.getElementById('openFormBtn').textContent = t.openFormBtn;
    }
    document.getElementById('statsTitle').textContent = t.statsTitle;
    document.getElementById('tableTitle').textContent = t.tableTitle;
    document.getElementById('thName').textContent = t.thName;
    document.getElementById('thSpecialty').textContent = t.thSpecialty;
    document.getElementById('thPoints').textContent = t.thPoints;
    document.getElementById('thStatus').textContent = t.thStatus;
    document.getElementById('thTime').textContent = t.thTime;
    document.getElementById('lblExportCsv').textContent = t.lblExportCsv;
    document.getElementById('lblRefresh').textContent = t.lblRefresh;

    // Form inputs and labels
    document.getElementById('modalTitle').textContent = t.modalTitle;
    document.getElementById('modalDesc').textContent = t.modalDesc;
    document.getElementById('lblFullName').textContent = t.lblFullName;
    document.getElementById('lblShareName').textContent = t.lblShareName;
    document.getElementById('lblYes').textContent = t.lblYes;
    document.getElementById('lblNo').textContent = t.lblNo;
    document.getElementById('lblSpecialty').textContent = t.lblSpecialty;
    document.getElementById('lblPointsInput').textContent = t.lblPointsInput;
    document.getElementById('lblPointsNote').textContent = t.lblPointsNote;
    document.getElementById('lblJUGraduate').textContent = t.lblJUGraduate;
    document.getElementById('lblJUYes2').textContent = t.lblJUYes2;
    document.getElementById('lblJUNo2').textContent = t.lblJUNo2;
    document.getElementById('lblJUNote').textContent = t.lblJUNote;
    document.getElementById('submitBtn').textContent = t.submitBtn;

    // Success Modal
    document.getElementById('successTitle').textContent = t.successTitle;
    document.getElementById('successDesc').textContent = t.successDesc;
    document.getElementById('uidInstruction').textContent = t.uidInstruction;
    document.getElementById('closeSuccessBtn').textContent = t.closeSuccessBtn;

    // Reinitialize Dropdowns and tables
    initDropdowns();
    updateDashboard();
    updateReassuranceContent();
});

// Fetch both Settings and Submissions securely once
let isSystemLocked = false;
let isFetching = false;

async function fetchSettingsAndData() {
    if (isFetching) return;
    isFetching = true;
    
    // Toggle loader visual state on refresh button
    const refreshBtn = document.getElementById('refreshDataBtn');
    const refreshLbl = document.getElementById('lblRefresh');
    if (refreshBtn && refreshLbl) {
        refreshBtn.disabled = true;
        refreshLbl.textContent = isEn ? "Updating..." : "جاري التحديث...";
    }

    try {
        // 1. Fetch Settings
        const settingsSnap = await get(ref(db, 'settings'));
        const settings = settingsSnap.val() || {};
        isSystemLocked = !!settings.isLocked;

        // 2. Fetch Submissions
        await fetchSubmissions();
        
        const openFormBtn = document.getElementById('openFormBtn');
        if (openFormBtn) {
            if (isSystemLocked) {
                openFormBtn.disabled = true;
                openFormBtn.textContent = isEn ? "Submissions Closed (Filling Completed)" : "التسجيل مغلق (تم الانتهاء من التعبئة)";
                openFormBtn.style.opacity = "0.6";
                openFormBtn.style.cursor = "not-allowed";
            } else {
                openFormBtn.disabled = false;
                openFormBtn.textContent = isEn ? "Contribute Competitive Points" : "مشاركة نقاطي التنافسية";
                openFormBtn.style.opacity = "1";
                openFormBtn.style.cursor = "pointer";
            }
        }

    } catch (error) {
        console.error("Error loading settings or data:", error);
    } finally {
        isFetching = false;
        if (refreshBtn && refreshLbl) {
            refreshBtn.disabled = false;
            const t = translations[isEn ? 'en' : 'ar'];
            refreshLbl.textContent = t.lblRefresh;
        }
    }
}

// Initial Fetch
fetchSettingsAndData();

// Silent auto-refresh polling every 60 seconds
// (increased from 30s to reduce connection churn under Spark plan limits)
setInterval(fetchSettingsAndData, 60000);

// Manual Refresh event listener
const refreshDataBtn = document.getElementById('refreshDataBtn');
if (refreshDataBtn) {
    refreshDataBtn.addEventListener('click', fetchSettingsAndData);
}

// CSV Export Logic
function exportPublicCsv() {
    let filtered = [];
    if (currentFilter === 'all') {
        // Master view: Hide submissions from specialties that haven't crossed the 50% threshold
        filtered = allSubmissions.filter(sub => {
            const stats = getSpecialtyStats(sub.specialty);
            return stats.isAdequate;
        });
    } else {
        // Individual specialty selected
        const stats = getSpecialtyStats(currentFilter);
        if (!stats.isAdequate) {
            alert(isEn 
                ? "Cannot export data for this specialty as it is locked (under 50% occupancy)."
                : "لا يمكن تصدير بيانات هذا التخصص لأنه مغلق حالياً (أقل من 50% تعبئة).");
            return;
        }
        filtered = stats.submissions;
    }

    if (filtered.length === 0) {
        alert(isEn ? "No visible submissions to export." : "لا توجد إدخالات معروضة للتصدير.");
        return;
    }

    // Build CSV contents
    const headers = isEn 
        ? ["Name / ID", "Specialty", "Points", "Status", "Entry Time"]
        : ["الاسم / الرمز", "التخصص", "النقاط", "الحالة", "وقت الإدخال"];

    const rows = [headers];

    filtered.forEach(sub => {
        // Calculate rank within their specific specialty
        const specSubmissions = allSubmissions.filter(s => s.specialty === sub.specialty);
        const rank = specSubmissions.findIndex(s => s.id === sub.id) + 1;
        const seats = specialtiesWithSeats[sub.specialty];
        
        let statusStr = '';
        if (rank <= seats) {
            statusStr = isEn ? `Within Seats #${rank}` : `ضمن المقاعد #${rank}`;
        } else {
            const waitlistRank = rank - seats;
            statusStr = isEn ? `Waitlist #${waitlistRank}` : `قائمة الانتظار #${waitlistRank}`;
        }

        const displayName = sub.displayId;
        const specDisplayName = isEn ? specialtyTranslations[sub.specialty] : sub.specialty;
        const d = new Date(sub.timestamp);
        const timeStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;

        // Escape double quotes in CSV values to avoid formatting issues
        const cleanName = `"${String(displayName || '').replace(/"/g, '""')}"`;
        const cleanSpec = `"${String(specDisplayName || '').replace(/"/g, '""')}"`;
        const cleanPoints = typeof sub.points === 'number' ? sub.points.toFixed(2) : parseFloat(sub.points || 0).toFixed(2);
        const cleanStatus = `"${String(statusStr || '').replace(/"/g, '""')}"`;
        const cleanTime = `"${String(timeStr || '').replace(/"/g, '""')}"`;

        rows.push([cleanName, cleanSpec, cleanPoints, cleanStatus, cleanTime]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    
    // Create Blob with UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const timestampStr = new Date().toISOString().slice(0,10);
    const filename = `juh_residency_public_${currentFilter}_${timestampStr}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const exportPublicCsvBtn = document.getElementById('exportPublicCsvBtn');
if (exportPublicCsvBtn) {
    exportPublicCsvBtn.addEventListener('click', exportPublicCsv);
}
