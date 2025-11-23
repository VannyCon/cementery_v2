// Records Management (Admin)

let records = [];
let recordMeta = { page: 1, size: 12, total: 0, totalPages: 1, search: "" };
let deleteId = null;

const authManager = new AuthManager();
const recordsAPI = authManager.API_CONFIG.baseURL + "records.php";

// Load records when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadRecords();
  const searchInput = document.getElementById("recordSearch");
  const pageSizeSelect = document.getElementById("recordPageSize");
  if (searchInput) {
    let debounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        recordMeta.search = searchInput.value.trim();
        recordMeta.page = 1;
        renderRecordsFromCache();
        loadRecords();
      }, 300);
    });
  }
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      recordMeta.size = parseInt(pageSizeSelect.value, 10) || 12;
      recordMeta.page = 1;
      renderRecordsFromCache();
      loadRecords();
    });
  }
});

async function loadRecords() {
  try {
    const params = new URLSearchParams({
      action: "getAllRecords",
      page: String(recordMeta.page),
      size: String(recordMeta.size),
      grouped: "true",
    });
    if (recordMeta.search) params.set("search", recordMeta.search);
    const response = await axios.get(`${recordsAPI}?${params.toString()}`, {
      headers: authManager.API_CONFIG.getHeaders(),
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
        recordMeta.totalPages = Math.max(
          1,
          Math.ceil(recordMeta.total / recordMeta.size)
        );
      }
      renderRecordsFromCache();
    } else {
      const message =
        response.data && response.data.message
          ? response.data.message
          : "Unknown error";
      showAlert && showAlert("Error loading records: " + message, "danger");
    }
  } catch (err) {
    CustomToast && CustomToast.error("Error", "Failed to load records");
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

function getFilteredRecords() {
  if (!recordMeta.search) return records;
  const q = recordMeta.search.toLowerCase();
  return records.filter((r) => {
    const name = (r.name || "").toLowerCase();
    const desc = (r.description || "").toLowerCase();
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
  const tbody = document.querySelector("#recordTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Handle both grouped and flat data structures
  let groupedRecords = {};
  if (Array.isArray(data)) {
    // Flat array structure - group by grave_number
    if (data.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML =
        '<td colspan="5" class="text-center text-muted">No records found</td>';
      tbody.appendChild(emptyRow);
      return;
    }

    data.forEach((record) => {
      const graveNumber = record.grave_number || "Unknown";
      if (!groupedRecords[graveNumber]) {
        groupedRecords[graveNumber] = [];
      }
      groupedRecords[graveNumber].push(record);
    });
  } else if (typeof data === "object" && data !== null) {
    // Already grouped structure
    groupedRecords = data;

    if (Object.keys(groupedRecords).length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML =
        '<td colspan="5" class="text-center text-muted">No records found</td>';
      tbody.appendChild(emptyRow);
      return;
    }
  } else {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="5" class="text-center text-muted">No records found</td>';
    tbody.appendChild(emptyRow);
    return;
  }

  // Display grouped records
  Object.keys(groupedRecords).forEach((graveNumber) => {
    const graveRecords = groupedRecords[graveNumber];
    const row = document.createElement("tr");

    // Create deceased records display
    const deceasedRecordsHtml = graveRecords
      .map(
        (record, index) => `
            <div class="deceased-record-item border rounded p-2 mb-2 ${
              index > 0 ? "mt-2" : ""
            }">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-info">Layer ${
                              record.grave_layer_number || 1
                            }</span>
                            <strong>${
                              record.deceased_name || "Unknown"
                            }</strong>
                            
                        </div>
                        <div class="small text-muted">
                            ${
                              record.date_of_death
                                ? `Died: ${
                                    window.Utils?.formatDate(
                                      record.date_of_death
                                    ) || record.date_of_death
                                  }`
                                : ""
                            }
                            ${
                              record.burial_date
                                ? ` | Buried: ${
                                    window.Utils?.formatDate(
                                      record.burial_date
                                    ) || record.burial_date
                                  }`
                                : ""
                            }
                        </div>
                        ${
                          record.next_of_kin
                            ? `<div class="small">Next of Kin: ${record.next_of_kin}</div>`
                            : ""
                        }
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="viewRecord(${
                          record.id
                        })" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editRecord(${
                          record.id
                        })" title="Edit">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteRecord(${
                          record.id
                        })" title="Delete">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    // Get unique layer numbers
    const layers = [
      ...new Set(graveRecords.map((r) => r.grave_layer_number || 1)),
    ].sort((a, b) => a - b);

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
                <div class="small text-muted">burial${
                  graveRecords.length > 1 ? "s" : ""
                }</div>
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
  const el = document.getElementById("recordCount");
  if (!el) return;
  const start = (recordMeta.page - 1) * recordMeta.size + 1;
  const end = Math.min(recordMeta.page * recordMeta.size, recordMeta.total);
  const shown = recordMeta.total === 0 ? 0 : end - start + 1;
  el.textContent = `Showing ${shown} of ${recordMeta.total} records (Page ${recordMeta.page}/${recordMeta.totalPages})`;
}

function renderRecordPagination() {
  const container = document.getElementById("recordPagination");
  if (!container) return;
  const page = recordMeta.page || 1;
  const totalPages = recordMeta.totalPages || 1;
  container.innerHTML = "";
  const createItem = (label, disabled, active, targetPage) => {
    const li = document.createElement("li");
    li.className = `page-item${disabled ? " disabled" : ""}${
      active ? " active" : ""
    }`;
    const a = document.createElement(active ? "span" : "a");
    a.className = "page-link";
    a.textContent = label;
    if (!active && !disabled) {
      a.href = "#";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        recordMeta.page = targetPage;
        renderRecordsFromCache();
        loadRecords();
      });
    }
    li.appendChild(a);
    return li;
  };
  container.appendChild(
    createItem("Previous", page <= 1, false, Math.max(1, page - 1))
  );
  const maxToShow = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxToShow - 1);
  if (end - start + 1 < maxToShow) start = Math.max(1, end - maxToShow + 1);
  for (let i = start; i <= end; i++) {
    container.appendChild(createItem(String(i), false, i === page, i));
  }
  if (end < totalPages) {
    const dots = document.createElement("li");
    dots.className = "page-item disabled";
    const span = document.createElement("span");
    span.className = "page-link";
    span.textContent = "...";
    dots.appendChild(span);
    container.appendChild(dots);
    container.appendChild(
      createItem(String(totalPages), false, false, totalPages)
    );
  }
  container.appendChild(
    createItem(
      "Next",
      page >= totalPages,
      false,
      Math.min(totalPages, page + 1)
    )
  );
}

// Global variable to track deceased record count
let deceasedRecordCount = 1;

function openAddModal() {
  document.getElementById("recordModalLabel").textContent = "Add Records";
  document.getElementById("recordForm").reset();
  document.getElementById("recordId").value = "";
  document.getElementById("graveId").value = "";

  // Reset to single deceased record
  deceasedRecordCount = 1;
  resetDeceasedRecords();

  const submitBtn = document.getElementById("recordSubmitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Next";
    submitBtn.type = "button";
    submitBtn.onclick = () => {
      const form = document.getElementById("recordForm");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const formDataObj = {
        deceased_records: getDeceasedRecordsData(),
      };
      try {
        sessionStorage.setItem("newRecordDraft", JSON.stringify(formDataObj));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Could not store form draft in sessionStorage", e);
      }
      window.location.href = "map.php";
    };
  }
  const modal = new bootstrap.Modal(document.getElementById("recordModal"));
  modal.show();
}

function addRecordToGrave(graveNumber) {
  // Find the grave ID for the given grave number
  let graveId = null;
  if (Array.isArray(records)) {
    const graveRecord = records.find((r) => r.grave_number === graveNumber);
    graveId = graveRecord ? graveRecord.grave_id_fk : null;
  } else if (typeof records === "object" && records !== null) {
    const graveRecords = records[graveNumber];
    if (graveRecords && graveRecords.length > 0) {
      graveId = graveRecords[0].grave_id_fk;
    }
  }

  document.getElementById("recordModalLabel").textContent =
    "Add Record to Grave";
  document.getElementById("recordForm").reset();
  document.getElementById("recordId").value = "";
  document.getElementById("graveId").value = graveId || "";

  // Reset to single deceased record
  deceasedRecordCount = 1;
  resetDeceasedRecords();

  const submitBtn = document.getElementById("recordSubmitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Save Record";
    submitBtn.type = "submit";
    submitBtn.onclick = null;
  }
  const modal = new bootstrap.Modal(document.getElementById("recordModal"));
  modal.show();
}

function viewGraveDetails(graveNumber) {
  let graveRecords = [];

  // Handle both grouped and flat data structures
  if (Array.isArray(records)) {
    graveRecords = records.filter((r) => r.grave_number === graveNumber);
  } else if (typeof records === "object" && records !== null) {
    graveRecords = records[graveNumber] || [];
  }

  if (graveRecords.length === 0) return;

  // Build image gallery from joined image_path (same for all records in a grave)
  const imagesCsv =
    graveRecords[0] && graveRecords[0].image_path
      ? String(graveRecords[0].image_path)
      : "";
  const imageFiles = imagesCsv
    .split(",")
    .map((s) => (s || "").trim())
    .filter((s) => s.length > 0);

  const galleryHtml = imageFiles.length
    ? `
            <div class="mb-3">
                <h6 class="mb-2">Grave Images</h6>
                <div class="row g-2">
                    ${imageFiles
                      .map(
                        (fn) => `
                        <div class=\"col-3 col-sm-2\">
                            <img src=\"${fn}\" 
                                 alt=\"${fn}\" 
                                 class=\"img-thumbnail\" 
                                 style=\"width: 100%; height: 70px; object-fit: cover; cursor: pointer;\"
                                 onclick=\"previewGraveImage('${fn}','Grave ${graveNumber}')\">
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
          `
    : "";

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
                        <p><strong>Name:</strong> ${
                          record.deceased_name || "Unknown"
                        }</p>
                        <p><strong>Date of Birth:</strong> ${
                          record.date_of_birth || "Not specified"
                        }</p>
                        <p><strong>Date of Death:</strong> ${
                          record.date_of_death || "Not specified"
                        }</p>
                        <p><strong>Burial Date:</strong> ${
                          record.burial_date || "Not specified"
                        }</p>
                        <p><strong>Next of Kin:</strong> ${
                          record.next_of_kin || "Not specified"
                        }</p>
                        <p><strong>Contact:</strong> ${
                          record.contact_info || "Not specified"
                        }</p>
                        ${
                          record.notes
                            ? `<p><strong>Notes:</strong> ${record.notes}</p>`
                            : ""
                        }
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
  const modal = document.createElement("div");
  modal.className = "modal fade";
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
  const bsModal = new bootstrap.Modal(modal, {
    backdrop: "static",
    keyboard: true,
  });
  bsModal.show();

  modal.addEventListener("hidden.bs.modal", () => {
    document.body.removeChild(modal);
  });
}

function previewGraveImage(src, title) {
  // Remove existing preview if any
  const existing = document.getElementById("graveImageOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "graveImageOverlay";
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

  overlay.querySelector("button").onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

function viewRecord(id) {
  let record = null;

  // Handle both grouped and flat data structures
  if (Array.isArray(records)) {
    record = records.find((r) => String(r.id) === String(id));
  } else if (typeof records === "object" && records !== null) {
    // Search through all grave groups
    for (const graveNumber in records) {
      record = records[graveNumber].find((r) => String(r.id) === String(id));
      if (record) break;
    }
  }

  if (!record) {
    CustomToast && CustomToast.error("Error", "Record not found");
    return;
  }
  document.getElementById("viewGraveNumber").textContent =
    record.grave_number || "";
  document.getElementById("viewDeceasedName").textContent =
    record.deceased_name || "";
  document.getElementById("viewDateOfBirth").textContent =
    window.Utils.formatDate(record.date_of_birth);
  document.getElementById("viewDateOfDeath").textContent =
    window.Utils.formatDate(record.date_of_death);
  document.getElementById("viewBurialDate").textContent =
    window.Utils.formatDate(record.burial_date);
  document.getElementById("viewNextOfKin").textContent =
    record.next_of_kin || "";
  document.getElementById("viewContactInfo").textContent =
    record.contact_info || "";
  document.getElementById("viewNotes").textContent = record.notes || "";

  // Display grave photos
  displayGravePhotos(record);

  const modal = new bootstrap.Modal(document.getElementById("viewModal"));
  modal.show();
}

function displayGravePhotos(record) {
  const container = document.getElementById("viewGravePhotosContainer");
  const gallery = document.getElementById("viewGravePhotosGallery");

  if (!container || !gallery) return;

  // Get grave_image from record (comma-separated URLs)
  const graveImage = record.grave_image || "";
  const imageUrls = graveImage
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (imageUrls.length > 0) {
    // Show container and build gallery
    container.style.display = "block";
    gallery.innerHTML = imageUrls
      .map(
        (url, index) => `
            <div class="col-3 col-sm-2">
                <img src="${url}" 
                     alt="Grave Photo ${index + 1}" 
                     class="img-thumbnail" 
                     style="width: 100%; height: 100px; object-fit: cover; cursor: pointer;"
                     onclick="previewGraveImage('${url}', '${
          record.deceased_name || "Grave Photo"
        }')"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3EImage%3C/text%3E%3C/svg%3E'">
            </div>
        `
      )
      .join("");
  } else {
    // Hide container if no images
    container.style.display = "none";
    gallery.innerHTML = "";
  }
}

function editRecord(id) {
  let record = null;

  // Handle both grouped and flat data structures
  if (Array.isArray(records)) {
    record = records.find((r) => String(r.id) === String(id));
  } else if (typeof records === "object" && records !== null) {
    // Search through all grave groups
    for (const graveNumber in records) {
      record = records[graveNumber].find((r) => String(r.id) === String(id));
      if (record) break;
    }
  }

  if (!record) {
    CustomToast?.error("Error", "Record not found");
    return;
  }

  // Set modal title
  document.getElementById("recordModalLabel").textContent = "Edit Record";

  // Set record ID for update
  document.getElementById("recordId").value = record.id;

  // Reset form and create single deceased record for editing
  document.getElementById("recordForm").reset();
  document.getElementById("recordId").value = record.id;
  document.getElementById("graveId").value = record.grave_id_fk || "";

  // Reset to single deceased record and populate it
  deceasedRecordCount = 1;
  resetDeceasedRecords();

  // Populate the form fields with record data
  const firstRecord = document.querySelector(".deceased-record");
  if (firstRecord) {
    firstRecord.querySelector(".deceased-name").value =
      record.deceased_name || "";
    firstRecord.querySelector(".date-of-birth").value =
      record.date_of_birth || "";
    firstRecord.querySelector(".date-of-death").value =
      record.date_of_death || "";
    firstRecord.querySelector(".burial-date").value = record.burial_date || "";
    firstRecord.querySelector(".grave-layer-number").value =
      record.grave_layer_number || 1;
    firstRecord.querySelector(".next-of-kin").value = record.next_of_kin || "";
    firstRecord.querySelector(".contact-info").value =
      record.contact_info || "";
    firstRecord.querySelector(".notes").value = record.notes || "";
  }

  // Set submit button for update
  const submitBtn = document.getElementById("recordSubmitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Update Record";
    submitBtn.type = "submit";
    submitBtn.onclick = null;
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("recordModal"));
  modal.show();
}

function deleteRecord(id) {
  deleteId = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function mapRecord() {
  // const record = records.find(r => String(r.id) === String(id));
  // if (!record) { CustomToast?.error('Error', 'Record not found'); return; }
  const modal = new bootstrap.Modal(document.getElementById("MapModal"));
  // document.getElementById('MapRecord').value = record.grave_number || '';
  modal.show();
}

async function confirmDelete() {
  if (!deleteId) return;
  try {
    const formData = new FormData();
    formData.append("action", "deleteBurialRecord");
    formData.append("id", deleteId);
    const response = await axios.post(`${recordsAPI}`, formData, {
      headers: authManager.API_CONFIG.getFormHeaders(),
    });
    const result = response.data;
    if (result && result.success) {
      CustomToast &&
        CustomToast.success("Success", result.message || "Deleted");
      bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      ).hide();
      await loadRecords();
    } else {
      CustomToast &&
        CustomToast.error(
          "Error",
          (result && result.message) || "Delete failed"
        );
    }
  } catch (err) {
    CustomToast && CustomToast.error("Error", "Delete failed");
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

// Functions for managing deceased records
function resetDeceasedRecords() {
  const container = document.getElementById("deceasedRecordsContainer");
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
                    <label class="form-label">Burial Date</label>
                    <input type="date" class="form-control burial-date" name="deceased_records[0][burial_date]">
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
                <div class="col-12">
                    <label class="form-label">Grave Photos <span class="text-muted small">(Max 3 photos)</span></label>
                    <div class="input-group">
                        <input type="file" class="form-control grave-photo-input" 
                               name="deceased_records[0][grave_photo][]" 
                               accept="image/*" 
                               multiple 
                               data-record-index="0"
                               data-max-files="3">
                        <button type="button" class="btn btn-outline-primary capture-grave-photo-btn" 
                                data-record-index="0" 
                                title="Take Photo">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                    <div class="form-text">You can select up to 3 images or take photos directly.</div>
                    <div class="grave-photo-preview mt-2" data-record-index="0"></div>
                </div>
            </div>
        </div>
    `;
  updateRemoveButtons();
  initializeGravePhotoHandlers(0);
}

function addDeceasedRecord() {
  const container = document.getElementById("deceasedRecordsContainer");
  const newIndex = deceasedRecordCount;
  deceasedRecordCount++;

  const newRecord = document.createElement("div");
  newRecord.className = "deceased-record border rounded p-3 mb-3";
  newRecord.setAttribute("data-record-index", newIndex);
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
                <input type="date" class="form-control burial-date" name="deceased_records[${newIndex}][burial_date]">
            </div>
            <div class="col-md-3">
                <label class="form-label">Layer Number</label>
                <input type="number" class="form-control grave-layer-number" name="deceased_records[${newIndex}][grave_layer_number]" min="1" value="${
    newIndex + 1
  }">
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
            <div class="col-12">
                <label class="form-label">Grave Photos <span class="text-muted small">(Max 3 photos)</span></label>
                <div class="input-group">
                    <input type="file" class="form-control grave-photo-input" 
                           name="deceased_records[${newIndex}][grave_photo][]" 
                           accept="image/*" 
                           multiple 
                           data-record-index="${newIndex}"
                           data-max-files="3">
                    <button type="button" class="btn btn-outline-primary capture-grave-photo-btn" 
                            data-record-index="${newIndex}" 
                            title="Take Photo">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <div class="form-text">You can select up to 3 images or take photos directly.</div>
                <div class="grave-photo-preview mt-2" data-record-index="${newIndex}"></div>
            </div>
        </div>
    `;

  container.appendChild(newRecord);
  updateRemoveButtons();
  initializeGravePhotoHandlers(newIndex);
}

function removeDeceasedRecord(button) {
  const recordElement = button.closest(".deceased-record");
  recordElement.remove();
  updateRemoveButtons();
  updateRecordNumbers();
}

function updateRemoveButtons() {
  const records = document.querySelectorAll(".deceased-record");
  records.forEach((record, index) => {
    const removeBtn = record.querySelector(".remove-deceased");
    if (records.length > 1) {
      removeBtn.style.display = "block";
    } else {
      removeBtn.style.display = "none";
    }
  });
}

function updateRecordNumbers() {
  const records = document.querySelectorAll(".deceased-record");
  records.forEach((record, index) => {
    const title = record.querySelector("h6");
    title.textContent = `Deceased Person #${index + 1}`;
  });
}

function getDeceasedRecordsData() {
  const records = [];
  const recordElements = document.querySelectorAll(".deceased-record");

  recordElements.forEach((element, index) => {
    const gravePhotoInput = element.querySelector(".grave-photo-input");
    const gravePhotoFiles =
      gravePhotoInput && gravePhotoInput.files
        ? Array.from(gravePhotoInput.files)
        : [];

    const record = {
      deceased_name: element.querySelector(".deceased-name").value,
      date_of_birth: element.querySelector(".date-of-birth").value,
      date_of_death: element.querySelector(".date-of-death").value,
      burial_date: element.querySelector(".burial-date").value,
      grave_layer_number: element.querySelector(".grave-layer-number").value,
      next_of_kin: element.querySelector(".next-of-kin").value,
      contact_info: element.querySelector(".contact-info").value,
      notes: element.querySelector(".notes").value,
      grave_photo: gravePhotoFiles,
    };
    records.push(record);
  });

  return records;
}

// Event listeners for dynamic functionality
document.addEventListener("DOMContentLoaded", function () {
  // Add deceased record button
  const addDeceasedBtn = document.getElementById("addDeceasedBtn");
  if (addDeceasedBtn) {
    addDeceasedBtn.addEventListener("click", addDeceasedRecord);
  }

  // Remove deceased record buttons (delegated event listener)
  document.addEventListener("click", function (e) {
    if (e.target.closest(".remove-deceased")) {
      removeDeceasedRecord(e.target.closest(".remove-deceased"));
    }
  });
});

// Handle form submission
document
  .getElementById("recordForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    let fileCount = 0; // Declare outside try block for catch block access
    try {
      const formData = new FormData(this);
      const recordId = document.getElementById("recordId").value;
      const graveId = document.getElementById("graveId").value;

      // Calculate total file size for progress tracking
      let totalFileSize = 0;
      fileCount = 0;
      const deceasedRecords = getDeceasedRecordsData();
      deceasedRecords.forEach((record) => {
        if (record.grave_photo && record.grave_photo.length > 0) {
          record.grave_photo.forEach((file) => {
            totalFileSize += file.size;
            fileCount++;
          });
        }
      });

      // Show progress modal if there are files to upload
      if (fileCount > 0) {
        showUploadProgress(fileCount, totalFileSize);
      }

      // Track upload start time for speed calculation
      const uploadStartTime = Date.now();

      if (recordId) {
        // Update existing record (single record)
        formData.append("action", "updateBurialRecord");
        formData.append("id", recordId);

        // For editing, we need to get the data from the first (and only) deceased record
        if (deceasedRecords.length > 0) {
          const record = deceasedRecords[0];
          formData.append("deceased_name", record.deceased_name);
          formData.append("date_of_birth", record.date_of_birth);
          formData.append("date_of_death", record.date_of_death);
          formData.append("burial_date", record.burial_date);
          formData.append("grave_layer_number", record.grave_layer_number);
          formData.append("next_of_kin", record.next_of_kin);
          formData.append("contact_info", record.contact_info);
          formData.append("notes", record.notes);
        }
      } else if (graveId) {
        // Add record to existing grave - extract the first deceased record data
        if (deceasedRecords.length > 0) {
          const record = deceasedRecords[0];
          formData.append("action", "addRecordToGrave");
          formData.append("grave_id", graveId);
          formData.append("deceased_name", record.deceased_name);
          formData.append("date_of_birth", record.date_of_birth);
          formData.append("date_of_death", record.date_of_death);
          formData.append("burial_date", record.burial_date);
          formData.append("grave_layer_number", record.grave_layer_number);
          formData.append("next_of_kin", record.next_of_kin);
          formData.append("contact_info", record.contact_info);
          formData.append("notes", record.notes);
        } else {
          if (fileCount > 0) hideUploadProgress();
          CustomToast &&
            CustomToast.error("Error", "No deceased record data found");
          return;
        }
      } else {
        // Create new records (multiple records for same grave)
        formData.append("action", "createMultipleBurialRecords");
      }

      const response = await axios.post(`${recordsAPI}`, formData, {
        headers: authManager.API_CONFIG.getFormHeaders(),
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && fileCount > 0) {
            // Calculate progress percentage
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            // Calculate upload speed
            const elapsedTime = (Date.now() - uploadStartTime) / 1000; // in seconds
            const uploadSpeed =
              elapsedTime > 0 ? progressEvent.loaded / elapsedTime : 0; // bytes per second
            const speedText = formatFileSize(uploadSpeed) + "/s";

            // Update progress (show 90% max during upload, leave 10% for processing)
            const uploadPercent = Math.min(
              90,
              Math.round(percentCompleted * 0.9)
            );
            updateUploadProgress(
              uploadPercent,
              progressEvent.loaded,
              progressEvent.total,
              speedText,
              fileCount
            );
          }
        },
      });

      // Show processing phase (last 10%) if files were uploaded
      if (fileCount > 0) {
        updateUploadProgress(
          95,
          response.headers["content-length"] || 0,
          response.headers["content-length"] || 0,
          "",
          fileCount
        );

        // Small delay to show processing phase
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Hide progress modal after a brief delay
        updateUploadProgress(100, 0, 0, "", fileCount);
        setTimeout(() => {
          hideUploadProgress();
        }, 300);
      }

      const result = response.data;
      if (result && result.success) {
        await loadRecords();
        CustomToast &&
          CustomToast.success("Success", result.message || "Saved");
        bootstrap.Modal.getInstance(
          document.getElementById("recordModal")
        ).hide();
      } else {
        if (fileCount > 0) hideUploadProgress();
        CustomToast &&
          CustomToast.error(
            "Error",
            (result && result.message) || "Save failed"
          );
      }
    } catch (err) {
      if (fileCount > 0) hideUploadProgress();
      CustomToast && CustomToast.error("Error", "Save failed");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });

// Grave Photo Upload and Camera Functionality
let currentRecordIndexForCamera = null;
let cameraStream = null;
let capturedBlob = null;

// Initialize grave photo handlers for a specific record index
function initializeGravePhotoHandlers(recordIndex) {
  const photoInput = document.querySelector(
    `input.grave-photo-input[data-record-index="${recordIndex}"]`
  );
  const previewContainer = document.querySelector(
    `div.grave-photo-preview[data-record-index="${recordIndex}"]`
  );
  const captureBtn = document.querySelector(
    `button.capture-grave-photo-btn[data-record-index="${recordIndex}"]`
  );

  if (!photoInput || !previewContainer || !captureBtn) {
    // eslint-disable-next-line no-console
    console.warn(
      `Could not initialize grave photo handlers for record index ${recordIndex}. Missing elements.`
    );
    return;
  }

  // Check if handlers are already initialized to prevent duplicates
  if (photoInput.hasAttribute("data-handlers-initialized")) {
    return;
  }

  // Mark as initialized
  photoInput.setAttribute("data-handlers-initialized", "true");

  // Handle file selection
  photoInput.addEventListener("change", function (e) {
    const maxFiles = parseInt(this.getAttribute("data-max-files") || "3", 10);
    const files = Array.from(this.files);

    // Limit to max files
    if (files.length > maxFiles) {
      CustomToast &&
        CustomToast.error(
          "Error",
          `You can only upload up to ${maxFiles} photos per deceased person.`
        );
      this.value = "";
      updatePhotoPreview(recordIndex);
      return;
    }

    updatePhotoPreview(recordIndex);
  });

  // Handle camera capture button
  captureBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    currentRecordIndexForCamera = recordIndex;
    openCameraModal();
  });
}

// Update photo preview for a specific record
function updatePhotoPreview(recordIndex) {
  const photoInput = document.querySelector(
    `input.grave-photo-input[data-record-index="${recordIndex}"]`
  );
  const previewContainer = document.querySelector(
    `div.grave-photo-preview[data-record-index="${recordIndex}"]`
  );

  if (!photoInput || !previewContainer) return;

  previewContainer.innerHTML = "";

  if (photoInput.files && photoInput.files.length > 0) {
    const previewRow = document.createElement("div");
    previewRow.className = "row g-2";

    Array.from(photoInput.files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const col = document.createElement("div");
        col.className = "col-3 col-sm-2";
        col.innerHTML = `
                    <div class="position-relative">
                        <img src="${e.target.result}" class="img-thumbnail" style="width: 100%; height: 80px; object-fit: cover;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 remove-grave-photo" 
                                style="transform: translate(50%, -50%);" 
                                data-record-index="${recordIndex}" 
                                data-file-index="${index}"
                                title="Remove photo">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
        previewRow.appendChild(col);
      };
      reader.readAsDataURL(file);
    });

    previewContainer.appendChild(previewRow);

    // Add remove button handlers
    previewContainer.querySelectorAll(".remove-grave-photo").forEach((btn) => {
      btn.addEventListener("click", function () {
        removeGravePhoto(
          parseInt(this.getAttribute("data-record-index")),
          parseInt(this.getAttribute("data-file-index"))
        );
      });
    });
  }
}

// Remove a specific photo
function removeGravePhoto(recordIndex, fileIndex) {
  const photoInput = document.querySelector(
    `input.grave-photo-input[data-record-index="${recordIndex}"]`
  );
  if (!photoInput || !photoInput.files) return;

  const dataTransfer = new DataTransfer();
  Array.from(photoInput.files).forEach((file, index) => {
    if (index !== fileIndex) {
      dataTransfer.items.add(file);
    }
  });

  photoInput.files = dataTransfer.files;
  updatePhotoPreview(recordIndex);
}

// Open camera modal
let cameraModalInstance = null;
let parentModalInstance = null;

function openCameraModal() {
  const cameraModal = document.getElementById("cameraModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const capturedImage = document.getElementById("capturedImage");
  const capturedImageContainer = document.getElementById(
    "capturedImageContainer"
  );
  const captureBtn = document.getElementById("captureBtn");
  const retakeBtn = document.getElementById("retakeBtn");
  const addPhotoBtn = document.getElementById("addPhotoBtn");
  const recordModal = document.getElementById("recordModal");

  if (!cameraModal || !cameraVideo) return;

  // Check camera support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    CustomToast &&
      CustomToast.error("Error", "Camera not supported on this device.");
    return;
  }

  // Store parent modal instance if it exists
  if (recordModal) {
    parentModalInstance = bootstrap.Modal.getInstance(recordModal);
  }

  // Create camera modal with options to prevent closing parent
  cameraModalInstance = new bootstrap.Modal(cameraModal, {
    backdrop: "static",
    keyboard: false,
    focus: true,
  });

  // Handle close button (X) and cancel button to use safe close
  // Remove existing listeners first to avoid duplicates
  const closeBtn = document.getElementById("closeCameraModalBtn");
  const cancelBtn = document.getElementById("cancelCameraBtn");

  const closeHandler = function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeCameraModalSafely();
  };

  const cancelHandler = function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeCameraModalSafely();
  };

  if (closeBtn) {
    closeBtn.removeEventListener("click", closeHandler);
    closeBtn.addEventListener("click", closeHandler);
  }

  if (cancelBtn) {
    cancelBtn.removeEventListener("click", cancelHandler);
    cancelBtn.addEventListener("click", cancelHandler);
  }

  // Prevent camera modal from affecting parent modal when hidden
  const modalHiddenHandler = function (e) {
    if (e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    // Ensure parent modal remains open if it was open
    setTimeout(() => {
      if (
        parentModalInstance &&
        recordModal &&
        !recordModal.classList.contains("show")
      ) {
        // Parent was closed, we need to restore it
        parentModalInstance.show();
      }
    }, 50);
  };

  cameraModal.removeEventListener("hidden.bs.modal", modalHiddenHandler);
  cameraModal.addEventListener("hidden.bs.modal", modalHiddenHandler, {
    once: false,
  });

  // Reset all camera UI elements to initial state before showing
  if (cameraVideo) {
    cameraVideo.style.display = "none";
  }
  if (capturedImageContainer) {
    capturedImageContainer.style.display = "none";
  }
  if (captureBtn) {
    captureBtn.style.display = "none";
  }
  if (retakeBtn) {
    retakeBtn.style.display = "none";
  }
  if (addPhotoBtn) {
    addPhotoBtn.style.display = "none";
  }

  // Reset captured blob
  capturedBlob = null;

  // Ensure modal is visible and not blocking
  cameraModal.style.display = "";
  cameraModal.style.pointerEvents = "";

  // Show camera modal
  cameraModalInstance.show();

  // Request camera access
  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })
    .then((stream) => {
      cameraStream = stream;
      if (cameraVideo) {
        cameraVideo.srcObject = stream;
        cameraVideo.style.display = "block";
      }
      if (capturedImageContainer) {
        capturedImageContainer.style.display = "none";
      }
      if (captureBtn) {
        captureBtn.style.display = "inline-block";
      }
      if (retakeBtn) {
        retakeBtn.style.display = "none";
      }
      if (addPhotoBtn) {
        addPhotoBtn.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Camera access error:", error);
      CustomToast &&
        CustomToast.error(
          "Error",
          "Unable to access camera. Please check permissions."
        );
    });

  // Capture photo
  if (captureBtn) {
    captureBtn.onclick = () => {
      const context = cameraCanvas.getContext("2d");
      cameraCanvas.width = cameraVideo.videoWidth;
      cameraCanvas.height = cameraVideo.videoHeight;
      context.drawImage(cameraVideo, 0, 0);

      cameraCanvas.toBlob(
        (blob) => {
          if (blob) {
            capturedBlob = blob;
            const url = URL.createObjectURL(blob);
            capturedImage.src = url;

            cameraVideo.style.display = "none";
            capturedImageContainer.style.display = "block";
            captureBtn.style.display = "none";
            retakeBtn.style.display = "inline-block";
            addPhotoBtn.style.display = "inline-block";
          }
        },
        "image/jpeg",
        0.9
      );
    };
  }

  // Retake photo
  if (retakeBtn) {
    retakeBtn.onclick = () => {
      cameraVideo.style.display = "block";
      capturedImageContainer.style.display = "none";
      captureBtn.style.display = "inline-block";
      retakeBtn.style.display = "none";
      addPhotoBtn.style.display = "none";
      capturedBlob = null;
    };
  }

  // Add captured photo
  if (addPhotoBtn) {
    addPhotoBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!capturedBlob || currentRecordIndexForCamera === null) {
        if (typeof CustomToast !== "undefined") {
          CustomToast.error(
            "Error",
            "No photo captured. Please capture a photo first."
          );
        }
        return;
      }

      const photoInput = document.querySelector(
        `input.grave-photo-input[data-record-index="${currentRecordIndexForCamera}"]`
      );
      if (!photoInput) {
        if (typeof CustomToast !== "undefined") {
          CustomToast.error("Error", "Photo input not found.");
        }
        return;
      }

      const maxFiles = parseInt(
        photoInput.getAttribute("data-max-files") || "3",
        10
      );
      const currentFiles = photoInput.files ? Array.from(photoInput.files) : [];

      if (currentFiles.length >= maxFiles) {
        if (typeof CustomToast !== "undefined") {
          CustomToast.error(
            "Error",
            `You can only upload up to ${maxFiles} photos per deceased person.`
          );
        }
        return;
      }

      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `grave_photo_${timestamp}.jpg`;
        const file = new File([capturedBlob], fileName, { type: "image/jpeg" });

        const dataTransfer = new DataTransfer();
        currentFiles.forEach((f) => dataTransfer.items.add(f));
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;

        updatePhotoPreview(currentRecordIndexForCamera);

        if (typeof CustomToast !== "undefined") {
          CustomToast.success("Success", "Photo added successfully!");
        }

        // Close camera modal manually without affecting parent modal
        closeCameraModalSafely();
      } catch (error) {
        console.error("Error adding photo:", error);
        if (typeof CustomToast !== "undefined") {
          CustomToast.error("Error", "Failed to add photo. Please try again.");
        }
      }
    };
  }

  // Clean up when modal is hidden (use closeCameraModalSafely for consistency)
  const cleanupHandler = function (e) {
    // Stop event propagation to prevent affecting parent modal
    if (e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    // Use the safe close function to ensure all states are reset
    closeCameraModalSafely();
  };

  // Remove any existing listener and add new one
  cameraModal.removeEventListener("hidden.bs.modal", cleanupHandler);
  cameraModal.addEventListener("hidden.bs.modal", cleanupHandler, {
    once: false,
  });
}

// Function to safely close camera modal without affecting parent modal
function closeCameraModalSafely() {
  const cameraModal = document.getElementById("cameraModal");
  const recordModal = document.getElementById("recordModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const capturedImageContainer = document.getElementById(
    "capturedImageContainer"
  );
  const captureBtn = document.getElementById("captureBtn");
  const retakeBtn = document.getElementById("retakeBtn");
  const addPhotoBtn = document.getElementById("addPhotoBtn");

  if (!cameraModal) return;

  // Store parent modal state before closing
  const parentWasOpen = recordModal && recordModal.classList.contains("show");

  // Clean up camera resources first
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  if (cameraVideo) {
    cameraVideo.srcObject = null;
    // Reset video display state
    cameraVideo.style.display = "none";
  }
  capturedBlob = null;

  // Reset all camera UI elements to initial state
  if (capturedImageContainer) {
    capturedImageContainer.style.display = "none";
  }
  if (captureBtn) {
    captureBtn.style.display = "none";
  }
  if (retakeBtn) {
    retakeBtn.style.display = "none";
  }
  if (addPhotoBtn) {
    addPhotoBtn.style.display = "none";
  }

  // Manually hide camera modal without using Bootstrap's hide() which affects parent
  cameraModal.classList.remove("show");
  cameraModal.style.display = "none"; // Ensure it's hidden
  cameraModal.setAttribute("aria-hidden", "true");
  cameraModal.removeAttribute("aria-modal");
  cameraModal.removeAttribute("role");

  // Handle backdrop removal - Bootstrap creates backdrop with higher z-index for nested modals
  // We need to remove only the camera modal's backdrop (the last one)
  const backdrops = document.querySelectorAll(".modal-backdrop");
  if (backdrops.length > 0) {
    // Remove the last backdrop (camera modal's backdrop which is on top)
    // Keep the first backdrop for parent modal if it was open
    if (parentWasOpen && backdrops.length > 1) {
      // Multiple backdrops - remove the last one (camera modal's)
      backdrops[backdrops.length - 1].remove();
    } else if (!parentWasOpen) {
      // No parent modal, remove all backdrops
      backdrops.forEach((backdrop) => backdrop.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }

  // Ensure parent modal remains visible if it was open
  if (parentWasOpen && parentModalInstance && recordModal) {
    setTimeout(() => {
      // Check if parent modal is still visible
      if (recordModal && !recordModal.classList.contains("show")) {
        // Parent was accidentally closed, restore it
        parentModalInstance.show();
      }

      // Ensure only one backdrop exists (for parent modal)
      const remainingBackdrops = document.querySelectorAll(".modal-backdrop");
      if (
        remainingBackdrops.length === 0 &&
        recordModal.classList.contains("show")
      ) {
        // Parent modal is open but no backdrop, create one
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop fade show";
        backdrop.style.zIndex = "1040";
        document.body.appendChild(backdrop);
        document.body.classList.add("modal-open");
      } else if (remainingBackdrops.length > 1) {
        // Multiple backdrops, keep only the first one
        for (let i = 1; i < remainingBackdrops.length; i++) {
          remainingBackdrops[i].remove();
        }
      }
    }, 100);
  }

  // Reset camera modal instance
  if (cameraModalInstance) {
    cameraModalInstance = null;
  }

  // Reset current record index
  currentRecordIndexForCamera = null;

  // Force remove any pointer-events blocking
  cameraModal.style.pointerEvents = "none";

  // Ensure body is not blocked
  setTimeout(() => {
    // Check if there are any remaining blocking elements
    const blockingBackdrops = document.querySelectorAll(".modal-backdrop");
    if (!parentWasOpen && blockingBackdrops.length > 0) {
      blockingBackdrops.forEach((backdrop) => backdrop.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    // Re-enable pointer events on modal after cleanup
    cameraModal.style.pointerEvents = "";
  }, 150);
}

// Initialize photo handlers for existing records on page load
document.addEventListener("DOMContentLoaded", function () {
  // Initialize handlers for the default record (index 0)
  setTimeout(() => {
    initializeGravePhotoHandlers(0);
  }, 100);
});

// Upload Progress Functions
function showUploadProgress(fileCount, totalFileSize) {
  const progressModal = document.getElementById("uploadProgressModal");
  if (!progressModal) return;

  // Reset progress
  updateUploadProgress(0, 0, totalFileSize, "", fileCount);

  // Show modal
  const modal = new bootstrap.Modal(progressModal, {
    backdrop: "static",
    keyboard: false,
  });
  modal.show();
}

function updateUploadProgress(percent, loaded, total, speedText, fileCount) {
  const progressBar = document.getElementById("uploadProgressBar");
  const progressText = document.getElementById("uploadProgressText");
  const progressTitle = document.getElementById("uploadProgressTitle");
  const progressMessage = document.getElementById("uploadProgressMessage");
  const fileCountEl = document.getElementById("uploadFileCount");
  const speedEl = document.getElementById("uploadSpeed");

  if (progressBar) {
    progressBar.style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", percent);
  }

  if (progressText) {
    progressText.textContent = percent + "%";
  }

  if (progressTitle) {
    if (percent < 100) {
      progressTitle.textContent = "Uploading Records...";
    } else {
      progressTitle.textContent = "Processing...";
    }
  }

  if (progressMessage) {
    if (percent < 100) {
      progressMessage.textContent = `Uploading ${fileCount} image${
        fileCount > 1 ? "s" : ""
      } and saving records...`;
    } else {
      progressMessage.textContent = "Finalizing record submission...";
    }
  }

  if (fileCountEl && fileCount > 0) {
    fileCountEl.textContent = `Uploading ${fileCount} image${
      fileCount > 1 ? "s" : ""
    }`;
  }

  if (speedEl && speedText) {
    speedEl.textContent = `Speed: ${speedText}`;
  }

  if (loaded && total) {
    const loadedFormatted = formatFileSize(loaded);
    const totalFormatted = formatFileSize(total);
    if (progressText) {
      progressText.textContent = `${percent}% (${loadedFormatted} / ${totalFormatted})`;
    }
  }
}

function hideUploadProgress() {
  const progressModal = document.getElementById("uploadProgressModal");
  if (!progressModal) return;

  const modalInstance = bootstrap.Modal.getInstance(progressModal);
  if (modalInstance) {
    modalInstance.hide();
  }

  // Reset progress after modal is hidden
  setTimeout(() => {
    updateUploadProgress(0, 0, 0, "", 0);
  }, 300);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
