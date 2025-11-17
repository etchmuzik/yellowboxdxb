// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

let currentEditId = null;
let riderPickerResolver = null;
let riderPickerAllowInactive = false;

function initializeDashboard() {
    updateStatistics();
    populateFilters();
    displayTable(fleetData.riders);
    setupEventListeners();

    // New modules
    initRiderPicker();
    initTabs();
    initOnboarding();
    initPayments();
}

function updateStatistics() {
    const activeRiders = fleetData.riders.filter(r => r.status === 'active' || r.status === 'keeta').length;
    const offboardedRiders = fleetData.riders.filter(r => r.status === 'offboarded').length;
    const totalRiders = fleetData.riders.length;
    
    // Get current month new hires
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyNewHires = fleetData.riders.filter(r => {
        if (!r.joiningDate) return false;
        const parts = r.joiningDate.split('-');
        if (parts.length !== 3) return false;
        const month = parseInt(parts[0]) - 1;
        const year = parseInt(parts[2]);
        return month === currentMonth && year === currentYear;
    }).length;
    
    document.getElementById('totalRiders').textContent = totalRiders;
    document.getElementById('activeRiders').textContent = activeRiders;
    document.getElementById('offboardedRiders').textContent = offboardedRiders;
    document.getElementById('newHires').textContent = monthlyNewHires;
}

function populateFilters() {
    // Populate zone filter
    const zones = [...new Set(fleetData.riders.map(r => r.zone).filter(z => z))].sort();
    const zoneFilter = document.getElementById('zoneFilter');
    zoneFilter.innerHTML = '<option value="">All Zones</option>';
    zones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        zoneFilter.appendChild(option);
    });
    
    // Populate nationality filter
    const nationalities = [...new Set(fleetData.riders.map(r => r.nationality).filter(n => n))].sort();
    const nationalityFilter = document.getElementById('nationalityFilter');
    nationalityFilter.innerHTML = '<option value="">All Nationalities</option>';
    nationalities.forEach(nat => {
        const option = document.createElement('option');
        option.value = nat;
        option.textContent = nat;
        nationalityFilter.appendChild(option);
    });
}

function displayTable(riders) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (riders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #6b7280;">No riders found</td></tr>';
        return;
    }
    
    riders.forEach(rider => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rider.id}</td>
            <td><strong>${rider.name}</strong></td>
            <td>${rider.talabatId || '-'}</td>
            <td>${rider.keetaId || '-'}</td>
            <td>${rider.zone || '-'}</td>
            <td>${rider.bike}</td>
            <td>${rider.nationality}</td>
            <td>${rider.cPhone}</td>
            <td>${rider.email}</td>
            <td>${rider.joiningDate}</td>
            <td><span class="status-badge status-${rider.status}">${rider.status.toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editRider(${rider.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRider(${rider.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('zoneFilter').addEventListener('change', filterTable);
    document.getElementById('nationalityFilter').addEventListener('change', filterTable);
    document.getElementById('statusFilter').addEventListener('change', filterTable);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Add rider
    document.getElementById('addRiderBtn').addEventListener('click', openAddModal);
    
    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('riderForm').addEventListener('submit', saveRider);
    
    // Close modal on outside click
    document.getElementById('riderModal').addEventListener('click', (e) => {
        if (e.target.id === 'riderModal') {
            closeModal();
        }
    });
}

function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const zoneFilter = document.getElementById('zoneFilter').value;
    const nationalityFilter = document.getElementById('nationalityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredRiders = fleetData.riders.filter(rider => {
        const matchesSearch = !searchTerm || 
            rider.name.toLowerCase().includes(searchTerm) ||
            (rider.talabatId && rider.talabatId.toLowerCase().includes(searchTerm)) ||
            (rider.bike && rider.bike.toLowerCase().includes(searchTerm)) ||
            (rider.email && rider.email.toLowerCase().includes(searchTerm));
        
        const matchesZone = !zoneFilter || rider.zone === zoneFilter;
        const matchesNationality = !nationalityFilter || rider.nationality === nationalityFilter;
        const matchesStatus = !statusFilter || rider.status === statusFilter;
        
        return matchesSearch && matchesZone && matchesNationality && matchesStatus;
    });
    
    displayTable(filteredRiders);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('zoneFilter').value = '';
    document.getElementById('nationalityFilter').value = '';
    document.getElementById('statusFilter').value = '';
    displayTable(fleetData.riders);
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add Rider';
    document.getElementById('riderForm').reset();
    document.getElementById('riderModal').classList.add('active');
}

function editRider(id) {
    const rider = fleetData.riders.find(r => r.id === id);
    if (!rider) return;
    
    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Edit Rider';
    document.getElementById('riderName').value = rider.name;
    document.getElementById('riderTalabatId').value = rider.talabatId || '';
    document.getElementById('riderKeetaId').value = rider.keetaId || '';
    document.getElementById('riderZone').value = rider.zone || '';
    document.getElementById('riderBike').value = rider.bike || '';
    document.getElementById('riderNationality').value = rider.nationality || '';
    document.getElementById('riderPhone').value = rider.cPhone || '';
    document.getElementById('riderEmail').value = rider.email || '';
    document.getElementById('riderJoiningDate').value = rider.joiningDate || '';
    document.getElementById('riderStatus').value = rider.status || 'active';
    
    document.getElementById('riderModal').classList.add('active');
}

function deleteRider(id) {
    if (!confirm('Are you sure you want to delete this rider?')) return;
    
    const index = fleetData.riders.findIndex(r => r.id === id);
    if (index !== -1) {
        fleetData.riders.splice(index, 1);
        updateStatistics();
        populateFilters();
        filterTable();
    }
}

function closeModal() {
    document.getElementById('riderModal').classList.remove('active');
    document.getElementById('riderForm').reset();
    currentEditId = null;
}

function saveRider(e) {
    e.preventDefault();
    
    const riderData = {
        name: document.getElementById('riderName').value,
        talabatId: document.getElementById('riderTalabatId').value,
        keetaId: document.getElementById('riderKeetaId').value,
        zone: document.getElementById('riderZone').value,
        bike: document.getElementById('riderBike').value,
        nationality: document.getElementById('riderNationality').value,
        cPhone: document.getElementById('riderPhone').value,
        email: document.getElementById('riderEmail').value,
        joiningDate: document.getElementById('riderJoiningDate').value,
        status: document.getElementById('riderStatus').value
    };
    
    if (currentEditId) {
        // Edit existing rider
        const index = fleetData.riders.findIndex(r => r.id === currentEditId);
        if (index !== -1) {
            fleetData.riders[index] = { ...fleetData.riders[index], ...riderData };
        }
    } else {
        // Add new rider
        const newId = Math.max(...fleetData.riders.map(r => r.id)) + 1;
        fleetData.riders.push({ id: newId, ...riderData });
    }
    
    updateStatistics();
    populateFilters();
    filterTable();
    closeModal();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            const newRiders = [];
            let nextId = Math.max(...fleetData.riders.map(r => r.id)) + 1;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = parseCSVLine(line);
                if (values.length < 3) continue;
                
                const rider = {
                    id: nextId++,
                    name: getValueByHeader(headers, values, ['name']) || '',
                    talabatId: getValueByHeader(headers, values, ['talabat', 'talabat id']) || '',
                    keetaId: getValueByHeader(headers, values, ['keeta', 'keeta id']) || '',
                    zone: getValueByHeader(headers, values, ['zone']) || '',
                    bike: getValueByHeader(headers, values, ['bike']) || '',
                    nationality: getValueByHeader(headers, values, ['nationality']) || '',
                    cPhone: getValueByHeader(headers, values, ['phone', 'c phone']) || '',
                    email: getValueByHeader(headers, values, ['email']) || '',
                    joiningDate: getValueByHeader(headers, values, ['joining', 'date', 'joining date']) || '',
                    status: (getValueByHeader(headers, values, ['status']) || 'active').toLowerCase()
                };
                
                if (rider.name) {
                    newRiders.push(rider);
                }
            }
            
            if (newRiders.length > 0) {
                fleetData.riders.push(...newRiders);
                updateStatistics();
                populateFilters();
                displayTable(fleetData.riders);
                alert(`Successfully imported ${newRiders.length} rider(s)!`);
            } else {
                alert('No valid rider data found in the CSV file.');
            }
            
        } catch (error) {
            alert('Error importing CSV file. Please check the file format.');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function getValueByHeader(headers, values, searchTerms) {
    for (let term of searchTerms) {
        const index = headers.findIndex(h => h.includes(term));
        if (index !== -1 && values[index]) {
            return values[index].replace(/"/g, '').trim();
        }
    }
    return '';
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    
    return values;
}

function exportData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const zoneFilter = document.getElementById('zoneFilter').value;
    const nationalityFilter = document.getElementById('nationalityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const ridersToExport = fleetData.riders.filter(rider => {
        const matchesSearch = !searchTerm || 
            rider.name.toLowerCase().includes(searchTerm) ||
            (rider.talabatId && rider.talabatId.toLowerCase().includes(searchTerm)) ||
            (rider.bike && rider.bike.toLowerCase().includes(searchTerm)) ||
            (rider.email && rider.email.toLowerCase().includes(searchTerm));
        
        const matchesZone = !zoneFilter || rider.zone === zoneFilter;
        const matchesNationality = !nationalityFilter || rider.nationality === nationalityFilter;
        const matchesStatus = !statusFilter || rider.status === statusFilter;
        
        return matchesSearch && matchesZone && matchesNationality && matchesStatus;
    });
    
    let csv = 'ID,Name,Talabat ID,Keeta ID,Zone,Bike,Nationality,Phone,Email,Joining Date,Status\n';
    
    ridersToExport.forEach(rider => {
        csv += `${rider.id},"${rider.name}",${rider.talabatId || ''},${rider.keetaId || ''},"${rider.zone || ''}","${rider.bike || ''}",${rider.nationality || ''},${rider.cPhone || ''},${rider.email || ''},${rider.joiningDate || ''},${rider.status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yellowbox_fleet_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert(`Exported ${ridersToExport.length} rider(s) to CSV file.`);
}

// =========================
// Local Storage Management
// =========================
const STORAGE_KEYS = {
    settings: 'yb_settings',
    profiles: 'yb_profiles',
    payrolls: 'yb_payrolls',
    loans: 'yb_loans',
    transactions: 'yb_transactions',
    onboarding: 'yb_onboarding'
};

function loadState(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('loadState error for', key, e);
        return fallback;
    }
}
function saveState(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Global state for new modules
let paySettings = loadState(STORAGE_KEYS.settings, {
    currency: 'AED',
    startDay: 1, // user confirmed 1-30
    endDay: 30,
    defaultBaseSalary: 0 // awaiting salary list, can be overridden via profiles or settings
});
let salaryProfiles = loadState(STORAGE_KEYS.profiles, []);      // [{eid, riderId, name, base, allowances, deductions}]
let payrolls = loadState(STORAGE_KEYS.payrolls, []);            // [{id, month, year, items: [...], status}]
let loans = loadState(STORAGE_KEYS.loans, []);                  // [{id, eid, riderId, name, principal, termMonths, emi, balance, status}]
let transactions = loadState(STORAGE_KEYS.transactions, []);    // [{id, date, eid, riderId, name, type, amount, method, ref, note}]
let onboarding = loadState(STORAGE_KEYS.onboarding, []);        // onboarding records

// Helpers
function findRiderByEID(eid) {
    if (!eid) return null;
    const r = fleetData.riders.find(x => (x.eid && String(x.eid) === String(eid)));
    return r || null;
}
function findRiderFallback(name) {
    if (!name) return null;
    const nm = String(name).toLowerCase().trim();
    return fleetData.riders.find(x => String(x.name).toLowerCase().trim() === nm) || null;
}
function currencyFmt(n) {
    const num = isNaN(+n) ? 0 : +n;
    return `${paySettings.currency} ${num.toFixed(2)}`;
}
function uid(prefix='id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
}

// =========================
// Rider Picker (Loans/Expenses)
// =========================
function initRiderPicker() {
    const modal = document.getElementById('riderPicker');
    if (!modal) return;

    const searchInput = document.getElementById('riderPickSearch');
    const listEl = document.getElementById('riderPickList');
    const closeBtn = document.getElementById('pickerClose');
    const cancelBtn = document.getElementById('pickerCancel');

    const closeModal = () => {
        modal.classList.remove('active');
        if (searchInput) searchInput.value = '';
        if (listEl) listEl.innerHTML = '';
        if (riderPickerResolver) {
            riderPickerResolver(null);
            riderPickerResolver = null;
        }
    };

    const renderList = (term = '') => {
        if (!listEl) return;
        const lc = term.toLowerCase();
        const candidates = fleetData.riders.filter(r => riderPickerAllowInactive || r.status === 'active' || r.status === 'keeta');
        const filtered = lc
            ? candidates.filter(r =>
                (r.name && r.name.toLowerCase().includes(lc)) ||
                (r.talabatId && String(r.talabatId).toLowerCase().includes(lc)) ||
                (r.keetaId && String(r.keetaId).toLowerCase().includes(lc)) ||
                (r.bike && r.bike.toLowerCase().includes(lc)) ||
                (r.cPhone && String(r.cPhone).toLowerCase().includes(lc)) ||
                (r.email && r.email.toLowerCase().includes(lc))
              )
            : candidates;

        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="picker-item" style="justify-content:center;">No riders found</div>';
            return;
        }

        listEl.innerHTML = filtered.map(r => `
            <div class="picker-item" data-id="${r.id}">
                <div>
                    <div>${r.name}</div>
                    <div class="picker-meta">ID: ${r.id} · Talabat: ${r.talabatId || '-'} · Keeta: ${r.keetaId || '-'} · Bike: ${r.bike || '-'} · Phone: ${r.cPhone || '-'}</div>
                </div>
                <div class="picker-meta">${(r.status || '').toUpperCase()}</div>
            </div>
        `).join('');
    };

    if (listEl) {
        listEl.addEventListener('click', (e) => {
            const item = e.target.closest('.picker-item');
            if (!item) return;
            const id = parseInt(item.getAttribute('data-id'), 10);
            const rider = fleetData.riders.find(r => r.id === id);
            if (riderPickerResolver) riderPickerResolver(rider || null);
            riderPickerResolver = null;
            modal.classList.remove('active');
            if (searchInput) searchInput.value = '';
            listEl.innerHTML = '';
        });
    }

    if (searchInput) searchInput.addEventListener('input', () => renderList(searchInput.value));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Expose picker opener
    window.openRiderPicker = function(options = {}) {
        riderPickerAllowInactive = !!options.allowInactive;
        return new Promise((resolve) => {
            riderPickerResolver = resolve;
            modal.classList.add('active');
            renderList('');
            setTimeout(() => searchInput && searchInput.focus(), 50);
        });
    };
}

// =========================
// Tabs
// =========================
function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const ridersSection = document.getElementById('ridersSection');
    const onboardingSection = document.getElementById('onboardingSection');
    const paymentsSection = document.getElementById('paymentsSection');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.getAttribute('data-tab');
            // Remove active class from all sections
            ridersSection.classList.remove('active');
            onboardingSection.classList.remove('active');
            paymentsSection.classList.remove('active');

            // Add active class to selected section
            if (tab === 'riders') ridersSection.classList.add('active');
            if (tab === 'onboarding') onboardingSection.classList.add('active');
            if (tab === 'payments') paymentsSection.classList.add('active');
        });
    });
}

// =========================
// Onboarding Module
// =========================
function initOnboarding() {
    const addBtn = document.getElementById('addOBBtn');
    const importBtn = document.getElementById('importOBBtn');
    const importFile = document.getElementById('importOBFile');
    const exportBtn = document.getElementById('exportOBBtn');
    const clearBtn = document.getElementById('obClearFilters');
    const searchInput = document.getElementById('obSearch');

    if (addBtn) addBtn.addEventListener('click', () => addOnboardingPrompt());
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importOnboardingCSV);
    if (exportBtn) exportBtn.addEventListener('click', exportOnboardingCSV);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        document.getElementById('obStatusFilter').value = '';
        document.getElementById('obCategoryFilter').value = '';
        document.getElementById('obTrainerFilter').value = '';
        if (searchInput) searchInput.value = '';
        renderOnboardingTable();
    });
    if (searchInput) searchInput.addEventListener('input', renderOnboardingTable);

    renderOnboardingFilters();
    renderOnboardingTable();

    // row actions delegation
    const obBody = document.getElementById('obTableBody');
    if (obBody) {
        obBody.addEventListener('click', (e) => {
            const t = e.target;
            const idx = t && t.getAttribute && t.getAttribute('data-index');
            if (idx == null) return;
            const i = parseInt(idx, 10);
            if (isNaN(i) || i < 0 || i >= onboarding.length) return;

            if (t.classList.contains('ob-approve')) onboarding[i].applicationStatus = 'Approved';
            if (t.classList.contains('ob-schedule')) {
                const d = prompt('Enter Training Date (YYYY-MM-DD):', '');
                const s = prompt('Enter Training Slot (e.g., 10:00 AM):', '');
                const tr = prompt('Enter Trainer Name:', '');
                if (d) onboarding[i].allotedTrainingDate = d;
                if (s) onboarding[i].allotedTrainingSlot = s;
                if (tr) onboarding[i].trainerName = tr;
                onboarding[i].applicationStatus = 'Training Scheduled';
            }
            if (t.classList.contains('ob-pass')) {
                const actual = prompt('Enter Actual Training Date (YYYY-MM-DD):', '');
                onboarding[i].actualTrainingDate = actual || '';
                onboarding[i].testResults = 'Pass';
                onboarding[i].applicationStatus = 'Trained';
            }
            if (t.classList.contains('ob-fail')) {
                const actual = prompt('Enter Actual Training Date (YYYY-MM-DD):', '');
                onboarding[i].actualTrainingDate = actual || '';
                onboarding[i].testResults = 'Fail';
                onboarding[i].applicationStatus = 'Trained';
            }
            if (t.classList.contains('ob-reactivate')) onboarding[i].applicationStatus = 'Reactivated';
            if (t.classList.contains('ob-cancel')) onboarding[i].applicationStatus = 'Canceled';

            saveState(STORAGE_KEYS.onboarding, onboarding);
            renderOnboardingTable();
        });
    }
}

function renderOnboardingFilters() {
    const statusSel = document.getElementById('obStatusFilter');
    const categorySel = document.getElementById('obCategoryFilter');
    const trainerSel = document.getElementById('obTrainerFilter');
    if (!statusSel || !categorySel || !trainerSel) return;

    const statuses = [...new Set(onboarding.map(o => o.applicationStatus).filter(Boolean))].sort();
    const cats = [...new Set(onboarding.map(o => o.applicantCategory).filter(Boolean))].sort();
    const trainers = [...new Set(onboarding.map(o => o.trainerName).filter(Boolean))].sort();

    statusSel.innerHTML = '<option value="">All Status</option>' + statuses.map(s => `<option value="${s}">${s}</option>`).join('');
    categorySel.innerHTML = '<option value="">All Categories</option>' + cats.map(s => `<option value="${s}">${s}</option>`).join('');
    trainerSel.innerHTML = '<option value="">All Trainers</option>' + trainers.map(s => `<option value="${s}">${s}</option>`).join('');
}

function renderOnboardingTable() {
    const tbody = document.getElementById('obTableBody');
    if (!tbody) return;
    const q = (document.getElementById('obSearch')?.value || '').toLowerCase().trim();
    const st = document.getElementById('obStatusFilter')?.value || '';
    const cat = document.getElementById('obCategoryFilter')?.value || '';
    const tr = document.getElementById('obTrainerFilter')?.value || '';

    const filtered = onboarding.filter(o => {
        const matchesQ = !q || (String(o.name||'').toLowerCase().includes(q) || String(o.emiratesId||'').includes(q));
        const matchesS = !st || (o.applicationStatus === st);
        const matchesC = !cat || (o.applicantCategory === cat);
        const matchesT = !tr || (o.trainerName === tr);
        return matchesQ && matchesS && matchesC && matchesT;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:#6b7280;">No onboarding records found. Click "Add Applicant" or "Import Onboarding CSV" to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((o, idx) => `
        <tr>
            <td>${o.name||''}</td>
            <td>${o.emiratesId||''}</td>
            <td>${o.nationality||''}</td>
            <td>${o.city||''}</td>
            <td>${o.applicantCategory||''}</td>
            <td>${o.applicationStatus||''}</td>
            <td>${o.onboardedDate||''}</td>
            <td>${o.riderId||''}</td>
            <td>${o.allotedTrainingDate||''}</td>
            <td>${o.allotedTrainingSlot||''}</td>
            <td>${o.trainerName||''}</td>
            <td>${o.actualTrainingDate||''}</td>
            <td>${o.testResults||''}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit ob-approve" data-index="${onboarding.indexOf(o)}">Approve</button>
                    <button class="btn btn-edit ob-schedule" data-index="${onboarding.indexOf(o)}">Schedule</button>
                    <button class="btn btn-edit ob-pass" data-index="${onboarding.indexOf(o)}">Pass</button>
                    <button class="btn btn-danger ob-fail" data-index="${onboarding.indexOf(o)}">Fail</button>
                    <button class="btn btn-edit ob-reactivate" data-index="${onboarding.indexOf(o)}">Reactivate</button>
                    <button class="btn btn-danger ob-cancel" data-index="${onboarding.indexOf(o)}">Cancel</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function addOnboardingPrompt() {
    const name = prompt('Applicant Name:','');
    if (!name) return;
    const emiratesId = prompt('Emirates ID:','');
    const nationality = prompt('Nationality:','');
    const city = prompt('City:','');
    const applicantCategory = prompt('Applicant Category:','');
    const applicationStatus = prompt('Application Status (New joiner/Approved/...):','New joiner');

    onboarding.push({
        id: uid('ob'),
        name, emiratesId, nationality, city, applicantCategory,
        applicationStatus,
        onboardedDate: '', riderId: '',
        allotedTrainingDate: '', allotedTrainingSlot: '', trainerName: '',
        actualTrainingDate: '', testResults: ''
    });
    saveState(STORAGE_KEYS.onboarding, onboarding);
    renderOnboardingFilters();
    renderOnboardingTable();
}

function importOnboardingCSV(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        function idxOf(keys) {
            for (const k of keys) {
                const i = headers.findIndex(h => h.includes(k));
                if (i >= 0) return i;
            }
            return -1;
        }
        const map = {
            name: idxOf(['name']),
            eid: idxOf(['emirates id', 'eid']),
            nat: idxOf(['nationality']),
            city: idxOf(['city']),
            cat: idxOf(['applicant category']),
            status: idxOf(['application status', 'status']),
            remarks: idxOf(['remarks']),
            onboarded: idxOf(['onboarded date']),
            riderId: idxOf(['rider id']),
            trainDate: idxOf(['alloted training date']),
            trainSlot: idxOf(['slot']),
            trainer: idxOf(['trainer name']),
            actualDate: idxOf(['actual training date']),
            result: idxOf(['test results'])
        };

        const imported = [];
        for (let i=1;i<lines.length;i++){
            const vals = parseCSVLine(lines[i]);
            const rec = {
                id: uid('ob'),
                name: map.name>=0 ? vals[map.name] : '',
                emiratesId: map.eid>=0 ? vals[map.eid] : '',
                nationality: map.nat>=0 ? vals[map.nat] : '',
                city: map.city>=0 ? vals[map.city] : '',
                applicantCategory: map.cat>=0 ? vals[map.cat] : '',
                applicationStatus: map.status>=0 ? vals[map.status] : '',
                remarks: map.remarks>=0 ? vals[map.remarks] : '',
                onboardedDate: map.onboarded>=0 ? vals[map.onboarded] : '',
                riderId: map.riderId>=0 ? vals[map.riderId] : '',
                allotedTrainingDate: map.trainDate>=0 ? vals[map.trainDate] : '',
                allotedTrainingSlot: map.trainSlot>=0 ? vals[map.trainSlot] : '',
                trainerName: map.trainer>=0 ? vals[map.trainer] : '',
                actualTrainingDate: map.actualDate>=0 ? vals[map.actualDate] : '',
                testResults: map.result>=0 ? vals[map.result] : ''
            };
            if (rec.name) imported.push(rec);
        }

        if (imported.length) {
            onboarding.push(...imported);
            saveState(STORAGE_KEYS.onboarding, onboarding);
            renderOnboardingFilters();
            renderOnboardingTable();
            alert(`Imported ${imported.length} onboarding record(s).`);
        } else {
            alert('No onboarding records found in CSV.');
        }
    };
    reader.readAsText(file);
}

function exportOnboardingCSV() {
    const q = (document.getElementById('obSearch')?.value || '').toLowerCase().trim();
    const st = document.getElementById('obStatusFilter')?.value || '';
    const cat = document.getElementById('obCategoryFilter')?.value || '';
    const tr = document.getElementById('obTrainerFilter')?.value || '';
    const filtered = onboarding.filter(o => {
        const matchesQ = !q || (String(o.name||'').toLowerCase().includes(q) || String(o.emiratesId||'').includes(q));
        const matchesS = !st || (o.applicationStatus === st);
        const matchesC = !cat || (o.applicantCategory === cat);
        const matchesT = !tr || (o.trainerName === tr);
        return matchesQ && matchesS && matchesC && matchesT;
    });

    let csv = 'Name,EID,Nationality,City,Applicant Category,Application Status,Onboarded Date,Rider ID,Training Date,Slot,Trainer,Actual Date,Test Results,Remarks\n';
    filtered.forEach(o => {
        csv += `"${o.name}","${o.emiratesId||''}","${o.nationality||''}","${o.city||''}","${o.applicantCategory||''}","${o.applicationStatus||''}","${o.onboardedDate||''}","${o.riderId||''}","${o.allotedTrainingDate||''}","${o.allotedTrainingSlot||''}","${o.trainerName||''}","${o.actualTrainingDate||''}","${o.testResults||''}","${o.remarks||''}"\n`;
    });

    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`onboarding_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =========================
// Payments Module
// =========================
function initPayments() {
    // Tabs inside payments
    const panes = {
        settings: document.getElementById('paySettings'),
        profiles: document.getElementById('payProfiles'),
        payroll: document.getElementById('payPayroll'),
        loans: document.getElementById('payLoans'),
        tx: document.getElementById('payTransactions')
    };
    function showPane(key) {
        Object.values(panes).forEach(p => p && (p.style.display='none'));
        if (panes[key]) panes[key].style.display = '';
        if (key === 'profiles') renderProfilesTable();
        if (key === 'payroll') renderPayrollTable(); // alias
        if (key === 'loans') renderLoansTable();
        if (key === 'tx') renderTxTable();
    }

    // Sub-tab event listeners
    document.getElementById('payTabSettingsBtn').addEventListener('click', () => showPane('settings'));
    document.getElementById('payTabProfilesBtn').addEventListener('click', () => showPane('profiles'));
    document.getElementById('payTabPayrollBtn').addEventListener('click', () => showPane('payroll'));
    document.getElementById('payTabLoansBtn').addEventListener('click', () => showPane('loans'));
    document.getElementById('payTabTransactionsBtn').addEventListener('click', () => showPane('tx'));

    // Settings
    const currency = document.getElementById('payCurrency');
    const startDay = document.getElementById('payStartDay');
    const endDay = document.getElementById('payEndDay');
    const saveSettingsBtn = document.getElementById('savePaySettings');

    if (currency) currency.value = paySettings.currency;
    if (startDay) startDay.value = paySettings.startDay;
    if (endDay) endDay.value = paySettings.endDay;

    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
        paySettings.currency = currency.value;
        paySettings.startDay = parseInt(startDay.value, 10);
        paySettings.endDay = parseInt(endDay.value, 10);
        saveState(STORAGE_KEYS.settings, paySettings);
        alert('Payment settings saved successfully!');
    });

    // Sub-tab navigation
    const settingsBtn = document.getElementById('payTabSettingsBtn');
    const profilesBtn = document.getElementById('payTabProfilesBtn');
    const payrollBtn = document.getElementById('payTabPayrollBtn');
    const loansBtn = document.getElementById('payTabLoansBtn');
    const txBtn = document.getElementById('payTabTxBtn');

    if (settingsBtn) settingsBtn.addEventListener('click', () => showPane('settings'));
    if (profilesBtn) profilesBtn.addEventListener('click', () => showPane('profiles'));
    if (payrollBtn) payrollBtn.addEventListener('click', () => showPane('payroll'));
    if (loansBtn) loansBtn.addEventListener('click', () => showPane('loans'));
    if (txBtn) txBtn.addEventListener('click', () => showPane('tx'));

    // Profiles
    const importProfilesBtn = document.getElementById('importProfilesBtn');
    const importProfilesFile = document.getElementById('importProfilesFile');
    const exportProfilesBtn = document.getElementById('exportProfilesBtn');

    if (importProfilesBtn) importProfilesBtn.addEventListener('click', () => importProfilesFile.click());
    if (importProfilesFile) importProfilesFile.addEventListener('change', importProfilesCSV);
    if (exportProfilesBtn) exportProfilesBtn.addEventListener('click', exportProfilesCSV);

    // Payroll
    const generatePayrollBtn = document.getElementById('generatePayrollBtn');
    const exportPayrollBtn = document.getElementById('exportPayrollBtn');

    if (generatePayrollBtn) generatePayrollBtn.addEventListener('click', generatePayroll);
    if (exportPayrollBtn) exportPayrollBtn.addEventListener('click', exportPayrollCSV);

    // Loans
    const addLoanBtn = document.getElementById('addLoanBtn');
    const exportLoansBtn = document.getElementById('exportLoansBtn');

    if (addLoanBtn) addLoanBtn.addEventListener('click', addLoanPrompt);
    if (exportLoansBtn) exportLoansBtn.addEventListener('click', exportLoansCSV);

    // Transactions
    const addTxBtn = document.getElementById('addTransactionBtn');
    const exportTxBtn = document.getElementById('exportTxBtn');
    if (addTxBtn) addTxBtn.addEventListener('click', addExpensePrompt);
    if (exportTxBtn) exportTxBtn.addEventListener('click', exportTransactionsCSV);

    // Initial render
    showPane('settings');
}

// Salary Profiles Functions
function renderProfilesTable() {
    const tbody = document.getElementById('profilesTableBody');
    if (!tbody) return;

    if (salaryProfiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280;">No salary profiles found. Import profiles CSV to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = salaryProfiles.map((p, idx) => `
        <tr>
            <td>${p.name || ''}</td>
            <td>${p.eid || ''}</td>
            <td>${currencyFmt(p.base || 0)}</td>
            <td>${currencyFmt(p.allowances || 0)}</td>
            <td>${currencyFmt(p.deductions || 0)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editProfile(${idx})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProfile(${idx})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editProfile(idx) {
    const p = salaryProfiles[idx];
    if (!p) return;

    const base = prompt('Base Salary:', p.base || 0);
    const allowances = prompt('Allowances:', p.allowances || 0);
    const deductions = prompt('Deductions:', p.deductions || 0);

    if (base !== null) p.base = parseFloat(base) || 0;
    if (allowances !== null) p.allowances = parseFloat(allowances) || 0;
    if (deductions !== null) p.deductions = parseFloat(deductions) || 0;

    saveState(STORAGE_KEYS.profiles, salaryProfiles);
    renderProfilesTable();
}

function deleteProfile(idx) {
    if (!confirm('Delete this salary profile?')) return;
    salaryProfiles.splice(idx, 1);
    saveState(STORAGE_KEYS.profiles, salaryProfiles);
    renderProfilesTable();
}

function importProfilesCSV(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        function idxOf(keys) {
            for (const k of keys) {
                const i = headers.findIndex(h => h.includes(k));
                if (i >= 0) return i;
            }
            return -1;
        }

        const map = {
            name: idxOf(['name']),
            eid: idxOf(['eid', 'emirates id']),
            base: idxOf(['base', 'salary']),
            allowances: idxOf(['allowances']),
            deductions: idxOf(['deductions'])
        };

        const imported = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLine(lines[i]);
            const rec = {
                id: uid('profile'),
                name: map.name >= 0 ? vals[map.name] : '',
                eid: map.eid >= 0 ? vals[map.eid] : '',
                base: map.base >= 0 ? parseFloat(vals[map.base]) || 0 : 0,
                allowances: map.allowances >= 0 ? parseFloat(vals[map.allowances]) || 0 : 0,
                deductions: map.deductions >= 0 ? parseFloat(vals[map.deductions]) || 0 : 0
            };
            if (rec.name || rec.eid) imported.push(rec);
        }

        if (imported.length) {
            salaryProfiles.push(...imported);
            saveState(STORAGE_KEYS.profiles, salaryProfiles);
            renderProfilesTable();
            alert(`Imported ${imported.length} salary profile(s).`);
        } else {
            alert('No salary profiles found in CSV.');
        }
    };
    reader.readAsText(file);
}

function exportProfilesCSV() {
    let csv = 'Name,EID,Base Salary,Allowances,Deductions\n';
    salaryProfiles.forEach(p => {
        csv += `"${p.name}","${p.eid}",${p.base || 0},${p.allowances || 0},${p.deductions || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_profiles_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Payroll Functions
function renderPayrollTable() {
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody) return;

    const currentPayroll = payrolls.length > 0 ? payrolls[payrolls.length - 1] : null;
    if (!currentPayroll || !currentPayroll.items) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;color:#6b7280;">No payroll generated. Click "Generate Current Cycle" to create payroll.</td></tr>';
        return;
    }

    tbody.innerHTML = currentPayroll.items.map((item, idx) => `
        <tr>
            <td>${item.name || ''}</td>
            <td>${item.eid || ''}</td>
            <td>${currencyFmt(item.base || 0)}</td>
            <td>${currencyFmt(item.allowances || 0)}</td>
            <td>${currencyFmt(item.deductions || 0)}</td>
            <td>${currencyFmt(item.loanEmi || 0)}</td>
            <td>${currencyFmt(item.overtime || 0)}</td>
            <td>${currencyFmt(item.incentives || 0)}</td>
            <td><strong>${currencyFmt(item.netPay || 0)}</strong></td>
            <td><span class="status-badge status-${item.status || 'pending'}">${(item.status || 'pending').toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="markPaid(${idx})">Mark Paid</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generatePayroll() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const items = [];
    
    // Generate payroll for all active riders
    fleetData.riders.filter(r => r.status === 'active').forEach(rider => {
        const profile = salaryProfiles.find(p => p.eid === rider.eid || p.name === rider.name);
        const activeLoan = loans.find(l => (l.eid === rider.eid || l.name === rider.name) && l.status === 'active');

        const base = profile ? profile.base : 0;
        const allowances = profile ? profile.allowances : 0;
        const deductions = profile ? profile.deductions : 0;
        const loanEmi = activeLoan ? activeLoan.emi : 0;
        const overtime = 0;
        const incentives = 0;

        const netPay = base + allowances - deductions - loanEmi + overtime + incentives;

        items.push({
            riderId: rider.id,
            name: rider.name,
            eid: rider.eid || '',
            base,
            allowances,
            deductions,
            loanEmi,
            overtime,
            incentives,
            netPay,
            status: 'pending'
        });
    });

    const payroll = {
        id: uid('payroll'),
        month,
        year,
        generatedDate: now.toISOString(),
        items,
        status: 'draft'
    };

    payrolls.push(payroll);
    saveState(STORAGE_KEYS.payrolls, payrolls);
    renderPayrollTable();
    alert(`Payroll generated for ${items.length} rider(s).`);
}

function markPaid(idx) {
    const currentPayroll = payrolls.length > 0 ? payrolls[payrolls.length - 1] : null;
    if (!currentPayroll || !currentPayroll.items[idx]) return;

    currentPayroll.items[idx].status = 'paid';
    saveState(STORAGE_KEYS.payrolls, payrolls);
    renderPayrollTable();

    // Record transaction
    const item = currentPayroll.items[idx];
    transactions.push({
        id: uid('tx'),
        date: new Date().toISOString(),
        riderId: item.riderId,
        eid: item.eid,
        name: item.name,
        type: 'Salary',
        amount: item.netPay,
        method: 'Bank Transfer',
        ref: currentPayroll.id,
        note: `Salary payment for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
    });
    saveState(STORAGE_KEYS.transactions, transactions);
}

function exportPayrollCSV() {
    const currentPayroll = payrolls.length > 0 ? payrolls[payrolls.length - 1] : null;
    if (!currentPayroll || !currentPayroll.items) {
        alert('No payroll to export.');
        return;
    }

    let csv = 'Name,EID,Base Salary,Allowances,Deductions,Loan EMI,Overtime,Incentives,Net Pay,Status\n';
    currentPayroll.items.forEach(item => {
        csv += `"${item.name}","${item.eid}",${item.base},${item.allowances},${item.deductions},${item.loanEmi},${item.overtime},${item.incentives},${item.netPay},"${item.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Loans Functions
function renderLoansTable() {
    const tbody = document.getElementById('loansTableBody');
    if (!tbody) return;

    if (loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">No loans found. Click "Add Loan" to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = loans.map((loan, idx) => `
        <tr>
            <td>${loan.name || ''}</td>
            <td>${loan.eid || ''}</td>
            <td>${currencyFmt(loan.principal || 0)}</td>
            <td>${loan.termMonths || 0} months</td>
            <td>${currencyFmt(loan.emi || 0)}</td>
            <td>${currencyFmt(loan.balance || 0)}</td>
            <td><span class="status-badge status-${loan.status || 'active'}">${(loan.status || 'active').toUpperCase()}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editLoan(${idx})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteLoan(${idx})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function addLoanPrompt() {
    if (typeof openRiderPicker !== 'function') return;
    const rider = await openRiderPicker();
    if (!rider) return;

    const principal = parseFloat(prompt('Loan Amount (AED):', '0')) || 0;
    if (principal <= 0) {
        alert('Please enter a valid loan amount.');
        return;
    }
    
    const termMonths = parseInt(prompt('Term (months):', '12'), 10) || 12;
    const interestRate = parseFloat(prompt('Interest Rate (% per year, enter 0 for no interest):', '0')) || 0;
    
    // Calculate EMI with or without interest
    let emi;
    if (interestRate > 0) {
        const monthlyRate = interestRate / 100 / 12;
        emi = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    } else {
        emi = principal / termMonths;
    }
    
    const reason = prompt('Loan Reason/Purpose:', 'Personal loan');

    loans.push({
        id: uid('loan'),
        riderId: rider.id,
        name: rider.name,
        eid: rider.emiratesId || '',
        bike: rider.bike,
        principal,
        termMonths,
        interestRate,
        emi: Math.round(emi * 100) / 100,
        balance: principal,
        paidMonths: 0,
        status: 'active',
        reason,
        startDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    saveState(STORAGE_KEYS.loans, loans);
    renderLoansTable();
    alert(`Loan of AED ${principal} assigned to ${rider.name} successfully!\nMonthly EMI: AED ${Math.round(emi * 100) / 100}`);
}

function editLoan(idx) {
    const loan = loans[idx];
    if (!loan) return;

    const balance = prompt('Remaining Balance:', loan.balance);
    const status = prompt('Status (active/closed):', loan.status);

    if (balance !== null) loan.balance = parseFloat(balance) || 0;
    if (status !== null) loan.status = status;

    saveState(STORAGE_KEYS.loans, loans);
    renderLoansTable();
}

function deleteLoan(idx) {
    if (!confirm('Delete this loan?')) return;
    loans.splice(idx, 1);
    saveState(STORAGE_KEYS.loans, loans);
    renderLoansTable();
}

function exportLoansCSV() {
    let csv = 'Name,EID,Principal,Term (Months),EMI,Balance,Status,Start Date\n';
    loans.forEach(loan => {
        csv += `"${loan.name}","${loan.eid}",${loan.principal},${loan.termMonths},${loan.emi},${loan.balance},"${loan.status}","${loan.startDate}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Transactions Functions
function renderTxTable() {
    const tbody = document.getElementById('txTableBody');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">No transactions found. Transactions will appear when you mark payroll as paid.</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.name || ''}</td>
            <td>${tx.eid || ''}</td>
            <td>${tx.type || ''}</td>
            <td>${currencyFmt(tx.amount || 0)}</td>
            <td>${tx.method || ''}</td>
            <td>${tx.ref || ''}</td>
            <td>${tx.note || ''}</td>
        </tr>
    `).join('');
}

function exportTransactionsCSV() {
    let csv = 'Date,Rider,EID,Type,Amount,Method,Reference,Note\n';
    transactions.forEach(tx => {
        csv += `"${new Date(tx.date).toLocaleDateString()}","${tx.name}","${tx.eid}","${tx.type}",${tx.amount},"${tx.method}","${tx.ref}","${tx.note}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add Expense/Transaction Function
async function addExpensePrompt() {
    if (typeof openRiderPicker !== 'function') return;
    const rider = await openRiderPicker();
    if (!rider) return;

    // Select expense type
    const expenseTypes = [
        'Fuel Expense',
        'Bike Maintenance',
        'Fine/Penalty',
        'Uniform',
        'Equipment',
        'Insurance',
        'Medical',
        'Advance Salary',
        'Other Expense',
        'Reimbursement'
    ];
    
    const typeOptions = expenseTypes.map((type, idx) => `${idx + 1}. ${type}`).join('\n');
    const typeSelection = prompt(`Select expense type (enter number):\n\n${typeOptions}`, '1');
    const typeIndex = parseInt(typeSelection) - 1;
    
    if (isNaN(typeIndex) || typeIndex < 0 || typeIndex >= expenseTypes.length) {
        alert('Invalid expense type selection.');
        return;
    }
    
    const expenseType = expenseTypes[typeIndex];
    
    // Get amount
    const amount = parseFloat(prompt(`Enter ${expenseType} amount (AED):`, '0')) || 0;
    if (amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    // Get payment method
    const paymentMethods = ['Cash', 'Bank Transfer', 'Salary Deduction', 'Card Payment'];
    const methodOptions = paymentMethods.map((method, idx) => `${idx + 1}. ${method}`).join('\n');
    const methodSelection = prompt(`Select payment method (enter number):\n\n${methodOptions}`, '3');
    const methodIndex = parseInt(methodSelection) - 1;
    
    if (isNaN(methodIndex) || methodIndex < 0 || methodIndex >= paymentMethods.length) {
        alert('Invalid payment method selection.');
        return;
    }
    
    const paymentMethod = paymentMethods[methodIndex];
    
    // Get reference and notes
    const reference = prompt('Reference/Invoice Number (optional):', `EXP-${Date.now()}`);
    const note = prompt('Additional notes (optional):', '');
    
    // Create the transaction
    const transaction = {
        id: uid('tx'),
        date: new Date().toISOString(),
        riderId: rider.id,
        name: rider.name,
        eid: rider.emiratesId || '',
        bike: rider.bike,
        type: expenseType,
        amount: amount,
        method: paymentMethod,
        ref: reference || `EXP-${Date.now()}`,
        note: note || `${expenseType} for ${rider.name}`,
        status: 'pending'
    };
    
    // Add to transactions
    transactions.push(transaction);
    saveState(STORAGE_KEYS.transactions, transactions);
    renderTxTable();
    
    alert(`${expenseType} of AED ${amount} assigned to ${rider.name} successfully!\nPayment Method: ${paymentMethod}`);
}

// Helper function to generate unique IDs
function uid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
