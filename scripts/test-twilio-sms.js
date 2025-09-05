// Teste de envio de SMS via Twilio
require("dotenv").config();
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const toNumber = process.argv[2] || "+5511964496255"; // Substitua pelo número de teste
const message = process.argv[3] || "Teste de envio via Twilio para Bruno";

client.messages
  .create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber,
  })
  .then((msg) => {
    console.log("Mensagem enviada! SID:", msg.sid);
  })
  .catch((err) => {
    console.error("Erro ao enviar:", err.message);
  });
