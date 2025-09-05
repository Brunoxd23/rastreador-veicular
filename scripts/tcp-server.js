// scripts/tcp-server.js
// Backend receptor de pacotes do rastreador via TCP

const net = require("net");
const PORT = process.env.RASTREADOR_TCP_PORT || 9000;
const { savePosicao } = require("./save-posicao");

// Função exemplo para extrair dados do pacote (ajuste conforme modelo do rastreador)
function parsePacote(mensagem) {
  // Exemplo: pacote "IMEI,lat,lng"
  // Exemplo real: "123456789012345, -23.5505, -46.6333"
  const partes = mensagem.trim().split(",");
  if (partes.length >= 3) {
    const identificador = partes[0].trim();
    const latitude = parseFloat(partes[1]);
    const longitude = parseFloat(partes[2]);
    return { identificador, latitude, longitude };
  }
  return null;
}

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const mensagem = data.toString();
    console.log("Pacote recebido:", mensagem);
    // Salvar em arquivo para log
    require("fs").appendFileSync("rastreador-log.txt", mensagem + "\n");
    // Extrair e salvar posição no banco
    const pos = parsePacote(mensagem);
    if (pos) {
      await savePosicao(pos.identificador, pos.latitude, pos.longitude);
    } else {
      console.error("Pacote inválido:", mensagem);
    }
  });

  socket.on("error", (err) => {
    console.error("Erro no socket:", err);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor TCP ouvindo na porta ${PORT}`);
});
