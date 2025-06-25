// handlers_ext.js

// Módulo para executar comandos do sistema
const { exec } = require('child_process');
const fs = require('fs');
const querystring = require('querystring');

/**
 * Envia uma resposta de erro padronizada.
 */
function sendError(res, message) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: message }));
}

/**
 * Manipulador para a rota /backupRules.
 * Executa 'iptables-save' e envia o resultado como um arquivo para download.
 */
function backupRules(req, res) {
    console.log("Request handler 'backupRules' was called.");

    exec("sudo iptables-save", function(error, stdout, stderr) {
        if (error) {
            console.error("Error executing iptables-save: " + stderr);
            return sendError(res, `Error generating backup: ${stderr}`);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `iptables-backup-${timestamp}.rules`;

        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${fileName}"`
        });

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
                return sendError(res, "Server error writing temp file.");
            }

            exec(`sudo iptables-restore < ${tempFilePath}`, (error, stdout, stderr) => {
                fs.unlink(tempFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting temp restore file:", unlinkErr);
                });

                if (error) {
                    console.error(`Error executing iptables-restore: ${stderr}`);
                    return sendError(res, stderr || "Unknown error during restore");
                }

                console.log(`iptables-restore output: ${stdout}`);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
            });
        });
    });
}

/**
 * Gera uma pré-visualização de como as regras ficarão após a movimentação.
 * Não aplica nenhuma mudança, apenas retorna o estado antigo e o novo proposto.
 */
function previewMoveRules(req, res) {
    console.log("\n--- Request handler 'previewMoveRules' was called. ---");

    let postData = "";
    req.on("data", (chunk) => { postData += chunk; });

    req.on("end", () => {
        const params = querystring.parse(postData);
        const { table, chain, start, end, targetIndex } = params;

        const startNum = parseInt(start, 10);
        const endNum = parseInt(end, 10);
        const targetNum = parseInt(targetIndex, 10);

        if (!table || !chain || isNaN(startNum) || isNaN(endNum) || isNaN(targetNum)) {
            return sendError(res, "Parâmetros ausentes ou inválidos.");
        }

        const saveCmd = `sudo iptables-save -t ${table}`;
        exec(saveCmd, (error, stdout, stderr) => {
            if (error) {
                return sendError(res, `Falha ao executar iptables-save: ${stderr}`);
            }

            try {
                const allLines = stdout.split('\n');
                const chainRegex = new RegExp(`^-A ${chain} `, 'i');
                const originalChainRules = allLines.filter(line => chainRegex.test(line));

                if (startNum <= 0 || endNum < startNum || endNum > originalChainRules.length) {
                    return sendError(res, `Intervalo de regras (A=${startNum}, B=${endNum}) inválido para a chain com ${originalChainRules.length} regras.`);
                }
                if (targetNum <= 0 || targetNum > originalChainRules.length + 1) {
                    return sendError(res, `Posição de destino (C=${targetNum}) inválida.`);
                }
                if (targetNum >= startNum && targetNum <= endNum + 1) {
                    return sendError(res, `A posição de destino não pode estar dentro do intervalo de origem.`);
                }

                // IMPORTANT: Create a copy for manipulation
                const newChainRules = [...originalChainRules];
                const blockToMove = newChainRules.splice(startNum - 1, endNum - startNum + 1);
                
                let insertionIndex = targetNum - 1;
                if (insertionIndex >= (startNum - 1)) {
                    insertionIndex -= blockToMove.length;
                }
                
                newChainRules.splice(insertionIndex, 0, ...blockToMove);

                const formatForPreview = (rules) => {
                    if (!rules) return ""; // Safety check
                    return rules.map((line, index) => `${String(index + 1).padStart(3, ' ')}  ${line}`).join('\n');
                };
                
                const oldRulesText = formatForPreview(originalChainRules);
                const newRulesText = formatForPreview(newChainRules);

                // --- DETAILED DEBUG LOGGING ---
                console.log("\n[DEBUG] --- Preview Data ---");
                console.log(`[DEBUG] Chain: ${chain}, Table: ${table}`);
                console.log(`[DEBUG] Original rules count: ${originalChainRules.length}`);
                console.log("[DEBUG] Original rules array:", JSON.stringify(originalChainRules, null, 2));
                console.log(`[DEBUG] New rules count: ${newChainRules.length}`);
                console.log("[DEBUG] New rules array:", JSON.stringify(newChainRules, null, 2));
                console.log("--- End Preview Data ---\n");
                // --- END LOGGING ---

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    oldRules: oldRulesText,
                    newRules: newRulesText
                }));

            } catch (e) {
                console.error("[FATAL] Erro inesperado no previewMoveRules:", e);
                return sendError(res, `Erro interno ao processar as regras: ${e.message}`);
            }
        });
    });
}

/**
 * Move um bloco de regras de uma posição para outra de forma atômica.
 * Utiliza iptables-save e iptables-restore para garantir a integridade.
 */
function moveRulesBlock(req, res) {
    console.log("\n--- Request handler 'moveRulesBlock' was called. ---");

    let postData = "";
    req.on("data", (chunk) => { postData += chunk; });

    req.on("end", () => {
        const params = querystring.parse(postData);
        console.log("[DEBUG] Parâmetros recebidos para moveRulesBlock:", params);
        const { table, chain, start, end, targetIndex } = params;

        const startNum = parseInt(start, 10);
        const endNum = parseInt(end, 10);
        const targetNum = parseInt(targetIndex, 10);

        console.log(`[DEBUG] Parâmetros parseados: table=${table}, chain=${chain}, start=${startNum}, end=${endNum}, targetIndex=${targetNum}`);

        if (!table || !chain || isNaN(startNum) || isNaN(endNum) || isNaN(targetNum)) {
            console.error(`[ERROR] Parâmetros inválidos: table=${table}, chain=${chain}, start=${startNum}, end=${endNum}, targetIndex=${targetNum}`);
            return sendError(res, "Parâmetros ausentes ou inválidos.");
        }

        // Primeiro, obter as regras atuais para manipulação
        const saveCmd = `sudo iptables-save -t ${table}`;
        console.log(`[DEBUG] Executando comando: ${saveCmd}`);
        exec(saveCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`[ERROR] Falha ao executar iptables-save: ${stderr}`);
                return sendError(res, `Falha ao executar iptables-save: ${stderr}`);
            }

            try {
                console.log("[DEBUG] iptables-save executado com sucesso.");
                const lines = stdout.split('\n');
                
                // Identificar regras da chain atual e outras regras
                const chainRegex = new RegExp(`^-A ${chain} `, 'i');
                const chainRules = lines.filter(line => chainRegex.test(line));
                
                // Todas as outras linhas (cabeçalhos, outras chains, etc.)
                const otherLines = lines.filter(line => !chainRegex.test(line) && line.trim() !== '');
                
                console.log(`[DEBUG] Encontradas ${chainRules.length} regras na chain '${chain}'`);
                console.log(`[DEBUG] Encontradas ${otherLines.length} outras linhas de configuração`);

                // Validar parâmetros
                if (startNum <= 0 || endNum < startNum || endNum > chainRules.length) {
                    const errorMsg = `Intervalo de regras (A=${startNum}, B=${endNum}) inválido para chain com ${chainRules.length} regras.`;
                    console.error(`[ERROR] ${errorMsg}`);
                    return sendError(res, errorMsg);
                }
                if (targetNum <= 0 || targetNum > chainRules.length + 1) {
                    const errorMsg = `Posição de destino (C=${targetNum}) inválida. Deve estar entre 1 e ${chainRules.length + 1}.`;
                    console.error(`[ERROR] ${errorMsg}`);
                    return sendError(res, errorMsg);
                }
                if (targetNum >= startNum && targetNum <= endNum + 1) {
                    const errorMsg = `A posição de destino (C=${targetNum}) não pode estar dentro do intervalo de origem [A=${startNum}, B=${endNum}+1].`;
                    console.error(`[ERROR] ${errorMsg}`);
                    return sendError(res, errorMsg);
                }

                // Manipular as regras em memória
                console.log(`[DEBUG] Manipulando regras: movendo bloco de ${startNum} a ${endNum} para posição ${targetNum}`);
                
                // Criar uma cópia das regras para manipulação
                const workingRules = [...chainRules];
                
                // Remover o bloco a ser movido
                const blockToMove = workingRules.splice(startNum - 1, endNum - startNum + 1);
                console.log(`[DEBUG] Bloco de ${blockToMove.length} regras removido`);
                
                // Calcular o índice de inserção correto
                let insertionIndex = targetNum - 1;
                if (insertionIndex >= startNum - 1) {
                    insertionIndex -= blockToMove.length;
                    console.log(`[DEBUG] Índice de inserção ajustado para ${insertionIndex}`);
                }
                
                // Inserir o bloco na nova posição
                workingRules.splice(insertionIndex, 0, ...blockToMove);
                console.log(`[DEBUG] Bloco inserido na posição ${insertionIndex}`);
                
                // Encontrar onde inserir as regras da chain no arquivo completo
                console.log("[DEBUG] Reconstruindo arquivo de regras completo");
                
                // Encontrar a linha COMMIT para saber onde inserir as regras
                const commitIndex = otherLines.findIndex(line => line.trim() === 'COMMIT');
                if (commitIndex === -1) {
                    console.error("[ERROR] Não foi possível encontrar a linha COMMIT nas regras");
                    return sendError(res, "Erro ao processar arquivo de regras: linha COMMIT não encontrada");
                }
                console.log(`[DEBUG] Índice da linha COMMIT: ${commitIndex}`);
                
                // Abordagem nova: remover TODAS as regras da chain atual e inserir apenas as novas
                // Filtrar para manter apenas linhas que NÃO são da chain atual
                const filteredLines = otherLines.filter(line => {
                    return !line.match(new RegExp(`^-A ${chain}\s`, 'i'));
                });
                
                console.log(`[DEBUG] Linhas após remover regras da chain '${chain}': ${filteredLines.length}`);
                
                // Reconstruir o arquivo de regras:
                // 1. Linhas até COMMIT (excluindo regras da chain atual)
                // 2. Novas regras da chain manipuladas
                // 3. Linha COMMIT e o que vier depois
                const finalRules = [
                    ...filteredLines.slice(0, commitIndex),
                    ...workingRules,
                    ...filteredLines.slice(commitIndex)
                ];
                
                console.log(`[DEBUG] Total de regras reconstruídas: ${finalRules.length}`);
                const newRulesContent = finalRules.join('\n');
                
                // Aplicar as novas regras com iptables-restore
                const restoreCmd = `sudo iptables-restore --noflush`;
                console.log(`[DEBUG] Executando comando: ${restoreCmd}`);
                
                const restoreProcess = exec(restoreCmd, (restoreError, restoreStdout, restoreStderr) => {
                    if (restoreError) {
                        console.error(`[ERROR] Erro ao restaurar regras: ${restoreStderr}`);
                        return sendError(res, `Falha ao aplicar as novas regras: ${restoreStderr}`);
                    }
                    console.log("[DEBUG] Regras aplicadas com sucesso.");
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: true }));
                });

                console.log("[DEBUG] Enviando regras para o processo iptables-restore");
                restoreProcess.stdin.write(newRulesContent);
                restoreProcess.stdin.end();
                console.log("[DEBUG] Dados enviados para iptables-restore");

            } catch (e) {
                console.error("[FATAL] Erro inesperado no moveRulesBlock:", e);
                return sendError(res, `Erro interno ao processar as regras: ${e.message}`);
            }
        });
    });
}

// Exporta os novos manipuladores para que o server.js possa usá-los.
exports.backupRules = backupRules;
exports.restoreRules = restoreRules;
exports.moveRulesBlock = moveRulesBlock;
exports.previewMoveRules = previewMoveRules;

