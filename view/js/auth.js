/**
 * Authentication utility for handling JWT tokens and API requests
 */
class AuthManager {
    constructor() {
        // Check if running locally (localhost or 127.0.0.1)
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('local');
        
        this.baseURL = window.location.origin + (isLocal ? '/Projects/cementry_system_mapgl' : '');
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
    }

    /**
     * Get stored authentication token
     * @returns {string|null} JWT token or null
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Get stored user data
     * @returns {object|null} User data or null
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Store authentication data
     * @param {string} token JWT token
     * @param {object} user User data
     */
    setAuth(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return this.getToken() !== null;
    }

    /**
     * Check if user has specific role
     * @param {string} role Role to check
     * @returns {boolean} True if user has role
     */
    hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    }

    /**
     * Check if user is admin
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Check if user is staff
     * @returns {boolean} True if user is staff
     */
    isStaff() {
        return this.hasRole('staff');
    }

    /**
     * Make authenticated API request
     * @param {string} url API endpoint
     * @param {object} options Fetch options
     * @returns {Promise} Fetch promise
     */
    async apiRequest(url, options = {}) {
        const token = this.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();
            
            // If token is invalid, clear auth and redirect to login
            if (response.status === 401 && data.error === 'UNAUTHORIZED') {
                this.clearAuth();
                this.redirectToLogin();
                throw new Error('Authentication required');
            }
            
            return { response, data };
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} emailOrUsername Email or username
     * @param {string} password Password
     * @returns {Promise<object>} Login result
     */
    async login(emailOrUsername, password) {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=login`, {
            method: 'POST',
            body: JSON.stringify({
                email_or_username: emailOrUsername,
                password: password
            })
        });

        if (data.success) {
            this.setAuth(data.data.token, data.data.user);
        }

        return data;
    }

    /**
     * Register user
     * @param {object} userData User registration data
     * @returns {Promise<object>} Registration result
     */
    async register(userData) {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (data.success) {
            this.setAuth(data.data.token, data.data.user);
        }

        return data;
    }

    /**
     * Logout user
     * @returns {Promise<object>} Logout result
     */
    async logout() {
        try {
            await this.apiRequest(`${this.baseURL}/auth/auth.php?action=logout`, {
                method: 'POST'
            });
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error);
        }
        
        this.clearAuth();
        this.redirectToLogin();
        
        return { success: true, message: 'Logged out successfully' };
    }

    /**
     * Validate current token
     * @returns {Promise<object>} Validation result
     */
    async validateToken() {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=validate`);
        return data;
    }

    /**
     * Refresh token
     * @returns {Promise<object>} Refresh result
     */
    async refreshToken() {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=refresh`, {
            method: 'POST'
        });

        if (data.success) {
            const user = this.getUser();
            this.setAuth(data.data.token, user);
        }

        return data;
    }

    /**
     * Get user profile
     * @returns {Promise<object>} Profile data
     */
    async getProfile() {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=profile`);
        return data;
    }

    /**
     * Update user profile
     * @param {object} profileData Profile data to update
     * @returns {Promise<object>} Update result
     */
    async updateProfile(profileData) {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=profile`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        return data;
    }

    /**
     * Check authentication status
     * @returns {Promise<object>} Auth status
     */
    async checkAuth() {
        const { data } = await this.apiRequest(`${this.baseURL}/auth/auth.php?action=check`);
        return data;
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = `${this.baseURL}/view/pages/auth/login.php`;
    }

    /**
     * Redirect to appropriate dashboard based on user role
     */
    redirectToDashboard() {
        const user = this.getUser();
        if (user) {
            if (user.role === 'admin') {
                window.location.href = `${this.baseURL}/view/pages/admin/product/`;
            } else {
                window.location.href = `${this.baseURL}/index.php`;
            }
        } else {
            this.redirectToLogin();
        }
    }

    /**
     * Initialize authentication check on page load
     */
    async init() {
        if (this.isAuthenticated()) {
            try {
                const authStatus = await this.checkAuth();
                if (!authStatus.authenticated) {
                    this.clearAuth();
                    this.redirectToLogin();
                }
            } catch (error) {
                console.warn('Auth check failed:', error);
                this.clearAuth();
                this.redirectToLogin();
            }
        }
    }

    /**
     * Show authentication required message
     * @param {string} message Custom message
     */
    showAuthRequired(message = 'Authentication required') {
        alert(message);
        this.redirectToLogin();
    }

    /**
     * Show insufficient permissions message
     * @param {string} message Custom message
     */
    showInsufficientPermissions(message = 'Insufficient permissions') {
        alert(message);
        this.redirectToDashboard();
    }

    // API configuration with authentication
    API_CONFIG = {
        baseURL: '../../../../api/',
        getHeaders: function() {
            const token = localStorage.getItem('auth_token');
            return {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            };
        },
        getFormHeaders: function() {
            const token = localStorage.getItem('auth_token');
            return {
                'Authorization': token ? `Bearer ${token}` : ''
            };
        }
    };
}

// Create global instance
window.authManager = new AuthManager();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    window.authManager.init();
});
