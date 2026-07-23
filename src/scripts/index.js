document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            console.log('Menu clicked - ready for implementation');
        });
    }

    const langCurrent = document.querySelector('.lang-current');
    const langOption = document.querySelector('.lang-option');

    if (langCurrent && langOption) {
        langCurrent.addEventListener('click', () => {
            langOption.classList.toggle('show');
        });

        langOption.addEventListener('click', () => {
            if (gsap.isTweening(langCurrent)) return;

            const tempText = langCurrent.textContent;
            const newText = langOption.textContent;

            langOption.classList.remove('show');

            gsap.to(langCurrent, {
                x: 20,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    langCurrent.textContent = newText;
                    langOption.textContent = tempText;

                    gsap.set(langCurrent, { x: -20 });
                    gsap.to(langCurrent, {
                        x: 0,
                        opacity: 1,
                        duration: 0.2,
                        ease: "power2.out"
                    });
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.lang-switcher')) {
                langOption.classList.remove('show');
            }
        });
    }

    const textElements = document.querySelectorAll('.text-block h1, .text-block p');

    textElements.forEach(el => {
        const text = el.textContent;
        el.innerHTML = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === ' ') {
                el.appendChild(document.createTextNode(' '));
                continue;
            }

            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'hover-char';

            const isLetter = char.toLowerCase() !== char.toUpperCase();
            const isUpper = isLetter && char === char.toUpperCase();

            span.addEventListener('mouseenter', () => {
                if (isUpper) {
                    span.textContent = char.toLowerCase();
                    span.style.transform = 'scale(0.75)';
                } else if (isLetter) {
                    span.textContent = char.toUpperCase();
                    span.style.transform = 'scale(1.25)';
                }
            });

            span.addEventListener('mouseleave', () => {
                span.textContent = char;
                span.style.transform = 'scale(1)';
            });

            el.appendChild(span);
        }
    });

    gsap.registerPlugin(ScrollTrigger, Observer);

    const curtain = document.querySelector('.white-curtain');
    const curtainLine = document.querySelector('.curtain-line');
    const imgPush = document.querySelector('.hero-image-push');
    const textBlock = document.querySelector('.text-block');
    const contactPanel = document.querySelector('.contact-panel');
    const paragraphs = textBlock.querySelectorAll('p');

    let dropTl;
    let contactTl;

    function buildTimelines() {
        if (dropTl) {
            dropTl.progress(0).kill();
            gsap.set(curtain, { clearProps: "all" });
            if (curtainLine) gsap.set(curtainLine, { clearProps: "all" });
            gsap.set(imgPush, { clearProps: "all" });
            gsap.set(textBlock, { clearProps: "all" });
            gsap.set(paragraphs, { clearProps: "all" });
        }

        dropTl = gsap.timeline({ paused: true });

        const distanceTotal = window.innerHeight;
        const duration = 1.2;
        const speed = distanceTotal / duration;

        let startTime = 0;

        if (curtainLine) {
            const lineDuration = 0.4;
            dropTl.to(curtainLine, { scaleX: 0, duration: lineDuration, ease: "none" }, 0);
            startTime = lineDuration;
        }

        dropTl.to(curtain, { height: distanceTotal, duration: duration, ease: "none" }, startTime);

        const heroRect = document.querySelector('.hero').getBoundingClientRect();
        const textRect = textBlock.getBoundingClientRect();
        const textTop = textRect.top - heroRect.top - 10;

        if (textTop >= 0 && textTop < distanceTotal) {
            const timeToHitText = textTop / speed;
            const pushDistText = distanceTotal - textTop;
            const pushDurText = duration - timeToHitText;

            dropTl.to(textBlock, {
                y: pushDistText,
                duration: pushDurText,
                ease: "none"
            }, startTime + timeToHitText);
        }

        const imgPushRect = imgPush.getBoundingClientRect();
        const scaleOverflowTop = imgPushRect.height * 0.275;
        const imgTop = imgPushRect.top - heroRect.top - scaleOverflowTop - 15;

        if (imgTop < distanceTotal) {
            const timeToHitImg = Math.max(0, imgTop / speed);
            const pushDistImg = distanceTotal - Math.max(0, imgTop);
            const pushDurImg = duration - timeToHitImg;

            dropTl.to(imgPush, {
                y: pushDistImg,
                duration: pushDurImg,
                ease: "none"
            }, startTime + timeToHitImg);
        }

        if (contactTl) {
            contactTl.progress(0).kill();
            gsap.set(contactPanel, { clearProps: "all" });
            gsap.set(imgPush, { clearProps: "scale, yPercent, xPercent, transformOrigin" });
        }

        contactTl = gsap.timeline({ paused: true });

        contactTl.to(contactPanel, {
            yPercent: -100,
            duration: 0.8,
            ease: "power3.inOut"
        }, 0);

        contactTl.to(textBlock, {
            y: -120,
            duration: 0.8,
            ease: "power3.inOut"
        }, 0);

        contactTl.to(paragraphs, {
            maxWidth: "800px",
            duration: 0.8,
            ease: "power3.inOut"
        }, 0);

        contactTl.to(imgPush, {
            scale: 0.65,
            yPercent: -20,
            xPercent: 0,
            transformOrigin: "right center",
            duration: 0.8,
            ease: "power3.inOut"
        }, 0);
    }

    setTimeout(buildTimelines, 50);

    Observer.create({
        target: window,
        type: "wheel,touch",
        onChangeY: (self) => {
            if (self.deltaY > 0) {
                if (contactTl.progress() > 0) {
                    contactTl.reverse();
                } else {
                    dropTl.play();
                }
            } else if (self.deltaY < 0) {
                if (dropTl.progress() > 0) {
                    dropTl.reverse();
                } else {
                    contactTl.play();
                }
            }
        }
    });

    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            const dropProgress = dropTl.progress();
            const contactProgress = contactTl.progress();

            buildTimelines();

            dropTl.progress(dropProgress);
            contactTl.progress(contactProgress);
        }, 200);
    });
});