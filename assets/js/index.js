document.addEventListener('click', async e => {
  const el = e.target;
  const tag = el.tagName.toLowerCase();
  if (tag === 'a') {
    e.preventDefault();
    carregaPagina(el);
  }
});

const carregaPagina = async el => {
  try {
    const href = el.getAttribute('href');
    const response = await fetch(href);
    if (response.status !== 200) throw new Error('Error 404 nosso');
    const html = await response.text();
    carregaResultado(html);
  } catch (e) {
    console.error(e);
  }
};

const carregaResultado = response => {
  const resultado = document.querySelector('#resultado');
  resultado.innerHTML = response;
}