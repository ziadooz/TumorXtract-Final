// Dashboard Header JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Get dashboard header elements
    const userMenu = document.querySelector('.dashboard-header .user-menu');
    const menuToggle = userMenu?.querySelector('.menu-toggle');
    const userDropdown = userMenu?.querySelector('.user-dropdown');
    const signOutBtn = userMenu?.querySelector('.dropdown-item:last-child');

    // Handle visibility of nav items based on user role
    const userRole = AuthUtils.getUserRole();
    
    // Hide Assistants nav item for non-Doctor roles
    const assistantsNavItem = document.querySelector('.dashboard-nav a[href="assistants.html"]');
    if (assistantsNavItem && userRole !== 'Doctor') {
        assistantsNavItem.style.display = 'none';
    }
    
    // Hide Detect nav item for non-Doctor roles
    const detectNavItem = document.querySelector('.dashboard-nav a[href="detect.html"]');
    if (detectNavItem && userRole !== 'Doctor') {
        detectNavItem.style.display = 'none';
    }

    // Initialize the user menu if elements exist
    if (userMenu && menuToggle && userDropdown) {
        // Simplified: menuToggle button directly toggles the dropdown
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to document
            e.preventDefault(); // Prevent any default button action
            userMenu.classList.toggle('active');
        });

        // Prevent clicks inside the dropdown from closing it via the document listener
        // (unless it's a link navigation)
        userDropdown.addEventListener('click', (e) => {
            // If the click is on an actual link (<a> tag), let it proceed.
            // Otherwise, stop propagation so the document click listener doesn't fire.
            if (!(e.target.tagName === 'A' || e.target.closest('a'))) {
                e.stopPropagation();
            }
             console.log('Clicked inside dropdown, target:', e.target);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userMenu && !userMenu.contains(e.target) && userMenu.classList.contains('active')) {
                userMenu.classList.remove('active');
            }
        });

        // Update user menu content (after scripts are loaded)
        if (typeof window.updateUserMenu === 'function') {
            window.updateUserMenu();
        } else {
            window.addEventListener('load', () => {
                if (typeof window.updateUserMenu === 'function') {
                    window.updateUserMenu();
                }
            });
        }
    }

    // Initialize sign out functionality
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authUtils.signOut();
        });
    }

    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const dashboardNav = document.querySelector('.dashboard-nav');

    if (navToggle && dashboardNav) {
        navToggle.addEventListener('click', () => {
            dashboardNav.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && 
                !dashboardNav.contains(e.target) && 
                dashboardNav.classList.contains('active')) {
                dashboardNav.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
});
