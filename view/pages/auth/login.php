<?php require_once '../../components/toast.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Cemetery Management System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .hero-section {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 0;
        }
        
        .login-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
            width: 100%;
        }
        
        .login-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2.5rem 2rem;
            text-align: center;
        }
        
        .logo-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .login-form {
            padding: 2.5rem;
        }
        
        .form-control {
            border-radius: 50px;
            border: 2px solid #e2e8f0;
            padding: 12px 20px;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.9);
        }
        
        .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
            background: white;
        }
        
        .btn-login {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50px;
            padding: 12px 30px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
        }
        
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
        
        .btn-outline-secondary {
            border-radius: 0 50px 50px 0;
            border-color: #e2e8f0;
            color: #718096;
            transition: all 0.3s ease;
        }
        
        .btn-outline-secondary:hover {
            background: #667eea;
            border-color: #667eea;
            color: white;
        }
        
        .alert {
            border-radius: 15px;
            border: none;
        }
        
        .register-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .register-link:hover {
            color: #5a67d8;
            text-decoration: underline;
        }
        
        .form-check-input:checked {
            background-color: #667eea;
            border-color: #667eea;
        }
        
        .form-label {
            color: #4a5568;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .input-group .form-control {
            border-radius: 50px 0 0 50px;
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
</head>
<body>
    <div class="floating-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
    </div>
    
    <div class="hero-section">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-12 col-md-6 col-lg-5">
                    <div class="login-container">
                        <div class="login-header">
                            <div class="logo-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <h2>Welcome Back!</h2>
                            <p class="mb-0">Sign in to your Cemetery Management System</p>
                        </div>
                    
                    <div class="login-form">
                        <div id="alertContainer"></div>
                        
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="emailOrUsername" class="form-label">
                                    <i class="fas fa-user me-2"></i>Email or Username
                                </label>
                                <input type="text" class="form-control" id="emailOrUsername" name="email_or_username" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">
                                    <i class="fas fa-lock me-2"></i>Password
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="password" name="password" required>
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Remember me
                                </label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-login w-100 mb-3">
                                <i class="fas fa-sign-in-alt me-2"></i>Sign In
                            </button>
                        </form>
                        
                        <div class="text-center">
                            <p class="mb-0">Don't have an account? 
                                <a href="register.php" class="register-link">Sign up here</a>
                            </p>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Check if user is already logged in on page load
        document.addEventListener('DOMContentLoaded', function() {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('user_data');
            
            if (token && userData) {
                try {
                    const user = JSON.parse(userData);
                    // Redirect based on user role
                    if (user.role === 'admin') {
                        window.location.href = '../admin/cemetery/';
                    } else {
                        window.location.href = '../staff/records/';
                    }
                } catch (error) {
                    // Invalid user data, clear storage
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                }
            }
        });
        // Toggle password visibility
        document.getElementById('togglePassword').addEventListener('click', function() {
            const passwordField = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        // Handle form submission
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const loginData = {
                email_or_username: formData.get('email_or_username'),
                password: formData.get('password')
            };
            
            try {
                const response = await fetch('../../../auth/auth.php?action=login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Store token in localStorage
                    localStorage.setItem('auth_token', result.data.token);
                    localStorage.setItem('user_data', JSON.stringify(result.data.user));
                    
                    CustomToast.success('Login successful! Redirecting...');
                    
                    // Redirect based on user role
                    setTimeout(() => {
                        if (result.data.user.role === 'admin') {
                            window.location.href = '../admin/cemetery/';
                        } else {
                            window.location.href = '../staff/records/';
                        }
                    }, 1500);
                } else {
                    CustomToast.error(result.message);
                }
            } catch (error) {
                CustomToast.error('An error occurred. Please try again.');
                console.error('Login error:', error);
            }
        });


        // Check if user is already logged in
        window.addEventListener('load', function() {
            const token = localStorage.getItem('auth_token');
            if (token) {
                // Verify token
                fetch('../../auth/auth.php?action=check', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => response.json())
                .then(result => {
                    if (result.authenticated) {
                        // User is already logged in, redirect
                        if (result.data.user.role === 'admin') {
                            window.location.href = '../admin/cemetery/';
                        } else {
                            window.location.href = '../staff/records/';
                        }
                    }
                })
                .catch(error => {
                    // Token is invalid, remove it
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                });
            }
        });
    </script>
</body>
</html>
