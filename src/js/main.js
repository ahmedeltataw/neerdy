// init effect
// تسجيل ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);




window.addEventListener("load", () => {

  animatePreLoader();
  animateSplitText();
  animateSplitLines();
  animateImages();
  animateFadeIn();
});

// loader
function startLoader (){
  let counter = document.getElementById('counter');
  let currentValue = 0;

  function updateLoader(){
    if(currentValue === 100) return;
    currentValue += Math.floor(Math.random() * 10) + 1;
    if(currentValue > 100){
      currentValue =100
    }
    counter.textContent = `${currentValue}`;
    let delay = Math.floor(Math.random() * 200) + 50;
    setTimeout(updateLoader,delay)
  }
  updateLoader();

}

function animatePreLoader(){
  startLoader();
let tl = gsap.timeline({ delay: 3.5 }); 

// 
tl.to('#counter', {
  duration: 0.25,
  opacity: 0,
})
tl.to('.imgLoader', {
  duration: 0.25,
  animation:'none',
  opacity: 0,
})
.to('.bar', {
  duration: 1.5,
  height: 0,
  stagger: { amount: 0.5 },
  ease: "power3.inOut"
}) 
.to('.preload', {
  duration: 1,
  display: 'none',
  opacity: 0, 
})

.from('header', {
  duration: 1,
  y: -100,   
  scale: 0.8,
  opacity: 0,
  stagger: { amount: 0.5 },
  ease: "power3.out"
}, "-=1.5")
.from('.hero .content', {
  duration: 1,
  y: -100,   
  scale: 0.8,
  opacity: 0,
  stagger: { amount: 0.5 },
  ease: "power3.out"
}, "-=1")

// .from('#hero figure img', {
//   duration: 1,
//   y: -150,
//   opacity: 0,
//   scale: 0.8,
//   stagger: { amount: 0.5 },
//   ease: "power3.out"
// }, "-=.5") 
}


// 👇 This is the  preloader animation

// 👇 This function sets up the SplitText animation
function animateSplitText() {
  const splitElements = document.querySelectorAll(".split-text");

  splitElements.forEach((el) => {
    const split = new SplitText(el, { type: "lines,words" });

    gsap.from(split.words, {
      opacity: 0,
      x: 20,
      stagger: 0.05,
      duration: 1,
      delay: 0.3,
      ease: "power3.out",
      autoAlpha: 0,
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "top 40%",
        toggleActions: "play none none none",
        markers: false, // Set to true for debugging
      },
    });
  });
}
// 👇 This function sets up the SplitText animation
function animateSplitLines() {
  const splitElements = document.querySelectorAll(".split-lines");

  splitElements.forEach((el) => {
    const split = new SplitText(el, { type: "lines" });

    gsap.from(split.lines, {
      opacity: 0,
      x: 20,
      stagger: 0.05,
      duration: 1,
      delay: 0.3,
      ease: "power3.out",
      autoAlpha: 0,
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "top 40%",
        toggleActions: "play none none none",
        markers: false, // Set to true for debugging
      },
    });
  });
}
function animateImages() {
  gsap.utils.toArray(".imgDownUp").forEach((img) => {
    gsap.to(img, {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
      y: 0,
      duration: 0.7,
      ease: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      scrollTrigger: {
        trigger: img,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".imgUpDown").forEach((img) => {
    gsap.to(img, {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
      y: 0,
      duration: 0.7,
      ease: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      scrollTrigger: {
        trigger: img,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });
  gsap.utils.toArray(".imgLeftRight").forEach((img) => {
    gsap.to(img, {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
      x: 0,
      duration: 0.7,
      ease: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      scrollTrigger: {
        trigger: img,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });
  gsap.utils.toArray(".imgRIghtLeft").forEach((img) => {
    gsap.to(img, {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
      x: 0,
      duration: 0.7,
      ease: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      scrollTrigger: {
        trigger: img,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });
}

function animateFadeIn() {
  gsap.utils.toArray(".fadeIn").forEach((fade) => {
    gsap.fromTo(
      fade,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        scrollTrigger: {
          trigger: fade,
          start: "top 90%",
          end: "bottom center",
          toggleActions: "play none none none",
          // markers: true // Remove this after debugging
        },
      }
    );
  });
}

// تهيئة FAQ
const initFAQ = () => {
  const faqItems = document.querySelectorAll(".faq-item");

  if (!faqItems.length) return; // التحقق من وجود العناصر

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    if (!question) return; // التحقق من وجود السؤال

    question.addEventListener("click", () => {
      const currentlyActive = document.querySelector(".faq-item.active");

      if (currentlyActive && currentlyActive !== item) {
        currentlyActive.classList.remove("active");
      }

      item.classList.toggle("active");
    });
  });
};

// استدعاء الدالة بعد تحميل DOM
document.addEventListener("DOMContentLoaded", initFAQ);


// code
let MobileMenu = document.getElementById("MobileMenu");
let closeMenu = document.getElementById("closeMenu");
let openMenu = document.getElementById("openMenu");
let overLay = document.getElementById("overLay");
let Body = document.body;

function mobileMenu(action) {
  if (action === "open") {
    MobileMenu.classList.remove("d-none");
    requestAnimationFrame(() => {
      MobileMenu.classList.add("open");
      overLay.classList.add("active");
    });
  } else {
    MobileMenu.classList.remove("open");
    overLay.classList.remove("active");
    setTimeout(() => {
      MobileMenu.classList.add("d-none");
    }, 300);
  }
}

openMenu.addEventListener("click", () => {
  mobileMenu("open");
});
closeMenu.addEventListener("click", () => {
  mobileMenu("close");
});

overLay.addEventListener("click", () => {
  mobileMenu("close");
});

// ====swiper======

new Swiper(".cateSwiper", {
  slidesPerView: 1,
  spaceBetween: 10,
  centeredSlides: true,
  loop:true,
  // effect: "cards",
      // grabCursor: true,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    640: {
      slidesPerView: 2,
      spaceBetween: 10,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 10,
    },
    1024: {
      slidesPerView: 4,
      spaceBetween: 10,
    },
  },
});