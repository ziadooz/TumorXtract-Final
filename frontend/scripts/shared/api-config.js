// Centralized API Configuration for TumorXtract Frontend
const API_CONFIG = Object.freeze({
    BASE_URL: 'https://localhost:7071',
    ENDPOINTS: {
        // Account endpoints
        LOGIN: '/api/Accounts/Login',
        REGISTER_DOCTOR: '/api/Accounts/RegisterDoctor',
        EMAIL_EXISTS: '/api/Accounts/EmailExists',
        GET_PROFILE: '/api/Accounts/GetProfile',
        UPDATE_PROFILE: '/api/Accounts/Updateprofile',
        UPLOAD_PROFILE_IMAGE: '/api/Accounts/UploadProfileImage',
        
        // Patient endpoints
        GET_PATIENTS: '/api/Patients',
        GET_PATIENT_BY_ID: '/api/Patients',
        CREATE_PATIENT: '/api/Patients/CreatePatient',
        UPDATE_PATIENT: '/api/Patients/UpdatePatient',
        DELETE_PATIENT: '/api/Patients/DeletePatient',
        LINK_ANALYSIS: '/api/patients',
        
        // AI/Analysis endpoints
        DETECT_WITH_DOTNET: '/api/analysis/predict'
    }
});

// Universal API call helper with authentication and error handling
const apiCall = async (endpoint, options = {}) => {
    const authToken = localStorage.getItem('authToken');
    
    // Check authentication for protected endpoints (exclude login/register)
    if (!authToken && !endpoint.includes('Login') && !endpoint.includes('Register') && !endpoint.includes('EmailExists')) {
        console.warn('No authentication token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };

    // Add Content-Type for non-FormData requests
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if token exists
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config = {
        method: 'GET',
        ...options,
        headers,
        mode: 'cors',
        cache: 'no-cache'  // Disable caching for development
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            if (errorData) {
                console.error('Server response:', errorData);
                
                if (errorData.errors && typeof errorData.errors === 'object') {
                    // Format ASP.NET Core validation errors
                    const validationErrors = Object.entries(errorData.errors)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('\n');
                    if (validationErrors) {
                        errorMessage = `Validation errors:\n${validationErrors}`;
                    } else {
                        errorMessage = JSON.stringify(errorData.errors);
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.title) {
                    errorMessage = errorData.title;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            }
            
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    } catch (error) {
        const isNetworkError = error.message === 'Failed to fetch' || !window.navigator.onLine;
        if (isNetworkError) {
            console.error('Network error:', {
                url,
                method: config.method,
                error
            });
            throw new Error('Unable to connect to the server. Please check your connection or try again later.');
        }
        
        console.error('API call error:', {
            url,
            method: config.method,
            error,
            data: config.body
        });
        throw error;
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
window.apiCall = apiCall;

// For ES6 modules (if needed in the future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, apiCall };
}
