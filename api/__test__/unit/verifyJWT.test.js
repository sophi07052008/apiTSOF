import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import verifyJWT from "../../src/services/verifyJWT.js";

describe("verifyJWT - Testes Unitários do Middleware", () => {
  const SECRET = "test_secret_key_123";

  // Helper para montar objetos req/res/next fake (padrão AAA)
  function buildMocks({ headers = {} } = {}) {
    const req = { headers };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
  }

  beforeEach(() => {
    // Garante que o SECRET bate com o que a função usa
    process.env.SECRET = SECRET;
  });

  it("CT01 - chama next() quando o token é válido", () => {
    // Arrange
    const token = jwt.sign({ id: 42 }, SECRET, { expiresIn: "1h" });
    const { req, res, next } = buildMocks({
      headers: { authorization: token },
    });

    // Act
    verifyJWT(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(42);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("CT02 - retorna 401 quando não há token no header", () => {
    // Arrange
    const { req, res, next } = buildMocks({ headers: {} });

    // Act
    verifyJWT(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      auth: false,
      message: "Token não foi fornecido",
    });
  });

  it("CT03 - retorna 403 quando o token é inválido", () => {
    // Arrange
    const { req, res, next } = buildMocks({
      headers: { authorization: "token.invalido.aqui" },
    });

    // Act
    verifyJWT(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      auth: false,
      message: "Falha na autenticação do Token",
    });
  });

  it("CT04 - retorna 403 quando o token está expirado", () => {
    // Arrange: token com expiração no passado
    const token = jwt.sign({ id: 1 }, SECRET, { expiresIn: "-1s" });
    const { req, res, next } = buildMocks({
      headers: { authorization: token },
    });

    // Act
    verifyJWT(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("CT05 - retorna 403 quando o token usa SECRET diferente", () => {
    // Arrange
    const token = jwt.sign({ id: 1 }, "outro_secret_errado", {
      expiresIn: "1h",
    });
    const { req, res, next } = buildMocks({
      headers: { authorization: token },
    });

    // Act
    verifyJWT(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
