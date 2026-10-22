import connect from './connect.js'

export default function testConnect() {
  try {
    const query = `SELECT 'Conexão bem-sucedida' AS Mensagem`;
    connect.query(query, function (err) {
      if (err) {
        console.log("Conexão não realizada", err);
        return;
      }
      console.log('Conexão realizada com Mysql')
    });
  } catch(error) {
    console.error("Erro a executar a consulta:", error);
  }
};
