# Copilot instructions for TabuadaMobile

Purpose: quick reference for Copilot sessions to understand how to build, run, and navigate this repository.

---

## 1) Build / run / test / lint commands

- Start Expo dev server (frontend):
  - npm run start
  - (alias) npx expo start
- Start backend server only:
  - npm run server
  - (runs node server.js — server reads .env for DB credentials and PORT)
- Full dev (server + web client):
  - npm run dev (uses concurrently: runs server.js and `npx expo start --web`)
- Run client on emulators / platforms:
  - npm run android (opens Expo on Android emulator)
  - npm run ios (opens Expo on iOS simulator)
  - npm run web (opens web build via Expo)

Notes: There are no test or lint scripts configured in package.json. No test runner is present; "single test" instructions are not applicable.

---

## 2) High-level architecture (big picture)

- Monorepo-style arrangement: backend (Node/Express + Mongoose) and frontend (Expo React Native) live in the same repo root.

- Backend
  - Entry: server.js
  - Structure: routes/ (API routes), models/ (Mongoose schemas), middlewares/ (authenticator), modules/ (mailer, etc.)
  - Data: MongoDB via mongoose; connection uses DB_USER and DB_PASS from .env and connects to a MongoDB Atlas cluster.
  - Auth: JWT tokens (SECRET from .env); auth middleware applied to protected routes.
  - Mailer: modules/mailer.js uses nodemailer (credentials from .env) for password recovery emails.
  - Public/static: assets/ served statically; index.html served at root.
  - Main API endpoints mounted in server.js: /auth/register, /auth/login, /round, /acessos

- Frontend
  - Entry: App.js (React Navigation stack)
  - Screens: screens/\*.js (LoginScreen, RegisterScreen, HomeScreen, TabuadaScreen)
  - HTTP client: axios used inside screens; by default development URL uses `http://10.0.2.2:3000` (Android emulator loopback).
  - Token storage: AsyncStorage, token key used is 'token'.

- How dev flow works
  - Typical local dev: set environment variables in a .env, run `npm run dev` to start Express and Expo web concurrently, or run server and mobile client separately (npm run server + npm run android).
  - Mobile emulator networking: Android emulators use 10.0.2.2 to reach the host machine's localhost:3000. On iOS simulator use http://localhost:3000 or change to host IP for physical devices/Expo Go.

---

## 3) Key conventions and patterns (repository-specific)

- File layout and responsibilities
  - models/ — Mongoose schemas: User.js, Round.js, Contagem.js
  - routes/ — Express route modules; each file exports a router and is mounted in server.js
  - modules/ — reusable helpers (mailer.js)
  - middlewares/ — auth middleware (authenticator.js) verifies JWT and sets req.user
  - screens/ — React Native screens used by the Expo app

- Auth & tokens
  - Tokens created with jwt.sign(..., process.env.SECRET) — SECRET must be provided in .env for local dev.
  - Login route selects password explicitly (.select('+password')) to compare with bcrypt.
  - Frontend stores JWT in AsyncStorage under key 'token' and should attach it to requests to protected endpoints.

- User model conventions
  - email is lowercased and trimmed before save/lookup
  - turma is stored uppercase and trimmed
  - password is hashed in UserSchema.pre('save') using bcrypt
  - permissoes subdocument controls feature toggles (soma, menos, vezes, dividir, todas)
  - totalJogos, totalAcertos, totalErros are numeric counters stored on the user

- Password rules
  - Create and reset enforce a password regex (see routes/createUser.js and routes/login.js) — keep client-side and server-side validators aligned if changing rules.

- API conventions
  - Routes are mounted under the base paths used in server.js (see High-level architecture). Use these exact paths when constructing client requests in the app.
  - Round creation expects body fields like { acerto, errou, jogou, userId, totalJogos, totalAcertos, totalErros }
  - Contagem (operation counts) are associated with rounds and users via object references

- Development networking
  - Default axios calls in screens use 10.0.2.2:3000 which is specific to Android emulator. When testing on physical devices or via Expo Go, update the base URL to your machine IP or a deployed backend URL.

- Environment variables (required for dev)
  - DB_USER, DB_PASS — used to connect to MongoDB Atlas
  - PORT — port the Node server listens on (e.g., 3000)
  - SECRET — JWT signing secret
  - MAIL_USER, MAIL_PASS, MAIL_HOST, MAIL_PORT — for nodemailer (password reset emails)
  - Store these in a .env file at the repo root for local development

---

## 4) Other AI / assistant config checked

Checked for common AI assistant configs and project-specific assistant docs; none found:

- CLAUDE.md, AGENTS.md, CONVENTIONS.md, .cursorrules, .windsurfrules, .clinerules, etc. — no files present in repo root.

---

## 5) Where to look for specific tasks (quick pointers)

- Add/change API routes: routes/
- Change DB schemas: models/
- Adjust auth behavior: middlewares/authenticator.js and login/createUser routes
- Email templates: resources/mail/ or the assets folder (mailer is set up to use a template path if enabled)
- Frontend screens & navigation: screens/ and App.js

---

Expanded additions

Below are ready-to-use curl examples, a recommended .env.example and suggested test/lint scripts to add to package.json. Paste or adapt these into your local workflow.

### Example curl commands (development)

- Register (create user):
  curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"tipo":"Aluno","name":"joao","email":"joao@example.com","password":"P@ssw0rd1","confirmPassword":"P@ssw0rd1","turma":"A1"}'

- Login (get JWT):
  curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"joao@example.com","password":"P@ssw0rd1"}'

- Login and use token for an authenticated request (example: list users)
  1. Save token:
     TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"joao@example.com","password":"P@ssw0rd1"}' | jq -r '.token')
  2. Use token:
     curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/auth/register

- Create a round (POST /round):
  curl -X POST http://localhost:3000/round -H "Content-Type: application/json" -d '{"acerto":3,"errou":1,"jogou":4,"userId":"<USER_ID>","totalJogos":10,"totalAcertos":7,"totalErros":3}'

- Get all rounds:
  curl http://localhost:3000/round

- Forgot password (request reset token):
  curl -X POST http://localhost:3000/auth/login/forgot_password -H "Content-Type: application/json" -d '{"email":"joao@example.com"}'

- Reset password:
  curl -X POST http://localhost:3000/auth/login/reset_password -H "Content-Type: application/json" -d '{"email":"joao@example.com","token":"<TOKEN_FROM_EMAIL>","password":"NewP@ss1","confirmPass":"NewP@ss1"}'

Note: Android emulator loopback uses http://10.0.2.2:3000; on iOS simulator use http://localhost:3000 or your machine IP for physical devices.

### Recommended .env.example

Create a .env (not checked in) using the following keys:

DB_USER=your_mongo_user
DB_PASS=your_mongo_password
PORT=3000
SECRET=some_long_random_secret

MAIL_USER=your_smtp_user
MAIL_PASS=your_smtp_password
MAIL_HOST=smtp.example.com
MAIL_PORT=587

Place .env at repo root. Keep credentials out of git.

### Suggested test & lint scripts to add to package.json

Add devDependencies (suggested):

- jest
- supertest
- eslint
- eslint-config-airbnb-base (or preferred preset)
- eslint-plugin-import
- prettier (optional)

Suggested package.json scripts to add under "scripts":

- "test": "jest --runInBand",
- "test:watch": "jest --watch",
- "lint": "eslint . --ext .js --ignore-path .gitignore",
- "lint:fix": "eslint . --ext .js --fix"

How to run a single test (after adding jest):

- npx jest path/to/test/file.test.js
- or npm run test -- path/to/test/file.test.js

How to lint a single file:

- npx eslint src/someFile.js
- or npm run lint -- src/someFile.js

Minimal test example (server-side): use supertest to test endpoints. Create tests/auth.test.js and use:

const request = require('supertest');
const app = require('../server'); // export app from server.js for testing

describe('Auth', () => {
test('register endpoint returns 201', async () => {
const res = await request(app)
.post('/auth/register')
.send({ /_ user payload _/ });
expect([200,201]).toContain(res.statusCode);
});
});

Notes when adding tests:

- Export the Express app instance from server.js (e.g., module.exports = app) and call app.listen() only in a separate startup file or conditionally when not in test.
- Use a test MongoDB database or in-memory MongoDB (mongodb-memory-server) to avoid polluting production/dev data.

---

If you'd like these suggested scripts and the .env.example file created and committed to the repo, confirm and Copilot will add them (creates .env.example, updates package.json scripts, and can scaffold a sample test file if requested).

Using .env with Expo (app.config.js)

- Files added: app.config.js and .env.example. app.config.js uses dotenv to load .env and expose process.env.API_BASE_URL to Expo via `extra.API_BASE_URL`.
- How to use:
  1. Copy .env.example -> .env in repo root and set API_BASE_URL (e.g., API_BASE_URL=http://192.168.0.153:8081).
  2. Restart Metro/Expo: `expo start` (Expo reads app.config.js at startup).
  3. In app code config/api.js reads Constants.expoConfig.extra.API_BASE_URL (or manifest.extra fallback) so the app picks the value automatically.
- Notes:
  - For Expo Go, the value in app.config.js (or .env when using app.config.js) is bundled at runtime; restart the bundler after changes.
  - For CI or production, set environment variables in your build pipeline or use `expo build`/EAS with secrets.

This repository already contains app.config.js and .env.example; follow the steps above to enable local overrides.
