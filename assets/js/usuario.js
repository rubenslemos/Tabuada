
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('usuario');
  const enviarBotao = document.getElementById('enviarFormulario');
  const cadastro = document.getElementById('cadastro')
  const login = document.getElementById('login')
  enviarBotao.addEventListener('click', async function () {

    const formData = new FormData(form);
    const tipo = formData.get('tipo');
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, name, email, password, confirmPassword }),
      });

      if (response.status === 201) {
        cadastro.classList.add('fechado')
        cadastro.close()
        login.classList.remove('fechado')
        console.log('Usuário criado com sucesso');
      } else {
        console.error('Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao enviar os dados do formulário', error);
    }
  });
});
