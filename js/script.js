// 1. Lenis Smooth Scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});
function raf(time) { 
    lenis.raf(time); 
    requestAnimationFrame(raf); 
}
requestAnimationFrame(raf);

// 2. Trailing Cursor with GSAP
const cursor = document.querySelector('.stable-cursor');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

gsap.ticker.add(() => {
    // Smooth trailing effect
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    if (cursor) {
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
    }
});

document.querySelectorAll('.interactive').forEach(el => {
    el.addEventListener('mouseenter', () => cursor?.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor?.classList.remove('hovered'));
});

// 3. Эффект Глитча (Scramble) для заголовка
const letters = "abcdefghijklmnopqrstuvwxyz0123456789!<>-_\\/[]{}—=+*^?#_"; 
document.querySelectorAll('.scramble-text').forEach(elem => {
    const originalText = elem.dataset.value || elem.innerText;
    elem.dataset.value = originalText;

    elem.addEventListener('mouseenter', () => {
        let iterations = 0;
        clearInterval(elem.scrambleInterval);
        elem.scrambleInterval = setInterval(() => {
            elem.innerText = originalText.split("")
                .map((letter, index) => {
                    if (index < iterations) {
                        return originalText[index];
                    }
                    return letters[Math.floor(Math.random() * letters.length)];
                }).join("");
            
            if (iterations >= originalText.length) {
                clearInterval(elem.scrambleInterval);
            }
            iterations += 1 / 3; // Плавное раскрытие по буквам
        }, 30); 
    });
    elem.addEventListener('mouseleave', () => {
        clearInterval(elem.scrambleInterval); 
        elem.innerText = originalText; 
    });
});

// 4. Разрешаем 3D взаимодействовать с мышью
const spline = document.querySelector('spline-viewer');
if (spline) {
    spline.addEventListener('load', () => {
        if (spline.shadowRoot) {
            const canvas = spline.shadowRoot.querySelector('canvas');
            if (canvas) {
                canvas.style.pointerEvents = 'auto';
            }
        }
    });
}

// 5. Авто-растягивание полей ввода (textarea)
document.querySelectorAll('textarea').forEach(textarea => {
    // Устанавливаем высоту при вводе
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
});

// 6. Глобальный 3D Фон с низкополигональными плавающими объектами
const initWebGLBackground = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // Сцена
    const scene = new THREE.Scene();
    
    // Камера
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Объекты
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff4500, // accent color (orange)
        wireframe: true,
        transparent: true,
        opacity: 0.15 // Уменьшенная непрозрачность
    });

    const meshes = [];

    if (canvas.dataset.pageType === 'service') {
        const tet = new THREE.Mesh(new THREE.TetrahedronGeometry(2, 0), material);
        tet.position.set(-4, 4, -5);
        scene.add(tet);
        meshes.push({ mesh: tet, rotSpeedX: 0.003, rotSpeedY: 0.002 });

        const dod = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), material);
        dod.position.set(5, 0, -6);
        scene.add(dod);
        meshes.push({ mesh: dod, rotSpeedX: -0.002, rotSpeedY: 0.003 });

        const pyr = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), material);
        pyr.position.set(-3, -3, -4);
        scene.add(pyr);
        meshes.push({ mesh: pyr, rotSpeedX: 0.002, rotSpeedY: -0.001 });
    } else {
        // Икосаэдр (в зоне "Услуги")
        const icosahedron = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 0), material);
        icosahedron.position.set(4, 3, -5);
        scene.add(icosahedron);
        meshes.push({ mesh: icosahedron, rotSpeedX: 0.002, rotSpeedY: 0.003 });

        // Октаэдр (в зоне "Портфолио")
        const octahedron = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), material);
        octahedron.position.set(-5, -2, -3);
        scene.add(octahedron);
        meshes.push({ mesh: octahedron, rotSpeedX: -0.001, rotSpeedY: 0.002 });

        // Тор (в зоне "О компании")
        const torus = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.5, 8, 20), material);
        torus.position.set(3, -8, -4);
        scene.add(torus);
        meshes.push({ mesh: torus, rotSpeedX: 0.004, rotSpeedY: 0.001 });
    }

    // Обработка скролла (Параллакс камеры)
    let scrollY = window.scrollY;
    
    // Анимация
    const clock = new THREE.Clock();

    const tick = () => {
        // Плавная ротация объектов
        meshes.forEach(obj => {
            obj.mesh.rotation.x += obj.rotSpeedX;
            obj.mesh.rotation.y += obj.rotSpeedY;
        });

        // Параллакс от скролла камеры
        scrollY = window.scrollY;
        // 0.005 - фактор смещения 3д-объектов при скролле. Отрицательный, чтобы они "уходили наверх"
        camera.position.y = -scrollY * 0.005;

        // Эффект от мыши 
        // offset from center
        const mouseNormX = (mouseX / window.innerWidth) - 0.5;
        const mouseNormY = (mouseY / window.innerHeight) - 0.5;

        camera.position.x += (mouseNormX * 1 - camera.position.x) * 0.05;
        // Не переписываем напрямую Y-камеры мышой (иначе сломаем скролл), 
        // поэтому добавим мышиный параллакс к X и небольшое смещение ротации самой сцены
        scene.rotation.x += (mouseNormY * 0.2 - scene.rotation.x) * 0.05;
        scene.rotation.y += (mouseNormX * 0.2 - scene.rotation.y) * 0.05;

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    };

    tick();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

const initServices3D = () => {
    const wrapper = document.getElementById('services-3d-wrapper');
    if (!wrapper) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, wrapper.clientWidth / wrapper.clientHeight, 0.1, 100);
    camera.position.z = 8; // Отодвинул камеру, чтобы вся сфера 100% влезала в кадр

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wrapper.appendChild(renderer.domElement);

    // Создаем сложную систему частиц (Particle Data Cloud)
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3); // Сохраняем базу

    const color = new THREE.Color();
    const accentColor = new THREE.Color(0xff4500); 
    const secondaryColor = new THREE.Color(0x888888); 

    for (let i = 0; i < particleCount; i++) {
        const radius = 3; // Радиус сферы
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        const r = Math.cbrt(Math.random()) * radius;

        const px = r * Math.sin(phi) * Math.cos(theta);
        const py = r * Math.sin(phi) * Math.sin(theta);
        const pz = r * Math.cos(phi);

        positions[i * 3] = px;
        positions[i * 3 + 1] = py;
        positions[i * 3 + 2] = pz;

        initialPositions[i * 3] = px;
        initialPositions[i * 3 + 1] = py;
        initialPositions[i * 3 + 2] = pz;

        if (Math.random() > 0.8) {
            color.copy(accentColor);
        } else {
            color.copy(secondaryColor);
        }
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Добавим группу-враппер для управления вращением
    const pivot = new THREE.Group();
    pivot.add(particles);
    scene.add(pivot);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    wrapper.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
    });

    const animate = () => {
        requestAnimationFrame(animate);
        
        // Вращаем саму сферу медленно
        particles.rotation.y += 0.0015;
        particles.rotation.x += 0.001;
        
        // Интерактивное вращение всей оси в зависимости от мыши (вместо сдвига камеры)
        targetX = mouseX * 0.5;
        targetY = mouseY * 0.5;
        pivot.rotation.x += (targetY - pivot.rotation.x) * 0.05;
        pivot.rotation.y += (targetX - pivot.rotation.y) * 0.05;
        
        // Волнообразное движение частиц (пульсация) вокруг их базовых точек
        const time = Date.now() * 0.0015;
        const positionAttribute = geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            const ix = initialPositions[i * 3];
            const iy = initialPositions[i * 3 + 1];
            const iz = initialPositions[i * 3 + 2];
            
            positionAttribute.setXYZ(
                i,
                ix + Math.sin(time + iy) * 0.1,
                iy + Math.cos(time + ix) * 0.1,
                iz + Math.sin(time + iz) * 0.1
            );
        }
        positionAttribute.needsUpdate = true;

        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        if (!wrapper.clientWidth) return;
        camera.aspect = wrapper.clientWidth / wrapper.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    });
};

// 7. Portfolio Donut Integration
const initPortfolioDonut = () => {
    const container = document.getElementById('portfolio-donut-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xff4500, 2);
    key.position.set(5, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x00aaff, 1);
    fill.position.set(-5, -2, 2);
    scene.add(fill);

    // Donut Geometry (Low Poly) - Reduced scale
    const geometry = new THREE.TorusGeometry(1.0, 0.4, 10, 24);
    const material = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xff4500,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        metalness: 0.9,
        flatShading: true
    });
    
    const donut = new THREE.Mesh(geometry, material);
    scene.add(donut);

    // Wireframe Overlay
    const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const wireframe = new THREE.Mesh(geometry, wireframeMat);
    donut.add(wireframe);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    const animate = () => {
        requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
        
        donut.rotation.x += 0.005;
        donut.rotation.y += 0.008;
        
        // Mouse reaction
        donut.position.x += (mouseX * 2 - donut.position.x) * 0.05;
        donut.position.y += (-mouseY * 2 - donut.position.y) * 0.05;
        
        // Subtle floating
        donut.position.y += Math.sin(time) * 0.002;
        
        // Emissive pulse
        material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;

        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
};

// THREE.js init — вызов функций перенесен после определения всех функций



// Инициализируем Three.js сцены после определения всех функций
if (typeof THREE !== 'undefined') {
    initWebGLBackground();
    initServices3D();
    initPortfolioDonut();
} else {
    import('https://unpkg.com/three@0.165.0/build/three.module.js').then(module => {
        window.THREE = module;
        initWebGLBackground();
        initServices3D();
        initPortfolioDonut();
    });
}


// 7. WOW-эффекты (Preloader, ScrollTrigger, Magnetic Buttons)
gsap.registerPlugin(ScrollTrigger);

// Прелоадер (SVG Line Draw)
const preloaderSvgText = document.querySelector('.svg-text-stroke');

// Проверяем, показывали ли мы уже прелоадер в этой сессии
const preloaderShown = sessionStorage.getItem('preloaderShown');

if (preloaderSvgText && !preloaderShown) {
    // Отмечаем, что прелоадер показан
    sessionStorage.setItem('preloaderShown', 'true');

    gsap.set('.hero-eyebrow, .hero-content h1, .hero-description, .hero-content .btn-primary, .site-header', { 
        y: 30, opacity: 0 
    });

    gsap.to(preloaderSvgText, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
            gsap.to(preloaderSvgText, { fill: "white", duration: 0.3 });
            
            // Убираем прелоадер
            gsap.to('.preloader', {
                yPercent: -100,
                duration: 0.8,
                delay: 0.2,
                ease: "expo.inOut"
            });
            
            // Входная анимация
            gsap.to('.site-header', { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power3.out" });
            gsap.to('.hero-eyebrow, .hero-content h1, .hero-description, .hero-content .btn-primary', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                delay: 0.5
            });
        }
    });
} else {
    // Вторичный заход или страница без прелоадера
    const preloaderEl = document.querySelector('.preloader');
    if (preloaderEl) {
        preloaderEl.style.display = 'none';
    }
    
    // Легкая анимация появления без задержки прелоадера
    gsap.from('.site-header', { y: 15, opacity: 0, duration: 0.6, ease: "power2.out" });
    gsap.from('.hero-eyebrow, .hero-content h1, .hero-description, .hero-content .btn-primary', {
        y: 15,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out"
    });
}

// Magnetic Buttons
document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(this, {
            x: x * 0.3, 
            y: y * 0.3,
            duration: 0.4,
            ease: "power2.out"
        });
    });

    btn.addEventListener('mouseleave', function() {
        gsap.to(this, {
            x: 0, 
            y: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.3)"
        });
    });
});

// Scroll Animations: Цилиндрический параллакс (Scale Effect)
let mm = gsap.matchMedia();

mm.add({
    isDesktop: "(min-width: 769px)",
    isMobile: "(max-width: 768px)"
}, (context) => {
    let { isDesktop } = context.conditions;
    
    const applyCylindricalScroll = (elements) => {
        gsap.utils.toArray(elements).forEach(el => {
            // Анимация ВХОДА (увеличение по мере приближения к центру)
            gsap.fromTo(el, 
                { scale: isDesktop ? 0.75 : 0.95, opacity: isDesktop ? 0.3 : 0.5, transformOrigin: "center center" },
                { 
                    scale: 1, 
                    opacity: 1, 
                    ease: "none",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 95%",   
                        end: "center center",  
                        scrub: 0.5
                    }
                }
            );
            
            // Анимация ВЫХОДА (уменьшение по мере удаления от центра)
            gsap.fromTo(el,
                { scale: 1, opacity: 1 },
                {
                    scale: isDesktop ? 0.75 : 0.95,
                    opacity: isDesktop ? 0.3 : 0.5,
                    ease: "none",
                    scrollTrigger: {
                        trigger: el,
                        start: "center center", 
                        end: "bottom 5%",      
                        scrub: 0.5
                    }
                }
            );
        });
    };

    applyCylindricalScroll('.service-card, .project-row, .about-text');

    return () => {}; 
});

// Portfolio Image Parallax (Отключено для удобного скролла превью)
// (Слежение за мышью убрано по просьбе пользователя)


// 8. Разделение заголовков для интерактивной реакции на ховер (Variable Font WGHT) + Фикс переноса слов
document.querySelectorAll('.interactive-heading').forEach(heading => {
    const words = heading.innerText.split(' ');
    heading.innerHTML = '';
    words.forEach((word) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            charSpan.innerText = char;
            wordSpan.appendChild(charSpan);
        });
        heading.appendChild(wordSpan);
        heading.innerHTML += ' ';
    });
});

// 9. Анимация Фоновых Circuit Lines
document.querySelectorAll('.circuit-path').forEach(path => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    
    gsap.to(path, {
        strokeDashoffset: 0,
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5
        }
    });
});

// 10. Умный Cookie Consent
const cookieBanner = document.getElementById('cookie-banner');
const cookieAcceptBtn = document.getElementById('cookie-accept');

if (cookieBanner && cookieAcceptBtn) {
    if (!localStorage.getItem('cookieConsent')) {
        cookieBanner.style.display = 'block';
        gsap.to(cookieBanner, {
            y: 0,
            duration: 1,
            ease: "power3.out",
            delay: 2.5 // Появляется плавно через секунду после загрузки
        });
    }

    cookieAcceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        gsap.to(cookieBanner, {
            y: "150%",
            duration: 0.8,
            ease: "power3.in",
            onComplete: () => { cookieBanner.style.display = 'none'; }
        });
    });
}

// 11. Smart Boundary Scrolling for Project Previews
// Это позволяет продолжить скроллить основной сайт, когда скролл картинки дошел до конца
document.querySelectorAll('.project-image-wrapper').forEach(wrapper => {
    wrapper.addEventListener('wheel', (e) => {
        const atTop = wrapper.scrollTop <= 0;
        const atBottom = Math.abs(wrapper.scrollHeight - wrapper.scrollTop - wrapper.clientHeight) <= 2;
        
        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
            // Временно отключаем взаимодействие с окном, чтобы колесико "провалилось" на основной сайт
            wrapper.style.pointerEvents = 'none';
            setTimeout(() => {
                wrapper.style.pointerEvents = ''; // возвращаем как в CSS
            }, 100);
        }
    });
});

// 12. Contact Form Submission with Telegram Integration
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm && formStatus) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerText = 'Отправка...';
        formStatus.innerText = '';
        formStatus.style.color = 'var(--text-muted)';
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/form-handler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                formStatus.innerText = '✨ Спасибо! Ваша заявка успешно отправлена.';
                formStatus.style.color = '#00ffaa'; // Success green
                contactForm.reset();
                
                // Reset textareas if any
                contactForm.querySelectorAll('textarea').forEach(textarea => {
                    textarea.style.height = 'auto';
                });
            } else {
                formStatus.innerText = '❌ ' + (result.error || 'Ошибка при отправке.');
                formStatus.style.color = '#ff4444'; // Error red
            }
        } catch (error) {
            console.error('Submission error:', error);
            formStatus.innerText = '❌ Ошибка сети. Попробуйте позже.';
            formStatus.style.color = '#ff4444';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
}
