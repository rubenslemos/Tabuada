let acerto = -1
let errou = 0
let jogou = -1
criarTabuada = ()=> {
  const numerador = document.querySelector('.numerador')
  const denominador = document.querySelector('.denominador')
  const sinal = document.querySelector('.sinal')
  const navList = document.querySelector('.nav-list')
  const jogado = document.querySelector('.jogou')
  const acertado = document.querySelector('.acertou')
  const errado = document.querySelector('.errou')
  let valor = 'soma' 

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' || e.key === 'Esc'){
      e.preventDefault()
    }
  })
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

  const denominadores = {
    '01': 1,
    '02': 2,
    '03': 3,
    '04': 4,
    '05': 5,
    '06': 6,
    '07': 7,
    '08': 8,
    '09': 9,
    '10': 10,
  };
  
  cociente = (valor) => {
    const valorDenominador = denominadores[valor.slice(-2)] || getRandomNumber(1, 10);
    numerador.innerHTML = getRandomNumber(0, 10);
    denominador.innerHTML = valorDenominador;
  };
  
  
  criarSinal = (valor) => {
      const operador = document.createElement('i');
      if (valor===null) {
        operador.classList.add('fa-solid', 'fa-plus')
        sinal.appendChild(operador);
      }
      const iconMappings = {
      's': 'fa-plus',
      'm': 'fa-minus',
      'v': 'fa-times',
      'd': 'fa-divide',
    };
    let iconClass = iconMappings[valor?.charAt(0)];
    if (valor?.charAt(0) === 't') {
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
  loopDeResultados = async() => {
    while (true) {
      await new Promise((resolve) => {
        const elementoFechar = document.querySelector('.fechar');
        elementoFechar.addEventListener('click', () => {
          resolve();
        });
      });
      acerto = 0;
      errou = 0;
      jogou = 0;
    }
  }
  checaResultado = () => {
    const tot = Number(resultado.value);
    result = total()
    const imagem = document.querySelector('.imagem')
    
    if (result === tot) {
      elementos.sucesso.innerHTML = "Parabéns você acertou!!!"
      imagem.setAttribute('src', '/img/check2.png')
      acerto++;
    }
    else {
      elementos.sucesso.innerHTML = "Dessa vez você errou !!!"
      imagem.setAttribute('src', '/img/redCross2.png')
      errou++;
    }
    jogou++;
    jogado.innerText = `Jogos: ${jogou}`
    acertado.innerText = `Acertos: ${acerto}`
    errado.innerText = `Erros: ${errou}`
    return{ acerto, errou, jogou }
  }
  enviarResultadosParaServidor = async () => {
    try {
      const { acerto, errou, jogou } = checaResultado();
      const userId = localStorage.getItem('userId') 
      const response = await fetch(`/auth/login/${userId}`, {
        method: 'GET',
      });
  
      if (response.status === 201) {
        const userData = await response.json();
        const userId = userData.user;
        const resposta = await fetch('/round', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({acerto, errou, jogou, userId}),
        });
        if(resposta.status === 201)
        console.log('Resultados salvos com sucesso no servidor');
      } else {
        console.error('Erro ao obter dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao enviar resultados para o servidor', error);
    }
  }
  criaTabuada = () => {
    sinal.innerHTML=""
    criarSinal(valor)
    cociente(valor)
    resultado.value = null
  }
  criaTabuada();
  return checaResultado
}
criarTabuada()