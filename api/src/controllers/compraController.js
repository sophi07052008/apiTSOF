import connect from "../db/connect.js";

export default class compraController {
  static async createCompra(req, res) {
    const { data_compra, id_usuario, ingressos } = req.body;
    // ingressos será um array de objetos [{id_ingresso:1,quantidade:2},{id_ingresso:2,quantidade:1}]

    if (
      !data_compra ||
      !id_usuario ||
      !Array.isArray(ingressos) ||
      ingressos.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Dados inválidos. Verifique os parâmetros enviados." });
    }

    // Calcular o valor total da compra
    let valor_total = 0;

    try {
      const ingressosDetalhados = await Promise.all(
        ingressos.map(async (ingresso) => {
          const [rows] = connect.query(
            "SELECT preco FROM ingresso WHERE id_ingresso = ?",
            [ingresso.id_ingresso]
          );

          if (rows.length === 0) {
            throw new Error(
              `Ingresso ID ${ingresso.id_ingresso} não encontrado.`
            );
          }

          const preco = rows[0].preco;
          valor_total += preco * ingresso.quantidade;

          return {
            id_ingresso: ingresso.id_ingresso,
            quantidade: ingresso.quantidade,
          };
        })
      );

      // Criar a compra
      const [result] = connect.query(
        "INSERT INTO compra (data_compra, fk_id_usuario, valor) VALUES (?, ?, ?)",
        [data_compra, id_usuario, valor_total]
      );

      const id_compra = result.insertId;

      await Promise.all(
        ingressosDetalhados.map(async (ingresso) => {
          for (let i = 0; i < ingresso.quantidade; i++) {
            connect.query(
              "INSERT INTO ingresso_compra (fk_id_compra, fk_id_ingresso) VALUES (?, ?)",
              [id_compra, ingresso.id_ingresso]
            );
          }
        })
      );

      return res.status(201).json({
        message: "Compra realizada com sucesso!",
        id_compra,
        valor_total,
        ingressos: ingressosDetalhados,
      });
    } catch (error) {
      console.error("Erro ao realizar compra:", error);
      return res
        .status(500)
        .json({ error: "Erro ao realizar compra.", details: error.message });
    }
  }
};
