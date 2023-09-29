document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('formLogin')
  const confirmLogin = document.getElementById('confirmLogin')
  const registrar = document.getElementById('registrar')
  const esqueceu = document.getElementById('esqueceu')
  const cadastro = document.getElementById('cadastro')
  const login = document.getElementById('login')
 registrar.addEventListener('click', ()=>{
  login.close()
  login.classList.add('fechado')
  cadastro.classList.remove('fechado')
 }) 

 confirmLogin.addEventListener('click', async function () {
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

    if (response.status === 201) {
      login.classList.add('fechado')
      cadastro.close()

    } else {
      console.error('Erro ao logar');
    }
  } catch (error) {
    console.error('Erro ao enviar os dados do formulário', error);
  }
 })
})