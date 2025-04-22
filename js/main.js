// DOM Elements
const header = document.querySelector('.header');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu a');
const parallaxBgs = document.querySelectorAll('.parallax-bg');
const sections = document.querySelectorAll('section');

// Performance optimization: Store the initial position of elements to avoid reflows
let lastScrollTop = 0;
let ticking = false;
let isMobile = window.innerWidth < 768;
let supportsPassive = false;
let headerHeight = header ? header.offsetHeight : 0; // Cache header height

// Test for passive event support for better performance on mobile
try {
    const opts = Object.defineProperty({}, 'passive', {
        get: function() {
            supportsPassive = true;
            return true;
        }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
} catch (e) {}

// Event listener options
const listenerOpts = supportsPassive ? { passive: true } : false;

// Main JavaScript file for EaseUp website
document.addEventListener('DOMContentLoaded', function() {
    // Check for mobile device on load - do this first!
    checkMobile();
    
    // Initialize all components
    initNavigation();
    initParallaxEffect();
    initScrollAnimations();
    initMobileMenu();
    initFaqAccordion();
    
    // Force the header to be visible on page load
    header.style.transform = 'translateY(0)';
    header.classList.remove('hidden');
    
    // Add resize listener to handle orientation changes
    window.addEventListener('resize', function() {
        // Check if we're now on mobile after resize
        const wasMobile = isMobile;
        checkMobile();
        
        // If we switched to mobile, ensure header is visible
        if (!wasMobile && isMobile) {
            header.style.transform = 'translateY(0)';
            header.classList.remove('hidden');
        }
        
        // Update parallax on resize
        updateParallax();
        
        // Recalculate header height on resize
        headerHeight = header ? header.offsetHeight : 0;
    }, listenerOpts);
    
    // Call updateParallax once to initialize the state
    updateParallax();
    
    // Ensure smooth scrolling accounts for fixed header
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
            
            // Calculate position accounting for header height
            const headerOffset = isMobile ? 70 : 60; // Use values that match our CSS
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });
});

/**
 * Check if we're on a mobile device to adjust behaviors
 */
function checkMobile() {
    isMobile = window.innerWidth < 768;
    
    // If on mobile, ensure the header is always visible
    if (isMobile) {
        // Reset header to visible state
        header.style.transform = 'translateY(0)';
        header.classList.remove('hidden');
        
        // Disable parallax on mobile for better performance
        parallaxBgs.forEach(bg => {
            bg.style.transform = 'none';
        });
    }
}

/**
 * Debounce function to limit function calls
 * @param {Function} func The function to debounce
 * @param {Number} wait Wait time in milliseconds
 * @return {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Navigation functionality including scroll behavior and active state
 */
function initNavigation() {
    // Handle scroll events for header behavior
    window.addEventListener('scroll', debounce(function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class when scrolling down
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide header when scrolling down, show when scrolling up - BUT NOT ON MOBILE
        if (!isMobile && scrollTop > lastScrollTop && scrollTop > 200) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
        
        // Update active nav link based on scroll position
        updateActiveNavLink();
    }, 10), listenerOpts);
    
    // Handle nav link clicks for smooth scrolling
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Close mobile menu if open
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Scroll to section with offset adjustment
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Set active nav link based on scroll position
    function updateActiveNavLink() {
        if (ticking) return;
        
        ticking = true;
        requestAnimationFrame(() => {
            const scrollPosition = window.scrollY + header.offsetHeight + 20; // Add offset for better section detection
            
            // Check each section's position
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    // Remove active class from all links
                    navLinks.forEach(link => link.classList.remove('active'));
                    
                    // Add active class to current section link
                    const activeLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                    }
                }
            });
            ticking = false;
        });
    }
    
    // Initial call to set active link
    updateActiveNavLink();
}

/**
 * Parallax scrolling effect for background images
 * Creates a subtle movement effect when scrolling
 */
function initParallaxEffect() {
    // Skip parallax on mobile for better performance
    if (isMobile) return;
    
    window.addEventListener('scroll', debounce(function() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollTop = window.pageYOffset;
                
                parallaxBgs.forEach(element => {
                    const parent = element.parentElement;
                    const elementTop = parent.offsetTop;
                    const elementHeight = parent.offsetHeight;
                    const viewportHeight = window.innerHeight;
                    
                    // Calculate when element is in viewport
                    if (scrollTop + viewportHeight > elementTop && 
                        scrollTop < elementTop + elementHeight) {
                        
                        // Calculate parallax shift (slower movement than scroll)
                        const parallaxShift = (scrollTop - elementTop) * 0.4;
                        
                        // Apply transform with translateZ for hardware acceleration
                        element.style.transform = `translateY(${parallaxShift}px) translateZ(0)`;
                    }
                });
                
                ticking = false;
            });
            
            ticking = true;
        }
    }, 10), listenerOpts);
}

/**
 * Fade-in animations when scrolling
 * Elements appear as they enter the viewport
 */
function initScrollAnimations() {
    // Elements to animate when they enter the viewport
    const featureCards = document.querySelectorAll('.feature-card');
    const userCards = document.querySelectorAll('.user-card');
    const fadeInSections = document.querySelectorAll('.fade-in-section');
    
    // Options for the Intersection Observer
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.15 // 15% of the element must be visible
    };
    
    // Create observer instance
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                entry.target.classList.add('is-visible');
                entry.target.classList.add('visible'); // Add both classes for compatibility
                
                // Special handling for user cards to make them "rise" more dynamically
                if (entry.target.classList.contains('user-card')) {
                    entry.target.style.transitionDelay = `${0.1 + Math.random() * 0.3}s`;
                }
                
                // Stop observing after animation
                if (!entry.target.classList.contains('keep-observing')) {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe all sections for fade in animation
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });
    
    // Observe feature cards (staggered animation)
    featureCards.forEach((card, index) => {
        // Add delay based on index for staggered effect
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe user cards for simple animations (enhanced separately)
    userCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe general fade-in sections
    fadeInSections.forEach(section => {
        observer.observe(section);
    });
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Mobile menu toggle functionality
 * Includes touch-friendly behaviors
 */
function initMobileMenu() {
    hamburger.addEventListener('click', function() {
        // Toggle active class
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.classList.toggle('menu-open');
        
        // Toggle hamburger animation
        const bars = hamburger.querySelectorAll('.bar');
        if (hamburger.classList.contains('active')) {
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bars.forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnHamburger && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // Reset hamburger icon
            const bars = hamburger.querySelectorAll('.bar');
            bars.forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        }
    });
    
    // Add touch event handling for mobile swipe to close menu
    let touchStartX = 0;
    
    navMenu.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, listenerOpts);
    
    navMenu.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        // If swiped left (diff > 0), close the menu
        if (diff > 50) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // Reset hamburger icon
            const bars = hamburger.querySelectorAll('.bar');
            bars.forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        }
    }, listenerOpts);
}

/**
 * Initialize FAQ section with all answers visible by default
 * This simplifies the implementation with no need for click handling
 */
function initFaqAccordion() {
    // Get all FAQ items
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length === 0) return;
    
    // Make all FAQ answers visible by default
    faqItems.forEach(item => {
        // Add active class to all items
        item.classList.add('active');
        
        // Set the max height of all answers to their scroll height
        const answer = item.querySelector('.faq-answer');
        if (answer) {
            answer.style.maxHeight = 'none'; // Use 'none' instead of scroll height for better rendering
            answer.style.opacity = '1';
            
            // Optional: Add a visible open state to chevrons
            const chevron = item.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-up');
            }
        }
    });
    
    // Remove any click handling for FAQ items
    // All items will remain open for better accessibility
}

// Add CSS for active navigation link
const navStyle = document.createElement('style');
navStyle.textContent = `
    .nav-menu a.active {
        color: var(--primary-color);
        font-weight: 700;
    }
`;
document.head.appendChild(navStyle);

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;
        
        // Add offset for fixed header
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    });
});

// Parallax Scrolling Effect
function updateParallax() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollTop = window.scrollY;
            
            // Only apply parallax effect on non-mobile devices
            if (!isMobile) {
                // Update parallax backgrounds
                parallaxBgs.forEach(bg => {
                    // Performance optimization: Apply transform with translateZ for hardware acceleration
                    bg.style.transform = `translateY(${scrollTop * 0.4}px) translateZ(0)`;
                });
            }
            
            // Header shrink effect on scroll
            if (scrollTop > 100) {
                header.style.padding = '0.5rem 0';
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
                header.classList.add('scrolled');
            } else {
                header.style.padding = '1rem 0';
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                header.classList.remove('scrolled');
            }
            
            // Determine scroll direction
            const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
            lastScrollTop = scrollTop;
            
            // Auto-hide header on scroll down, show on scroll up - BUT ONLY ON DESKTOP
            if (scrollTop > 200 && !isMobile) {
                if (scrollDirection === 'down') {
                    header.style.transform = 'translateY(-100%)';
                    header.classList.add('hidden');
                } else {
                    header.style.transform = 'translateY(0)';
                    header.classList.remove('hidden');
                }
            } else {
                // Always show header on mobile or when at top of page
                header.style.transform = 'translateY(0)';
                header.classList.remove('hidden');
            }
            
            ticking = false;
        });
        
        ticking = true;
    }
}

// Scroll event listener (with throttling for performance)
window.addEventListener('scroll', updateParallax, { passive: true });

// Intersection Observer for fade-in animation
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stop observing after animation is triggered
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class to sections
sections.forEach(section => {
    section.classList.add('fade-in');
    observer.observe(section);
});

// Also observe feature cards, benefit items, and user cards for staggered animations
document.querySelectorAll('.feature-card').forEach((element, index) => {
    element.classList.add('fade-in');
    element.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(element);
});

// Initialize parallax on page load
document.addEventListener('DOMContentLoaded', () => {
    updateParallax();
    
    // Set active navigation link based on current section
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});

// Add CSS for active navigation link
const navStyle = document.createElement('style');
navStyle.textContent = `
    .nav-menu a.active {
        color: var(--primary-color);
        font-weight: 700;
    }
`;
document.head.appendChild(navStyle);

// ===== Main JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.site-nav');
    
    // ===== Navigation Handling =====
    function handleNavigation() {
        // Change header background on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Update active link on scroll
            updateActiveLink();
        });

        // Smooth scroll for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Close mobile menu if open
                    navMenu.classList.remove('active');
                    
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Update active link based on scroll position
    function updateActiveLink() {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = '#' + section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ===== Parallax Effect =====
    function initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                element.style.transform = `translateY(${scrollTop * speed}px)`;
            });
        });
    }

    // ===== Animation on Scroll =====
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Special handling for user cards to make them "rise" more dynamically
                    if (entry.target.classList.contains('user-card')) {
                        entry.target.style.transitionDelay = `${0.1 + Math.random() * 0.3}s`;
                    }
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // ===== Mobile Menu Toggle =====
    function initMobileMenu() {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    // Initialize all functions
    handleNavigation();
    initParallax();
    initScrollAnimations();
    initMobileMenu();
    
    // Initialize first view of the page
    setTimeout(() => {
        updateActiveLink();
    }, 500);
}); 