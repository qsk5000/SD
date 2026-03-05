// PWA Link Handler - معالج متقدم لفتح جميع الروابط داخل التطبيق
(function() {
  'use strict';

  // التحقق من وضع التشغيل (Standalone Mode)
  function isInStandaloneMode() {
    return (window.navigator.standalone === true) || 
           (window.matchMedia('(display-mode: standalone)').matches) || 
           (document.referrer.includes('android-app://'));
  }

  // معالج الروابط الرئيسي
  function handleLinkClick(e) {
    const link = e.target.closest('a[href]');

    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // 1. تجاهل الروابط الداخلية والـ Anchors (اتركها للمتصفح)
    if (href.startsWith('#') || href.startsWith('/')) {
      return;
    }

    // 2. تجاهل الروابط التي تطلب فتح نافذة جديدة صراحة
    if (link.target === '_blank') {
      return;
    }

    // 3. معالجة روابط الـ HTTP/HTTPS الخارجية
    if (href.startsWith('http')) {
      // منع السلوك الافتراضي لضمان البقاء داخل إطار التطبيق
      e.preventDefault();
      e.stopPropagation();

      console.log('📱 Opening link in-app:', href);
      
      // توجيه المستخدم في نفس النافذة
      window.location.href = href;
    }

    // 4. روابط الاتصال والبريد (تترك للنظام)
    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
  }

  // تجهيز الروابط (إضافة Attributes للتتبع إذا لزم الأمر)
  function prepareAllLinks() {
    const allLinks = document.querySelectorAll('a[href]:not([data-pwa-prepared])');
    allLinks.forEach(link => {
      link.setAttribute('data-pwa-prepared', 'true');
    });
  }

  // تسجيل الأحداث
  document.addEventListener('click', handleLinkClick, true);
  document.addEventListener('DOMContentLoaded', prepareAllLinks);
  window.addEventListener('load', prepareAllLinks);

  // مراقبة المحتوى الديناميكي (MutationObserver)
  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      let shouldRefresh = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) shouldRefresh = true;
      });
      if (shouldRefresh) prepareAllLinks();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  console.log('✅ PWA Link Handler loaded');
  console.log('Current Mode:', isInStandaloneMode() ? 'Standalone' : 'Browser');
})();
