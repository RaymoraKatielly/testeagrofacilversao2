const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Permitir requisições do seu app
app.use(cors());
app.use(bodyParser.json());

// Endpoint de suporte
app.post("/send-support", (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  console.log("Mensagem recebida do app:");
  console.log("Email:", email);
  console.log("Mensagem:", message);

  // Aqui você poderia enviar email ou salvar no banco
  res.json({ status: "ok", message: "Mensagem recebida com sucesso!" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
