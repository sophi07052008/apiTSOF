import { jest } from "@jest/globals";

// Mock obrigatório ANTES de qualquer import que use connect.js (ESM pattern)
const mockQuery = jest.fn();

jest.unstable_mockModule("../../src/db/connect.js", () => ({
  default: { query: mockQuery },
}));

// Importações dinâmicas APÓS o mock (obrigatório em ESM)
const { default: validateCpf } = await import(
  "../../src/services/validateCpf.js"
);

describe("validateCpf - Testes Unitários", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("CT01 - retorna null quando CPF não está cadastrado", async () => {
    // Arrange: banco não encontra nenhum usuário com esse CPF
    mockQuery.mockImplementation((_sql, _vals, cb) => cb(null, []));

    // Act
    const result = await validateCpf("12345678901");

    // Assert
    expect(result).toBeNull();
  });

  it("CT02 - retorna erro quando CPF já está cadastrado (insert novo usuário)", async () => {
    // Arrange: banco retorna um usuário existente com esse CPF
    mockQuery.mockImplementation((_sql, _vals, cb) =>
      cb(null, [{ id_usuario: 5 }])
    );

    // Act
    const result = await validateCpf("12345678901");

    // Assert
    expect(result).toEqual({ error: "CPF já cadastrado" });
  });

  it("CT03 - retorna null quando CPF pertence ao próprio usuário (update)", async () => {
    // Arrange: CPF pertence ao usuário que está sendo atualizado
    const userId = 5;
    mockQuery.mockImplementation((_sql, _vals, cb) =>
      cb(null, [{ id_usuario: userId }])
    );

    // Act
    const result = await validateCpf("12345678901", userId);

    // Assert
    expect(result).toBeNull();
  });

  it("CT04 - retorna erro quando CPF pertence a outro usuário (update)", async () => {
    // Arrange: CPF pertence a um usuário diferente (id 99)
    mockQuery.mockImplementation((_sql, _vals, cb) =>
      cb(null, [{ id_usuario: 99 }])
    );

    // Act
    const result = await validateCpf("12345678901", 5);

    // Assert
    expect(result).toEqual({ error: "CPF já cadastrado para outro usuário" });
  });

  it("CT05 - rejeita a promise quando ocorre erro no banco", async () => {
    // Arrange: banco retorna erro
    mockQuery.mockImplementation((_sql, _vals, cb) =>
      cb(new Error("DB Error"))
    );

    // Act & Assert
    await expect(validateCpf("12345678901")).rejects.toBe(
      "Erro ao verificar CPF"
    );
  });
});
