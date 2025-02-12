
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
    const turma = formData.get('turma')
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
        body: JSON.stringify({ tipo, name, email, password, confirmPassword, turma }),
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
    }, 3000);
  }
  
  function mostrarMsgErro(mensagem) {
    const mensagemErro = document.createElement('small')
    mensagemErro.classList.add('senhaError')
    mensagemErro.innerHTML = mensagem
    form.insertBefore(mensagemErro, erroCadastro)
    setTimeout(()=>{
      mensagemErro.remove()
    },3000)
  }

  enviarBotao.addEventListener('click', criarUsuario)

  enviar.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
      criarUsuario(e)
    }
  })
  
  function preencherResultadosNoHTML(user) {
    if (!user) {
      console.error('Usuário indefinido ao tentar preencher resultados');
      return; // Sai da função se 'user' estiver indefinido
    }
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
      async function criaResultado(userId) {
      try {
          // Faz a requisição para obter os dados do usuário logado
          const response = await fetch(`/auth/login/${userId}`, { 
              method: 'GET',
          });
    
          if(response.ok){ // Alteração: Verifica se a resposta é bem-sucedida
              const userData = await response.json();
              const user = userData.user || userData;
              // Ajuste para garantir que 'user' esteja definido
              const containerResultados = document.querySelector('.containerResultados');
              //containerResultados.innerHTML = '';
              preencherResultadosNoHTML(user);
              if (user.tipo === 'Professor' || user.tipo === 'Coordenador') {
                  try {
                      const token = localStorage.getItem('token'); // Obtém o token armazenado
    
                      const response = await fetch('/auth/register', {
                          method: 'GET',
                          headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`, // Inclui o token no cabeçalho
                          },
                      });
    
                      if (response.status === 200) {
                          const usersData = await response.json();
                          console.log('usersData: ',usersData)
                          const users = usersData;
                          console.log('users: ',users)
                          let optionsHTML = '';

                          if (user.tipo === 'Professor') {
                              // Filtra os alunos da mesma turma
                              const alunosDaMesmaTurma = users.filter(u => u.tipo === 'Aluno' && u.turma === user.turma);
                              optionsHTML = `
                                  <option value="${user._id}" selected>${'Logado: ' + user.name}</option>
                                  ${alunosDaMesmaTurma.map(aluno => `<option value="${aluno._id}">${aluno.name}</option>`).join('')}
                              `;
                          } else if (user.tipo === 'Coordenador') {
                              // Usa os próprios dados do usuário
                              optionsHTML = `                                  
                                  <option value="${user._id}" selected>${'Logado: ' + user.name}</option>
                                  ${users.map(aluno => `<option value="${aluno._id}">${aluno.name}</option>`).join('')}
                              `;
                          }
                      
                          // Remove a antiga div de resultados, se existir
                          const divResultadoAntigo = containerResultados.querySelector('.resultadoDiv');
                          if (divResultadoAntigo) {
                              divResultadoAntigo.remove();
                          }
                      
                          // Cria a nova div com os resultados
                          const divResultado = document.createElement('div');
                          divResultado.className = 'resultadoDiv';
                          divResultado.innerHTML = `
                              <label for="alunos" class="labelResultado">Selecione um Usuário:</label>
                              <select id="alunos" name="alunos" class="listaResultados">
                                  ${optionsHTML}
                              </select>
                          `;
    
                          const result = document.querySelector('.resultados');
                          containerResultados.insertBefore(divResultado, result);
    
                          const selectAlunos = document.getElementById('alunos');
                          selectAlunos.addEventListener('change', function() {
                              const selectedUserId = selectAlunos.value;
                              let selectedUser;
                              if (selectedUserId === user._id) {
                                  selectedUser = user;
                              } else if (user.tipo === 'Professor') {
                                const alunosDaMesmaTurma = users.filter(u => u.tipo === 'Aluno' && u.turma === user.turma);
                                  selectedUser = alunosDaMesmaTurma.find(aluno => aluno._id === selectedUserId); // Busca o aluno selecionado
                              } else if (user.tipo === 'Coordenador') {
                                  selectedUser = users.find(user => user._id === selectedUserId); // Busca o aluno selecionado
                              }
                          
                              if (selectedUser) {
                                  preencherResultadosNoHTML(selectedUser);
                              } else {
                                  console.error('Usuário selecionado não encontrado');
                              }
                          });
                      } else {
                          console.error('Erro ao obter dados dos alunos:', response.status, response.statusText);
                          alert('Erro ao obter a lista de alunos da sua turma.');
                      }
                  } catch (error) { 
                      console.error('Erro ao obter dados dos alunos', error);
                      alert('Erro ao obter a lista de alunos da sua turma.');
                  }
              }
          } else {
              console.error('Erro ao obter dados do usuário:', response.status, response.statusText);
              alert('Erro ao obter seus dados. Tente novamente.');
          }
      } catch (error) {
          console.error('Erro ao obter dados do usuário', error);
          alert('Erro ao obter seus dados. Tente novamente.');
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
