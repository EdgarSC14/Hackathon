// Sistema de partículas estilo Morpho con esfera 3D interactiva usando Three.js
class MorphoParticles {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.baseRadius = 150;
        this.maxRadius = 600;
        this.currentRadius = 150;
        this.particleCount = 2000;
        this.scrollProgress = 0;
        this.scrollAnimationDuration = 0.15;
        this.sponsorVisibilityStart = 0.3;
        this.sponsorVisibilityEnd = 0.7;
        this.sponsorFadeComplete = 0.9;
        
        this.scene = this.camera = this.renderer = this.particles = null;
        this.logoSprites = [];
        this.centerLogo = null;
        this.backgroundParticles = null;
        this.rotationSpeed = 0.0005;
        this.currentRotationY = 0;
        this.lastScrollTime = 0;
        this.throttleDelay = 16; // ~60fps
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        // Configurar Three.js
        this.setupThreeJS();
        
        // Cargar logos de sponsors
        this.loadSponsorLogos();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('scroll', () => this.onScroll());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Iniciar animación
        this.animate();
    }
    
    setupThreeJS() {
        // Escena
        this.scene = new THREE.Scene();
        
        // Cámara
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 10000);
        this.camera.position.z = 1000;
        this.camera.position.y = 180;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Crear partículas de fondo primero
        this.createBackgroundParticles();
        
        // Crear sistema de partículas 3D
        this.createParticleSystem();
    }
    
    createBackgroundParticles() {
        const bgParticleMaterial = new THREE.PointsMaterial({
            color: 0x8b5cf6,
            size: 3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const count = 1500;
        
        const velocities = [];
        
        for (let i = 0; i < count; i++) {
            positions.push(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 1000
            );
            
            velocities.push(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.3
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.backgroundParticles = new THREE.Points(geometry, bgParticleMaterial);
        this.backgroundParticles.userData = {velocities: velocities};
        this.scene.add(this.backgroundParticles);
    }
    
    createParticleSystem() {
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: false
        });
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const radius = this.baseRadius;
        const particleCount = this.particleCount;
        
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = radius + (Math.random() - 0.5) * 50;
            
            positions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        this.particles = new THREE.Points(geometry, particleMaterial);
        this.scene.add(this.particles);
        this.originalPositions = new Float32Array(positions);
        
        // Crear logo en el centro
        this.createCenterLogo();
    }
    
    createCenterLogo() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, size, size);
        
        const center = size / 2;
        
        // Gradiente radial para fondo del logo
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.4);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        // Círculo principal con gradiente
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde exterior blanco
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(center, center, size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Forma interna: diamante abstracto
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(center, center - size * 0.25);
        ctx.lineTo(center + size * 0.18, center);
        ctx.lineTo(center, center + size * 0.25);
        ctx.lineTo(center - size * 0.18, center);
        ctx.closePath();
        ctx.fill();
        
        // Punto brillante en el centro
        const innerGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.15);
        innerGradient.addColorStop(0, 'rgba(139, 92, 246, 1)');
        innerGradient.addColorStop(1, 'rgba(139, 92, 246, 0.3)');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(center, center, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo brillante
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.beginPath();
        ctx.arc(center, center, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Líneas decorativas sutiles
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(
                center + Math.cos(angle) * size * 0.25,
                center + Math.sin(angle) * size * 0.25
            );
            ctx.lineTo(
                center + Math.cos(angle) * size * 0.38,
                center + Math.sin(angle) * size * 0.38
            );
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const logoMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
            blending: THREE.NormalBlending
        });
        
        const logo = new THREE.Sprite(logoMaterial);
        logo.scale.set(60, 60, 1);
        logo.position.set(0, 0, 0);
        
        logo.userData = {};
        
        this.centerLogo = logo;
        this.scene.add(logo);
    }
    
    loadSponsorLogos() {
        const sponsorUrls = [
            'https://via.placeholder.com/100x100/8b5cf6/ffffff?text=1',
            'https://via.placeholder.com/100x100/6366f1/ffffff?text=2',
            'https://via.placeholder.com/100x100/a855f7/ffffff?text=3',
            'https://via.placeholder.com/100x100/ec4899/ffffff?text=4'
        ];
        
        const loader = new THREE.TextureLoader();
        const total = sponsorUrls.length;
        
        sponsorUrls.forEach((url, index) => {
            loader.load(url, texture => {
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending
                }));
                
                const angle = (index / total) * Math.PI * 2;
                const distance = this.baseRadius * 1.8;
                sprite.position.set(
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance,
                    0
                );
                sprite.scale.set(60, 60, 1);
                sprite.userData = {originalScale: 60, angle, distance};
                
                this.scene.add(sprite);
                this.logoSprites.push(sprite);
            });
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onScroll() {
        const now = performance.now();
        if (now - this.lastScrollTime < this.throttleDelay) return;
        this.lastScrollTime = now;
        
        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - windowHeight * 2;
        
        this.scrollProgress = Math.max(0, Math.min(scrollTop / maxScroll, 1));
        
        this.updateCircleExpansion();
        this.updateSponsorVisibility();
    }
    
    updateCircleExpansion() {
        const targetRadius = this.baseRadius + (this.maxRadius - this.baseRadius) * this.scrollProgress;
        this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, targetRadius, this.scrollAnimationDuration);
        
        if (this.particles && this.originalPositions) {
            const positions = this.particles.geometry.attributes.position.array;
            const scale = this.currentRadius / this.baseRadius;
            const len = positions.length;
            
            for (let i = 0; i < len; i += 3) {
                positions[i] = this.originalPositions[i] * scale;
                positions[i + 1] = this.originalPositions[i + 1] * scale;
                positions[i + 2] = this.originalPositions[i + 2] * scale;
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        const scale = this.currentRadius / this.baseRadius;
        
        // Animar desvanecimiento del logo central y partículas de fondo
        const fadeStart = 0.1;
        let targetOpacity = 1;
        
        if (this.scrollProgress >= fadeStart) {
            const fadeEnd = 0.6;
            const fadeRange = fadeEnd - fadeStart;
            const fadeProgress = (this.scrollProgress - fadeStart) / fadeRange;
            targetOpacity = Math.max(0, 1 - fadeProgress);
        }
        
        // Logo central
        if (this.centerLogo) {
            this.centerLogo.material.opacity = THREE.MathUtils.lerp(
                this.centerLogo.material.opacity,
                targetOpacity,
                0.08
            );
        }
        
        // Partículas de fondo
        if (this.backgroundParticles) {
            this.backgroundParticles.material.opacity = THREE.MathUtils.lerp(
                this.backgroundParticles.material.opacity,
                targetOpacity * 0.4,
                0.08
            );
        }
        
        this.logoSprites.forEach(sprite => {
            const {angle, distance} = sprite.userData;
            sprite.position.x = Math.cos(angle) * distance * scale;
            sprite.position.y = Math.sin(angle) * distance * scale;
        });
    }
    
    updateSponsorVisibility() {
        const {scrollProgress, sponsorVisibilityStart, sponsorVisibilityEnd, sponsorFadeComplete} = this;
        let targetOpacity = 0;
        
        if (scrollProgress >= sponsorVisibilityStart && scrollProgress < sponsorVisibilityEnd) {
            targetOpacity = (scrollProgress - sponsorVisibilityStart) / (sponsorVisibilityEnd - sponsorVisibilityStart);
        } else if (scrollProgress >= sponsorVisibilityEnd && scrollProgress < sponsorFadeComplete) {
            targetOpacity = 1;
        } else if (scrollProgress >= sponsorFadeComplete) {
            targetOpacity = 1 - (scrollProgress - sponsorFadeComplete) / (1 - sponsorFadeComplete);
        }
        
        this.logoSprites.forEach(sprite => {
            sprite.material.opacity = THREE.MathUtils.lerp(sprite.material.opacity, targetOpacity, 0.05);
            const targetScale = sprite.userData.originalScale * (0.3 + targetOpacity * 0.7);
            sprite.scale.x = THREE.MathUtils.lerp(sprite.scale.x, targetScale, 0.08);
            sprite.scale.y = sprite.scale.x;
        });
    }
    
    onMouseMove(e) {
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.particles) {
            this.currentRotationY += this.rotationSpeed;
            
            // Rotación automática + interacción del mouse
            this.particles.rotation.y = this.currentRotationY + this.mouseX * 0.5;
            this.particles.rotation.x = Math.sin(this.currentRotationY * 0.5) * 0.3 + this.mouseY * 0.3;
            this.particles.rotation.z = Math.cos(this.currentRotationY * 0.3) * 0.15;
        }
        
        this.logoSprites.forEach(sprite => sprite.rotation.z = this.currentRotationY + this.mouseX * 0.5);
        
        // Rotar el logo del centro con la esfera
        if (this.centerLogo) {
            this.centerLogo.rotation.z = -(this.currentRotationY + this.mouseX * 0.5) * 0.5;
        }
        
        // Animar partículas de fondo: movimiento aleatorio + interacción con mouse
        if (this.backgroundParticles) {
            const positions = this.backgroundParticles.geometry.attributes.position.array;
            const velocities = this.backgroundParticles.userData.velocities;
            const mouseX = this.mouseX;
            const mouseY = this.mouseY;
            
            for (let i = 0; i < positions.length; i += 3) {
                const idx = i / 3;
                // Movimiento aleatorio
                positions[i] += velocities[idx * 3];
                positions[i + 1] += velocities[idx * 3 + 1];
                positions[i + 2] += velocities[idx * 3 + 2];
                
                // Interacción con el mouse (calcular posición 3D desde 2D del mouse)
                const mouseWorldX = mouseX * 500;
                const mouseWorldY = -mouseY * 500;
                
                const dx = positions[i] - mouseWorldX;
                const dy = positions[i + 1] - mouseWorldY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 200) {
                    const force = (200 - dist) / 200;
                    positions[i] += (dx / dist) * force * 2;
                    positions[i + 1] += (dy / dist) * force * 2;
                    velocities[idx * 3] += (dx / dist) * force * 0.02;
                    velocities[idx * 3 + 1] += (dy / dist) * force * 0.02;
                }
                
                // Mantener dentro de límites
                if (Math.abs(positions[i]) > 1000) velocities[idx * 3] *= -1;
                if (Math.abs(positions[i + 1]) > 1000) velocities[idx * 3 + 1] *= -1;
                if (Math.abs(positions[i + 2]) > 500) velocities[idx * 3 + 2] *= -1;
                
                // Aplicar fricción suave
                velocities[idx * 3] *= 0.99;
                velocities[idx * 3 + 1] *= 0.99;
                velocities[idx * 3 + 2] *= 0.99;
            }
            
            this.backgroundParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    hideSphere() {
        // Ocultar solo la esfera principal, mantener partículas de fondo
        if (this.particles) {
            this.particles.visible = false;
        }
        if (this.centerLogo) {
            this.centerLogo.visible = false;
        }
        if (this.logoSprites) {
            this.logoSprites.forEach(sprite => {
                sprite.visible = false;
            });
        }
    }
    
    showSphere() {
        // Mostrar la esfera principal
        if (this.particles) {
            this.particles.visible = true;
        }
        if (this.centerLogo) {
            this.centerLogo.visible = true;
        }
        if (this.logoSprites) {
            this.logoSprites.forEach(sprite => {
                sprite.visible = true;
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.morphoParticles = new MorphoParticles('morpho-canvas');
});
