document.addEventListener('DOMContentLoaded', ()=>{
  // ============= PÁGINA DE LOGIN =============
  const formLogin = document.getElementById('formLogin')
  const confirmLogin = document.getElementById('confirmLogin')
  const passwordLogin = document.getElementById('passwordLogin')
  const esqueceu = document.getElementById('esqueceu')
  const emailLogin = document.getElementById('emailLogin')

  if (formLogin && confirmLogin) {
    async function fazerLogin (e) {
      e.preventDefault()
      const formData = new FormData(formLogin)
      const email = formData.get('email');
      const password = formData.get('password');
      const loginError = document.createElement('small')
      loginError.classList.add('erroLogin')
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (response.status === 200) {
          const { user, token, totalJogos, totalAcertos, totalErros } = await response.json()

          localStorage.setItem('token', token);
          localStorage.setItem('userId', user._id);
          localStorage.setItem('userName', user.name);
          localStorage.setItem('tipoUsuario', user.tipo)
          localStorage.setItem('turma', user.turma);
          localStorage.setItem('totalJogos', totalJogos);
          localStorage.setItem('totalAcertos', totalAcertos);
          localStorage.setItem('totalErros', totalErros);

          window.location.href = '/tabuada'
        } else {
          const errorExistente = formLogin.querySelector('.erroLogin');
          if (errorExistente) errorExistente.remove();
          loginError.innerText = 'E-mail e/ou senha Errados, tente novamente'
          formLogin.insertBefore(loginError, esqueceu)
        }
      } catch (error) {
        console.error('Erro ao enviar os dados do formulário', error);
      }
    }

    confirmLogin.addEventListener('click', fazerLogin)
    if (passwordLogin) {
      passwordLogin.addEventListener('keypress', (e)=>{
        if(e.key ==='Enter') fazerLogin(e)
      })
    }
  }

  if (esqueceu) {
    esqueceu.addEventListener('click', (e)=>{
      e.preventDefault()
      window.location.href = '/forgot-password'
    })
  }

  // ============= PÁGINA DE RECUPERAÇÃO DE SENHA =============
  const formVerificar = document.getElementById('formVerificar')
  const verifyEmail = document.getElementById('verifyEmail')
  const emailCheck = document.getElementById('emailCheck')

  if (formVerificar && verifyEmail) {
    async function verificarEmail (e) {
      e.preventDefault()
      const formData = new FormData(formVerificar)
      const emailValue = formData.get('emailCheck');
      
      try {
        const response = await fetch('/auth/login/forgot_password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailValue }),
        });
        
        if (response.status === 200) {
          const data = await response.json()
          localStorage.setItem('resetToken', data.token)
          localStorage.setItem('resetEmail', emailValue)
          window.location.href = '/reset-password'
        } else {
          alert('Erro ao enviar e-mail')
          console.error('Erro ao enviar e-mail')
        }
      } catch (error) {
        console.error('Erro ao enviar os dados do formulário', error);
      }
    }
    
    verifyEmail.addEventListener('click', verificarEmail)
    if (emailCheck) {
      emailCheck.addEventListener('keypress', (e)=>{
        if(e.key === 'Enter') verificarEmail(e)
      })
    }
  }

  // ============= PÁGINA DE ALTERAÇÃO DE SENHA =============
  const formAlterar = document.getElementById('formAlterar')
  const alterarSenha = document.getElementById('alterarSenha')
  const tokenInput = document.getElementById('token')
  const emailAlterar = document.getElementById('emailAlterar')
  const ConfirmPasswordAlterar = document.getElementById('ConfirmPasswordAlterar')

  if (formAlterar && alterarSenha) {
    const resetToken = localStorage.getItem('resetToken')
    const resetEmail = localStorage.getItem('resetEmail')
    
    if (tokenInput) tokenInput.value = resetToken || ''
    if (emailAlterar) emailAlterar.value = resetEmail || ''

    async function alterarSenhaFunc (e) {
      e.preventDefault()
      const formData = new FormData(formAlterar)
      const email = formData.get('emailAlterar')
      const token = formData.get('token')
      const password = formData.get('passwordAlterar')
      const confirmPass = formData.get('ConfirmPasswordAlterar')

      try {
        const response = await fetch('/auth/login/reset_password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, token, password, confirmPass }),
        });
        
        const data = await response.json()
        const mensagem = data.Msg
        
        if (response.status === 200) {
          mostrarMsgSucesso(mensagem)
          setTimeout(() => {
            localStorage.removeItem('resetToken')
            localStorage.removeItem('resetEmail')
            window.location.href = '/login'
          }, 2000)
        }else {
          mostrarMsgErro(mensagem)
        }
      } catch (error) {
        console.error('Erro ao enviar os dados do formulário', error);
      }
    }

    function mostrarMsgSucesso(mensagem) {
      const mensagemSucesso = document.createElement('small')
      mensagemSucesso.classList.add('senhaOk')
      mensagemSucesso.innerHTML = mensagem
      const btnDiv = formAlterar.querySelector('.btnAlterarSenha')
      if (btnDiv) formAlterar.insertBefore(mensagemSucesso, btnDiv)
    }
    
    function mostrarMsgErro(mensagem) {
      const mensagemErro = document.createElement('small')
      mensagemErro.classList.add('senhaError')
      mensagemErro.innerHTML = mensagem
      const btnDiv = formAlterar.querySelector('.btnAlterarSenha')
      if (btnDiv) formAlterar.insertBefore(mensagemErro, btnDiv)
      setTimeout(()=>{
        mensagemErro.remove()
      },5000)
    }

    alterarSenha.addEventListener('click', alterarSenhaFunc)
    if (ConfirmPasswordAlterar) {
      ConfirmPasswordAlterar.addEventListener('keypress', (e)=>{
        if(e.key === 'Enter') alterarSenhaFunc(e)
      })
    }
  }

  // ============= FUNCIONALIDADES DE LOGOUT =============
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault()
      localStorage.clear()
      window.location.href = '/login'
    })
  }
  const formPermissoes = document.getElementById('formPermissoes')

  if (formPermissoes) {
    async function listarUsers() { 
      const token = localStorage.getItem('token'); // Obtém o token armazenado
      const turma = localStorage.getItem('turma'); 
      const alunosSelect = document.getElementById('alunos'); 
      
      // Verifique se o elemento existe
      if (!alunosSelect) { 
        console.error('Elemento alunosSelect não encontrado no DOM'); 
        return; 
      } 

      try { 
        const response = await fetch('/auth/register', { 
          method: 'GET', 
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}`, // Inclui o token no cabeçalho 
          }, 
        });

        if (response.ok) { 
          const alunos = await response.json(); 
          // Limpa as opções anteriores para evitar duplicação
          alunosSelect.innerHTML = '';

          const alunosDaMesmaTurma = alunos.filter(aluno => aluno.tipo === 'Aluno' && aluno.turma === turma);
          // **Adicionado: Adiciona uma opção placeholder**
          const placeholderOption = document.createElement('option');
          placeholderOption.value = '';
          placeholderOption.disabled = true;
          placeholderOption.selected = true;
          placeholderOption.text = 'Selecione um aluno';
          alunosSelect.appendChild(placeholderOption);

          // Verifica se existem alunos na turma
          if (alunosDaMesmaTurma.length > 0) {
          // Adiciona as opções dos alunos no select
            alunosDaMesmaTurma.forEach(aluno => { 
              const option = document.createElement('option'); 
              option.value = aluno._id; 
              option.text = aluno.name; 
              alunosSelect.appendChild(option); 
            });
          } else {
              console.warn('Nenhum aluno encontrado para a turma especificada.');
            }
        } else { 
          // Tente obter a mensagem de erro do backend
          const errorData = await response.json(); 
          console.error('Erro ao obter a lista de alunos:', errorData.error || response.statusText); 
          alert(errorData.error || 'Erro ao obter a lista de alunos'); 
        } 
      } catch (error) { 
        console.error('Erro ao enviar solicitação:', error); 
        alert('Erro ao enviar solicitação para listar alunos'); 
      } 
    }

    // Carregar alunos quando a página carrega
    listarUsers()
    
    formPermissoes.addEventListener('submit', async function acesso (e) {
      e.preventDefault();
     
      const alunoId = document.getElementById('alunos').value;
      const soma = document.getElementById('somaAcesso').checked || false
      const menos = document.getElementById('menosAcesso').checked || false
      const vezes = document.getElementById('vezesAcesso').checked || false
      const dividir = document.getElementById('dividirAcesso').checked || false
      const todas = document.getElementById('todasAcesso').checked || false
    
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
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ alunoId, tipoUsuario, acessos }),
        });
    
        if (response.status === 200) {
          alert('Permissões concedidas com sucesso');
          window.location.href = '/tabuada'
        } else {
          const data = await response.json();
          console.error('Erro ao conceder permissões:', data.message);
          alert('Erro ao conceder permissões: ' + data.message);
        }
      } catch (error) {
        console.error('Erro ao enviar solicitação:', error);
        alert('Erro ao enviar solicitação');
      }
    })
  }

  // ============= PRÊMIOS NO HEADER =============
  const premiosHeader = document.querySelector('.premios-header');
  if (premiosHeader) {
    criaPremios();
  }

  // Preencher nome do usuário se ele não aparecer do Handlebars
  const userName = document.querySelector('.user-name');
  if (userName) {
    const nameFromStorage = localStorage.getItem('userName');
    if (nameFromStorage) {
      userName.textContent = `Olá, ${nameFromStorage}`;
    }
  }

  function criaPremios() {
    let estrelaHTML = document.getElementById('estrela');
    let downThumbHTML = document.getElementById('downThumb');
    let nivelHTML = document.getElementById('nivel');
    let resultados = document.querySelector('.premios');

    let totalAcertos = parseInt(localStorage.getItem('totalAcertos') );
    let totalErros = parseInt(localStorage.getItem('totalErros') );
    let totalJogos = parseInt(localStorage.getItem('totalJogos') );

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
    let estrela = isNaN(totalAcertos) ? 0 : Math.floor(totalAcertos / 10);
    let downThumb = isNaN(totalErros) ? 0 : Math.floor(totalErros / 10);
    let nivel = isNaN(totalJogos) ? 0 : Math.floor(totalJogos / 100);
    
    localStorage.setItem('estrela', parseInt(estrela))
    localStorage.setItem('downThumb', parseInt(downThumb))
    localStorage.setItem('Nivel', parseInt(nivel))

    estrelaHTML.innerHTML = `<i class="fa-solid fa-star" title="A cada 10 acertos ganhe 1 estrelinha"></i><i>${estrela.toFixed(0)}</i>`;
    downThumbHTML.innerHTML = `<i class="fa-solid fa-thumbs-down" title="A cada 10 erros ganhe 1 Falhou"></i><i>${downThumb.toFixed(0)}</i>`;
    nivelHTML.innerHTML = `<i class="fa-solid fa-calculator" title="A cada 100 acertos ganhe 1 Calculadora"></i><i>${nivel.toFixed(0)}</i>`;

    resultados.appendChild(estrelaHTML);
    resultados.appendChild(downThumbHTML);
    resultados.appendChild(nivelHTML);

    premiosHeader.appendChild(resultados);
  
    return nivel; 	
  }
})
