import connect from "../db/connect.js";

export default class ingressoController {
  // Criação de um ingresso
  static async createIngresso(req, res) {
    const { preco, tipo, fk_id_evento } = req.body;
    console.log(preco, tipo, fk_id_evento)
    if (!preco || !tipo || !fk_id_evento) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    const query = `INSERT INTO ingresso (preco, tipo, fk_id_evento) VALUES (?, ?, ?)`;
    const values = [preco, tipo, fk_id_evento];

    try {
      connect.query(query, values, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao criar o ingresso" });
        }
        res.status(200).json({ message: "Ingresso criado com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  static async getByIdEvento(req, res) {
    const eventoId = req.params.id;

    const query = `
      SELECT 
        ingresso.id_ingresso, 
        ingresso.preco, 
        ingresso.tipo, 
        ingresso.fk_id_evento, 
        evento.nome AS nome_evento
      FROM ingresso
      JOIN evento ON ingresso.fk_id_evento = evento.id_evento
      WHERE evento.id_evento = ?;
    `;

    try {
      connect.query(query, [eventoId], (err, results) => {
        if (err) {
          console.error("Erro ao buscar ingressos por evento:", err);
          return res
            .status(500)
            .json({ error: "Erro ao buscar ingressos do evento" });
        }

        res.status(200).json({
          message: "Ingressos do evento obtidos com sucesso",
          ingressos: results,
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obtenção de todos os ingressos
  static async getAllIngressos(req, res) {
    const query = `SELECT 
    ingresso.id_ingresso, 
    ingresso.preco, 
    ingresso.tipo, 
    ingresso.fk_id_evento, 
    evento.nome AS nome_evento 
FROM ingresso
JOIN evento ON ingresso.fk_id_evento = evento.id_evento;
`;

    try {
      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar ingressos" });
        }
        res.status(200).json({
          message: "Ingressos obtidos com sucesso",
          ingressos: results,
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualização de um ingresso
  static async updateIngresso(req, res) {
    const { id_ingresso, preco, tipo, fk_id_evento } = req.body;

    if (!id_ingresso || !preco || !tipo || !fk_id_evento) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    const query = `UPDATE ingresso SET preco = ?, tipo = ?, fk_id_evento = ? WHERE id_ingresso = ?`;
    const values = [preco, tipo, fk_id_evento, id_ingresso];

    try {
      connect.query(query, values, (err, results) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Erro ao atualizar o ingresso" });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Ingresso não encontrado" });
        }
        res.status(200).json({ message: "Ingresso atualizado com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Exclusão de um ingresso
  static async deleteIngresso(req, res) {
    const ingressoId = req.params.id;
    const query = `DELETE FROM ingresso WHERE id_ingresso = ?`;
    const values = [ingressoId];

    try {
      connect.query(query, values, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao excluir o ingresso" });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Ingresso não encontrado" });
        }
        res.status(200).json({ message: "Ingresso excluído com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
