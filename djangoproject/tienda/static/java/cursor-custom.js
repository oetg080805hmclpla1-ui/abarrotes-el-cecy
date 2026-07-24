
// Custom Cursor
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let dotX = 0, dotY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    dotX += (mouseX - dotX) * 0.15;
    dotY += (mouseY - dotY) * 0.15;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';

    requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, .collection-card, .showcase-item, .cta-button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('expand'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('expand'));
});
