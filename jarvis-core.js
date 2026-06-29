/* ==========================================================================
   MAX ASSISTANT - Three.js Holographic AI Core Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
});

function initThreeJS() {
    const container = document.getElementById('threejs-canvas-container');
    if (!container) return;

    // Get current bounding container sizes
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene creation
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030614, 0.05);

    // Camera configuration
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 12;

    // WebGL Renderer configuration
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Master Group containing all holographic items
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // ==========================================================================
    // 3D Objects: Central Brain Core
    // ==========================================================================
    
    // Inner Sphere (Wireframe)
    const sphereGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x00FFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const innerCore = new THREE.Mesh(sphereGeo, sphereMat);
    hologramGroup.add(innerCore);

    // Core Solid Glow (Smaller scale, double opacity)
    const glowGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00BFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(glowGeo, glowMat);
    hologramGroup.add(innerGlow);

    // ==========================================================================
    // 3D Objects: Concentric Telemetry Rings
    // ==========================================================================
    
    // Ring 1 (Torus - Medium diameter)
    const ring1Geo = new THREE.TorusGeometry(2.5, 0.04, 8, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
        color: 0x00BFFF,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    hologramGroup.add(ring1);

    // Ring 2 (Torus - Larger diameter, tilted)
    const ring2Geo = new THREE.TorusGeometry(3.3, 0.02, 6, 80);
    const ring2Mat = new THREE.MeshBasicMaterial({
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 1.7;
    ring2.rotation.y = Math.PI / 6;
    hologramGroup.add(ring2);

    // Ring 3 (Outer dotted tracking ring)
    const ring3Geo = new THREE.RingGeometry(3.8, 4.0, 64);
    const ring3Mat = new THREE.MeshBasicMaterial({
        color: 0x00BFFF,
        side: THREE.DoubleSide,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 2.1;
    hologramGroup.add(ring3);

    // ==========================================================================
    // 3D Objects: Orbiting Tech Particles
    // ==========================================================================
    
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
        // Distribute particles in a spherical shell around the core
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const radius = 2.0 + Math.random() * 2.2;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        particleSpeeds.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.015,
            z: (Math.random() - 0.5) * 0.015,
            amplitude: 0.1 + Math.random() * 0.15,
            freq: 0.5 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2
        });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Custom Canvas Texture for circular particles (since standard square points look flat)
    const createCircleTexture = () => {
        const cCanvas = document.createElement('canvas');
        cCanvas.width = 16;
        cCanvas.height = 16;
        const ctx = cCanvas.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(0, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(0, 191, 255, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        return new THREE.CanvasTexture(cCanvas);
    };

    const particleMat = new THREE.PointsMaterial({
        size: 0.18,
        map: createCircleTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    hologramGroup.add(particles);

    // ==========================================================================
    // Interaction: Mouse Move Parallax Tilt
    // ==========================================================================
    
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    window.addEventListener('mousemove', (e) => {
        // Normalize mouse coordinates to [-1, 1]
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

        // Map mouse coordinates to slight tilt target
        targetRotationY = mouseX * 0.35;
        targetRotationX = -mouseY * 0.35;
    });

    // Handle Mic / Core click triggers
    let isPulsing = false;
    let pulseScale = 1.0;

    const triggerCorePulse = () => {
        isPulsing = true;
        // Temporary speedup in log feed
        if (window.triggerSpeechVisuals) {
            window.triggerSpeechVisuals();
        }
    };

    container.addEventListener('click', triggerCorePulse);

    // Expose pulse trigger to global namespace for app.js linking
    window.triggerThreePulse = triggerCorePulse;

    // ==========================================================================
    // Render loop
    // ==========================================================================
    
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // 1. Core Rotating animations (different speeds for JARVIS look)
        innerCore.rotation.y = elapsedTime * 0.25;
        innerCore.rotation.x = elapsedTime * 0.15;

        innerGlow.rotation.y = -elapsedTime * 0.45;
        innerGlow.rotation.z = elapsedTime * 0.2;

        ring1.rotation.z = elapsedTime * 0.6;
        ring2.rotation.z = -elapsedTime * 0.4;
        ring3.rotation.z = elapsedTime * 0.15;

        // 2. Animate floating star particles
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const index = i * 3;
            const speed = particleSpeeds[i];
            
            // Add vertical float oscillations based on sine waves
            positions[index + 1] += Math.sin(elapsedTime * speed.freq + speed.phase) * 0.002;
            
            // Subtle rotation of positions
            const x = positions[index];
            const z = positions[index + 2];
            const angle = 0.001 * speed.freq;
            positions[index] = x * Math.cos(angle) - z * Math.sin(angle);
            positions[index + 2] = x * Math.sin(angle) + z * Math.cos(angle);
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // 3. Parallax Interpolation (Lerping mouse move tilt)
        currentRotationX += (targetRotationX - currentRotationX) * 0.08;
        currentRotationY += (targetRotationY - currentRotationY) * 0.08;

        hologramGroup.rotation.x = currentRotationX;
        hologramGroup.rotation.y = currentRotationY;

        // 4. Voice Core Pulse Animation (temporary sizing expansion on activation)
        if (isPulsing) {
            pulseScale += (1.45 - pulseScale) * 0.12;
            sphereMat.color.setHex(0x00FFFF);
            sphereMat.opacity = 0.95;
            if (pulseScale >= 1.4) {
                isPulsing = false;
            }
        } else {
            pulseScale += (1.0 - pulseScale) * 0.08;
            sphereMat.opacity = 0.6 + Math.sin(elapsedTime * 3) * 0.1; // Ambient glow oscillation
        }

        innerCore.scale.set(pulseScale, pulseScale, pulseScale);
        innerGlow.scale.set(pulseScale * 0.9, pulseScale * 0.9, pulseScale * 0.9);

        // Render scene
        renderer.render(scene, camera);
    };

    animate();

    // ==========================================================================
    // Responsiveness resize bindings
    // ==========================================================================
    
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight);
    });
}
