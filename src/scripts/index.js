const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

gsap.registerPlugin(ScrollTrigger);

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

const vbHeight = 100;
const BLIND_COUNT = 30;
const blindsGroup = document.getElementById('blinds-group');
const blinds = [];

function createBlinds() {
    const h = vbHeight / BLIND_COUNT;

    for (let i = 0; i < BLIND_COUNT; i++) {
        const currentY = i * h;
        const centerY = vbHeight - (currentY + h / 2);

        const rectTop = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const rectBottom = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        gsap.set([rectTop, rectBottom], {
            attr: {
                x: 0,
                y: centerY,
                width: 100,
                height: 0,
                fill: "white"
            }
        });

        blindsGroup.appendChild(rectTop);
        blindsGroup.appendChild(rectBottom);

        blinds.push({
            rectTop,
            rectBottom,
            y: centerY,
            h: h / 2
        });
    }
}

function initAnimation() {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".stage",
            start: "top top",
            end: "+=150%",
            /* Increased scrub value to create a speed-dependent trailing motion */
            scrub: 2.5,
            pin: true,
        }
    });

    const allRects = [];
    blinds.forEach(b => {
        allRects.push(b.rectTop, b.rectBottom);
    });

    tl.to(allRects, {
        attr: {
            y: (i) => {
                const b = blinds[Math.floor(i / 2)];
                return i % 2 === 0 ? b.y - b.h : b.y;
            },
            height: (i) => {
                const b = blinds[Math.floor(i / 2)];
                /* Fixes subpixel gap artifacts between SVG shapes during animation */
                return b.h + 0.01;
            }
        },
        stagger: {
            each: 0.02,
            from: "start"
        },
        ease: "none"
    });
}

window.addEventListener("load", () => {
    createBlinds();
    initAnimation();
    ScrollTrigger.refresh();
});