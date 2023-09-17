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
      link.style.animation
        ? (link.style.animation = "")
        : (link.style.animation = `navLinkFade 0.3s ease forwards ${index / 100 + 0.1}s`);
    });
  }

  handleClick = () => {
    this.navList.classList.toggle(this.activeClass);
    this.mobileMenu.classList.toggle(this.activeClass);
    this.animateLinks();
  };

  addClickEvent() {
    this.mobileMenu.addEventListener("click", this.handleClick);
  }

  init() {
    return this;
  }
}

const elementos = {
  button: document.querySelector('.resposta'),
  modal: document.querySelector('.dialog'),
  subMenu: document.querySelectorAll('.submenu'),
  resultado: document.getElementById("resultado"),
  fechar: document.querySelector('.fechar'),
  sucesso: document.querySelector('.sucess'),
  proxima: document.querySelector('.proxima'),
  anterior: document.querySelector('.anterior'),
  soma: document.querySelector('.soma'),
  itensSoma: document.querySelector('.itensSoma'),
  menos: document.querySelector('.menos'),
  itensMenos: document.querySelector('.itensMenos'),
  vezes: document.querySelector('.vezes'),
  itensVezes: document.querySelector('.itensVezes'),
  dividir: document.querySelector('.dividir'),
  itensDividir: document.querySelector('.itensDividir'),
  todas: document.querySelector('.todas'),
  itensTodas: document.querySelector('.itensTodas'),
  voltar: document.querySelector('.voltar'),
  icone: document.querySelector('.sinal i'),
  fim: document.querySelector('.fim'),
  ok: document.querySelector('.ok'),
};

const mobileNavbar = new MobileNavbar(".mobile-menu", ".nav-list", ".nav-list li");

const elementosMenu = [elementos.soma, elementos.menos, elementos.vezes, elementos.dividir, elementos.todas];
const elementosMostrados = [elementos.itensSoma, elementos.itensMenos, elementos.itensVezes, elementos.itensDividir, elementos.itensTodas];

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

elementos.button.onclick = function () {
  checaResultado();
  elementos.modal.showModal();
};

elementos.fechar.onclick = function () {
  elementos.modal.close();
  elementos.fim.showModal()
};
elementos.ok.onclick = function () {
  p[i] = Number(numerador.outerText);
  s[i] = Number(denominador.outerText);
  i++;
  criaTabuada();
  elementos.fim.close()
  acerto = 0;
  errou = 0;
  jogou = 0;
};

let p = [];
let s = [];
let i = 0;

function proximaClick() {
  p[i] = Number(numerador.outerText);
  s[i] = Number(denominador.outerText);
  i++;
  criaTabuada();
  elementos.modal.close();
}

function back() {
  numerador.innerText = p[i - 1];
  denominador.innerText = s[i - 1];
  i--;
  if (i == 0) {
    numerador.innerText = p[i];
    denominador.innerText = s[i];
    i++;
  }
  elementos.resultado.value = null;
}

elementos.proxima.onclick = proximaClick;
elementos.anterior.onclick = back;

elementos.resultado.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    checaResultado();
    elementos.modal.showModal();
  }
});

elementos.voltar.onclick = () => {
  elementos.resultado.value = null;
  elementos.modal.close();
};
