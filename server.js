// Módulos necessários
var http = require('http');        // Módulo HTTP para criar o servidor web
var handle = require('./handlers'); // Módulo personalizado com os manipuladores de requisições
var handle_ext = require('./handlers_ext'); // Extensão para novos manipuladores
var url = require("url");          // Módulo para manipulação de URLs
var fs = require("fs");            // Módulo para manipulação de arquivos

// Mapeamento de rotas para seus respectivos manipuladores
var handles = {};
handles["/"] = handle.index;             // Página inicial
handles["/channel"] = handle.showChannel;  // Exibe canais/regras
handles["/delete"] = handle.deleteRule;    // Remove regras
handles["/insert"] = handle.insertRule;    // Adiciona regras
handles["/mon"] = handle.monitor;         // Monitoramento
handles["/save"] = handle.save;           // Salva configurações
handles["/load"] = handle.load;           // Carrega configurações
handles["/settings"] = handle.settings;    // Configurações do sistema
handles["/chainlist"] = handle.chainList;  // Lista de cadeias
handles["/login"] = handle.authMe;         // Autenticação
handles["/logout"] = handle.logout;        // Logout
handles["/users"] = handle.userList;       // Gerenciamento de usuários

// Mescla os manipuladores do arquivo de extensão com os principais
for (var key in handle_ext) {
    if (handle_ext.hasOwnProperty(key)) {
        handles[key] = handle_ext[key];
    }
}

// Cria o servidor HTTP
http.createServer(function handler(req, res) {
    // Extrai o caminho da URL
    var pathname = url.parse(req.url).pathname;
    
    // Configura a codificação da requisição
    req.setEncoding("utf8");
    
    // Verifica se existe um manipulador para a rota solicitada
    if (handles[pathname]) {
        // Verifica autenticação antes de processar a requisição
        if(handle.isAuth(req)) {
            // Usuário autenticado, chama o manipulador da rota
            handles[pathname](req, res);
        }
        else {
            // Redireciona para a página de login se não estiver autenticado
            handle.authMe(req, res);
        }
    }
    else {
		// Se não for uma rota de API, tenta servir um arquivo estático
		var file = "./tpl" + pathname;
		
		// Verifica se o arquivo existe
		fs.exists(file, function(ex) {
			if(ex) {
				// Lê e envia o arquivo solicitado
				fs.readFile(file, [], function(err, data) {
					//res.writeHead(320, {"Content-Type": "text/plain"});
					res.end(data);
				});
			}
			else {
				// Arquivo não encontrado, retorna 404
				console.log("No request handler found for " + pathname);
				res.writeHead(404, {"Content-Type": "text/plain"});
				res.write("404 Not found");
				res.end();
			}
		});
    }
// Inicia o servidor HTTP na porta 1337
}).listen(1337);
console.log('Server running at http://*:1337/');


/**
 * Configuração do WebSocket para comunicação em tempo real
 * Permite monitoramento de logs e captura de pacotes
 */
var proc = require('child_process');  // Para executar processos do sistema
var ws = require("nodejs-websocket");  // Biblioteca WebSocket
var log = null;    // Referência ao processo de log
var dump = null;   // Referência ao processo de dump de pacotes

/**
 * Encerra o processo de monitoramento de logs
 */
function closeLogs() {
	if(log) {
		log.kill('SIGHUP');  // Envia sinal de encerramento
		log = null;         // Limpa a referência
	}
}

/**
 * Encerra o processo de captura de pacotes
 */
function closeDump() {
	if(dump) {
		dump.kill('SIGHUP');  // Envia sinal de encerramento
		dump = null;         // Limpa a referência
	}
}

// Cria o servidor WebSocket na porta 8001
var server = ws.createServer(function (conn) {
	// Evento disparado quando uma mensagem é recebida
	conn.on("text", function (data) {
		// Converte a mensagem JSON para objeto
		var params = JSON.parse(data);
		// Monitora o arquivo de log do sistema
		if(params.name == "syslog") {
			// Inicia o comando 'tail -f' para monitorar o arquivo de log em tempo real
			log = proc.spawn("tail", ["-f", "/var/log/syslog"]);
			
			// Evento disparado quando há novas linhas no log
			log.stdout.on('data', function (lines) {
				// Formata os dados para envio ao cliente
				var outData = {name: params.name, data: lines.toString().split("\n")};
				if(log)
					// Envia os dados para o cliente via WebSocket
					conn.sendText(JSON.stringify(outData));
			});
		}
		// Captura pacotes de rede usando tcpdump
		else if(params.name == "dump") {
			// Configura os argumentos básicos do tcpdump
			var args = ["-i", params.eth, "-n", "-l"];  // -i: interface, -n: não resolve nomes, -l: saída em tempo real
			
			// Adiciona filtros conforme os parâmetros fornecidos
			if(params.port)
				args.push("port", params.port);  // Filtra por porta
			if(params.src)
				args.push("src", params.src);    // Filtra por IP de origem
			if(params.dst) {
				if(params.src)
					args.push("or");  // Adiciona operador OR se houver origem e destino
				args.push("dst", params.dst);    // Filtra por IP de destino
			}
			
			// Informa ao cliente que o dump foi iniciado
			conn.sendText(JSON.stringify({name: params.name, data: ["Exec tcpdump with args: " + args.toString()]}));
			
			// Inicia o processo tcpdump
			dump = proc.spawn("tcpdump", args);
			
			// Evento disparado quando há novos pacotes capturados
			dump.stdout.on('data', function (lines) {
				// Formata os dados para envio ao cliente
				var outData = {name: params.name, data: lines.toString().split("\n")};
				if(dump)
					// Envia os dados para o cliente via WebSocket
					conn.sendText(JSON.stringify(outData));
			});
		}
		// Encerra o monitoramento de logs
		else if(params.name == "closelog") {
			closeLogs();
		}
		// Encerra a captura de pacotes
		else if(params.name == "closedump") {
			closeDump();
		}
    });
	// Evento disparado quando a conexão é fechada
	conn.on("close", function (code, reason) {
		// Garante que todos os processos sejam encerrados
		closeLogs();
		closeDump();
	});
// Inicia o servidor WebSocket na porta 8001
}).listen(8001);
