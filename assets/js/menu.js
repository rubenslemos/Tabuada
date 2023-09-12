const navList = document.querySelector('.nav-list');

navList.addEventListener('click', function (event) {
  const target = event.target;

  // Verifica se o elemento clicado é um link do submenu
  if (target.classList.contains('somar') || target.classList.contains('menos') ||
      target.classList.contains('vezes') || target.classList.contains('dividir') ||
      target.classList.contains('todas')) {

    event.preventDefault(); // Impede que o link redirecione

    const valor = target.getAttribute('value');
    console.log('Link clicado:', valor); // Faça algo com o valor aqui
  }

  // Verifica se o elemento clicado é um título de menu
  if (target.classList.contains('menu')) {
    const submenu = target.querySelector('.submenu');
    submenu.classList.toggle('mostra');
  }
});
