# Plano de Implementação de Testes — API `api-tsof`

## Objetivo

Implementar uma suíte completa de testes (unitários + integração) com **Jest** e **Supertest** para todos os módulos da API Express em **ES Modules**, corrigindo os problemas existentes nos t estes atuais sem mexer no código da API.

---

## Diagnóstico da Situação Atual

### 🔴 Problemas Encontrados

#### `jest.config.js` — Erros críticos
```js
// ATUAL (com bugs)
export default {
  textEnvironment: "node",  // ❌ typo: "textEnvironment" → deveria ser "testEnvironment"
  Transform: {}             // ❌ maiúsculo "Transform" → deveria ser "transform"
}
```

#### `validateUser.test.js` — Bugs nos testes existentes
| Linha | Bug | Impacto |
|-------|-----|---------|
| 1 | `import validateUser from "../src/services/validateUser"` sem extensão `.js` | ❌ ES Modules exige extensão explícita |
| 18 | `It(...)` com **I** maiúsculo | ❌ `It` não existe — deve ser `it` |
| 30 | Mensagem de erro `"CPF invalido..."` sem acento | ❌ não vai fazer match com a mensagem real da API (`"CPF inválido..."`) |
| 37 | Mensagem `"Email invalido..."` sem acento | ❌ idem |

#### `userController.test.js` — Vazio
Arquivo só importa o controller mas não tem nenhum teste.

---

## Arquitetura de Testes Proposta

```
__test__/
├── unit/
│   ├── validateUser.test.js       ✅ reescrito (corrigido)
│   ├── validateCpf.test.js        🆕 novo
│   └── verifyJWT.test.js          🆕 novo
└── integration/
    ├── user.test.js               🆕 novo (Supertest)
    ├── organizador.test.js        🆕 novo (Supertest)
    ├── evento.test.js             🆕 novo (Supertest)
    └── ingresso.test.js           🆕 novo (Supertest)
```

> Os testes existentes (`userController.test.js`) serão movidos/substituídos pela estrutura de pastas. O arquivo raiz `userController.test.js` terá conteúdo redirecionado.

---

## Estratégia: Mock do Banco de Dados

Como os testes de integração usam **Supertest** (que sobe a app Express), precisamos **mockar** o módulo `../src/db/connect.js` para **não** depender de banco real.

Jest permite isso com `jest.mock()` ou `jest.unstable_mockModule()` (para ESM):

```js
// ESM mock pattern — obrigatório pois o projeto usa "type": "module"
jest.unstable_mockModule('../src/db/connect.js', () => ({
  default: { query: jest.fn() }
}));
```

Além disso, o `index.js` importa `dotenv-safe/config.js` na primeira linha, o que vai quebrar se não houver um `.env` — por isso criaremos um `.env.test` com valores de stub.

---

## Mudanças Propostas

### 1. `jest.config.js` — Correção de bugs

#### [MODIFY] jest.config.js
```diff
-export default {
-  textEnvironment: "node",
-  Transform: {}
-}
+export default {
+  testEnvironment: "node",
+  transform: {}
+}
```

### 2. `package.json` — Adicionar script de teste com NODE_OPTIONS

#### [MODIFY] package.json
```diff
 "scripts": {
-  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
+  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --detectOpenHandles",
+  "test:unit": "node --experimental-vm-modules node_modules/jest/bin/jest.js __test__/unit --detectOpenHandles",
+  "test:integration": "node --experimental-vm-modules node_modules/jest/bin/jest.js __test__/integration --detectOpenHandles",
   "start": "node src/server.js"
 }
```

### 3. `.env.test` — Variáveis de ambiente para testes

#### [NEW] .env.test
```env
SECRET=test_secret_key_123
DB_HOST=localhost
DB_USER=test
DB_PASSWORD=test
DB_NAME=test
```

---

## Testes Unitários

### [MODIFY] `__test__/validateUser.test.js` (corrigido + expandido)

Corrigindo todos os bugs + adicionando casos faltantes:

| CT | Descrição | Tipo |
|----|-----------|------|
| CT01 | Retorna `null` para dados válidos | ✅ happy path |
| CT02 | Erro quando falta `data_nascimento` | campo ausente |
| CT03 | Erro quando CPF tem menos de 11 dígitos | CPF inválido |
| CT04 | Erro quando email não tem `@` | email inválido |
| CT05 | Erro quando CPF tem letras | CPF não numérico |
| CT06 | Erro quando falta `email` | campo ausente |
| CT07 | Erro quando falta `name` | campo ausente |
| CT08 | Erro quando falta `password` | campo ausente |
| CT09 | Erro quando falta `cpf` | campo ausente |

### [NEW] `__test__/unit/validateCpf.test.js`

Mocka o `connect.js` e testa a lógica de verificação de CPF duplicado:

| CT | Descrição |
|----|-----------|
| CT01 | Retorna `null` quando CPF não está cadastrado |
| CT02 | Retorna erro quando CPF já está cadastrado (insert) |
| CT03 | Retorna `null` quando CPF pertence ao próprio usuário (update) |
| CT04 | Retorna erro quando CPF pertence a outro usuário (update) |

### [NEW] `__test__/unit/verifyJWT.test.js`

Testa o middleware `verifyJWT` sem banco, apenas com JWT:

| CT | Descrição |
|----|-----------|
| CT01 | Chama `next()` com token válido |
| CT02 | Retorna 401 quando não há token no header |
| CT03 | Retorna 403 quando o token é inválido/expirado |

---

## Testes de Integração (Supertest)

Os testes de integração sobem a app Express real via Supertest, mas **mockam o `connect.js`** para simular respostas do banco.

### [MODIFY] `__test__/userController.test.js` → substituído por [NEW] `__test__/integration/user.test.js`

| CT | Rota | Cenário |
|----|------|---------|
| CT01 | `POST /api/v1/user` | Criação com dados válidos → 201 |
| CT02 | `POST /api/v1/user` | Campos faltando → 400 |
| CT03 | `POST /api/v1/user` | CPF inválido → 400 |
| CT04 | `POST /api/v1/user` | Email inválido → 400 |
| CT05 | `GET /api/v1/user` | Sem token → 401 |
| CT06 | `GET /api/v1/user` | Com token válido → 200 |
| CT07 | `PUT /api/v1/user` | Atualização com dados válidos → 200 |
| CT08 | `DELETE /api/v1/user/:id` | Usuário não encontrado → 404 |
| CT09 | `POST /api/v1/login` | Credenciais corretas → 200 + token |
| CT10 | `POST /api/v1/login` | Senha incorreta → 401 |

### [NEW] `__test__/integration/organizador.test.js`

| CT | Rota | Cenário |
|----|------|---------|
| CT01 | `POST /api/v1/organizador` | Criação válida → 201 |
| CT02 | `POST /api/v1/organizador` | Campos faltando → 400 |
| CT03 | `POST /api/v1/organizador` | Email sem `@` → 400 |
| CT04 | `POST /api/v1/organizador` | Telefone inválido → 400 |
| CT05 | `GET /api/v1/organizador` | Lista todos → 200 |
| CT06 | `PUT /api/v1/organizador` | Atualização → 200 |
| CT07 | `DELETE /api/v1/organizador/:id` | Não encontrado → 404 |

### [NEW] `__test__/integration/evento.test.js`

| CT | Rota | Cenário |
|----|------|---------|
| CT01 | `POST /api/v1/evento` | Criação válida → 201 |
| CT02 | `POST /api/v1/evento` | Campos faltando → 400 |
| CT03 | `GET /api/v1/evento` | Lista todos → 200 |
| CT04 | `PUT /api/v1/evento` | Atualização → 200 |
| CT05 | `PUT /api/v1/evento` | Não encontrado → 404 |
| CT06 | `DELETE /api/v1/evento/:id` | Exclusão → 200 |
| CT07 | `DELETE /api/v1/evento/:id` | Não encontrado → 404 |

### [NEW] `__test__/integration/ingresso.test.js`

| CT | Rota | Cenário |
|----|------|---------|
| CT01 | `POST /api/v1/ingresso` | Criação válida → 200 |
| CT02 | `POST /api/v1/ingresso` | Campos faltando → 400 |
| CT03 | `GET /api/v1/ingresso` | Lista todos → 200 |
| CT04 | `GET /api/v1/ingresso/evento/:id` | Por evento → 200 |
| CT05 | `PUT /api/v1/ingresso` | Atualização → 200 |
| CT06 | `DELETE /api/v1/ingresso/:id` | Exclusão → 200 |

---

## Docker — Como Rodar a API

O `docker-compose.yml` já existe e sobe a app + MySQL. Para rodar:

```bash
# Na pasta /api
docker-compose up --build
```

> ⚠️ Os **testes não dependem do Docker** pois mockamos o banco. O Docker é para rodar a API em produção/dev local.

---

## Plano de Execução (ordem)

```
1. Corrigir jest.config.js           ← desbloqueia qualquer teste ESM
2. Criar .env.test                   ← evita crash do dotenv-safe
3. Reescrever validateUser.test.js   ← corrigi bugs + expansão
4. Criar unit/validateCpf.test.js    ← mock connect
5. Criar unit/verifyJWT.test.js      ← sem mock
6. Criar integration/user.test.js    ← supertest + mock connect
7. Criar integration/organizador.test.js
8. Criar integration/evento.test.js
9. Criar integration/ingresso.test.js
10. Rodar npm test para verificar
```

---

## Plano de Verificação

### Testes Automatizados

```bash
cd api

# Todos os testes
npm test

# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration
```

### Resultado Esperado

```
Test Suites: 6 passed, 6 total
Tests:       ~35+ passed
```

---

> [!IMPORTANT]
> **Aguardando aprovação antes de implementar qualquer arquivo.**
> Após sua confirmação, implementarei na ordem acima e rodarei os testes para validar.

> [!WARNING]
> O `index.js` chama `dotenv-safe/config.js` no topo-level. Isso significa que ao importar a app nos testes de integração, o Node tentará ler o `.env`. O `.env.test` que criaremos resolve esse problema.
