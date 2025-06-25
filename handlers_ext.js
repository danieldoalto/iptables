// handlers_ext.js

// Módulo para executar comandos do sistema
const { exec } = require('child_process');
const fs = require('fs');
const querystring = require('querystring');

/**
 * Manipulador para a rota /backupRules.
 * Executa 'iptables-save' e envia o resultado como um arquivo para download.
 */
function backupRules(req, res) { // Parâmetros corrigidos para (request, response)
    console.log("Request handler 'backupRules' was called.");

    exec("sudo iptables-save", function(error, stdout, stderr) {
        if (error) {
            console.error("Error executing iptables-save: " + stderr);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.write("Error generating backup: " + stderr);
            res.end();
            return;
        }

        // Define o nome do arquivo para o download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `iptables-backup-${timestamp}.rules`;

        // Envia os cabeçalhos para forçar o download
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${fileName}"`
        });

        // Envia o conteúdo do backup (regras)
        res.write(stdout);
        res.end();
    });
}

/**
 * Manipulador para a rota /restoreRules.
 * Recebe o conteúdo de um arquivo de regras e o aplica usando 'iptables-restore'.
 */
function restoreRules(req, res) {
    console.log("Request handler 'restoreRules' was called.");
    
    let postData = "";
    req.on("data", function(postDataChunk) {
        postData += postDataChunk;
    });

    req.on("end", function() {
        const parsedData = querystring.parse(postData);
        const rulesContent = parsedData.content;
        const tempFilePath = '/tmp/iptables.restore';

        if (!rulesContent) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "No content provided." }));
            return;
        }

        fs.writeFile(tempFilePath, rulesContent, (err) => {
            if (err) {
                console.error("Error writing temp restore file:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: "Server error writing temp file." }));
                return;
            }

            exec(`sudo iptables-restore < ${tempFilePath}`, (error, stdout, stderr) => {
                fs.unlink(tempFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting temp restore file:", unlinkErr);
                });

                if (error) {
                    console.error(`Error executing iptables-restore: ${stderr}`);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, error: stderr || "Unknown error" }));
                    return;
                }

                console.log(`iptables-restore output: ${stdout}`);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
            });
        });
    });
}

// Exporta os novos manipuladores para que o server.js possa usá-los.
exports.backupRules = backupRules;
exports.restoreRules = restoreRules;
