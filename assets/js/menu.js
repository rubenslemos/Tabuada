class MobileNavbar {

  constructor(mobileMenu, navList, navLinks) {

    this.mobileMenu = document.querySelector(mobileMenu);
    this.navList = document.querySelector(navList);
    this.navLinks = document.querySelectorAll(navLinks);
    this.activeClass = "active";

    if (this.mobileMenu) {
      this.addClickEvent();
    }
  }

  animateLinks(isOpening) {
     if (isOpening) {
       const animation = 'navLinkFade';
       this.navLinks.forEach((link, index) => {
         link.style.animation = `${animation} 0.3s ease forwards ${index / 100 + 0.1}s`;
       });
     } 
  }

  handleClick = () => {
    const isActive = this.navList.classList.contains(this.activeClass);
    if (isActive) {
      // Fechando: animar links para fora, depois remover classe
      this.animateLinks(false);
      setTimeout(() => {
        this.navList.classList.remove(this.activeClass);
        this.mobileMenu.classList.remove(this.activeClass);
      }, 300); // Após animação dos links, deslizar menu de volta
    } else {
      // Abrindo: adicionar classe, depois animar
      this.navList.classList.add(this.activeClass);
      this.mobileMenu.classList.add(this.activeClass);
      this.animateLinks(true);
    }
  };

  addClickEvent() {
    this.mobileMenu.addEventListener("click", this.handleClick);
  }
  init() {
    return this;
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const mobileNavbar = new MobileNavbar(".mobile-menu", ".nav-list", ".nav-list li");
});