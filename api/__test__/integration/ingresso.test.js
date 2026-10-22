/**
 * Testes de Integração — Ingresso Controller
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

// ─────────────────────────────────────────────────────────────────────────────
describe("Ingresso Controller — Testes de Integração", () => {
  beforeEach(() => mockQuery.mockReset());

  const ingressoValido = {
    preco: 150.0,
    tipo: "VIP",
    fk_id_evento: 1,
  };

  // ── POST /api/v1/ingresso ──────────────────────────────────────────────────
  describe("POST /api/v1/ingresso", () => {
    it("CT01 - cria ingresso com dados válidos → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) => cb(null, {}));

      // Act
      const res = await request.post("/api/v1/ingresso").send(ingressoValido);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ingresso criado com sucesso");
    });

    it("CT02 - retorna 400 quando falta campo obrigatório", async () => {
      // Act — envia sem "fk_id_evento"
      const res = await request
        .post("/api/v1/ingresso")
        .send({ preco: 50.0, tipo: "Pista" }); // falta fk_id_evento

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Todos os campos devem ser preenchidos");
    });
  });

  // ── GET /api/v1/ingresso ───────────────────────────────────────────────────
  describe("GET /api/v1/ingresso", () => {
    it("CT03 - lista todos os ingressos → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, cb) =>
        cb(null, [
          {
            id_ingresso: 1,
            preco: 150.0,
            tipo: "VIP",
            fk_id_evento: 1,
            nome_evento: "Show de Rock",
          },
        ])
      );

      // Act
      const res = await request.get("/api/v1/ingresso");

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ingressos");
      expect(Array.isArray(res.body.ingressos)).toBe(true);
    });
  });

  // ── GET /api/v1/ingresso/evento/:id ───────────────────────────────────────
  describe("GET /api/v1/ingresso/evento/:id", () => {
    it("CT04 - retorna ingressos de um evento específico → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, [
          {
            id_ingresso: 1,
            preco: 150.0,
            tipo: "VIP",
            fk_id_evento: 1,
            nome_evento: "Show de Rock",
          },
        ])
      );

      // Act
      const res = await request.get("/api/v1/ingresso/evento/1");

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ingressos");
      expect(res.body.message).toBe("Ingressos do evento obtidos com sucesso");
    });
  });

  // ── PUT /api/v1/ingresso ───────────────────────────────────────────────────
  describe("PUT /api/v1/ingresso", () => {
    it("CT05 - atualiza ingresso com dados válidos → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      // Act
      const res = await request.put("/api/v1/ingresso").send({
        id_ingresso: 1,
        preco: 200.0,
        tipo: "Premium",
        fk_id_evento: 1,
      });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ingresso atualizado com sucesso");
    });

    it("CT07 - retorna 404 quando ingresso não existe → 404", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 0 })
      );

      // Act
      const res = await request.put("/api/v1/ingresso").send({
        id_ingresso: 9999,
        preco: 200.0,
        tipo: "Premium",
        fk_id_evento: 1,
      });

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Ingresso não encontrado");
    });
  });

  // ── DELETE /api/v1/ingresso/:id ───────────────────────────────────────────
  describe("DELETE /api/v1/ingresso/:id", () => {
    it("CT06 - exclui ingresso com sucesso → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      // Act
      const res = await request.delete("/api/v1/ingresso/1");

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ingresso excluído com sucesso");
    });

    it("CT08 - retorna 404 quando ingresso não existe → 404", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 0 })
      );

      // Act
      const res = await request.delete("/api/v1/ingresso/9999");

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Ingresso não encontrado");
    });
  });
});
