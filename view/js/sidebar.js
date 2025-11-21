/**
 * Sidebar Toggle Functionality
 * Handles opening/closing the sidebar and theme switching
 */

const body = document.querySelector('body'),
      sidebar = body.querySelector('.sidebar'),
      toggle = body.querySelector(".toggle"),
      searchBtn = body.querySelector(".search-box"),
      modeSwitch = body.querySelector(".toggle-switch"),
      modeText = body.querySelector(".mode-text");

// Initialize sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
});

function initializeSidebar() {
    // Load sidebar state from localStorage
    if (localStorage.getItem("sidebarState") === "closed") {
        sidebar.classList.add("close");
    } else {
        sidebar.classList.remove("close");
    }

    // Toggle sidebar open/close and save state to localStorage
    if (toggle) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            if (sidebar.classList.contains("close")) {
                localStorage.setItem("sidebarState", "closed");
            } else {
                localStorage.setItem("sidebarState", "open");
            }
        });
    }

    // Ensure sidebar opens when search button is clicked and update localStorage
    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            sidebar.classList.remove("close");
            localStorage.setItem("sidebarState", "open");
        });
    }

    // Dark/Light mode toggle
    if (modeSwitch) {
        modeSwitch.addEventListener("click", (e) => {
            // Prevent default to avoid any potential conflicts
            e.preventDefault();
            
            // Add a small delay to prevent flickering
            requestAnimationFrame(() => {
                // Toggle Bootstrap dark mode
                const currentTheme = body.getAttribute('data-bs-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                body.setAttribute('data-bs-theme', newTheme);
                document.documentElement.setAttribute('data-bs-theme', newTheme);

                if (newTheme === 'dark') {
                    if (modeText) modeText.innerText = "Light mode";
                    localStorage.setItem("theme", "dark");
                } else {
                    if (modeText) modeText.innerText = "Dark mode";
                    localStorage.setItem("theme", "light");
                }
            });
        });
    }

    // Load saved theme
    loadSavedTheme();

    // Initialize tooltips
    initializeTooltips();
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        body.setAttribute('data-bs-theme', 'dark');
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        if (modeText) modeText.innerText = "Light mode";
    } else {
        body.setAttribute('data-bs-theme', 'light');
        document.documentElement.setAttribute('data-bs-theme', 'light');
        if (modeText) modeText.innerText = "Dark mode";
    }
}

function initializeTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Export functions for global access
window.SidebarManager = {
    toggle: function() {
        if (toggle) {
            toggle.click();
        }
    },
    open: function() {
        sidebar.classList.remove("close");
        localStorage.setItem("sidebarState", "open");
    },
    close: function() {
        sidebar.classList.add("close");
        localStorage.setItem("sidebarState", "closed");
    },
    toggleTheme: function() {
        if (modeSwitch) {
            modeSwitch.click();
        }
    }
};
