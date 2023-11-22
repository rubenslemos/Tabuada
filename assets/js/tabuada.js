let jogou = -1
let acerto = -1
let errou = -1
let resultados = null
let contagemOperacoes = {
  faPlus: 0,
  faMinus: 0,
  faTimes: 0,
  faDivide: 0
};
criarTabuada = ()=> {
  let totalJogos = parseInt(localStorage.getItem('totalJogos'))
  let totalAcertos = parseInt(localStorage.getItem('totalAcertos')) 
  let totalErros = parseInt(localStorage.getItem('totalErros'))
  
  if (isNaN(totalAcertos)) totalAcertos= 0
  if (isNaN(totalErros)) totalErros= 0
  if (isNaN(totalJogos)) totalJogos= 0
  
  let estrela = isNaN(totalAcertos) ? 0 : Math.floor(totalAcertos / 10);
  let downThumb = isNaN(totalErros) ? 0 : Math.floor(totalErros / 10);
  let nivel = isNaN(totalJogos) ? 0 : Math.floor(totalJogos / 100);
  const numerador = document.querySelector('.numerador')
  const denominador = document.querySelector('.denominador')
  const sinal = document.querySelector('.sinal')
  const navList = document.querySelector('.nav-list')
  const jogado = document.querySelector('.jogou')
  const acertado = document.querySelector('.acertou')
  const errado = document.querySelector('.errou')
  const modalPremio = document.querySelector('.premiosDialog')
  const premio = document.querySelector('.premiosContainer')
  let valor = 'soma' 

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' || e.key === 'Esc'){
      e.preventDefault()
    }
  })
  navList.addEventListener('click', function (event) {
  const target = event.target;
  if (target.classList.contains('soma') || target.classList.contains('menos') ||
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
    const operador = document.querySelector('.sinal i')
    let valorNumerador = getRandomNumber(0, 10);
    let valorDenominador = denominadores[valor.slice(-2)] || getRandomNumber(1, 10);

    if (valor.charAt(0) === "m") {
        if (valorNumerador < valorDenominador) {
            [valorNumerador, valorDenominador] = [valorDenominador, valorNumerador];
        }
    } else if (valor.charAt(0) === "d") {
        valorNumerador = valorDenominador * getRandomNumber(1, 10);
    } else if (valor.charAt(0) === 't' && operador.classList.contains("fa-minus")){
        let invert  = valorNumerador
        if (valorNumerador < valorDenominador) {
          valorNumerador = valorDenominador
          valorDenominador = invert

      }
    } else if(valor.charAt(0) === 't' && operador.classList.contains("fa-divide")) {
        valorNumerador = valorDenominador * getRandomNumber(1, 10)

      }
    numerador.innerHTML = valorNumerador;
    denominador.innerHTML = valorDenominador;
}
  
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
    if (valor.charAt(0) === "s") {
      result = num + den;
      contagemOperacoes.faPlus++;
    } else if (valor.charAt(0) === "m") {
      result = num - den;
      contagemOperacoes.faMinus++;
    } else if (valor.charAt(0) === "v") {
      result = num * den;
      contagemOperacoes.faTimes++;
    } else if (valor.charAt(0) === "d") {
      result = num / den;
      contagemOperacoes.faDivide++;
    } else if (valor.charAt(0) === "t" && operador.classList.contains("fa-plus")) {
      result = num + den;
      contagemOperacoes.faPlus++;
    } else if (valor.charAt(0) === "t" && operador.classList.contains("fa-minus")) {
      result = num - den;
      contagemOperacoes.faMinus++;
    } else if (valor.charAt(0) === "t" && operador.classList.contains("fa-times")) {
      result = num * den;
      contagemOperacoes.faTimes++;
    } else if (valor.charAt(0) === "t" && operador.classList.contains("fa-divide")) {
      result = num / den;
      contagemOperacoes.faDivide++;
    }
    return {
      result: result,
      contagemOperacoes: contagemOperacoes
    }
  }
  loopDeResultados = async() => {
    while (true) {
      await new Promise((resolve) => {
        const elementoFechar = document.querySelector('.fechar');
        elementoFechar.addEventListener('click', () => {
          resolve();
          contagemOperacoes.faPlus = 0
          contagemOperacoes.faMinus = 0
          contagemOperacoes.faTimes = 0
          contagemOperacoes.faDivide = 0
        });
      });
      acerto = 0;
      errou = 0;
      jogou = 0;
    }
  }
  checaResultado = () => {
    if (jogou < 0 ) jogou = 0
    if (acerto < 0 ) acerto = 0
    if (errou < 0 ) errou = 0
    if (isNaN(totalJogos)) totalJogos = parseInt(localStorage.getItem('totalJogos'))
    if (isNaN(totalAcertos)) totalAcertos = parseInt(localStorage.getItem('totalAcertos'))
    if (isNaN(totalErros )) totalErros = parseInt(localStorage.getItem('totalErros'))
    const tot = Number(resultado.value)
    const {result, contagemOperacoes} = total()
    const imagem = document.querySelector('.imagem')
    
    if (result === tot) {
      elementos.sucesso.innerHTML = "Parabéns você acertou!!!"
      imagem.setAttribute('src', '/img/check2.png')
      acerto++
      jogou++
      totalJogos++
      totalAcertos++
    }
    if (result !== tot) {
      elementos.sucesso.innerHTML = "Dessa vez você errou !!!"
      imagem.setAttribute('src', '/img/redCross2.png')
      errou++
      jogou++
      totalJogos++
      totalErros++
    }
    jogado.innerText = `Jogos: ${jogou}`
    acertado.innerText = `Acertos: ${acerto}`
    errado.innerText = `Erros: ${errou}`

    return{ acerto, errou, jogou, totalJogos, totalAcertos, totalErros }
  }

  enviarResultadosParaServidor = async (acerto, errou, jogou, {...contagemOperacoes}) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/auth/login/${userId}`, {
        method: 'GET',
      });
      localStorage.setItem('totalJogos', totalJogos || 0);
      localStorage.setItem('totalAcertos', totalAcertos || 0);
      localStorage.setItem('totalErros', totalErros || 0)
      if (response.status === 201) {
        const userData = await response.json();
        const userId = userData.user;
  
        const resposta = await fetch('/round', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ acerto, errou, jogou, userId, totalJogos, totalAcertos, totalErros }),
        });
  
        if (resposta.status === 201) {
          const roundData = await resposta.json();
          const roundId = roundData.round._id;
          localStorage.setItem('roundId', roundId);
          console.log('Resultados salvos com sucesso no servidor');
  
          try {
            const userId = localStorage.getItem('userId');
            const roundId = localStorage.getItem('roundId');
            const respostaOperacoes = await fetch('/round/resultado-operacoes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                roundId,
                userId,
                contagemOperacoes,
              }),
            });
  
            if (respostaOperacoes.status === 200) {
              console.log('Operações salvas com sucesso no servidor');
            } else {
              console.error('Erro ao salvar operações no servidor');
            }
          } catch (error) {
            console.error('Erro ao enviar operações para o servidor', error);
          }
        } else {
          console.error('Erro ao salvar resultados no servidor');
        }
      } else {
        console.error('Erro ao obter dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao enviar resultados para o servidor', error);
    }
  };

  premios = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/auth/login/${userId}`, {
        method: 'GET',
      });
  
      if (response.status === 201) {

        const userData = await response.json();
        const { totalJogos, totalAcertos, totalErros } = userData;

        localStorage.setItem('totalJogos', totalJogos);
        localStorage.setItem('totalAcertos', totalAcertos);
        localStorage.setItem('totalErros', totalErros);

      } else {
        console.error("Usuário não encontrado!");
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário', error);
    }}
criaPremios = () =>{
    let estrelaHTML = document.getElementById('estrela');
    let downThumbHTML = document.getElementById('downThumb');
    let nivelHTML = document.getElementById('nivel');
    let resultados = document.querySelector('.premios');
    let ImagemEstrela = "background: url('/img/estrela.png') no-repeat center center content-box"
    let ImagemDownThumb = "background: url('/img/downthumb.png') no-repeat center center content-box"
    let ImagemCalculadora = "background: url('/img/calculadora.png') no-repeat center center content-box"
    if (!estrelaHTML) {
      estrelaHTML = document.createElement('small');
      estrelaHTML.id = 'estrela';
    }
  
    if (!downThumbHTML) {
      downThumbHTML = document.createElement('small');
      downThumbHTML.id = 'downThumb';
    }
  
    if (!nivelHTML) {
      nivelHTML = document.createElement('small');
      nivelHTML.id = 'nivel';
    }
  
    if (!resultados) {
      resultados = document.createElement('div');
      resultados.classList.add('premios');
    } else {
      resultados.innerHTML = '';
    }
    if (totalAcertos % 10 === 0 && totalAcertos !== 0){
      estrela++
      premio.setAttribute("style", ImagemEstrela)
      modalPremio.showModal()
      setTimeout(()=>{
        modalPremio.close()
      },5000)
    }
    
    if (totalErros % 10 === 0 && totalErros !== 0){
      downThumb++
      premio.setAttribute("style", ImagemDownThumb)
      modalPremio.showModal()
      setTimeout(()=>{
        modalPremio.close()
      },5000)
    }
    
    if (totalJogos % 100 === 0 && totalJogos !== 0){
      nivel++
      premio.setAttribute("style", ImagemCalculadora)
      modalPremio.showModal()
      setTimeout(()=>{
        modalPremio.close()
      },5000)
    }
    
    estrelaHTML.innerHTML = `<i class="fa-solid fa-star"></i><i>${estrela.toFixed(0)}</i>`;
    downThumbHTML.innerHTML = `<i class="fa-solid fa-thumbs-down"></i><i>${downThumb.toFixed(0)}</i>`;
    nivelHTML.innerHTML = `<i class="fa-solid fa-calculator"></i><i>${nivel.toFixed(0)}</i>`;
  
    resultados.appendChild(estrelaHTML);
    resultados.appendChild(downThumbHTML);
    resultados.appendChild(nivelHTML);
  
    const logo = document.querySelector('.logo');
    const topo = document.getElementById('topo');
    topo.insertBefore(resultados, logo);
  }
  
  criaTabuada = async () => {
    await premios()
    sinal.innerHTML=""
    criarSinal(valor)
    cociente(valor)
    criaPremios()
    resultado.value = null
  }
  criaTabuada();

}
criarTabuada()