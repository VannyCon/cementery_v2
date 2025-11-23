<?php
/**
 * Role-based Sidebar Component
 * Displays different navigation items based on user role (admin/staff)
 */
?>

<nav class="sidebar admin-sidebar">
    <header>
        <div class="image-text">
            <span class="image">
                <img src="../../../../assets/images/logo.png" alt="Cake Store Logo">
            </span>
            <div class="text logo-text">
                <span class="name">Cemetery System</span>
                <span id="adminBadge" class="badge bg-warning text-dark ms-2" style="display:none;">Admin</span>
            </div>
        </div>
        <i class='bx bx-chevron-right toggle'></i>
    </header>

    <div class="menu-bar">
        <div class="menu">
            <!-- Search Box -->
            <!-- <li class="search-box">
                <i class='bx bx-search icon'></i>
                <input type="text" placeholder="Search...">
            </li> -->

            <!-- Admin Navigation Items -->
            <div id="adminNavigation" style="display: none;">
                <li class="nav-link">
                    <a href="../../admin/dashboard/">
                        <i class='bx bx-tachometer icon'></i>
                        <span class="text nav-text">Dashboard</span>
                    </a>
                </li>
                
                <!-- <li class="nav-link">
                    <a href="../../admin/cemetery/">
                        <i class='fas fa-map-marked-alt icon'></i>
                        <span class="text nav-text">Cemetery Map</span>
                    </a>
                </li> -->
                
                <li class="nav-link">
                    <a href="../../admin/burial/index.php">
                        <i class='fas fa-map-marked-alt icon'></i>
                        <span class="text nav-text">Cementery Map</span>
                    </a>
                </li>

                <li class="nav-link">
                    <a href="../../admin/records/">
                        <i class='fas fa-table icon'></i>
                        <span class="text nav-text">Burial Table</span>
                    </a>
                </li>
                
                <!-- <li class="nav-link">
                    <a href="../../admin/annotations/">
                        <i class='fas fa-map-marker-alt icon'></i>
                        <span class="text nav-text">Annotations</span>
                    </a>
                </li> -->
                
                <!-- <li class="nav-link">
                    <a href="../../admin/staff_management/">
                        <i class='fas fa-users icon'></i>
                        <span class="text nav-text">Staff Management</span>
                    </a>
                </li> -->

                <!-- <li class="nav-link">
                    <a href="../../admin/reports/">
                        <i class='fas fa-file-alt icon'></i>
                        <span class="text nav-text">Reports</span>
                    </a>
                </li> -->
                

            </div>

            <!-- Staff Navigation Items -->
            <div id="staffNavigation" style="display: none;">
                <li class="nav-link">
                    <a href="../../staff/dashboard/">
                        <i class='bx bx-home icon'></i>
                        <span class="text nav-text">Dashboard</span>
                    </a>
                </li>
                
                <li class="nav-link">
                    <a href="../../admin/records/">
                        <i class='fas fa-cross icon'></i>
                        <span class="text nav-text">Burial Records</span>
                    </a>
                </li>
                
                
                <!-- <li class="nav-link">
                    <a href="../../staff/profile/">
                        <i class='bx bx-user icon'></i>
                        <span class="text nav-text">Profile</span>
                    </a>
                </li> -->
            </div>

            <!-- Common Navigation Items -->
            <!-- <li class="nav-link">
                <a href="#">
                    <i class='bx bx-help-circle icon'></i>
                    <span class="text nav-text">Help & Support</span>
                </a>
            </li> -->
        </div>

        <div class="bottom-content">

            <!-- Logout Button -->
            <li class="nav-link">
                <button class="btn-logout" onclick="handleLogout()">
                    <i class='bx bx-log-out icon'></i>
                    <span class="text nav-text">Logout</span>
                </button>
            </li>

            <!-- Dark/Light Mode Toggle -->
            <li class="mode">
                <div class="sun-moon">
                    <i class='bx bx-moon icon sun'></i>
                    <i class='bx bx-sun icon moon'></i>
                </div>
                <span class="mode-text text">Dark mode</span>
                <div class="toggle-switch">
                    <span class="switch"></span>
                </div>
            </li>
        </div>
    </div>
</nav>

<script>
// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set initial theme attribute if not already set
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    document.body.setAttribute('data-bs-theme', savedTheme);
});

/**
 * Sidebar functionality with role-based navigation
 */
class SidebarManager {
    constructor() {
        console.log("SidebarManager constructor");
        this.authManager = window.authManager;
        this.init();
    }

    async init() {
        // Wait for authManager to be available if it's not ready yet
        if (!this.authManager && window.authManager) {
            this.authManager = window.authManager;
        }

        // Check if user is authenticated
        try {
            // Load user data and setup sidebar
            this.loadUserData();
            this.setupEventListeners();
            this.setActiveNavigation();
        } catch (error) {
            console.error('Error initializing sidebar:', error);
            // Fallback: try to load user data from localStorage
            this.loadUserDataFallback();
        }
    }

    loadUserData() {
        // Check if authManager is available
        if (!this.authManager) {
            console.warn('AuthManager not available, using fallback');
            this.loadUserDataFallback();
            return;
        }

        const user = this.authManager.getUser();
        
        if (user) {
            // Update user role display
            const userRoleElement = document.getElementById('userRole');
            if (userRoleElement) {
                userRoleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            }

            // Update username display
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = user.username;
            }
            console.log(user);
            // Show appropriate navigation based on role
            this.showRoleBasedNavigation(user.role);
        } else {
            // No user data from authManager, try fallback
            this.loadUserDataFallback();
        }
    }

    loadUserDataFallback() {
        try {
            // Try to get user data from localStorage directly
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                
                // Update user role display
                const userRoleElement = document.getElementById('userRole');
                if (userRoleElement) {
                    userRoleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                }

                // Update username display
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = user.username;
                }

                // Show appropriate navigation based on role
                this.showRoleBasedNavigation(user.role);
                this.setupEventListeners();
                this.setActiveNavigation();
            } else {
                // No user data found, redirect to login
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Error loading user data fallback:', error);
            this.redirectToLogin();
        }
    }

    showRoleBasedNavigation(role) {
        const adminNav = document.getElementById('adminNavigation');
        const staffNav = document.getElementById('staffNavigation');
        const sidebar = document.getElementById('sidebar');
        if (role === 'admin') {
            if (adminNav) adminNav.style.display = 'block';
            if (staffNav) staffNav.style.display = 'none';
        } else if (role === 'staff') {
            if (adminNav) adminNav.style.display = 'none';
            if (staffNav) staffNav.style.display = 'block';
            if (sidebar) sidebar.style.display = 'none';
        }
    }

    setActiveNavigation() {
        // Get current page URL
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.replace('../', ''))) {
                link.closest('.nav-link').classList.add('active');
            }
        });
    }

    setupEventListeners() {
        // Handle navigation clicks
        const navLinks = document.querySelectorAll('.nav-link a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => l.closest('.nav-link').classList.remove('active'));
                // Add active class to clicked link
                e.target.closest('.nav-link').classList.add('active');
            });
        });

        // Handle search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
    }

    handleSearch(query) {
        if (!query.trim()) return;

        // Implement search functionality based on user role
        let user = null;
        
        if (this.authManager) {
            user = this.authManager.getUser();
        } else {
            // Fallback: get user from localStorage
            const userData = localStorage.getItem('user_data');
            if (userData) {
                user = JSON.parse(userData);
            }
        }
        
        if (user) {
            if (user.role === 'admin') {
                // Admin search - search products, orders, staff
                console.log('Admin search:', query);
                // TODO: Implement admin search
            } else {
                // Staff search - search products
                console.log('Staff search:', query);
                // TODO: Implement staff search
            }
        }
    }

    redirectToLogin() {
        window.location.href = '../../auth/login.php';
    }
}

/**
 * Handle logout functionality with modern modal
 */
async function handleLogout() {
    // Wait a bit for modal to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use modern confirmation modal
    if (window.confirmActions && window.confirmActions.logout) {
        window.confirmActions.logout(async () => {
            await performLogout();
        });
    } else if (window.modernConfirm) {
        // Fallback to modern confirm if confirmActions not available
        window.modernConfirm({
            message: 'Are you sure you want to logout? You will need to sign in again.',
            title: 'Logout Confirmation',
            type: 'warning',
            confirmText: 'Logout',
            cancelText: 'Stay Logged In',
            onConfirm: async () => {
                await performLogout();
            }
        });
    } else {
        // Final fallback to basic confirm
        const confirmed = confirm('Are you sure you want to logout?');
        if (confirmed) {
            await performLogout();
        }
    }
}

/**
 * Perform the actual logout process
 */
async function performLogout() {
    try {
        // Show loading state
        CustomToast.show('Logging out...', 'info');

        // Try to use auth manager if available
        if (window.authManager) {
            await window.authManager.logout();
        } else {
            // Fallback: manually clear auth data and redirect
            clearAuthData();
            window.location.href = '../../auth/login.php';
        }
        
        // Success message
        CustomToast.show('Logged out successfully', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        CustomToast.show('Error during logout', 'error');
        
        // Force redirect even if API call fails
        clearAuthData();
        setTimeout(() => {
            window.location.href = '../../auth/login.php';
        }, 1000);
    }
}

/**
 * Clear authentication data manually
 */
function clearAuthData() {
    try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        sessionStorage.clear();
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new SidebarManager();
});
</script>
