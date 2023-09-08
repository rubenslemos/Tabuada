const numerador = document.querySelector('.numerador')
const denominador = document.querySelector('.denominador')
const sinal = document.querySelector('.sinal')
const classe = document.querySelector('.menu')
const submenu = document.querySelectorAll(".menu li a")
const diminuir = document.querySelector('menos')
const multiplicar= document.querySelector('vezes')
const dividido = document.querySelector('dividir')
const aleatorio = document.querySelector('todas')
criarNumerador = () => {
  numerador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return numerador;
}
criarDenominador = () => {
  denominador.innerHTML = Math.floor( ( Math.random() * ( 10 - 0 ) + 0 ) * 1 )
  return denominador;
}
criarSinal = () => {
  let i = document.createElement('i')
  if (submenu.id === 'soma') {
    i.classList.add("fa-solid")
    i.classList.add("fa-plus")
    sinal.appendChild(i)
    console.log(i)
    } else {
      if (submenu.id === 'menos') {
        i = document.createElement('i')
        i.classList.add("fa-solid")
        i.classList.add("fa-minus")
        sinal.appendChild(i)
        console.log(i)
      }
    }
    return submenu
  }
  document.addEventListener("DOMContentLoaded", () => {
    const valorAtual = document.getElementsByClassName(".sinal")
    console.log("subM-ID", submenu)
    console.log("valorAtual: ", valorAtual)
    submenu.forEach((item) => {
      item.addEventListener("click", () => {
        const selectedValue = item.getAttribute("data-value")
          //se selectedValue tiver em seu valor o caractere 3 for 
          //(m, n, z, v ou d) então sinal recebe 
        
      })
    })
  criarSinal()
})
criaTabuada = () => {
  criarNumerador()
  criarDenominador()
  criarSinal()
  resultado.value = null
}
criaTabuada();