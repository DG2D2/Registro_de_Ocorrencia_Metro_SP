require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve arquivos estáticos (HTML, CSS, JS, imagens)

// Conexão com o banco de dados usando variáveis de ambiente
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

// Teste de conexão
db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar no banco:", err);
  } else {
    console.log("✅ Conectado ao banco de dados MySQL!");
  }
});

// Rota principal (abre a página de apresentação)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "apresentacao.html"));
});

// Rota de envio de ocorrência
app.post("/enviar", async (req, res) => {
  const {
    tipo_ocorrencia,
    linha_metro,
    estacao,
    genero,
    idade,
    data_ocorrido,
    hora_ocorrido,
    descricao,
    consentimento,
  } = req.body;

  try {
    const [artigoResult] = await db
      .promise()
      .query("SELECT id_artigo FROM ARTIGOS_CRIMINAIS WHERE nome_artigo = ?", [
        tipo_ocorrencia,
      ]);

    if (artigoResult.length === 0) {
      return res.status(400).send("Tipo de ocorrência inválido.");
    }

    const id_artigo = artigoResult[0].id_artigo;

    const [localResult] = await db
      .promise()
      .query("SELECT id_local FROM LOCAL WHERE linha = ? AND estacao = ?", [
        linha_metro,
        estacao,
      ]);

    let id_local;
    if (localResult.length > 0) {
      id_local = localResult[0].id_local;
    } else {
      const [insertLocal] = await db
        .promise()
        .query("INSERT INTO LOCAL (linha, estacao) VALUES (?, ?)", [
          linha_metro,
          estacao,
        ]);
      id_local = insertLocal.insertId;
    }

    const [insertOcorrencia] = await db.promise().query(
      `INSERT INTO OCORRENCIA 
        (tipo_ocorrencia, data_ocorrido, hora_ocorrido, descricao, consentimento, id_local, id_artigo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo_ocorrencia,
        data_ocorrido,
        hora_ocorrido,
        descricao || null,
        consentimento ? 1 : 0,
        id_local,
        id_artigo,
      ]
    );

    const id_ocorrencia = insertOcorrencia.insertId;

    await db
      .promise()
      .query(
        `INSERT INTO PESSOA (genero, idade, id_ocorrencia) VALUES (?, ?, ?)`,
        [genero, idade, id_ocorrencia]
      );

    res.status(200).send("Ocorrência registrada com sucesso!");
  } catch (err) {
    console.error("Erro ao registrar ocorrência:", err);
    res.status(500).send("Erro interno no servidor.");
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
