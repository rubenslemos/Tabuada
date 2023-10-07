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
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    response.statusCode
    if (response.status === 200) {
      const { token } = await response.json()
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
        console.log('Logado com Sucesso');
      } else {
        console.error('Erro ao receber o Token');
      }

      cadastro.close()
      login.classList.add('fechado')

    } else {
      console.error('Erro ao logar');
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
  console.log(formData)
    try {
      const response = await fetch('/auth/login/reset_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, password }),
      });
      response.statusCode
      if (response.status === 200) {
        alert('Senha Alterada')
        recuperar.close()
      } else {
        alert('Erro ao recuperar senha')
        console.error('Erro ao recuperar senha')
      }
    } catch (error) {
      console.error('Erro ao enviar os dados do formulário', error);
    }
   }
alterar.addEventListener('click', alterarSenha)
confirmAlterar.addEventListener('keypress', (e)=>{
  if(e.key === 'Enter') alterarSenha(e)
})
})