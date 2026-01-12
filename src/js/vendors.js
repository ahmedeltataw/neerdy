// استيراد النواة الأساسية
import 'swiper/css/bundle';
import Swiper from 'swiper';
import Modal from 'bootstrap/js/dist/modal';
// استيراد الموديولات المطلوبة فقط بناءً على الكود الخاص بك
import { Navigation } from 'swiper/modules';

// تصديرهم للاستخدام في الملفات الأخرى
const swiperInit = () => {
    const cateSwiperElement = document.querySelector(".cateSwiper");
    
    if (cateSwiperElement) {
      new Swiper(".cateSwiper", {
        // تفعيل الموديولات المستوردة
        modules: [Navigation], 
        
        slidesPerView: 1,
        spaceBetween: 10,
        centeredSlides: true,
        loop: true,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        breakpoints: {
          520: {
            slidesPerView: 2,
            spaceBetween: 10,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 10,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 10,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 10,
          },
        },
      });
    }
  };
  
  // تشغيل الـ Swiper بعد تحميل الصفحة
  document.addEventListener("DOMContentLoaded", swiperInit);


// ==================
const initModal = () => {
  const modalElement = document.getElementById('staticBackdrop');
  const wrapper = document.querySelector('.bootstrap-wrapper'); 
  let overlayModal = document.getElementById('overLay');

  if (modalElement && wrapper) {
    const myModal = new Modal(modalElement);

    // 1. عند فتح المودال
    modalElement.addEventListener('show.bs.modal', () => {
      wrapper.style.display = 'block';
      if(overlayModal) overlayModal.classList.add('active');
    });

    // 2. عند إغلاق المودال
    modalElement.addEventListener('hidden.bs.modal', () => {
      wrapper.style.display = 'none';
      if(overlayModal) overlayModal.classList.remove('active');
    });

    myModal.show();
  }
};


document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('home-page')) {
      initModal();
  }
});

// 