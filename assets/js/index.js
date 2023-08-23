

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

  animateLinks() {
    this.navLinks.forEach((link, index) => {
      link.style.animation ? (link.style.animation = "") : (link.style.animation = `navLinkFade 0.5s ease forwards ${index/10 +0.3}s`);
    });
  }

  handleClick = () => {
    this.navList.classList.toggle(this.activeClass);
    this.mobileMenu.classList.toggle(this.activeClass);
    this.animateLinks();
  }

  addClickEvent() {
    this.mobileMenu.addEventListener("click", this.handleClick);
  }

  init() {
    return this;
  }
}

const mobileNavbar = new MobileNavbar(
  ".mobile-menu",
  ".nav-list",
  ".nav-list li"
);

mobileNavbar.init();
criaNumerador = () => {
  const numerador = document.querySelector('.numerador');
  numerador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return numerador;
}
criaDenominador = () => {
  const denominador = document.querySelector('.denominador');
  denominador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return denominador;
}
criaTabuada = () => {
  criaNumerador();
  criaDenominador();
}
criaTabuada();

checaResultado = () => {
  const numerador = Number(document.querySelector('.numerador').outerText);
  const denominador = Number(document.querySelector('.denominador').outerText);
  const result = numerador + denominador;
  const resultado = document.getElementById("resultado").value = result;
  return resultado;
}
checaResultado();