// --- LIGHTBOX (PODGLĄD OBRAZÓW) ---
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (!lightbox || !lightboxImg) return;

    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (!lightbox || !lightboxImg) return;

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
            return ParticleSystem._instance;
        }
        ParticleSystem._instance = this;

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
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
            startX, startY, endX, endY,
            currentX: startX, currentY: startY,
            startTime: this.time, duration,
            length: 100, width: 3
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

// --- EFEKT PISANIA NA MASZYNIE (TYPING EFFECT) ---
// --- BEZPIECZNY DLA SEO EFEKT PISANIA NA MASZYNIE ---
const typeWriterTimers = {};

function typeWriter(elementId, text, speed = 30, callback = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (typeWriterTimers[elementId]) {
        clearTimeout(typeWriterTimers[elementId]);
    }
    
    // Tekst jest CAŁY CZAS w HTML (SEO go widzi)
    element.textContent = text; 
    element.classList.add('typing-active');
    
    let index = 0;
    const fullText = text;
    
    // Zamiast czyszczenia tekstu, tworzymy nakładkę wizualną wewnątrz JS
    // lub przechodzimy po indeksach widoczności bez modyfikacji tekstowego węzła głównego
    function type() {
        if (index <= fullText.length) {
            // Bezpieczna zmiana wizualna: nakładamy podciąg z kursorem na końcu
            element.innerHTML = fullText.substring(0, index) + '<span class="typing-cursor"></span>';
            index++;
            typeWriterTimers[elementId] = setTimeout(type, speed);
        } else {
            // Po zakończeniu animacji zostawiamy czysty tekst bez kursora
            element.textContent = fullText;
            delete typeWriterTimers[elementId];
            if (callback) callback();
        }
    }
    
    type();
}

// --- ZDJĘCIA GALERII ---
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

// --- LOGIKA INTERAKTYWNEJ KARUZELI 3D (3D CAROUSEL) ---
class Carousel3D {
    constructor(containerId, images) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.images = images.slice(0, 7); // Pierwsze 7 obrazków
        this.currentIndex = 0;
        this.items = [];

        this.init();
    }

    init() {
        this.container.innerHTML = '';
        
        this.images.forEach((src, idx) => {
            const item = document.createElement('div');
            item.className = 'carousel-item';
            
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Portfolio item ${idx + 1}`;
            img.loading = 'lazy';
            
            item.appendChild(img);
            
            // Kliknięcie środkowego zdjęcia otwiera Lightbox, bocznego - wyśrodkowuje je
            item.addEventListener('click', () => {
                if (idx === this.currentIndex) {
                    openLightbox(src);
                } else {
                    this.currentIndex = idx;
                    this.update();
                }
            });

            this.container.appendChild(item);
            this.items.push(item);
        });

        // Drag / Swipe obsługa na urządzeniach dotykowych i myszką
        let startX = 0;
        let isDragging = false;

        this.container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
        });

        this.container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const diff = e.clientX - startX;
            if (Math.abs(diff) > 50) {
                if (diff < 0) this.next();
                else this.prev();
                isDragging = false;
            }
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) this.next();
                else this.prev();
            }
        }, { passive: true });

        this.update();
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.update();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.update();
    }

    update() {
        const total = this.items.length;
        this.items.forEach((item, idx) => {
            item.className = 'carousel-item';
            
            let diff = idx - this.currentIndex;
            
            // Logika karuzeli nieskończonej
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            if (diff === 0) {
                item.classList.add('active');
            } else if (diff === -1) {
                item.classList.add('prev');
            } else if (diff === 1) {
                item.classList.add('next');
            } else if (diff === -2) {
                item.classList.add('far-prev');
            } else if (diff === 2) {
                item.classList.add('far-next');
            } else {
                item.classList.add('hidden');
            }
        });
    }
}

// --- LANGUAGE SWITCHING ---
function switchLanguage(lang) {
    localStorage.setItem('language', lang);
    
    const btnPl = document.getElementById('btn-pl');
    const btnEn = document.getElementById('btn-en');
    if (btnPl) btnPl.classList.toggle('active', lang === 'pl');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    
    document.querySelectorAll(`[data-lang-${lang}]`).forEach(el => {
        const text = el.getAttribute(`data-lang-${lang}`);
        
        if (el.id === 'hero-description' || el.classList.contains('section-title')) {
            if (!el.id) {
                el.id = 'title-' + Math.random().toString(36).substr(2, 9);
            }
            typeWriter(el.id, text, 25);
        } else {
            el.textContent = text;
        }
    });
}

// --- NAWIGACJA ORAZ SCROLLOWANIE STRZAŁKĄ ---
const sectionsIds = ['hero', 'programming', 'graphics', 'graphics-gallery', 'art', 'art-gallery', 'contact'];

function handleSmartScroll() {
    const contactEl = document.getElementById('contact');
    
    if (contactEl) {
        const contactRect = contactEl.getBoundingClientRect();
        if (contactRect.top <= window.innerHeight * 0.3) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    for (let i = 0; i < sectionsIds.length - 1; i++) {
        const nextEl = document.getElementById(sectionsIds[i + 1]);
        if (nextEl) {
            const nextTop = nextEl.offsetTop;
            if (nextTop > currentScroll + 50) {
                window.scrollTo({
                    top: nextTop,
                    behavior: 'smooth'
                });
                return;
            }
        }
    }
}

function updateNavArrow() {
    const icon = document.getElementById('nav-scroll-icon');
    if (!icon) return;

    const contactEl = document.getElementById('contact');
    if (contactEl) {
        const rect = contactEl.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.4) {
            icon.className = 'fas fa-arrow-up';
            return;
        }
    }
    icon.className = 'fas fa-arrow-down';
}

// --- OBSERWATOR PRZEWIJANIA Z EFEKTEM PISANIA DLA NAGŁÓWKÓW ---
const observerOptions = { 
    threshold: 0.2,
    rootMargin: '0px 0px -40px 0px' 
};

const typedHeaders = new Set();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;

            target.classList.add('active');
            if (target.classList.contains('fade-in-section')) {
                target.classList.add('is-visible');
            }

            const titleEl = target.querySelector('.section-title');
            if (titleEl && !typedHeaders.has(titleEl)) {
                typedHeaders.add(titleEl);
                
                const currentLang = localStorage.getItem('language') || 'pl';
                const langAttr = titleEl.getAttribute(`data-lang-${currentLang}`);
                const textToType = langAttr || titleEl.textContent.trim();
                
                if (!titleEl.id) {
                    titleEl.id = 'title-' + Math.random().toString(36).substr(2, 9);
                }

                typeWriter(titleEl.id, textToType, 40);
            }
        }
    });
}, observerOptions);

// --- INITIALIZATION ---
function initializeApp() {
    // 1. Obserwator do animacji Sekcji
    sectionsIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    const revealElements = document.querySelectorAll(
        '.fade-in-section, .reveal, .reveal-fade, .reveal-slide-up, .reveal-slide-down, .reveal-slide-left, .reveal-slide-right, .reveal-zoom-in, .reveal-scale'
    );
    revealElements.forEach(el => observer.observe(el));

    // 2. Generowanie interaktywnych karuzel 3D
    new Carousel3D('carousel-graphics', graphicsImages);
    new Carousel3D('carousel-art', artImages);

    // 3. Efekt tła Canvas
    new ParticleSystem('particle-canvas');

    // 4. Aktualizacja strzałki nawigacyjnej przy skrolowaniu
    window.addEventListener('scroll', updateNavArrow, { passive: true });
    updateNavArrow();

    // 5. Zmiana języka
    const lang = localStorage.getItem('language') || 'pl';
    switchLanguage(lang);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}