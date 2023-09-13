const button = document.querySelector('.resposta')
const modal = document.querySelector('.dialog')
const subMenu = document.querySelectorAll('.submenu')
const resultado = document.getElementById("resultado")
const fechar = document.querySelector('.fechar')
const sucesso = document.querySelector('.sucess')
const proxima = document.querySelector('.proxima')
const anterior = document.querySelector('.anterior')
const soma = document.querySelector('.soma')
const itensSoma = document.querySelector('.itensSoma')
const menos =document.querySelector('.menos')
const itensMenos = document.querySelector('.itensMenos')
const vezes =document.querySelector('.vezes')
const itensVezes = document.querySelector('.itensVezes')
const dividir =document.querySelector('.dividir')
const itensDividir = document.querySelector('.itensDividir')
const todas =document.querySelector('.todas')
const itensTodas = document.querySelector('.itensTodas')
const voltar = document.querySelector('.voltar')
const icone = document.querySelector('.sinal i')
class MobileNavbar {
  constructor(mobileMenu, navList, navLinks) {
    this.mobileMenu = document.querySelector(mobileMenu)
    this.navList = document.querySelector(navList)
    this.navLinks = document.querySelectorAll(navLinks)
    this.activeClass = "active"

    if (this.mobileMenu) {
      this.addClickEvent()
    }
  }

  animateLinks() {
    this.navLinks.forEach((link, index) => {
      link.style.animation ? (link.style.animation = "") :
        (link.style.animation = `navLinkFade 0.5s ease forwards ${index / 80 + 0.1}s`);
    })
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

const elementosMenu = [soma, menos, vezes, dividir, todas];
const elementosMostrados = [itensSoma, itensMenos, itensVezes, itensDividir, itensTodas];

let result 
function toggleMostra(event) {
  const elementoClicado = event.target;

  elementosMenu.forEach((elemento, index) => {
    if (elemento === elementoClicado) {
      elementosMostrados[index].classList.toggle("mostra");
    } else {
      elementosMostrados[index].classList.remove("mostra");
    }
  });
}
  elementosMenu.forEach((elemento) => {
  elemento.addEventListener('click', toggleMostra);
});

mobileNavbar.init();


checaResultado = () => {
  const num = Number(numerador.outerText);
  const den = Number(denominador.outerText);
  const total = Number(resultado.value);
  const subMenu = document.querySelectorAll('.submenu')
  console.log('Icone', icone.classList)
  console.log('subMenu', subMenu)
  subMenu.forEach
  if (subMenu.classList.contains("soma")){ result = num + den }
  else if (subMenu.classList.contains("menos")) { result = num - den }
  else if (subMenu.classList.contains("vezes")){ result = num * den }
  else if (subMenu.classList.contains("dividir")){ result = num / den }
  else if (subMenu.classList.contains("todas") && icone.classList.contains("fa-plus")) {result = num + den}
  else if (subMenu.classList.contains("todas") && icone.classList.contains("fa-minus")){ result = num - den}
  else if (subMenu.classList.contains("todas") && icone.classList.contains("fa-times")) {result = num * den}
  else if (subMenu.classList.contains("todas") && icone.classList.contains("fa-divide")) { result = num / den }
  console.log('result', result)
  if (result === total) {
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
back = () => {
    numerador.innerText = p[i-1]
    denominador.innerText = s[i - 1]
    i--
    if (i == 0) {
      numerador.innerText = p[i]
      denominador.innerText = s[i]
      i++
    }
    document.getElementById("resultado").value = null
}
anterior.onclick = back
resultado.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    checaResultado()
    modal.showModal()
  }
})

voltar.onclick = () => {
  resultado.value= null
  modal.close()
}