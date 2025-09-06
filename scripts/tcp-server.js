// scripts/tcp-server.js
// Backend receptor de pacotes do rastreador via TCP

const net = require("net");
const PORT = process.env.PORT || process.env.RASTREADOR_TCP_PORT || 9000;
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
  const remoteAddress = socket.remoteAddress + ":" + socket.remotePort;
  console.log(`[${new Date().toISOString()}] Nova conexão de ${remoteAddress}`);

  socket.on("data", async (data) => {
    const mensagem = data.toString().trim();
    const logMsg = `[${new Date().toISOString()}] Pacote de ${remoteAddress}: ${mensagem}`;
    console.log(logMsg);
    // Salvar todos os pacotes recebidos, mesmo inválidos
    require("fs").appendFileSync("rastreador-log.txt", logMsg + "\n");

    // Extrair e salvar posição no banco
    const pos = parsePacote(mensagem);
    if (pos) {
      try {
        await savePosicao(pos.identificador, pos.latitude, pos.longitude);
        console.log(
          `[${new Date().toISOString()}] Posição salva no banco:`,
          pos
        );
      } catch (err) {
        console.error(
          `[${new Date().toISOString()}] Erro ao salvar posição:`,
          err
        );
      }
    } else {
      console.warn(
        `[${new Date().toISOString()}] Pacote inválido de ${remoteAddress}: ${mensagem}`
      );
    }
  });

  socket.on("error", (err) => {
    console.error(
      `[${new Date().toISOString()}] Erro no socket de ${remoteAddress}:`,
      err
    );
  });

  socket.on("close", () => {
    console.log(
      `[${new Date().toISOString()}] Conexão encerrada: ${remoteAddress}`
    );
  });
});

server.listen(PORT, () => {
  console.log(`Servidor TCP ouvindo na porta ${PORT}`);
});
