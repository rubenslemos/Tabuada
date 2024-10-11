const criarTabuada = () => {


  const numerador = document.querySelector('.numerador');
  const denominador = document.querySelector('.denominador');
  const sinal = document.querySelector('.sinal');
  const navList = document.querySelector('.nav-list');
  const jogado = document.querySelector('.jogou');
  const acertado = document.querySelector('.acertou');
  const errado = document.querySelector('.errou');
  const modalPremio = document.querySelector('.premiosDialog');
  const premio = document.querySelector('.premiosContainer');
  const motivacional = document.createElement('p');

  let valor = 'soma';

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
    }
  });

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
      criaTabuada();
      return valor;
    }
  });

  const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

  const cociente = (valor) => {
    const operador = document.querySelector('.sinal i');
    let valorNumerador = getRandomNumber(0, 10);
    let valorDenominador = denominadores[valor.slice(-2)] || getRandomNumber(1, 10);

    // Rest of the code...
  };

  const criarSinal = (valor) => {
    const operador = document.createElement('i');
    if (valor === null) {
      operador.classList.add('fa-solid', 'fa-plus');
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

  const total = () => {
    const num = Number(numerador.textContent);
    const den = Number(denominador.textContent);
    const operador = document.querySelector('.sinal i');
    let result;
  
    switch (valor.charAt(0)) {
      case '':
        result = num + den;
        contagemOperacoes.faPlus++;
        break;
      case '':
        result = num - den;
        contagemOperacoes.faMinus++;
        break;
      case 'v':
        result = num * den;
        contagemOperacoes.faTimes++;
        break;
      case 'd':
        result = num / den;
        contagemOperacoes.faDivide++;
        break;
      case 't':
        switch (operador.classList.contains('fa-plus')) {
          case true:
            result = num + den;
            contagemOperacoes.faPlus++;
            break;
          case false:
            result = num - den;
            contagemOperacoes.faMinus++;
            break;
        }
        switch (operador.classList.contains('fa-times')) {
          case true:
            result = num * den;
            contagemOperacoes.faTimes++;
            break;
          case false:
            result = num / den;
            contagemOperacoes.faDivide++;
            break;
        }
        break;
      default:
        break;
    }
  
    return { result, contagemOperacoes };
  };
  // Rest of the code...
  const loopDeResultados = async () => {
    while (true) {
      const elementoFechar = document.querySelector('.fechar');
      const resolverPromise = new Promise((resolve) => {
        elementoFechar.addEventListener('click', () => {
          resolve();
          contagemOperacoes.faPlus = 0;
          contagemOperacoes.faMinus = 0;
          contagemOperacoes.faTimes = 0;
          contagemOperacoes.faDivide = 0;
        });
      });
      acerto = 0;
      errou = 0;
      jogou = 0;
      await resolverPromise;
    }
  };
  
}
function checaResultado() {
  const resultado = document.querySelector('#resultado').value;
  console.log(resultado)
  const totalJogos = parseInt(localStorage.getItem('totalJogos')) || 0;
  const totalAcertos = parseInt(localStorage.getItem('totalAcertos')) || 0;
  const totalErros = parseInt(localStorage.getItem('totalErros')) || 0;

  if (resultado === total()) {
    const sucesso = document.querySelector('.sucesso');
    sucesso.innerHTML = "Parabéns você acertou!!!";
    const imagem = document.querySelector('.imagem');
    imagem.setAttribute('src', '/img/check2.png');
    acerto++;
    jogou++;
    totalJogos++;
    totalAcertos++;
  } else {
    const sucesso = document.querySelector('.sucesso');
    sucesso.innerHTML = "Dessa vez você errou!!!";
    const imagem = document.querySelector('.imagem');
    imagem.setAttribute('src', '/img/redCross2.png');
    errou++;
    jogou++;
    totalJogos++;
    totalErros++;
  }

  const jogado = document.querySelector('#jogado');
  const acertado = document.querySelector('#acertado');
  const errado = document.querySelector('#errado');

  jogado.innerText = `Jogos: ${jogou}`;
  acertado.innerText = `Acertos: ${acerto}`;
  errado.innerText = `Erros: ${errou}`;

  localStorage.setItem('totalJogos', totalJogos);
  localStorage.setItem('totalAcertos', totalAcertos);
  localStorage.setItem('totalErros', totalErros);
}

function enviarResultadosParaServidor() {
  const totalJogos = parseInt(localStorage.getItem('totalJogos')) || 0;
  const totalAcertos = parseInt(localStorage.getItem('totalAcertos')) || 0;
  const totalErros = parseInt(localStorage.getItem('totalErros')) || 0;

  const data = {
    totalJogos,
    totalAcertos,
    totalErros,
  };

  fetch('/enviar-resultados', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
   .then((response) => response.json())
   .then((data) => {
      console.log('Resultados enviados com sucesso:', data);
    })
   .catch((error) => {
      console.error('Erro ao enviar resultados:', error);
    });
}
