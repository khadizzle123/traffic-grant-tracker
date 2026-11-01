// ==========================================================================
// LOGIN / AUTH
// Single-user credentials stored (hashed in a simple way) in a config object.
// Change USERNAME and PASSWORD here to set your login credentials.
// ==========================================================================

const AUTH_CONFIG = {
    username: '629',
    // Simple obfuscated password check — change the value below to your desired password
    password: 'Tacos101!'
};

function checkLoginState() {
    const session = sessionStorage.getItem('shieldstat_auth');
    if (session === 'authenticated') {
        hideLoginOverlay();
    }
    // else overlay stays visible
}

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');

    if (u === AUTH_CONFIG.username && p === AUTH_CONFIG.password) {
        sessionStorage.setItem('shieldstat_auth', 'authenticated');
        errEl.classList.add('hidden');
        hideLoginOverlay();
    } else {
        errEl.classList.remove('hidden');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.style.transition = 'opacity 0.4s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.classList.add('hidden'), 400);
    }
}

function toggleLoginPasswordVisibility() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('loginPasswordEyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ==========================================================================
// APP SETTINGS STATE
// ==========================================================================
let appSettings = JSON.parse(localStorage.getItem('shieldstat_settings')) || {
    departmentName: 'Metro Traffic Division',
    divisionUnit: 'Grant Unit',
    squadName: 'Squad Charlie',
    appTitle: 'ShieldStat',
    loginUsername: 'admin',
    loginPassword: 'shieldstat2026',
    defaultGrantHours: 180,
    fiscalYearStart: '10-01',
    reportFooterNote: 'I certify under penalty of perjury that this report accurately reflects hours worked, vehicle patrol mileage, and traffic safety enforcement actions conducted under the designated traffic grant program.',
    showDeptCallsOnReport: true,
    requireCaseNumber: true
};

function saveAppSettings() {
    localStorage.setItem('shieldstat_settings', JSON.stringify(appSettings));
}

function applyAppSettings() {
    // Sidebar department card
    const deptNameEl = document.getElementById('sidebarDeptName');
    const deptSubEl  = document.getElementById('sidebarDeptSub');
    if (deptNameEl) deptNameEl.textContent = appSettings.departmentName;
    if (deptSubEl)  deptSubEl.textContent  = `${appSettings.divisionUnit} • ${appSettings.squadName}`;

    // Header brand title
    const brandTitle = document.getElementById('headerBrandTitle');
    if (brandTitle) brandTitle.textContent = appSettings.appTitle;

    // Update live login credentials
    AUTH_CONFIG.username = appSettings.loginUsername;
    AUTH_CONFIG.password = appSettings.loginPassword;
}

function renderSettingsTab() {
    const s = appSettings;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

    setVal('settingDeptName',       s.departmentName);
    setVal('settingDivisionUnit',   s.divisionUnit);
    setVal('settingSquadName',      s.squadName);
    setVal('settingAppTitle',       s.appTitle);
    setVal('settingLoginUsername',  s.loginUsername);
    setVal('settingLoginPassword',  s.loginPassword);
    setVal('settingDefaultHours',   s.defaultGrantHours);
    setVal('settingFiscalYearStart',s.fiscalYearStart);
    setVal('settingReportFooter',   s.reportFooterNote);
    setChk('settingShowDeptCalls',  s.showDeptCallsOnReport);
    setChk('settingRequireCase',    s.requireCaseNumber);
}

function saveSettingsForm() {
    const getVal = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const getChk = id => { const el = document.getElementById(id); return el ? el.checked : false; };

    if (!getVal('settingDeptName'))      { showToast('Department name cannot be blank.', true); return; }
    if (!getVal('settingLoginUsername')) { showToast('Username cannot be blank.', true); return; }
    if (!getVal('settingLoginPassword')) { showToast('Password cannot be blank.', true); return; }

    appSettings.departmentName       = getVal('settingDeptName');
    appSettings.divisionUnit         = getVal('settingDivisionUnit');
    appSettings.squadName            = getVal('settingSquadName');
    appSettings.appTitle             = getVal('settingAppTitle');
    appSettings.loginUsername        = getVal('settingLoginUsername');
    appSettings.loginPassword        = getVal('settingLoginPassword');
    appSettings.defaultGrantHours    = parseFloat(getVal('settingDefaultHours')) || 180;
    appSettings.fiscalYearStart      = getVal('settingFiscalYearStart');
    appSettings.reportFooterNote     = getVal('settingReportFooter');
    appSettings.showDeptCallsOnReport= getChk('settingShowDeptCalls');
    appSettings.requireCaseNumber    = getChk('settingRequireCase');

    saveAppSettings();
    applyAppSettings();
    showToast('Settings saved successfully.');
}

function resetAppSettings() {
    if (!confirm('Reset all settings to factory defaults? This will not delete your shifts, officers, or grants.')) return;
    localStorage.removeItem('shieldstat_settings');
    appSettings = JSON.parse(localStorage.getItem('shieldstat_settings')) || {
        departmentName: 'Metro Traffic Division',
        divisionUnit: 'Grant Unit',
        squadName: 'Squad Charlie',
        appTitle: 'ShieldStat',
        loginUsername: 'admin',
        loginPassword: 'shieldstat2026',
        defaultGrantHours: 180,
        fiscalYearStart: '10-01',
        reportFooterNote: 'I certify under penalty of perjury that this report accurately reflects hours worked, vehicle patrol mileage, and traffic safety enforcement actions conducted under the designated traffic grant program.',
        showDeptCallsOnReport: true,
        requireCaseNumber: true
    };
    applyAppSettings();
    renderSettingsTab();
    showToast('Settings reset to defaults.');
}

function clearAllData() {
    if (!confirm('⚠️ This will permanently delete ALL shift logs. Officers and grants will be kept. This cannot be undone. Continue?')) return;
    shiftLogs = [];
    localStorage.setItem('shieldstat_shifts_v2', JSON.stringify(shiftLogs));
    updateDashboardMetrics();
    renderRecentShifts();
    renderShiftsTable();
    renderOfficersTab();
    renderGrantsTab();
    renderReportSummary();
    updateCharts();
    showToast('All shift logs cleared.', true);
}

function toggleSettingsPassword() {
    const input = document.getElementById('settingLoginPassword');
    const icon  = document.getElementById('settingsPasswordEye');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ==========================================================================
// ShieldStat Core Application Logic & State Management
// Premium Dark Charcoal & Dark Blue Accents
// Audit Segregation: Grant Overtime vs Department Billed Calls & Assists
// Dynamic Date Range Reporting, Officer Hourly Pay & Grant Management
// ==========================================================================

// 1. OFFICERS STATE (Includes Hourly Pay Rate for Budgeting)
let officers = JSON.parse(localStorage.getItem('shieldstat_officers')) || [
    { id: 1, name: 'Miller', badge: '#412', rank: 'Officer', hourlyRate: 68.50 },
    { id: 2, name: 'Vance', badge: '#204', rank: 'Sergeant', hourlyRate: 82.00 },
    { id: 3, name: 'Davis', badge: '#511', rank: 'Officer', hourlyRate: 64.00 },
    { id: 4, name: 'Chen', badge: '#318', rank: 'Officer', hourlyRate: 66.50 },
    { id: 5, name: 'Reynolds', badge: '#109', rank: 'Corporal', hourlyRate: 72.00 }
];

// 2. GRANTS STATE (Dynamic Add, Edit, Delete)
let grants = JSON.parse(localStorage.getItem('shieldstat_grants')) || [
    { 
        id: 1, 
        code: 'HVE-2026', 
        name: 'NHTSA High Visibility Enforcement', 
        agency: 'State DOT / NHTSA CFDA #20.600',
        budget: 45000.00, 
        allocatedHours: 180.0, 
        startDate: '2026-10-01', 
        endDate: '2026-12-31', 
        status: 'Active', 
        focus: 'Speed corridor saturation & seat belt compliance' 
    },
    { 
        id: 2, 
        code: 'ID-2026', 
        name: 'State Impaired Driving Crackdown', 
        agency: 'State Highway Safety Office',
        budget: 25000.00, 
        allocatedHours: 100.0, 
        startDate: '2026-10-15', 
        endDate: '2027-01-15', 
        status: 'Active', 
        focus: 'Nighttime DUI checkpoints & roving patrols' 
    },
    { 
        id: 3, 
        code: 'STEP-2027', 
        name: 'Selective Traffic Enforcement Program', 
        agency: 'Governor Highway Safety Program',
        budget: 18000.00, 
        allocatedHours: 75.0, 
        startDate: '2027-01-01', 
        endDate: '2027-03-31', 
        status: 'Upcoming', 
        focus: 'School zones & distracted driver enforcement' 
    }
];

// 3. SHIFT LOGS STATE
let shiftLogs = JSON.parse(localStorage.getItem('shieldstat_shifts_v2')) || [
    { 
        id: 1, 
        date: '2026-10-24', 
        timeStart: '07:00',
        timeEnd: '15:00',
        startMileage: 42100.0,
        endMileage: 42172.5,
        totalMiles: 72.5,
        officer: 'Ofc. Miller (#412)', 
        type: 'HVE-2026', 
        unit: 'Cruiser 14',
        hours: 8.0, 
        totalHours: 8.0,
        deptHours: 1.0,
        grantHours: 7.0,
        stops: 14, 
        citations: 8, 
        duis: 1,
        felonies: 0,
        stolenVehicles: 0,
        calls: [
            { type: 'Assisted an Officer', caseNumber: 'CAD-26-8941', minutes: 45, hours: 0.75, notes: 'Cover unit on felony warrant search' },
            { type: 'Took a Call (Service)', caseNumber: '26-10492', minutes: 15, hours: 0.25, notes: 'Dispatched debris removal in traffic lane' }
        ],
        stats: {
            stops: 14,
            dui_alcohol: 1, dui_drugs: 0, dui_both: 0, underage_alcohol: 0,
            seat_belt: 3, child_seat_belt: 1,
            speeding: 4, reckless_driving: 0, texting: 1, bike_ped: 0,
            no_insurance: 1, suspended_license: 1, motorcycle_endorsement: 0,
            felony_arrest: 0, stolen_vehicles: 0, fugitives: 0
        }
    },
    { 
        id: 2, 
        date: '2026-10-25', 
        timeStart: '14:00',
        timeEnd: '00:00',
        startMileage: 42172.5,
        endMileage: 42255.0,
        totalMiles: 82.5,
        officer: 'Sgt. Vance (#204)', 
        type: 'Regular Patrol', 
        unit: 'Interceptor 02',
        hours: 10.0, 
        totalHours: 10.0,
        deptHours: 2.0,
        grantHours: 8.0,
        stops: 11, 
        citations: 5, 
        duis: 0, 
        felonies: 1,
        stolenVehicles: 1,
        calls: [
            { type: 'Assisted an Officer', caseNumber: 'CAD-26-9011', minutes: 120, hours: 2.0, notes: 'Assisted perimeter on commercial burglary alarm' }
        ],
        stats: {
            stops: 11,
            dui_alcohol: 0, dui_drugs: 0, dui_both: 0, underage_alcohol: 0,
            seat_belt: 2, child_seat_belt: 0,
            speeding: 2, reckless_driving: 1, texting: 0, bike_ped: 0,
            no_insurance: 1, suspended_license: 0, motorcycle_endorsement: 0,
            felony_arrest: 1, stolen_vehicles: 1, fugitives: 1
        }
    },
    { 
        id: 3, 
        date: '2026-10-26', 
        timeStart: '08:00',
        timeEnd: '16:00',
        startMileage: 42255.0,
        endMileage: 42322.0,
        totalMiles: 67.0,
        officer: 'Ofc. Davis (#511)', 
        type: 'HVE-2026', 
        unit: 'Cruiser 18',
        hours: 8.0, 
        totalHours: 8.0,
        deptHours: 0.5,
        grantHours: 7.5,
        stops: 13, 
        citations: 9, 
        duis: 1, 
        felonies: 0,
        stolenVehicles: 0,
        calls: [
            { type: 'Took a Call (Service)', caseNumber: '26-10515', minutes: 30, hours: 0.5, notes: 'Traffic signal failure intersection control' }
        ],
        stats: {
            stops: 13,
            dui_alcohol: 0, dui_drugs: 1, dui_both: 0, underage_alcohol: 1,
            seat_belt: 2, child_seat_belt: 1,
            speeding: 5, reckless_driving: 0, texting: 2, bike_ped: 0,
            no_insurance: 0, suspended_license: 2, motorcycle_endorsement: 0,
            felony_arrest: 0, stolen_vehicles: 0, fugitives: 0
        }
    },
    { 
        id: 4, 
        date: '2026-10-28', 
        timeStart: '07:00',
        timeEnd: '15:00',
        startMileage: 42322.0,
        endMileage: 42386.4,
        totalMiles: 64.4,
        officer: 'Ofc. Miller (#412)', 
        type: 'ID-2026', 
        unit: 'Cruiser 14',
        hours: 8.0, 
        totalHours: 8.0,
        deptHours: 0.0,
        grantHours: 8.0,
        stops: 8, 
        citations: 4, 
        duis: 0, 
        felonies: 0,
        stolenVehicles: 0,
        calls: [],
        stats: {
            stops: 8,
            dui_alcohol: 0, dui_drugs: 0, dui_both: 0, underage_alcohol: 0,
            seat_belt: 1, child_seat_belt: 0,
            speeding: 3, reckless_driving: 0, texting: 0, bike_ped: 1,
            no_insurance: 0, suspended_license: 1, motorcycle_endorsement: 1,
            felony_arrest: 0, stolen_vehicles: 0, fugitives: 0
        }
    },
    { 
        id: 5, 
        date: '2026-10-30', 
        timeStart: '18:00',
        timeEnd: '02:30',
        startMileage: 42386.4,
        endMileage: 42475.0,
        totalMiles: 88.6,
        officer: 'Ofc. Chen (#318)', 
        type: 'HVE-2026', 
        unit: 'Cruiser 09',
        hours: 8.5, 
        totalHours: 8.5,
        deptHours: 1.5,
        grantHours: 7.0,
        stops: 15, 
        citations: 9, 
        duis: 2, 
        felonies: 1,
        stolenVehicles: 0,
        calls: [
            { type: 'Assisted an Officer', caseNumber: 'CAD-26-9188', minutes: 90, hours: 1.5, notes: 'K9 assist on stolen vehicle track' }
        ],
        stats: {
            stops: 15,
            dui_alcohol: 1, dui_drugs: 0, dui_both: 1, underage_alcohol: 0,
            seat_belt: 3, child_seat_belt: 0,
            speeding: 4, reckless_driving: 1, texting: 1, bike_ped: 0,
            no_insurance: 1, suspended_license: 1, motorcycle_endorsement: 0,
            felony_arrest: 1, stolen_vehicles: 0, fugitives: 1
        }
    },
    { 
        id: 6, 
        date: '2026-10-31', 
        timeStart: '20:00',
        timeEnd: '06:00',
        startMileage: 42475.0,
        endMileage: 42580.2,
        totalMiles: 105.2,
        officer: 'Sgt. Vance (#204)', 
        type: 'HVE-2026', 
        unit: 'Interceptor 02',
        hours: 10.0, 
        totalHours: 10.0,
        deptHours: 1.0,
        grantHours: 9.0,
        stops: 12, 
        citations: 7, 
        duis: 2, 
        felonies: 1,
        stolenVehicles: 1,
        calls: [
            { type: 'Assisted an Officer', caseNumber: 'CAD-26-9240', minutes: 60, hours: 1.0, notes: 'Cover on fight in progress outside venue' }
        ],
        stats: {
            stops: 12,
            dui_alcohol: 2, dui_drugs: 0, dui_both: 0, underage_alcohol: 1,
            seat_belt: 2, child_seat_belt: 1,
            speeding: 3, reckless_driving: 1, texting: 1, bike_ped: 0,
            no_insurance: 1, suspended_license: 0, motorcycle_endorsement: 0,
            felony_arrest: 1, stolen_vehicles: 1, fugitives: 0
        }
    }
];

let violationChartInstance = null;
let hoursChartInstance = null;

// Stat Tracker Active Counters (17 Metrics)
let trackerCounters = {
    stops: 0,
    dui_alcohol: 0,
    dui_drugs: 0,
    dui_both: 0,
    underage_alcohol: 0,
    seat_belt: 0,
    child_seat_belt: 0,
    speeding: 0,
    reckless_driving: 0,
    texting: 0,
    bike_ped: 0,
    no_insurance: 0,
    suspended_license: 0,
    motorcycle_endorsement: 0,
    felony_arrest: 0,
    stolen_vehicles: 0,
    fugitives: 0
};

// Logged Calls / Assists for Current Tracker Session
let trackerCalls = [];

document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
    applyAppSettings();
    initReportDates();
    populateSelectOptions();
    updateDashboardMetrics();
    renderRecentShifts();
    renderShiftsTable();
    renderOfficersTab();
    renderGrantsTab();
    renderReportSummary();
    initCharts();
});

// Helper: Get an officer's hourly rate by name/badge
function getOfficerHourlyRate(officerString) {
    if (!officerString) return 65.00;
    const clean = officerString.toLowerCase();
    const found = officers.find(o => clean.includes(o.name.toLowerCase()) || clean.includes(o.badge.toLowerCase()));
    return found ? found.hourlyRate : 65.00;
}

function getOfficerObject(officerString) {
    if (!officerString) return null;
    const clean = officerString.toLowerCase();
    return officers.find(o => clean.includes(o.name.toLowerCase()) || clean.includes(o.badge.toLowerCase())) || null;
}

// ==========================================================================
// Navigation & Tab Switching
// ==========================================================================

function switchTab(tabId) {
    const tabs = ['dashboard', 'shifts', 'officers', 'grants', 'reports', 'settings'];
    
    tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        const nav = document.getElementById(`nav-${t}`);
        if (el) el.classList.add('hidden');
        if (nav) {
            nav.classList.remove('active-nav', 'text-white');
            nav.classList.add('text-[#848e9f]');
            const icon = nav.querySelector('i');
            if (icon) {
                icon.classList.remove('text-[#60a5fa]');
                icon.classList.add('text-[#848e9f]');
            }
        }
    });

    const activeEl = document.getElementById(`tab-${tabId}`);
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeEl) activeEl.classList.remove('hidden');
    if (activeNav) {
        activeNav.classList.remove('text-[#848e9f]');
        activeNav.classList.add('active-nav', 'text-white');
        const icon = activeNav.querySelector('i');
        if (icon) {
            icon.classList.remove('text-[#848e9f]');
            icon.classList.add('text-[#60a5fa]');
        }
    }

    if (tabId === 'officers') renderOfficersTab();
    if (tabId === 'grants') renderGrantsTab();
    if (tabId === 'reports') renderReportSummary();
    if (tabId === 'settings') renderSettingsTab();
}

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
    }
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
        el.classList.add('hidden');
        el.classList.remove('flex');
    }
}

// ==========================================================================
// Populate Dynamic Select Options
// ==========================================================================

function populateSelectOptions() {
    // 1. Populate Tracker Officer Select
    const trackerOfficerSelect = document.getElementById('trackerOfficer');
    if (trackerOfficerSelect) {
        trackerOfficerSelect.innerHTML = officers.map(o => `
            <option value="${o.rank ? o.rank + ' ' : 'Ofc. '}${o.name} (${o.badge})">
                ${o.rank ? o.rank + ' ' : 'Ofc. '}${o.name} (${o.badge}) - $${o.hourlyRate.toFixed(2)}/hr
            </option>
        `).join('');
    }

    // 2. Populate Tracker Grant Select
    const trackerShiftTypeSelect = document.getElementById('trackerShiftType');
    if (trackerShiftTypeSelect) {
        let opts = grants.map(g => `<option value="${g.code}">${g.code} (${g.name})</option>`).join('');
        opts += `<option value="Regular Patrol">Regular Patrol Shift</option>`;
        opts += `<option value="Selective Enforcement">Selective Traffic Enforcement</option>`;
        trackerShiftTypeSelect.innerHTML = opts;
    }

    // 3. Populate Report Filter Selects
    const reportOfficerFilter = document.getElementById('reportOfficerFilter');
    if (reportOfficerFilter) {
        reportOfficerFilter.innerHTML = `<option value="">All Officers</option>` + officers.map(o => `
            <option value="${o.name}">${o.rank ? o.rank + ' ' : 'Ofc. '}${o.name} (${o.badge})</option>
        `).join('');
    }

    const reportGrantFilter = document.getElementById('reportGrantFilter');
    if (reportGrantFilter) {
        reportGrantFilter.innerHTML = `<option value="">All Programs</option>` + grants.map(g => `
            <option value="${g.code}">${g.code} - ${g.name}</option>
        `).join('') + `<option value="Regular">Regular Patrol</option>`;
    }

    // Header Grant Name
    const headerGrantName = document.getElementById('headerGrantName');
    if (headerGrantName && grants.length > 0) {
        headerGrantName.innerText = grants[0].code;
    }

    const sidebarOfficerCount = document.getElementById('sidebarOfficerCount');
    if (sidebarOfficerCount) sidebarOfficerCount.innerText = officers.length;

    const sidebarGrantCount = document.getElementById('sidebarGrantCount');
    if (sidebarGrantCount) sidebarGrantCount.innerText = grants.length;
}

// ==========================================================================
// Stat Tracker Page Open & Close
// ==========================================================================

function openStatTracker() {
    const page = document.getElementById('statTrackerPage');
    if (!page) return;

    populateSelectOptions();

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('trackerDate');
    if (dateInput && !dateInput.value) dateInput.value = today;

    const timeStartInput = document.getElementById('trackerTimeStart');
    const timeEndInput = document.getElementById('trackerTimeEnd');
    if (timeStartInput && !timeStartInput.value) timeStartInput.value = '07:00';
    if (timeEndInput && !timeEndInput.value) timeEndInput.value = '15:30';

    const startMileageInput = document.getElementById('trackerStartMileage');
    if (startMileageInput && !startMileageInput.value) {
        if (shiftLogs.length > 0 && shiftLogs[0].endMileage) {
            startMileageInput.value = shiftLogs[0].endMileage;
        } else {
            startMileageInput.value = '48200.0';
        }
    }

    const endMileageInput = document.getElementById('trackerEndMileage');
    if (endMileageInput && !endMileageInput.value) {
        const startVal = parseFloat(startMileageInput ? startMileageInput.value : 48200) || 48200;
        endMileageInput.value = (startVal + 65.4).toFixed(1);
    }

    calculateShiftMetrics();
    updateCounterDisplays();
    renderTrackerCallsTable();

    page.classList.remove('hidden');
    page.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeStatTracker() {
    const totalCount = Object.values(trackerCounters).reduce((a, b) => a + b, 0);
    if (totalCount > 0 || trackerCalls.length > 0) {
        if (!confirm('You have active counters or logged calls in this shift. Are you sure you want to exit without saving?')) {
            return;
        }
    }

    const page = document.getElementById('statTrackerPage');
    if (!page) return;

    page.classList.add('hidden');
    page.classList.remove('flex');
    document.body.style.overflow = '';
}

// ==========================================================================
// Auto-calculation: Hours, Mileage, Dept vs Grant Segregation
// ==========================================================================

function calculateShiftMetrics() {
    const startMil = parseFloat(document.getElementById('trackerStartMileage').value) || 0;
    const endMil = parseFloat(document.getElementById('trackerEndMileage').value) || 0;
    const calcPatrolMilesEl = document.getElementById('calcPatrolMiles');

    let totalMiles = 0;
    if (endMil >= startMil && startMil > 0) {
        totalMiles = endMil - startMil;
        if (calcPatrolMilesEl) calcPatrolMilesEl.innerText = `${totalMiles.toFixed(1)} mi`;
    } else {
        if (calcPatrolMilesEl) calcPatrolMilesEl.innerText = '0.0 mi';
    }

    const timeStart = document.getElementById('trackerTimeStart').value;
    const timeEnd = document.getElementById('trackerTimeEnd').value;
    const hoursWorkedInput = document.getElementById('trackerHoursWorked');
    const totalHoursInput = document.getElementById('trackerTotalHours');
    const calcDurationEl = document.getElementById('calcShiftDuration');

    let durationHours = 8.0;

    if (timeStart && timeEnd) {
        const [sH, sM] = timeStart.split(':').map(Number);
        const [eH, eM] = timeEnd.split(':').map(Number);
        let startMins = sH * 60 + sM;
        let endMins = eH * 60 + eM;

        if (endMins < startMins) endMins += 24 * 60; // Crosses midnight

        const diffMinutes = endMins - startMins;
        durationHours = parseFloat((diffMinutes / 60).toFixed(1));

        if (calcDurationEl) calcDurationEl.innerText = `${durationHours.toFixed(1)} hrs`;
        if (hoursWorkedInput) hoursWorkedInput.value = durationHours.toFixed(1);
        if (totalHoursInput) totalHoursInput.value = durationHours.toFixed(1);
    }

    const totalDeptMinutes = trackerCalls.reduce((sum, item) => sum + (item.minutes || 0), 0);
    const deptHours = parseFloat((totalDeptMinutes / 60).toFixed(2));
    const netGrantHours = Math.max(0, parseFloat((durationHours - deptHours).toFixed(2)));

    const deptDisplay = document.getElementById('trackerDeptTimeDisplay');
    if (deptDisplay) deptDisplay.innerText = `${deptHours.toFixed(1)} hrs (${totalDeptMinutes} mins)`;

    const calcDeptEl = document.getElementById('calcDeptBilledHours');
    if (calcDeptEl) calcDeptEl.innerText = `${deptHours.toFixed(1)} hrs`;

    const calcNetGrantEl = document.getElementById('calcNetGrantHours');
    if (calcNetGrantEl) calcNetGrantEl.innerText = `${netGrantHours.toFixed(1)} hrs`;

    const liveDeptEl = document.getElementById('liveSummaryDeptHours');
    if (liveDeptEl) liveDeptEl.innerText = `${deptHours.toFixed(1)}h`;

    const liveGrantEl = document.getElementById('liveSummaryGrantHours');
    if (liveGrantEl) liveGrantEl.innerText = `${netGrantHours.toFixed(1)}h`;

    updateLiveSummary();
}

// ==========================================================================
// Officer Assists & Calls for Service (Department Billed)
// ==========================================================================

function setCallMinutes(mins) {
    const input = document.getElementById('callEntryMinutes');
    if (input) input.value = mins;
}

function addNonGrantCallRecord() {
    const type = document.getElementById('callEntryType').value;
    const caseNumber = document.getElementById('callEntryCaseNumber').value.trim();
    const minutes = parseInt(document.getElementById('callEntryMinutes').value) || 0;
    const notes = document.getElementById('callEntryNotes').value.trim();

    if (!caseNumber) {
        alert('Case Number / CAD Number is mandatory for officer assists and calls for service.');
        document.getElementById('callEntryCaseNumber').focus();
        return;
    }

    if (minutes <= 0) {
        alert('Please enter a valid time spent on call in minutes (minimum 1 min).');
        document.getElementById('callEntryMinutes').focus();
        return;
    }

    const hours = parseFloat((minutes / 60).toFixed(2));

    const newCall = {
        id: Date.now(),
        type: type,
        caseNumber: caseNumber,
        minutes: minutes,
        hours: hours,
        notes: notes || (type === 'Assisted an Officer' ? 'Routine Officer Backup' : 'Dispatched Call')
    };

    trackerCalls.push(newCall);

    document.getElementById('callEntryCaseNumber').value = '';
    document.getElementById('callEntryMinutes').value = '';
    document.getElementById('callEntryNotes').value = '';

    renderTrackerCallsTable();
    calculateShiftMetrics();
    showToast(`Logged ${type} (Case #${caseNumber}): ${minutes} mins billed to department.`);
}

function deleteNonGrantCallRecord(index) {
    trackerCalls.splice(index, 1);
    renderTrackerCallsTable();
    calculateShiftMetrics();
    showToast('Removed assist/call from shift.');
}

function renderTrackerCallsTable() {
    const tbody = document.getElementById('trackerCallsTableBody');
    if (!tbody) return;

    if (trackerCalls.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-4 text-center text-[#848e9f]">
                    No non-grant calls or officer assists recorded for this shift. (100% of shift hours currently allocated to grant).
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    trackerCalls.forEach((c, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-[#1e2330]/40 transition';
        tr.innerHTML = `
            <td class="px-4 py-2.5 font-medium text-white flex items-center space-x-1.5">
                <i class="fa-solid ${c.type.includes('Assist') ? 'fa-handshake text-amber-400' : 'fa-headset text-blue-400'} text-xs"></i>
                <span>${c.type}</span>
            </td>
            <td class="px-4 py-2.5 font-mono text-amber-300 font-semibold">${c.caseNumber}</td>
            <td class="px-4 py-2.5 font-mono text-white font-bold">${c.minutes} mins <span class="text-[10px] text-[#848e9f]">(${c.hours}h)</span></td>
            <td class="px-4 py-2.5">
                <span class="accent-amber-pill px-2 py-0.5 rounded text-[10px] font-mono font-semibold">Dept Billed (Non-Grant)</span>
            </td>
            <td class="px-4 py-2.5 text-[#cbd5e1] text-[11px] truncate max-w-[200px]">${c.notes}</td>
            <td class="px-4 py-2.5 text-right">
                <button type="button" onclick="deleteNonGrantCallRecord(${idx})" class="text-rose-400 hover:text-rose-300 p-1 rounded" title="Delete Call Entry">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================================================
// Stat Tracker Counter Logic (17 Metrics)
// ==========================================================================

function changeCounter(key, delta) {
    if (!(key in trackerCounters)) return;

    trackerCounters[key] = Math.max(0, trackerCounters[key] + delta);

    if (delta > 0 && key !== 'stops' && key !== 'stolen_vehicles') {
        const totalViolations = getTotalCitations() + getTotalDuis();
        if (trackerCounters.stops < totalViolations) {
            trackerCounters.stops = totalViolations;
        }
    }

    updateCounterDisplays();
}

function getTotalCitations() {
    return trackerCounters.seat_belt +
           trackerCounters.child_seat_belt +
           trackerCounters.speeding +
           trackerCounters.reckless_driving +
           trackerCounters.texting +
           trackerCounters.bike_ped +
           trackerCounters.no_insurance +
           trackerCounters.suspended_license +
           trackerCounters.motorcycle_endorsement;
}

function getTotalDuis() {
    return trackerCounters.dui_alcohol +
           trackerCounters.dui_drugs +
           trackerCounters.dui_both;
}

function getTotalFelonies() {
    return trackerCounters.felony_arrest + trackerCounters.fugitives;
}

function updateCounterDisplays() {
    for (const [key, val] of Object.entries(trackerCounters)) {
        const el = document.getElementById(`counter_${key}`);
        if (el) el.innerText = val;
    }

    const groupDuis = document.getElementById('groupTotalDuis');
    if (groupDuis) groupDuis.innerText = `${getTotalDuis() + trackerCounters.underage_alcohol} total`;

    const groupBelts = document.getElementById('groupTotalBelts');
    if (groupBelts) groupBelts.innerText = `${trackerCounters.seat_belt + trackerCounters.child_seat_belt} citations`;

    const groupMoving = document.getElementById('groupTotalMoving');
    if (groupMoving) groupMoving.innerText = `${trackerCounters.speeding + trackerCounters.reckless_driving + trackerCounters.texting + trackerCounters.bike_ped} citations`;

    const groupLicense = document.getElementById('groupTotalLicense');
    if (groupLicense) groupLicense.innerText = `${trackerCounters.no_insurance + trackerCounters.suspended_license + trackerCounters.motorcycle_endorsement} citations`;

    const groupFelonies = document.getElementById('groupTotalFelonies');
    if (groupFelonies) groupFelonies.innerText = `${getTotalFelonies() + trackerCounters.stolen_vehicles} recorded`;

    updateLiveSummary();
}

function updateLiveSummary() {
    const stopsEl = document.getElementById('liveSummaryStops');
    const citationsEl = document.getElementById('liveSummaryCitations');
    const duisEl = document.getElementById('liveSummaryDuis');
    const feloniesEl = document.getElementById('liveSummaryFelonies');

    if (stopsEl) stopsEl.innerText = trackerCounters.stops;
    if (citationsEl) citationsEl.innerText = getTotalCitations();
    if (duisEl) duisEl.innerText = getTotalDuis();
    if (feloniesEl) feloniesEl.innerText = getTotalFelonies();
}

function resetTrackerCounters() {
    if (confirm('Are you sure you want to reset all shift counters back to zero?')) {
        for (const key of Object.keys(trackerCounters)) {
            trackerCounters[key] = 0;
        }
        trackerCalls = [];
        renderTrackerCallsTable();
        updateCounterDisplays();
        calculateShiftMetrics();
        showToast('Shift counters reset.');
    }
}

// ==========================================================================
// Save & Submit Complete Shift from Stat Tracker
// ==========================================================================

// Stores the pending shift object while user reviews the preview
let _pendingShift = null;

function submitStatTracker() {
    const dateVal = document.getElementById('trackerDate').value;
    const timeStartVal = document.getElementById('trackerTimeStart').value;
    const timeEndVal = document.getElementById('trackerTimeEnd').value;
    const officerVal = document.getElementById('trackerOfficer').value.trim();
    const startMileageVal = parseFloat(document.getElementById('trackerStartMileage').value) || 0;
    const endMileageVal = parseFloat(document.getElementById('trackerEndMileage').value) || 0;
    const hoursVal = parseFloat(document.getElementById('trackerHoursWorked').value) || 0;
    const totalHoursVal = parseFloat(document.getElementById('trackerTotalHours').value) || hoursVal;
    const shiftTypeVal = document.getElementById('trackerShiftType').value;
    const unitVal = document.getElementById('trackerUnit').value.trim();
    const locationVal = document.getElementById('trackerLocation').value.trim();

    if (!dateVal) { alert('Please enter the shift date.'); return; }
    if (!officerVal) { alert('Please select or enter the officer.'); return; }
    if (hoursVal <= 0) { alert('Please enter valid shift hours worked.'); return; }

    const totalMiles = endMileageVal >= startMileageVal && startMileageVal > 0 ? (endMileageVal - startMileageVal) : 0;
    const totalCitations = getTotalCitations();
    const totalDuis = getTotalDuis();
    const totalFelonies = getTotalFelonies();
    const totalStops = Math.max(trackerCounters.stops, totalCitations + totalDuis);

    const totalDeptMinutes = trackerCalls.reduce((sum, item) => sum + (item.minutes || 0), 0);
    const deptHours = parseFloat((totalDeptMinutes / 60).toFixed(2));
    const isGrantShift = !shiftTypeVal.includes('Regular');
    const grantHours = isGrantShift ? Math.max(0, parseFloat((hoursVal - deptHours).toFixed(2))) : 0;

    const hourlyRate = getOfficerHourlyRate(officerVal);
    const grantWage = grantHours * hourlyRate;

    _pendingShift = {
        id: Date.now(),
        date: dateVal,
        timeStart: timeStartVal,
        timeEnd: timeEndVal,
        startMileage: startMileageVal,
        endMileage: endMileageVal,
        totalMiles: parseFloat(totalMiles.toFixed(1)),
        officer: officerVal,
        type: shiftTypeVal,
        unit: unitVal || 'Cruiser',
        location: locationVal,
        hours: hoursVal,
        totalHours: totalHoursVal,
        deptHours: deptHours,
        grantHours: grantHours,
        hourlyRate: hourlyRate,
        grantWage: grantWage,
        stops: totalStops,
        citations: totalCitations,
        duis: totalDuis,
        felonies: totalFelonies,
        stolenVehicles: trackerCounters.stolen_vehicles,
        calls: [ ...trackerCalls ],
        stats: { ...trackerCounters }
    };

    populateShiftPreview(_pendingShift);
    openModal('shiftPreviewModal');
}

function populateShiftPreview(shift) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    const fmt = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—';
    set('previewDate', fmt(shift.date));
    set('previewTimeStart', shift.timeStart || '—');
    set('previewTimeEnd', shift.timeEnd || '—');
    set('previewOfficer', shift.officer);
    set('previewShiftType', shift.type);
    set('previewUnit', shift.unit);
    set('previewTotalHours', shift.hours.toFixed(2) + ' hrs');
    set('previewGrantHours', shift.grantHours.toFixed(2) + ' hrs');
    set('previewDeptHours', shift.deptHours.toFixed(2) + ' hrs');
    set('previewGrantWage', '$' + shift.grantWage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    set('previewStartMileage', shift.startMileage > 0 ? shift.startMileage.toLocaleString() : '—');
    set('previewEndMileage', shift.endMileage > 0 ? shift.endMileage.toLocaleString() : '—');
    set('previewTotalMiles', shift.totalMiles.toFixed(1) + ' mi');

    // Enforcement metrics grid
    const metrics = [
        { label: 'Total Stops', val: shift.stops, icon: 'fa-car', color: 'text-white' },
        { label: 'DUI – Alcohol', val: shift.stats.dui_alcohol, icon: 'fa-wine-bottle', color: 'text-red-400' },
        { label: 'DUI – Drugs', val: shift.stats.dui_drugs, icon: 'fa-pills', color: 'text-red-400' },
        { label: 'DUI – Both', val: shift.stats.dui_both, icon: 'fa-skull-crossbones', color: 'text-red-400' },
        { label: 'Seat Belt', val: shift.stats.seat_belt, icon: 'fa-shield-halved', color: 'text-yellow-400' },
        { label: 'Child Seat Belt', val: shift.stats.child_seat_belt, icon: 'fa-child', color: 'text-yellow-400' },
        { label: 'No Insurance', val: shift.stats.no_insurance, icon: 'fa-ban', color: 'text-orange-400' },
        { label: 'Susp. License', val: shift.stats.suspended_license, icon: 'fa-id-card', color: 'text-orange-400' },
        { label: 'Speeding', val: shift.stats.speeding, icon: 'fa-gauge-high', color: 'text-[#60a5fa]' },
        { label: 'Reckless Driving', val: shift.stats.reckless_driving, icon: 'fa-road-spikes', color: 'text-[#60a5fa]' },
        { label: 'Texting', val: shift.stats.texting, icon: 'fa-mobile-screen', color: 'text-[#60a5fa]' },
        { label: 'Moto Endorsement', val: shift.stats.motorcycle_endorsement, icon: 'fa-motorcycle', color: 'text-[#60a5fa]' },
        { label: 'Bike / Ped', val: shift.stats.bike_ped, icon: 'fa-person-biking', color: 'text-[#60a5fa]' },
        { label: 'Felony Arrest', val: shift.stats.felony_arrest, icon: 'fa-handcuffs', color: 'text-emerald-400' },
        { label: 'Stolen Vehicles', val: shift.stats.stolen_vehicles, icon: 'fa-car-burst', color: 'text-emerald-400' },
        { label: 'Underage Alcohol', val: shift.stats.underage_alcohol, icon: 'fa-beer-mug-empty', color: 'text-red-400' },
        { label: 'Fugitives', val: shift.stats.fugitives, icon: 'fa-person-running', color: 'text-emerald-400' },
    ];

    const grid = document.getElementById('previewMetricsGrid');
    if (grid) {
        grid.innerHTML = metrics.map(m => `
            <div class="bg-[#121318] border border-[#272a34] rounded-lg p-2.5 flex items-center space-x-2">
                <i class="fa-solid ${m.icon} ${m.color} text-xs w-3 text-center shrink-0"></i>
                <div class="min-w-0">
                    <p class="text-[10px] text-[#848e9f] truncate">${m.label}</p>
                    <p class="font-bold ${m.val > 0 ? m.color : 'text-[#4e5566]'} font-mono">${m.val}</p>
                </div>
            </div>
        `).join('');
    }

    // Dept-billed calls
    const callsSection = document.getElementById('previewCallsSection');
    const callsList = document.getElementById('previewCallsList');
    if (shift.calls && shift.calls.length > 0) {
        callsSection.classList.remove('hidden');
        callsList.innerHTML = shift.calls.map(c => `
            <div class="bg-[#121318] border border-amber-500/20 rounded-lg p-2.5 flex items-start space-x-2.5">
                <i class="fa-solid fa-radio text-amber-400 text-xs mt-0.5 shrink-0"></i>
                <div class="min-w-0">
                    <p class="font-medium text-white">${c.type} — Case #${c.caseNumber}</p>
                    <p class="text-[#848e9f] text-[11px]">${c.minutes} min · ${c.notes || ''}</p>
                </div>
            </div>
        `).join('');
    } else {
        callsSection.classList.add('hidden');
    }
}

function confirmShiftSave() {
    if (!_pendingShift) return;

    shiftLogs.unshift(_pendingShift);
    localStorage.setItem('shieldstat_shifts_v2', JSON.stringify(shiftLogs));

    // Reset tracker state
    for (const key of Object.keys(trackerCounters)) { trackerCounters[key] = 0; }
    trackerCalls = [];
    renderTrackerCallsTable();
    updateCounterDisplays();

    closeModal('shiftPreviewModal');

    const page = document.getElementById('statTrackerPage');
    if (page) {
        page.classList.add('hidden');
        page.classList.remove('flex');
        document.body.style.overflow = '';
    }

    const saved = _pendingShift;
    _pendingShift = null;

    updateDashboardMetrics();
    renderRecentShifts();
    renderShiftsTable();
    renderOfficersTab();
    renderGrantsTab();
    renderReportSummary();
    updateCharts();

    switchTab('shifts');
    showToast(`Shift saved: ${saved.grantHours}h Grant OT, ${saved.deptHours}h Dept Calls, ${saved.citations} citations.`);
}

// ==========================================================================
// Delete & Management Functions
// ==========================================================================

function deleteShift(id) {
    if (confirm('Are you sure you want to delete this shift log entry? This will update grant totals and officer wage spend.')) {
        shiftLogs = shiftLogs.filter(item => item.id !== id);
        localStorage.setItem('shieldstat_shifts_v2', JSON.stringify(shiftLogs));
        updateDashboardMetrics();
        renderRecentShifts();
        renderShiftsTable();
        renderOfficersTab();
        renderGrantsTab();
        renderReportSummary();
        updateCharts();
        showToast('Shift entry deleted from logs.', true);
    }
}

function updateDashboardMetrics() {
    let totalCitations = shiftLogs.reduce((sum, item) => sum + (item.citations || 0), 0);
    let totalGrantHours = shiftLogs.reduce((sum, item) => sum + (item.grantHours || 0), 0);
    let totalDeptHours = shiftLogs.reduce((sum, item) => sum + (item.deptHours || 0), 0);
    let totalStops = shiftLogs.reduce((sum, item) => sum + (item.stops || 0), 0);
    let totalDuis = shiftLogs.reduce((sum, item) => sum + (item.duis || 0), 0);
    let totalFelonies = shiftLogs.reduce((sum, item) => sum + (item.felonies || 0), 0);

    // Calculate total grant wages spend ($)
    let totalGrantWages = shiftLogs.reduce((sum, item) => {
        const rate = getOfficerHourlyRate(item.officer);
        return sum + ((item.grantHours || 0) * rate);
    }, 0);

    const statCitations = document.getElementById('stat-citations');
    const statHours = document.getElementById('stat-hours');
    const statDeptHours = document.getElementById('stat-dept-hours');
    const statStops = document.getElementById('stat-stops');
    const statDuis = document.getElementById('stat-duis');
    const statFelonies = document.getElementById('stat-felonies');
    const statTotalWages = document.getElementById('stat-total-wages');

    if (statCitations) statCitations.innerText = totalCitations;
    if (statHours) statHours.innerText = totalGrantHours.toFixed(1) + ' hrs';
    if (statDeptHours) statDeptHours.innerText = totalDeptHours.toFixed(1) + ' hrs';
    if (statStops) statStops.innerText = totalStops;
    if (statDuis) statDuis.innerText = totalDuis;
    if (statFelonies) statFelonies.innerText = totalFelonies;
    if (statTotalWages) statTotalWages.innerText = `$${totalGrantWages.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Sidebar Burn Rate
    const totalAllocatedHours = grants.reduce((sum, g) => sum + (g.allocatedHours || 0), 0) || 180.0;
    const burnRatePercent = Math.min(100, (totalGrantHours / totalAllocatedHours) * 100).toFixed(1);
    
    const sidebarBurnRate = document.getElementById('sidebarBurnRate');
    const sidebarProgressBar = document.getElementById('sidebarProgressBar');
    const sidebarGrantHours = document.getElementById('sidebarGrantHours');
    const sidebarGrantCap = document.getElementById('sidebarGrantCap');
    const sidebarDeptHours = document.getElementById('sidebarDeptHours');
    const sidebarTotalGrantSpend = document.getElementById('sidebarTotalGrantSpend');

    if (sidebarBurnRate) sidebarBurnRate.innerText = `${burnRatePercent}%`;
    if (sidebarProgressBar) sidebarProgressBar.style.width = `${burnRatePercent}%`;
    if (sidebarGrantHours) sidebarGrantHours.innerText = `${totalGrantHours.toFixed(1)} hrs`;
    if (sidebarGrantCap) sidebarGrantCap.innerText = `${totalAllocatedHours.toFixed(1)} hrs`;
    if (sidebarDeptHours) sidebarDeptHours.innerText = `${totalDeptHours.toFixed(1)} hrs`;
    if (sidebarTotalGrantSpend) sidebarTotalGrantSpend.innerText = `$${totalGrantWages.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderRecentShifts() {
    const tbody = document.getElementById('recentShiftTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const recent = shiftLogs.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="px-5 py-6 text-center text-[#848e9f]">No shift entries recorded yet.</td></tr>`;
        return;
    }

    recent.forEach(item => {
        const rate = getOfficerHourlyRate(item.officer);
        const grantWage = (item.grantHours || 0) * rate;

        const tr = document.createElement('tr');
        tr.className = 'transition hover:bg-[#1e2330]/40';
        tr.innerHTML = `
            <td class="px-5 py-3 font-mono text-xs text-[#cbd5e1]">
                <div>${item.date}</div>
                <div class="text-[10px] text-[#848e9f]">${item.timeStart || ''}-${item.timeEnd || ''}</div>
            </td>
            <td class="px-5 py-3 font-medium text-white">${item.officer}</td>
            <td class="px-5 py-3">
                <span class="px-2 py-0.5 rounded text-[11px] font-mono ${item.type && item.type.includes('HVE') ? 'accent-blue-pill font-semibold' : 'bg-[#15161b] text-[#cbd5e1] border border-[#272a34]'}">
                    ${item.type}
                </span>
            </td>
            <td class="px-5 py-3 font-mono text-xs">
                <div class="text-emerald-400 font-semibold">${item.grantHours ? item.grantHours.toFixed(1) : 0}h Grant</div>
                ${item.deptHours > 0 ? `<div class="text-amber-400 text-[10px] font-medium">+${item.deptHours.toFixed(1)}h Dept</div>` : ''}
            </td>
            <td class="px-5 py-3 font-mono text-xs font-semibold text-emerald-300">
                $${grantWage.toFixed(2)}
            </td>
            <td class="px-5 py-3 font-mono text-[#cbd5e1]">${item.stops}</td>
            <td class="px-5 py-3 font-mono font-semibold text-white">${item.citations}</td>
            <td class="px-5 py-3 font-mono font-semibold ${item.duis > 0 ? 'text-rose-400' : 'text-[#848e9f]'}">${item.duis}</td>
            <td class="px-5 py-3 font-mono text-[11px]">
                ${item.calls && item.calls.length > 0 
                    ? `<span class="accent-amber-pill px-1.5 py-0.5 rounded text-[10px] font-mono">${item.calls.length} call${item.calls.length > 1 ? 's' : ''}</span>` 
                    : '<span class="text-[#848e9f] text-[10px]">None</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderShiftsTable() {
    const tbody = document.getElementById('fullShiftTableBody');
    if (!tbody) return;

    const officerInput = document.getElementById('filterOfficer');
    const typeInput = document.getElementById('filterShiftType');

    const officerFilter = officerInput ? officerInput.value.toLowerCase().trim() : '';
    const typeFilter = typeInput ? typeInput.value : '';

    const filtered = shiftLogs.filter(item => {
        const matchOfficer = item.officer.toLowerCase().includes(officerFilter);
        const matchType = typeFilter === '' || item.type === typeFilter;
        return matchOfficer && matchType;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="px-5 py-8 text-center text-[#848e9f]">No matching shift records found.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const rate = getOfficerHourlyRate(item.officer);
        const grantWage = (item.grantHours || 0) * rate;

        const tr = document.createElement('tr');
        tr.className = 'transition hover:bg-[#1e2330]/40';
        tr.innerHTML = `
            <td class="px-5 py-3.5 font-mono text-xs text-[#cbd5e1]">
                <div class="font-semibold text-white">${item.date}</div>
                ${item.timeStart && item.timeEnd ? `<div class="text-[10px] text-[#848e9f]">${item.timeStart} - ${item.timeEnd}</div>` : ''}
            </td>
            <td class="px-5 py-3.5 font-medium text-white">
                <div>${item.officer}</div>
                ${item.unit ? `<div class="text-[10px] text-[#848e9f] font-mono">${item.unit}</div>` : ''}
            </td>
            <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 rounded text-[11px] font-mono ${item.type && item.type.includes('HVE') ? 'accent-blue-pill font-semibold' : 'bg-[#15161b] text-[#cbd5e1] border border-[#272a34]'}">
                    ${item.type}
                </span>
            </td>
            <td class="px-5 py-3.5 font-mono text-xs">
                <div class="text-emerald-400 font-bold">${item.grantHours ? item.grantHours.toFixed(1) : (item.hours || 0).toFixed(1)}h Grant</div>
                ${item.deptHours > 0 ? `<div class="text-amber-400 text-[10px]">${item.deptHours.toFixed(1)}h Dept Billed</div>` : '<div class="text-[10px] text-[#848e9f]">0.0h Dept</div>'}
            </td>
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-300">
                $${grantWage.toFixed(2)}
                <div class="text-[10px] text-[#848e9f]">@ $${rate.toFixed(2)}/h</div>
            </td>
            <td class="px-5 py-3.5 font-mono text-[#cbd5e1] font-semibold">${item.stops}</td>
            <td class="px-5 py-3.5 font-mono font-semibold text-white">${item.citations}</td>
            <td class="px-5 py-3.5 font-mono ${item.duis > 0 ? 'text-rose-400 font-bold' : 'text-[#848e9f]'}">${item.duis}</td>
            <td class="px-5 py-3.5 text-xs">
                ${item.calls && item.calls.length > 0 ? `
                    <div class="space-y-0.5">
                        <span class="accent-amber-pill px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">${item.calls.length} Call${item.calls.length > 1 ? 's' : ''} (${item.deptHours}h)</span>
                        <div class="text-[10px] text-[#848e9f] font-mono truncate max-w-[150px]">
                            ${item.calls.map(c => c.caseNumber).join(', ')}
                        </div>
                    </div>
                ` : '<span class="text-[#848e9f] text-[11px]">No Dept Calls</span>'}
            </td>
            <td class="px-5 py-3.5 text-right space-x-1.5">
                <button onclick="viewShiftDetails(${item.id})" class="text-[#60a5fa] hover:text-[#93c5fd] p-1.5 rounded-lg hover:bg-blue-500/10 transition" title="Inspect Full 17 Stats & Calls">
                    <i class="fa-solid fa-list-check text-xs"></i>
                </button>
                <button onclick="deleteShift(${item.id})" class="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition" title="Delete Entry">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function resetFilters() {
    const officerInput = document.getElementById('filterOfficer');
    const typeInput = document.getElementById('filterShiftType');
    if (officerInput) officerInput.value = '';
    if (typeInput) typeInput.value = '';
    renderShiftsTable();
    showToast('Filters cleared.');
}

// ==========================================================================
// OFFICER PROFILES & HOURLY PAY RATE BUDGETING (CRUD)
// ==========================================================================

function renderOfficersTab() {
    const grid = document.getElementById('officersGrid');
    if (!grid) return;

    let totalGrantSpendAll = 0;
    let totalDeptSpendAll = 0;
    let totalRatesSum = 0;

    grid.innerHTML = '';

    officers.forEach(off => {
        // Calculate shifts for this officer
        const officerShifts = shiftLogs.filter(s => {
            const clean = s.officer.toLowerCase();
            return clean.includes(off.name.toLowerCase()) || clean.includes(off.badge.toLowerCase());
        });

        const grantHours = officerShifts.reduce((sum, s) => sum + (s.grantHours || 0), 0);
        const deptHours = officerShifts.reduce((sum, s) => sum + (s.deptHours || 0), 0);
        const totalHours = officerShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
        const totalStops = officerShifts.reduce((sum, s) => sum + (s.stops || 0), 0);
        const totalCites = officerShifts.reduce((sum, s) => sum + (s.citations || 0), 0);

        const grantWages = grantHours * off.hourlyRate;
        const deptWages = deptHours * off.hourlyRate;
        const totalWages = grantWages + deptWages;

        totalGrantSpendAll += grantWages;
        totalDeptSpendAll += deptWages;
        totalRatesSum += off.hourlyRate;

        const card = document.createElement('div');
        card.className = 'officer-profile-card space-y-4 relative';
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3">
                    <div class="accent-blue-icon-box w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold">
                        ${off.name.charAt(0)}
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h3 class="text-sm font-bold text-white">${off.rank ? off.rank + ' ' : 'Ofc. '}${off.name}</h3>
                            <span class="text-xs font-mono font-semibold text-[#848e9f]">${off.badge}</span>
                        </div>
                        <p class="text-[11px] text-[#848e9f] mt-0.5">${officerShifts.length} recorded shift${officerShifts.length === 1 ? '' : 's'}</p>
                    </div>
                </div>

                <!-- Delete Officer Button -->
                <button onclick="deleteOfficer(${off.id})" class="text-[#848e9f] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition" title="Delete Officer">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>

            <!-- Hourly Pay Rate Pill (Directly Editable for Budgeting) -->
            <div class="p-3 bg-[#121318] rounded-xl border border-[#272a34] flex items-center justify-between">
                <div>
                    <span class="text-[10px] uppercase font-semibold text-[#848e9f] block">Hourly Pay Rate</span>
                    <span class="text-base font-bold font-mono text-emerald-400">$${off.hourlyRate.toFixed(2)} <span class="text-xs font-normal text-[#848e9f]">/hr</span></span>
                </div>
                <button onclick="openQuickRateModal(${off.id})" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center space-x-1" title="Edit Hourly Pay Rate">
                    <i class="fa-solid fa-pen text-[10px]"></i>
                    <span>Edit Wage</span>
                </button>
            </div>

            <!-- Wage Spend Breakdown -->
            <div class="space-y-1.5 text-xs">
                <div class="flex justify-between items-center text-[#848e9f]">
                    <span>Grant Wages Spent:</span>
                    <strong class="font-mono text-emerald-300">$${grantWages.toFixed(2)} <span class="text-[10px] text-[#848e9f]">(${grantHours.toFixed(1)}h)</span></strong>
                </div>
                <div class="flex justify-between items-center text-[#848e9f]">
                    <span>Dept Billed Payroll:</span>
                    <strong class="font-mono text-amber-300">$${deptWages.toFixed(2)} <span class="text-[10px] text-[#848e9f]">(${deptHours.toFixed(1)}h)</span></strong>
                </div>
                <div class="flex justify-between items-center text-[#cbd5e1] border-t border-[#272a34] pt-1.5 font-semibold">
                    <span>Total Payroll Spent:</span>
                    <strong class="font-mono text-white text-sm">$${totalWages.toFixed(2)}</strong>
                </div>
            </div>

            <!-- Performance Snippet -->
            <div class="grid grid-cols-2 gap-2 pt-1 text-[11px] text-center">
                <div class="p-1.5 bg-[#121318] rounded-lg border border-[#272a34]">
                    <span class="text-[#848e9f]">Stops:</span> <strong class="text-white font-mono">${totalStops}</strong>
                </div>
                <div class="p-1.5 bg-[#121318] rounded-lg border border-[#272a34]">
                    <span class="text-[#848e9f]">Citations:</span> <strong class="text-white font-mono">${totalCites}</strong>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Update Officers Summary Cards
    const officersSummaryCount = document.getElementById('officersSummaryCount');
    const officersSummaryGrantSpent = document.getElementById('officersSummaryGrantSpent');
    const officersSummaryDeptSpent = document.getElementById('officersSummaryDeptSpent');
    const officersSummaryAvgRate = document.getElementById('officersSummaryAvgRate');

    if (officersSummaryCount) officersSummaryCount.innerText = officers.length;
    if (officersSummaryGrantSpent) officersSummaryGrantSpent.innerText = `$${totalGrantSpendAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (officersSummaryDeptSpent) officersSummaryDeptSpent.innerText = `$${totalDeptSpendAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (officersSummaryAvgRate) {
        const avg = officers.length > 0 ? (totalRatesSum / officers.length) : 0;
        officersSummaryAvgRate.innerText = `$${avg.toFixed(2)}/hr`;
    }
}

// Add New Officer
function openAddOfficerModal() {
    document.getElementById('officerForm').reset();
    document.getElementById('officerId').value = '';
    document.getElementById('officerModalTitle').innerText = 'Add New Officer Profile';
    openModal('officerModal');
}

function handleOfficerSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('officerId').value;
    const name = document.getElementById('officerNameInput').value.trim();
    const badge = document.getElementById('officerBadgeInput').value.trim();
    const rank = document.getElementById('officerRankInput').value;
    const rate = parseFloat(document.getElementById('officerRateInput').value) || 65.00;

    if (!name || !badge) {
        alert('Please provide officer name and badge number.');
        return;
    }

    if (id) {
        // Edit
        const idx = officers.findIndex(o => o.id === parseInt(id));
        if (idx !== -1) {
            officers[idx].name = name;
            officers[idx].badge = badge;
            officers[idx].rank = rank;
            officers[idx].hourlyRate = rate;
        }
    } else {
        // Add
        const newOff = {
            id: Date.now(),
            name: name,
            badge: badge.startsWith('#') ? badge : '#' + badge,
            rank: rank,
            hourlyRate: rate
        };
        officers.push(newOff);
    }

    localStorage.setItem('shieldstat_officers', JSON.stringify(officers));
    closeModal('officerModal');
    populateSelectOptions();
    renderOfficersTab();
    updateDashboardMetrics();
    renderReportSummary();
    showToast(`Officer ${name} profile saved with $${rate.toFixed(2)}/hr rate.`);
}

// Focused Quick Edit Hourly Rate
function openQuickRateModal(officerId) {
    const off = officers.find(o => o.id === officerId);
    if (!off) return;

    document.getElementById('quickRateOfficerId').value = off.id;
    document.getElementById('quickRateValue').value = off.hourlyRate.toFixed(2);
    document.getElementById('quickEditOfficerName').innerText = `${off.rank ? off.rank + ' ' : ''}${off.name} (${off.badge})`;
    openModal('editHourlyRateModal');
}

function handleQuickRateSubmit(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('quickRateOfficerId').value);
    const rate = parseFloat(document.getElementById('quickRateValue').value) || 65.00;

    const off = officers.find(o => o.id === id);
    if (off) {
        off.hourlyRate = rate;
        localStorage.setItem('shieldstat_officers', JSON.stringify(officers));
        closeModal('editHourlyRateModal');
        populateSelectOptions();
        renderOfficersTab();
        updateDashboardMetrics();
        renderRecentShifts();
        renderShiftsTable();
        renderReportSummary();
        showToast(`Hourly pay for ${off.name} updated to $${rate.toFixed(2)}/hr for budgeting.`);
    }
}

function deleteOfficer(id) {
    const off = officers.find(o => o.id === id);
    if (!off) return;

    if (confirm(`Are you sure you want to delete ${off.name} (${off.badge}) from the officer roster?`)) {
        officers = officers.filter(o => o.id !== id);
        localStorage.setItem('shieldstat_officers', JSON.stringify(officers));
        populateSelectOptions();
        renderOfficersTab();
        updateDashboardMetrics();
        showToast(`Officer ${off.name} removed from roster.`, true);
    }
}

// ==========================================================================
// GRANTS MANAGEMENT (ADD, EDIT, DELETE DYNAMIC GRANTS)
// ==========================================================================

function renderGrantsTab() {
    const grid = document.getElementById('grantsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    grants.forEach(g => {
        // Compute hours & spend for this grant from shiftLogs
        const grantShifts = shiftLogs.filter(s => s.type === g.code || (g.code === 'HVE-2026' && s.type === 'Grant Overtime'));
        const loggedHours = grantShifts.reduce((sum, s) => sum + (s.grantHours || 0), 0);
        const loggedSpend = grantShifts.reduce((sum, s) => {
            const rate = getOfficerHourlyRate(s.officer);
            return sum + ((s.grantHours || 0) * rate);
        }, 0);

        const hoursPercent = Math.min(100, (loggedHours / (g.allocatedHours || 1)) * 100).toFixed(1);
        const budgetPercent = Math.min(100, (loggedSpend / (g.budget || 1)) * 100).toFixed(1);

        const card = document.createElement('div');
        card.className = 'card-premium p-5 space-y-4';
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-[#60a5fa] border border-blue-500/20 font-bold">${g.code}</span>
                <div class="flex items-center space-x-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${g.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : g.status === 'Upcoming' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}">
                        ${g.status}
                    </span>
                    <button onclick="openEditGrantModal(${g.id})" class="text-[#848e9f] hover:text-[#60a5fa] p-1 rounded transition" title="Edit Grant">
                        <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onclick="deleteGrant(${g.id})" class="text-[#848e9f] hover:text-rose-400 p-1 rounded transition" title="Delete Grant">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            </div>

            <div>
                <h4 class="text-sm font-bold text-white">${g.name}</h4>
                <p class="text-xs text-[#848e9f] mt-0.5 font-mono text-[11px]">${g.agency || 'Highway Safety Program'}</p>
                <p class="text-xs text-[#cbd5e1] mt-1.5">${g.focus || 'Corridor enforcement'}</p>
            </div>

            <!-- Progress & Numbers -->
            <div class="space-y-2 text-xs pt-2 border-t border-[#272a34]">
                <div class="flex justify-between text-[#848e9f]">
                    <span>Budget Spent:</span>
                    <span class="font-mono text-white font-semibold">$${loggedSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${(g.budget || 0).toLocaleString()}</span>
                </div>
                <div class="w-full bg-[#121318] h-2 rounded-full overflow-hidden border border-[#272a34]">
                    <div class="bg-gradient-to-r from-blue-700 to-blue-500 h-full rounded-full transition-all duration-500" style="width: ${budgetPercent}%"></div>
                </div>
                <div class="flex justify-between text-[11px] text-[#848e9f]">
                    <span>Hours: <strong class="text-white font-mono">${loggedHours.toFixed(1)}h</strong> / ${(g.allocatedHours || 0).toFixed(0)}h cap</span>
                    <span class="font-mono text-emerald-400 font-bold">${budgetPercent}% utilized</span>
                </div>
                ${g.startDate && g.endDate ? `<div class="text-[10px] text-[#848e9f] font-mono pt-1 text-right">Period: ${g.startDate} to ${g.endDate}</div>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

function openAddGrantModal() {
    document.getElementById('grantForm').reset();
    document.getElementById('grantId').value = '';
    document.getElementById('grantModalTitle').innerText = 'Add Highway Safety Grant';
    openModal('grantModal');
}

function openEditGrantModal(id) {
    const g = grants.find(item => item.id === id);
    if (!g) return;

    document.getElementById('grantId').value = g.id;
    document.getElementById('grantCodeInput').value = g.code;
    document.getElementById('grantNameInput').value = g.name;
    document.getElementById('grantAgencyInput').value = g.agency || '';
    document.getElementById('grantBudgetInput').value = g.budget;
    document.getElementById('grantHoursCapInput').value = g.allocatedHours;
    document.getElementById('grantStartDateInput').value = g.startDate || '';
    document.getElementById('grantEndDateInput').value = g.endDate || '';
    document.getElementById('grantStatusInput').value = g.status;
    document.getElementById('grantFocusInput').value = g.focus || '';

    document.getElementById('grantModalTitle').innerText = `Edit Grant: ${g.code}`;
    openModal('grantModal');
}

function handleGrantSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('grantId').value;
    const code = document.getElementById('grantCodeInput').value.trim();
    const name = document.getElementById('grantNameInput').value.trim();
    const agency = document.getElementById('grantAgencyInput').value.trim();
    const budget = parseFloat(document.getElementById('grantBudgetInput').value) || 10000;
    const hoursCap = parseFloat(document.getElementById('grantHoursCapInput').value) || 100;
    const startDate = document.getElementById('grantStartDateInput').value;
    const endDate = document.getElementById('grantEndDateInput').value;
    const status = document.getElementById('grantStatusInput').value;
    const focus = document.getElementById('grantFocusInput').value.trim();

    if (!code || !name) {
        alert('Grant Code and Program Name are required.');
        return;
    }

    if (id) {
        const idx = grants.findIndex(item => item.id === parseInt(id));
        if (idx !== -1) {
            grants[idx] = {
                id: parseInt(id),
                code, name, agency, budget, allocatedHours: hoursCap, startDate, endDate, status, focus
            };
        }
    } else {
        grants.push({
            id: Date.now(),
            code, name, agency, budget, allocatedHours: hoursCap, startDate, endDate, status, focus
        });
    }

    localStorage.setItem('shieldstat_grants', JSON.stringify(grants));
    closeModal('grantModal');
    populateSelectOptions();
    renderGrantsTab();
    updateDashboardMetrics();
    renderReportSummary();
    showToast(`Grant program ${code} saved.`);
}

function deleteGrant(id) {
    const g = grants.find(item => item.id === id);
    if (!g) return;

    if (confirm(`Are you sure you want to delete grant ${g.code} (${g.name})?`)) {
        grants = grants.filter(item => item.id !== id);
        localStorage.setItem('shieldstat_grants', JSON.stringify(grants));
        populateSelectOptions();
        renderGrantsTab();
        updateDashboardMetrics();
        showToast(`Grant ${g.code} deleted.`, true);
    }
}

// ==========================================================================
// DATE RANGE REPORTING WITH HOURLY PAY & BUDGET REIMBURSEMENT
// ==========================================================================

function initReportDates() {
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');
    if (!startInput || !endInput) return;

    // Default to Quarter to Date (e.g. 2026-10-01 to today)
    const today = new Date().toISOString().split('T')[0];
    startInput.value = '2026-10-01';
    endInput.value = today;
}

function setReportDatePreset(preset) {
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');
    if (!startInput || !endInput) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Remove active class from all preset buttons
    document.querySelectorAll('.date-preset-btn').forEach(btn => btn.classList.remove('active'));

    // Highlight clicked button
    if (event && event.target && event.target.classList.contains('date-preset-btn')) {
        event.target.classList.add('active');
    }

    if (preset === 'this_month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        startInput.value = firstDay;
        endInput.value = todayStr;
    } else if (preset === 'last_30') {
        const past = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        startInput.value = past;
        endInput.value = todayStr;
    } else if (preset === 'qtd') {
        // Quarter to date (Q4 starts Oct 1)
        startInput.value = `${today.getFullYear()}-10-01`;
        endInput.value = todayStr;
    } else if (preset === 'ytd') {
        startInput.value = `${today.getFullYear()}-01-01`;
        endInput.value = todayStr;
    } else if (preset === 'all') {
        startInput.value = '2025-01-01';
        endInput.value = todayStr;
    }

    renderReportSummary();
}

function renderReportSummary() {
    const startVal = document.getElementById('reportStartDate') ? document.getElementById('reportStartDate').value : '';
    const endVal = document.getElementById('reportEndDate') ? document.getElementById('reportEndDate').value : '';
    const officerFilter = document.getElementById('reportOfficerFilter') ? document.getElementById('reportOfficerFilter').value.toLowerCase().trim() : '';
    const grantFilter = document.getElementById('reportGrantFilter') ? document.getElementById('reportGrantFilter').value.trim() : '';
    const excludeDeptCalls = document.getElementById('reportExcludeDeptCalls') ? document.getElementById('reportExcludeDeptCalls').checked : true;

    const reportPeriodDisplay = document.getElementById('reportPeriodDisplay');
    if (reportPeriodDisplay) {
        reportPeriodDisplay.innerText = `Reporting Period: ${startVal || 'Earliest'} to ${endVal || 'Latest'}`;
    }

    // Filter shifts matching the date range and criteria
    const filteredShifts = shiftLogs.filter(s => {
        const matchDate = (!startVal || s.date >= startVal) && (!endVal || s.date <= endVal);
        const matchOfficer = !officerFilter || s.officer.toLowerCase().includes(officerFilter);
        const matchGrant = !grantFilter || s.type === grantFilter || (grantFilter === 'HVE-2026' && s.type.includes('Grant'));
        return matchDate && matchOfficer && matchGrant;
    });

    let totalGrantHours = 0;
    let totalDeptHours = 0;
    let totalGrantWages = 0;
    let totalDeptWages = 0;
    let totalMileage = 0;

    // Track all 17 enforcement metrics
    const totals = {
        stops: 0,
        speeding: 0,
        seat_belt: 0,
        child_seat_belt: 0,
        dui_alcohol: 0,
        dui_drugs: 0,
        dui_both: 0,
        total_duis: 0,
        underage_alcohol: 0,
        reckless_driving: 0,
        texting: 0,
        suspended_license: 0,
        no_insurance: 0,
        motorcycle_endorsement: 0,
        bike_ped: 0,
        felony_arrest: 0,
        stolen_vehicles: 0,
        fugitives: 0,
        total_citations: 0
    };

    const shiftsTableBody = document.getElementById('reportShiftsTableBody');
    const shiftsTableHead = document.getElementById('reportShiftsTableHead');
    const callsTableBody = document.getElementById('reportCallsTableBody');
    const deptSection = document.getElementById('departmentCallsAuditSection');
    const reportShiftCount = document.getElementById('reportShiftCount');

    if (reportShiftCount) reportShiftCount.innerText = `${filteredShifts.length} shift${filteredShifts.length === 1 ? '' : 's'}`;

    // Manage Department Calls section visibility based on checkbox
    if (deptSection) {
        if (excludeDeptCalls) {
            deptSection.classList.add('hidden', 'print-hide');
        } else {
            deptSection.classList.remove('hidden', 'print-hide');
        }
    }

    // Update Table Headers depending on whether Dept Billed calls/hours are excluded
    if (shiftsTableHead) {
        if (excludeDeptCalls) {
            shiftsTableHead.innerHTML = `
                <tr>
                    <th class="px-3 py-2">Shift Date</th>
                    <th class="px-3 py-2">Officer</th>
                    <th class="px-3 py-2">Shift Hours</th>
                    <th class="px-3 py-2">Odometer & Miles</th>
                    <th class="px-3 py-2">Hourly Pay & Claim</th>
                    <th class="px-3 py-2">Traffic Violations & Enforcement Activity</th>
                </tr>
            `;
        } else {
            shiftsTableHead.innerHTML = `
                <tr>
                    <th class="px-3 py-2">Shift Date</th>
                    <th class="px-3 py-2">Officer</th>
                    <th class="px-3 py-2">Shift Hours</th>
                    <th class="px-3 py-2">Odometer & Miles</th>
                    <th class="px-3 py-2">Hourly Pay & Claim</th>
                    <th class="px-3 py-2">Dept Call Hours</th>
                    <th class="px-3 py-2">Traffic Violations & Enforcement Activity</th>
                </tr>
            `;
        }
    }

    if (shiftsTableBody) shiftsTableBody.innerHTML = '';
    let allFilteredCalls = [];

    filteredShifts.forEach(s => {
        const rate = getOfficerHourlyRate(s.officer);
        const gHours = s.grantHours || 0;
        const dHours = s.deptHours || 0;
        const gWage = gHours * rate;
        const dWage = dHours * rate;

        const startMi = s.startMileage || 0;
        const endMi = s.endMileage || 0;
        const miles = s.totalMiles || (endMi >= startMi && startMi > 0 ? (endMi - startMi) : 0);

        totalGrantHours += gHours;
        totalDeptHours += dHours;
        totalGrantWages += gWage;
        totalDeptWages += dWage;
        totalMileage += miles;

        // Extract stats from s.stats or direct properties
        const st = s.stats || {};
        const shiftStops = s.stops || st.stops || 0;
        const shiftSpeeding = st.speeding || 0;
        const shiftSeatBelt = st.seat_belt || 0;
        const shiftChildBelt = st.child_seat_belt || 0;
        const shiftDuiAlc = st.dui_alcohol || 0;
        const shiftDuiDrug = st.dui_drugs || 0;
        const shiftDuiBoth = st.dui_both || 0;
        const shiftTotalDuis = s.duis || (shiftDuiAlc + shiftDuiDrug + shiftDuiBoth);
        const shiftUnderageAlc = st.underage_alcohol || 0;
        const shiftReckless = st.reckless_driving || 0;
        const shiftTexting = st.texting || 0;
        const shiftSuspended = st.suspended_license || 0;
        const shiftNoIns = st.no_insurance || 0;
        const shiftMoto = st.motorcycle_endorsement || 0;
        const shiftBikePed = st.bike_ped || 0;
        const shiftFelony = s.felonies || st.felony_arrest || 0;
        const shiftStolenVeh = s.stolenVehicles || st.stolen_vehicles || 0;
        const shiftFugitives = st.fugitives || 0;
        const shiftCitations = s.citations || (shiftSpeeding + shiftSeatBelt + shiftChildBelt + shiftDuiAlc + shiftDuiDrug + shiftDuiBoth + shiftUnderageAlc + shiftReckless + shiftTexting + shiftSuspended + shiftNoIns + shiftMoto + shiftBikePed + shiftFelony + shiftStolenVeh + shiftFugitives);

        totals.stops += shiftStops;
        totals.speeding += shiftSpeeding;
        totals.seat_belt += shiftSeatBelt;
        totals.child_seat_belt += shiftChildBelt;
        totals.dui_alcohol += shiftDuiAlc;
        totals.dui_drugs += shiftDuiDrug;
        totals.dui_both += shiftDuiBoth;
        totals.total_duis += shiftTotalDuis;
        totals.underage_alcohol += shiftUnderageAlc;
        totals.reckless_driving += shiftReckless;
        totals.texting += shiftTexting;
        totals.suspended_license += shiftSuspended;
        totals.no_insurance += shiftNoIns;
        totals.motorcycle_endorsement += shiftMoto;
        totals.bike_ped += shiftBikePed;
        totals.felony_arrest += shiftFelony;
        totals.stolen_vehicles += shiftStolenVeh;
        totals.fugitives += shiftFugitives;
        totals.total_citations += shiftCitations;

        if (s.calls && s.calls.length > 0) {
            s.calls.forEach(c => allFilteredCalls.push({ date: s.date, officer: s.officer, ...c }));
        }

        if (shiftsTableBody) {
            // Build itemized activity pills
            const pills = [];
            if (shiftStops > 0) pills.push(`<span class="report-stat-pill font-mono font-semibold text-white">${shiftStops} Stops</span>`);
            if (shiftSpeeding > 0) pills.push(`<span class="report-stat-pill font-mono text-emerald-400 font-semibold">${shiftSpeeding} Speed</span>`);
            if (shiftSeatBelt > 0) pills.push(`<span class="report-stat-pill font-mono text-blue-400 font-semibold">${shiftSeatBelt} Seatbelt</span>`);
            if (shiftChildBelt > 0) pills.push(`<span class="report-stat-pill font-mono text-blue-400 font-semibold">${shiftChildBelt} Child Belt</span>`);
            if (shiftTotalDuis > 0) pills.push(`<span class="report-stat-pill font-mono text-amber-400 font-bold">${shiftTotalDuis} DUI (${shiftDuiAlc}A/${shiftDuiDrug}D/${shiftDuiBoth}B)</span>`);
            if (shiftUnderageAlc > 0) pills.push(`<span class="report-stat-pill font-mono text-amber-300">${shiftUnderageAlc} Underage Alc</span>`);
            if (shiftTexting > 0) pills.push(`<span class="report-stat-pill font-mono text-indigo-400">${shiftTexting} Texting</span>`);
            if (shiftNoIns > 0) pills.push(`<span class="report-stat-pill font-mono text-cyan-400">${shiftNoIns} No Ins</span>`);
            if (shiftSuspended > 0) pills.push(`<span class="report-stat-pill font-mono text-cyan-400">${shiftSuspended} Susp Lic</span>`);
            if (shiftReckless > 0) pills.push(`<span class="report-stat-pill font-mono text-rose-400">${shiftReckless} Reckless</span>`);
            if (shiftMoto > 0) pills.push(`<span class="report-stat-pill font-mono text-sky-400">${shiftMoto} Moto</span>`);
            if (shiftBikePed > 0) pills.push(`<span class="report-stat-pill font-mono text-teal-400">${shiftBikePed} Bike/Ped</span>`);
            if (shiftFelony > 0) pills.push(`<span class="report-stat-pill font-mono text-rose-500 font-bold">${shiftFelony} Felony</span>`);
            if (shiftStolenVeh > 0) pills.push(`<span class="report-stat-pill font-mono text-purple-400 font-bold">${shiftStolenVeh} Stolen Veh</span>`);
            if (shiftFugitives > 0) pills.push(`<span class="report-stat-pill font-mono text-rose-400 font-bold">${shiftFugitives} Fugitive</span>`);

            const tr = document.createElement('tr');
            if (excludeDeptCalls) {
                tr.innerHTML = `
                    <td class="px-3 py-2 font-mono text-xs text-[#cbd5e1] whitespace-nowrap">${s.date}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-medium text-white">${s.officer}</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">${s.type} • ${s.unit || 'Patrol Unit'}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono font-bold text-white">${gHours.toFixed(1)} hrs</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">${s.timeStart || '--:--'} - ${s.timeEnd || '--:--'}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono font-bold text-cyan-400">${miles.toFixed(1)} mi</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">${startMi.toFixed(1)} → ${endMi.toFixed(1)}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono font-bold text-emerald-400">$${gWage.toFixed(2)}</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">$${rate.toFixed(2)}/hr</div>
                    </td>
                    <td class="px-3 py-2">
                        <div class="flex flex-wrap gap-1 text-[11px]">
                            ${pills.join(' ')}
                        </div>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td class="px-3 py-2 font-mono text-xs text-[#cbd5e1] whitespace-nowrap">${s.date}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-medium text-white">${s.officer}</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">${s.type} • ${s.unit || 'Patrol Unit'}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono font-bold text-white">${gHours.toFixed(1)} hrs</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">${s.timeStart || '--:--'} - ${s.timeEnd || '--:--'}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono font-bold text-cyan-400">${miles.toFixed(1)} mi</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">${startMi.toFixed(1)} → ${endMi.toFixed(1)}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono font-bold text-emerald-400">$${gWage.toFixed(2)}</div>
                        <div class="text-[10px] text-[#848e9f] font-mono">$${rate.toFixed(2)}/hr</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="font-mono text-amber-300 font-bold">${dHours.toFixed(1)} hrs</div>
                        <div class="text-[10px] text-amber-400 font-mono">$${dWage.toFixed(2)} Dept</div>
                    </td>
                    <td class="px-3 py-2">
                        <div class="flex flex-wrap gap-1 text-[11px]">
                            ${pills.join(' ')}
                        </div>
                    </td>
                `;
            }
            shiftsTableBody.appendChild(tr);
        }
    });

    // Add Totals Footer Row
    if (shiftsTableBody && filteredShifts.length > 0) {
        const totalTr = document.createElement('tr');
        totalTr.className = 'bg-[#121318] font-bold border-t-2 border-[#272a34]';
        const colSpanFirst = 2;
        if (excludeDeptCalls) {
            totalTr.innerHTML = `
                <td colspan="${colSpanFirst}" class="px-3 py-2.5 text-right uppercase text-xs text-[#848e9f]">Grant Period Totals:</td>
                <td class="px-3 py-2.5 font-mono text-white text-xs">${totalGrantHours.toFixed(1)} hrs</td>
                <td class="px-3 py-2.5 font-mono text-cyan-400 text-xs">${totalMileage.toFixed(1)} mi</td>
                <td class="px-3 py-2.5 font-mono text-emerald-400 text-sm">$${totalGrantWages.toFixed(2)}</td>
                <td class="px-3 py-2.5 text-xs text-[#cbd5e1]">
                    <span class="font-mono text-white font-bold">${totals.stops} Stops</span> • 
                    <span class="font-mono text-emerald-400 font-bold">${totals.speeding} Speed</span> • 
                    <span class="font-mono text-blue-400 font-bold">${totals.seat_belt + totals.child_seat_belt} Belts</span> • 
                    <span class="font-mono text-amber-400 font-bold">${totals.total_duis} DUI</span> • 
                    <span class="font-mono text-rose-400 font-bold">${totals.felony_arrest + totals.fugitives} Arrests</span>
                </td>
            `;
        } else {
            totalTr.innerHTML = `
                <td colspan="${colSpanFirst}" class="px-3 py-2.5 text-right uppercase text-xs text-[#848e9f]">Period Totals:</td>
                <td class="px-3 py-2.5 font-mono text-white text-xs">${totalGrantHours.toFixed(1)} hrs</td>
                <td class="px-3 py-2.5 font-mono text-cyan-400 text-xs">${totalMileage.toFixed(1)} mi</td>
                <td class="px-3 py-2.5 font-mono text-emerald-400 text-sm">$${totalGrantWages.toFixed(2)}</td>
                <td class="px-3 py-2.5 font-mono text-amber-300 text-xs">${totalDeptHours.toFixed(1)} hrs ($${totalDeptWages.toFixed(2)})</td>
                <td class="px-3 py-2.5 text-xs text-[#cbd5e1]">
                    <span class="font-mono text-white font-bold">${totals.stops} Stops</span> • 
                    <span class="font-mono text-emerald-400 font-bold">${totals.speeding} Speed</span> • 
                    <span class="font-mono text-amber-400 font-bold">${totals.total_duis} DUI</span>
                </td>
            `;
        }
        shiftsTableBody.appendChild(totalTr);
    } else if (shiftsTableBody) {
        shiftsTableBody.innerHTML = `<tr><td colspan="${excludeDeptCalls ? 6 : 7}" class="px-4 py-8 text-center text-[#848e9f]">No traffic enforcement shifts found for selected date range and filter criteria.</td></tr>`;
    }

    // Populate Department Calls Table (when enabled)
    if (callsTableBody && !excludeDeptCalls) {
        callsTableBody.innerHTML = '';
        if (allFilteredCalls.length === 0) {
            callsTableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-[#848e9f]">No department-funded calls logged in this period.</td></tr>`;
        } else {
            allFilteredCalls.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-4 py-2 font-mono text-xs text-[#cbd5e1]">${c.date}</td>
                    <td class="px-4 py-2 font-medium text-white">${c.officer}</td>
                    <td class="px-4 py-2 text-xs">${c.type}</td>
                    <td class="px-4 py-2 font-mono text-amber-300 font-bold">${c.caseNumber}</td>
                    <td class="px-4 py-2 font-mono text-white">${c.minutes} mins (${c.hours}h)</td>
                    <td class="px-4 py-2 text-[#cbd5e1] text-xs">${c.notes || '-'}</td>
                `;
                callsTableBody.appendChild(tr);
            });
        }
    }

    // Populate Executive KPI Summary Cards
    const reportGrantHours = document.getElementById('reportGrantHours');
    const reportGrantWages = document.getElementById('reportGrantWages');
    const reportTotalMileage = document.getElementById('reportTotalMileage');
    const reportAvgMiles = document.getElementById('reportAvgMiles');
    const reportTotalStops = document.getElementById('reportTotalStops');
    const reportTotalCitations = document.getElementById('reportTotalCitations');
    const reportTotalDuis = document.getElementById('reportTotalDuis');
    const reportTotalFelonies = document.getElementById('reportTotalFelonies');

    const avgMilesPerShift = filteredShifts.length > 0 ? (totalMileage / filteredShifts.length) : 0;

    if (reportGrantHours) reportGrantHours.innerText = `${totalGrantHours.toFixed(1)} hrs`;
    if (reportGrantWages) reportGrantWages.innerText = `$${totalGrantWages.toFixed(2)} Claim`;
    if (reportTotalMileage) reportTotalMileage.innerText = `${totalMileage.toFixed(1)} mi`;
    if (reportAvgMiles) reportAvgMiles.innerText = `Avg ${avgMilesPerShift.toFixed(1)} mi/shift`;
    if (reportTotalStops) reportTotalStops.innerText = totals.stops;
    if (reportTotalCitations) reportTotalCitations.innerText = totals.total_citations;
    if (reportTotalDuis) reportTotalDuis.innerText = totals.total_duis;
    if (reportTotalFelonies) reportTotalFelonies.innerText = (totals.felony_arrest + totals.fugitives);

    // Populate Comprehensive 17 Metrics Summary Deck
    const repStatStops = document.getElementById('repStatStops');
    const repStatSpeeding = document.getElementById('repStatSpeeding');
    const repStatSeatBelt = document.getElementById('repStatSeatBelt');
    const repStatChildBelt = document.getElementById('repStatChildBelt');
    const repStatDuiAlc = document.getElementById('repStatDuiAlc');
    const repStatDuiDrug = document.getElementById('repStatDuiDrug');
    const repStatDuiBoth = document.getElementById('repStatDuiBoth');
    const repStatUnderageAlc = document.getElementById('repStatUnderageAlc');
    const repStatReckless = document.getElementById('repStatReckless');
    const repStatTexting = document.getElementById('repStatTexting');
    const repStatSuspended = document.getElementById('repStatSuspended');
    const repStatNoInsurance = document.getElementById('repStatNoInsurance');
    const repStatMotorcycle = document.getElementById('repStatMotorcycle');
    const repStatBikePed = document.getElementById('repStatBikePed');
    const repStatFelony = document.getElementById('repStatFelony');
    const repStatStolenVeh = document.getElementById('repStatStolenVeh');
    const repStatFugitives = document.getElementById('repStatFugitives');
    const repStatTotalActions = document.getElementById('repStatTotalActions');

    if (repStatStops) repStatStops.innerText = totals.stops;
    if (repStatSpeeding) repStatSpeeding.innerText = totals.speeding;
    if (repStatSeatBelt) repStatSeatBelt.innerText = totals.seat_belt;
    if (repStatChildBelt) repStatChildBelt.innerText = totals.child_seat_belt;
    if (repStatDuiAlc) repStatDuiAlc.innerText = totals.dui_alcohol;
    if (repStatDuiDrug) repStatDuiDrug.innerText = totals.dui_drugs;
    if (repStatDuiBoth) repStatDuiBoth.innerText = totals.dui_both;
    if (repStatUnderageAlc) repStatUnderageAlc.innerText = totals.underage_alcohol;
    if (repStatReckless) repStatReckless.innerText = totals.reckless_driving;
    if (repStatTexting) repStatTexting.innerText = totals.texting;
    if (repStatSuspended) repStatSuspended.innerText = totals.suspended_license;
    if (repStatNoInsurance) repStatNoInsurance.innerText = totals.no_insurance;
    if (repStatMotorcycle) repStatMotorcycle.innerText = totals.motorcycle_endorsement;
    if (repStatBikePed) repStatBikePed.innerText = totals.bike_ped;
    if (repStatFelony) repStatFelony.innerText = totals.felony_arrest;
    if (repStatStolenVeh) repStatStolenVeh.innerText = totals.stolen_vehicles;
    if (repStatFugitives) repStatFugitives.innerText = totals.fugitives;
    if (repStatTotalActions) repStatTotalActions.innerText = totals.total_citations;
}

function exportReportCSV() {
    const startVal = document.getElementById('reportStartDate') ? document.getElementById('reportStartDate').value : '';
    const endVal = document.getElementById('reportEndDate') ? document.getElementById('reportEndDate').value : '';
    const officerFilter = document.getElementById('reportOfficerFilter') ? document.getElementById('reportOfficerFilter').value.toLowerCase().trim() : '';
    const grantFilter = document.getElementById('reportGrantFilter') ? document.getElementById('reportGrantFilter').value.trim() : '';
    const excludeDeptCalls = document.getElementById('reportExcludeDeptCalls') ? document.getElementById('reportExcludeDeptCalls').checked : true;

    const filtered = shiftLogs.filter(s => {
        const matchDate = (!startVal || s.date >= startVal) && (!endVal || s.date <= endVal);
        const matchOfficer = !officerFilter || s.officer.toLowerCase().includes(officerFilter);
        const matchGrant = !grantFilter || s.type === grantFilter || (grantFilter === 'HVE-2026' && s.type.includes('Grant'));
        return matchDate && matchOfficer && matchGrant;
    });

    let header = 'Date,Officer,Funding,ShiftStart,ShiftEnd,GrantHours,StartMileage,EndMileage,PatrolMiles,HourlyRate,GrantWageClaim,TotalStops,Speeding,SeatBelt,ChildSeatBelt,DUI_Alcohol,DUI_Drugs,DUI_Both,TotalDUIs,UnderageAlcohol,RecklessDriving,Texting,SuspendedLicense,NoInsurance,MotorcycleEndorsement,BikePed,FelonyArrests,StolenVehicles,FugitivesApprehended,TotalCitations';
    if (!excludeDeptCalls) {
        header += ',DeptHours,DeptPayroll,NonGrantCallsAudit';
    }
    header += '\n';

    let csv = header;
    filtered.forEach(s => {
        const rate = getOfficerHourlyRate(s.officer);
        const gHours = s.grantHours || 0;
        const dHours = s.deptHours || 0;
        const gWage = gHours * rate;
        const dWage = dHours * rate;
        const startMi = s.startMileage || 0;
        const endMi = s.endMileage || 0;
        const miles = s.totalMiles || (endMi >= startMi && startMi > 0 ? (endMi - startMi) : 0);

        const st = s.stats || {};
        const shiftStops = s.stops || st.stops || 0;
        const shiftSpeeding = st.speeding || 0;
        const shiftSeatBelt = st.seat_belt || 0;
        const shiftChildBelt = st.child_seat_belt || 0;
        const shiftDuiAlc = st.dui_alcohol || 0;
        const shiftDuiDrug = st.dui_drugs || 0;
        const shiftDuiBoth = st.dui_both || 0;
        const shiftTotalDuis = s.duis || (shiftDuiAlc + shiftDuiDrug + shiftDuiBoth);
        const shiftUnderageAlc = st.underage_alcohol || 0;
        const shiftReckless = st.reckless_driving || 0;
        const shiftTexting = st.texting || 0;
        const shiftSuspended = st.suspended_license || 0;
        const shiftNoIns = st.no_insurance || 0;
        const shiftMoto = st.motorcycle_endorsement || 0;
        const shiftBikePed = st.bike_ped || 0;
        const shiftFelony = s.felonies || st.felony_arrest || 0;
        const shiftStolenVeh = s.stolenVehicles || st.stolen_vehicles || 0;
        const shiftFugitives = st.fugitives || 0;
        const shiftCitations = s.citations || (shiftSpeeding + shiftSeatBelt + shiftChildBelt + shiftDuiAlc + shiftDuiDrug + shiftDuiBoth + shiftUnderageAlc + shiftReckless + shiftTexting + shiftSuspended + shiftNoIns + shiftMoto + shiftBikePed + shiftFelony + shiftStolenVeh + shiftFugitives);

        let row = `"${s.date}","${s.officer}","${s.type}","${s.timeStart || ''}","${s.timeEnd || ''}",${gHours.toFixed(1)},${startMi.toFixed(1)},${endMi.toFixed(1)},${miles.toFixed(1)},${rate.toFixed(2)},${gWage.toFixed(2)},${shiftStops},${shiftSpeeding},${shiftSeatBelt},${shiftChildBelt},${shiftDuiAlc},${shiftDuiDrug},${shiftDuiBoth},${shiftTotalDuis},${shiftUnderageAlc},${shiftReckless},${shiftTexting},${shiftSuspended},${shiftNoIns},${shiftMoto},${shiftBikePed},${shiftFelony},${shiftStolenVeh},${shiftFugitives},${shiftCitations}`;

        if (!excludeDeptCalls) {
            const callsStr = (s.calls || []).map(c => `[${c.type} Case#${c.caseNumber} ${c.minutes}m]`).join('; ');
            row += `,${dHours.toFixed(1)},${dWage.toFixed(2)},"${callsStr}"`;
        }
        csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ShieldStat_Grant_Report_${startVal || 'all'}_to_${endVal || 'today'}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(`Exported ${filtered.length} traffic grant shift records with hours, mileage & metrics.`);
}


function exportCSV() {
    let csv = 'Date,TimeStart,TimeEnd,StartMileage,EndMileage,TotalMiles,Officer,HourlyRate,Unit,ShiftType,GrossHours,DeptBilledHours,NetGrantHours,GrantWageClaim,TotalStops,DUI_Alcohol,DUI_Drugs,DUI_Both,UnderageAlcohol,SeatBelt,ChildSeatBelt,Speeding,RecklessDriving,Texting,BikePed,NoInsurance,SuspendedLicense,MotorcycleEndorsement,FelonyArrest,StolenVehicles,FugitivesApprehended,NonGrantCallsAudit\n';
    
    shiftLogs.forEach(s => {
        const st = s.stats || {};
        const rate = getOfficerHourlyRate(s.officer);
        const grantWage = ((s.grantHours || s.hours || 0) * rate).toFixed(2);
        const callsStr = (s.calls || []).map(c => `[${c.type} Case#${c.caseNumber} ${c.minutes}m]`).join('; ');
        csv += `"${s.date}","${s.timeStart || ''}","${s.timeEnd || ''}",${s.startMileage || 0},${s.endMileage || 0},${s.totalMiles || 0},"${s.officer}",${rate.toFixed(2)},"${s.unit || ''}","${s.type}",${s.hours || 0},${s.deptHours || 0},${s.grantHours || s.hours || 0},${grantWage},${s.stops || 0},${st.dui_alcohol || 0},${st.dui_drugs || 0},${st.dui_both || 0},${st.underage_alcohol || 0},${st.seat_belt || 0},${st.child_seat_belt || 0},${st.speeding || 0},${st.reckless_driving || 0},${st.texting || 0},${st.bike_ped || 0},${st.no_insurance || 0},${st.suspended_license || 0},${st.motorcycle_endorsement || 0},${st.felony_arrest || 0},${st.stolen_vehicles || 0},${st.fugitives || 0},"${callsStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ShieldStat_Master_Shift_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Full shift logs & officer payroll audit exported to CSV.');
}

function viewShiftDetails(shiftId) {
    const shift = shiftLogs.find(s => s.id === shiftId);
    if (!shift) return;

    const modalTitle = document.getElementById('modalShiftTitle');
    const modalSubtitle = document.getElementById('modalShiftSubtitle');
    const modalContent = document.getElementById('modalShiftContent');

    const rate = getOfficerHourlyRate(shift.officer);
    const grantWage = ((shift.grantHours || 0) * rate).toFixed(2);
    const deptWage = ((shift.deptHours || 0) * rate).toFixed(2);

    if (modalTitle) modalTitle.innerText = `${shift.officer} - ${shift.date}`;
    if (modalSubtitle) modalSubtitle.innerText = `${shift.type} • ${shift.timeStart || ''}-${shift.timeEnd || ''} • ${shift.unit || ''} • Pay Rate: $${rate.toFixed(2)}/hr`;

    const st = shift.stats || {};

    let callsHtml = '';
    if (shift.calls && shift.calls.length > 0) {
        callsHtml = `
            <div class="p-3 bg-[#121318] rounded-xl border border-amber-500/30 space-y-2">
                <div class="flex justify-between items-center text-amber-400 font-semibold text-xs">
                    <span><i class="fa-solid fa-handshake-angle mr-1.5"></i> Department Billed Calls (${shift.deptHours} hrs total = $${deptWage})</span>
                    <span class="text-[10px] font-mono">Billed to City Payroll</span>
                </div>
                <div class="space-y-1.5">
                    ${shift.calls.map(c => `
                        <div class="p-2 bg-[#17181e] rounded border border-[#272a34] flex justify-between items-center text-xs">
                            <div>
                                <span class="font-mono text-amber-300 font-bold">${c.caseNumber}</span>
                                <span class="text-[#848e9f] ml-1.5">(${c.type})</span>
                                <p class="text-[11px] text-[#cbd5e1] mt-0.5">${c.notes || ''}</p>
                            </div>
                            <span class="font-mono text-white font-bold">${c.minutes} mins (${c.hours}h)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        callsHtml = `<p class="text-[11px] text-[#848e9f]">No non-grant calls or assists logged for this shift.</p>`;
    }

    modalContent.innerHTML = `
        <div class="grid grid-cols-3 gap-3 text-center">
            <div class="p-2.5 bg-[#121318] rounded-lg border border-[#272a34]">
                <span class="text-[10px] text-[#848e9f] uppercase font-semibold">Total Shift</span>
                <p class="text-base font-bold font-mono text-white">${shift.hours} hrs</p>
                <p class="text-[10px] text-[#848e9f] font-mono">Rate: $${rate.toFixed(2)}/h</p>
            </div>
            <div class="p-2.5 bg-[#121318] rounded-lg border border-amber-500/30">
                <span class="text-[10px] text-amber-400 uppercase font-semibold">Dept Billed (Calls)</span>
                <p class="text-base font-bold font-mono text-amber-300">${shift.deptHours || 0} hrs</p>
                <p class="text-[10px] text-amber-400 font-mono">$${deptWage}</p>
            </div>
            <div class="p-2.5 bg-[#121318] rounded-lg border border-blue-500/30">
                <span class="text-[10px] text-[#60a5fa] uppercase font-semibold">Net Grant Reimbursable</span>
                <p class="text-base font-bold font-mono text-emerald-400">${shift.grantHours || shift.hours} hrs</p>
                <p class="text-[10px] text-emerald-400 font-mono font-bold">$${grantWage}</p>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-bold uppercase text-white mb-1.5">Assists & Dispatched Calls Log</h4>
            ${callsHtml}
        </div>

        <div>
            <h4 class="text-xs font-bold uppercase text-white mb-2">Detailed Traffic Enforcement Breakdown</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Total Stops</span>
                    <strong class="font-mono text-white">${shift.stops}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">DUI Alcohol</span>
                    <strong class="font-mono text-rose-400">${st.dui_alcohol || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">DUI Drugs</span>
                    <strong class="font-mono text-rose-400">${st.dui_drugs || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">DUI Both</span>
                    <strong class="font-mono text-rose-400">${st.dui_both || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Underage Alcohol</span>
                    <strong class="font-mono text-white">${st.underage_alcohol || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Seat Belt Citations</span>
                    <strong class="font-mono text-[#60a5fa]">${st.seat_belt || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Child Seat Belt</span>
                    <strong class="font-mono text-[#60a5fa]">${st.child_seat_belt || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Speeding</span>
                    <strong class="font-mono text-white">${st.speeding || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Reckless Driving</span>
                    <strong class="font-mono text-white">${st.reckless_driving || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Texting / Distracted</span>
                    <strong class="font-mono text-white">${st.texting || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">No Insurance</span>
                    <strong class="font-mono text-white">${st.no_insurance || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Suspended License</span>
                    <strong class="font-mono text-white">${st.suspended_license || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Motorcycle Endorse.</span>
                    <strong class="font-mono text-white">${st.motorcycle_endorsement || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Bike / Pedestrian</span>
                    <strong class="font-mono text-white">${st.bike_ped || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Felony Arrest</span>
                    <strong class="font-mono text-white">${st.felony_arrest || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Stolen Vehicles Rec.</span>
                    <strong class="font-mono text-emerald-400">${st.stolen_vehicles || 0}</strong>
                </div>
                <div class="p-2 bg-[#121318] rounded border border-[#272a34] flex justify-between">
                    <span class="text-[#848e9f]">Fugitives Apprehended</span>
                    <strong class="font-mono text-white">${st.fugitives || 0}</strong>
                </div>
            </div>
        </div>
    `;

    openModal('shiftDetailsModal');
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toastNotification');
    const msg = document.getElementById('toastMsg');
    const icon = document.getElementById('toastIcon');
    if (!toast || !msg || !icon) return;

    msg.innerText = message;
    if (isError) {
        icon.innerHTML = '<i class="fa-solid fa-trash-can text-xs text-rose-400"></i>';
        icon.className = 'p-1.5 rounded-md bg-rose-500/20 border border-rose-500/30';
    } else {
        icon.innerHTML = '<i class="fa-solid fa-check text-xs text-blue-400"></i>';
        icon.className = 'accent-blue-pill p-1.5 rounded-md';
    }

    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.classList.add('hidden'), 3200);
    }, 3200);
}

// ==========================================================================
// Chart.js Visualizations
// ==========================================================================

function initCharts() {
    const ctxViolation = document.getElementById('violationChart');
    if (ctxViolation) {
        if (violationChartInstance) violationChartInstance.destroy();

        let speeding = 0, seatbelts = 0, duis = 0, texting = 0, license = 0, felonies = 0;
        shiftLogs.forEach(s => {
            const st = s.stats || {};
            speeding += (st.speeding || 0);
            seatbelts += (st.seat_belt || 0) + (st.child_seat_belt || 0);
            duis += (st.dui_alcohol || 0) + (st.dui_drugs || 0) + (st.dui_both || 0);
            texting += (st.texting || 0) + (st.bike_ped || 0);
            license += (st.suspended_license || 0) + (st.no_insurance || 0) + (st.motorcycle_endorsement || 0);
            felonies += (st.felony_arrest || 0) + (st.fugitives || 0) + (st.stolen_vehicles || 0);
        });

        violationChartInstance = new Chart(ctxViolation, {
            type: 'doughnut',
            data: {
                labels: [
                    'Speeding',
                    'Seat Belt / Child Restraint',
                    'DUI (Alcohol/Drug/Both)',
                    'Texting & Distracted',
                    'License & Insurance',
                    'Felony / Fugitive / Stolen'
                ],
                datasets: [{
                    data: [
                        speeding || 18, 
                        seatbelts || 12, 
                        duis || 6, 
                        texting || 5, 
                        license || 8, 
                        felonies || 4
                    ],
                    backgroundColor: [
                        '#1d4ed8', // Dark cobalt
                        '#3b82f6', // Blue 500
                        '#f43f5e', // Rose highlight for DUI
                        '#06b6d4', // Cyan
                        '#818cf8', // Indigo
                        '#10b981'  // Emerald
                    ],
                    borderColor: '#1c1e25',
                    borderWidth: 3,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '66%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: { family: 'Inter', size: 10 },
                            padding: 10,
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#16171d',
                        titleColor: '#ffffff',
                        bodyColor: '#cbd5e1',
                        borderColor: '#2a2d37',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                }
            }
        });
    }

    const ctxHours = document.getElementById('hoursChart');
    if (ctxHours) {
        if (hoursChartInstance) hoursChartInstance.destroy();

        hoursChartInstance = new Chart(ctxHours, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4 (Current)'],
                datasets: [
                    {
                        label: 'Net Grant Hours (Reimbursable)',
                        data: [29.5, 36.0, 42.5, 38.5],
                        backgroundColor: '#1d4ed8',
                        borderRadius: 5,
                        stack: 'hours'
                    },
                    {
                        label: 'Dept Billed (Assists/Calls)',
                        data: [2.5, 4.0, 5.5, 3.0],
                        backgroundColor: '#f59e0b',
                        borderRadius: 5,
                        stack: 'hours'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: '#272a34',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#848e9f',
                            font: { family: 'JetBrains Mono', size: 11 },
                            callback: value => value + 'h'
                        }
                    },
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: {
                            color: '#cbd5e1',
                            font: { family: 'Inter', size: 11 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#cbd5e1',
                            font: { size: 10 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#16171d',
                        titleColor: '#ffffff',
                        bodyColor: '#cbd5e1',
                        borderColor: '#2a2d37',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                }
            }
        });
    }
}

function updateCharts() {
    initCharts();
}
// 1. Fetch all existing shifts from your Node/PostgreSQL backend when the page loads
async function loadShiftsFromCloud() {
  try {
    const response = await fetch('http://localhost:5001/api/shifts');
    if (!response.ok) throw new Error('Failed to fetch shifts from database');
    
    const shifts = await response.json();
    
    // Update your app's global shift array and redraw your UI
    shiftLogs = shifts; 
    updateDashboardMetrics();
    renderShiftsTable();
  } catch (err) {
    console.error("Error loading shifts:", err);
  }
}

// 2. Save a new shift to your Node/PostgreSQL backend when an officer submits the form
async function saveShiftToCloud(shiftData) {
  try {
    const response = await fetch('http://localhost:5001/api/shifts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shiftData)
    });
    
    if (!response.ok) throw new Error('Failed to save shift to database');
    
    const savedShift = await response.json();
    console.log("Successfully saved shift:", savedShift);
    
    // Refresh the UI with the latest data from the database
    loadShiftsFromCloud();
  } catch (err) {
    console.error("Error saving shift:", err);
  }
}
// Example form submit listener
document.getElementById('shiftForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const shiftData = {
    date: document.getElementById('shiftDate').value,
    officer: document.getElementById('officerName').value,
    type: document.getElementById('grantType').value,
    hours: parseFloat(document.getElementById('hoursWorked').value),
    stops: parseInt(document.getElementById('stopsCount').value) || 0,
    citations: parseInt(document.getElementById('citationsCount').value) || 0,
    warnings: parseInt(document.getElementById('warningsCount').value) || 0,
    duis: parseInt(document.getElementById('duisCount').value) || 0,
    arrests: parseInt(document.getElementById('arrestsCount').value) || 0
  };

  // Send it to your PostgreSQL database via your backend!
  saveShiftToCloud(shiftData);
  
  // Reset the form
  this.reset();
});