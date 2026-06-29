/* ==========================================================================
   MAX ASSISTANT - Holographic Interface & UI Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Components
    initBackgroundGrid();
    initVoiceWaveform();
    initDashboardMeters();
    initLatencyGraph();
    initTerminalFeed();
    setupTiltCards();
    setupNavbarScroll();
    setupMobileMenu();
    setupMockDownload();
});

// ==========================================================================
// 1. Holographic Background Grid & Particle Canvas
// ==========================================================================
function initBackgroundGrid() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle array
    const particles = [];
    const particleCount = 60;
    
    // Grid settings
    const gridSize = 60;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.glow = 5 + Math.random() * 10;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce on boundaries
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(0, 191, 255, 0.45)';
            ctx.shadowBlur = this.glow;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow glow
        }
    }

    // Populate particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 191, 255, 0.025)';
        ctx.lineWidth = 1;

        // Draw vertical grid lines
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal grid lines
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    // Main background render loop
    function animateBackground() {
        ctx.clearRect(0, 0, width, height);

        // Slow fade of grid background
        drawGrid();

        // Update and draw floating tech particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animateBackground);
    }

    animateBackground();

    // Handle screen resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
}

// ==========================================================================
// 2. Audio Waveform (Voice Wave Visualizer)
// ==========================================================================
function initVoiceWaveform() {
    const canvas = document.getElementById('voice-wave-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = canvas.parentElement.clientHeight);

    let animationFrameId;
    let waveState = 'idle'; // 'idle' or 'listening'
    let stateTime = 0;

    // Overlapping wave layers
    const waves = [
        { amplitude: 6, frequency: 0.04, speed: 0.12, color: 'rgba(0, 255, 255, 0.8)' },
        { amplitude: 12, frequency: 0.02, speed: -0.08, color: 'rgba(0, 191, 255, 0.5)' },
        { amplitude: 4, frequency: 0.06, speed: 0.18, color: 'rgba(138, 43, 226, 0.4)' }
    ];

    function drawWave() {
        ctx.clearRect(0, 0, width, height);
        
        stateTime += 0.05;

        // Transition adjustments for active speaking
        if (waveState === 'listening') {
            waves[0].amplitude = 18 + Math.sin(stateTime * 2) * 5;
            waves[0].frequency = 0.08 + Math.cos(stateTime) * 0.02;
            waves[1].amplitude = 26 + Math.cos(stateTime * 1.5) * 8;
            waves[1].frequency = 0.05;
            waves[2].amplitude = 10;
        } else {
            // Idle stats
            waves[0].amplitude = 4 + Math.sin(stateTime * 0.5) * 1.5;
            waves[0].frequency = 0.03;
            waves[1].amplitude = 6;
            waves[1].frequency = 0.015;
            waves[2].amplitude = 2;
        }

        waves.forEach(w => {
            ctx.strokeStyle = w.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
                // Formula: y = Sin(x * frequency + offset) * amplitude + CenterY
                const y = Math.sin(x * w.frequency + stateTime * w.speed * 10) * w.amplitude + height / 2;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        });

        animationFrameId = requestAnimationFrame(drawWave);
    }

    drawWave();

    // Trigger listening sequence on mic click
    const micBtn = document.getElementById('mic-trigger-btn');
    const statusText = document.querySelector('.telemetry-status');

    function triggerSpeechVisuals() {
        if (waveState === 'listening') return; // already running
        
        waveState = 'listening';
        if (statusText) {
            statusText.innerText = 'ACTIVE LISTENING';
            statusText.style.color = '#00FF66';
            statusText.classList.remove('alert-text');
        }

        // Add mock voice interaction log lines
        const interactionScript = [
            { sys: 'USER', text: 'MAX, schedule a diagnostics scan and message Stark.' },
            { sys: 'MAX', text: 'Wake word matched. Parsing voice commands...' },
            { sys: 'MAX', text: 'Command 1: "Run Diagnostics Scan" -> Initiating Dashboard meters.' },
            { sys: 'MAX', text: 'Command 2: "Compose Message" -> WhatsApp API matching contacts.' },
            { sys: 'MAX', text: 'Accessibility automation: navigating message field... SUCCESS.' }
        ];

        let logDelay = 0;
        interactionScript.forEach(log => {
            setTimeout(() => {
                appendLog(log.sys, log.text, log.sys === 'USER');
            }, logDelay);
            logDelay += 800;
        });

        // Speed up CPU & RAM simulation on speak
        window.isPeakUsage = true;

        // Reset to idle after 4.5 seconds
        setTimeout(() => {
            waveState = 'idle';
            window.isPeakUsage = false;
            if (statusText) {
                statusText.innerText = 'LISTENING';
                statusText.style.color = '#FF4500';
                statusText.classList.add('alert-text');
            }
        }, 4500);
    }

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            triggerSpeechVisuals();
            if (window.triggerThreePulse) {
                window.triggerThreePulse(); // pulse the 3D core
            }
        });
    }

    // Bind to window to allow jarvis-core.js click handlers to link in
    window.triggerSpeechVisuals = triggerSpeechVisuals;
}

// ==========================================================================
// 3. Live System Dashboard (CPU, RAM, Status dials)
// ==========================================================================
function initDashboardMeters() {
    const cpuRing = document.getElementById('cpu-ring');
    const ramRing = document.getElementById('ram-ring');
    const cpuPctText = document.getElementById('cpu-pct');
    const ramPctText = document.getElementById('ram-pct');

    const perimeter = 314.16; // 2 * pi * r (r=50)

    window.isPeakUsage = false;

    function updateProgress(circleElement, textElement, percent) {
        if (!circleElement || !textElement) return;
        const offset = perimeter * (1 - percent / 100);
        circleElement.style.strokeDashoffset = offset;
        textElement.innerText = percent;
    }

    setInterval(() => {
        let cpuTarget = 0;
        let ramTarget = 0;

        if (window.isPeakUsage) {
            // Processing voice commands uses high resources
            cpuTarget = Math.floor(Math.random() * 25) + 65; // 65% - 90%
            ramTarget = Math.floor(Math.random() * 8) + 75;  // 75% - 83%
        } else {
            // Idle background loop usages
            cpuTarget = Math.floor(Math.random() * 15) + 12; // 12% - 27%
            ramTarget = Math.floor(Math.random() * 4) + 48;  // 48% - 52%
        }

        updateProgress(cpuRing, cpuPctText, cpuTarget);
        updateProgress(ramRing, ramPctText, ramTarget);
    }, 1000);
}

// ==========================================================================
// 4. Real-time Graph (Latency chart plotter)
// ==========================================================================
function initLatencyGraph() {
    const canvas = document.getElementById('realtime-graph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = canvas.parentElement.clientHeight);

    const dataPoints = Array(20).fill(38); // fill baseline 38ms latency

    function drawGraph() {
        ctx.clearRect(0, 0, width, height);

        // Add grid lines inside chart
        ctx.strokeStyle = 'rgba(0, 191, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < height; i += 25) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        // Draw graph path
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const step = width / (dataPoints.length - 1);
        for (let i = 0; i < dataPoints.length; i++) {
            // Map 20ms - 80ms latency onto graph height boundaries
            const mappedY = height - ((dataPoints[i] - 20) / (80 - 20)) * height;
            const x = i * step;

            if (i === 0) {
                ctx.moveTo(x, mappedY);
            } else {
                ctx.lineTo(x, mappedY);
            }
        }
        ctx.stroke();

        // Draw gradient glow under graph line
        ctx.fillStyle = 'rgba(0, 255, 255, 0.06)';
        ctx.lineTo((dataPoints.length - 1) * step, height);
        ctx.lineTo(0, height);
        ctx.fill();
    }

    setInterval(() => {
        // Shift metrics
        dataPoints.shift();
        
        let newLatency = 35 + Math.floor(Math.random() * 8); // 35ms - 43ms
        
        if (window.isPeakUsage) {
            // Simulated network packet roundtrips slightly spike values
            newLatency += Math.floor(Math.random() * 22) + 10;
        }

        dataPoints.push(newLatency);

        // Update latency text in parameter list
        const paramLatency = document.getElementById('mock-latency');
        if (paramLatency) {
            paramLatency.innerText = `${newLatency} ms`;
        }

        drawGraph();
    }, 400);

    drawGraph();
}

// ==========================================================================
// 5. System Logs Feed (Interactive Terminal)
// ==========================================================================
const logPool = [
    'Foreground Service status: STABLE runtime loops.',
    'Wake word listener listening: Offline match triggers active.',
    'CPU heat index: 42C. Fan cooling: NOT REQUIRED.',
    'Android Overlay windows drawn successfully above drawer launcher.',
    'Accessibility service status: ACCESS_GRANTED. Nodes scanned: 122.',
    'WhatsApp contact map loaded. Cached matches: 45.',
    'Spotify playback daemon: CONNECTED. Current focus: MEDIA.',
    'Groq API ping test: latency: 120ms. Status: REACHABLE.',
    'Android package manager indexing completed: 78 apps cached.',
    'Local SQLite query completed: wake database initialized.',
    'Camera API hardware status: READY. Back flash checked.',
    'AudioFocusManager: System focus verified.'
];

function initTerminalFeed() {
    const container = document.getElementById('terminal-logs');
    if (!container) return;

    // Boot lines
    appendLog('SYS', 'MAX OS boot sequence active...', false);
    setTimeout(() => appendLog('SYS', 'Loading background wake daemons... OK', false), 400);
    setTimeout(() => appendLog('SYS', 'Connecting speech recognizers... OK', false), 800);
    setTimeout(() => appendLog('SYS', 'Foreground accessibility links... OK', false), 1200);

    // Continuous random log injector
    setInterval(() => {
        if (window.isPeakUsage) return; // let user speech commands dominate logs
        const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
        appendLog('DIAG', randomLog, false);
    }, 3800);
}

function appendLog(header, text, isUser = false) {
    const container = document.getElementById('terminal-logs');
    if (!container) return;

    const logDiv = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let colorClass = '';
    if (isUser) colorClass = 'log-user';
    else if (header === 'SYS') colorClass = 'green-text';
    else if (header === 'DIAG') colorClass = 'param-label';

    logDiv.innerHTML = `<span class="log-time">[${time}]</span><span class="${colorClass}">${header}: ${text}</span>`;
    container.appendChild(logDiv);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Maintain max 14 items inside DOM
    while (container.children.length > 14) {
        container.removeChild(container.firstChild);
    }
}

// ==========================================================================
// 6. Interactive 3D Tilt Cards Effect
// ==========================================================================
function setupTiltCards() {
    const cards = document.querySelectorAll('[data-tilt]');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x coordinate within element
            const y = e.clientY - rect.top;  // y coordinate within element

            const width = rect.width;
            const height = rect.height;

            const rotateX = ((y - height / 2) / (height / 2)) * -12; // tilt max 12deg
            const rotateY = ((x - width / 2) / (width / 2)) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}

// ==========================================================================
// 7. Navbar Scroll State & Floating Indicator
// ==========================================================================
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ==========================================================================
// 8. Mobile Navigation Burger Menu
// ==========================================================================
function setupMobileMenu() {
    const burger = document.getElementById('mobile-menu-toggle');
    const links = document.querySelector('.nav-links');

    if (!burger || !links) return;

    burger.addEventListener('click', () => {
        links.classList.toggle('nav-active');
        burger.classList.toggle('active-menu');
        
        // Animated close representation
        const spans = burger.querySelectorAll('span');
        if (burger.classList.contains('active-menu')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close menu when link is clicked
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            links.classList.remove('nav-active');
            burger.classList.remove('active-menu');
            burger.querySelectorAll('span').forEach(s => s.style.transform = 'none');
            burger.querySelectorAll('span')[1].style.opacity = '1';
        });
    });
}

// ==========================================================================
// 9. APK Download Neon Button Glitch Trigger
// ==========================================================================
function setupMockDownload() {

    const dlBtn = document.getElementById('download-apk-btn');

    if (!dlBtn) return;

    dlBtn.addEventListener('click', () => {

        // Button click animation
        dlBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            dlBtn.style.transform = 'scale(1)';
        }, 150);

        // JARVIS logs
        appendLog('MAX', 'VOICE COMMAND RECEIVED', false);

        setTimeout(() => {
            appendLog(
                'SYS',
                'INITIALIZING APK PACKAGING SYSTEM...',
                false
            );
        }, 500);

        setTimeout(() => {
            appendLog(
                'SYS',
                'VERIFYING BUILD SIGNATURE...',
                false
            );
        }, 1000);

        setTimeout(() => {
            appendLog(
                'SYS',
                'MAX_ASSISTANT_V1.0 VERIFIED',
                false
            );
        }, 1500);

        setTimeout(() => {
            appendLog(
                'SYS',
                'ESTABLISHING DOWNLOAD CHANNEL...',
                false
            );
        }, 2000);

        setTimeout(() => {
            appendLog(
                'MAX',
                'DOWNLOAD STARTED SUCCESSFULLY',
                false
            );

            // 👇 IKKADA NEE APK LINK PETTU
            window.open(
                'https://github.com/ASHOK-12700/max-assistant/releases/tag/v1.0?',
                '_blank'
            );

        }, 3000);

    });
}
