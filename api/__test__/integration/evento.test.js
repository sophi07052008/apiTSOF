/**
 * Testes de Integração — Evento Controller
 * Usa Supertest para disparar requisições HTTP reais contra a app Express.
 * O banco de dados é mockado via jest.unstable_mockModule (ESM-compatible).
 * O upload de imagem é mockado para evitar dependência de multer em testes.
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
describe("Evento Controller — Testes de Integração", () => {
  beforeEach(() => mockQuery.mockReset());

  const eventoValido = {
    nome: "Show de Rock",
    descricao: "Uma noite incrível",
    data_hora: "2025-12-31T22:00:00",
    local: "Arena São Paulo",
    fk_id_organizador: 1,
  };

  // ── POST /api/v1/evento ────────────────────────────────────────────────────
  describe("POST /api/v1/evento", () => {
    it("CT01 - cria evento com dados válidos → 201", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) => cb(null, {}));

      // Act — envia como form (multipart/form-data pois a rota usa multer)
      const res = await request
        .post("/api/v1/evento")
        .field("nome", eventoValido.nome)
        .field("descricao", eventoValido.descricao)
        .field("data_hora", eventoValido.data_hora)
        .field("local", eventoValido.local)
        .field("fk_id_organizador", String(eventoValido.fk_id_organizador));

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Evento criado com sucesso");
    });

    it("CT02 - retorna 400 quando falta campo obrigatório", async () => {
      // Act — envia sem "local" e sem "fk_id_organizador"
      const res = await request
        .post("/api/v1/evento")
        .field("nome", "Show")
        .field("descricao", "Desc");

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Todos os campos devem ser preenchidos");
    });
  });

  // ── GET /api/v1/evento ─────────────────────────────────────────────────────
  describe("GET /api/v1/evento", () => {
    it("CT03 - lista todos os eventos → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, cb) =>
        cb(null, [
          { id_evento: 1, nome: "Show de Rock", local: "Arena São Paulo" },
        ])
      );

      // Act
      const res = await request.get("/api/v1/evento");

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("events");
      expect(Array.isArray(res.body.events)).toBe(true);
    });
  });

  // ── PUT /api/v1/evento ─────────────────────────────────────────────────────
  describe("PUT /api/v1/evento", () => {
    it("CT04 - atualiza evento com dados válidos → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      // Act
      const res = await request.put("/api/v1/evento").send({
        id_evento: 1,
        ...eventoValido,
      });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Evento atualizado com sucesso");
    });

    it("CT05 - retorna 404 quando evento não existe → 404", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 0 })
      );

      // Act
      const res = await request.put("/api/v1/evento").send({
        id_evento: 9999,
        ...eventoValido,
      });

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Evento não encontrado");
    });
  });

  // ── DELETE /api/v1/evento/:id ──────────────────────────────────────────────
  describe("DELETE /api/v1/evento/:id", () => {
    it("CT06 - exclui evento com sucesso → 200", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 1 })
      );

      // Act
      const res = await request.delete("/api/v1/evento/1");

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Evento excluído com sucesso");
    });

    it("CT07 - retorna 404 quando evento não existe → 404", async () => {
      // Arrange
      mockQuery.mockImplementationOnce((_sql, _vals, cb) =>
        cb(null, { affectedRows: 0 })
      );

      // Act
      const res = await request.delete("/api/v1/evento/9999");

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Evento não encontrado");
    });
  });
});
