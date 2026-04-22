document.addEventListener("DOMContentLoaded", function () {
  const resultadosDiv = document.getElementById('resultados'); // Agora é uma div, não dialog
 const userId = localStorage.getItem('userId');
  if (userId) {
    criaResultado(userId);
  } else {
    console.error('Usuário não encontrado');
  }
  // Botão "Fechar" só para o modal de contagens
  const btnContagens = document.querySelector('.btnContagens');
  if (btnContagens) {
    btnContagens.addEventListener('click', () => {
      const modal = document.getElementById('contagens');
      modal.close();
    });
  }

  function preencherResultadosNoHTML(user) {
    if (!user) {
      console.error('Usuário indefinido ao tentar preencher resultados');
      return;
    }
    const containerResultado = document.querySelector('.containerResultado');
    const containerSection = containerResultado.querySelector('.containerResultados');
    const resultadosSection = containerSection.querySelector('.resultados-lista');

    // Limpa antes de inserir
    resultadosSection.innerHTML = '';

    // Remove título antigo se existir
    const tituloPreenchido = containerSection.querySelector('h3');
    if (tituloPreenchido) tituloPreenchido.remove();

    // Cria título
    let titulo = document.createElement('h3');
    titulo.setAttribute('id', 'titulo');
    titulo.innerText = 'Resultados';
    containerSection.insertBefore(titulo, resultadosSection);

    if (!user.rounds || user.rounds.length === 0) {
      const mensagemDiv = document.createElement('div');
      mensagemDiv.classList.add('mensagemDiv');
      const mensagem = document.createElement('p');
      mensagem.classList.add('mensagem');
      mensagem.innerText = 'Ainda não existem rodadas para este usuário';
      mensagemDiv.appendChild(mensagem);
      resultadosSection.appendChild(mensagemDiv);
      return;
    }

    user.rounds.forEach((round, index) => {
      let aproveitamento = ((100 * (round.acerto || 0)) / (round.jogou || 1)).toFixed(0);
      let erradas = ((100 * (round.errou || 0)) / (round.jogou || 1)).toFixed(0);
      if (aproveitamento <= 0 || isNaN(aproveitamento)) aproveitamento = 0;
      if (erradas <= 0 || isNaN(erradas)) erradas = 0;

      const rodadaDiv = document.createElement('div');
      rodadaDiv.classList.add('rodada');
      rodadaDiv.innerHTML = `
        <p class="elemento">Rodada ${index + 1}</p>
        <p class="elemento">Jogou: ${round.jogou}</p>
        <p class="elemento">Acertou: ${round.acerto}</p>
        <p class="elemento">Errou: ${round.errou}</p>
        <button class="btnContagem" value="${round._id}">Mais Detalhes</button>
      `;
      resultadosSection.appendChild(rodadaDiv);

      rodadaDiv.querySelector('.btnContagem').addEventListener('click', function (event) {
        abrirModal(`Acertos (%): ${aproveitamento}`, `Erros (%): ${erradas}`, event, index);
      });
    });
  }

/*   async function criaResultado(userId) {
    try {
      const response = await fetch(`/auth/login/${userId}`, { method: 'GET' });
      if (response.ok) {
        const userData = await response.json();
        const user = userData.user || userData;
        preencherResultadosNoHTML(user);
      } else {
        console.error('Erro ao obter dados do usuário:', response.status, response.statusText);
        alert('Erro ao obter seus dados. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário', error);
      alert('Erro ao obter seus dados. Tente novamente.');
    }
  } */
// ... código anterior ...

  async function criaResultado(userId) {
    try {
      // Faz a requisição para obter os dados do usuário logado
      const response = await fetch(`/auth/login/${userId}`, { 
        method: 'GET',
      });

      if (response.ok) {
        const userData = await response.json();
        const user = userData.user || userData;
        // Garante que 'user' esteja definido
        const containerResultados = document.querySelector('.containerResultados');
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
              const users = usersData;
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
                  selectedUser = alunosDaMesmaTurma.find(aluno => aluno._id === selectedUserId);
                } else if (user.tipo === 'Coordenador') {
                  selectedUser = users.find(user => user._id === selectedUserId);
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

// ... código posterior ...
  async function abrirModal(acertos, erros, event, index) {
    const roundId = event.target.value;
    try {
      const response = await fetch(`/round/${roundId}`);
      const data = await response.json();
      const contagemOperacoes = data.round.contagemOperacoes.contagemOperacoes;
      const modal = document.getElementById('contagens');
      const tituloDetalhes = document.querySelector('.containerContagens h1');
      const contagens = Array.from(document.querySelectorAll('.eContagens'));
      if (contagens.length >= 6) {
        contagens[0].textContent = `Adição: ${contagemOperacoes.faPlus}`;
        contagens[1].textContent = `Subtração: ${contagemOperacoes.faMinus}`;
        contagens[2].textContent = `Multiplicação: ${contagemOperacoes.faTimes}`;
        contagens[3].textContent = `Divisão: ${contagemOperacoes.faDivide}`;
        contagens[4].textContent = acertos;
        contagens[5].textContent = erros;
      }
      tituloDetalhes.innerText = `Detalhes Rodada ${index + 1}`;
      modal.showModal();
    } catch (error) {
      console.error('Erro ao obter detalhes do round', error);
    }
  }
});