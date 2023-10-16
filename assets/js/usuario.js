
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('usuario');
  const enviarBotao = document.getElementById('enviarFormulario');
  const cadastro = document.getElementById('cadastro')
  const login = document.getElementById('login')
  const cancelar = document.getElementById('cancelar')
  const enviar = document.getElementById('confirmPassword')
  const desempenho = document.getElementById('desempenho')
  const resultados = document.getElementById('resultados')
  const fecharResultados = document.createElement('button')
  const erroCadastro = document.getElementById('cadastrar')
  const permitir = document.getElementById('formPermissoes')

  resultados.open = false
  cancelar.addEventListener('click', ()=> {
    cadastro.classList.add('fechado')
    cadastro.close()
    login.classList.remove('fechado')
  })
  async function criarUsuario (e) {
    e.preventDefault()
    const formData = new FormData(form)
    const tipo = formData.get('tipo')
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')
    const cadastroError = document.createElement('small')
    cadastroError.classList.add('senhaError')
    const cadastroOk = document.createElement('small')
    cadastroOk.classList.add('senhaOk')
   
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, name, email, password, confirmPassword }),
      })
      const data = await response.json()
      mensagem = data.Msg
      if (response.status === 201) {
        mostrarMsgSucesso(mensagem)
      }else {
        mostrarMsgErro(mensagem)
      }
    } catch (error) {
      console.error('Erro ao enviar os dados do formulário', error)
    }
  };
  function mostrarMsgSucesso(mensagem) {
    const mensagemSucesso = document.createElement('small')
    mensagemSucesso.classList.add('senhaOk')
    mensagemSucesso.innerHTML = mensagem
    form.insertBefore(mensagemSucesso, erroCadastro)
    setTimeout(() => {
      cadastro.classList.add('fechado')
      cadastro.close()
      login.classList.remove('fechado')
      mensagemSucesso.remove()
    }, 5000);
  }
  
  function mostrarMsgErro(mensagem) {
    const mensagemErro = document.createElement('small')
    mensagemErro.classList.add('senhaError')
    mensagemErro.innerHTML = mensagem
    form.insertBefore(mensagemErro, erroCadastro)
    setTimeout(()=>{
      mensagemErro.remove()
    },5000)
  }
  enviarBotao.addEventListener('click', criarUsuario)
  enviar.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
      criarUsuario(e)
    }
  })
  function preencherResultadosNoHTML(user) {
    const containerResultado = document.querySelector('.containerResultado')
    const containerSection = containerResultado.querySelector('.containerResultados')
    const resultadosSection = containerSection.querySelector('.resultados')
    let aproveitamento
    resultadosSection.innerHTML = ''

   const tituloExistente = containerSection.querySelector('h1');
   if (tituloExistente) {
     tituloExistente.remove();
   }

   const titulo = document.createElement('h1');
   titulo.innerText = `Resultados: ${user.name.replace(/(^\w{1})|(\s+\w{1})/g, letra => letra.toUpperCase())}`;
   containerSection.insertBefore(titulo, resultadosSection);

   fecharResultados.classList.add('btn', 'btnFechar');
   fecharResultados.innerText = 'Fechar';
   containerSection.appendChild(fecharResultados);

    user.rounds.forEach((round, index) => {
      if(round.jogou === undefined) round.jogou = 0
      if(round.acerto === undefined) round.acerto = 0
        if(round.errou === undefined) round.errou = 0
        aproveitamento = ((100*round.acerto)/round.jogou).toFixed(0)
        if (aproveitamento <= 0 || isNaN(aproveitamento)) aproveitamento = 0
        const elemento1 = `Rodada ${index + 1}`
        const elemento2 = `Jogou: ${round.jogou}`
        const elemento3 = `Acertou: ${round.acerto}`
        const elemento4 = `Errou: ${round.errou}`
        const elemento5 = `Acertos (%): ${aproveitamento}`

        const rodadaDiv = document.createElement('div')
        rodadaDiv.classList.add('rodada')

        const elemento1P = document.createElement('p')
        elemento1P.classList.add('elemento')
        elemento1P.textContent = elemento1
        rodadaDiv.appendChild(elemento1P)

        const elemento2P = document.createElement('p')
        elemento2P.classList.add('elemento')
        elemento2P.textContent = elemento2
        rodadaDiv.appendChild(elemento2P)

        const elemento3P = document.createElement('p')
        elemento3P.classList.add('elemento')
        elemento3P.textContent = elemento3
        rodadaDiv.appendChild(elemento3P)
        
        const elemento4P = document.createElement('p')
        elemento4P.classList.add('elemento')
        elemento4P.textContent = elemento4
        rodadaDiv.appendChild(elemento4P)
        
        const elemento5P = document.createElement('p')
        elemento5P.classList.add('elemento')
        elemento5P.textContent = elemento5
        rodadaDiv.appendChild(elemento5P)
        
        resultadosSection.appendChild(rodadaDiv)
      });
      window.scrollTo({ top: 0, behavior: 'smooth' })
}
  async function criaResultado (userId) {
    const response = await fetch (`/auth/login/${userId}`,{ 
      method: 'GET',
    })
    try {
      if(response.status === 201){
        const userData = await response.json()
        const user = userData.user
        preencherResultadosNoHTML(user);
      } else {
        console.error('Erro ao obter dados do usuário');
      }
      
    } catch (error) { 
        console.error('Erro ao obter dados do usuário', error);
    }}

    desempenho.addEventListener('click', async (e) =>{
      e.preventDefault()
      const userId = localStorage.getItem('userId')
    
      if(userId){
        await criaResultado(userId)
        resultados.showModal()
      } else {
        console.error('Usuário não encontrado')
      }
    })
    
    fecharResultados.addEventListener('click', ()=>{
      resultados.close()
    })

permitir.addEventListener('submit', acesso(e))

async function acesso (e) {
  e.preventDefault();

  const soma = document.getElementById('soma').checked || false
  const menos = document.getElementById('menos').checked || false
  const vezes = document.getElementById('vezes').checked || false
  const dividir = document.getElementById('dividir').checked || false
  const todas = document.getElementById('todas').checked || false

  const tipoUsuario = localStorage.getItem('tipoUsuario');
  
  const acessos = { soma, menos, vezes, dividir, todas };

  try {
      const token = localStorage.getItem('token');
      if (!token) {
          console.error('Token de autenticação não encontrado.');
          return;
      }

      const response = await fetch('/acessos', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // Adicione o token de autorização, se necessário
          },
          body: JSON.stringify({ tipoUsuario, acessos }),
      });

      // Processar a resposta do servidor, se necessário
      if (response.status === 200) {
          console.log('Permissões concedidas com sucesso');
      } else {
          const data = await response.json();
          console.error('Erro ao conceder permissões:', data.message);
      }
  } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
  }
}
  
})
