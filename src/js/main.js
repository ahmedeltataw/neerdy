// import { Swiper, Navigation } from './vendors.js';
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


