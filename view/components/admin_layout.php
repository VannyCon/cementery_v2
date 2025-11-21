<?php 
// Start output buffering to capture the page content
ob_start();
?>

<?php include 'header.php'; ?>
<body>
    <!-- Mobile Navigation Bar -->
    <?php include 'mobile_navbar.php'; ?>
    
    <!-- Mobile Bottom Navigation -->
    <?php include 'mobile_bottom_nav.php'; ?>

    <!-- Sidebar -->
    <?php include 'admin_sidebar.php'; ?>

    <!-- Main Content -->
    <main class="home my-lg-3 my-md-0" >
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
    
    <!-- Auth JS -->
    <script src="../../../js/auth.js"></script>
    
    <!-- Sidebar JS -->
    <script src="../../../js/sidebar.js"></script>
    
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
                        mainContent.style.paddingTop = '70px'; // Account for fixed mobile navbar
                        mainContent.style.paddingBottom = '50px'; // Account for bottom nav
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
