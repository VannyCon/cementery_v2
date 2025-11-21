<?php
/**
 * Mobile Navigation Bar Component
 * Shows on mobile devices when sidebar is hidden
 */
?>

<nav class="navbar navbar-expand-lg mobile-nav-bg fixed-top d-md-none">
    <div class="container-fluid">
        <!-- Logo/Brand -->
        <a class="navbar-brand" href="../../index.php">
            <i class="fas fa-map-marked-alt" style="font-size: 24px; color: #0d6efd;"></i>
            <span class="ms-2">Cemetery System</span>
        </a>

        <!-- Mobile menu toggle -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mobileNavbar">
            <i class="fas fa-bars"></i>
        </button>

        <!-- Mobile navigation menu -->
        <div class="collapse navbar-collapse" id="mobileNavbar">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                
                <!-- Admin mobile navigation -->
                <div id="mobileAdminNav" style="display: none;">
                    <li class="nav-item">
                        <a class="nav-link" href="../../admin/dashboard/">
                            <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="../../admin/cemetery/">
                            <i class="fas fa-map-marked-alt me-1"></i> Cemetery Map
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="../../admin/burials/">
                            <i class="fas fa-cross me-1"></i> Burial Records
                        </a>
                    </li>
                    <!-- <li class="nav-item">
                        <a class="nav-link" href="../../admin/staff_management/">
                            <i class="fas fa-users me-1 mr-1"></i> Staff Management
                        </a>
                    </li> -->
                    <li class="nav-item">
                        <a class="btn btn-danger" href="#" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt me-2"></i> Logout
                        </a>
                    </li>
                </div>

                <!-- Staff mobile navigation -->
                <div id="mobileStaffNav" style="display: none;">
                    <li class="nav-item">
                        <a class="nav-link" href="../../staff/dashboard/">
                            <i class="fas fa-home me-1"></i> Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="../../staff/cemetery/">
                            <i class="fas fa-map-marked-alt me-1"></i> Cemetery Map
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="../../staff/burials/">
                            <i class="fas fa-search me-1"></i> Search Records
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="../../staff/profile/">
                            <i class="fas fa-user me-1"></i> Profile
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="btn btn-danger" href="#" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                        </a>
                    </li>
                </div>
            </ul>

            <!-- User info and logout -->
    
        </div>
    </div>
</nav>

<script>
/**
 * Mobile Navigation Manager
 * Handles mobile navigation functionality
 */
class MobileNavManager {
    constructor() {
        this.authManager = window.authManager;
        this.init();
    }

    async init() {
        // Wait for auth manager to be ready
        if (!this.authManager) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Check if user is authenticated
        if (!this.authManager.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }

        // Load user data and setup mobile navigation
        this.loadUserData();
        this.setupEventListeners();
    }

    loadUserData() {
        try {
            const user = this.authManager.getUser();
            
            if (user) {
                this.updateMobileUserInfo(user);
            } else {
                // Fallback: try to load from localStorage
                this.loadUserDataFallback();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.loadUserDataFallback();
        }
    }

    loadUserDataFallback() {
        try {
            // Try to get user data from localStorage directly
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                this.updateMobileUserInfo(user);
            } else {
                // No user data found, redirect to login
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Error loading user data fallback:', error);
            this.redirectToLogin();
        }
    }

    updateMobileUserInfo(user) {
        // Update mobile user info
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileUserRole = document.getElementById('mobileUserRole');

        if (mobileUserName) {
            mobileUserName.textContent = user.username;
        }

        if (mobileUserRole) {
            mobileUserRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }

        // Show appropriate navigation based on role
        this.showRoleBasedMobileNavigation(user.role);

        // Update home link based on role
        this.updateHomeLink(user.role);
    }

    showRoleBasedMobileNavigation(role) {
        const adminNav = document.getElementById('mobileAdminNav');
        const staffNav = document.getElementById('mobileStaffNav');

        if (role === 'admin') {
            if (adminNav) adminNav.style.display = 'block';
            if (staffNav) staffNav.style.display = 'none';
        } else if (role === 'staff') {
            if (adminNav) adminNav.style.display = 'none';
            if (staffNav) staffNav.style.display = 'block';
        }
    }

    updateHomeLink(role) {
        const homeLink = document.getElementById('mobileHomeLink');
        if (homeLink) {
            if (role === 'admin') {
                homeLink.href = '../../admin/dashboard/';
            } else {
                homeLink.href = '../../staff/dashboard/';
            }
        }
    }

    setupEventListeners() {
        // Handle mobile navigation clicks
        const mobileNavLinks = document.querySelectorAll('#mobileNavbar .nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Close mobile menu after click
                const navbarCollapse = document.getElementById('mobileNavbar');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            });
        });
    }

    redirectToLogin() {
        window.location.href = '../../auth/login.php';
    }
}

/**
 * Handle mobile logout functionality
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
// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on mobile devices
    if (window.innerWidth < 768) {
        new MobileNavManager();
    }
});
</script>

<style>
/* Mobile Navbar Enhancements for Cemetery System */
@media (max-width: 767.98px) {
    .mobile-nav-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .navbar-brand {
        color: white !important;
        font-weight: 600;
        font-size: 1.1rem;
    }
    
    .navbar-brand:hover {
        color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .navbar-toggler {
        border: none;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
    }
    
    .navbar-toggler:focus {
        box-shadow: none;
        background: rgba(255, 255, 255, 0.2);
    }
    
    .navbar-toggler .fas {
        color: white;
        font-size: 1.2rem;
    }
    
    .navbar-collapse {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        margin: 1rem -15px -8px -15px;
        padding: 1rem 15px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        margin-top: 1rem;
    }
    
    .navbar-nav .nav-link {
        color: #495057 !important;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin: 0.25rem 0;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        font-weight: 500;
    }
    
    .navbar-nav .nav-link:hover {
        background: rgba(13, 110, 253, 0.1);
        color: #0d6efd !important;
        transform: translateX(5px);
    }
    
    .navbar-nav .nav-link i {
        width: 20px;
        text-align: center;
    }
    
    .dropdown-menu {
        border: none;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
    }
    
    .dropdown-item {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin: 0.25rem;
        transition: all 0.3s ease;
    }
    
    .dropdown-item:hover {
        background: rgba(13, 110, 253, 0.1);
        transform: translateX(5px);
    }
    
    .dropdown-item.text-danger:hover {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545 !important;
    }
    
    .dropdown-divider {
        margin: 0.5rem 0.25rem;
        opacity: 0.3;
    }
    
    .dropdown-item-text {
        font-weight: 600;
        color: #6c757d;
        font-size: 0.9rem;
    }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
    .navbar-nav .nav-link {
        min-height: 48px;
        font-size: 1rem;
    }
    
    .dropdown-item {
        min-height: 48px;
        font-size: 1rem;
    }
    
    .navbar-toggler {
        min-height: 44px;
        min-width: 44px;
    }
}

/* Animation for mobile nav items */
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@media (max-width: 767.98px) {
    .navbar-collapse.show .nav-item {
        animation: slideInLeft 0.3s ease forwards;
    }
    
    .navbar-collapse.show .nav-item:nth-child(1) { animation-delay: 0.1s; }
    .navbar-collapse.show .nav-item:nth-child(2) { animation-delay: 0.2s; }
    .navbar-collapse.show .nav-item:nth-child(3) { animation-delay: 0.3s; }
    .navbar-collapse.show .nav-item:nth-child(4) { animation-delay: 0.4s; }
    .navbar-collapse.show .nav-item:nth-child(5) { animation-delay: 0.5s; }
    .navbar-collapse.show .nav-item:nth-child(6) { animation-delay: 0.6s; }
}
</style>
