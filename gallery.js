// ==================== SCROLL GALLERY ====================
function initScrollGallery() {
    const sections = document.querySelectorAll('.frame-section');
    if (!sections.length) return;

    function update() {
        const sy = window.scrollY;

        sections.forEach(section => {
            const sticky = section.querySelector('.frame-sticky');
            if (!sticky) return;

            const top    = section.offsetTop;
            const height = section.offsetHeight;
            const progress = (sy - top) / height; // 0 → 1 as you scroll through

            let scale, radius;

            if (progress <= 0) {
                scale  = 0.6;
                radius = 24;
            } else if (progress < 0.25) {
                // Entering: grow to fullscreen
                const t = progress / 0.25;
                scale  = 0.6 + 0.4 * ease(t);
                radius = 24 * (1 - ease(t));
            } else if (progress < 0.72) {
                // Holding fullscreen
                scale  = 1;
                radius = 0;
            } else if (progress < 1) {
                // Exiting: shrink back
                const t = (progress - 0.72) / 0.28;
                scale  = 1 - 0.4 * ease(t);
                radius = 24 * ease(t);
            } else {
                scale  = 0.6;
                radius = 24;
            }

            sticky.style.transform    = `scale(${scale.toFixed(4)})`;
            sticky.style.borderRadius = `${radius.toFixed(1)}px`;
        });
    }

    function ease(t) {
        // cubic ease in-out
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

document.addEventListener('DOMContentLoaded', initScrollGallery);
