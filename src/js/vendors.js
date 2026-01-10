// استيراد النواة الأساسية
import 'swiper/css/bundle';
import Swiper from 'swiper';
// استيراد الموديولات المطلوبة فقط بناءً على الكود الخاص بك
import { Navigation } from 'swiper/modules';

// تصديرهم للاستخدام في الملفات الأخرى
const swiperInit = () => {
    const cateSwiperElement = document.querySelector(".cateSwiper");
    
    if (cateSwiperElement) {
      new Swiper(".cateSwiper", {
        // تفعيل الموديولات المستوردة
        modules: [Navigation], 
        
        slidesPerView: 5,
        spaceBetween: 10,
        centeredSlides: true,
        loop: true,
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
            slidesPerView: 5,
            spaceBetween: 10,
          },
        },
      });
    }
  };
  
  // تشغيل الـ Swiper بعد تحميل الصفحة
  document.addEventListener("DOMContentLoaded", swiperInit);