const numerador = document.querySelector('.numerador')
const denominador = document.querySelector('.denominador')
const sinal = document.querySelector('.sinal')
const classe = document.querySelector('.menu')
const submenu = document.querySelectorAll(".menu li a")
const diminuir = document.querySelector('menos')
const multiplicar= document.querySelector('vezes')
const dividido = document.querySelector('dividir')
const aleatorio = document.querySelector('todas')
const selectedValue = 'soma'
criarNumerador = () => {
  numerador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return numerador;
}
criarDenominador = () => {
  denominador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return denominador;
}

criarSinal = (selectedValue) => {
  const operador = document.createElement('i');
  const iconMappings = {
    's': 'fa-plus',
    'm': 'fa-minus',
    'v': 'fa-times',
    'd': 'fa-divide',
    't': 'fa-plus',
  };

  const iconClass = iconMappings[selectedValue?.charAt(0)];
  if (iconClass) {
    operador.classList.add('fa-solid', iconClass);
    sinal.appendChild(operador);
  }
};

  document.addEventListener("DOMContentLoaded", () => {
    submenu.forEach((item) => {
      item.addEventListener("click", () => {
        const selectedValue = item.getAttribute("value")
        sinal.innerHTML=''
        criarSinal(selectedValue)
      })
    })
})
criaTabuada = () => {
  sinal.innerHTML=""
  criarNumerador()
  criarDenominador()
  criarSinal(selectedValue)
  resultado.value = null
}
criaTabuada();