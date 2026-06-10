// ========== PARTICLES GENERATION ==========
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    particlesContainer.innerHTML = '';
    const particleCount = Math.min(50, Math.max(30, Math.floor(window.innerWidth / 20)));
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.backgroundColor = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
        particle.style.borderRadius = '50%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animation = `floatParticle ${Math.random() * 20 + 15}s linear infinite`;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.pointerEvents = 'none';
        particlesContainer.appendChild(particle);
    }
}

// Add keyframe animation for particles
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
    }
`;
document.head.appendChild(particleStyle);

// ========== 3D TILT EFFECT FOR MOCKUP ==========
function initTiltEffect() {
    const mockup = document.querySelector('.mockup');
    if (!mockup) return;
    
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;
    
    mockup.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 25;
        const rotateY = (centerX - x) / 25;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    mockup.addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        this.style.transition = 'transform 0.5s ease';
    });
}

// ========== TYPING ANIMATION ==========
function initTypingAnimation() {
    const subtitleElement = document.querySelector('.hero-subtitle');
    if (!subtitleElement) return;
    
    const originalText = subtitleElement.textContent;
    subtitleElement.textContent = '';
    
    let i = 0;
    function typeNext() {
        if (i < originalText.length) {
            subtitleElement.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeNext, 50);
        }
    }
    
    typeNext();
}

// ========== WATER RIPPLE EFFECT ==========
function initWaterRipple() {
    const ctaButton = document.querySelector('.cta-button');
    if (!ctaButton) return;
    
    ctaButton.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(11,94,126,0.3)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.transition = 'all 0.5s ease-out';
        ripple.style.pointerEvents = 'none';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.width = '300px';
            ripple.style.height = '300px';
            ripple.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            ripple.remove();
        }, 500);
    });
}

// ========== ANIMATED BOAT ==========
function initAnimatedBoat() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    if (document.querySelector('.sailing-boat')) return;
    
    const boat = document.createElement('div');
    boat.className = 'sailing-boat';
    boat.innerHTML = '🚤';
    boat.style.position = 'absolute';
    boat.style.bottom = '15%';
    boat.style.right = '-80px';
    boat.style.fontSize = '56px';
    boat.style.zIndex = '5';
    boat.style.animation = 'sailAcross 14s linear infinite';
    boat.style.pointerEvents = 'none';
    boat.style.filter = 'drop-shadow(0 5px 10px rgba(0,0,0,0.2))';
    
    hero.appendChild(boat);
    
    const boatStyle = document.createElement('style');
    boatStyle.textContent = `
        @keyframes sailAcross {
            0% { right: -80px; transform: translateY(0px) rotate(0deg); }
            15% { transform: translateY(-12px) rotate(4deg); }
            30% { transform: translateY(6px) rotate(-3deg); }
            45% { transform: translateY(-8px) rotate(3deg); }
            60% { transform: translateY(4px) rotate(-2deg); }
            75% { transform: translateY(-6px) rotate(2deg); }
            100% { right: calc(100% + 80px); transform: translateY(0px) rotate(0deg); }
        }
        
        @media (max-width: 768px) {
            .sailing-boat {
                animation: sailAcross 10s linear infinite;
                font-size: 40px;
                bottom: 10%;
            }
            @keyframes sailAcross {
                0% { right: -60px; transform: translateY(0px) rotate(0deg); }
                20% { transform: translateY(-8px) rotate(4deg); }
                40% { transform: translateY(5px) rotate(-3deg); }
                60% { transform: translateY(-5px) rotate(3deg); }
                80% { transform: translateY(4px) rotate(-2deg); }
                100% { right: calc(100% + 60px); transform: translateY(0px) rotate(0deg); }
            }
        }
    `;
    document.head.appendChild(boatStyle);
}

// ========== SCROLL REVEAL ANIMATION ==========
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .step');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    revealElements.forEach(el => observer.observe(el));
}

// ========== INITIALIZE EVERYTHING ==========
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initTiltEffect();
    initTypingAnimation();
    initWaterRipple();
    initAnimatedBoat();
    initScrollReveal();
    
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(createParticles, 250);
    });
});
