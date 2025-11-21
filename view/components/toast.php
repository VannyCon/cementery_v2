
<!-- Custom Toast Notification Styles -->
<style>
/* Toast Container */
.custom-toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    width: 100%;
}

/* Toast Base Styles */
.custom-toast {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid;
    background: white;
    position: relative;
    animation: slideInRight 0.3s ease-out;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.custom-toast:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
}

/* Toast Content */
.custom-toast-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: bold;
    font-size: 16px;
    color: white;
}

.custom-toast-content {
    flex: 1;
    min-width: 0;
}

.custom-toast-title {
    font-weight: 600;
    font-size: 16px;
    margin: 0 0 4px 0;
    line-height: 1.3;
}

.custom-toast-message {
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
    color: #666;
}

.custom-toast-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.custom-toast-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
    color: #666;
}

/* Success Toast */
.custom-toast.success {
    border-left-color: #10b981;
}

.custom-toast.success .custom-toast-icon {
    background-color: #10b981;
}

.custom-toast.success .custom-toast-title {
    color: #065f46;
}

/* Error Toast */
.custom-toast.error {
    border-left-color: #ef4444;
}

.custom-toast.error .custom-toast-icon {
    background-color: #ef4444;
}

.custom-toast.error .custom-toast-title {
    color: #991b1b;
}

/* Danger Toast (same as error) */
.custom-toast.danger {
    border-left-color: #ef4444;
}

.custom-toast.danger .custom-toast-icon {
    background-color: #ef4444;
}

.custom-toast.danger .custom-toast-title {
    color: #991b1b;
}

/* Warning Toast */
.custom-toast.warning {
    border-left-color: #f59e0b;
}

.custom-toast.warning .custom-toast-icon {
    background-color: #f59e0b;
}

.custom-toast.warning .custom-toast-title {
    color: #92400e;
}

/* Info Toast */
.custom-toast.info {
    border-left-color: #3b82f6;
}

.custom-toast.info .custom-toast-icon {
    background-color: #3b82f6;
}

.custom-toast.info .custom-toast-title {
    color: #1d4ed8;
}

/* Message Toast (neutral) */
.custom-toast.message {
    border-left-color: #6b7280;
}

.custom-toast.message .custom-toast-icon {
    background-color: #6b7280;
}

.custom-toast.message .custom-toast-title {
    color: #374151;
}

/* Animation */
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.custom-toast.removing {
    animation: slideOutRight 0.3s ease-out forwards;
}

/* Responsive */
@media (max-width: 480px) {
    .custom-toast-container {
        left: 20px;
        right: 20px;
        max-width: none;
    }
}
</style>
<script>
     // Custom Toast Notification System
     const CustomToast = {
      container: null,
      toastId: 0,

      init: function() {
        this.container = document.getElementById('customToastContainer');
        if (!this.container) {
          this.container = document.createElement('div');
          this.container.className = 'custom-toast-container';
          this.container.id = 'customToastContainer';
          document.body.appendChild(this.container);
        }
      },

      show: function(type, title, message, duration = 3000, reload = false) {
        this.init();
        
        const toastId = ++this.toastId;
        const toast = this.createElement(type, title, message, toastId);
        
        this.container.appendChild(toast);
        
        // Auto remove after duration only if duration is provided and greater than 0
        if (duration !== null && duration > 0) {
          setTimeout(() => {
            this.remove(toastId);
          }, duration);
        }
        
        return toastId;
      },

      // Convenience method for simple messages (message, type, duration)
      notify: function(message, type = 'info', duration = 3000) {
        const titles = {
          success: 'Success',
          error: 'Error',
          danger: 'Error',
          warning: 'Warning',
          info: 'Information',
          message: 'Message'
        };
        
        return this.show(type, titles[type] || 'Message', message, duration);
      },

      createElement: function(type, title, message, toastId) {
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.setAttribute('data-toast-id', toastId);
        
        const icons = {
          success: '✓',
          error: '✕',
          danger: '✕',
          warning: '!',
          info: 'ℹ',
          message: '💬'
        };
        
        toast.innerHTML = `
          <div class="custom-toast-icon">${icons[type] || icons.message}</div>
          <div class="custom-toast-content">
            <div class="custom-toast-title">${title}</div>
            ${message ? `<div class="custom-toast-message">${message}</div>` : ''}
          </div>
          <button class="custom-toast-close" onclick="CustomToast.removeAndReload(${toastId})">&times;</button>
        `;
        
        return toast;
      },

      remove: function(toastId) {
        const toast = this.container.querySelector(`[data-toast-id="${toastId}"]`);
        if (toast) {
          toast.classList.add('removing');

          setTimeout(() => {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          }, 300);
        }
      },

      removeAndReload: function(toastId) {
        const toast = this.container.querySelector(`[data-toast-id="${toastId}"]`);
        if (toast) {
          toast.classList.add('removing');

          setTimeout(() => {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
            // Reload the page after the toast is removed
            if (reload) {
              location.reload();
            }
          }, 300);
        }
      },

      removeAll: function() {
        if (this.container) {
          this.container.innerHTML = '';
        }
      },

      // Convenience methods
      success: function(title, message, duration = null) {
        return this.show('success', title, message, duration);
      },

      error: function(title, message, duration = null) {
        return this.show('error', title, message, duration);
      },

      warning: function(title, message, duration = null) {
        return this.show('warning', title, message, duration);
      },

      info: function(title, message, duration = null) {
        return this.show('info', title, message, duration);
      },

      message: function(title, message, duration = null) {
        return this.show('message', title, message, duration);
      }
    };
</script>