// Handle authentication state and UI updates
document.addEventListener('DOMContentLoaded', () => {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu'); // This is the one in index.html's main header
    const menuToggle = userMenu?.querySelector('.menu-toggle'); // Ensure targeting within userMenu
    const userDropdown = userMenu?.querySelector('.user-dropdown'); // Ensure targeting within userMenu
    const startDetectionBtn = document.getElementById('heroStartDetectionBtn');
    const getStartedBtn = document.getElementById('readyGetStartedBtn');
    const signOutBtn = userMenu?.querySelector('.sign-out'); // Target sign-out within the user-menu

    if (authUtils.isAuthenticated()) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        
        updateUserMenu(); // This function is from auth-utils.js
        
        if (startDetectionBtn) startDetectionBtn.onclick = () => window.location.href = 'detect.html';
        if (getStartedBtn) getStartedBtn.onclick = () => window.location.href = 'detect.html';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        
        // Set CTA buttons to redirect to register.html for non-authenticated users
        if (startDetectionBtn) startDetectionBtn.onclick = () => window.location.href = 'register.html';
        if (getStartedBtn) getStartedBtn.onclick = () => window.location.href = 'register.html';
    }

    // Handle user menu dropdown toggle for the index.html header
    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from immediately closing due to document listener
        userDropdown?.classList.toggle('active');
    });

    // Close dropdown when clicking outside, specific to index.html's user menu
    document.addEventListener('click', (e) => {
        if (userMenu && !userMenu.contains(e.target) && userDropdown?.classList.contains('active')) {
            userDropdown.classList.remove('active');
        }
    });

    // Initialize sign out functionality for the index.html user menu
    signOutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        authUtils.signOut();
    });
});
