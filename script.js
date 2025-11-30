// ===== CONFIGURATION =====
const API_BASE = '/api';
let currentLang = 'en';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initNavigation();
    initScrollAnimations();
    initCarousel();
    initContactForm();
    initResumeDownload();

    trackVisitor();
});

// ===== LANGUAGE MANAGEMENT =====
function initLanguage() {
    // Get saved language or default to English
    const savedLang = localStorage.getItem('language');

    if (savedLang) {
        currentLang = savedLang;
    } else {
        currentLang = 'en'; // Always start with English
    }

    setLanguage(currentLang);

    // Language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Toggle RTL for Arabic
    if (lang === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.setAttribute('lang', 'ar');
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.body.classList.remove('rtl');
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', 'ltr');
    }

    // Update page title
    const titles = {
        en: 'Aleksey Lazarev | Event Management Professional',
        ru: 'Алексей Лазарев | Профессионал в управлении мероприятиями',
        ar: 'أليكسي لازاريف | محترف إدارة الفعاليات',
        zh: '阿列克谢·拉扎列夫 | 活动管理专家'
    };
    document.title = titles[lang] || titles.en;
}

// ===== NAVIGATION =====
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active link
        updateActiveLink();
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function updateActiveLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.achievement-card, .service-card, .timeline-item, .portfolio-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ===== PORTFOLIO CAROUSEL =====
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carouselContainer = document.querySelector('.carousel-container');

    if (!slides.length) return;

    let currentSlide = 0;
    let autoPlayInterval = null;
    let isTransitioning = false;

    // Show specific slide
    function showSlide(index) {
        if (isTransitioning) return;

        // Normalize index
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        // Update slides
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === currentSlide) {
                slide.classList.add('active');
            }
        });

        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.remove('active');
            if (i === currentSlide) {
                indicator.classList.add('active');
            }
        });

        // Prevent rapid clicking
        isTransitioning = true;
        setTimeout(() => {
            isTransitioning = false;
        }, 600);
    }

    // Navigation functions
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Auto-play management
    function startAutoPlay() {
        stopAutoPlay(); // Clear any existing interval
        autoPlayInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    // Button event listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }

    // Indicator clicks
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
            stopAutoPlay();
            startAutoPlay();
        });
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    if (carouselContainer) {
        carouselContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
                stopAutoPlay();
                startAutoPlay();
            }
        }, { passive: true });

        // Pause on hover
        carouselContainer.addEventListener('mouseenter', stopAutoPlay);
        carouselContainer.addEventListener('mouseleave', startAutoPlay);
    }

    // Keyboard navigation (only when carousel is in viewport)
    let carouselInView = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            carouselInView = entry.isIntersecting;
        });
    }, { threshold: 0.5 });

    if (carouselContainer) {
        observer.observe(carouselContainer);
    }

    document.addEventListener('keydown', (e) => {
        if (!carouselInView) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        }
    });

    // Initialize
    showSlide(0);
    startAutoPlay();

    // Cleanup on page unload
    window.addEventListener('beforeunload', stopAutoPlay);
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value,
            language: currentLang
        };

        try {
            const response = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showToast(translations[currentLang].contact_success || 'Message sent successfully!', 'success');
                form.reset();
            } else {
                showToast(translations[currentLang].contact_error || 'Error sending message', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(translations[currentLang].contact_error || 'Error sending message', 'error');
        }
    });
}

// ===== RESUME DOWNLOAD =====
function initResumeDownload() {
    const downloadBtn = document.getElementById('downloadResume');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            window.open('resume.html', '_blank');
        });
    }
}

// ===== WHATSAPP INTEGRATION =====
function initWhatsApp() {
    const whatsappBtn = document.getElementById('whatsappBtn');
    const whatsappNumber = '79035560626';

    whatsappBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const message = encodeURIComponent(translations[currentLang].whatsapp_message || 'Hello! I\'m interested in your services.');
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    });
}

// ===== VISITOR TRACKING =====
// ===== VISITOR TRACKING =====
async function trackVisitor() {
    // Check if already tracked in this session
    if (sessionStorage.getItem('visitorTracked')) {
        return;
    }

    try {
        const visitorData = {
            language: currentLang,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE}/visitor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(visitorData)
        });

        if (response.ok) {
            sessionStorage.setItem('visitorTracked', 'true');
        }
    } catch (error) {
        console.error('Error tracking visitor:', error);
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button (optional)
window.addEventListener('scroll', debounce(() => {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        if (window.scrollY > 500) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    }
}, 100));
