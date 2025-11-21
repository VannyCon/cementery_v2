<?php
/**
 * Mobile Bottom Navigation Bar Component
 * Fixed bottom navigation for mobile devices
 */
?>
<!-- <nav class="mobile-bottom-nav fixed-bottom d-md-none">
    <div class="nav-container">
        <div id="adminBottomNav" style="display: none;">
            <a href="../../admin/dashboard/" class="nav-item" data-page="dashboard">
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
            </a>
            <a href="../../admin/cemetery/" class="nav-item" data-page="cemetery">
                <i class="fas fa-map-marked-alt"></i>
                <span>Cemetery</span>
            </a>
            <a href="../../admin/burials/" class="nav-item" data-page="burials">
                <i class="fas fa-cross"></i>
                <span>Records</span>
            </a>
            <a href="../../admin/plots/" class="nav-item" data-page="plots">
                <i class="fas fa-square"></i>
                <span>Plots</span>
            </a>
            <a href="../../admin/staff_management/" class="nav-item" data-page="staff">
                <i class="fas fa-users"></i>
                <span>Staff</span>
            </a>
        </div>
        
        <div id="staffBottomNav" style="display: none;">
            <a href="../../staff/dashboard/" class="nav-item" data-page="dashboard">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="../../staff/cemetery/" class="nav-item" data-page="cemetery">
                <i class="fas fa-map-marked-alt"></i>
                <span>Cemetery</span>
            </a>
            <a href="../../staff/burials/" class="nav-item" data-page="burials">
                <i class="fas fa-search"></i>
                <span>Search</span>
            </a>
            <a href="../../staff/profile/" class="nav-item" data-page="profile">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </a>
        </div>
        <div id="fallbackBottomNav">
            <a href="../../dashboard/" class="nav-item active" data-page="home">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="../../cemetery/" class="nav-item" data-page="cemetery">
                <i class="fas fa-map-marked-alt"></i>
                <span>Cemetery</span>
            </a>
            <a href="../../burials/" class="nav-item" data-page="burials">
                <i class="fas fa-cross"></i>
                <span>Records</span>
            </a>
            <a href="../../profile/" class="nav-item" data-page="profile">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </a>
        </div>
    </div>
</nav> -->

<style>
.mobile-bottom-nav {
    background: #fff;
    border-top: 1px solid #e9ecef;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}

.nav-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 8px 0;
    max-width: 100%;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: #6c757d;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
    min-width: 60px;
}

.nav-item i {
    font-size: 20px;
    margin-bottom: 4px;
}

.nav-item span {
    font-size: 10px;
    font-weight: 500;
    text-align: center;
}

.nav-item.active {
    color: #0d6efd;
    background-color: rgba(13, 110, 253, 0.1);
}

.nav-item:hover {
    color: #0d6efd;
    background-color: rgba(13, 110, 253, 0.05);
}

.nav-item .badge {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 8px;
    padding: 2px 4px;
    border-radius: 50%;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Adjust body padding for bottom nav */
body {
    padding-bottom: 80px;
}

@media (min-width: 768px) {
    .mobile-bottom-nav {
        display: none !important;
    }
    
    body {
        padding-bottom: 0;
    }
}

/* Animation for active state */
.nav-item.active i {
    animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-4px);
    }
    60% {
        transform: translateY(-2px);
    }
}
</style>

<script>
/**
 * Mobile Bottom Navigation Manager for Cemetery System
 */
class MobileBottomNavManager {
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
            this.showFallbackNav();
            return;
        }

        // Load user data and setup navigation
        this.loadUserData();
        this.setupEventListeners();
    }

    loadUserData() {
        try {
            const user = this.authManager.getUser();
            
            if (user) {
                this.setupRoleBasedNavigation(user.role);
                this.updateActiveNavItem();
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
                this.setupRoleBasedNavigation(user.role);
                this.updateActiveNavItem();
            } else {
                // No user data found, show fallback navigation
                this.showFallbackNav();
            }
        } catch (error) {
            console.error('Error loading user data fallback:', error);
            this.showFallbackNav();
        }
    }

    setupRoleBasedNavigation(role) {
        const adminNav = document.getElementById('adminBottomNav');
        const staffNav = document.getElementById('staffBottomNav');
        const fallbackNav = document.getElementById('fallbackBottomNav');

        // Hide all navigation sections first
        if (adminNav) adminNav.style.display = 'none';
        if (staffNav) staffNav.style.display = 'none';
        if (fallbackNav) fallbackNav.style.display = 'none';

        // Show appropriate navigation based on role
        if (role === 'admin' && adminNav) {
            adminNav.style.display = 'flex';
        } else if (role === 'staff' && staffNav) {
            staffNav.style.display = 'flex';
        } else {
            this.showFallbackNav();
        }
    }

    showFallbackNav() {
        const fallbackNav = document.getElementById('fallbackBottomNav');
        const adminNav = document.getElementById('adminBottomNav');
        const staffNav = document.getElementById('staffBottomNav');

        if (adminNav) adminNav.style.display = 'none';
        if (staffNav) staffNav.style.display = 'none';
        if (fallbackNav) fallbackNav.style.display = 'flex';
    }

    updateActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        // Remove active class from all items
        navItems.forEach(item => item.classList.remove('active'));
        
        // Add active class based on current page
        if (currentPath.includes('dashboard')) {
            const dashboardItem = document.querySelector('[data-page="dashboard"]');
            if (dashboardItem) dashboardItem.classList.add('active');
        } else if (currentPath.includes('cemetery')) {
            const cemeteryItem = document.querySelector('[data-page="cemetery"]');
            if (cemeteryItem) cemeteryItem.classList.add('active');
        } else if (currentPath.includes('burials') || currentPath.includes('burial')) {
            const burialsItem = document.querySelector('[data-page="burials"]');
            if (burialsItem) burialsItem.classList.add('active');
        } else if (currentPath.includes('plots') || currentPath.includes('plot')) {
            const plotsItem = document.querySelector('[data-page="plots"]');
            if (plotsItem) plotsItem.classList.add('active');
        } else if (currentPath.includes('staff')) {
            const staffItem = document.querySelector('[data-page="staff"]');
            if (staffItem) staffItem.classList.add('active');
        } else if (currentPath.includes('profile')) {
            const profileItem = document.querySelector('[data-page="profile"]');
            if (profileItem) profileItem.classList.add('active');
        }
    }

    setupEventListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        
        // Add click animations
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(13, 110, 253, 0.3)';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.left = '50%';
                ripple.style.top = '50%';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.marginLeft = '-10px';
                ripple.style.marginTop = '-10px';
                
                this.style.position = 'relative';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
}

// Initialize mobile bottom navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on mobile devices
    if (window.innerWidth < 768) {
        new MobileBottomNavManager();
    }
    
    // Re-initialize on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth < 768 && !window.mobileBottomNavManager) {
            window.mobileBottomNavManager = new MobileBottomNavManager();
        }
    });
});

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
</script>
