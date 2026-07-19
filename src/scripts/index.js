gsap.registerPlugin(ScrollTrigger);

// Беремо групу <g>, куди будемо генерувати маску
const maskBlinds = document.querySelector('#blinds1');
const BLIND_COUNT = 30; // Кількість ліній
const vbHeight = 100;   // Віртуальна висота SVG (задана в viewBox)
const vbWidth = 100;    // Віртуальна ширина SVG

const blinds = [];
const rects = [];

function createBlinds() {
    const h = vbHeight / BLIND_COUNT;
    let currentY = 0;

    for (let i = 0; i < BLIND_COUNT; i++) {
        // Зворотній розрахунок, щоб лінії накопичувалися знизу вгору
        const centerY = vbHeight - (currentY + h / 2);

        const rectTop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const rectBottom = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

        [rectTop, rectBottom].forEach(rect => {
            rect.setAttribute('x', '0');
            rect.setAttribute('width', vbWidth);
            rect.setAttribute('y', centerY);
            rect.setAttribute('height', '0');
            rect.setAttribute('fill', '#ffffff');

            maskBlinds.appendChild(rect);
            rects.push(rect);
        });

        blinds.push({ y: centerY, h: h / 2 });
        currentY += h;
    }
}

createBlinds();

// Анімація GSAP з прив'язкою до скролу
gsap.to(rects, {
    y: (i) => {
        const b = blinds[Math.floor(i / 2)];
        // Парні індекси йдуть вгору, непарні стоять на місці
        return i % 2 === 0 ? b.y - b.h : b.y;
    },
    height: (i) => {
        const b = blinds[Math.floor(i / 2)];
        // Розширення з мікро-додаванням 0.01, щоб не було просвітів
        return b.h + 0.01;
    },
    stagger: {
        each: 0.02,
        from: "start"
    },
    scrollTrigger: {
        trigger: ".stage",
        start: "top top", // Анімація починається, коли секція доходить до верху екрану
        end: "+=150%",    // Довжина скролу для завершення ефекту (1.5 висоти екрану)
        scrub: 2,         // Інерція скролу (плавне завершення рухів)
        pin: true         // Прикріплює секцію до екрану, поки йде перехід
    }
});