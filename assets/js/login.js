document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('formLogin')
  const formVerificar = document.getElementById('formVerificar')
  const formAlterar = document.getElementById('formAlterar')
  const confirmLogin = document.getElementById('confirmLogin')
  const registrar = document.getElementById('registrar')
  const esqueceu = document.getElementById('esqueceu')
  const cadastro = document.getElementById('cadastro')
  const login = document.getElementById('login')
  const senha = document.getElementById('passwordLogin')
  const recuperar = document.getElementById('recuperar')
  const trocar = document.getElementById('trocar')
  const verificar = document.getElementById('verifyEmail')
  const email = document.getElementById('emailCheck')
  const confirmAlterar = document.getElementById('ConfirmPasswordAlterar')
  const alterar = document.getElementById('alterarSenha')
  const tokenSenha = document.getElementById('token')
  const voltarSenha = document.getElementById('voltarSenha')
  const cancelaEmail = document.getElementById('cancelaEmail')
  const usuario = document.querySelector('.usuario')
  const resultados = document.getElementById('resultados')
  const erroSenha = formAlterar.querySelector('.btnAlterarSenha')
  const nav = document.querySelector('.nav-list')
  const acompanhamento = document.getElementById('acompanhamento')
  cancelaEmail.addEventListener('click', ()=>{
    trocar.classList.remove('aberto')
    trocar.classList.add('fechado')
    trocar.close()
  })
  voltarSenha.addEventListener('click', ()=>{
    recuperar.classList.remove('aberto')
    recuperar.classList.add('fechado')
    recuperar.close()
  })
 registrar.addEventListener('click', ()=>{
  login.close()
  login.classList.add('fechado')
  cadastro.classList.remove('fechado')
 }) 
 async function fazerLogin (e) {
  e.preventDefault()
  const formData = new FormData(form)
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
      const { user, token } = await response.json()
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      localStorage.setItem('tipoUsuario', user.tipo)
      const resAuth = await fetch ('/auth/login/token',{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })
      if (resAuth.status === 200) {
        recuperar.classList.remove('aberto')
        recuperar.classList.add('fechado')
        trocar.classList.remove('aberto')
        trocar.classList.add('fechado')
        recuperar.close()
        trocar.close()
        resultados.close()
        const nome = user.name.replace(/(^\w{1})|(\s+\w{1})/g, letra => letra.toUpperCase())
        usuario.innerText = `${nome} fez:`
        cadastro.close()
        login.classList.add('fechado')
        if (user.tipo === 'Professor'){
          const li = document.createElement('li')
          li.setAttribute('class', 'menu')
          li.setAttribute('id', 'controle')
          li.setAttribute('style',"animation: 0.3s ease 0.7s 1 normal forwards running navLinkFade")
          const permissao = document.createElement('a')
          permissao.setAttribute('href', '#')
          permissao.setAttribute('id', 'permissao')
          permissao.innerText = 'Permissão'
          li.appendChild(permissao)
          nav.insertBefore(li, acompanhamento)
        }
      }
      } else {
        const errorExistente = form.querySelector('.erroLogin');
        if (errorExistente) errorExistente.remove();
        loginError.innerText = 'E-mail e/ou senha Errados, tente novamente'
        form.insertBefore(loginError, esqueceu)
      }
  } catch (error) {
      console.error('Erro ao enviar os dados do formulário', error);
    }
 }
 confirmLogin.addEventListener('click', fazerLogin)
 senha.addEventListener('keypress', (e)=>{
  if(e.key ==='Enter') fazerLogin(e)
 })
 esqueceu.addEventListener('click', ()=> {
  trocar.classList.remove('fechado')
  trocar.classList.add('aberto')
  trocar.showModal()
 })
 async function verificarEmail (e) {
  e.preventDefault()
  const formData = new FormData(formVerificar)
  const email = formData.get('emailCheck');
  try {
    const response = await fetch('/auth/login/forgot_password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    response.statusCode
    if (response.status === 200) {
      const data = await response.json()
      tokenSenha.value = data.token
      recuperar.classList.remove('fechado')
      recuperar.classList.add('aberto')
      trocar.close()
      recuperar.showModal()
    } else {
      alert('Erro ao enviar e-mail')
      console.error('Erro ao enviar e-mail')
    }
  } catch (error) {
    console.error('Erro ao enviar os dados do formulário', error);
  }
 }
verificar.addEventListener('click', verificarEmail)
email.addEventListener('keypress', (e)=>{
  if(e.key === 'Enter') verificarEmail(e)
})
async function alterarSenha (e) {
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
    formAlterar.insertBefore(mensagemSucesso, erroSenha)
    setTimeout(() => {
      mensagemSucesso.remove();
      recuperar.close()
    }, 5000);
  }
  
  function mostrarMsgErro(mensagem) {
    const mensagemErro = document.createElement('small')
    mensagemErro.classList.add('senhaError')
    mensagemErro.innerHTML = mensagem
    formAlterar.insertBefore(mensagemErro, erroSenha)
    setTimeout(()=>{
      mensagemErro.remove()
    },5000)
  }

alterar.addEventListener('click', alterarSenha)
confirmAlterar.addEventListener('keypress', (e)=>{
  if(e.key === 'Enter') alterarSenha(e)
})
})




