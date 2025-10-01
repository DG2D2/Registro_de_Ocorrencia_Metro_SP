const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// 🔧 Substitua com suas credenciais
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Adeveloperborn*",
  database: "metro_ocorrencias"
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
    data_nascimento,
    data_ocorrido,
    hora_ocorrido,
    descricao,
    consentimento
  } = req.body;

  try {
    // 1. Verifica ou insere LOCAL
    const [localResult] = await db.promise().query(
      "SELECT id_local FROM LOCAL WHERE linha = ? AND estacao = ?",
      [linha_metro, estacao]
    );

    let id_local;
    if (localResult.length > 0) {
      id_local = localResult[0].id_local;
    } else {
      const [insertLocal] = await db.promise().query(
        "INSERT INTO LOCAL (linha, estacao) VALUES (?, ?)",
        [linha_metro, estacao]
      );
      id_local = insertLocal.insertId;
    }

    // 2. Insere OCORRENCIA
    const [insertOcorrencia] = await db.promise().query(
      `INSERT INTO OCORRENCIA 
        (tipo_ocorrencia, data_ocorrido, hora_ocorrido, descricao, consentimento, id_local)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tipo_ocorrencia,
        data_ocorrido,
        hora_ocorrido,
        descricao || null,
        consentimento ? 1 : 0,
        id_local
      ]
    );

    const id_ocorrencia = insertOcorrencia.insertId;

    // 3. Insere PESSOA
    await db.promise().query(
      `INSERT INTO PESSOA (genero, data_nascimento, id_ocorrencia)
       VALUES (?, ?, ?)`,
      [genero, data_nascimento, id_ocorrencia]
    );

    res.status(200).send("Ocorrência registrada.");
  } catch (err) {
    console.error("Erro ao registrar ocorrência:", err);
    res.status(500).send("Erro interno no servidor.");
  }
});