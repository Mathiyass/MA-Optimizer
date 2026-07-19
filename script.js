document.addEventListener('DOMContentLoaded', () => {
    // 1. Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Fetch GitHub Stars dynamically
    const repo = 'Mathiyass/MA-Optimizer';
    const starsBadge = document.getElementById('github-stars');
    if (starsBadge) {
        fetch(`https://api.github.com/repos/${repo}`)
            .then(res => res.json())
            .then(data => {
                if (data.stargazers_count !== undefined) {
                    starsBadge.textContent = `${data.stargazers_count} ★`;
                }
            })
            .catch(() => {
                starsBadge.textContent = 'GitHub';
            });
    }

    // 3. CLI command copy feature
    const copyBtn = document.getElementById('copy-btn');
    const copyText = document.getElementById('cli-code-text');
    if (copyBtn && copyText) {
        copyBtn.addEventListener('click', () => {
            const codeText = copyText.textContent;
            navigator.clipboard.writeText(codeText).then(() => {
                const icon = copyBtn.querySelector('i') || copyBtn;
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓ Copied!';
                copyBtn.style.color = '#22c55e';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    // 4. Visual Tour Slideshow Slider
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    let currentSlide = 0;

    if (slides.length > 0) {
        // Create dots dynamically
        slides.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (idx === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(idx));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.slider-dot');

        const updateSlider = () => {
            slides.forEach((slide, idx) => {
                if (idx === currentSlide) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
            dots.forEach((dot, idx) => {
                if (idx === currentSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        };

        const goToSlide = (index) => {
            currentSlide = (index + slides.length) % slides.length;
            updateSlider();
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
        }

        // Auto play slider every 5 seconds
        let sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 6000);

        // Pause auto play on hover
        const sliderView = document.querySelector('.slider-view');
        if (sliderView) {
            sliderView.addEventListener('mouseenter', () => clearInterval(sliderInterval));
            sliderView.addEventListener('mouseleave', () => {
                sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 6000);
            });
        }
    }
});
