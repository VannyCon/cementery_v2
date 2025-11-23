// Record Modal Management for Burial Page
// This file contains functions to handle the record modal when clicking on grave plots

let deceasedRecordCount = 1;

// Function to open record modal when a grave plot is clicked
function openRecordModalFromGravePlot(gravePlotData, location) {
  // Set modal title
  document.getElementById("recordModalLabel").textContent = "Add Record";
  document.getElementById("recordForm").reset();
  document.getElementById("recordId").value = "";
  document.getElementById("graveId").value = "";

  // Set the selected location
  if (location) {
    document.getElementById("selectedLocation").value = location;
  }

  // Reset to single deceased record
  deceasedRecordCount = 1;
  resetDeceasedRecords();

  // Set submit button
  const submitBtn = document.getElementById("recordSubmitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Save Records";
    submitBtn.type = "submit";
    submitBtn.onclick = null;
  }

  // Show modal - create a fresh instance to avoid conflicts
  const recordModalEl = document.getElementById("recordModal");
  if (!recordModalEl) {
    console.error("Record modal element not found");
    return;
  }

  // Dispose of any existing modal instance first
  const existingModal = bootstrap.Modal.getInstance(recordModalEl);
  if (existingModal) {
    existingModal.dispose();
  }

  // Create a new modal instance and show it
  const modal = new bootstrap.Modal(recordModalEl, {
    backdrop: true,
    keyboard: true,
    focus: true,
  });

  // Small delay to ensure any previous modal is fully closed
  setTimeout(() => {
    modal.show();
  }, 50);
}

// Functions for managing deceased records (copied from records/main.js)
function resetDeceasedRecords() {
  const container = document.getElementById("deceasedRecordsContainer");
  if (!container) return;

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
  if (!container) return;

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
                <label class="form-label">Burial Date</label>
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
  if (recordElement) {
    recordElement.remove();
    updateRemoveButtons();
    updateRecordNumbers();
  }
}

function updateRemoveButtons() {
  const records = document.querySelectorAll(".deceased-record");
  records.forEach((record, index) => {
    const removeBtn = record.querySelector(".remove-deceased");
    if (removeBtn) {
      if (records.length > 1) {
        removeBtn.style.display = "block";
      } else {
        removeBtn.style.display = "none";
      }
    }
  });
}

function updateRecordNumbers() {
  const records = document.querySelectorAll(".deceased-record");
  records.forEach((record, index) => {
    const title = record.querySelector("h6");
    if (title) {
      title.textContent = `Deceased Person #${index + 1}`;
    }
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
      deceased_name: element.querySelector(".deceased-name")?.value || "",
      date_of_birth: element.querySelector(".date-of-birth")?.value || "",
      date_of_death: element.querySelector(".date-of-death")?.value || "",
      burial_date: element.querySelector(".burial-date")?.value || "",
      grave_layer_number:
        element.querySelector(".grave-layer-number")?.value || "1",
      next_of_kin: element.querySelector(".next-of-kin")?.value || "",
      contact_info: element.querySelector(".contact-info")?.value || "",
      notes: element.querySelector(".notes")?.value || "",
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

  // Handle form submission
  const recordForm = document.getElementById("recordForm");
  if (recordForm) {
    recordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Disable submit button to prevent double submission
      const submitBtn = document.getElementById("recordSubmitBtn");
      const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
      }

      try {
        // Create a fresh FormData object instead of using the form
        // This prevents duplicate data from form inputs
        const formData = new FormData();

        const selectedLocation =
          document.getElementById("selectedLocation")?.value || "";
        const graveId = document.getElementById("graveId")?.value || "";

        // Get grave number from marker if we have graveId
        let graveNumber = null;
        if (
          graveId &&
          window.cemeteryManager &&
          window.cemeteryManager.gravePlotMarkers
        ) {
          const matchingMarker = window.cemeteryManager.gravePlotMarkers.find(
            (marker) => {
              if (marker.plotData && marker.plotData.id == graveId) {
                return true;
              }
              return false;
            }
          );

          if (matchingMarker && matchingMarker.plotData) {
            graveNumber = matchingMarker.plotData.grave_number || null;
          }
        }

        // Check if we have either location (for new grave) or graveId (for existing grave)
        if (!selectedLocation && !graveId) {
          // Re-enable submit button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }

          CustomToast &&
            CustomToast.error(
              "Error",
              "No location or grave selected. Please select a grave plot on the map or use an existing grave."
            );
          return;
        }

        // Get deceased records data
        const deceasedRecords = getDeceasedRecordsData();
        if (deceasedRecords.length === 0) {
          // Re-enable submit button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }

          CustomToast &&
            CustomToast.error(
              "Error",
              "Please add at least one deceased record."
            );
          return;
        }

        // Add deceased records to form data (only once, from our function)
        deceasedRecords.forEach((record, index) => {
          formData.append(
            `deceased_records[${index}][deceased_name]`,
            record.deceased_name
          );
          formData.append(
            `deceased_records[${index}][date_of_birth]`,
            record.date_of_birth || ""
          );
          formData.append(
            `deceased_records[${index}][date_of_death]`,
            record.date_of_death
          );
          formData.append(
            `deceased_records[${index}][burial_date]`,
            record.burial_date || ""
          );
          formData.append(
            `deceased_records[${index}][grave_layer_number]`,
            record.grave_layer_number || "1"
          );
          formData.append(
            `deceased_records[${index}][next_of_kin]`,
            record.next_of_kin || ""
          );
          formData.append(
            `deceased_records[${index}][contact_info]`,
            record.contact_info || ""
          );
          formData.append(
            `deceased_records[${index}][notes]`,
            record.notes || ""
          );

          // Add grave photos (only the files, no duplicates)
          if (record.grave_photo && record.grave_photo.length > 0) {
            record.grave_photo.forEach((file) => {
              formData.append(
                `deceased_records[${index}][grave_photo][]`,
                file
              );
            });
          }
        });

        // Set action - createGravePlotWithImages now handles both new graves (with location)
        // and existing graves (with grave_id_fk)
        formData.append("action", "createGravePlotWithImages");

        // Add location if provided (for new grave plots)
        if (selectedLocation) {
          formData.append("location", selectedLocation);
        }

        // Add grave_id_fk if provided (for existing graves)
        if (graveId) {
          formData.append("grave_id_fk", graveId);
        }

        // Add grave_number if available (for existing graves, helps backend use correct number)
        if (graveNumber) {
          formData.append("grave_number", graveNumber);
        }

        // Get API endpoint
        const authManager = new AuthManager();
        const recordsAPI = authManager.API_CONFIG.baseURL + "records.php";

        // Calculate total file size for progress tracking
        let totalFileSize = 0;
        let fileCount = 0;
        deceasedRecords.forEach((record) => {
          if (record.grave_photo && record.grave_photo.length > 0) {
            record.grave_photo.forEach((file) => {
              totalFileSize += file.size;
              fileCount++;
            });
          }
        });

        // Show progress modal
        showUploadProgress(fileCount, totalFileSize);

        // Track upload start time for speed calculation
        const uploadStartTime = Date.now();
        let uploadedBytes = 0;

        // Make API call with progress tracking
        const response = await axios.post(recordsAPI, formData, {
          headers: authManager.API_CONFIG.getFormHeaders(),
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
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

        // Show processing phase (last 10%)
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

        const result = response.data;
        if (result && result.success) {
          // Re-enable submit button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }

          CustomToast &&
            CustomToast.success(
              "Success",
              result.message || "Record saved successfully"
            );
          bootstrap.Modal.getInstance(
            document.getElementById("recordModal")
          ).hide();

          // Reload data if cemeteryManager exists
          if (
            window.cemeteryManager &&
            typeof window.cemeteryManager.loadData === "function"
          ) {
            await window.cemeteryManager.loadData();
          }
        } else {
          // Re-enable submit button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }

          CustomToast &&
            CustomToast.error(
              "Error",
              (result && result.message) || "Save failed"
            );
        }
      } catch (err) {
        // Hide progress modal on error
        hideUploadProgress();

        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }

        CustomToast && CustomToast.error("Error", "Save failed");
        console.error(err);
      } finally {
        // Ensure submit button is re-enabled even if something goes wrong
        setTimeout(() => {
          if (submitBtn && submitBtn.disabled) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        }, 1000);
      }
    });
  }

  // Initialize photo handlers for existing records on page load
  setTimeout(() => {
    initializeGravePhotoHandlers(0);
  }, 100);
});

// Grave Photo Upload and Camera Functionality (copied from records/main.js)
let currentRecordIndexForCamera = null;
let cameraStream = null;
let capturedBlob = null;

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

  if (!photoInput || !previewContainer || !captureBtn) return;

  // Handle file selection
  photoInput.addEventListener("change", function (e) {
    const maxFiles = parseInt(this.getAttribute("data-max-files") || "3", 10);
    const files = Array.from(this.files);

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

// Camera modal functions (full implementation from records/main.js)
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

// Export function for use in main.js
if (typeof window !== "undefined") {
  window.openRecordModalFromGravePlot = openRecordModalFromGravePlot;
}
