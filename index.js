const express = require('express'); // Framework web para Node.js
const path = require('path'); // Módulo para lidar com caminhos de arquivos
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.CHROME_BIN || null, // Garantir que o Puppeteer encontre o Chromium
    }
});

const app = express(); // Inicializa o servidor Express
app.use(express.json()); // Middleware para decodificar JSON

// Middleware para verificar o acesso direto via barra de navegação
function bloquearAcessoDireto(req, res, next) {
    if (req.headers.referer) {
        // Se houver um referer, permitimos o acesso
        next();
    } else {
        // Se não houver referer, significa que a rota foi acessada diretamente pela barra de navegação
        res.redirect('/');
    }
}

client.on('qr', (qr) => {
    // Exibe o QR code no terminal para conexão ao WhatsApp Web
    qrcode.generate(qr, { small: true });
    console.log('\nEscaneie o QR code acima para conectar ao WhatsApp');
});

client.on('ready', () => {
    console.log('\nCliente conectado ao WhatsApp! Pronto para enviar mensagens.');
});

client.on('authenticated', (session) => {
    console.log('\nSessão autenticada com sucesso!');
});

client.on('auth_failure', () => {
    console.error('\nFalha na autenticação, escaneie o QR code novamente.');
});

// Inicializa o cliente do WhatsApp
client.initialize();

// Definição global da variável awaitingColorChoice para armazenar o estado de escolha de cor dos clientes
let awaitingColorChoice = {};

// Função para calcular o valor total com base na escolha do doce
function calcularValor(choice) {
    let valorDoce = 10.00; // Valor base do doce
    return valorDoce;
}

// Função para formatar o nome completo dos doces
function formatarNomeDoce(choice) {
    switch (choice.toLowerCase()) {
        case 'sonho':
            return 'Sonho de Valsa';
        case 'ouro':
            return 'Ouro Branco';
        case 'bis':
            return 'Bis';
        default:
            throw new Error('Escolha de doce inválida.');
    }
}

// Função para enviar mensagens via WhatsApp
function sendMessageToNumber(number, messageText) {
    let cleanedNumber = number.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Verifica se o número já está no formato correto com o código do país '55'
    if (!cleanedNumber.startsWith('55')) {
        // Verifica se o número tem 11 dígitos (incluindo o dígito '9' depois do DDD)
        if (cleanedNumber.length === 11 && cleanedNumber[2] === '9') {
            // Remove o dígito '9' após o DDD
            cleanedNumber = cleanedNumber.slice(0, 2) + cleanedNumber.slice(3);
        }
        // Adiciona o código do país '55' para números sem ele
        cleanedNumber = '55' + cleanedNumber;
    }

    // Adiciona o sufixo do WhatsApp '@c.us' para o chatId
    const chatIdForWhatsApp = `${cleanedNumber}@c.us`;

    // Exibe no console o número para o qual a mensagem está sendo enviada
    console.log(`\nEnviando mensagem para o número: ${chatIdForWhatsApp}`);

    // Envia a mensagem utilizando o cliente do WhatsApp
    return client.sendMessage(chatIdForWhatsApp, messageText)
        .then(response => {
            console.log(`\nMensagem enviada com sucesso para ${chatIdForWhatsApp}`);
            return response;  // Retorna a resposta do WhatsApp se necessário
        })
        .catch(err => {
            console.error(`\nErro ao enviar mensagem para ${chatIdForWhatsApp}:`, err);
            throw err;  // Lança o erro para tratar onde a função for chamada
        });
}

// Função para formatar a mensagem 1 (informações do pedido)
function formatMessage1(nome, message, choice, valor, sala, destinatario) {
    const nomeDoce = formatarNomeDoce(choice);

    return `
Olá ${nome}, Seja bem-vindo ao Correio Elegante! 💌

Sua mensagem para seu crush/amigo(a) foi:
*${message}*

Sua escolha de doce foi: ${nomeDoce}

Local de entrega: Sala ${sala}, para ${destinatario}.

O valor da Carta + Doce + Entrega fica no total de: R$ ${valor.toFixed(2)}.

Para darmos continuidade ao serviço, pedimos que faça o pix na chave abaixo. 
    `;
}

// Função para formatar a mensagem com chave PIX
function formatPixMessage() {
    return `
64bb0e47-a574-4b15-afbe-05116a82d2e0 
    `;
}

// Função para formatar a segunda mensagem (menu de escolha de cor)
function formatMessage2() {
    return `
Por favor, escolha a cor do envelope desejado.

1️⃣ Azul (para amigos) 🫂
2️⃣ Vermelho (para crush) 😍
3️⃣ Amarelo (para ocasiões especiais)✨
4️⃣ Verde (Boa sorte ou sucesso) 🌳

Responda com o número correspondente. 💌
    `;
}

// Função para formatar a terceira mensagem (alerta de resposta inválida)
function formatMessage3() {
    return `
*Resposta inválida*. Por favor, escolha uma numero correspondente a cor do envelope:

1️⃣ Azul (para amigos) 🫂
2️⃣ Vermelho (para crush) 😍
3️⃣ Amarelo (para ocasiões especiais) ✨
4️⃣ Verde (Boa sorte ou sucesso) 🌳

Responda com o número correspondente! 💌
    `;
}

// Função para formatar a quarta mensagem (confirmação da cor escolhida)
function formatMessage4(nome, colorChoice) {
    let colorText = '';
    switch (colorChoice) {
        case '1':
            colorText = 'Vermelho';
            break;
        case '2':
            colorText = 'Azul';
            break;
        case '3':
            colorText = 'Amarelo';
            break;
        case '4':

    }
    return `
Olá ${nome}, você escolheu a cor ${colorText} para o envelope.

Assim que recebermos o comprovante do pagamento, efetuaremos a confecção e entrega da carta.
O Correio Elegante agradece pela escolha! 💌
    `;
}

// Rota para enviar a mensagem
app.post('/api/enviarMensagem', (req, res) => {
    const { nome, phone, message, choice, sala, destinatario } = req.body;
    const cleanedPhone = phone.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Adiciona o código do país '55' e remove o dígito 9 após o DDD
    const formattedPhone = '55' + cleanedPhone.replace(/^(\d{2})9?(\d{4})(\d{4})$/, '$1$2$3');

    // Verifica se todos os campos estão presentes
    if (!nome || !phone || !message || !choice || !sala || !destinatario) {
        console.log('Campos faltando!'); // Log para verificar campos faltando
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    try {
        // Calcula o valor total com base na escolha do doce
        const valor = calcularValor(choice);

        // Formata a primeira mensagem a ser enviada
        const formattedMessage1 = formatMessage1(nome, message, choice, valor, sala, destinatario);

        console.log(`Recebendo os dados: Nome: ${nome}, Telefone: ${phone}, Mensagem: ${message}, Escolha: ${choice}, Sala: ${sala}, Destinatário: ${destinatario}`); // Log dos dados recebidos

        // Envia a primeira mensagem com as informações do pedido
        sendMessageToNumber(phone + '@c.us', formattedMessage1)
            .then(() => {
                // Após enviar a primeira mensagem, envia a mensagem formatPixMessage com a chave pix.
                return sendMessageToNumber(phone + '@c.us', formatPixMessage());
            })
            .then(() => {
                // Após enviar a mensagem com a chave pix, envia a mensagem formatMessage2 solicitando a escolha de cor
                return sendMessageToNumber(phone + '@c.us', formatMessage2());
            })
            .then(() => {
                // Aqui registramos o cliente no awaitingColorChoice e colocamos no loop de escolha de cor
                awaitingColorChoice[formattedPhone] = { nome, isAwaiting: true }; // Marcamos como aguardando a escolha de cor
                console.log(`Registrando o cliente ${formattedPhone} no awaitingColorChoice`);
                console.log('Estado atual de awaitingColorChoice:', awaitingColorChoice);

                res.json({ success: true, message: 'Mensagens enviadas com sucesso! Aguardando resposta da cor.' });
            })
            .catch(err => {
                console.error('Erro ao enviar a mensagem pelo WhatsApp:', err);
                res.status(500).json({ success: false, message: 'Erro ao enviar a mensagem.' });
            });
    } catch (error) {
        console.error('Erro ao calcular o valor:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Evento de recebimento de mensagens
client.on('message', message => {
    const chatId = message.from;
    const receivedText = message.body.trim();
    const phone = chatId.replace('@c.us', ''); // Remove o sufixo @c.us

    console.log(`Mensagem recebida de ${phone}: ${receivedText}`);
    console.log(`Estado Atual de awaitingColorChoice:`, awaitingColorChoice);

    // Verifica se o cliente está em fase de escolha da cor
    if (awaitingColorChoice[phone] && awaitingColorChoice[phone].isAwaiting === true) {
        console.log(`Cliente ${phone} entrou no loop de escolha de cor`);

        // Verifica se a resposta é válida (1, 2 ou 3)
        if (['1', '2', '3'].includes(receivedText)) {
            const nomeCliente = awaitingColorChoice[phone].nome;
            const colorConfirmation = formatMessage4(nomeCliente, receivedText);

            sendMessageToNumber(chatId, colorConfirmation)
                .then(() => {
                    console.log(`Cor escolhida pelo cliente: ${colorConfirmation}`);
                    // Após escolha válida, remove o cliente do estado de escolha de cor
                    delete awaitingColorChoice[phone];
                    console.log(`Cliente ${phone} removido da fase de escolha de cor.`);
                })
                .catch(err => {
                    console.error('Erro ao enviar a confirmação de cor:', err);
                });
        } else {
            // Se a resposta não for "1", "2" ou "3", envia mensagem de alerta e mantém no loop
            sendMessageToNumber(chatId, formatMessage3())
                .then(() => {
                    console.log('Mensagem de alerta enviada. Aguardando escolha válida...');
                })
                .catch(err => {
                    console.error('Erro ao enviar mensagem de alerta:', err);
                });
        }
    } else {
        // Se o cliente não está em fase de escolha de cor, processar outras mensagens normalmente
        console.log(`Mensagem recebida fora da fase de escolha de cor: ${receivedText}`);
    }
});

// Definir o diretório de arquivos estáticos
app.use(express.static(path.join(__dirname, '/public')));

// Rota para a página inicial (/) - serve a página home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/home.html'));
});

// Rota principal (/app), bloqueada para acesso direto via barra de navegação
app.get('/app', bloquearAcessoDireto, (req, res) => {
    res.sendFile(path.join(__dirname, '/public/app.html'));
});

// rota para a pagina de termos de uso.
app.get('/termos', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/termosdeuso.html'));
});

// Rota de confirmação (/confirmacao), bloqueada para acesso direto via barra de navegação
app.get('/confirmacao', bloquearAcessoDireto, (req, res) => {
    res.sendFile(path.join(__dirname, '/public/confirmation.html'));
});

app.use(express.urlencoded({ extended: true })); // Middleware para decodificar os dados enviados via formulário

// Iniciar o servidor na porta 8000
app.listen(8000, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta 8000`);
});
