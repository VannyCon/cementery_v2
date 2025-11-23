// Records Management (Admin)

let records = [];
let recordMeta = { page: 1, size: 12, total: 0, totalPages: 1, search: "" };
let deleteId = null;
const recordsAPI = "../../../api/records.php";

// Load records when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Show Terms and Conditions modal if not already accepted
  initializeTermsModal();

  initializeSearchInterface();
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
      }, 300);
    });
  }
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      recordMeta.size = parseInt(pageSizeSelect.value, 10) || 12;
      recordMeta.page = 1;
      renderRecordsFromCache();
    });
  }
});

// Initialize Terms and Conditions Modal
function initializeTermsModal() {
  const termsModal = document.getElementById("termsModal");
  const acceptTermsCheckbox = document.getElementById("acceptTermsCheckbox");
  const acceptTermsBtn = document.getElementById("acceptTermsBtn");

  if (!termsModal || !acceptTermsCheckbox || !acceptTermsBtn) {
    return;
  }

  // Check if user has already accepted terms
  const termsAccepted = sessionStorage.getItem("termsAccepted");

  if (!termsAccepted) {
    // Show the terms modal
    const modal = new bootstrap.Modal(termsModal);
    modal.show();

    // Disable main content interaction until terms are accepted
    const mainContent = document.querySelector(".container-fluid");
    if (mainContent) {
      mainContent.style.pointerEvents = "none";
      mainContent.style.opacity = "0.5";
    }
  }

  // Enable/disable accept button based on checkbox
  acceptTermsCheckbox.addEventListener("change", function () {
    acceptTermsBtn.disabled = !this.checked;
  });

  // Handle accept button click
  acceptTermsBtn.addEventListener("click", function () {
    if (acceptTermsCheckbox.checked) {
      // Store acceptance in session storage
      sessionStorage.setItem("termsAccepted", "true");
      sessionStorage.setItem("termsAcceptedDate", new Date().toISOString());

      // Re-enable main content
      const mainContent = document.querySelector(".container-fluid");
      if (mainContent) {
        mainContent.style.pointerEvents = "";
        mainContent.style.opacity = "";
      }

      // Close the modal
      const modal = bootstrap.Modal.getInstance(termsModal);
      if (modal) {
        modal.hide();
      }

      // Show success message
      showToast(
        "Terms and Conditions accepted. You may now use the system.",
        "success"
      );
    }
  });
}

// Initialize the fancy search interface
function initializeSearchInterface() {
  const mainSearchBtn = document.getElementById("mainSearchBtn");
  const mainSearchInput = document.getElementById("mainSearchInput");
  const advancedSearchToggle = document.getElementById("advancedSearchToggle");
  const advancedSearchPanel = document.getElementById("advancedSearchPanel");
  const advancedSearchBtn = document.getElementById("advancedSearchBtn");
  const clearAdvancedSearch = document.getElementById("clearAdvancedSearch");
  const newSearchBtn = document.getElementById("newSearchBtn");
  const initialSearchContainer = document.getElementById(
    "initialSearchContainer"
  );
  const resultsSection = document.getElementById("resultsSection");

  // Main search functionality
  if (mainSearchBtn) {
    mainSearchBtn.addEventListener("click", performMainSearch);
  }

  if (mainSearchInput) {
    mainSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performMainSearch();
      }
    });
  }

  // Advanced search toggle
  if (advancedSearchToggle) {
    advancedSearchToggle.addEventListener("click", function () {
      if (advancedSearchPanel.style.display === "none") {
        advancedSearchPanel.style.display = "block";
        advancedSearchPanel.classList.add("fade-in", "slide-up");
        advancedSearchToggle.innerHTML =
          '<i class="fas fa-chevron-up me-2"></i>Hide Advanced Search';
      } else {
        advancedSearchPanel.style.display = "none";
        advancedSearchToggle.innerHTML =
          '<i class="fas fa-cog me-2"></i>Advanced Search';
      }
    });
  }

  // Advanced search functionality
  if (advancedSearchBtn) {
    advancedSearchBtn.addEventListener("click", performAdvancedSearch);
  }

  // Clear advanced search
  if (clearAdvancedSearch) {
    clearAdvancedSearch.addEventListener("click", function () {
      document.getElementById("searchDateOfBirth").value = "";
      document.getElementById("searchDateOfDeath").value = "";
      document.getElementById("searchBurialDate").value = "";
      document.getElementById("searchNextOfKin").value = "";
      document.getElementById("searchContactInfo").value = "";
      document.getElementById("searchNotes").value = "";
    });
  }

  // New search button
  if (newSearchBtn) {
    newSearchBtn.addEventListener("click", function () {
      showInitialSearch();
    });
  }
}

// Perform main search
function performMainSearch() {
  const searchValue = document.getElementById("mainSearchInput").value.trim();
  if (!searchValue) {
    showToast("Please enter a search term", "warning");
    return;
  }

  // Add loading animation
  const searchBtn = document.getElementById("mainSearchBtn");
  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin me-2"></i><span class="search-btn-text">Searching...</span>';
  searchBtn.disabled = true;

  // Set the search term and perform search
  recordMeta.search = searchValue;
  recordMeta.page = 1;

  // Simulate search delay for better UX
  setTimeout(() => {
    loadRecords()
      .then(() => {
        showResultsSection();
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
      })
      .catch((error) => {
        showToast("Search failed. Please try again.", "error");
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
        console.error("Search error:", error);
      });
  }, 800);
}

// Perform advanced search
function performAdvancedSearch() {
  const searchParams = {
    dateOfBirth: document.getElementById("searchDateOfBirth").value,
    dateOfDeath: document.getElementById("searchDateOfDeath").value,
    burialDate: document.getElementById("searchBurialDate").value,
    nextOfKin: document.getElementById("searchNextOfKin").value.trim(),
    contactInfo: document.getElementById("searchContactInfo").value.trim(),
    notes: document.getElementById("searchNotes").value.trim(),
  };

  // Check if at least one field is filled
  const hasSearchCriteria = Object.values(searchParams).some(
    (value) => value !== ""
  );

  if (!hasSearchCriteria) {
    showToast("Please fill at least one search criteria", "warning");
    return;
  }

  // Add loading animation
  const searchBtn = document.getElementById("advancedSearchBtn");
  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin me-2"></i>Searching...';
  searchBtn.disabled = true;

  // Build search query - for now, use simple text search since the API doesn't support advanced filtering yet
  let searchQuery = "";
  if (searchParams.nextOfKin) searchQuery += searchParams.nextOfKin + " ";
  if (searchParams.contactInfo) searchQuery += searchParams.contactInfo + " ";
  if (searchParams.notes) searchQuery += searchParams.notes + " ";
  if (searchParams.dateOfBirth) searchQuery += searchParams.dateOfBirth + " ";
  if (searchParams.dateOfDeath) searchQuery += searchParams.dateOfDeath + " ";
  if (searchParams.burialDate) searchQuery += searchParams.burialDate + " ";

  recordMeta.search = searchQuery.trim();
  recordMeta.page = 1;

  // Simulate search delay for better UX
  setTimeout(() => {
    loadRecords()
      .then(() => {
        showResultsSection();
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
      })
      .catch((error) => {
        showToast("Advanced search failed. Please try again.", "error");
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
        console.error("Advanced search error:", error);
      });
  }, 800);
}

// Show results section with animation
function showResultsSection() {
  const initialSearchContainer = document.getElementById(
    "initialSearchContainer"
  );
  const resultsSection = document.getElementById("resultsSection");
  const advancedSearchPanel = document.getElementById("advancedSearchPanel");

  // Hide initial search and advanced search
  initialSearchContainer.style.display = "none";
  advancedSearchPanel.style.display = "none";

  // Show results section with animation
  resultsSection.style.display = "block";
  resultsSection.classList.add("fade-in", "slide-up");

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Show initial search interface
function showInitialSearch() {
  const initialSearchContainer = document.getElementById(
    "initialSearchContainer"
  );
  const resultsSection = document.getElementById("resultsSection");
  const advancedSearchPanel = document.getElementById("advancedSearchPanel");

  // Hide results section
  resultsSection.style.display = "none";

  // Show initial search
  initialSearchContainer.style.display = "flex";
  initialSearchContainer.classList.add("fade-in");

  // Reset advanced search panel
  advancedSearchPanel.style.display = "none";
  document.getElementById("advancedSearchToggle").innerHTML =
    '<i class="fas fa-cog me-2"></i>Advanced Search';

  // Clear search inputs
  document.getElementById("mainSearchInput").value = "";
  document.getElementById("searchDateOfBirth").value = "";
  document.getElementById("searchDateOfDeath").value = "";
  document.getElementById("searchBurialDate").value = "";
  document.getElementById("searchNextOfKin").value = "";
  document.getElementById("searchContactInfo").value = "";
  document.getElementById("searchNotes").value = "";

  // Reset search meta
  recordMeta.search = "";
  recordMeta.page = 1;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Toast notification function
function showToast(message, type = "info") {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${
                  type === "success"
                    ? "check-circle"
                    : type === "warning"
                    ? "exclamation-triangle"
                    : type === "error"
                    ? "times-circle"
                    : "info-circle"
                } me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

  // Get or create toast container
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "9999";
    document.body.appendChild(toastContainer);
  }

  // Add toast to container
  toastContainer.appendChild(toast);

  // Initialize and show toast
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  // Remove toast element after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

async function loadRecords() {
  try {
    const params = new URLSearchParams({
      action: "getAllRecords",
      page: String(recordMeta.page),
      size: String(recordMeta.size),
    });
    if (recordMeta.search) params.set("search", recordMeta.search);

    // For guest access, don't include authentication headers
    const response = await axios.get(
      `../../../../api/records.php?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.success) {
      // Handle grouped data format where data is an object with grave identifiers as keys
      if (
        response.data.data &&
        typeof response.data.data === "object" &&
        !Array.isArray(response.data.data)
      ) {
        // Flatten grouped data into a single array
        records = [];
        Object.keys(response.data.data).forEach((graveId) => {
          if (
            graveId !== "meta" &&
            Array.isArray(response.data.data[graveId])
          ) {
            response.data.data[graveId].forEach((record) => {
              // Ensure each record has the grave identifier
              records.push({ ...record, grave_number: graveId });
            });
          }
        });
      } else {
        // Handle legacy array format
        records = Array.isArray(response.data.data) ? response.data.data : [];
      }

      // Use server meta data if available, otherwise compute client-side
      if (response.data.meta) {
        recordMeta.total = response.data.meta.total;
        recordMeta.totalPages = response.data.meta.totalPages;
      } else {
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
      showToast("Error loading records: " + message, "error");
    }
  } catch (err) {
    showToast("Failed to load records. Please try again.", "error");
    console.error("Load records error:", err);
  }
}

function getFilteredRecords() {
  if (!recordMeta.search) return records;
  const q = recordMeta.search.toLowerCase();
  return records.filter((r) => {
    const deceasedName = (r.deceased_name || "").toLowerCase();
    const graveNumber = (r.grave_number || "").toLowerCase();
    const nextOfKin = (r.next_of_kin || "").toLowerCase();
    const contactInfo = (r.contact_info || "").toLowerCase();
    const notes = (r.notes || "").toLowerCase();
    const dateOfBirth = (r.date_of_birth || "").toLowerCase();
    const dateOfDeath = (r.date_of_death || "").toLowerCase();
    const burialDate = (r.burial_date || "").toLowerCase();

    return (
      deceasedName.includes(q) ||
      graveNumber.includes(q) ||
      nextOfKin.includes(q) ||
      contactInfo.includes(q) ||
      notes.includes(q) ||
      dateOfBirth.includes(q) ||
      dateOfDeath.includes(q) ||
      burialDate.includes(q)
    );
  });
}

function renderRecordsFromCache() {
  const filtered = getFilteredRecords();
  recordMeta.total = filtered.length;
  recordMeta.totalPages = Math.max(
    1,
    Math.ceil(recordMeta.total / recordMeta.size)
  );
  const start = (recordMeta.page - 1) * recordMeta.size;
  const pageItems = filtered.slice(start, start + recordMeta.size);
  displayRecords(pageItems);
  updateRecordCount();
  renderRecordPagination();
}

function displayRecords(list) {
  // Display desktop table view
  displayDesktopTable(list);
  // Display mobile card view
  displayMobileCards(list);
}

function displayDesktopTable(list) {
  const tbody = document.querySelector("#recordTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!Array.isArray(list) || list.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="9" class="text-center text-muted">No records found</td>';
    tbody.appendChild(emptyRow);
    return;
  }
  list.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="text-nowrap">${record.grave_number || ""}</td>
            <td class="text-nowrap">${record.deceased_name || ""}</td>
            <td class="text-nowrap">${window.Utils.formatDate(
              record.date_of_birth
            )}</td>
            <td class="text-nowrap">${window.Utils.formatDate(
              record.date_of_death
            )}</td>
            <td class="text-nowrap">${window.Utils.formatDate(
              record.burial_date
            )}</td>
            <td class="text-nowrap">${record.next_of_kin || ""}</td>
            <td class="text-nowrap">${record.contact_info || ""}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${
              record.notes || ""
            }">${record.notes || ""}</td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-info" onclick="viewRecord(${
                  record.id
                })" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function displayMobileCards(list) {
  const mobileContainer = document.getElementById("mobileCardView");
  if (!mobileContainer) return;
  mobileContainer.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "text-center text-muted py-4";
    emptyCard.innerHTML = `
            <i class="fas fa-search fa-3x mb-3 opacity-50"></i>
            <p class="mb-0">No records found</p>
        `;
    mobileContainer.appendChild(emptyCard);
    return;
  }

  list.forEach((record) => {
    const card = createMobileRecordCard(record);
    mobileContainer.appendChild(card);
  });
}

function createMobileRecordCard(record) {
  const card = document.createElement("div");
  card.className = "mobile-record-card";
  card.innerHTML = `
        <div class="card-header">
            <span class="grave-number">${record.grave_number || "N/A"}</span>
        </div>
        <div class="deceased-name">${record.deceased_name || "Unknown"}</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">${
                  window.Utils.formatDate(record.date_of_birth) || "N/A"
                }</div>
            </div>
            <div class="info-item">
                <div class="info-label">Date of Death</div>
                <div class="info-value">${
                  window.Utils.formatDate(record.date_of_death) || "N/A"
                }</div>
            </div>
            <div class="info-item">
                <div class="info-label">Burial Date</div>
                <div class="info-value">${
                  window.Utils.formatDate(record.burial_date) || "N/A"
                }</div>
            </div>
            <div class="info-item">
                <div class="info-label">Next of Kin</div>
                <div class="info-value">${record.next_of_kin || "N/A"}</div>
            </div>
            <div class="info-item full-width-item">
                <div class="info-label">Contact Info</div>
                <div class="info-value">${record.contact_info || "N/A"}</div>
            </div>
        </div>
        ${
          record.notes
            ? `
        <div class="notes-section">
            <div class="info-label">Notes</div>
            <div class="notes-content">${record.notes}</div>
        </div>
        `
            : ""
        }
        <div class="card-actions">
            <button class="btn btn-outline-primary" onclick="viewRecord(${
              record.id
            })" title="View Details">
                <i class="fas fa-eye me-1"></i>View
            </button>
            <button class="btn btn-outline-info" onclick="locateRecord(${
              record.id
            })" title="Locate on Map">
                <i class="fas fa-map-marker-alt me-1"></i>Locate
            </button>
        </div>
    `;
  return card;
}

// Add locate record function for mobile cards
function locateRecord(id) {
  const record = records.find((r) => String(r.id) === String(id));
  if (!record) {
    CustomToast && CustomToast.error("Error", "Record not found");
    return;
  }

  // Close any open modals first
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("viewModal")
  );
  if (modal) modal.hide();

  // Call the map location function directly with the record data
  locateRecordOnMap(record);
}

// Function to locate a record on the map (extracted from mapRecord logic)
function locateRecordOnMap(record) {
  // Extract coordinates from the record
  let lat = null,
    lng = null;

  if (record.location_coords) {
    // Parse WKT POINT format: "POINT(lng lat)"
    const match = record.location_coords.match(/POINT\(([^)]+)\)/);
    if (match) {
      const coords = match[1].trim().split(/\s+/);
      if (coords.length >= 2) {
        lng = parseFloat(coords[0]);
        lat = parseFloat(coords[1]);
      }
    }
  }

  // If no coordinates found, show error
  if (!lat || !lng) {
    CustomToast &&
      CustomToast.warning(
        "Warning",
        "Location coordinates not available for this grave"
      );
    return;
  }

  // Store grave plot data in sessionStorage
  const gravePlotData = {
    lat: lat,
    lng: lng,
    graveNumber: record.grave_number,
    deceasedName: record.deceased_name,
    boundary_coords: record.boundary_coords,
    record: record, // Store the full record for additional data
    timestamp: Date.now(), // Add timestamp for freshness
  };

  sessionStorage.setItem("gravePlotLocation", JSON.stringify(gravePlotData));

  // Redirect to map page
  window.location.href = "map.php";
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
  // HTML uses categoryPagination id; align with it
  const container = document.getElementById("categoryPagination");
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

function viewRecord(id) {
  const record = records.find((r) => String(r.id) === String(id));
  if (!record) {
    CustomToast && CustomToast.error("error", "Record not found");
    return;
  }

  // Cache the record for offline access
  if (window.offlineDataCache) {
    window.offlineDataCache.addToViewHistory(record);
    console.log(
      "Record cached for offline access:",
      record.grave_number || record.deceased_name
    );
  }

  // Store current record ID for map functionality
  window.currentRecordId = id;

  // Update desktop modal elements
  const desktopElements = {
    graveNumber: document.getElementById("viewGraveNumber"),
    deceasedName: document.getElementById("viewDeceasedName"),
    dateOfBirth: document.getElementById("viewDateOfBirth"),
    dateOfDeath: document.getElementById("viewDateOfDeath"),
    burialDate: document.getElementById("viewBurialDate"),
    nextOfKin: document.getElementById("viewNextOfKin"),
    contactInfo: document.getElementById("viewContactInfo"),
    notes: document.getElementById("viewNotes"),
  };

  // Update mobile modal elements
  const mobileElements = {
    graveNumber: document.getElementById("viewGraveNumberMobile"),
    deceasedName: document.getElementById("viewDeceasedNameMobile"),
    dateOfBirth: document.getElementById("viewDateOfBirthMobile"),
    dateOfDeath: document.getElementById("viewDateOfDeathMobile"),
    burialDate: document.getElementById("viewBurialDateMobile"),
    nextOfKin: document.getElementById("viewNextOfKinMobile"),
    contactInfo: document.getElementById("viewContactInfoMobile"),
    notes: document.getElementById("viewNotesMobile"),
  };

  // Helper function to safely update element
  const updateElement = (element, value) => {
    if (element) element.textContent = value || "";
  };

  // Update all elements (both desktop and mobile)
  const formattedBirth = window.Utils.formatDate(record.date_of_birth);
  const formattedDeath = window.Utils.formatDate(record.date_of_death);
  const formattedBurial = window.Utils.formatDate(record.burial_date);

  // Desktop elements
  updateElement(desktopElements.graveNumber, record.grave_number);
  updateElement(desktopElements.deceasedName, record.deceased_name);
  updateElement(desktopElements.dateOfBirth, formattedBirth);
  updateElement(desktopElements.dateOfDeath, formattedDeath);
  updateElement(desktopElements.burialDate, formattedBurial);
  updateElement(desktopElements.nextOfKin, record.next_of_kin);
  updateElement(desktopElements.contactInfo, record.contact_info);
  updateElement(desktopElements.notes, record.notes);

  // Mobile elements
  updateElement(mobileElements.graveNumber, record.grave_number);
  updateElement(mobileElements.deceasedName, record.deceased_name);
  updateElement(mobileElements.dateOfBirth, formattedBirth);
  updateElement(mobileElements.dateOfDeath, formattedDeath);
  updateElement(mobileElements.burialDate, formattedBurial);
  updateElement(mobileElements.nextOfKin, record.next_of_kin);
  updateElement(mobileElements.contactInfo, record.contact_info);
  updateElement(mobileElements.notes, record.notes);

  // Handle image gallery
  displayImageGallery(record);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("viewModal"));
  modal.show();
}

// Display image gallery for a record
function displayImageGallery(record) {
  // Build image gallery from image_path or grave_image (check both field names)
  const imagesCsv =
    record.image_path || record.grave_image
      ? String(record.image_path || record.grave_image)
      : "";
  const imageFiles = imagesCsv
    .split(",")
    .map((s) => (s || "").trim())
    .filter((s) => s.length > 0);

  const galleryHtml = imageFiles.length
    ? imageFiles
        .map(
          (fn) => `
            <div class="col-3 col-sm-2">
                <img src="${fn}" 
                    alt="${fn}" 
                    class="img-thumbnail" 
                    style="width: 100%; height: 70px; object-fit: cover; cursor: pointer;"
                    onclick="previewGraveImage('${fn}','Grave ${record.grave_number}')">
            </div>
        `
        )
        .join("")
    : "";

  // Update desktop gallery
  const desktopGallery = document.getElementById("viewImagesGallery");
  const desktopContainer = document.getElementById("viewImages");
  if (desktopGallery && desktopContainer) {
    if (imageFiles.length > 0) {
      desktopGallery.innerHTML = galleryHtml;
      desktopContainer.style.display = "block";
    } else {
      desktopContainer.style.display = "none";
    }
  }

  // Update mobile gallery
  const mobileGallery = document.getElementById("viewImagesGalleryMobile");
  const mobileContainer = document.getElementById("viewImagesMobile");
  if (mobileGallery && mobileContainer) {
    if (imageFiles.length > 0) {
      mobileGallery.innerHTML = galleryHtml;
      mobileContainer.style.display = "block";
    } else {
      mobileContainer.style.display = "none";
    }
  }
}

// Preview grave image in a modal
function previewGraveImage(imagePath, title) {
  // Create modal HTML
  const modalHtml = `
        <div class="modal fade" id="imagePreviewModal" tabindex="-1" aria-labelledby="imagePreviewModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imagePreviewModalLabel">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imagePath}" class="img-fluid" alt="${title}" style="max-height: 70vh; object-fit: contain;">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Remove existing modal if any
  const existingModal = document.getElementById("imagePreviewModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("imagePreviewModal")
  );
  modal.show();

  // Clean up modal when hidden
  document
    .getElementById("imagePreviewModal")
    .addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
}

function mapRecord() {
  // Get the current record from the view modal
  const graveNumber = document.getElementById("viewGraveNumber").textContent;
  const deceasedName = document.getElementById("viewDeceasedName").textContent;

  // Find the record in our cached records
  const record = records.find((r) => r.grave_number === graveNumber);
  if (!record) {
    showToast("error", "Record not found");
    return;
  }

  // Use the shared locateRecordOnMap function
  locateRecordOnMap(record);
}
