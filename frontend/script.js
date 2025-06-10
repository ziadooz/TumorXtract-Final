// Navigation Active Link Update
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

// Define About section child IDs
const aboutChildSections = ['what-is-brain-tumor', 'technology', 'process', 'ready-to-detect'];

function updateActiveLink(currentId) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Handle home link
        if (href === 'index.html' && currentId === 'home') {
            link.classList.add('active');
        } 
        // Handle about link - activate when any child section is detected
        else if (href === '#about' && aboutChildSections.includes(currentId)) {
            link.classList.add('active');
        }
        // Handle other links normally
        else if (href === `#${currentId}`) {
            link.classList.add('active');
        }
    });
}

const observerOptions = {
    threshold: 0.3,
    rootMargin: '-100px 0px -20% 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            updateActiveLink(entry.target.id);
        }
    });
}, observerOptions);

// Observe all sections, including About child sections but excluding empty parent
sections.forEach(section => {
    if (section.id) {
        // Skip the empty parent About section but observe its children
        if (section.id === 'about') {
            return; // Skip the parent About section
        }
        observer.observe(section);
    }
});

// Set home as active when at the top
window.addEventListener('scroll', () => {
    if (window.scrollY < 100) {
        updateActiveLink('home');
    }
});

// Scroll to Top Button
const scrollToTopBtn = document.querySelector('.scroll-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.style.display = 'flex';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Team Members Navigation
const teamContainer = document.querySelector('.team');
const prevBtn = document.querySelector('.team-scroll-btn.prev');
const nextBtn = document.querySelector('.team-scroll-btn.next');

if (teamContainer && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
        teamContainer.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        teamContainer.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });

    const updateScrollButtons = () => {
        const isAtStart = teamContainer.scrollLeft === 0;
        const isAtEnd = teamContainer.scrollLeft + teamContainer.clientWidth >= teamContainer.scrollWidth;

        prevBtn.style.opacity = isAtStart ? '0.5' : '1';
        nextBtn.style.opacity = isAtEnd ? '0.5' : '1';

        prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
        nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
    };

    teamContainer.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    updateScrollButtons();
}

// Gallery Lightbox
const lightbox = document.getElementById('gallery-lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox-content img');
const galleryItems = document.querySelectorAll('.gallery-item img');
const closeBtn = lightbox?.querySelector('.lightbox-close');
const prevImgBtn = lightbox?.querySelector('.lightbox-prev');
const nextImgBtn = lightbox?.querySelector('.lightbox-next');

let currentImageIndex = 0;

function openLightbox(imgElement, index) {
    if (!lightbox || !lightboxImg) return;
    
    currentImageIndex = index;
    const fullSrc = imgElement.dataset.full || imgElement.src;
    lightboxImg.src = fullSrc;
    lightboxImg.alt = imgElement.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateNavigationButtons();
}

function closeLightbox() {
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function showNextImage() {
    if (currentImageIndex < galleryItems.length - 1) {
        currentImageIndex++;
        const nextImg = galleryItems[currentImageIndex];
        openLightbox(nextImg, currentImageIndex);
    }
}

function showPrevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        const prevImg = galleryItems[currentImageIndex];
        openLightbox(prevImg, currentImageIndex);
    }
}

function updateNavigationButtons() {
    if (!prevImgBtn || !nextImgBtn) return;
    
    prevImgBtn.style.display = currentImageIndex > 0 ? 'flex' : 'none';
    nextImgBtn.style.display = currentImageIndex < galleryItems.length - 1 ? 'flex' : 'none';
}

// Event Listeners for Gallery
galleryItems.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(img, index));
});

if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
}

if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

if (prevImgBtn) {
    prevImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrevImage();
    });
}

if (nextImgBtn) {
    nextImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNextImage();
    });
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active')) return;
    
    switch (e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            showPrevImage();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
    }
});

// Touch Navigation
let touchStartX = 0;
let touchEndX = 0;

if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
}

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeLength = touchEndX - touchStartX;
    
    if (Math.abs(swipeLength) > swipeThreshold) {
        if (swipeLength > 0) {
            showPrevImage();
        } else {
            showNextImage();
        }
    }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});
