
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
  const divResultado = document.createElement('div');
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
    let erradas
    containerSection.insertBefore(divResultado, resultadosSection);
    resultadosSection.innerHTML = ''
    
    const tituloPreenchido = containerSection.querySelector('h3')

    if (tituloPreenchido) {
      tituloPreenchido.remove();
    }
    let titulo
    titulo = document.createElement('h3')
    titulo.setAttribute('id', 'titulo')
    titulo.innerText = 'Resultados'
    containerSection.insertBefore(titulo, divResultado);

    
    fecharResultados.classList.add('btn', 'btnFechar');
    fecharResultados.innerText = 'Fechar';
    containerSection.appendChild(fecharResultados);
    
    if(user.rounds.length === 0) {
      const mensagemDiv = document.createElement('div')
      mensagemDiv.classList.add('mensagemDiv')
      const mensagem = document.createElement('p')
      mensagem.classList.add('mensagem')
      mensagem.innerText = 'Ainda não existem rodadas para este usuário'
      mensagemDiv.appendChild(mensagem)
      resultadosSection.appendChild(mensagemDiv)
      return
    }
    
    user.rounds.forEach((round, index) => {
      if(round.jogou === undefined || round.jogou < 0) round.jogou = 0
      if(round.acerto === undefined || round.acerto < 0) round.acerto = 0
      if(round.errou === undefined || round.errou < 0) round.errou = 0
      aproveitamento = ((100*round.acerto)/round.jogou).toFixed(0)
      erradas = ((100*round.errou)/round.jogou).toFixed(0)
      if (aproveitamento <= 0 || isNaN(aproveitamento)) aproveitamento = 0
      if (erradas <= 0 || isNaN(erradas)) erradas = 0
      const elemento1 = `Rodada ${index + 1}`
      const elemento2 = `Jogou: ${round.jogou}`
      const elemento3 = `Acertou: ${round.acerto}`
      const elemento4 = `Errou: ${round.errou}`
      const elemento5 = `Acertos (%): ${aproveitamento}`
      const elemento7 = `Erros (%): ${erradas}`
            
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
        
      const elemento6P = document.createElement('button')
      elemento6P.classList.add('btnContagem')
      elemento6P.innerText = "Mais Detalhes"
      elemento6P.value = round._id
      elemento6P.addEventListener('click',async ()=>{
        abrirModal(elemento5, elemento7, event, index)
      })
      rodadaDiv.appendChild(elemento6P)


      resultadosSection.appendChild(rodadaDiv)
    });
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
        if (user.tipo === 'Professor') {
          try {
            const response = await fetch('/auth/register', {
                method: 'GET',
            });

          if (response.status === 200) {
            const usersData = await response.json();
            const users = usersData;
            const containerResultados = document.querySelector('.containerResultados');
        
            divResultado.className = 'resultadoDiv';
            divResultado.innerHTML = `
              <label for="alunos" class="labelResultado">Selecione um Usuario:</label>
              <select id="alunos" name="alunos" class="listaResultados">
                <option value="" disabled selected>${'Logado: ' + user.name}</option>
                ${users.map(user => `<option value="${user._id}">${user.name}</option>`).join('')}
              </select>
            `;
          const result = document.querySelector('.resultados')
          containerResultados.insertBefore(divResultado, result);
          const selectAlunos = document.getElementById('alunos')
          selectAlunos.addEventListener('change', function() {
            const selectedUserId = selectAlunos.value;
            const selectedUser = users.find(user => user._id === selectedUserId)
            preencherResultadosNoHTML(selectedUser);
          });
          } else {
            console.error('Erro ao obter dados do usuário');
          }
    } catch (error) { 
      console.error('Erro ao obter dados do usuário', error);
    }}
      } else {
        console.error('Erro ao obter dados do usuário');
      }
    } catch (error) {
        console.error('Erro ao obter dados do usuário', error);
    }
  }

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

  async function abrirModal (acertos, erros, event, index ) {
    const roundId = event.target.value;

    try {
      const response = await fetch(`/round/${roundId}`); // Fazendo a requisição com o round._id
      const data= await response.json();
      const contagemOperacoes = data.round.contagemOperacoes.contagemOperacoes
      const modal = document.getElementById('contagens');
      const adicao = contagemOperacoes.faPlus;
      const subtracao = contagemOperacoes.faMinus;
      const multiplicacao = contagemOperacoes.faTimes;
      const divisao = contagemOperacoes.faDivide;
      const tituloDetalhes = document.querySelector('.containerContagens h1')
      const adicaoElement = document.querySelector('.eContagens:nth-child(1)');
      const subtracaoElement = document.querySelector('.eContagens:nth-child(2)');
      const multiplicacaoElement = document.querySelector('.eContagens:nth-child(3)');
      const divisaoElement = document.querySelector('.eContagens:nth-child(4)');
      const acertosElement = document.querySelector('.eContagens:nth-child(5)');
      const errosElement = document.querySelector('.eContagens:nth-child(6)');
  
      adicaoElement.textContent = `Adição: ${adicao}`;
      subtracaoElement.textContent = `Subtração: ${subtracao}`;
      multiplicacaoElement.textContent = `Multiplicação: ${multiplicacao}`;
      divisaoElement.textContent = `Divisão: ${divisao}`;
      acertosElement.textContent = acertos
      errosElement.textContent = erros
      tituloDetalhes.innerText = `Detalhes Rodada ${index+1}`
      modal.showModal();
    } catch (error) {
      console.error('Erro ao obter detalhes do round', error);
    }
}

document.querySelector('.btnContagens').addEventListener('click', () => {
    const modal = document.getElementById('contagens');
    modal.close();
});
  

})
