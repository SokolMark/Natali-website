document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.carousel-item');
    const totalItems = items.length;
    const container = document.querySelector('.carousel-container');
    const backdrop = document.querySelector('.backdrop');

    let rotation = 0;
    let velocity = 0;
    let isAttached = false;
    let lastAngle = 0;
    let wobbleAmount = 0;
    let detachTimeout;

    let isViewing = false;
    let isTransitioning = false;
    let activeItem = null;

    // Intro Animation State
    let introComplete = false;
    let introStartTime = performance.now();
    container.style.pointerEvents = 'none'; // Lock interaction during intro

    let centerX, centerY;
    let radiusX, radiusY;

    function updateDimensions() {
        const rect = container.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        radiusX = window.innerWidth * 0.4;
        radiusY = window.innerHeight * 0.25;
    }

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    items.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            if (isViewing || isTransitioning || !introComplete) return;

            clearTimeout(detachTimeout);
            if (!isAttached) {
                isAttached = true;
                velocity = 0;
                wobbleAmount = 0;
                container.classList.add('is-attached');
            }
            lastAngle = Math.atan2((e.clientY - centerY) / radiusY, (e.clientX - centerX) / radiusX);
        });

        item.addEventListener('mouseleave', () => {
            if (isViewing || isTransitioning || !introComplete) return;

            detachTimeout = setTimeout(() => {
                isAttached = false;
                container.classList.remove('is-attached');
                wobbleAmount = Math.min(Math.abs(velocity * 300), 15);
            }, 30);
        });

        item.addEventListener('click', () => {
            if (isTransitioning || !introComplete) return;

            if (!isViewing) {
                isViewing = true;
                isTransitioning = true;
                activeItem = item;

                isAttached = false;
                container.classList.remove('is-attached');
                velocity = 0;
                wobbleAmount = 0;

                const targetX = (window.innerWidth / 2) - centerX;
                const targetY = (window.innerHeight / 2) - centerY;

                const scaleY = (window.innerHeight * 0.75) / item.offsetHeight;
                const scaleX = (window.innerWidth * 0.75) / item.offsetWidth;
                const finalScale = Math.min(scaleX, scaleY);

                item.classList.add('is-transitioning');
                item.classList.add('is-expanded');
                backdrop.classList.add('is-active');

                item.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(${finalScale})`;
                item.style.filter = `blur(0px) brightness(1)`;
                item.style.opacity = 1;

                setTimeout(() => {
                    isTransitioning = false;
                }, 600);
            } else if (activeItem === item) {
                closeItem();
            }
        });
    });

    backdrop.addEventListener('click', closeItem);

    function closeItem() {
        if (isTransitioning || !isViewing || !activeItem) return;

        isTransitioning = true;
        backdrop.classList.remove('is-active');
        activeItem.classList.remove('is-expanded');

        const index = Array.from(items).indexOf(activeItem);
        const angle = (index / totalItems) * Math.PI * 2 + rotation;

        const z = Math.cos(angle);
        const scale = (z + 2) / 3;

        const x = Math.sin(angle) * radiusX;
        const y = z * radiusY;

        const blurAmount = Math.max(0, (1 - z) * 8);
        const brightness = 0.2 + ((z + 1) / 2) * 0.8;

        let depthOpacity = 1;
        if (z < -0.6) {
            depthOpacity = Math.max(0, 1 - ((-0.6 - z) / 0.4));
        }

        activeItem.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        activeItem.style.filter = `blur(${blurAmount}px) brightness(${brightness})`;
        activeItem.style.opacity = depthOpacity;

        setTimeout(() => {
            if (activeItem) {
                activeItem.classList.remove('is-transitioning');
                activeItem.style.zIndex = Math.round((z + 1) * 100);
            }
            activeItem = null;
            isViewing = false;
            isTransitioning = false;
        }, 600);
    }

    window.addEventListener('mousemove', (e) => {
        if (isAttached && !isViewing && !isTransitioning && introComplete) {
            const currentAngle = Math.atan2((e.clientY - centerY) / radiusY, (e.clientX - centerX) / radiusX);
            let delta = currentAngle - lastAngle;

            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;

            let newVelocity = -delta * 0.7;

            const MAX_VELOCITY = 0.12;
            velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVelocity));

            rotation += velocity;
            lastAngle = currentAngle;
        }
    });

    function animate() {
        const now = performance.now();
        let allIntroDone = true;

        if (!isViewing && !isTransitioning) {
            if (!isAttached && introComplete) {
                rotation += velocity;
                velocity *= 0.985;

                if (wobbleAmount > 0.1) {
                    wobbleAmount *= 0.95;
                } else {
                    wobbleAmount = 0;
                }
            }

            const wobbleX = wobbleAmount > 0 ? Math.sin(now * 0.05) * wobbleAmount : 0;
            const wobbleY = wobbleAmount > 0 ? Math.cos(now * 0.04) * wobbleAmount : 0;

            items.forEach((item, index) => {
                let easeP = 1;
                let introOpacity = 1;

                if (!introComplete) {
                    /* BUGFIX: Clamped animation progress to a maximum of 1.
                       Previously, when progress exceeded 1, the math function caused items to fly erratically. */
                    let progress = (now - (introStartTime + index * 100)) / 2000;

                    if (progress <= 0) {
                        progress = 0;
                        introOpacity = 0;
                        allIntroDone = false;
                    } else if (progress < 1) {
                        allIntroDone = false;
                        introOpacity = Math.min(1, progress * 4);
                    } else {
                        progress = 1;
                    }

                    easeP = 1 - Math.pow(1 - progress, 4);
                }

                const targetAngle = (index / totalItems) * Math.PI * 2;
                let finalAngle;

                if (!introComplete) {
                    const START_ANGLE = Math.PI * 0.75;
                    let travel = targetAngle - START_ANGLE;
                    if (travel < 0) travel += Math.PI * 2;
                    travel += Math.PI * 2;

                    finalAngle = START_ANGLE + (travel * easeP) + rotation;
                } else {
                    finalAngle = targetAngle + rotation;
                }

                const z = Math.cos(finalAngle);
                const scale = (z + 2) / 3;

                const x = Math.sin(finalAngle) * radiusX + wobbleX;
                const y = z * radiusY + wobbleY;

                const blurAmount = Math.max(0, (1 - z) * 8);
                const brightness = 0.2 + ((z + 1) / 2) * 0.8;
                const zIndex = Math.round((z + 1) * 100);

                let depthOpacity = 1;
                if (z < -0.6) {
                    depthOpacity = Math.max(0, 1 - ((-0.6 - z) / 0.4));
                }

                const totalOpacity = introOpacity * depthOpacity;

                item.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
                item.style.filter = `blur(${blurAmount}px) brightness(${brightness})`;
                item.style.zIndex = zIndex;
                item.style.opacity = totalOpacity;
                item.style.visibility = totalOpacity > 0.01 ? 'visible' : 'hidden';
            });

            if (!introComplete && allIntroDone) {
                introComplete = true;
                container.style.pointerEvents = 'auto';
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});