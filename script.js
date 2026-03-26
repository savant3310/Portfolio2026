// ==================== INTERACTIVE GRID ====================
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const CELL = 40;
let mx = -1000, my = -1000;
let rafPending = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrid();
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(canvas.width / CELL) + 1;
    const rows = Math.ceil(canvas.height / CELL) + 1;
    const RADIUS = 180;

    // Only check cells near cursor
    const c0 = Math.max(0, Math.floor((mx - RADIUS) / CELL));
    const c1 = Math.min(cols, Math.ceil((mx + RADIUS) / CELL));
    const r0 = Math.max(0, Math.floor((my - RADIUS) / CELL));
    const r1 = Math.min(rows, Math.ceil((my + RADIUS) / CELL));

    const isDark = document.body.classList.contains('visual-mode');
    const gridLine  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const fillColor = isDark ? '0, 180, 255'            : '20, 0, 255';

    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) {
        ctx.moveTo(c * CELL + 0.5, 0);
        ctx.lineTo(c * CELL + 0.5, canvas.height);
    }
    for (let r = 0; r <= rows; r++) {
        ctx.moveTo(0, r * CELL + 0.5);
        ctx.lineTo(canvas.width, r * CELL + 0.5);
    }
    ctx.stroke();

    // Draw highlighted cells near cursor
    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            const cx = c * CELL + CELL / 2;
            const cy = r * CELL + CELL / 2;
            const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
            if (dist < RADIUS) {
                const t = 1 - dist / RADIUS;
                const intensity = t * t * t;
                ctx.fillStyle = `rgba(${fillColor}, ${intensity * 0.28})`;
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
                ctx.strokeStyle = `rgba(${fillColor}, ${intensity * 0.45})`;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(c * CELL + 0.5, r * CELL + 0.5, CELL - 1, CELL - 1);
            }
        }
    }
}

document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            drawGrid();
        });
    }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// ==================== TOGGLE (SWAP CIRCLES + VISUAL MODE) ====================
const toggleArea = document.getElementById('toggleArea');
const stickyNote = document.getElementById('stickyNote');
const circlesWrapper = document.getElementById('circlesWrapper');

function doToggle() {
    toggleArea.classList.toggle('on');
    circlesWrapper.classList.toggle('swapped');
    document.body.classList.toggle('visual-mode');

    // Reset all cards to their initial positions on switch
    document.querySelectorAll('.project-card').forEach(card => {
        card.style.top  = card.dataset.initTop  + 'px';
        card.style.left = card.dataset.initLeft + 'px';
    });

    drawGrid();
}

toggleArea.addEventListener('click', doToggle);
stickyNote.addEventListener('click', doToggle);


// ==================== DRAG PROJECT CARDS (all cards) ====================
const pegboard = document.getElementById('pegboard');
let dragging = false, activeCard = null, ox = 0, oy = 0;
let dragStartX = 0, dragStartY = 0, hasMoved = false;
const DRAG_THRESHOLD = 6;

function startDrag(card, clientX, clientY) {
    dragging = true;
    activeCard = card;
    hasMoved = false;
    dragStartX = clientX;
    dragStartY = clientY;
    const cr = card.getBoundingClientRect();
    ox = clientX - cr.left;
    oy = clientY - cr.top;
    card.classList.add('dragging');
    card.style.zIndex = 10;
}

function moveDrag(clientX, clientY) {
    if (!dragging || !activeCard) return;
    if (!hasMoved) {
        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        hasMoved = true;
    }
    const br = pegboard.getBoundingClientRect();
    let x = clientX - br.left - ox;
    let y = clientY - br.top - oy;
    x = Math.max(0, Math.min(x, br.width  - activeCard.offsetWidth));
    y = Math.max(0, Math.min(y, br.height - activeCard.offsetHeight));
    activeCard.style.left = x + 'px';
    activeCard.style.top  = y + 'px';
}

function endDrag() {
    if (!activeCard) return;
    activeCard.classList.remove('dragging');
    activeCard.style.zIndex = '';
    // Navigate only if the mouse barely moved (it was a click, not a drag)
    if (!hasMoved && activeCard.dataset.href) {
        window.location.href = activeCard.dataset.href;
    }
    dragging = false;
    activeCard = null;
}

// Mouse
pegboard.addEventListener('mousedown', (e) => {
    const card = e.target.closest('.project-card, .peg-photo');
    if (!card || card.style.pointerEvents === 'none' || card.classList.contains('card-hidden')) return;
    startDrag(card, e.clientX, e.clientY);
    e.preventDefault();
});
document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
document.addEventListener('mouseup', endDrag);

// Touch
pegboard.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.project-card, .peg-photo');
    if (!card) return;
    startDrag(card, e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
document.addEventListener('touchmove', (e) => {
    if (!dragging) return;          // don't block scroll when not dragging a card
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    if (hasMoved) e.preventDefault(); // only lock scroll once actually dragging
}, { passive: false });
document.addEventListener('touchend', endDrag);


// ==================== RESTORE MODE FROM URL ====================
if (new URLSearchParams(window.location.search).get('mode') === 'visual') {
    // Apply instantly — no animation
    document.body.classList.add('no-transition');
    document.body.classList.add('visual-mode');
    toggleArea.classList.add('on');
    circlesWrapper.classList.add('swapped');
    document.querySelectorAll('.project-card').forEach(card => {
        card.style.top  = card.dataset.initTop  + 'px';
        card.style.left = card.dataset.initLeft + 'px';
    });
    drawGrid();
    requestAnimationFrame(() => document.body.classList.remove('no-transition'));
}
