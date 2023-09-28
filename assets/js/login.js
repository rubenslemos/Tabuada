document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('formLogin')
  const confirmLogin = document.getElementById('confirmLogin')
  const registrar = document.getElementById('registrar')
  const esqueceu = document.getElementById('esqueceu')
  cadastro.close()

 registrar.addEventListener('click', ()=>{
  login.close()
  cadastro.removeAttribute('fechado')
  cadastro.showModal()
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
      login.close()
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