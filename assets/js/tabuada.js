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
  let i = document.createElement('i')
  if (selectedValue?.indexOf("s")=== 0) {
    i.classList.add("fa-solid")
    i.classList.add("fa-plus")
    sinal.appendChild(i)
    console.log(i)
  }
  else if (selectedValue?.indexOf("m")===0) {
    i.classList.add("fa-solid")
    i.classList.add("fa-minus")
    sinal.appendChild(i)
    console.log(i)
  }
  else if (selectedValue?.indexOf("v")===0) {
    i.classList.add("fa-solid")
    i.classList.add("fa-times")
    sinal.appendChild(i)
    console.log(i)
  }
  else if (selectedValue?.indexOf("d")===0) {
    i.classList.add("fa-solid")
    i.classList.add("fa-divide")
    sinal.appendChild(i)
    console.log(i)
  }
  else if (selectedValue?.indexOf("t")===0) {
    i.classList.add("fa-solid")
    i.classList.add("fa-plus")
    sinal.appendChild(i)
    console.log(i)
  }}
  document.addEventListener("DOMContentLoaded", () => {
    const valorAtual = document.getElementsByClassName(".sinal")
    console.log("subM-ID", submenu)
    console.log("valorAtual: ", valorAtual)
    submenu.forEach((item) => {
      item.addEventListener("click", () => {
        const selectedValue = item.getAttribute("value")
        sinal.innerHTML=''
        criarSinal(selectedValue)
      })
    })
})
criaTabuada = () => {
  criarNumerador()
  criarDenominador()
  criarSinal(selectedValue)
  resultado.value = null
}
criaTabuada();