# Tabuada - Aplicação Web

Uma aplicação web para prática de tabuadas matemáticas com sistema de permissões e acompanhamento de desempenho.

## 🚀 Como executar

### Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB Atlas (banco de dados na nuvem)
- Conta no MongoDB Atlas

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/rubenslemos/Tabuada.git
   cd Tabuada
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` com suas configurações:

   ```env
   # Configurações do Banco de Dados MongoDB Atlas
   DB_USER=seu_usuario_mongodb
   DB_PASS=sua_senha_mongodb

   # Porta do servidor (opcional, padrão: 3000)
   PORT=3000

   # Chave secreta para JWT (use uma chave segura)
   SECRET=sua_chave_secreta_jwt_segura
   ```

### Configuração do MongoDB Atlas

1. **Acesse o MongoDB Atlas** em [https://cloud.mongodb.com](https://cloud.mongodb.com)

2. **Crie um cluster** (se não tiver um)

3. **Configure o acesso:**
   - Vá em "Network Access" e adicione o IP `0.0.0.0/0` (ou seu IP específico)
   - Vá em "Database Access" e crie um usuário com permissões de leitura/escrita

4. **Obtenha a connection string:**
   - Clique em "Connect" > "Connect your application"
   - Copie a connection string
   - Use as credenciais no arquivo `.env`

### Executando a aplicação

```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## 🔧 Solução de Problemas

### Erro de conexão com MongoDB Atlas

Se você receber o erro `AtlasError` ou problemas de conexão:

1. **Verifique as credenciais** no arquivo `.env`
2. **Confirme o IP autorizado** no MongoDB Atlas
3. **Verifique a conexão com a internet**
4. **Certifique-se de que o cluster está ativo**

### Erro "Variáveis de ambiente obrigatórias"

Se aparecer a mensagem sobre variáveis de ambiente:
- Certifique-se de que o arquivo `.env` existe
- Verifique se `DB_USER` e `DB_PASS` estão definidos
- Reinicie o servidor após alterar o `.env`

## 📁 Estrutura do Projeto

```
├── assets/                 # Arquivos estáticos
│   ├── css/               # Estilos CSS
│   ├── js/                # JavaScript do frontend
│   └── index.html         # Página inicial
├── models/                # Modelos do MongoDB
├── routes/                # Rotas da API
├── views/                 # Templates Handlebars
├── middlewares/           # Middlewares personalizados
├── modules/               # Módulos auxiliares
└── resources/             # Recursos (emails, etc.)
```

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Banco de Dados:** MongoDB Atlas
- **Templates:** Handlebars
- **Autenticação:** JWT
- **Frontend:** HTML5, CSS3, JavaScript

## 📝 Funcionalidades

- ✅ Sistema de login/cadastro
- ✅ Prática de tabuadas (adição, subtração, multiplicação, divisão)
- ✅ Sistema de permissões por usuário/turma
- ✅ Acompanhamento de desempenho
- ✅ Recuperação de senha
- ✅ Interface responsiva

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.