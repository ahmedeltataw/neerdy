

// --- وظيفة FAQ ---
const initFAQ = () => {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question) return;

    question.addEventListener("click", () => {
      const currentlyActive = document.querySelector(".faq-item.active");
      if (currentlyActive && currentlyActive !== item) {
        currentlyActive.classList.remove("active");
      }
      item.classList.toggle("active");
    });
  });
};

// --- وظيفة Mobile Menu ---
const initMobileMenu = () => {
  const MobileMenu = document.getElementById("MobileMenu");
  const closeMenu = document.getElementById("closeMenu");
  const openMenu = document.getElementById("openMenu");
  const overLay = document.getElementById("overLay");

  // التحقق من وجود العناصر قبل إضافة الـ Events لمنع الـ null error
  if (!MobileMenu || !openMenu || !closeMenu || !overLay) return;

  const toggleMenu = (action) => {
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
  };

  openMenu.addEventListener("click", () => toggleMenu("open"));
  closeMenu.addEventListener("click", () => toggleMenu("close"));
  overLay.addEventListener("click", () => toggleMenu("close"));
};

// --- وظيفة Game Layout (Tabs/Filter) ---
const initGameLayout = () => {
  const gameLayout = document.querySelector('.gameLayout');
  if (!gameLayout) return;

  const setActiveLayout = (targetId) => {
    if (!targetId) return;

    const buttons = gameLayout.querySelectorAll('.FilterButton');
    buttons.forEach(btn => {
      const isActive = btn.getAttribute('aria-control') === targetId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-expanded', isActive);
    });

    const layouts = gameLayout.querySelectorAll('.layout-view');
    layouts.forEach(layout => {
      const isTarget = layout.id === targetId;
      layout.classList.toggle('active', isTarget);
      layout.setAttribute('aria-hidden', !isTarget);
    });

    localStorage.setItem('preferredLayout', targetId);
  };

  gameLayout.addEventListener('click', (e) => {
    const btn = e.target.closest('.FilterButton');
    if (btn) {
      const targetId = btn.getAttribute('aria-control');
      setActiveLayout(targetId);
    }
  });

  // تفعيل التفضيلات المحفوظة
  const savedLayout = localStorage.getItem('preferredLayout') || 'AccordionLayout';
  setActiveLayout(savedLayout);
};

// --- وظيفة الـ Accordion ---
const initAccordion = () => {
  document.querySelectorAll(".accordionItem").forEach(item => {
    const btn = item.querySelector(".toggleBtn");
    const body = item.querySelector(".accordionBody");
    const useElement = btn ? btn.querySelector("use") : null;

    if (!btn || !body) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      if (isOpen) {
        body.style.height = body.offsetHeight + "px";
        body.offsetHeight; // force reflow
        body.style.height = "0px";
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        if (useElement) useElement.setAttribute('xlink:href', 'assets/icons/sprite.svg#icon-plus');
      } else {
        body.style.height = body.scrollHeight + "px";
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        if (useElement) useElement.setAttribute('xlink:href', 'assets/icons/sprite.svg#icon-minus');
      }
    });
  });
};

// --- الاستدعاء النهائي عند جاهزية الصفحة ---
document.addEventListener("DOMContentLoaded", () => {           
  initFAQ();
  initMobileMenu();
  initGameLayout();
  initAccordion();
});





// ==========

const createOdometer = (el) => {
  // جلب القيمة من attr data-num وتحويلها لرقم
  const targetValue = parseInt(el.getAttribute('data-num')) || 0;

  const odometer = new Odometer({
    el: el,
    value: 0,
    format: '', // لضمان عدم ظهور فواصل آلاف تقلب الترتيب
    theme: 'default'
  });

  let hasRun = false;

  const options = {
    threshold: [0, 0.5], // سيبدأ الأنييميشن عندما يظهر نصف العنصر
  };

  const callback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasRun) {
        odometer.update(targetValue);
        hasRun = true;
        observer.unobserve(el); // إيقاف المراقبة بعد التنفيذ لتحسين الأداء
      }
    });
  };

  const observer = new IntersectionObserver(callback, options);
  observer.observe(el);
};

// تشغيل العداد لكل العناصر التي تحمل كلاس odometer تلقائياً
document.querySelectorAll('.odometer').forEach(el => {
  createOdometer(el);
});
