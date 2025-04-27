// Mobile navigation functionality for admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Create mobile menu toggle button if it doesn't exist
    if (!document.getElementById('mobileMenuToggle')) {
        const header = document.querySelector('.p-6');
        if (header) {
            // Add relative positioning to the sidebar container for proper button placement
            const sidebarContainer = document.querySelector('.w-full.md\\:w-64');
            if (sidebarContainer) {
                sidebarContainer.style.position = 'relative';
            }
            
            const toggleButton = document.createElement('button');
            toggleButton.id = 'mobileMenuToggle';
            toggleButton.className = 'md:hidden absolute top-6 right-4 text-sage z-50';
            toggleButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            `;
            toggleButton.addEventListener('click', toggleMobileMenu);
            header.parentNode.insertBefore(toggleButton, header.nextSibling);
        }
    }
    
    // Add mobile menu class to the navigation if not already present
    const nav = document.querySelector('nav');
    if (nav && !nav.classList.contains('mobile-nav')) {
        nav.classList.add('mobile-nav');
        nav.classList.add('md:block');
        
        // Only hide on mobile initially
        if (window.innerWidth < 768) {
            nav.classList.add('hidden');
        }
        
        // Add z-index and position for mobile view
        nav.style.zIndex = '50';
        
        // Add background color and shadow for better visibility on mobile
        nav.classList.add('bg-white');
        
        // Add responsive styles for mobile view
        if (window.innerWidth < 768) {
            nav.style.position = 'absolute';
            nav.style.width = '100%';
            nav.style.left = '0';
            nav.style.top = '70px'; // Position below header
            nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
    }
    
    // Add logout button to mobile view if it's not already there
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && !document.getElementById('mobileLogoutBtn')) {
        const mobileLogoutContainer = document.createElement('div');
        mobileLogoutContainer.className = 'md:hidden p-4 border-t border-gray-200 mt-4';
        mobileLogoutContainer.innerHTML = `
            <button id="mobileLogoutBtn" class="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-300">
                Logout
            </button>
        `;
        nav.appendChild(mobileLogoutContainer);
        
        // Add event listener to mobile logout button
        document.getElementById('mobileLogoutBtn').addEventListener('click', function() {
            // Trigger the same action as the desktop logout button
            logoutBtn.click();
        });
    }
    
    // Handle window resize to show/hide menu appropriately
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            // On desktop, always show the nav
            nav.classList.remove('hidden');
            nav.style.position = '';
            nav.style.width = '';
            nav.style.left = '';
            nav.style.top = '';
            nav.style.boxShadow = '';
        } else {
            // On mobile, hide the nav unless it's been toggled
            if (!nav.classList.contains('mobile-active')) {
                nav.classList.add('hidden');
            }
            nav.style.position = 'absolute';
            nav.style.width = '100%';
            nav.style.left = '0';
            nav.style.top = '70px';
            nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
    });
});

// Toggle mobile menu function
function toggleMobileMenu() {
    const nav = document.querySelector('.mobile-nav');
    if (nav) {
        nav.classList.toggle('hidden');
        nav.classList.toggle('mobile-active');
        
        // Add animation for smooth transition
        if (!nav.classList.contains('hidden')) {
            nav.style.animation = 'fadeIn 0.3s ease-in-out';
        } else {
            nav.style.animation = 'fadeOut 0.3s ease-in-out';
        }
    }
}

// Add CSS animation to head if not already present
if (!document.getElementById('mobile-nav-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'mobile-nav-styles';
    styleEl.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(styleEl);
}