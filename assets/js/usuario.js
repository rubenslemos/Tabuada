const cadastro = document.querySelector('.cadastro')
const login = document.querySelector('.login')
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('usuario');
  const enviarBotao = document.getElementById('enviarFormulario');

  enviarBotao.addEventListener('click', async function () {
    // Coletar os dados do formulário
    const formData = new FormData(form);
    const tipo = formData.get('tipo');
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');


    // Realizar validações personalizadas aqui, se necessário

    // Enviar os dados para a rota
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, name, email, password, confirmPassword }),
      });

      if (response.status === 201) {
        console.log('Usuário criado com sucesso');
        // Redirecionar ou executar outra ação, se necessário
      } else {
        console.error('Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao enviar os dados do formulário', error);
    }
  });
});
