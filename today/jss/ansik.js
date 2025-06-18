document.addEventListener('DOMContentLoaded', () => {


  gsap.registerPlugin(MotionPathPlugin, CustomEase, ScrollTrigger);
  
    gsap.to('.feader', {
        backgroundPosition: "100% 100%", //scrollimg
        rotation: randomBetween (-2.2, 2.2),
        scale: 1.024,
        duration: 22, // Smooth, slow motion
        repeat: -1, // Infinite loop
        yoyo: true,
        ease: "none" // Seamless motion without easing bumps
    });
});


  // Natural drop/bounce easing
  CustomEase.create("customBounce", "M0,0 C0.25,0.1 0.25,1 1,1");

  // Utility for random number generation
  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  /* 
   * .drop-crawl 
   * Drops in, then crawls along a random path continuously
   */
  gsap.utils.toArray(".drop-crawl").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: -300, rotation: randomBetween(-12, 13), scale: 0.5 },
      {
        opacity: 1, y: 0, rotation: 0, scale: 1,
        duration: 2, ease: "customBounce",
        onComplete: () => startCrawlAnimation(el)
      }
    );
  });

  function startCrawlAnimation(el) {
    gsap.to(el, {
      duration: randomBetween(3, 5),
      ease: "sine.inOut",
      motionPath: {
        path: generateRandomPath(),
        autoRotate: true,
        align: "self",
        alignOrigin: [0.5, 0.5]
      },
      repeat: -1,
      yoyo: true
    });
  }

  function generateRandomPath() {
    const [startX, startY] = [0, 0];
    const cp1X = randomBetween(-30, 20), cp1Y = randomBetween(-23, 28);
    const cp2X = randomBetween(-20, 30), cp2Y = randomBetween(-32, 42);
    const endX = randomBetween(-24, 18), endY = randomBetween(-30, 26);
    return `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;
  }

  /* 
   * .drop-wiggle 
   * Drops in, then wiggles/throbs continuously
   */
  gsap.utils.toArray(".drop-wiggle").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: -300, rotation: randomBetween(-20, 20), scale: 0.5 },
      {
        opacity: 1, y: 0, rotation: 0, scale: 1,
        duration: 2, ease: "customBounce",
        onComplete: () => {
          gsap.to(el, {
            duration: randomBetween(1, 2),
            rotation: randomBetween(-10, 10),
            scale: randomBetween(1.03, 1.10),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }
      }
    );
  });

  /* 
   * .squi-rmbreth 
   * Subtle scale, rotation, and vertical “breathing”
   */
  gsap.utils.toArray(".squi-rmbreth").forEach(el => {
    // Throb (scaling up and down)
    gsap.to(el, {
      duration: 6.5,
      scale: 1.1,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    });
    // Subtle wiggle (rotation)
    gsap.to(el, {
      duration: 9,
      rotation: 5,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true
    });
    // Slight vertical breathing
    gsap.to(el, {
      duration: 7,
      y: 6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  });

  /*
   * SUPER-SUBTLE SCROLLTRIGGER COLOR TWEEN
   * Gradually shifts the body's background
   * from #f0ffff to #ffffff over 2000px of scroll.
   */
  gsap.to("body", {
    scrollTrigger: {
      start: 0,
      end: 1200,    // Extend the distance to make the color shift extra subtle
      scrub: 1
    },
    backgroundColor: "#ffffff",
    ease: "none"
  });
;
