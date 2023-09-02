const button = document.querySelector('.resposta')
const modal = document.querySelector('.dialog')
const numerador = document.querySelector('.numerador')
const denominador = document.querySelector('.denominador')
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


abrirSoma = () => {
  soma.addEventListener('click', () => {
    itensSoma.classList.toggle("mostra")
    itensMenos.classList.remove("mostra")
    itensVezes.classList.remove("mostra")
    itensDividir.classList.remove("mostra")
    itensTodas.classList.remove("mostra")
  })
}
abrirSoma()
abrirMenos = () => {
  menos.addEventListener('click', () => {
    itensMenos.classList.toggle("mostra")
    itensSoma.classList.remove("mostra")
    itensVezes.classList.remove("mostra")
    itensDividir.classList.remove("mostra")
    itensTodas.classList.remove("mostra")
  })
}
abrirMenos()
abrirVezes = () => {
  vezes.addEventListener('click', () => {
    itensVezes.classList.toggle("mostra")
    itensSoma.classList.remove("mostra")
    itensMenos.classList.remove("mostra")
    itensDividir.classList.remove("mostra")
    itensTodas.classList.remove("mostra")
  })
}
abrirVezes()
abrirDividir = () => {
  dividir.addEventListener('click', () => {
    itensDividir.classList.toggle("mostra")
    itensSoma.classList.remove("mostra")
    itensMenos.classList.remove("mostra")
    itensVezes.classList.remove("mostra")
    itensTodas.classList.remove("mostra")
  })
}
abrirDividir()
abrirTodas = () => {
  todas.addEventListener('click', () => {
    itensTodas.classList.toggle("mostra")
    itensSoma.classList.remove("mostra")
    itensMenos.classList.remove("mostra")
    itensVezes.classList.remove("mostra")
    itensDividir.classList.remove("mostra")
  })
}
abrirTodas()

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
  resultado.value = null
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