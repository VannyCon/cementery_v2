<!-- Modern Confirmation Modal -->
<div class="modal fade" id="modernConfirmationModal" tabindex="-1" aria-labelledby="modernConfirmationLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0 text-white my-modal-header">
                <div class="d-flex align-items-center">
                    <!-- <div class="bg-white bg-opacity-25 rounded-3 p-2 me-3">
                        
                    </div> -->
                    <i class='bx bx-message-rounded-error' style="font-size: 2rem; margin-right: 4px;"></i>
                    <h6 class="modal-title fw-bold mb-0" id="modernConfirmationLabel"> Confirmation</h6>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <p class="text-center text-muted mb-0 fs-6" id="modalMessage">Are you sure you want to proceed?</p>
            </div>
            <div class="modal-footer border-0 p-4">
                <div class="d-flex gap-2 w-100 justify-content-end">
                    <button type="button" class="btn btn-outline-secondary d-flex align-items-center" id="MODERN_CONFIRM_NO" data-bs-dismiss="modal">
                        <i class='bx bx-x mt-1 me-1' style="vertical-align: middle; font-size: 1.2em;"></i>
                        <span>Cancel</span>
                    </button>
                    <button type="button" class="btn btn-danger d-flex align-items-center" id="MODERN_CONFIRM_YES">
                        <i class='bx bx-check mt-1 me-1' style="vertical-align: middle; font-size: 1.2em;"></i>
                        <span>Confirm</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
.my-modal-header {
    background: linear-gradient(135deg,rgb(255, 58, 107) 0%,rgb(253, 45, 45) 100%);
    color: white;
    padding: 2rem;
    text-align: center;
}

.btn-login {
    background: linear-gradient(135deg,rgb(255, 58, 107) 0%,rgb(253, 45, 45) 100%);
    border: none;
    border-radius: 10px;
    padding: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.btn-login:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg,rgb(255, 113, 149) 0%,rgb(248, 109, 109) 100%);
}

/* Default type */
.modal-icon-svg::before {
    content: '\ea5d';
} */

/* Loading state for buttons */
.btn.loading {
    pointer-events: none;
    opacity: 0.7;
    position: relative;
}

.btn.loading span {
    opacity: 0;
}

.btn.loading::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

@keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>

<script>
/**
 * Modern Confirmation Modal Manager
 * Provides a beautiful, reusable confirmation modal with different types and animations
 */
class ModernModalManager {
    constructor() {
        this.currentCallback = null;
        this.modal = document.getElementById('modernConfirmationModal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle confirm button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#MODERN_CONFIRM_YES')) {
                this.handleConfirm();
            }
        });

        // Handle cancel button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#MODERN_CONFIRM_NO') || e.target.closest('.btn-close')) {
                this.hideModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.hideModal();
            }
        });

        // Handle backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Add global event listener for modal hidden event to clean up backdrops
        document.addEventListener('hidden.bs.modal', (e) => {
            if (e.target === this.modal) {
                this.cleanupModalBackdrops();
            }
        });
    }

    /**
     * Show confirmation modal
     * @param {Object} options - Configuration options
     * @param {string} options.message - The message to display
     * @param {string} options.title - Modal title (default: "Confirmation")
     * @param {string} options.type - Modal type: 'default', 'warning', 'danger', 'success', 'info'
     * @param {string} options.confirmText - Confirm button text (default: "Confirm")
     * @param {string} options.cancelText - Cancel button text (default: "Cancel")
     * @param {Function} options.onConfirm - Callback function when confirmed
     * @param {Function} options.onCancel - Callback function when cancelled
     * @param {boolean} options.showCancel - Whether to show cancel button (default: true)
     */
    show(options = {}) {
        const {
            message = 'Are you sure you want to proceed?',
            title = 'Confirmation',
            type = 'default',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            onConfirm = null,
            onCancel = null,
            showCancel = true
        } = options;

        // Check if modal elements exist
        if (!this.modal) {
            console.error('Modern confirmation modal not found. Make sure modal.php is included.');
            // Fallback to browser confirm
            const confirmed = confirm(message);
            if (confirmed && onConfirm) {
                onConfirm();
            }
            return;
        }

        // Get modal elements with error checking
        const modalMessage = document.getElementById('modalMessage');
        const modalTitle = document.querySelector('.modal-title');
        const confirmBtn = document.querySelector('#MODERN_CONFIRM_YES span');
        const cancelBtn = document.querySelector('#MODERN_CONFIRM_NO span');
        const cancelButton = document.querySelector('#MODERN_CONFIRM_NO');

        // Set modal content with null checks
        if (modalMessage) modalMessage.textContent = message;
        if (modalTitle) modalTitle.textContent = title;
        if (confirmBtn) confirmBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;

        // Set modal type
        this.setModalType(type);

        // Show/hide cancel button
        if (cancelButton) {
            cancelButton.style.display = showCancel ? 'flex' : 'none';
        }

        // Store callbacks
        this.currentCallback = { onConfirm, onCancel };

        // Show modal using Bootstrap 5
        try {
            const modal = new bootstrap.Modal(this.modal);
            modal.show();
        } catch (error) {
            console.error('Error showing modal:', error);
            // Fallback to browser confirm
            const confirmed = confirm(message);
            if (confirmed && onConfirm) {
                onConfirm();
            }
        }
    }

    setModalType(type) {
        if (!this.modal) return;
        
        const modalContent = this.modal.querySelector('.modal-content');
        if (!modalContent) return;

        // Remove existing type classes
        modalContent.className = modalContent.className.replace(/modal-type-\w+/g, '');

        // Add new type class
        if (type !== 'default') {
            modalContent.classList.add(`modal-type-${type}`);
        }
    }

    handleConfirm() {
        const confirmBtn = document.querySelector('#MODERN_CONFIRM_YES');
        
        // Add loading state
        confirmBtn.classList.add('loading');
        
        // Execute callback
        if (this.currentCallback && this.currentCallback.onConfirm) {
            try {
                const result = this.currentCallback.onConfirm();
                
                // Handle async callbacks
                if (result instanceof Promise) {
                    result.finally(() => {
                        confirmBtn.classList.remove('loading');
                        this.hideModal();
                    });
                } else {
                    confirmBtn.classList.remove('loading');
                    this.hideModal();
                }
            } catch (error) {
                console.error('Error in confirmation callback:', error);
                confirmBtn.classList.remove('loading');
                this.hideModal();
            }
        } else {
            confirmBtn.classList.remove('loading');
            this.hideModal();
        }
    }

    hideModal() {
        if (this.currentCallback && this.currentCallback.onCancel) {
            this.currentCallback.onCancel();
        }
        
        // Hide modal using Bootstrap 5
        const modal = bootstrap.Modal.getInstance(this.modal);
        if (modal) {
            modal.hide();
        }
        
        // Clean up any lingering modal backdrops
        this.cleanupModalBackdrops();
        this.currentCallback = null;
    }

    /**
     * Clean up modal backdrops that might be left behind
     */
    cleanupModalBackdrops() {
        // Small delay to allow Bootstrap to finish its cleanup
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                backdrop.remove();
            });
            
            // Clean up body classes and styles
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Remove any remaining show classes
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }, 100);
    }
}

// Initialize modal manager
const modernModal = new ModernModalManager();

/**
 * Modern confirmation function - replaces the old confirmAction
 * @param {Object|string} options - Configuration object or simple message string
 * @param {Function} onConfirm - Callback function (for backward compatibility)
 */
function modernConfirm(options, onConfirm = null) {
    // Handle backward compatibility with string message
    if (typeof options === 'string') {
        options = {
            message: options,
            onConfirm: onConfirm
        };
    }

    modernModal.show(options);
}

/**
 * Quick confirmation functions for common use cases
 */
const confirmActions = {
    // Logout confirmation
    logout: (onConfirm) => {
        modernConfirm({
            message: 'Are you sure you want to logout? You will need to sign in again.',
            title: 'Logout Confirmation',
            type: 'warning',
            confirmText: 'Logout',
            cancelText: 'Stay Logged In',
            onConfirm: onConfirm
        });
    },

    // Delete confirmation
    delete: (itemName = 'item', onConfirm) => {
        modernConfirm({
            message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
            title: 'Delete Confirmation',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: onConfirm
        });
    },

    // Save confirmation
    save: (onConfirm) => {
        modernConfirm({
            message: 'Do you want to save your changes?',
            title: 'Save Changes',
            type: 'info',
            confirmText: 'Save',
            cancelText: 'Discard',
            onConfirm: onConfirm
        });
    },

    // Success confirmation
    success: (message, onConfirm) => {
        modernConfirm({
            message: message,
            title: 'Success',
            type: 'success',
            confirmText: 'Continue',
            showCancel: false,
            onConfirm: onConfirm
        });
    }
};

// Legacy function for backward compatibility
function confirmAction(message, onYesCallback) {
    modernConfirm({
        message: message,
        onConfirm: onYesCallback
    });
}

// Make functions globally available
window.modernConfirm = modernConfirm;
window.confirmActions = confirmActions;
window.confirmAction = confirmAction; // Keep for backward compatibility

// Global modal cleanup function
window.cleanupAllModalBackdrops = function() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        backdrop.remove();
    });
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Remove any remaining show classes from modals
    document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
};

// Add global event listener for any modal hidden event
document.addEventListener('hidden.bs.modal', function(e) {
    // Clean up any lingering backdrops after a short delay
    setTimeout(() => {
        window.cleanupAllModalBackdrops();
    }, 100);
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    window.cleanupAllModalBackdrops();
});
</script>