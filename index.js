// index.js - adjusted to use ENV variables and serve frontend
require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

// Route for homepage (apresentacao.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "apresentacao.html"));
});

const db = mysql.createConnection({
  host: process.env.DB_HOST || "mysql.railway.internal",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "metro_ocorrencias",
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false }
});


// Conexão com o banco
db.connect(err => {
  if (err) {
    console.error("Erro ao conectar no banco:", err);
  } else {
    console.log("Conectado ao MySQL.");
  }
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
    consentimento
  } = req.body;

  try {
    // 0. Buscar ID do artigo criminal
    const [artigoResult] = await db.promise().query(
      "SELECT id_artigo FROM ARTIGOS_CRIMINAIS WHERE nome_artigo = ?",
      [tipo_ocorrencia]
    );

    if (artigoResult.length === 0) {
      return res.status(400).send("Tipo de ocorrência inválido.");
    }

    const id_artigo = artigoResult[0].id_artigo;


    // 1. Verifica ou insere LOCAL
    const [localResult] = await db.promise().query(
      "SELECT id_local FROM `LOCAL` WHERE linha = ? AND estacao = ?",
      [linha_metro, estacao]
    );

    let id_local;
    if (localResult.length > 0) {
      id_local = localResult[0].id_local;
    } else {
      const [insertLocal] = await db.promise().query(
        "INSERT INTO `LOCAL` (linha, estacao) VALUES (?, ?)",
        [linha_metro, estacao]
      );

      id_local = insertLocal.insertId;
    }

    // 2. Insere OCORRENCIA
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
        id_artigo
      ]
    );

    const id_ocorrencia = insertOcorrencia.insertId;

    // 3. Insere PESSOA
    await db.promise().query(
      `INSERT INTO PESSOA (genero, idade, id_ocorrencia)
       VALUES (?, ?, ?)`,
      [genero, idade, id_ocorrencia]
    );

    res.status(200).send("Ocorrência registrada.");
  } catch (err) {
    console.error("Erro ao registrar ocorrência:", err);
    res.status(500).send("Erro interno no servidor.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
