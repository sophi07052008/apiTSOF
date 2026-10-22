import validateUser from "../src/services/validateUser.js";

describe("validateUser - Testes Unitários", () => {
  // Usuário base com todos os dados corretos, reaproveitado nos testes
  const usuarioValido = {
    cpf: "12345678901",
    email: "aluno@senai.br",
    password: "123",
    name: "aluno",
    data_nascimento: "2005-05-10",
  };

  // ─── Happy Path ───────────────────────────────────────────────────────────
  it("CT01 - retorna null quando todos os campos são válidos", () => {
    expect(validateUser(usuarioValido)).toBeNull();
  });

  // ─── Campos obrigatórios ──────────────────────────────────────────────────
  it("CT02 - retorna erro quando falta data_nascimento", () => {
    const { data_nascimento, ...semData } = usuarioValido;
    expect(validateUser(semData)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("CT06 - retorna erro quando falta email", () => {
    const { email, ...semEmail } = usuarioValido;
    expect(validateUser(semEmail)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("CT07 - retorna erro quando falta name", () => {
    const { name, ...semName } = usuarioValido;
    expect(validateUser(semName)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("CT08 - retorna erro quando falta password", () => {
    const { password, ...semPassword } = usuarioValido;
    expect(validateUser(semPassword)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("CT09 - retorna erro quando falta cpf", () => {
    const { cpf, ...semCpf } = usuarioValido;
    expect(validateUser(semCpf)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  // ─── Validação de CPF ──────────────────────────────────────────────────────
  it("CT03 - retorna erro quando o CPF tem menos de 11 dígitos", () => {
    expect(validateUser({ ...usuarioValido, cpf: "123" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("CT05 - retorna erro quando o CPF contém letras", () => {
    expect(validateUser({ ...usuarioValido, cpf: "1234567890A" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("CT10 - retorna erro quando o CPF tem mais de 11 dígitos", () => {
    expect(validateUser({ ...usuarioValido, cpf: "123456789012" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  // ─── Validação de Email ────────────────────────────────────────────────────
  it("CT04 - retorna erro quando o email não tem @", () => {
    expect(
      validateUser({ ...usuarioValido, email: "aluno.senai.br" })
    ).toEqual({
      error: "Email inválido. Deve conter @",
    });
  });
});
