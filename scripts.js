document.addEventListener('DOMContentLoaded', () => {
   const topBtn = document.getElementById('scrollTopBtn');

   if (!topBtn) return;

   const updateVisibility = () => {
      if (window.scrollY > 300) {
         topBtn.classList.add('visible');
      } else {
         topBtn.classList.remove('visible');
      }
   };

   window.addEventListener('scroll', updateVisibility);
   updateVisibility();

   topBtn.addEventListener('click', () => {
      window.scrollTo(0, 0);
   });
});
