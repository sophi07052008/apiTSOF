import connect from "../db/connect.js";

export default class eventoController {
  // Criação de um evento
  static async createEvento(req, res) {
    const { nome, descricao, data_hora, local, fk_id_organizador } = req.body;
    const imagem = req.file?.buffer || null;
    const imagem_tipo = req.file?.mimetype || null;

    if (!nome || !descricao || !data_hora || !local || !fk_id_organizador) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    const query = `
    INSERT INTO evento (nome, descricao, data_hora, local, fk_id_organizador, imagem, imagem_tipo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
    const values = [
      nome,
      descricao,
      data_hora,
      local,
      fk_id_organizador,
      imagem,
      imagem_tipo,
    ];

    try {
      connect.query(query, values, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao criar o evento" });
        }
        res.status(201).json({ message: "Evento criado com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obtenção de todos os eventos
  static async getAllEventos(req, res) {
    const query = `SELECT * FROM evento`;

    try {
      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar eventos" });
        }
        res
          .status(200)
          .json({ message: "Eventos obtidos com sucesso", events: results });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualização de um evento
  static async updateEvento(req, res) {
    const { id_evento, nome, descricao, data_hora, local, fk_id_organizador } =
      req.body;

    if (
      !id_evento ||
      !nome ||
      !descricao ||
      !data_hora ||
      !local ||
      !fk_id_organizador
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    const query = `UPDATE evento SET nome = ?, descricao = ?, data_hora = ?, local = ?, fk_id_organizador = ? WHERE id_evento = ?`;
    const values = [
      nome,
      descricao,
      data_hora,
      local,
      fk_id_organizador,
      id_evento,
    ];

    try {
      connect.query(query, values, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao atualizar o evento" });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Evento não encontrado" });
        }
        res.status(200).json({ message: "Evento atualizado com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Exclusão de um evento
  static async deleteEvento(req, res) {
    const eventId = req.params.id;
    const query = `DELETE FROM evento WHERE id_evento = ?`;
    const values = [eventId];

    try {
      connect.query(query, values, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao excluir o evento" });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Evento não encontrado" });
        }
        res.status(200).json({ message: "Evento excluído com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  static async getEventosDias(req, res) {
    const data = req.params.data_hora;
    const query = `SELECT * FROM evento WHERE data_hora =? BETWEEN ? and ?`;

    try {
      connect.query(query, data, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar eventos" });
        }

        //Comparando datas
        const dataFiltro = new Date(data).toISOString().split("T")[0];
        const eventoDia = results.filter(
          (evento) =>
            new Date(evento.data_hora).toISOString().split("T")[0] ===
            dataFiltro[0]
        );
        console.log("Data filtro: ", dataFiltro);
        console.log("Eventos: ", eventoDia);

        return res.status(200).json({ message: "Ok" });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar eventos" });
    }
  }

  static async getImagemEvento(req, res) {
    const id = req.params.id;

    const query = "SELECT imagem, imagem_tipo FROM evento WHERE id_evento = ?";
    connect.query(query, [id], (err, results) => {
      if (err || results.length === 0 || !results[0].imagem) {
        return res.status(404).send("Imagem não encontrada");
      }

      res.set("Content-Type", results[0].imagem_tipo || "image/png"); // Define dinamicamente o tipo
      res.send(results[0].imagem);
    });
  }
};
