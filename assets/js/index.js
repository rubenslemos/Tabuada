const button = document.querySelector('.resposta')
const modal = document.querySelector('.dialog')
const numerador = document.querySelector('.numerador');
const denominador = document.querySelector('.denominador');
const resultado = document.getElementById("resultado")
const fechar = document.querySelector('.fechar')
const sucesso = document.querySelector('.sucess')
const proxima = document.querySelector('.proxima')
const anterior = document.querySelector('.anterior')
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
criarNumerador = () => {
  numerador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return numerador;
}
criarDenominador = () => {
  denominador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return denominador;
}
criaTabuada = () => {
  criarNumerador();
  criarDenominador();
  document.getElementById("resultado").value = null
}
criaTabuada();

checaResultado = () => {
  const num = Number(numerador.outerText);
  const den = Number(denominador.outerText);
  const soma = Number(resultado.value);
  const result = num + den;
  if (result === soma) {
    sucesso.innerHTML = "Parabéns você acertou!!!"
  }
  else {
    sucesso.innerHTML = "Não foi dessa vez, que pena"
  }
}

let p = []
let s = []
let i = 0;
button.onclick = function () {
  checaResultado()
  modal.showModal()
}

fechar.onclick = function () {
  modal.close()
}

proxima.onclick = function () {
  p[i] = Number(numerador.outerText);
  s[i] = Number(denominador.outerText);
  i++;
  criaTabuada()
  modal.close()
}
anterior.onclick = function () {
  numerador.innerText = p[i-1]
  denominador.innerText = s[i - 1]
  i--
  if (i == 0) {
    numerador.innerText = p[i]
    denominador.innerText = s[i]
    i++
  }
  document.getElementById("resultado").value = null
  return numerador, denominador
}
resultado.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    checaResultado()
    modal.showModal()
  }
})