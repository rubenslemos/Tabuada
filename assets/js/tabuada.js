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
  }
})
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
cociente = (valor) => {
    if (valor === 'somar01') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 1
    } else if (valor === 'somar02') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 2
    }else if (valor === 'somar03') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 3
    }else if (valor === 'somar04') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 4
    }else if (valor === 'somar05') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 5
    }else if (valor === 'somar06') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 6
    }else if (valor === 'somar07') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 7
    }else if (valor === 'somar08') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 8
    }else if (valor === 'somar09') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 9
    }else if (valor === 'somar00') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = getRandomNumber(0, 10)
    }else if (valor === 'menos01') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 1
    }else if (valor === 'menos02') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 2
    }else if (valor === 'menos03') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 3
    }else if (valor === 'menos04') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 4
    }else if (valor === 'menos05') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 5
    }else if (valor === 'menos06') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 6
    }else if (valor === 'menos07') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 7
    }else if (valor === 'menos08') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 8
    }else if (valor === 'menos09') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 9
    }else if (valor === 'vezes00') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = getRandomNumber(0, 10)
    }else if (valor === 'vezes01') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 1
    }else if (valor === 'vezes02') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 2
    }else if (valor === 'vezes03') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 3
    }else if (valor === 'vezes04') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 4
    }else if (valor === 'vezes05') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 5
    }else if (valor === 'vezes06') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 6
    }else if (valor === 'vezes07') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 7
    }else if (valor === 'vezes08') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 8
    }else if (valor === 'vezes09') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 9
    }else if (valor === 'vezes00') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = getRandomNumber(0, 10)
    }else if (valor === 'dividir01') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 1
    }else if (valor === 'dividir02') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 2
    }else if (valor === 'dividir03') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 3
    }else if (valor === 'dividir04') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 4
    }else if (valor === 'dividir05') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 5
    }else if (valor === 'dividir06') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 6
    }else if (valor === 'dividir07') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 7
    }else if (valor === 'dividir08') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 8
    }else if (valor === 'dividir09') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 9
    }else if (valor === 'dividir00') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = getRandomNumber(0, 10)
    }else if (valor === 'todas01') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 1
    }else if (valor === 'todas02') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 2
    }else if (valor === 'todas03') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 3
    }else if (valor === 'todas04') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 4
    }else if (valor === 'todas05') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 5
    }else if (valor === 'todas06') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 6
    }else if (valor === 'todas07') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 7
    }else if (valor === 'todas08') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 8
    }else if (valor === 'todas09') {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = 9
    } else {
      numerador.innerHTML = getRandomNumber(0, 10)
      denominador.innerHTML = getRandomNumber(0, 10)
    }
  }

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

  document.addEventListener("DOMContentLoaded", () => {
    submenu.forEach((item) => {
      item.addEventListener("click", () => {
        selectedValue = item.getAttribute("value")
        sinal.innerHTML=''
        criarSinal(selectedValue)
      })
    })
})
criaTabuada = () => {
  sinal.innerHTML=""
  criarSinal(selectedValue)
  cociente(valor)
  resultado.value = null
}
criaTabuada();