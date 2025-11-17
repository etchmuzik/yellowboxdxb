// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

let currentEditId = null;

function initializeDashboard() {
    updateStatistics();
    populateFilters();
    displayTable(fleetData.riders);
    setupEventListeners();
    initTabs();
    initOnboarding();
    initPayments();
}

function updateStatistics() {
    const activeRiders = fleetData.riders.filter(r => r.status === 'active').length;
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
    
    riders.forEach(rider => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rider.id}</td>
            <td>${rider.name}</td>
            <td>${rider.talabatId || '-'}</td>
            <td>${rider.keetaId || '-'}</td>
            <td>${rider.zone || '-'}</td>
            <td>${rider.bike || '-'}</td>
            <td>${rider.nationality || '-'}</td>
            <td>${rider.cPhone || '-'}</td>
            <td>${rider.email || '-'}</td>
            <td>${rider.joiningDate || '-'}</td>
            <td><span class="status-badge status-${rider.status}">${rider.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-edit" onclick="editRider(${rider.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteRider(${rider.id})">Delete</button>
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
    
    // Modal
    document.getElementById('addRiderBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('riderForm').addEventListener('submit', saveRider);
    
    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
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
    
    const filtered = fleetData.riders.filter(rider => {
        const matchesSearch = !searchTerm || 
            rider.name.toLowerCase().includes(searchTerm) ||
            (rider.talabatId && rider.talabatId.includes(searchTerm)) ||
            (rider.keetaId && rider.keetaId.includes(searchTerm)) ||
            (rider.bike && rider.bike.toLowerCase().includes(searchTerm)) ||
            (rider.email && rider.email.toLowerCase().includes(searchTerm));
        
        const matchesZone = !zoneFilter || rider.zone === zoneFilter;
        const matchesNationality = !nationalityFilter || rider.nationality === nationalityFilter;
        const matchesStatus = !statusFilter || rider.status === statusFilter;
        
        return matchesSearch && matchesZone && matchesNationality && matchesStatus;
    });
    
    displayTable(filtered);
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
    currentEditId = id;
    const rider = fleetData.riders.find(r => r.id === id);
    if (!rider) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Rider';
    document.getElementById('riderName').value = rider.name || '';
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
    if (index > -1) {
        fleetData.riders.splice(index, 1);
        updateStatistics();
        filterTable();
    }
}

function closeModal() {
    document.getElementById('riderModal').classList.remove('active');
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
        const rider = fleetData.riders.find(r => r.id === currentEditId);
        if (rider) {
            Object.assign(rider, riderData);
        }
    } else {
        // Add new rider
        const newId = Math.max(...fleetData.riders.map(r => r.id), 0) + 1;
        fleetData.riders.push({ id: newId, ...riderData });
    }
    
    closeModal();
    updateStatistics();
    populateFilters();
    filterTable();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            alert('CSV file is empty or invalid');
            return;
        }
        
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        function getValueByHeader(headers, values, searchTerms) {
            for (let term of searchTerms) {
                const index = headers.findIndex(h => h.includes(term));
                if (index !== -1 && values[index]) return values[index].trim();
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
        
        const imported = [];
        const maxId = Math.max(...fleetData.riders.map(r => r.id), 0);
        
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const rider = {
                id: maxId + i,
                name: getValueByHeader(headers, values, ['name']),
                talabatId: getValueByHeader(headers, values, ['talabat', 'talabat id']),
                keetaId: getValueByHeader(headers, values, ['keeta', 'keeta id']),
                zone: getValueByHeader(headers, values, ['zone']),
                bike: getValueByHeader(headers, values, ['bike']),
                nationality: getValueByHeader(headers, values, ['nationality', 'nat']),
                cPhone: getValueByHeader(headers, values, ['phone', 'contact']),
                email: getValueByHeader(headers, values, ['email']),
                joiningDate: getValueByHeader(headers, values, ['joining', 'date', 'joining date']),
                status: getValueByHeader(headers, values, ['status']) || 'active'
            };
            
            if (rider.name) {
                imported.push(rider);
            }
        }
        
        if (imported.length > 0) {
            fleetData.riders.push(...imported);
            updateStatistics();
            populateFilters();
            filterTable();
            alert(`Successfully imported ${imported.length} rider(s)`);
        } else {
            alert('No valid riders found in CSV');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function exportData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const zoneFilter = document.getElementById('zoneFilter').value;
    const nationalityFilter = document.getElementById('nationalityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filtered = fleetData.riders.filter(rider => {
        const matchesSearch = !searchTerm || 
            rider.name.toLowerCase().includes(searchTerm) ||
            (rider.talabatId && rider.talabatId.includes(searchTerm)) ||
            (rider.keetaId && rider.keetaId.includes(searchTerm)) ||
            (rider.bike && rider.bike.toLowerCase().includes(searchTerm)) ||
            (rider.email && rider.email.toLowerCase().includes(searchTerm));
        
        const matchesZone = !zoneFilter || rider.zone === zoneFilter;
        const matchesNationality = !nationalityFilter || rider.nationality === nationalityFilter;
        const matchesStatus = !statusFilter || rider.status === statusFilter;
        
        return matchesSearch && matchesZone && matchesNationality && matchesStatus;
    });
    
    let csv = 'ID,Name,Talabat ID,Keeta ID,Zone,Bike,Nationality,Phone,Email,Joining Date,Status\n';
    
    filtered.forEach(rider => {
        csv += `${rider.id},"${rider.name}","${rider.talabatId || ''}","${rider.keetaId || ''}","${rider.zone || ''}","${rider.bike || ''}","${rider.nationality || ''}","${rider.cPhone || ''}","${rider.email || ''}","${rider.joiningDate || ''}","${rider.status}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yellowbox_riders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =========================
// Tab Navigation
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
            ridersSection.style.display = 'none';
            onboardingSection.style.display = 'none';
            paymentsSection.style.display = 'none';
            
            if (tab === 'riders') ridersSection.style.display = '';
            if (tab === 'onboarding') onboardingSection.style.display = '';
            if (tab === 'payments') paymentsSection.style.display = '';
        });
    });
}

// =========================
// Onboarding Module
// =========================
let onboarding = [];

function initOnboarding() {
    const addBtn = document.getElementById('addOBBtn');
    const importBtn = document.getElementById('importOBBtn');
    const importFile = document.getElementById('importOBFile');
    const exportBtn = document.getElementById('exportOBBtn');
    const clearBtn = document.getElementById('obClearFilters');
    const searchInput = document.getElementById('obSearch');

    if (addBtn) addBtn.addEventListener('click', () => alert('Add Applicant feature - Coming soon!'));
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
}

function renderOnboardingFilters() {
    const statuses = [...new Set(onboarding.map(o => o.applicationStatus).filter(s => s))];
    const categories = [...new Set(onboarding.map(o => o.applicantCategory).filter(c => c))];
    const trainers = [...new Set(onboarding.map(o => o.trainerName).filter(t => t))];

    const statusFilter = document.getElementById('obStatusFilter');
    statusFilter.innerHTML = '<option value="">All Status</option>';
    statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        statusFilter.appendChild(opt);
    });

    const categoryFilter = document.getElementById('obCategoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        categoryFilter.appendChild(opt);
    });

    const trainerFilter = document.getElementById('obTrainerFilter');
    trainerFilter.innerHTML = '<option value="">All Trainers</option>';
    trainers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        trainerFilter.appendChild(opt);
    });
}

function renderOnboardingTable() {
    const tbody = document.getElementById('obTableBody');
    const searchTerm = (document.getElementById('obSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('obStatusFilter')?.value || '';
    const categoryFilter = document.getElementById('obCategoryFilter')?.value || '';
    const trainerFilter = document.getElementById('obTrainerFilter')?.value || '';

    const filtered = onboarding.filter(o => {
        const matchesSearch = !searchTerm || 
            (o.name && o.name.toLowerCase().includes(searchTerm)) ||
            (o.emiratesId && o.emiratesId.includes(searchTerm));
        const matchesStatus = !statusFilter || o.applicationStatus === statusFilter;
        const matchesCategory = !categoryFilter || o.applicantCategory === categoryFilter;
        const matchesTrainer = !trainerFilter || o.trainerName === trainerFilter;
        return matchesSearch && matchesStatus && matchesCategory && matchesTrainer;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:#6b7280;">No onboarding records found. Click "Import CSV" to add data.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach((o, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${o.name || '-'}</td>
            <td>${o.emiratesId || '-'}</td>
            <td>${o.nationality || '-'}</td>
            <td>${o.city || '-'}</td>
            <td>${o.applicantCategory || '-'}</td>
            <td><span class="status-badge status-${(o.applicationStatus || '').toLowerCase().replace(/\s+/g, '-')}">${o.applicationStatus || '-'}</span></td>
            <td>${o.onboardedDate || '-'}</td>
            <td>${o.riderId || '-'}</td>
            <td>${o.allotedTrainingDate || '-'}</td>
            <td>${o.allotedTrainingSlot || '-'}</td>
            <td>${o.trainerName || '-'}</td>
            <td>${o.actualTrainingDate || '-'}</td>
            <td>${o.testResults || '-'}</td>
            <td class="action-buttons">
                <button class="btn btn-edit" onclick="alert('Edit feature - Coming soon!')">Edit</button>
                <button class="btn btn-danger" onclick="deleteOnboarding(${idx})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteOnboarding(idx) {
    if (!confirm('Delete this onboarding record?')) return;
    onboarding.splice(idx, 1);
    renderOnboardingFilters();
    renderOnboardingTable();
}

function importOnboardingCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            alert('CSV file is empty or invalid');
            return;
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

        function parseCSVLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"|"$/g, ''));
            return values;
        }

        function idxOf(terms) {
            for (let term of terms) {
                const idx = headers.findIndex(h => h.includes(term));
                if (idx !== -1) return idx;
            }
            return -1;
        }

        const map = {
            name: idxOf(['name']),
            eid: idxOf(['eid', 'emirates id']),
            nat: idxOf(['nationality']),
            city: idxOf(['city']),
            cat: idxOf(['category', 'applicant category']),
            status: idxOf(['status', 'application status']),
            remarks: idxOf(['remarks']),
            onboarded: idxOf(['onboarded', 'onboarded date']),
            riderId: idxOf(['rider id']),
            trainDate: idxOf(['training date', 'alloted training date']),
            trainSlot: idxOf(['slot', 'training slot']),
            trainer: idxOf(['trainer', 'trainer name']),
            actualDate: idxOf(['actual', 'actual training date']),
            result: idxOf(['result', 'test results'])
        };

        const imported = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLine(lines[i]);
            const rec = {
                name: map.name >= 0 ? vals[map.name] : '',
                emiratesId: map.eid >= 0 ? vals[map.eid] : '',
                nationality: map.nat >= 0 ? vals[map.nat] : '',
                city: map.city >= 0 ? vals[map.city] : '',
                applicantCategory: map.cat >= 0 ? vals[map.cat] : '',
                applicationStatus: map.status >= 0 ? vals[map.status] : '',
                remarks: map.remarks >= 0 ? vals[map.remarks] : '',
                onboardedDate: map.onboarded >= 0 ? vals[map.onboarded] : '',
                riderId: map.riderId >= 0 ? vals[map.riderId] : '',
                allotedTrainingDate: map.trainDate >= 0 ? vals[map.trainDate] : '',
                allotedTrainingSlot: map.trainSlot >= 0 ? vals[map.trainSlot] : '',
                trainerName: map.trainer >= 0 ? vals[map.trainer] : '',
                actualTrainingDate: map.actualDate >= 0 ? vals[map.actualDate] : '',
                testResults: map.result >= 0 ? vals[map.result] : ''
            };
            if (rec.name) imported.push(rec);
        }

        if (imported.length) {
            onboarding.push(...imported);
            renderOnboardingFilters();
            renderOnboardingTable();
            alert(`Imported ${imported.length} onboarding record(s).`);
        } else {
            alert('No onboarding records found in CSV.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportOnboardingCSV() {
    const searchTerm = (document.getElementById('obSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('obStatusFilter')?.value || '';
    const categoryFilter = document.getElementById('obCategoryFilter')?.value || '';
    const trainerFilter = document.getElementById('obTrainerFilter')?.value || '';

    const filtered = onboarding.filter(o => {
        const matchesSearch = !searchTerm || 
            (o.name && o.name.toLowerCase().includes(searchTerm)) ||
            (o.emiratesId && o.emiratesId.includes(searchTerm));
        const matchesStatus = !statusFilter || o.applicationStatus === statusFilter;
        const matchesCategory = !categoryFilter || o.applicantCategory === categoryFilter;
        const matchesTrainer = !trainerFilter || o.trainerName === trainerFilter;
        return matchesSearch && matchesStatus && matchesCategory && matchesTrainer;
    });

    let csv = 'Name,EID,Nationality,City,Applicant Category,Application Status,Onboarded Date,Rider ID,Training Date,Slot,Trainer,Actual Date,Test Results,Remarks\n';
    filtered.forEach(o => {
        csv += `"${o.name}","${o.emiratesId || ''}","${o.nationality || ''}","${o.city || ''}","${o.applicantCategory || ''}","${o.applicationStatus || ''}","${o.onboardedDate || ''}","${o.riderId || ''}","${o.allotedTrainingDate || ''}","${o.allotedTrainingSlot || ''}","${o.trainerName || ''}","${o.actualTrainingDate || ''}","${o.testResults || ''}","${o.remarks || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =========================
// Payments Module
// =========================
let paySettings = { currency: 'AED', startDay: 1, endDay: 30 };
let salaryProfiles = [];
let payrolls = [];

function initPayments() {
    // Sub-tab navigation
    const panes = {
        settings: document.getElementById('paySettings'),
        profiles: document.getElementById('payProfiles'),
        payroll: document.getElementById('payPayroll')
    };

    function showPane(key) {
        Object.values(panes).forEach(p => p && (p.style.display = 'none'));
        if (panes[key]) panes[key].style.display = '';
        if (key === 'profiles') renderProfilesTable();
        if (key === 'payroll') renderPayrollTable();
    }

    // Settings
    const currency = document.getElementById('payCurrency');
    const startDay = document.getElementById('payStartDay');
    const endDay = document.getElementById('payEndDay');
    const saveSettingsBtn = document.getElementById('savePaySettings');

    if (currency) currency.value = paySettings.currency;
    if (startDay) startDay.value = paySettings.startDay;
    if (endDay) endDay.value = paySettings.endDay;

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            paySettings.currency = currency.value;
            paySettings.startDay = parseInt(startDay.value);
            paySettings.endDay = parseInt(endDay.value);
            alert('Payment settings saved successfully!');
        });
    }

    // Sub-tab buttons
    const settingsBtn = document.getElementById('payTabSettingsBtn');
    const profilesBtn = document.getElementById('payTabProfilesBtn');
    const payrollBtn = document.getElementById('payTabPayrollBtn');

    if (settingsBtn) settingsBtn.addEventListener('click', () => showPane('settings'));
    if (profilesBtn) profilesBtn.addEventListener('click', () => showPane('profiles'));
    if (payrollBtn) payrollBtn.addEventListener('click', () => showPane('payroll'));

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

    // Initial render
    showPane('settings');
}

function renderProfilesTable() {
    const tbody = document.getElementById('profilesTableBody');
    
    if (salaryProfiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280;">No salary profiles found. Click "Import CSV" to add profiles.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    salaryProfiles.forEach((profile, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${profile.name || '-'}</td>
            <td>${profile.riderId || '-'}</td>
            <td>${paySettings.currency} ${profile.baseSalary || 0}</td>
