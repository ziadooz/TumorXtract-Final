// Token management
const tokenManager = {
    setToken: (token) => localStorage.setItem('authToken', token),
    getToken: () => localStorage.getItem('authToken'),
    removeToken: () => localStorage.removeItem('authToken'),
    setUserInfo: (displayName, email) => {
        localStorage.setItem('userDisplayName', displayName);
        localStorage.setItem('userEmail', email);
    },
    clearUserInfo: () => {
        localStorage.removeItem('userDisplayName');
        localStorage.removeItem('userEmail');
    }
};

// Form validation patterns - memoized for performance
const PATTERNS = Object.freeze({
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME: /^[a-zA-Z\s]{3,}$/,
    PHONE: /^01[0125][0-9]{8}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
});

// DOM Element Cache
const elementCache = new Map();
const getElement = (selector) => {
    if (!elementCache.has(selector)) {
        elementCache.set(selector, document.querySelector(selector));
    }
    return elementCache.get(selector);
};

// Debounce function for performance optimization
const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

// Optimized validation functions
const validators = {
    email: (value) => PATTERNS.EMAIL.test(value),
    name: (value) => PATTERNS.NAME.test(value),
    phone: (value) => PATTERNS.PHONE.test(value),
    password: (value) => PATTERNS.PASSWORD.test(value)
};

// Error handling utilities
const errorHandling = {
    messages: {
        email: 'Please enter a valid email address',
        password: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (e.g., @, $, !, %, *, ?, &)',
        name: 'Please enter a valid name (letters only, at least 3 characters)',
        phone: 'Please enter a valid Egyptian phone number'
    },
    
    show: (input, message) => {
        const formGroup = input.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message') || 
                           document.createElement('p');
        
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorMessage);
        }
        
        input.classList.add('input-error');
        return true;
    },
    
    clear: (input) => {
        const formGroup = input.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');
        
        if (errorMessage) {
            errorMessage.remove();
        }
        
        input.classList.remove('input-error');
        return false;
    }
};

// Form state management
const formState = {
    setLoading: (button, isLoading) => {
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
    }
};

// Password visibility toggle with improved performance
function togglePasswordVisibility(passwordInput, toggleButton) {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = toggleButton.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Initialize forms with event delegation
document.addEventListener('DOMContentLoaded', () => {
    // Login form handling
    const loginForm = getElement('#loginForm');
    if (loginForm) {
        const passwordInput = getElement('#password');
        const toggleButton = getElement('.password-toggle');

        // Password toggle
        toggleButton?.addEventListener('click', () => {
            togglePasswordVisibility(passwordInput, toggleButton);
        }, { passive: true });

        // Form submission with validation
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('button[type="submit"]');
            formState.setLoading(submitButton, true);

            const email = loginForm.email.value.trim();
            const password = loginForm.password.value;

            // Clear previous errors
            [loginForm.email, loginForm.password].forEach(input => errorHandling.clear(input));

            // Validate inputs
            const hasErrors = [
                !validators.email(email) && errorHandling.show(loginForm.email, errorHandling.messages.email),
                !validators.password(password) && errorHandling.show(loginForm.password, errorHandling.messages.password)
            ].some(Boolean);

            if (hasErrors) {
                formState.setLoading(submitButton, false);
                return;
            }

            try {
                const loginData = await apiCall(API_CONFIG.ENDPOINTS.LOGIN, {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                // Store authentication data
                tokenManager.setToken(loginData.token);
                tokenManager.setUserInfo(loginData.displayName, loginData.email);

                // Redirect to detect page
                window.location.href = 'detect.html';
            } catch (error) {
                const message = error.message === 'Invalid Email' ? 'Invalid email address' :
                              error.message === 'Incorrect Password' ? 'Incorrect password' :
                              'Invalid email or password';
                errorHandling.show(loginForm.email, message);
            } finally {
                formState.setLoading(submitButton, false);
            }
        });
    }

    // Registration form handling
    const registerForm = getElement('#registerForm');
    if (registerForm) {
        const passwordInput = getElement('#password');
        const toggleButton = getElement('.password-toggle');
        const phoneInput = getElement('#phone');

        // Password toggle
        toggleButton?.addEventListener('click', () => {
            togglePasswordVisibility(passwordInput, toggleButton);
        }, { passive: true });

        // Phone number formatting with debounce
        phoneInput?.addEventListener('input', debounce((e) => {
            let phone = e.target.value.replace(/\D/g, '');
            if (phone.length > 11) phone = phone.slice(0, 11);
            e.target.value = phone;
        }, 100), { passive: true });

        // Form submission
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = registerForm.querySelector('button[type="submit"]');
            formState.setLoading(submitButton, true);

            const inputs = {
                name: registerForm.name.value.trim(),
                email: registerForm.email.value.trim(),
                phone: registerForm.phone.value.trim(),
                password: registerForm.password.value
            };

            // Clear previous errors
            Object.keys(inputs).forEach(key => {
                const input = registerForm[key];
                if (input) errorHandling.clear(input);
            });

            // Validate all inputs
            const validationErrors = Object.entries(inputs).map(([key, value]) => {
                const input = registerForm[key];
                return !validators[key]?.(value) && 
                       errorHandling.show(input, errorHandling.messages[key]);
            });

            if (validationErrors.some(Boolean)) {
                formState.setLoading(submitButton, false);
                return;
            }

            try {
                // Check if email exists
                const emailCheckResponse = await apiCall(
                    `${API_CONFIG.ENDPOINTS.EMAIL_EXISTS}?email=${encodeURIComponent(inputs.email)}`,
                    { method: 'GET' }
                );

                if (emailCheckResponse) {
                    errorHandling.show(registerForm.email, 'Email is already registered');
                    formState.setLoading(submitButton, false);
                    return;
                }

                // Register new user
                const registerData = await apiCall(API_CONFIG.ENDPOINTS.REGISTER_DOCTOR, {
                    method: 'POST',
                    body: JSON.stringify({
                        displayName: inputs.name,
                        email: inputs.email,
                        password: inputs.password,
                        phoneNumber: inputs.phone,
                        specialization: registerForm.specialization.value
                    })
                });

                // Show success message and redirect to login page
                const message = document.createElement('div');
                message.className = 'success-message';
                message.textContent = 'Registration successful! Please log in with your credentials.';
                document.body.appendChild(message);

                // Redirect to login page after a brief delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (error) {
                let message = 'An error occurred during registration';
                if (error.message.includes('Email')) {
                    message = 'This email is already registered';
                }
                errorHandling.show(registerForm.email, message);
            } finally {
                formState.setLoading(submitButton, false);
            }
        });
    }
});
