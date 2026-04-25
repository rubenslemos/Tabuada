function setupPasswordToggle(passwordInputId, confirmPasswordInputId = null) {
  // Configura o toggle para o campo de senha principal
  const passwordInput = document.getElementById(passwordInputId);
  if (passwordInput) {
    const passwordToggle = passwordInput.nextElementSibling;
    if (passwordToggle && passwordToggle.classList.contains('fa-eye')) {
      passwordToggle.addEventListener('click', () => {
        togglePasswordVisibility(passwordInput, passwordToggle);
      });
    }
  }

  // Configura o toggle para o campo de confirmação de senha (se existir)
  if (confirmPasswordInputId) {
    const confirmPasswordInput = document.getElementById(confirmPasswordInputId);
    if (confirmPasswordInput) {
      const confirmToggle = confirmPasswordInput.nextElementSibling;
      if (confirmToggle && confirmToggle.classList.contains('fa-eye')) {
        confirmToggle.addEventListener('click', () => {
          togglePasswordVisibility(confirmPasswordInput, confirmToggle);
        });
      }
    }
  }
}

// Função auxiliar para alternar a visibilidade
function togglePasswordVisibility(inputElement, toggleElement) {
  if (inputElement.type === 'password') {
    inputElement.type = 'text';
    toggleElement.classList.replace('fa-eye', 'fa-eye-slash');
    toggleElement.title = "Ocultar senha";
  } else {
    inputElement.type = 'password';
    toggleElement.classList.replace('fa-eye-slash', 'fa-eye');
    toggleElement.title = "Mostrar senha";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('usuario');
  const enviarBotao = document.getElementById('enviarFormulario');
  const cadastro = document.getElementById('cadastro')
  const login = document.getElementById('login')
  const cancelar = document.getElementById('cancelar')
  const enviar = document.getElementById('confirmPassword')
  const erroCadastro = document.getElementById('cadastrar')
  
  cancelar.addEventListener('click', ()=> {
    window.location.href = '/login';
  })
  async function criarUsuario (e) {
    e.preventDefault()
    const formData = new FormData(form)
    const tipo = formData.get('tipo')
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')
    const turma = formData.get('turma')
    const cadastroError = document.createElement('small')
    cadastroError.classList.add('senhaError')
    const cadastroOk = document.createElement('small')
    cadastroOk.classList.add('senhaOk')
   
try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tipo, name, email, password, confirmPassword, turma }),
    });
  const data = await response.json();
  console.log('Resposta do servidor:', response.status, data);
    if (response.status === 201) {
      mostrarMsgSucesso(data.Msg);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else {
        console.log('Resposta do servidor:', response.status, data);
      mostrarMsgErro(data.Msg || 'Erro ao cadastrar usuário');
    }
  } catch (error) {
    console.error('Erro ao enviar os dados do formulário', error);
    mostrarMsgErro('Erro ao conectar ao servidor');
  }
}

  function mostrarMsgSucesso(mensagem) {
    const mensagemSucesso = document.createElement('small')
    mensagemSucesso.classList.add('senhaOk')
    mensagemSucesso.innerHTML = mensagem
    form.insertBefore(mensagemSucesso, erroCadastro)
    setTimeout(() => {
      window.location.href = '/login';
      mensagemSucesso.remove()
    }, 3000);
  }
  
  function mostrarMsgErro(mensagem) {
    const mensagemErro = document.createElement('small')
    mensagemErro.classList.add('senhaError')
    mensagemErro.innerHTML = mensagem
    form.insertBefore(mensagemErro, erroCadastro)
    setTimeout(()=>{
      mensagemErro.remove()
    },3000)
  }

  enviarBotao.addEventListener('click', criarUsuario)

  enviar.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
      criarUsuario(e)
    }
  })
  setupPasswordToggle('password', 'togglePassword')
  setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');
})