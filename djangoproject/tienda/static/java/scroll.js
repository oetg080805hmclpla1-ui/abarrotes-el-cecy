//brillo en scroll

document.addEventListener("DOMContentLoaded", function () {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-fade');

    function animateOnScroll() {
        const windowHeight = window.innerHeight;
        reveals.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementBottom = el.getBoundingClientRect().bottom;

            if (elementTop < windowHeight && elementBottom > 0) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
});