import mysql from "mysql2";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url"; // 👈 para corrigir o __dirname

// Corrige __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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

console.log("Senha recebida pelo ambiente:", process.env.DB_PASSWORD ? "OK" : "VAZIA");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  ssl: { rejectUnauthorized: true }
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar no banco:", err);
  } else {
    console.log("✅ Conectado ao MySQL com sucesso!");
  }
});

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
    const [artigoResult] = await db.promise().query(
      "SELECT id_artigo FROM ARTIGOS_CRIMINAIS WHERE nome_artigo = ?",
      [tipo_ocorrencia]
    );

    if (artigoResult.length === 0) {
      return res.status(400).send("Tipo de ocorrência inválido.");
    }

    const id_artigo = artigoResult[0].id_artigo;

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
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
