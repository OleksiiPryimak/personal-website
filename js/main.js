function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (!lightbox || !lightboxImg) {
        return;
    }

    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (!lightbox || !lightboxImg) {
        return;
    }

    lightbox.classList.remove('active');
    lightboxImg.src = '';
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLightbox();
    }
});

// --- INTERACTIVE PARTICLE SYSTEM (CANVAS) ---
class ParticleSystem {
    constructor(canvasId) {
        if (ParticleSystem._instance) {
            console.warn('ParticleSystem already initialized. Returning existing instance.');
            return ParticleSystem._instance;
        }
        ParticleSystem._instance = this;

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.stars = [];
        this.shootingStars = [];
        this.mouseX = -1000;
        this.mouseY = -1000;
        this.time = 0;

        this._onMouseMove = (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; };
        this._onClick = (e) => { this.spawnShootingStar(e.clientX, e.clientY); };
        this._onTouchMove = (e) => {
            if (e.touches && e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        };
        this._onTouchStart = (e) => {
            if (e.touches && e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
                this.spawnShootingStar(this.mouseX, this.mouseY);
            }
        };
        this._onTouchEnd = () => {
            this.mouseX = -1000;
            this.mouseY = -1000;
        };
        this._onResize = () => { this.resizeCanvas(); };

        this.resizeCanvas();
        this.setupEventListeners();
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.initStars();
    }

    initStars() {
        this.stars = [];
        const starCount = this.width <= 768 ? 160 : 450;
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                baseX: 0,
                baseY: 0,
                radius: Math.random() * 1.5 + 0.3,
                opacity: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.0001 + 0.03,
                twinklePhase: Math.random() * Math.PI * 1,
                originalOpacity: Math.random() * 0.7 + 0.5,
                vx: 0,
                vy: 0
            });
            
            const star = this.stars[i];
            star.baseX = star.x;
            star.baseY = star.y;
        }
    }

    setupEventListeners() {
        if (!ParticleSystem._listenersAttached) {
            document.addEventListener('mousemove', this._onMouseMove);
            document.addEventListener('click', this._onClick);
            document.addEventListener('touchmove', this._onTouchMove, { passive: true });
            document.addEventListener('touchstart', this._onTouchStart, { passive: true });
            document.addEventListener('touchend', this._onTouchEnd, { passive: true });

            const scheduleShootingStar = () => {
                if (Math.random() > 0.2) {
                    this.spawnShootingStar();
                }
                ParticleSystem._globalScheduleHandle = setTimeout(scheduleShootingStar, Math.random() * 500 + 1000);
            };
            scheduleShootingStar();

            window.addEventListener('resize', this._onResize);
            ParticleSystem._listenersAttached = true;
        }
    }

    destroy() {
        if (ParticleSystem._listenersAttached) {
            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('click', this._onClick);
            document.removeEventListener('touchmove', this._onTouchMove);
            document.removeEventListener('touchstart', this._onTouchStart);
            document.removeEventListener('touchend', this._onTouchEnd);
            window.removeEventListener('resize', this._onResize);
            clearTimeout(ParticleSystem._globalScheduleHandle);
            ParticleSystem._listenersAttached = false;
        }
        if (ParticleSystem._instance === this) ParticleSystem._instance = null;
    }

    spawnShootingStar(fromX = null, fromY = null) {
        const startX = fromX !== null ? fromX : Math.random() * this.width;
        const startY = fromY !== null ? fromY : Math.random() * this.height * 0.5;
        const endX = this.width + 200;
        const endY = startY + Math.random() * 200 - 100;
        const duration = Math.random() * 800 + 600;
        
        this.shootingStars.push({
            startX,
            startY,
            endX,
            endY,
            currentX: startX,
            currentY: startY,
            startTime: this.time,
            duration,
            length: 100,
            width: 3
        });
    }

    updateStars() {
        const REPEL_RADIUS = 100;
        const REPEL_FORCE = 0.5;
        const FRICTION = 0.95;
        const RETURN_SPEED = 0.05;

        this.stars.forEach(star => {
            const dx = star.x - this.mouseX;
            const dy = star.y - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < REPEL_RADIUS && distance > 0) {
                const angle = Math.atan2(dy, dx);
                const force = (REPEL_RADIUS - distance) / REPEL_RADIUS * REPEL_FORCE;
                star.vx += Math.cos(angle) * force;
                star.vy += Math.sin(angle) * force;
            }

            star.vx *= FRICTION;
            star.vy *= FRICTION;
            
            star.x += star.vx;
            star.y += star.vy;

            star.x += (star.baseX - star.x) * RETURN_SPEED;
            star.y += (star.baseY - star.y) * RETURN_SPEED;

            if (star.x < 0) star.x = this.width;
            if (star.x > this.width) star.x = 0;
            if (star.y < 0) star.y = this.height;
            if (star.y > this.height) star.y = 0;

            star.twinklePhase += star.twinkleSpeed;
            const twinkleNorm = (Math.sin(star.twinklePhase) + 1) / 2;
            const intensity = 0.3 + twinkleNorm * 1;
            star.opacity = Math.min(1, star.originalOpacity * intensity);
        });
    }

    updateShootingStars() {
        this.shootingStars = this.shootingStars.filter(star => {
            const elapsed = this.time - star.startTime;
            return elapsed < star.duration;
        });

        this.shootingStars.forEach(star => {
            const elapsed = this.time - star.startTime;
            const progress = elapsed / star.duration;
            
            star.currentX = star.startX + (star.endX - star.startX) * progress;
            star.currentY = star.startY + (star.endY - star.startY) * progress;
        });
    }

    drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawShootingStars() {
        this.shootingStars.forEach(star => {
            const elapsed = this.time - star.startTime;
            const progress = elapsed / star.duration;
            const opacity = Math.max(0, 1 - progress);

            const velocityX = (star.endX - star.startX) / star.duration;
            const velocityY = (star.endY - star.startY) / star.duration;
            const tailX = star.currentX - velocityX * 30;
            const tailY = star.currentY - velocityY * 30;

            const gradient = this.ctx.createLinearGradient(tailX, tailY, star.currentX, star.currentY);
            gradient.addColorStop(0, `rgba(255, 255, 200, 0)`);
            gradient.addColorStop(0.5, `rgba(255, 200, 100, ${opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity})`);

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = star.width;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(star.currentX, star.currentY);
            this.ctx.stroke();

            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.currentX, star.currentY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawStars();
        this.drawShootingStars();
    }

    animate() {
        this.time += 16;
        this.updateStars();
        this.updateShootingStars();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// --- TYPING EFFECT ---
const typeWriterTimers = {};

function typeWriter(elementId, text, speed = 50, callback = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (typeWriterTimers[elementId]) {
        clearTimeout(typeWriterTimers[elementId]);
    }
    
    element.textContent = '';
    element.classList.add('typing-active');
    let index = 0;
    const originalText = text;
    
    function type() {
        if (index < originalText.length) {
            element.innerHTML = originalText.substring(0, index + 1) + '<span class="typing-cursor"></span>';
            index++;
            typeWriterTimers[elementId] = setTimeout(type, speed);
        } else {
            element.textContent = originalText;
            delete typeWriterTimers[elementId];
            if (callback) callback();
        }
    }
    
    type();
}

const graphicsImages = [
    "images/graphic/1 oleksii-pryimak-3 art.jpg",
    "images/graphic/2 oleksii-pryimak-1-1 art.jpg",
    "images/graphic/3 Oleksii Pryimak - grafika komputerowa - design -3.jpg",
    "images/graphic/637993-Oleksii-Pryimak.jpg",
    "images/graphic/851327-Oleksii-Pryimak.jpg",
    "images/graphic/908347-Oleksii-Pryimak.jpg",
    "images/graphic/018819-Oleksii-Pryimak.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - arcive od 2021 - 1.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -1 1.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -13.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -16.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -2.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -20.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -21.jpg",
    "images/graphic/Oleksii Pryimak - grafika komputerowa - design -7 1.jpg",
    "images/graphic/oleksii_primak_archive.jpg"
];

const artImages = [
    "images/art/1 Oleksii Pryimak 22 1.jpg",
    "images/art/096939-Oleksii-Pryimak.jpg",
    "images/art/1 Oleksii Pryimak 24 mural.jpg",
    "images/art/1 Oleksii Pryimak 26 mural.jpg",
    "images/art/1 Oleksii Pryimak 27 mural.jpg",
    "images/art/1-Oleksii-Pryimak.jpg",
    "images/art/156145-Oleksii-Pryimak.jpg",
    "images/art/218852-Oleksii-Pryimak.jpg",
    "images/art/242315-Oleksii-Pryimak.jpg",
    "images/art/338756-Oleksii-Pryimak.jpg",
    "images/art/394391-Oleksii-Pryimak.jpg",
    "images/art/443023-Oleksii-Pryimak.jpg",
    "images/art/Oleksii Pryimak 1 mural.jpg",
    "images/art/Oleksii Pryimak 10 mural.JPG",
    "images/art/Oleksii Pryimak 11 mural.jpg"
];

function create3DCarousel(containerId, images) {
    const container = document.getElementById(containerId);
    if (!container || images.length === 0) return;
    container.innerHTML = '';

    const track = document.createElement('div');
    track.className = 'carousel-track';
    container.appendChild(track);

    const slides = images.map((src, index) => {
        const slide = document.createElement('button');
        slide.type = 'button';
        slide.className = 'carousel-slide';
        slide.style.backgroundImage = `url('${src}')`;
        slide.dataset.index = index;
        slide.addEventListener('click', () => {
            setCurrent(index);
        });
        track.appendChild(slide);
        return slide;
    });

    let currentIndex = 0;
    let autoRotateHandle = null;
    let pointerDown = false;
    let startX = 0;

    const updateSlides = (newIndex) => {
        currentIndex = ((newIndex % slides.length) + slides.length) % slides.length;
        slides.forEach((slide, index) => {
            slide.className = 'carousel-slide';
            const delta = (index - currentIndex + slides.length) % slides.length;
            if (delta === 0) {
                slide.classList.add('active');
            } else if (delta === 1) {
                slide.classList.add('next');
            } else if (delta === slides.length - 1) {
                slide.classList.add('prev');
            } else if (delta === 2) {
                slide.classList.add('next-far');
            } else if (delta === slides.length - 2) {
                slide.classList.add('prev-far');
            } else {
                slide.classList.add('hidden');
            }
        });
    };

    const setCurrent = (index) => {
        updateSlides(index);
        resetAutoRotate();
    };

    const resetAutoRotate = () => {
        if (autoRotateHandle) clearInterval(autoRotateHandle);
        autoRotateHandle = setInterval(() => updateSlides(currentIndex + 1), 5000);
    };

    container.addEventListener('pointerdown', (event) => {
        pointerDown = true;
        startX = event.clientX;
        container.setPointerCapture(event.pointerId);
    });

    container.addEventListener('pointermove', (event) => {
        if (!pointerDown) return;
        const diff = event.clientX - startX;
        if (Math.abs(diff) > 40) {
            event.preventDefault();
        }
    });

    container.addEventListener('pointerup', (event) => {
        if (!pointerDown) return;
        pointerDown = false;
        const diff = event.clientX - startX;
        if (Math.abs(diff) > 60) {
            updateSlides(currentIndex + (diff > 0 ? -1 : 1));
        }
    });

    container.addEventListener('wheel', (event) => {
        event.preventDefault();
        updateSlides(currentIndex + (event.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    updateSlides(currentIndex);
    resetAutoRotate();
}

// --- LANGUAGE SWITCHING ---
function switchLanguage(lang) {
    localStorage.setItem('language', lang);
    
    const btnPl = document.getElementById('btn-pl');
    const btnEn = document.getElementById('btn-en');
    if (btnPl) btnPl.classList.toggle('active', lang === 'pl');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    
    document.querySelectorAll(`[data-lang-${lang}]`).forEach(el => {
        if (el.id === 'hero-description') {
            const text = el.getAttribute(`data-lang-${lang}`);
            typeWriter(el.id, text, 30);
        } else {
            el.textContent = el.getAttribute(`data-lang-${lang}`);
        }
    });

    document.querySelectorAll('.progress-segment').forEach(seg => {
        const tooltip = seg.getAttribute(`data-tooltip-${lang}`);
        if (tooltip) seg.setAttribute('data-tooltip-active', tooltip);
    });
}

// --- NAVIGATION & INTERSECTION OBSERVER ---
const sectionsIds = ['hero', 'programming', 'graphics', 'graphics-gallery', 'art', 'art-gallery', 'contact'];

/**
 * Precyzyjny algorytm przewijania do sekcji wykorzystujący współrzędne bezwzględne dokumentu
 */
function scrollToId(id) {
    closeMobileMenu();

    if (id === 'top' || id === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const target = document.getElementById(id);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const absoluteTop = targetRect.top + (window.pageYOffset || window.scrollY);
    const header = document.querySelector('.top-header');
    const headerHeight = header ? header.offsetHeight + 15 : 80;
    const offsetPosition = Math.max(0, absoluteTop - headerHeight);

    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
}

function scrollToSection(direction) {
    const viewportCenter = window.innerHeight / 2;
    let closestIdx = 0;
    let minDistance = Infinity;

    sectionsIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        if (distance < minDistance) {
            minDistance = distance;
            closestIdx = idx;
        }
    });

    let nextIdx = direction === 'down' ? closestIdx + 1 : closestIdx - 1;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= sectionsIds.length) nextIdx = sectionsIds.length - 1;
    scrollToId(sectionsIds[nextIdx]);
}

const observerOptions = { 
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px' 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;

            if (target.tagName.toLowerCase() === 'section') {
                const id = target.id;
                const mappedId = id.replace('-gallery', '');
                document.querySelectorAll('.progress-segment').forEach(seg => {
                    seg.classList.toggle('active', seg.getAttribute('data-target') === mappedId);
                });

                const container = target.querySelector('.fade-in-section');
                if (container) container.classList.add('is-visible', 'active');
            }

            target.classList.add('active');
            if (target.classList.contains('fade-in-section')) {
                target.classList.add('is-visible');
            }

            if (target.id === 'programming' || target.id === 'graphics' || target.id === 'art') {
                const sectionTitle = target.querySelector('.section-title');
                const sectionDesc = target.querySelector('.section-desc');
                const skillsGrid = target.querySelector('.skills-grid');
                if (sectionTitle) sectionTitle.classList.add('float-up');
                if (sectionDesc) sectionDesc.classList.add('float-up');
                if (skillsGrid) skillsGrid.classList.add('float-up');
            }
        }
    });
}, observerOptions);

// --- MENU MOBILNE ---
function closeMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const btn = document.getElementById('hamburger-btn');
    if (overlay) overlay.classList.remove('active');
    if (btn) btn.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const btn = document.getElementById('hamburger-btn');
    if (!overlay || !btn) return;

    const isActive = overlay.classList.toggle('active');
    btn.classList.toggle('active', isActive);

    document.body.style.overflow = isActive ? 'hidden' : '';
}

function updateContentImageScroll() {
    const images = document.querySelectorAll('.content-image');
    images.forEach(img => {
        const rect = img.getBoundingClientRect();
        const windowCenter = window.innerHeight * 0.5;
        const distanceFromCenter = rect.top + rect.height * 0.5 - windowCenter;
        const maxOffset = 30;
        const progress = Math.max(-1, Math.min(1, distanceFromCenter / windowCenter));
        img.style.transform = `translateX(${progress * maxOffset}px)`;
    });
}

// --- INITIALIZE ON PAGE LOAD ---
function initializeApp() {
    sectionsIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    const revealElements = document.querySelectorAll(
        '.fade-in-section, .reveal, .reveal-fade, .reveal-slide-up, .reveal-slide-down, .reveal-slide-left, .reveal-slide-right, .reveal-zoom-in, .reveal-scale'
    );
    revealElements.forEach(el => observer.observe(el));

    create3DCarousel('carousel-graphics', graphicsImages);
    create3DCarousel('carousel-art', artImages);

    new ParticleSystem('particle-canvas');

    updateContentImageScroll();
    window.addEventListener('scroll', updateContentImageScroll, { passive: true });
    window.addEventListener('resize', updateContentImageScroll);

    const lang = localStorage.getItem('language') || 'pl';
    switchLanguage(lang);

    window.addEventListener('scroll', updateContentImageScroll, { passive: true });
    window.addEventListener('resize', updateContentImageScroll);

    const lang = localStorage.getItem('language') || 'pl';
    switchLanguage(lang);
}

// --- LISTENERY KLIKNIĘĆ W MENU (GÓRNE ORAZ BOCZNE) ---
document.addEventListener('DOMContentLoaded', () => {
    // Handling wszystkich linków kotwiczących (#)
    const allNavLinks = document.querySelectorAll('a[href^="#"]');
    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetAttr = link.getAttribute('href');
            if (!targetAttr || targetAttr === '#') return;
            
            e.preventDefault();
            const targetId = targetAttr.replace('#', '');
            scrollToId(targetId);
        });
    });

    // Handling bocznego paska nawigacji (.progress-segment)
    const progressSegments = document.querySelectorAll('.progress-segment');
    progressSegments.forEach(seg => {
        seg.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = seg.getAttribute('data-target');
            if (targetId) {
                scrollToId(targetId);
            }
        });
    });
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}