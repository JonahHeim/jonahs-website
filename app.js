/* ================================================
   JONAH HEIM — PORTFOLIO ANIMATIONS
   Powered by GSAP + ScrollTrigger + Lenis
   ================================================ */

// ======================== INIT ========================

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initCursorSpotlight();
    initNavigation();
    initHeroAnimations();
    initSectionAnimations();
    initHorizontalScroll();
    initMobileMenu();
});

// ======================== LENIS SMOOTH SCROLL ========================

let lenis;

function initLenis() {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    });

    // Connect Lenis to GSAP's ticker
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}

// ======================== CURSOR SPOTLIGHT ========================

function initCursorSpotlight() {
    const spotlight = document.getElementById('cursorSpotlight');
    if (!spotlight) return;

    // Only activate on non-touch devices
    if ('ontouchstart' in window) {
        spotlight.style.display = 'none';
        return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth follow with requestAnimationFrame
    function updateSpotlight() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        document.documentElement.style.setProperty('--cursor-x', `${currentX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${currentY}px`);

        requestAnimationFrame(updateSpotlight);
    }
    requestAnimationFrame(updateSpotlight);
}

// ======================== NAVIGATION ========================

function initNavigation() {
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    // Show nav after scrolling past hero
    ScrollTrigger.create({
        trigger: '#apps',
        start: 'top 80%',
        onEnter: () => nav.classList.add('is-visible'),
        onLeaveBack: () => nav.classList.remove('is-visible'),
    });

    // Active link highlighting
    const sections = ['apps', 'websites', 'writing', 'about'];
    sections.forEach((sectionId) => {
        ScrollTrigger.create({
            trigger: `#${sectionId}`,
            start: 'top center',
            end: 'bottom center',
            onToggle: (self) => {
                if (self.isActive) {
                    navLinks.forEach(link => link.classList.remove('is-active'));
                    const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                    if (activeLink) activeLink.classList.add('is-active');
                }
            }
        });
    });

    // Smooth scroll on nav click
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target && lenis) {
                lenis.scrollTo(target, { offset: -60, duration: 1.5 });
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });
}

// ======================== MOBILE MENU ========================

function initMobileMenu() {
    const menuBtn = document.getElementById('navMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('is-open');
        if (isOpen) {
            closeMobileMenu();
        } else {
            mobileMenu.classList.add('is-open');
            menuBtn.classList.add('is-active');
            document.body.style.overflow = 'hidden';
        }
    });
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBtn = document.getElementById('navMenuBtn');
    if (mobileMenu) mobileMenu.classList.remove('is-open');
    if (menuBtn) menuBtn.classList.remove('is-active');
    document.body.style.overflow = '';
}

// ======================== HERO ANIMATIONS ========================

function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Name reveal — letters slide up from below
    tl.to('.hero-name-word', {
        y: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power4.out',
    }, 0.3);

    // Label fade in
    tl.to('.hero-label', {
        opacity: 1,
        duration: 0.8,
    }, 0.6);

    // Roles stagger in
    tl.to('.hero-role', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
    }, 1.0);

    // Role dividers
    tl.to('.hero-role-divider', {
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
    }, 1.2);

    // Description
    tl.to('.hero-description', {
        opacity: 1,
        y: 0,
        duration: 0.8,
    }, 1.4);

    tl.to('.hero-actions, .hero-proof', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.14,
    }, 1.6);

    // Scroll indicator
    tl.to('.hero-scroll-indicator', {
        opacity: 1,
        duration: 0.6,
    }, 1.8);

    // Parallax: hero content fades as you scroll
    gsap.to('.hero-content', {
        y: -80,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        }
    });

    // Background text parallax
    gsap.to('.hero-bg-text', {
        x: '-10%',
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        }
    });
}

// ======================== SECTION ANIMATIONS ========================

function initSectionAnimations() {
    // Animate all section headers
    document.querySelectorAll('.section').forEach(section => {
        const number = section.querySelector('.section-number');
        const titleLines = section.querySelectorAll('.section-title-line');
        const line = section.querySelector('.section-line');
        const desc = section.querySelector('.section-description');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section.querySelector('.section-header') || section,
                start: 'top 75%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
            }
        });

        // Number fade
        if (number) {
            tl.from(number, {
                opacity: 0,
                y: 20,
                duration: 0.5,
            }, 0);
        }

        // Title lines slide up
        if (titleLines.length) {
            titleLines.forEach((titleLine, i) => {
                // Create a wrapper span for the text inside
                const text = titleLine.textContent;
                titleLine.innerHTML = `<span style="display:inline-block;transform:translateY(100%)">${text}</span>`;
                tl.to(titleLine.querySelector('span'), {
                    y: 0,
                    duration: 0.8,
                    ease: 'power4.out',
                }, 0.1 + i * 0.1);
            });
        }

        // Line draws
        if (line) {
            tl.to(line, {
                scaleX: 1,
                duration: 0.8,
                ease: 'power2.out',
            }, 0.4);
        }

        // Description fades
        if (desc) {
            tl.to(desc, {
                opacity: 1,
                y: 0,
                duration: 0.6,
            }, 0.6);
        }
    });

    // Animate cards (apps and writing)
    const cards = document.querySelectorAll('[data-animation="card"]');
    cards.forEach((card, index) => {
        gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            delay: (index % 2) * 0.15, // Stagger pairs
        });
    });

    // Generic fade-up elements used in topic headers and utility blocks
    const fadeElements = document.querySelectorAll('.writing-topic-header');
    fadeElements.forEach((el) => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none',
            },
        });
    });

    // About section animations
    const aboutElements = document.querySelectorAll('.about-bio, .about-skills-title, .skills-cloud, .about-timeline');
    aboutElements.forEach((el, i) => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        });
    });

    // Skill tags stagger
    ScrollTrigger.create({
        trigger: '.skills-cloud',
        start: 'top 85%',
        onEnter: () => {
            gsap.to('.skill-tag', {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                stagger: 0.05,
                ease: 'back.out(1.7)',
            });
        },
        once: true,
    });

    // Set initial state for skill tags
    gsap.set('.skill-tag', { opacity: 0, y: 15, scale: 0.9 });

    // Timeline items stagger
    ScrollTrigger.create({
        trigger: '.timeline',
        start: 'top 85%',
        onEnter: () => {
            gsap.from('.timeline-item', {
                opacity: 0,
                x: -20,
                duration: 0.5,
                stagger: 0.12,
                ease: 'power3.out',
            });
        },
        once: true,
    });

    // Contact section
    const contactSub = document.querySelector('.contact-sub');
    const contactEmail = document.querySelector('.contact-email');
    const contactScheduleBtn = document.querySelector('.contact-schedule-btn');
    const contactSocials = document.querySelector('.contact-socials');

    if (contactSub) {
        gsap.to(contactSub, {
            opacity: 1, y: 0, duration: 0.6,
            scrollTrigger: { trigger: contactSub, start: 'top 85%', toggleActions: 'play none none none' }
        });
    }
    if (contactEmail) {
        gsap.to(contactEmail, {
            opacity: 1, y: 0, duration: 0.6, delay: 0.15,
            scrollTrigger: { trigger: contactEmail, start: 'top 90%', toggleActions: 'play none none none' }
        });
    }
    if (contactScheduleBtn) {
        gsap.to(contactScheduleBtn, {
            opacity: 1, y: 0, duration: 0.6, delay: 0.2,
            scrollTrigger: { trigger: contactScheduleBtn, start: 'top 92%', toggleActions: 'play none none none' }
        });
    }
    if (contactSocials) {
        gsap.to(contactSocials, {
            opacity: 1, y: 0, duration: 0.6, delay: 0.32,
            scrollTrigger: { trigger: contactSocials, start: 'top 90%', toggleActions: 'play none none none' }
        });
    }

    // Contact heading animation
    const contactHeading = document.querySelector('.contact-heading');
    if (contactHeading) {
        const contactTitleLines = contactHeading.querySelectorAll('.section-title-line');
        contactTitleLines.forEach((titleLine, i) => {
            const text = titleLine.textContent;
            titleLine.innerHTML = `<span style="display:inline-block;transform:translateY(100%)">${text}</span>`;
            gsap.to(titleLine.querySelector('span'), {
                y: 0,
                duration: 0.8,
                ease: 'power4.out',
                delay: i * 0.1,
                scrollTrigger: {
                    trigger: contactHeading,
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                }
            });
        });
    }
}

// ======================== HORIZONTAL SCROLL (Websites Gallery) ========================

function initHorizontalScroll() {
    const gallery = document.getElementById('websitesGallery');
    if (!gallery) return;

    // Duplicate cards once to create a seamless infinite loop.
    if (!gallery.dataset.loopReady) {
        gallery.innerHTML += gallery.innerHTML;
        gallery.dataset.loopReady = 'true';
    }

    const loopTween = gsap.to(gallery, {
        x: () => -(gallery.scrollWidth / 2),
        duration: 30,
        ease: 'none',
        repeat: -1,
        invalidateOnRefresh: true,
    });

    // Pause on hover for easier reading/clicking.
    gallery.addEventListener('mouseenter', () => loopTween.pause());
    gallery.addEventListener('mouseleave', () => loopTween.resume());
}

// ======================== UTILITY: Refresh on Resize ========================

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 250);
});
