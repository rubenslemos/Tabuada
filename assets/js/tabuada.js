const numerador = document.querySelector('.numerador')
const denominador = document.querySelector('.denominador')
const sinal = document.querySelector('.sinal')
const classe = document.querySelector('.menu')
const submenu = document.querySelectorAll(".menu li a")
const diminuir = document.querySelector('menos')
const multiplicar= document.querySelector('vezes')
const dividido = document.querySelector('dividir')
const aleatorio = document.querySelector('todas')
const navList = document.querySelector('.nav-list');

let selectedValue = 'soma'
let valor = 'todas00' 
navList.addEventListener('click', function (event) {
const target = event.target;
if (target.classList.contains('somar') || target.classList.contains('menos') ||
  target.classList.contains('vezes') || target.classList.contains('dividir') ||
  target.classList.contains('todas')) {
  event.preventDefault();
  valor = target.getAttribute('value');
  if (target.classList.contains('menu')) {
    const submenu = target.querySelector('.submenu');
    submenu.classList.toggle('mostra');
  }
  criaTabuada()
  return valor
}})

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
cociente = (valor) => {
  if (valor === 'somar01' || valor === 'menos01' || valor === 'vezes01'
    || valor === 'dividi01' || valor === 'todas01') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 1
  } else if (valor === 'somar02' || valor === 'menos02' || valor === 'vezes02'
    || valor === 'dividi02' || valor === 'todas02') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 2
  } else if (valor === 'somar03' || valor === 'menos03' || valor === 'vezes03'
    || valor === 'dividi03' || valor === 'todas03') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 3
  } else if (valor === 'somar04' || valor === 'menos04' || valor === 'vezes04'
    || valor === 'dividi04' || valor === 'todas04') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 4
  } else if (valor === 'somar05' || valor === 'menos05' || valor === 'vezes05'
    || valor === 'dividi05' || valor === 'todas05') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 5
  } else if (valor === 'somar06' || valor === 'menos06' || valor === 'vezes06'
    || valor === 'dividi06' || valor === 'todas06') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 6
  } else if (valor === 'somar07' || valor === 'menos07' || valor === 'vezes07'
    || valor === 'dividi07' || valor === 'todas07') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 7
  } else if (valor === 'somar08' || valor === 'menos08' || valor === 'vezes08'
    || valor === 'dividi08' || valor === 'todas08') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 8
  } else if (valor === 'somar09' || valor === 'menos09' || valor === 'vezes09'
    || valor === 'dividi09' || valor === 'todas09') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 9
  } else if (valor === 'somar10' || valor === 'menos10' || valor === 'vezes10'
    || valor === 'dividi10' || valor === 'todas10') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = 10
  } else if (valor === 'somar11' || valor === 'menos11' || valor === 'vezes11'
    || valor === 'dividi11' || valor === 'todas11') {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = getRandomNumber(0, 10)
    console.log('entrei aqui')
  }else {
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = getRandomNumber(0, 10)
}}
criarSinal = (selectedValue) => {
    const operador = document.createElement('i');
    const iconMappings = {
    's': 'fa-plus',
    'm': 'fa-minus',
    'v': 'fa-times',
    'd': 'fa-divide',
  };
  let iconClass = iconMappings[selectedValue?.charAt(0)];

  if (selectedValue.charAt(0) === 't') {
    const randomIcons = Object.values(iconMappings);
    iconClass = randomIcons[Math.floor(Math.random() * randomIcons.length)];
  }
  if (iconClass) {
    operador.classList.add('fa-solid', iconClass);
    sinal.appendChild(operador);
  }
};

total = () => {
  const num = Number(numerador.outerText);
  const den = Number(denominador.outerText);
  const operador = document.querySelector('.sinal i')
  let result
  if (valor.charAt(0)==="s") { result = num + den }
  else if (valor.charAt(0)==="m") { result = num - den }
  else if (valor.charAt(0)==="v") { result = num * den }
  else if (valor.charAt(0)==="d") { result = num / den }
  else if (valor.charAt(0)==="t" && operador.classList.contains("fa-plus")) {result = num + den}
  else if (valor.charAt(0)==="t" && operador.classList.contains("fa-minus")){ result = num - den}
  else if (valor.charAt(0)==="t" && operador.classList.contains("fa-times")) {result = num * den}
  else if (valor.charAt(0) === "t" && operador.classList.contains("fa-divide")) { result = num / den }
  return result
}
document.addEventListener("DOMContentLoaded", () => {
  submenu.forEach((item) => {
    item.addEventListener("click", () => {
      selectedValue = item.getAttribute("value")
      sinal.innerHTML=''
      criarSinal(selectedValue)
    })
  })
})

checaResultado = () => {
  const tot = Number(resultado.value);
  result = total()
  if (result === tot) {
    elementos.sucesso.innerHTML = "Parabéns você acertou!!!"
  }
  else {
    elementos.sucesso.innerHTML = "Não foi dessa vez, que pena"
  }
}

criaTabuada = () => {
  sinal.innerHTML=""
  criarSinal(selectedValue)
  cociente(valor)
  resultado.value = null
}
criaTabuada();