
// Records Management (Admin)

let records = [];
let recordMeta = { page: 1, size: 12, total: 0, totalPages: 1, search: '' };
let deleteId = null;

const authManager = new AuthManager();
const recordsAPI = authManager.API_CONFIG.baseURL + 'records.php';

// Load records when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
    const searchInput = document.getElementById('recordSearch');
    const pageSizeSelect = document.getElementById('recordPageSize');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                recordMeta.search = searchInput.value.trim();
                recordMeta.page = 1;
                renderRecordsFromCache();
            }, 300);
        });
    }
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            recordMeta.size = parseInt(pageSizeSelect.value, 10) || 12;
            recordMeta.page = 1;
            renderRecordsFromCache();
        });
    }
});

async function loadRecords() {
    try {
        const params = new URLSearchParams({ 
            action: 'getAllRecords', 
            page: String(recordMeta.page), 
            size: String(recordMeta.size),
            grouped: 'true'
        });
        if (recordMeta.search) params.set('search', recordMeta.search);
        const response = await axios.get(`${recordsAPI}?${params.toString()}`, {
            headers: authManager.API_CONFIG.getHeaders()
        });
        if (response.data && response.data.success) {
            // Handle grouped data structure
            if (response.data.meta && response.data.meta.grouped) {
                records = response.data.data || {};
                recordMeta.total = response.data.meta.total || 0;
                recordMeta.totalPages = response.data.meta.totalPages || 1;
            } else {
                // Fallback to flat array structure
                records = Array.isArray(response.data.data) ? response.data.data : [];
                recordMeta.total = records.length;
                recordMeta.totalPages = Math.max(1, Math.ceil(recordMeta.total / recordMeta.size));
            }
            renderRecordsFromCache();
        } else {
            const message = (response.data && response.data.message) ? response.data.message : 'Unknown error';
            showAlert && showAlert('Error loading records: ' + message, 'danger');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Failed to load records');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

function getFilteredRecords() {
    if (!recordMeta.search) return records;
    const q = recordMeta.search.toLowerCase();
    return records.filter(r => {
        const name = (r.name || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
    });
}

function renderRecordsFromCache() {
    // For grouped data, we don't need to filter or paginate on the client side
    // as the server already handles this
    displayRecords(records);
    updateRecordCount();
    renderRecordPagination();
}

function displayRecords(data) {
    const tbody = document.querySelector('#recordTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Handle both grouped and flat data structures
    let groupedRecords = {};
    if (Array.isArray(data)) {
        // Flat array structure - group by grave_number
        if (data.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="text-center text-muted">No records found</td>';
            tbody.appendChild(emptyRow);
            return;
        }
        
        data.forEach(record => {
            const graveNumber = record.grave_number || 'Unknown';
            if (!groupedRecords[graveNumber]) {
                groupedRecords[graveNumber] = [];
            }
            groupedRecords[graveNumber].push(record);
        });
    } else if (typeof data === 'object' && data !== null) {
        // Already grouped structure
        groupedRecords = data;
        
        if (Object.keys(groupedRecords).length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="text-center text-muted">No records found</td>';
            tbody.appendChild(emptyRow);
            return;
        }
    } else {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center text-muted">No records found</td>';
        tbody.appendChild(emptyRow);
        return;
    }
    
    // Display grouped records
    Object.keys(groupedRecords).forEach(graveNumber => {
        const graveRecords = groupedRecords[graveNumber];
        const row = document.createElement('tr');
        
        // Create deceased records display
        const deceasedRecordsHtml = graveRecords.map((record, index) => `
            <div class="deceased-record-item border rounded p-2 mb-2 ${index > 0 ? 'mt-2' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-info">Layer ${record.grave_layer_number || 1}</span>
                            <strong>${record.deceased_name || 'Unknown'}</strong>
                            
                        </div>
                        <div class="small text-muted">
                            ${record.date_of_death ? `Died: ${window.Utils?.formatDate(record.date_of_death) || record.date_of_death}` : ''}
                            ${record.burial_date ? ` | Buried: ${window.Utils?.formatDate(record.burial_date) || record.burial_date}` : ''}
                        </div>
                        ${record.next_of_kin ? `<div class="small">Next of Kin: ${record.next_of_kin}</div>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="viewRecord(${record.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editRecord(${record.id})" title="Edit">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteRecord(${record.id})" title="Delete">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Get unique layer numbers
        const layers = [...new Set(graveRecords.map(r => r.grave_layer_number || 1))].sort((a, b) => a - b);
        
        row.innerHTML = `
            <td>
                <strong>${graveNumber}</strong>
                <div class="small text-muted">Grave Plot</div>
            </td>
            <td>
                <div class="deceased-records-container">
                    ${deceasedRecordsHtml}
                </div>
            </td>
            <td>
                <span class="badge bg-primary">${graveRecords.length}</span>
                <div class="small text-muted">burial${graveRecords.length > 1 ? 's' : ''}</div>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="addRecordToGrave('${graveNumber}')" title="Add Record to Grave">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="viewGraveDetails('${graveNumber}')" title="View Grave Details">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateRecordCount() {
    const el = document.getElementById('recordCount');
    if (!el) return;
    const start = (recordMeta.page - 1) * recordMeta.size + 1;
    const end = Math.min(recordMeta.page * recordMeta.size, recordMeta.total);
    const shown = recordMeta.total === 0 ? 0 : (end - start + 1);
    el.textContent = `Showing ${shown} of ${recordMeta.total} records (Page ${recordMeta.page}/${recordMeta.totalPages})`;
}

function renderRecordPagination() {
    // HTML uses categoryPagination id; align with it
    const container = document.getElementById('categoryPagination');
    if (!container) return;
    const page = recordMeta.page || 1;
    const totalPages = recordMeta.totalPages || 1;
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
                recordMeta.page = targetPage;
                renderRecordsFromCache();
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

// Global variable to track deceased record count
let deceasedRecordCount = 1;

function openAddModal() {
    document.getElementById('recordModalLabel').textContent = 'Add Records';
    document.getElementById('recordForm').reset();
    document.getElementById('recordId').value = '';
    document.getElementById('graveId').value = '';
    
    // Reset to single deceased record
    deceasedRecordCount = 1;
    resetDeceasedRecords();
    
    const submitBtn = document.getElementById('recordSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Next';
        submitBtn.type = 'button';
        submitBtn.onclick = () => {
            const form = document.getElementById('recordForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            const formDataObj = {
                deceased_records: getDeceasedRecordsData()
            };
            try {
                sessionStorage.setItem('newRecordDraft', JSON.stringify(formDataObj));
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Could not store form draft in sessionStorage', e);
            }
            window.location.href = 'map.php';
        };
    }
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function addRecordToGrave(graveNumber) {
    // Find the grave ID for the given grave number
    let graveId = null;
    if (Array.isArray(records)) {
        const graveRecord = records.find(r => r.grave_number === graveNumber);
        graveId = graveRecord ? graveRecord.grave_id_fk : null;
    } else if (typeof records === 'object' && records !== null) {
        const graveRecords = records[graveNumber];
        if (graveRecords && graveRecords.length > 0) {
            graveId = graveRecords[0].grave_id_fk;
        }
    }
    
    document.getElementById('recordModalLabel').textContent = 'Add Record to Grave';
    document.getElementById('recordForm').reset();
    document.getElementById('recordId').value = '';
    document.getElementById('graveId').value = graveId || '';
    
    // Reset to single deceased record
    deceasedRecordCount = 1;
    resetDeceasedRecords();
    
    const submitBtn = document.getElementById('recordSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Save Record';
        submitBtn.type = 'submit';
        submitBtn.onclick = null;
    }
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function viewGraveDetails(graveNumber) {
    let graveRecords = [];
    
    // Handle both grouped and flat data structures
    if (Array.isArray(records)) {
        graveRecords = records.filter(r => r.grave_number === graveNumber);
    } else if (typeof records === 'object' && records !== null) {
        graveRecords = records[graveNumber] || [];
    }
    
    if (graveRecords.length === 0) return;
    
    // Build image gallery from joined image_path (same for all records in a grave)
    const imagesCsv = (graveRecords[0] && graveRecords[0].image_path) ? String(graveRecords[0].image_path) : '';
    const imageFiles = imagesCsv
        .split(',')
        .map(s => (s || '').trim())
        .filter(s => s.length > 0);

    const galleryHtml = imageFiles.length
        ? `
            <div class="mb-3">
                <h6 class="mb-2">Grave Images</h6>
                <div class="row g-2">
                    ${imageFiles.map(fn => `
                        <div class=\"col-3 col-sm-2\">
                            <img src=\"../../../../data/images/grave/${graveNumber}/${fn}\" 
                                 alt=\"${fn}\" 
                                 class=\"img-thumbnail\" 
                                 style=\"width: 100%; height: 70px; object-fit: cover; cursor: pointer;\"
                                 onclick=\"previewGraveImage('../../../../data/images/grave/${graveNumber}/${fn}','Grave ${graveNumber}')\">
                        </div>
                    `).join('')}
                </div>
            </div>
          `
        : '';

    // Create a detailed view of all records in this grave
    let detailsHtml = `
        <div class="grave-details">
            <h5>Grave: ${graveNumber}</h5>
            ${galleryHtml}
            <div class="row">
    `;
    
    graveRecords.forEach((record, index) => {
        detailsHtml += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Deceased Person #${index + 1}</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Name:</strong> ${record.deceased_name || 'Unknown'}</p>
                        <p><strong>Date of Birth:</strong> ${record.date_of_birth || 'Not specified'}</p>
                        <p><strong>Date of Death:</strong> ${record.date_of_death || 'Not specified'}</p>
                        <p><strong>Burial Date:</strong> ${record.burial_date || 'Not specified'}</p>
                        <p><strong>Next of Kin:</strong> ${record.next_of_kin || 'Not specified'}</p>
                        <p><strong>Contact:</strong> ${record.contact_info || 'Not specified'}</p>
                        ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    detailsHtml += `
            </div>
        </div>
    `;
    
    // Show in a modal or alert
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Grave Details - ${graveNumber}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${detailsHtml}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: true });
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function previewGraveImage(src, title) {
    // Remove existing preview if any
    const existing = document.getElementById('graveImageOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'graveImageOverlay';
    overlay.style = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    overlay.innerHTML = `
        <div style="position: relative;">
            <img src="${src}" style="max-height: 80vh; max-width: 90vw; border-radius: 8px;">
            <button style="
                position: absolute;
                top: -20px; right: -20px;
                background: #fff;
                border: none;
                border-radius: 50%;
                width: 35px; height: 35px;
                cursor: pointer;
            ">&times;</button>
        </div>
    `;

    overlay.querySelector('button').onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}


function viewRecord(id) {
    let record = null;
    
    // Handle both grouped and flat data structures
    if (Array.isArray(records)) {
        record = records.find(r => String(r.id) === String(id));
    } else if (typeof records === 'object' && records !== null) {
        // Search through all grave groups
        for (const graveNumber in records) {
            record = records[graveNumber].find(r => String(r.id) === String(id));
            if (record) break;
        }
    }
    
    if (!record) { CustomToast && CustomToast.error('Error', 'Record not found'); return; }
    document.getElementById('viewGraveNumber').textContent = record.grave_number || '';
    document.getElementById('viewDeceasedName').textContent = record.deceased_name || '';
    document.getElementById('viewDateOfBirth').textContent = window.Utils.formatDate(record.date_of_birth);
    document.getElementById('viewDateOfDeath').textContent = window.Utils.formatDate(record.date_of_death);
    document.getElementById('viewBurialDate').textContent = window.Utils.formatDate(record.burial_date);
    document.getElementById('viewNextOfKin').textContent = record.next_of_kin || '';
    document.getElementById('viewContactInfo').textContent = record.contact_info || '';
    document.getElementById('viewNotes').textContent = record.notes || '';
    const modal = new bootstrap.Modal(document.getElementById('viewModal'));
    modal.show();
}

function editRecord(id) {
    let record = null;
    
    // Handle both grouped and flat data structures
    if (Array.isArray(records)) {
        record = records.find(r => String(r.id) === String(id));
    } else if (typeof records === 'object' && records !== null) {
        // Search through all grave groups
        for (const graveNumber in records) {
            record = records[graveNumber].find(r => String(r.id) === String(id));
            if (record) break;
        }
    }
    
    if (!record) { CustomToast?.error('Error', 'Record not found'); return; }
    document.getElementById('deceasedName').value = record.deceased_name || '';
    document.getElementById('dateOfBirth').value = record.date_of_birth || '';
    document.getElementById('dateOfDeath').value = record.date_of_death || '';
    document.getElementById('burialDate').value = record.burial_date || '';
    document.getElementById('nextOfKin').value = record.next_of_kin || '';
    document.getElementById('contactInfo').value = record.contact_info || '';
    document.getElementById('notes').value = record.notes || '';
    const submitBtn = document.getElementById('recordSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Save Record';
        submitBtn.type = 'submit';
        submitBtn.onclick = null;
    }
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function deleteRecord(id) {
    deleteId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

function mapRecord() {
    // const record = records.find(r => String(r.id) === String(id));
    // if (!record) { CustomToast?.error('Error', 'Record not found'); return; }
    const modal = new bootstrap.Modal(document.getElementById('MapModal'));
    // document.getElementById('MapRecord').value = record.grave_number || '';
    modal.show();
}

async function confirmDelete() {
    if (!deleteId) return;
    try {
        const formData = new FormData();
        formData.append('action', 'deleteBurialRecord');
        formData.append('id', deleteId);
        const response = await axios.post(`${recordsAPI}`, formData, {
            headers: authManager.API_CONFIG.getFormHeaders()
        });
        const result = response.data;
        if (result && result.success) {
            CustomToast && CustomToast.success('Success', result.message || 'Deleted');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            await loadRecords();
        } else {
            CustomToast && CustomToast.error('Error', (result && result.message) || 'Delete failed');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Delete failed');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

// Functions for managing deceased records
function resetDeceasedRecords() {
    const container = document.getElementById('deceasedRecordsContainer');
    container.innerHTML = `
        <div class="deceased-record border rounded p-3 mb-3" data-record-index="0">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Deceased Person #1</h6>
                <button type="button" class="btn btn-sm btn-danger remove-deceased" style="display: none;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="row g-3">
                <div class="col-md-8">
                    <label class="form-label">Deceased Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control deceased-name" name="deceased_records[0][deceased_name]" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-control date-of-birth" name="deceased_records[0][date_of_birth]">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Date of Death <span class="text-danger">*</span></label>
                    <input type="date" class="form-control date-of-death" name="deceased_records[0][date_of_death]" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Burial Date <span class="text-danger">*</span></label>
                    <input type="date" class="form-control burial-date" name="deceased_records[0][burial_date]" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Layer Number</label>
                    <input type="number" class="form-control grave-layer-number" name="deceased_records[0][grave_layer_number]" min="1" value="1">
                    <div class="form-text">Layer 1, 2, 3, etc.</div>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Next of Kin</label>
                    <input type="text" class="form-control next-of-kin" name="deceased_records[0][next_of_kin]">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Contact Info</label>
                    <input type="text" class="form-control contact-info" name="deceased_records[0][contact_info]">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control notes" name="deceased_records[0][notes]" rows="2"></textarea>
                </div>
            </div>
        </div>
    `;
    updateRemoveButtons();
}

function addDeceasedRecord() {
    const container = document.getElementById('deceasedRecordsContainer');
    const newIndex = deceasedRecordCount;
    deceasedRecordCount++;
    
    const newRecord = document.createElement('div');
    newRecord.className = 'deceased-record border rounded p-3 mb-3';
    newRecord.setAttribute('data-record-index', newIndex);
    newRecord.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Deceased Person #${newIndex + 1}</h6>
            <button type="button" class="btn btn-sm btn-danger remove-deceased">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="row g-3">
            <div class="col-md-8">
                <label class="form-label">Deceased Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control deceased-name" name="deceased_records[${newIndex}][deceased_name]" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-control date-of-birth" name="deceased_records[${newIndex}][date_of_birth]">
            </div>
            <div class="col-md-3">
                <label class="form-label">Date of Death <span class="text-danger">*</span></label>
                <input type="date" class="form-control date-of-death" name="deceased_records[${newIndex}][date_of_death]" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">Burial Date <span class="text-danger">*</span></label>
                <input type="date" class="form-control burial-date" name="deceased_records[${newIndex}][burial_date]" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">Layer Number</label>
                <input type="number" class="form-control grave-layer-number" name="deceased_records[${newIndex}][grave_layer_number]" min="1" value="${newIndex + 1}">
                <div class="form-text">Layer 1, 2, 3, etc.</div>
            </div>
            <div class="col-md-4">
                <label class="form-label">Next of Kin</label>
                <input type="text" class="form-control next-of-kin" name="deceased_records[${newIndex}][next_of_kin]">
            </div>
            <div class="col-md-6">
                <label class="form-label">Contact Info</label>
                <input type="text" class="form-control contact-info" name="deceased_records[${newIndex}][contact_info]">
            </div>
            <div class="col-md-6">
                <label class="form-label">Notes</label>
                <textarea class="form-control notes" name="deceased_records[${newIndex}][notes]" rows="2"></textarea>
            </div>
        </div>
    `;
    
    container.appendChild(newRecord);
    updateRemoveButtons();
}

function removeDeceasedRecord(button) {
    const recordElement = button.closest('.deceased-record');
    recordElement.remove();
    updateRemoveButtons();
    updateRecordNumbers();
}

function updateRemoveButtons() {
    const records = document.querySelectorAll('.deceased-record');
    records.forEach((record, index) => {
        const removeBtn = record.querySelector('.remove-deceased');
        if (records.length > 1) {
            removeBtn.style.display = 'block';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

function updateRecordNumbers() {
    const records = document.querySelectorAll('.deceased-record');
    records.forEach((record, index) => {
        const title = record.querySelector('h6');
        title.textContent = `Deceased Person #${index + 1}`;
    });
}

function getDeceasedRecordsData() {
    const records = [];
    const recordElements = document.querySelectorAll('.deceased-record');
    
    recordElements.forEach((element, index) => {
        const record = {
            deceased_name: element.querySelector('.deceased-name').value,
            date_of_birth: element.querySelector('.date-of-birth').value,
            date_of_death: element.querySelector('.date-of-death').value,
            burial_date: element.querySelector('.burial-date').value,
            grave_layer_number: element.querySelector('.grave-layer-number').value,
            next_of_kin: element.querySelector('.next-of-kin').value,
            contact_info: element.querySelector('.contact-info').value,
            notes: element.querySelector('.notes').value
        };
        records.push(record);
    });
    
    return records;
}

// Event listeners for dynamic functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add deceased record button
    const addDeceasedBtn = document.getElementById('addDeceasedBtn');
    if (addDeceasedBtn) {
        addDeceasedBtn.addEventListener('click', addDeceasedRecord);
    }
    
    // Remove deceased record buttons (delegated event listener)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-deceased')) {
            removeDeceasedRecord(e.target.closest('.remove-deceased'));
        }
    });
});

// Handle form submission
document.getElementById('recordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        const formData = new FormData(this);
        const recordId = document.getElementById('recordId').value;
        const graveId = document.getElementById('graveId').value;
        
        if (recordId) {
            // Update existing record (single record)
            formData.append('action', 'updateBurialRecord');
            formData.append('id', recordId);
        } else if (graveId) {
            // Add record to existing grave - extract the first deceased record data
            const deceasedRecords = getDeceasedRecordsData();
            if (deceasedRecords.length > 0) {
                const record = deceasedRecords[0];
                formData.append('action', 'addRecordToGrave');
                formData.append('grave_id', graveId);
                formData.append('deceased_name', record.deceased_name);
                formData.append('date_of_birth', record.date_of_birth);
                formData.append('date_of_death', record.date_of_death);
                formData.append('burial_date', record.burial_date);
                formData.append('grave_layer_number', record.grave_layer_number);
                formData.append('next_of_kin', record.next_of_kin);
                formData.append('contact_info', record.contact_info);
                formData.append('notes', record.notes);
            } else {
                CustomToast && CustomToast.error('Error', 'No deceased record data found');
                return;
            }
        } else {
            // Create new records (multiple records for same grave)
            formData.append('action', 'createMultipleBurialRecords');
        }
        
        const response = await axios.post(`${recordsAPI}`, formData, {
            headers: authManager.API_CONFIG.getFormHeaders()
        });
        const result = response.data;
        if (result && result.success) {
            await loadRecords();
            CustomToast && CustomToast.success('Success', result.message || 'Saved');
            bootstrap.Modal.getInstance(document.getElementById('recordModal')).hide();
        } else {
            CustomToast && CustomToast.error('Error', (result && result.message) || 'Save failed');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Save failed');
        // eslint-disable-next-line no-console
        console.error(err);
    }
});
