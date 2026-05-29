# TabuadaMobile

Aplicativo mobile em React Native (Expo) com backend Node.js/Express.

## Como executar

1. Copie `.env.example` para `.env` e ajuste as variáveis.
2. Instale dependências:
   `npm install`
3. Rode o backend:
   `npm run server`
4. Rode o app Expo:
   `npm run start`

## Scripts principais

- `npm run start`: inicia o Expo
- `npm run server`: inicia o backend Express
- `npm run dev`: backend + Expo Web em paralelo
- `npm run android`: abre no Android
- `npm run ios`: abre no iOS
- `npm run web`: abre no navegador

## Configuração

- `app.config.js` lê `API_BASE_URL` via `.env`.
- O app usa esse valor em `config/api.js`.
- Reinicie o Metro após alterar variáveis de ambiente.

## Estrutura resumida

- `screens/`: telas React Native
- `components/`: componentes reutilizáveis
- `routes/`: rotas do backend
- `models/`: modelos MongoDB
- `views/`: páginas/template do backend web
- `assets/`: estilos, scripts e imagens

## Variáveis comuns

- `API_BASE_URL`: URL base da API backend
- `DB_USER` e `DB_PASS`: credenciais MongoDB
- `PORT`: porta do servidor backend
- `SECRET`: chave JWT
- `MAIL_*`: configurações de envio de e-mail
