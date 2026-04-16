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
})
