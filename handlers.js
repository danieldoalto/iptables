/**
 * handlers.js
 * 
 * Este arquivo contém todos os manipuladores de rota (route handlers) para as requisições HTTP.
 * Ele é responsável por executar comandos `iptables`, gerenciar configurações e autenticação de usuários.
 */
var proc = require('child_process');
var fs = require("fs");
var url = require("url");
var querystring = require("querystring");

module.exports = {
	// --- Autenticação e Configurações ---

	
	auth: false, // Flag que indica se a autenticação está habilitada globalmente (se não há senha).
	authUsers: {}, // Objeto para rastrear sessões de usuários autenticados pelo IP.
	
	settingsDir: "/etc/iptables/config.json", // Caminho para o arquivo de configuração.
	_settings: { // Objeto com as configurações padrão.
		savePath: "/etc/iptables/rules.save",
		user: "admin",
		pass: "",
		theme: "Silver",
		themes: []
	},
	
	/**
	 * Carrega as configurações do arquivo JSON especificado em 'settingsDir'.
	 * Se o arquivo não existir, usa as configurações padrão.
	 */
	loadSettings: function() {
		fs.exists(this.settingsDir, function(ex){
			if(ex) {
				fs.readFile(module.exports.settingsDir, [], function(err, data) {
					// Restore new settings after load from file
					var s = module.exports._settings;
					module.exports._settings = JSON.parse(data);
					for(var key in s) {
						if(!module.exports._settings[key]) {
							module.exports._settings[key] = s[key];
						}
					}
					module.exports.auth = module.exports._settings.pass === "";
					console.log("Load settings from " + module.exports.settingsDir);
				});
			}
		});
	},
	
	/**
	 * Salva o objeto '_settings' atual no arquivo de configuração JSON.
	 */
	saveSettings: function() {
		fs.writeFile(this.settingsDir, JSON.stringify(this._settings), function(err) {
			if(err) {
				return console.log(err);
			}

			console.log("The file was saved!");
		});
	},
	
	// --- Manipuladores de Rotas Principais ---

	/**
	 * Rota: /
	 * Serve a página principal da aplicação (index.html).
	 */
	index: function(req, res) {
		fs.readFile('./tpl/index.html', [], function(err, data) {
			//res.writeHead(320, {"Content-Type": "text/plain"});
			res.end(data);
		});
	},
	
	/**
	 * Rota: /show
	 * Retorna a lista de regras para uma tabela e chain específicas.
	 * Parâmetros (query string): t (tabela), c (chain).
	 * Ex: /show?t=filter&c=INPUT
	 */
	showChannel: function(req, res) {
		var query = url.parse(req.url).query;
		var args = querystring.parse(query);

		var run = "iptables -t " + args.t + " -S " + args.c.toUpperCase();
		proc.exec(run, function(error, stdout, stderr) {
			var arr = stdout.split("\n");
			
			res.end(JSON.stringify(arr));
		});
	},
	
	/**
	 * Rota: /delete
	 * Deleta uma regra específica de uma tabela e chain.
	 * Parâmetros (query string): t (tabela), c (chain), i (índice da regra).
	 * Ex: /delete?t=filter&c=INPUT&i=1
	 */
	deleteRule: function(req, res) {
		var query = url.parse(req.url).query;
		var args = querystring.parse(query);
		
		proc.exec("iptables -t " + args.t + " -D " + args.c.toUpperCase() + " " + args.i, function(error, stdout, stderr) {
			module.exports.showChannel(req, res);
		});
	},
	
	/**
	 * Rota: /insert
	 * Insere uma nova regra. A regra completa é enviada no corpo da requisição POST.
	 */
	insertRule: function (req, res) {
		var body = '';
	    req.on('data', function (data) {
	        body += data;
	    });
	    req.on('end', function () {
	        var post = querystring.parse(body);
	        
	        var rule = post['rule'];
	        console.log(rule);
	    	proc.exec("iptables " + rule, function(error, stdout, stderr) {
	    		if(stderr) {
	    			res.end(stderr);
	    		}
	    		else {
	    			module.exports.showChannel(req, res);
	    		}
	    	});
	    });
	},
	
	/**
	 * Rota: /monitor
	 * Retorna as estatísticas (pacotes, bytes) para as regras de uma tabela e chain.
	 * Usa 'iptables -L -v -n' para obter os dados.
	 * Parâmetros (query string): t (tabela), c (chain).
	 */
	monitor: function(req, res) {
		var query = url.parse(req.url).query;
		var args = querystring.parse(query);

		var run = "iptables -t " + args.t + " -L " + args.c.toUpperCase() + " -vn";
		proc.exec(run, function(error, stdout, stderr) {
			var arr = stdout.split("\n");
			
			res.writeHead(200, {"Cache-Control": "no-cache"});
			res.end(JSON.stringify(arr));
		});
	},
	
	/**
	 * Rota: /chain_list
	 * Retorna uma lista de todas as chains customizadas das tabelas 'filter', 'nat' e 'mangle'.
	 */
	chainList: function(req, res) {
		var new_arr = [];
		var n = 0;
		
		proc.exec("iptables -S", function(error, stdout, stderr) {
			var arr = stdout.split("\n");
			
			var n = 0;
			for(var i = 0; i < arr.length; i++) {
				var item = arr[i];
				if(item.indexOf("-N") === 0) {
					new_arr[n++] = item.substring(3) + " (filter)";
				}
			}
			
			proc.exec("iptables -t nat -S", function(error, stdout, stderr) {
				var arr = stdout.split("\n");

				for(var i = 0; i < arr.length; i++) {
					var item = arr[i];
					if(item.indexOf("-N") === 0) {
						new_arr[n++] = item.substring(3) + " (nat)";
					}
				}

				proc.exec("iptables -t mangle -S", function(error, stdout, stderr) {
					var arr = stdout.split("\n");

					for(var i = 0; i < arr.length; i++) {
						var item = arr[i];
						if(item.indexOf("-N") === 0) {
							new_arr[n++] = item.substring(3) + " (mangle)";
						}
					}
					
					res.end(JSON.stringify(new_arr));
				});
			});
		});
	},
    
    /**
     * Rota: /save
     * Salva a configuração atual do iptables para o arquivo definido em '_settings.savePath' usando 'iptables-save'.
     */
    save: function(req, res) {
        proc.exec("iptables-save > " + module.exports._settings.savePath, function(error, stdout, stderr) {

			res.end(stderr);
		});
    },
    
    /**
     * Rota: /load
     * Carrega (restaura) as regras de iptables a partir do arquivo definido em '_settings.savePath' usando 'iptables-restore'.
     */
    load: function(req, res) {
        proc.exec("iptables-restore < " + module.exports._settings.savePath, function(error, stdout, stderr) {

			res.end(stderr);
		});
    },
	
	/**
	 * Rota: /settings
	 * GET: Retorna o objeto de configurações atual, incluindo a lista de temas disponíveis.
	 * POST (com ?c=save): Salva as configurações enviadas no corpo da requisição.
	 */
	settings: function(req, res) {
		var query = url.parse(req.url).query;
		var args = querystring.parse(query);
		
		if(args.c === "save") {
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                var post = querystring.parse(body);
                var data = post['data'];
                
                module.exports._settings = JSON.parse(data);
                module.exports.saveSettings();
            });
			res.end();
		}
		else {
			var themes = [];
			var items = fs.readdirSync("./tpl/theme");
			for (var item of items) {
				themes.push(item.substring(0, item.length-4));
			}
			module.exports._settings.themes = themes;
			res.end(JSON.stringify(module.exports._settings));
		}
	},
	
	// --- Manipuladores de Autenticação ---

	/**
	 * Rota: /login
	 * Processa a tentativa de login. Se bem-sucedido, armazena o IP do usuário e redireciona para a home.
	 * Se o caminho não for /login, redireciona para a página de autenticação.
	 */
	authMe: function(req, res) {
		var pathname = url.parse(req.url).pathname;
		
		if(pathname === "/login") {
			var body = '';
			req.on('data', function (data) {
				body += data;
			});
			req.on('end', function () {
				var post = querystring.parse(body);
				var login = post['login'];
				var pass = post['pass'];

				var auth = login === module.exports._settings.user && pass === module.exports._settings.pass;
				if(auth) {
					var ip = req.connection.remoteAddress;
					module.exports.authUsers[ip] = 1;
					res.writeHead(301, {"Location": "/"});
					res.end();
				}
				else {
					res.end("Error!");
				}
			});
		}
		else {
			// Corrigir o redirecionamento para a página de autenticação
			fs.readFile('./tpl/auth.html', function(err, data) {
				if (err) {
					res.writeHead(500);
					res.end('Erro ao carregar página de autenticação: ' + err);
					return;
				}
				res.writeHead(200, {"Content-Type": "text/html", "Cache-Control": "no-cache"});
				res.end(data);
			});
		}
	},
	
	/**
	 * Verifica se um usuário está autenticado, baseado no IP da requisição.
	 * @param {object} req - O objeto da requisição.
	 * @returns {boolean} - True se o usuário estiver autenticado, false caso contrário.
	 */
	isAuth: function(req) {
		var ip = req.connection.remoteAddress;
		// Se a senha não estiver definida, a autenticação não é necessária
		if (module.exports.auth) {
			return true;
		}
		return module.exports.authUsers[ip];
	},

	/**
	 * Verifica se um usuário está autenticado, baseado no IP da requisição.
	 * Rota: /logout
	 * Desconecta o usuário removendo seu IP da lista de usuários autenticados e redireciona para a página de login.
	 */
	logout: function(req, res) {
		var ip = req.connection.remoteAddress;
		module.exports.authUsers[ip] = 0;
		
		// Corrigir o redirecionamento para a página de autenticação
		fs.readFile('./tpl/auth.html', function(err, data) {
			if (err) {
				res.writeHead(500);
				res.end('Erro ao carregar página de autenticação: ' + err);
				return;
			}
			res.writeHead(200, {"Content-Type": "text/html", "Cache-Control": "no-cache"});
			res.end(data);
		});
	}
};

// Carrega as configurações ao iniciar o módulo.
module.exports.loadSettings();