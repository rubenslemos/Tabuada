# TabuadaMobile

> Vercel build trigger: 2026-05-31T00:00:00Z

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
- `npm run expo:doctor`: validação do projeto Expo
- `npm run build:android:preview`: gera build Android interna (EAS)
- `npm run build:android:prod`: gera `.aab` de produção para Play Store
- `npm run submit:android:prod`: envia build para Google Play (track interno)

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

## Publicação na Play Store (Expo EAS)

### 1. Pré-requisitos

1. Conta de desenvolvedor Google Play ativa.
2. Conta Expo autenticada:
   `npx expo login`
3. EAS configurado:
   `npx eas login`

### 2. Validar projeto

1. Instale dependências:
   `npm install`
2. Rode validações:
   `npm run expo:doctor`

### 3. Gerar build Android de produção

1. Build `.aab`:
   `npm run build:android:prod`
2. O EAS vai oferecer gerar/gerenciar keystore automaticamente (recomendado).

### 4. Enviar para Google Play

1. Upload manual:
   - Baixe o `.aab` no link retornado pelo EAS.
   - No Google Play Console: `Seu app > Testes > Teste interno > Criar release`.
   - Faça upload do `.aab` e publique no track interno.
2. Ou envio automático via EAS Submit:
   `npm run submit:android:prod`

### 5. Itens obrigatórios no Play Console

1. Política de privacidade (URL pública).
2. Ficha da loja (descrição curta, completa, ícone, screenshots).
3. Classificação de conteúdo.
4. Público-alvo e questionário de apps para crianças (se aplicável).
5. Formulário de segurança de dados.

### 6. Identidade Android atual

- `android.package`: `com.rubenslemos.tabuadamobile`
- `android.versionCode`: `1`

Se quiser trocar o `android.package`, faça isso antes da primeira publicação.

## APK e Backend (Network Error)

O APK nao leva o backend Node.js junto. O backend precisa estar online e acessivel.

### Build APK para testes com backend local (HTTP/LAN)

Use o profile `preview` e informe a URL da API no build:

`API_BASE_URL=http://SEU_IP_DA_REDE:3000 npx eas-cli build --platform android --profile preview`

Exemplo:

`API_BASE_URL=http://192.168.0.153:3000 npx eas-cli build --platform android --profile preview`

### Build de producao (Play Store)

Use backend publico com HTTPS:

`API_BASE_URL=https://sua-api.com npx eas-cli build --platform android --profile production`

Sem backend online, o app sempre vai retornar `Network Error`.

## Deploy robusto do backend (Render)

### 1. Publicar no Render

1. Envie este repositorio para o GitHub.
2. No Render, crie um novo `Web Service` conectando o repositorio.
3. Use as configuracoes:
   - Build Command: `npm install --omit=dev`
   - Start Command: `node server.js`
4. Defina variaveis de ambiente:
   - `MONGODB_URI` (recomendado)
   - `SECRET`
   - `CORS_ORIGINS` (ex.: `https://tabuada.seudominio.com,http://localhost:19006`)
   - opcionais: `GROQ_API_KEY`, `GROQ_MODEL`
5. Deploy e teste:
   - `https://SEU_BACKEND.onrender.com/health` deve retornar `{\"status\":\"ok\"}`.

### 2. Gerar APK apontando para backend HTTPS

Depois do backend online:

`API_BASE_URL=https://SEU_BACKEND.onrender.com npx eas-cli build --platform android --profile preview`

## Deploy robusto do backend (Vercel)

### 1. Estrutura pronta no projeto

- Entrada serverless: `api/index.js`
- Config Vercel: `vercel.json`
- Backend Express: `server.js` com conexao Mongo reutilizavel

### 2. Publicar na Vercel

1. Conecte o repositorio no painel da Vercel.
2. Em `Settings > Environment Variables`, configure:
   - `MONGODB_URI`
   - `SECRET`
   - `CORS_ORIGINS` (para demo, pode usar `*`)
   - opcionais: `GROQ_API_KEY`, `GROQ_MODEL`
3. Faça deploy da branch principal.
4. Valide:
   - `https://SEU-PROJETO.vercel.app/health` deve retornar `{"status":"ok"}`.

### 3. Gerar APK com backend HTTPS da Vercel

`API_BASE_URL=https://SEU-PROJETO.vercel.app npx eas-cli build --platform android --profile preview`
