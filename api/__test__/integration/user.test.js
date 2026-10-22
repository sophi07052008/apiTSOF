/**
 * Testes de Integração — User Controller
 * Usa Supertest para disparar requisições HTTP reais contra a app Express.
 * O banco de dados é mockado via jest.unstable_mockModule (ESM-compatible).
 */

import { jest } from "@jest/globals";

// ─── Setup: variáveis de ambiente antes de qualquer import ───────────────────
process.env.SECRET = "test_secret_key_123";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";

// ─── Mock do banco (deve vir ANTES dos imports que dependem dele) ─────────────
const mockQuery = jest.fn();

jest.unstable_mockModule("../../src/db/connect.js", () => ({
  default: { query: mockQuery },
}));

// Mock do dotenv-safe para não ler arquivo .env real
jest.unstable_mockModule("dotenv-safe/config.js", () => ({}));

// ─── Imports dinâmicos (ESM: após os mocks) ──────────────────────────────────
const { default: supertest } = await import("supertest");
const { default: app } = await import("../../src/index.js");

const request = supertest(app);

// ─── Helper: gera token JWT válido para testes autenticados ──────────────────
async function gerarTokenValido() {
  const { default: jwt } = await import("jsonwebtoken");
  return jwt.sign({ id: 1 }, process.env.SECRET, { expiresIn: "1h" });
}

// ─────────────────────────────────────────────────────────────────────────────
describe("User Controller — Testes de Integração", () => {
  beforeEach(() => mockQuery.mockReset());

  // ── POST /api/v1/user ──────────────────────────────────────────────────────
  describe("POST /api/v1/user", () => {
    const usuarioValido = {
      cpf: "12345678901",
      email: "aluno@senai.br",
      password: "senha123",
      name: "Aluno Teste",
      data_nascimento: "2000-01-01",
    };

    it("CT01 - cria usuário com dados válidos → 201", async () => {
      // Arrange: CPF não duplicado + insert bem-sucedido
      mockQuery
        .mockImplementationOnce((_sql, _vals, cb) => cb(null, [])) // validateCpf: CPF livre
        .mockImplementationOnce((_sql, _vals, cb) => cb(null, {})); // INSERT ok

      // Act
      const res = await request.post("/api/v1/user").send(usuarioValido);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Usuário criado com sucesso");
    });

    it("CT02 - retorna 400 quando falta campo obrigatório", async () => {
      const res = await request
        .post("/api/v1/user")
        .send({ email: "aluno@senai.br", password: "123" }); // falta cpf, name, data_nascimento

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("CT03 - retorna 400 quando CPF é inválido (menos de 11 dígitos)", async () => {
      const res = await request
        .post("/api/v1/user")
        .send({ ...usuarioValido, cpf: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/CPF inválido/);
    });

    it("CT04 - retorna 400 quando email não tem @", async () => {
      const res = await request
        .post("/api/v1/user")
        .send({ ...usuarioValido, email: "alunosenai.br" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Email inválido/);
    });

    it("CT11 - retorna 400 quando CPF já está cadastrado", async () => {
      // Arrange: validateCpf retorna CPF duplicado
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, [{ id_usuario: 99 }])
      );

      const res = await request.post("/api/v1/user").send(usuarioValido);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("CPF já cadastrado");
    });
  });

  // ── GET /api/v1/user ───────────────────────────────────────────────────────
  describe("GET /api/v1/user", () => {
    it("CT05 - retorna 401 sem token de autenticação", async () => {
      const res = await request.get("/api/v1/user");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        auth: false,
        message: "Token não foi fornecido",
      });
    });

    it("CT06 - retorna 200 com token válido", async () => {
      // Arrange
      const token = await gerarTokenValido();
      mockQuery.mockImplementationOnce((_sql, cb) =>
        cb(null, [{ id_usuario: 1, name: "Aluno", email: "a@a.com" }])
      );

      const res = await request
        .get("/api/v1/user")
        .set("authorization", token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
    });
  });

  // ── PUT /api/v1/user ───────────────────────────────────────────────────────
  describe("PUT /api/v1/user", () => {
    it("CT07 - atualiza usuário com dados válidos → 200", async () => {
      // Arrange
      mockQuery
        .mockImplementationOnce((_sql, _vals, cb) =>
          cb(null, [{ id_usuario: 1 }])
        ) // validateCpf: mesmo usuário
        .mockImplementationOnce((_sql, _vals, cb) =>
          cb(null, { affectedRows: 1 })
        ); // UPDATE ok

      const res = await request.put("/api/v1/user").send({
        id: 1,
        cpf: "12345678901",
        email: "aluno@senai.br",
        password: "nova123",
        name: "Aluno Atualizado",
        data_nascimento: "2000-01-01",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Usuário atualizado com sucesso");
    });

    it("CT12 - retorna 404 quando usuário não existe para update", async () => {
      mockQuery
        .mockImplementationOnce((_sql, _vals, cb) => cb(null, []))
        .mockImplementationOnce((_sql, _vals, cb) =>
          cb(null, { affectedRows: 0 })
        );

      const res = await request.put("/api/v1/user").send({
        id: 999,
        cpf: "12345678901",
        email: "x@x.com",
        password: "123",
        name: "X",
        data_nascimento: "2000-01-01",
      });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/v1/user/:id ────────────────────────────────────────────────
  describe("DELETE /api/v1/user/:id", () => {
    it("CT08 - retorna 404 quando usuário não existe", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 0 })
      );

      const res = await request.delete("/api/v1/user/9999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuário não encontrado");
    });

    it("CT13 - exclui usuário com sucesso → 200", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      const res = await request.delete("/api/v1/user/1");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("1");
    });
  });

  // ── POST /api/v1/login ─────────────────────────────────────────────────────
  describe("POST /api/v1/login", () => {
    it("CT09 - login com credenciais corretas → 200 com token", async () => {
      // Arrange: simula usuário encontrado no banco com hash real
      const { default: bcrypt } = await import("bcrypt");
      const hash = await bcrypt.hash("senha123", 10);

      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, [{ id_usuario: 1, email: "aluno@senai.br", password: hash }])
      );

      const res = await request
        .post("/api/v1/login")
        .send({ email: "aluno@senai.br", password: "senha123" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.message).toBe("Login bem-sucedido");
    });

    it("CT10 - retorna 401 quando a senha está incorreta", async () => {
      const { default: bcrypt } = await import("bcrypt");
      const hash = await bcrypt.hash("senha_correta", 10);

      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, [{ id_usuario: 1, email: "aluno@senai.br", password: hash }])
      );

      const res = await request
        .post("/api/v1/login")
        .send({ email: "aluno@senai.br", password: "senha_errada" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Senha incorreta");
    });

    it("CT14 - retorna 401 quando usuário não é encontrado", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) => cb(null, []));

      const res = await request
        .post("/api/v1/login")
        .send({ email: "naoexiste@x.com", password: "123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Usuário não encontrado");
    });

    it("CT15 - retorna 400 quando email ou senha não são enviados", async () => {
      const res = await request.post("/api/v1/login").send({ email: "a@a.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email e senha são obrigatórios");
    });
  });
});
