import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    projectId: "juh-match-dashboard",
    appId: "1:560492773876:web:49cbeefc8e7592505cb9a1",
    storageBucket: "juh-match-dashboard.firebasestorage.app",
    apiKey: "AIzaSyBmrcr1ZN3yUgbyNvt1imLpo0vp7O8kyYY",
    authDomain: "juh-match-dashboard.firebaseapp.com",
    messagingSenderId: "560492773876",
    databaseURL: "https://juh-match-dashboard-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// Specialties and Seats Map for Ranks
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

const loginSection = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminTableBody = document.getElementById('adminTableBody');
const totalCount = document.getElementById('totalCount');

const themeToggle = document.getElementById('themeToggle');
const themeToggleIcon = document.getElementById('themeToggleIcon');

let publicData = {};
let privateData = {};

// Theme Switcher Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggleIcon) themeToggleIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (themeToggleIcon) themeToggleIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

initTheme();

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email !== 'hussainalhashem99@gmail.com') {
            alert("غير مصرح: هذا الحساب ليس حساب المسؤول.");
            signOut(auth);
            return;
        }
        // Logged in
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        fetchData();
    } else {
        // Logged out
        loginSection.style.display = 'block';
        adminDashboard.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminTableBody.innerHTML = '';
        totalCount.textContent = '0';
    }
});

// Login
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error(error);
        alert("فشل تسجيل الدخول: " + error.message);
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Fetch Data
function fetchData() {
    const publicRef = ref(db, 'submissions_public');
    const privateRef = ref(db, 'submissions_private');

    onValue(publicRef, (snapshot) => {
        publicData = snapshot.val() || {};
        renderTable();
    }, (error) => {
        alert("Error fetching public data (Are you authorized?): " + error.message);
    });

    onValue(privateRef, (snapshot) => {
        privateData = snapshot.val() || {};
        renderTable();
    }, (error) => {
        alert("Error fetching private data (Are you authorized?): " + error.message);
    });
}

function renderTable() {
    adminTableBody.innerHTML = '';
    const keys = Object.keys(publicData);
    totalCount.textContent = keys.length;

    if (keys.length === 0) {
        adminTableBody.innerHTML = '<tr><td colspan="8" class="text-center">لا توجد إدخالات.</td></tr>';
        return;
    }

    // Convert to array to sort
    const arr = keys.map(k => {
        return { id: k, ...publicData[k] };
    });
    
    // Sort descending by points
    arr.sort((a, b) => b.points - a.points);

    arr.forEach(sub => {
        const realName = privateData[sub.id]?.name || "غير متوفر";
        
        // Calculate rank within specialty (admins see all immediately, bypassing 50% threshold)
        const specSubmissions = arr.filter(s => s.specialty === sub.specialty);
        const rank = specSubmissions.findIndex(s => s.id === sub.id) + 1;
        const seats = specialtiesWithSeats[sub.specialty] || 1;
        
        let statusBadge = '';
        if (rank <= seats) {
            statusBadge = `<span class="badge-matched" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">ضمن المقاعد #${rank}</span>`;
        } else {
            statusBadge = `<span class="badge-waitlist" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">انتظار #${rank - seats}</span>`;
        }

        const tr = document.createElement('tr');
        const d = new Date(sub.timestamp);
        const timeStr = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        
        tr.innerHTML = `
            <td style="font-weight: 700;">${realName}</td>
            <td>${sub.displayId}</td>
            <td>${sub.isPublic ? '<span style="color:var(--success);">عام</span>' : '<span style="color:var(--danger);">خاص</span>'}</td>
            <td>${sub.specialty}</td>
            <td style="font-weight:bold; color:var(--primary);">${sub.points.toFixed(2)}${sub.isJUGraduate && sub.rawPoints != null ? ' <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(' + sub.rawPoints.toFixed(2) + ' + 10)</span>' : ''}</td>
            <td>${statusBadge}</td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${timeStr}</td>
            <td>
                <button class="btn-secondary edit-btn" data-id="${sub.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-inline-end: 0.5rem; background: var(--primary); color: white; border: none;">تعديل</button>
                <button class="btn-danger delete-btn" data-id="${sub.id}">حذف</button>
            </td>
        `;
        adminTableBody.appendChild(tr);
    });

    // Attach edit listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const sub = publicData[id];
            const realName = privateData[id]?.name || "";
            
            document.getElementById('editCandidateId').value = id;
            document.getElementById('editFullName').value = realName;
            document.getElementById('editPoints').value = sub.points;
            
            document.getElementById('editModal').classList.add('show');
        });
    });

    // Attach delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('هل أنت متأكد من حذف هذا الإدخال؟')) {
                try {
                    await remove(ref(db, 'submissions_public/' + id));
                    await remove(ref(db, 'submissions_private/' + id));
                } catch(error) {
                    alert("خطأ في الحذف: " + error.message);
                }
            }
        });
    });
}

// Edit Form Submission Handler
const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editCandidateId').value;
        const newName = document.getElementById('editFullName').value.trim();
        const newPoints = parseFloat(document.getElementById('editPoints').value);
        
        if (newPoints < 60 || newPoints > 100) {
            alert("الرجاء إدخال نقاط صحيحة بين 60 و 100");
            return;
        }
        
        const editSubmitBtn = document.getElementById('editSubmitBtn');
        if (editSubmitBtn) {
            editSubmitBtn.disabled = true;
            editSubmitBtn.textContent = "جاري الحفظ...";
        }
        
        try {
            const currentPub = publicData[id];
            if (!currentPub) {
                throw new Error("المستخدم غير موجود.");
            }
            
            // Save updates across public and private nodes
            await set(ref(db, `submissions_private/${id}/name`), newName);
            await set(ref(db, `submissions_public/${id}/points`), newPoints);
            await set(ref(db, `submissions_public/${id}/name`), newName);
            
            // Symmetrically sync displayId if it's public
            if (currentPub.isPublic) {
                await set(ref(db, `submissions_public/${id}/displayId`), newName);
            }
            
            document.getElementById('editModal').classList.remove('show');
            alert("تم تعديل البيانات بنجاح!");
        } catch (error) {
            alert("حدث خطأ أثناء تعديل البيانات: " + error.message);
        } finally {
            if (editSubmitBtn) {
                editSubmitBtn.disabled = false;
                editSubmitBtn.textContent = "حفظ التغييرات";
            }
        }
    });
}

// Realtime Settings Lock Listener
const settingsRef = ref(db, 'settings');
onValue(settingsRef, (snapshot) => {
    const settings = snapshot.val() || {};
    const isLocked = !!settings.isLocked;
    const badge = document.getElementById('lockStatusBadge');
    const btn = document.getElementById('toggleLockBtn');
    if (badge && btn) {
        if (isLocked) {
            badge.textContent = "التسجيل مغلق";
            badge.className = "badge-waitlist";
            badge.style.background = "rgba(239, 68, 68, 0.12)";
            badge.style.color = "#ef4444";
            badge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            btn.textContent = "إعادة فتح التسجيل";
            btn.style.background = "var(--primary)";
        } else {
            badge.textContent = "مفتوح للتسجيل";
            badge.className = "badge-matched";
            badge.style.background = "rgba(16, 185, 129, 0.12)";
            badge.style.color = "#10b981";
            badge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
            btn.textContent = "إغلاق التسجيل";
            btn.style.background = "var(--danger)";
        }
    }
});

// Toggle Lock Button Click Event Handler
const toggleLockBtn = document.getElementById('toggleLockBtn');
if (toggleLockBtn) {
    toggleLockBtn.addEventListener('click', async () => {
        const badge = document.getElementById('lockStatusBadge');
        const isCurrentlyLocked = badge && badge.textContent === "التسجيل مغلق";
        try {
            await set(ref(db, 'settings'), { isLocked: !isCurrentlyLocked });
        } catch (error) {
            alert("فشل تحديث حالة القفل: " + error.message);
        }
    });
}

// Export Complete CSV for Admins
function exportAdminCsv() {
    const keys = Object.keys(publicData);
    if (keys.length === 0) {
        alert("لا توجد إدخالات لتصديرها.");
        return;
    }

    // Convert to array and sort descending by points
    const arr = keys.map(k => {
        return { id: k, ...publicData[k] };
    });
    arr.sort((a, b) => b.points - a.points);

    // Build CSV contents (Arabic is official for admin panel)
    const headers = ["الاسم الحقيقي", "الاسم / الرمز المعروض", "الخصوصية", "التخصص", "النقاط", "الحالة", "وقت الإدخال"];
    const rows = [headers];

    arr.forEach(sub => {
        const realName = privateData[sub.id]?.name || "غير متوفر";
        
        // Calculate rank within specialty (admins see all immediately)
        const specSubmissions = arr.filter(s => s.specialty === sub.specialty);
        const rank = specSubmissions.findIndex(s => s.id === sub.id) + 1;
        const seats = specialtiesWithSeats[sub.specialty] || 1;
        
        let statusStr = '';
        if (rank <= seats) {
            statusStr = `ضمن المقاعد #${rank}`;
        } else {
            statusStr = `انتظار #${rank - seats}`;
        }

        const privacyStr = sub.isPublic ? "عام" : "خاص";
        const d = new Date(sub.timestamp);
        const timeStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;

        // Escape double quotes in CSV values to avoid formatting issues
        const cleanRealName = `"${String(realName || '').replace(/"/g, '""')}"`;
        const cleanDispName = `"${String(sub.displayId || '').replace(/"/g, '""')}"`;
        const cleanPrivacy = `"${String(privacyStr || '').replace(/"/g, '""')}"`;
        const cleanSpec = `"${String(sub.specialty || '').replace(/"/g, '""')}"`;
        const cleanPoints = typeof sub.points === 'number' ? sub.points.toFixed(2) : parseFloat(sub.points || 0).toFixed(2);
        const cleanStatus = `"${String(statusStr || '').replace(/"/g, '""')}"`;
        const cleanTime = `"${String(timeStr || '').replace(/"/g, '""')}"`;

        rows.push([cleanRealName, cleanDispName, cleanPrivacy, cleanSpec, cleanPoints, cleanStatus, cleanTime]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    
    // Create Blob with UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const timestampStr = new Date().toISOString().slice(0,10);
    const filename = `juh_residency_admin_complete_${timestampStr}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const exportAdminCsvBtn = document.getElementById('exportAdminCsvBtn');
if (exportAdminCsvBtn) {
    exportAdminCsvBtn.addEventListener('click', exportAdminCsv);
}
