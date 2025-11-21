
// Records Management (Admin)

let staff = [];
let staffMeta = { page: 1, size: 12, total: 0, totalPages: 1, search: '' };
let deleteId = null;

const authManager = new AuthManager();
const staffAPI = authManager.API_CONFIG.baseURL + 'staff.php';

// Load staff when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadStaff();
    const searchInput = document.getElementById('staffSearch');
    const pageSizeSelect = document.getElementById('staffPageSize');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                staffMeta.search = searchInput.value.trim();
                staffMeta.page = 1;
                renderStaffFromCache();
            }, 300);
        });
    }
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            staffMeta.size = parseInt(pageSizeSelect.value, 10) || 12;
            staffMeta.page = 1;
            renderStaffFromCache();
        });
    }
});

async function loadStaff() {
    try {
        const params = new URLSearchParams({ action: 'getAllStaff', page: String(staffMeta.page), size: String(staffMeta.size) });
        if (staffMeta.search) params.set('search', staffMeta.search);
        const response = await axios.get(`${staffAPI}?${params.toString()}`, {
            headers: authManager.API_CONFIG.getHeaders()
        });
        if (response.data && response.data.success) {
            staff = Array.isArray(response.data.data) ? response.data.data : [];
            // Server does not return meta; compute client-side
            staffMeta.total = staff.length;
            staffMeta.totalPages = Math.max(1, Math.ceil(staffMeta.total / staffMeta.size));
            renderStaffFromCache();
        } else {
            const message = (response.data && response.data.message) ? response.data.message : 'Unknown error';
            showAlert && showAlert('Error loading staff: ' + message, 'danger');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Failed to load staff');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

function getFilteredStaff() {
    if (!staffMeta.search) return staff;
    const q = staffMeta.search.toLowerCase();
    return staff.filter(r => {
        const name = (r.name || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
    });
}

function renderStaffFromCache() {
    const filtered = getFilteredStaff();
    staffMeta.total = filtered.length;
    staffMeta.totalPages = Math.max(1, Math.ceil(staffMeta.total / staffMeta.size));
    const start = (staffMeta.page - 1) * staffMeta.size;
    const pageItems = filtered.slice(start, start + staffMeta.size);
    displayStaff(pageItems);
    updateStaffCount();
    renderStaffPagination();
}

function displayStaff(list) {
    const tbody = document.querySelector('#staffTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="9" class="text-center text-muted">No records found</td>';
        tbody.appendChild(emptyRow);
        return;
    }
    list.forEach(staff => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${staff.username || ''}</td>
            <td>${staff.email || ''}</td>
            <td>${staff.role || ''}</td>
            <td>${staff.created_at || ''}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewRecord(${staff.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                 <button class="btn btn-sm btn-primary mx-1" onclick="editRecord(${staff.id})" title="Edit">
                    <i class="bx bx-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRecord(${staff.id})" title="Delete">
                    <i class="bx bx-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStaffCount() {
    const el = document.getElementById('staffCount');
    if (!el) return;
    const start = (staffMeta.page - 1) * staffMeta.size + 1;
    const end = Math.min(staffMeta.page * staffMeta.size, staffMeta.total);
    const shown = staffMeta.total === 0 ? 0 : (end - start + 1);
    el.textContent = `Showing ${shown} of ${staffMeta.total} records (Page ${staffMeta.page}/${staffMeta.totalPages})`;
}

function renderStaffPagination() {
    // HTML uses categoryPagination id; align with it
    const container = document.getElementById('categoryPagination');
    if (!container) return;
    const page = staffMeta.page || 1;
    const totalPages = staffMeta.totalPages || 1;
    container.innerHTML = '';
    const createItem = (label, disabled, active, targetPage) => {
        const li = document.createElement('li');
        li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
        const a = document.createElement(active ? 'span' : 'a');
        a.className = 'page-link';
        a.textContent = label;
        if (!active && !disabled) {
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                staffMeta.page = targetPage;
                renderStaffFromCache();
            });
        }
        li.appendChild(a);
        return li;
    };
    container.appendChild(createItem('Previous', page <= 1, false, Math.max(1, page - 1)));
    const maxToShow = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxToShow - 1);
    if (end - start + 1 < maxToShow) start = Math.max(1, end - maxToShow + 1);
    for (let i = start; i <= end; i++) {
        container.appendChild(createItem(String(i), false, i === page, i));
    }
    if (end < totalPages) {
        const dots = document.createElement('li');
        dots.className = 'page-item disabled';
        const span = document.createElement('span');
        span.className = 'page-link';
        span.textContent = '...';
        dots.appendChild(span);
        container.appendChild(dots);
        container.appendChild(createItem(String(totalPages), false, false, totalPages));
    }
    container.appendChild(createItem('Next', page >= totalPages, false, Math.min(totalPages, page + 1)));
}

function openAddModal() {
    document.getElementById('staffModalLabel').textContent = 'Add Staff';
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('staffModal'));
    modal.show();
}

function viewRecord(id) {
    const record = staff.find(r => String(r.id) === String(id));
    if (!record) { CustomToast && CustomToast.error('Error', 'Record not found'); return; }
    document.getElementById('viewGraveNumber').textContent = record.grave_number || '';
    document.getElementById('viewEmail').textContent = record.email || '';
    document.getElementById('viewCreatedAt').textContent = window.Utils.formatDate(record.created_at);
    const modal = new bootstrap.Modal(document.getElementById('viewModal'));
    modal.show();
}

function editRecord(id) {
    const record = records.find(r => String(r.id) === String(id));
    if (!record) { CustomToast?.error('Error', 'Record not found'); return; }
    document.getElementById('graveNumber').value = record.grave_number || '';
    document.getElementById('email').value = record.email || '';
    document.getElementById('createdAt').value = record.created_at || '';
    const modal = new bootstrap.Modal(document.getElementById('staffModal'));
    modal.show();
}

function deleteRecord(id) {
    deleteId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    if (!deleteId) return;
    try {
        const formData = new FormData();
        formData.append('action', 'deleteStaff');
        formData.append('id', deleteId);
        const response = await axios.post(`${staffAPI}`, formData, {
            headers: authManager.API_CONFIG.getFormHeaders()
        });
        const result = response.data;
        if (result && result.success) {
            CustomToast && CustomToast.success('Success', result.message || 'Deleted');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            await loadStaff();
        } else {
            CustomToast && CustomToast.error('Error', (result && result.message) || 'Delete failed');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Delete failed');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

// Handle form submission
document.getElementById('staffForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        const formData = new FormData(this);
        const recordId = document.getElementById('staffId').value;
        if (recordId) {
            formData.append('action', 'updateStaff');
            formData.append('id', recordId);
        } else {
            formData.append('action', 'createStaff');
        }
        const response = await axios.post(`${staffAPI}`, formData, {
            headers: authManager.API_CONFIG.getFormHeaders()
        });
        const result = response.data;
        if (result && result.success) {
            await loadStaff();
            CustomToast && CustomToast.success('Success', result.message || 'Saved');
            bootstrap.Modal.getInstance(document.getElementById('staffModal')).hide();
        } else {
            CustomToast && CustomToast.error('Error', (result && result.message) || 'Save failed');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Save failed');
        // eslint-disable-next-line no-console
        console.error(err);
    }
});
