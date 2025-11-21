<?php 
// Start output buffering to capture the page content
ob_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cemetery Locator & Management System</title>
    <link rel="stylesheet" href="../../../css/bootstrap.min.css">
    <link rel="stylesheet" href="../../../css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Axios for HTTP requests -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <link  href="../../../css/boxicons.css" rel="stylesheet">
    <link rel="stylesheet" href="../../../css/fontawesome/css/all.min.css">
    <link rel="icon" href="../../../../assets/images/logo.png" type="image/x-icon" />


    <?php if(isset($page) && $page == 'map'): ?>
        <script type="module">
            import * as turf from 'https://esm.sh/@turf/turf@7.1.0';
            window.turf = turf;
        </script>
        <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.css' />
        <script src='https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.js'></script>
        <script src="https://www.unpkg.com/@mapbox/mapbox-gl-draw@1.5.0/dist/mapbox-gl-draw.js"></script>
        <link rel="stylesheet" href="https://www.unpkg.com/@mapbox/mapbox-gl-draw@1.5.0/dist/mapbox-gl-draw.css" />
    <?php endif; ?>
    <!-- Turf.js for area calculations -->

    <style>
        .leaflet-draw-toolbar {
            display: none !important;
        }
        .custom-div-icon {
            background: transparent;
            border: none;
        }
        .leaflet-popup-content {
            margin: 8px 12px;
            line-height: 1.4;
        }
        .leaflet-popup-content .btn {
            margin: 2px;
        }
    </style>
</head>
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-family: 'Poppins', sans-serif;
}

.navbar-brand {
    font-weight: bold;
}

.dashboard-card {
    background-color: white;
    border-radius: 5px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.stat-number a {
    text-decoration: none;
    color: inherit;
}

.stat-number {
    font-size: 3rem;
    font-weight: bold;
    color: #8B4513;
}

.stat-label {
    color: #6c757d;
}

.action-button {
    background-color: #8B4513;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 5px;
    width: 100%;
    margin-top: 10px;
}

.recent-activities {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
}

.stats-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.stats-row {
    display: flex;
    flex: 1;
}


.stats-col {
    flex: 1 1 calc(25% - 15px); /* Adjust card size for responsiveness */
    max-width: calc(25% - 15px);
}

@media (max-width: 768px) {
    .stats-col {
        flex: 1 1 calc(50% - 15px); /* Adjust card size for smaller screens */
        max-width: calc(50% - 15px);
    }
}

@media (max-width: 576px) {
    .stats-col {
        flex: 1 1 100%; /* Full width for very small screens */
        max-width: 100%;
    }
}

.stats-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.modal.fade .modal-dialog.modal-dialog-slideright {
    transform: translate(100%, 0);
    transition: transform 0.3s ease-out;
}

.modal.show .modal-dialog.modal-dialog-slideright {
    transform: translate(0, 0);
}

.confirmation-details {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.detail-item {
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-item:last-child {
    border-bottom: none;
}

.detail-label {
    font-weight: 600;
    color: #495057;
}

.detail-value {
    color: #212529;
}

.table-responsive {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
       
.floating-shapes {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: -1;
        }
        
        .shape {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
        }
        
        .shape:nth-child(1) {
            width: 80px;
            height: 80px;
            top: 20%;
            left: 10%;
            animation-delay: 0s;
        }
        
        .shape:nth-child(2) {
            width: 120px;
            height: 120px;
            top: 60%;
            right: 10%;
            animation-delay: 2s;
        }
        
        .shape:nth-child(3) {
            width: 60px;
            height: 60px;
            bottom: 20%;
            left: 20%;
            animation-delay: 4s;
        }
        
@keyframes float {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
            }
            50% {
                transform: translateY(-20px) rotate(180deg);
            }
        }

</style>
<body>
<div class="floating-shapes">
    <div class="shape"></div>
    <div class="shape"></div>
    <div class="shape"></div>
</div>
<script>
        window.Utils = {
            // Format currency
            formatCurrency: function(amount) {
                return new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                }).format(amount);
            },
            
            // Format date
            formatDate: function(date, options = {}) {
                const defaultOptions = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                };
                return new Date(date).toLocaleDateString('en-US', {...defaultOptions, ...options});
            },
            
            // Format date and time
            formatDateTime: function(date) {
                return new Date(date).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            },
        }
</script>
    <!-- Main Content -->
    <main class="home" style="padding-top: 5px; padding-left: 5px; padding-right: 5px; padding-bottom: 5px;">
        <?php 
        // Include the page content
        if (isset($page_content)) {
            include $page_content;
        } else {
            echo $content ?? '';
        }
        ?>
    </main>
    
    <!-- Footer -->
    <?php include 'footer.php'; ?>
    
    <!-- Modals -->
    <?php include 'modal.php'; ?>
    
    <!-- Toast Container -->
    <?php include 'toast.php'; ?>
    
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
    </div>
    <!-- Page-specific JS -->
    
    <!-- Page-specific JS -->
    <?php if (isset($page_js)): ?>
        <?php if (is_array($page_js)): ?>
            <?php foreach ($page_js as $js_file): ?>
                <script src="<?php echo $js_file; ?>"></script>
            <?php endforeach; ?>
        <?php else: ?>
            <script src="<?php echo $page_js; ?>"></script>
        <?php endif; ?>
    <?php endif; ?>
    
    
    <script>
        // Global utility functions
        window.Utils = {
            // Format currency
            formatCurrency: function(amount) {
                return new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                }).format(amount);
            },
            
            // Format date
            formatDate: function(date, options = {}) {
                const defaultOptions = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                };
                return new Date(date).toLocaleDateString('en-US', {...defaultOptions, ...options});
            },
            
            // Format date and time
            formatDateTime: function(date) {
                return new Date(date).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            },
            
            // Debounce function
            debounce: function(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            },
            
            // Validate email
            isValidEmail: function(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            },
            
            // Copy to clipboard
            copyToClipboard: function(text) {
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Copied to clipboard!', 'success');
                }).catch(() => {
                    showToast('Failed to copy to clipboard', 'error');
                });
            },
            
            // Truncate text
            truncate: function(str, length = 100) {
                return str.length > length ? str.substring(0, length) + '...' : str;
            },
            
            // Generate random string
            randomString: function(length = 8) {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let result = '';
                for (let i = 0; i < length; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return result;
            },
            
            // Local storage helpers
            storage: {
                set: function(key, value) {
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                    } catch (e) {
                        console.error('Failed to save to localStorage:', e);
                    }
                },
                get: function(key) {
                    try {
                        const item = localStorage.getItem(key);
                        return item ? JSON.parse(item) : null;
                    } catch (e) {
                        console.error('Failed to read from localStorage:', e);
                        return null;
                    }
                },
                remove: function(key) {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        console.error('Failed to remove from localStorage:', e);
                    }
                }
            }
        };
        
        // Mobile layout adjustments
        window.MobileLayoutManager = {
            init: function() {
                this.adjustForMobile();
                this.handleOrientationChange();
                this.setupViewportMeta();
            },
            
            adjustForMobile: function() {
                if (window.innerWidth < 768) {
                    // Adjust main content padding for mobile
                    const mainContent = document.querySelector('main.home');
                    if (mainContent) {
                        mainContent.style.paddingTop = '5px'; // Account for fixed mobile navbar
                        mainContent.style.paddingBottom = '5px'; // Account for bottom nav
                        mainContent.style.paddingLeft = '5px';
                        mainContent.style.paddingRight = '5px';
                    }
                    
                    // Hide desktop sidebar on mobile
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) {
                        sidebar.style.display = 'none';
                    }
                }
            },
            
            handleOrientationChange: function() {
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => {
                        this.adjustForMobile();
                        // Trigger map resize if exists
                        if (window.map && window.map.invalidateSize) {
                            window.map.invalidateSize();
                        }
                    }, 100);
                });
            },
            
            setupViewportMeta: function() {
                // Ensure proper viewport meta tag
                let viewport = document.querySelector('meta[name="viewport"]');
                if (!viewport) {
                    viewport = document.createElement('meta');
                    viewport.name = 'viewport';
                    document.head.appendChild(viewport);
                }
                viewport.content = 'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=yes, maximum-scale=5';
            }
        };
        
        // Font Awesome icon checker and fixer
        function checkAndFixFontAwesome() {
            // Test if Font Awesome is loaded
            const testIcon = document.createElement('i');
            testIcon.className = 'fas fa-home';
            testIcon.style.visibility = 'hidden';
            testIcon.style.position = 'absolute';
            document.body.appendChild(testIcon);
            
            const computedStyle = window.getComputedStyle(testIcon, '::before');
            const content = computedStyle.getPropertyValue('content');
            
            document.body.removeChild(testIcon);
            
            // If Font Awesome is not loaded properly, add fallback
            if (!content || content === 'none' || content === '""') {
                console.warn('Font Awesome not loaded properly, adding fallback...');
                
                // Add fallback CSS for common icons
                const fallbackCSS = `
                    <style id="fa-fallback">
                        .fas.fa-home::before, .fa.fa-home::before { content: "🏠"; }
                        .fas.fa-user::before, .fa.fa-user::before { content: "👤"; }
                        .fas.fa-shopping-cart::before, .fa.fa-shopping-cart::before { content: "🛒"; }
                        .fas.fa-shopping-bag::before, .fa.fa-shopping-bag::before { content: "🛍️"; }
                        .fas.fa-search::before, .fa.fa-search::before { content: "🔍"; }
                        .fas.fa-heart::before, .fa.fa-heart::before { content: "❤️"; }
                        .fas.fa-star::before, .fa.fa-star::before { content: "⭐"; }
                        .far.fa-star::before { content: "☆"; }
                        .fas.fa-plus::before, .fa.fa-plus::before { content: "+"; }
                        .fas.fa-minus::before, .fa.fa-minus::before { content: "-"; }
                        .fas.fa-edit::before, .fa.fa-edit::before { content: "✏️"; }
                        .fas.fa-trash::before, .fa.fa-trash::before { content: "🗑️"; }
                        .fas.fa-check::before, .fa.fa-check::before { content: "✓"; }
                        .fas.fa-times::before, .fa.fa-times::before { content: "✕"; }
                        .fas.fa-arrow-left::before, .fa.fa-arrow-left::before { content: "←"; }
                        .fas.fa-arrow-right::before, .fa.fa-arrow-right::before { content: "→"; }
                        .fas.fa-chevron-left::before, .fa.fa-chevron-left::before { content: "‹"; }
                        .fas.fa-chevron-right::before, .fa.fa-chevron-right::before { content: "›"; }
                        .fas.fa-chevron-up::before, .fa.fa-chevron-up::before { content: "^"; }
                        .fas.fa-chevron-down::before, .fa.fa-chevron-down::before { content: "v"; }
                        .fas.fa-envelope::before, .fa.fa-envelope::before { content: "✉️"; }
                        .fas.fa-phone::before, .fa.fa-phone::before { content: "📞"; }
                        .fas.fa-calendar::before, .fa.fa-calendar::before { content: "📅"; }
                        .fas.fa-calendar-check::before, .fa.fa-calendar-check::before { content: "📅"; }
                        .fas.fa-clock::before, .fa.fa-clock::before { content: "🕐"; }
                        .fas.fa-tools::before, .fa.fa-tools::before { content: "🔧"; }
                        .fas.fa-cog::before, .fa.fa-cog::before { content: "⚙️"; }
                        .fas.fa-info-circle::before, .fa.fa-info-circle::before { content: "ℹ️"; }
                        .fas.fa-exclamation-triangle::before, .fa.fa-exclamation-triangle::before { content: "⚠️"; }
                        .fas.fa-check-circle::before, .fa.fa-check-circle::before { content: "✅"; }
                        .fas.fa-times-circle::before, .fa.fa-times-circle::before { content: "❌"; }
                        .fas.fa-eye::before, .fa.fa-eye::before { content: "👁️"; }
                        .fas.fa-download::before, .fa.fa-download::before { content: "⬇️"; }
                        .fas.fa-upload::before, .fa.fa-upload::before { content: "⬆️"; }
                        .fas.fa-truck::before, .fa.fa-truck::before { content: "🚚"; }
                        .fas.fa-box::before, .fa.fa-box::before { content: "📦"; }
                        .fas.fa-credit-card::before, .fa.fa-credit-card::before { content: "💳"; }
                        .fas.fa-money-bill-wave::before, .fa.fa-money-bill-wave::before { content: "💵"; }
                        .fas.fa-ticket-alt::before, .fa.fa-ticket-alt::before { content: "🎫"; }
                        .fas.fa-tags::before, .fa.fa-tags::before { content: "🏷️"; }
                        .fas.fa-users::before, .fa.fa-users::before { content: "👥"; }
                        .fas.fa-user-circle::before, .fa.fa-user-circle::before { content: "👤"; }
                        .fas.fa-user-plus::before, .fa.fa-user-plus::before { content: "👤+"; }
                        .fas.fa-lock::before, .fa.fa-lock::before { content: "🔒"; }
                        .fas.fa-unlock::before, .fa.fa-unlock::before { content: "🔓"; }
                        .fas.fa-camera::before, .fa.fa-camera::before { content: "📷"; }
                        .fas.fa-image::before, .fa.fa-image::before { content: "🖼️"; }
                        .fas.fa-file::before, .fa.fa-file::before { content: "📄"; }
                        .fas.fa-folder::before, .fa.fa-folder::before { content: "📁"; }
                        .fas.fa-list::before, .fa.fa-list::before { content: "📋"; }
                        .fas.fa-chart-bar::before, .fa.fa-chart-bar::before { content: "📊"; }
                        .fas.fa-tachometer-alt::before, .fa.fa-tachometer-alt::before { content: "📈"; }
                        .fas.fa-refresh::before, .fa.fa-refresh::before { content: "🔄"; }
                        .fas.fa-redo::before, .fa.fa-redo::before { content: "↻"; }
                        .fas.fa-mobile-alt::before, .fa.fa-mobile-alt::before { content: "📱"; }
                        .fab.fa-paypal::before { content: "💰"; }
                        .fas.fa-ellipsis-h::before, .fa.fa-ellipsis-h::before { content: "⋯"; }
                        .fas.fa-bars::before, .fa.fa-bars::before { content: "☰"; }
                        .fas.fa-receipt::before, .fa.fa-receipt::before { content: "🧾"; }
                        .fas.fa-spinner::before, .fa.fa-spinner::before { content: "⟳"; }
                        .fas.fa-circle-notch::before, .fa.fa-circle-notch::before { content: "◐"; }
                        .fas.fa-shield-alt::before, .fa.fa-shield-alt::before { content: "🛡️"; }
                        .fas.fa-file-contract::before, .fa.fa-file-contract::before { content: "📋"; }
                        .fas.fa-question-circle::before, .fa.fa-question-circle::before { content: "❓"; }
                        .fas.fa-dollar-sign::before, .fa.fa-dollar-sign::before { content: "$"; }
                        .fas.fa-home::before, .fa.fa-home::before { content: "🏠"; }
                        .fas.fa-cart-plus::before, .fa.fa-cart-plus::before { content: "🛒+"; }
                        .fas.fa-warning::before, .fa.fa-warning::before { content: "⚠️"; }
                        
                        /* Generic fallback */
                        .fas::before, .far::before, .fab::before, .fa::before {
                            font-family: inherit;
                            font-weight: normal;
                        }
                    </style>
                `;
                
                document.head.insertAdjacentHTML('beforeend', fallbackCSS);
                console.log('Font Awesome fallback CSS applied');
            } else {
                console.log('Font Awesome loaded successfully');
            }
        }
        
        // Initialize tooltips and other components
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize mobile layout manager
            if (window.MobileLayoutManager) {
                window.MobileLayoutManager.init();
            }
            
            // Check and fix Font Awesome
            setTimeout(checkAndFixFontAwesome, 100);
            
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function(tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
            // Initialize popovers
            const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            popoverTriggerList.map(function(popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl);
            });
        });
    </script>
</body>
</html>
