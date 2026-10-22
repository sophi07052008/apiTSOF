/**
 * Testes de Integração — Organizador Controller
 */

import { jest } from "@jest/globals";

process.env.SECRET = "test_secret_key_123";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";

const mockQuery = jest.fn();

jest.unstable_mockModule("../../src/db/connect.js", () => ({
  default: { query: mockQuery },
}));

jest.unstable_mockModule("dotenv-safe/config.js", () => ({}));

const { default: supertest } = await import("supertest");
const { default: app } = await import("../../src/index.js");

const request = supertest(app);

// ─────────────────────────────────────────────────────────────────────────────
describe("Organizador Controller — Testes de Integração", () => {
  beforeEach(() => mockQuery.mockReset());

  const organizadorValido = {
    nome: "Carlos Eventos",
    email: "carlos@eventos.com",
    senha: "senha123",
    telefone: "11987654321",
  };

  // ── POST /api/v1/organizador ───────────────────────────────────────────────
  describe("POST /api/v1/organizador", () => {
    it("CT01 - cria organizador com dados válidos → 201", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) => cb(null, {}));

      const res = await request
        .post("/api/v1/organizador")
        .send(organizadorValido);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Organizador criado com sucesso");
    });

    it("CT02 - retorna 400 quando falta campo obrigatório", async () => {
      const res = await request
        .post("/api/v1/organizador")
        .send({ nome: "Carlos", email: "carlos@eventos.com" }); // falta senha e telefone

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Todos os campos devem ser preenchidos");
    });

    it("CT03 - retorna 400 quando email não tem @", async () => {
      const res = await request
        .post("/api/v1/organizador")
        .send({ ...organizadorValido, email: "carlosemails.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email inválido. Deve conter @");
    });

    it("CT04 - retorna 400 quando telefone tem número incorreto de dígitos", async () => {
      const res = await request
        .post("/api/v1/organizador")
        .send({ ...organizadorValido, telefone: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Telefone inválido/);
    });

    it("CT08 - retorna 400 quando email já está cadastrado (ER_DUP_ENTRY)", async () => {
      const dupErr = new Error("Duplicate entry");
      dupErr.code = "ER_DUP_ENTRY";
      mockQuery.mockImplementationOnce((_sql, _vals, cb) => cb(dupErr));

      const res = await request
        .post("/api/v1/organizador")
        .send(organizadorValido);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email já cadastrado");
    });
  });

  // ── GET /api/v1/organizador ────────────────────────────────────────────────
  describe("GET /api/v1/organizador", () => {
    it("CT05 - lista todos os organizadores → 200", async () => {
      mockQuery.mockImplementationOnce((_sql, cb) =>
        cb(null, [{ id_organizador: 1, nome: "Carlos" }])
      );

      const res = await request.get("/api/v1/organizador");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("organizadores");
      expect(Array.isArray(res.body.organizadores)).toBe(true);
    });
  });

  // ── PUT /api/v1/organizador ────────────────────────────────────────────────
  describe("PUT /api/v1/organizador", () => {
    it("CT06 - atualiza organizador com sucesso → 200", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      const res = await request.put("/api/v1/organizador").send({
        id: 1,
        ...organizadorValido,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Organizador atualizado com sucesso");
    });

    it("CT09 - retorna 400 quando falta campo no update", async () => {
      const res = await request
        .put("/api/v1/organizador")
        .send({ id: 1, nome: "Carlos" }); // falta email, senha, telefone

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/v1/organizador/:id ────────────────────────────────────────
  describe("DELETE /api/v1/organizador/:id", () => {
    it("CT07 - retorna 404 quando organizador não existe", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 0 })
      );

      const res = await request.delete("/api/v1/organizador/9999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Organizador não encontrado");
    });

    it("CT10 - exclui organizador com sucesso → 200", async () => {
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      const res = await request.delete("/api/v1/organizador/1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Organizador excluído com sucesso");
    });
  });
});
