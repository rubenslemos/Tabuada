document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('formLogin')
  const confirmLogin = document.getElementById('confirmLogin')
  const registrar = document.getElementById('registrar')
  const esqueceu = document.getElementById('esqueceu')
  const cadastro = document.getElementById('cadastro')
  const login = document.getElementById('login')
  const senha = document.getElementById('passwordLogin')
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
        console.log('Logado com Sucesso');
      } else {
        console.error('Erro ao receber o Token');
      }

      login.classList.add('fechado');
      cadastro.close();
    } else {
      console.error('Erro ao logar');
    }
  } catch (error) {
    console.error('Erro ao enviar os dados do formulário', error);
  }
 }
 confirmLogin.addEventListener('click', fazerLogin)
 senha.addEventListener('keypress', (e)=>{
  if(e.key ==='Enter'){
    fazerLogin(e)
  }
 })
})