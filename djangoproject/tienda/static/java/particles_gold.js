const canvas = document.getElementById("goldParticles");
const particles3d = document.getElementById('particles3d');
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const bigParticles = [];
const smallParticles = [];
const shapes = [];



// 3D Particles

for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle-3d');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particles3d.appendChild(particle);
}

// === Figuras geométricas doradas ===
const shapeTypes = ["triangle", "square", "hexagon"];
for (let i = 0; i < 8; i++) {
    shapes.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        size: Math.random() * 60 + 30,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        rotation: Math.random() * 360,
        speed: (Math.random() - 0.5) * 0.02,
        alpha: Math.random() * 0.15 + 0.2,
    });
}

function drawShape(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);




    ctx.strokeStyle = `rgba(255, 215, 0, ${s.alpha})`;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    switch (s.type) {
        case "triangle":
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * (2 * Math.PI);
                const x = Math.cos(angle) * s.size;
                const y = Math.sin(angle) * s.size;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            break;

        case "square":
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * (2 * Math.PI) + Math.PI / 4;
                const x = Math.cos(angle) * s.size;
                const y = Math.sin(angle) * s.size;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            break;

        case "hexagon":
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * (2 * Math.PI);
                const x = Math.cos(angle) * s.size;
                const y = Math.sin(angle) * s.size;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            break;
    }

    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo oscuro degradado
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(1, "#151515");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === Partículas grandes ===
    bigParticles.forEach(p => {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255, 215, 0, ${p.alpha})`);
        g.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.y > canvas.height + p.r) p.y = -p.r;
    });

    // === Figuras geométricas ===
    shapes.forEach(s => {
        s.rotation += s.speed;
        drawShape(s);
    });

    // === Brasas pequeñas ===
    smallParticles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, ${180 + Math.random() * 60}, 0, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    requestAnimationFrame(draw);
}

draw();

window.addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
});


