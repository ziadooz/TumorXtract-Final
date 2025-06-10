
// Auth utilities
const authUtils = {
    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    },

    getUserInfo: () => {
        return {
            displayName: localStorage.getItem('userDisplayName'),
            email: localStorage.getItem('userEmail')
        };
    },

    getUserRole: () => {
        // Get user role from JWT token or local storage
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        try {
            // Decode JWT token to get role
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            return role || 'Assistant'; // Default to Assistant if no role specified
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    },

    signOut: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userDisplayName');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    },

    // Redirect to login if not authenticated
    requireAuth: () => {
        if (!authUtils.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};

// Update header user menu with current user info
function updateUserMenu() {
    if (!authUtils.isAuthenticated()) return;

    const userInfo = authUtils.getUserInfo();
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    const profileImage = document.querySelector('.profile-img');

    if (userNameElement && userInfo.displayName) {
        userNameElement.textContent = userInfo.displayName;
    }

    // Get specialization from profile if available
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_PROFILE}?_=${Date.now()}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    })
    .then(response => response.json())
    .then(profile => {
        if (userRoleElement && profile.specialization) {
            userRoleElement.textContent = profile.specialization;
        }
        if (profileImage) {
            profileImage.onerror = () => {
                profileImage.src = 'assets/images/team/image 1.png';
            };

            if (profile.imageUrl) {
                // Ensure correct image URL format and add cache-busting
                const imageUrl = profile.imageUrl.startsWith('/') ? profile.imageUrl : '/images/Doctors/' + profile.imageUrl.split('/').pop();
                profileImage.src = `${API_CONFIG.BASE_URL}${imageUrl}?_=${Date.now()}`;
            } else {
                profileImage.src = 'assets/images/team/image 1.png';
            }
        }
    })
    .catch(console.error);
}

// Setup sign out button
document.addEventListener('DOMContentLoaded', () => {
    // Handle sign out
    const signOutButton = document.querySelector('.dropdown-item.sign-out');
    if (signOutButton) {
        signOutButton.addEventListener('click', (e) => {
            e.preventDefault();
            authUtils.signOut();
        });
    }

    // Initialize user menu
    updateUserMenu();
});

// Export for use in other files
window.authUtils = authUtils;
window.AuthUtils = authUtils; // Capital case for backward compatibility
window.updateUserMenu = updateUserMenu;
