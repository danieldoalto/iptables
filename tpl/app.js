// Objeto para novas funcionalidades do frontend
const app = {
    /**
     * Inicia o processo de mover uma regra.
     * O usuário primeiro clica na regra a ser movida e, em seguida, na posição de destino.
     */
    moveRule: function moveRule() {
        let moveParams = {}; 

        const confirmDialog = $("#move-confirm-dialog").dialog({
            autoOpen: false,
            resizable: false,
            height: "auto",
            width: 800,
            modal: true,
            buttons: {
                "Confirmar e Aplicar": function() {
                    $.ajax({
                        type: 'POST',
                        url: '/moveRulesBlock',
                        data: {
                            table: moveParams.table, // Usa os valores armazenados em moveParams
                            chain: moveParams.chain, // Usa os valores armazenados em moveParams
                            start: moveParams.start,
                            end: moveParams.end,
                            targetIndex: moveParams.targetIndex
                        },
                        dataType: 'json',
                        success: function(response) {
                            if (response.success) {
                                showInfo("Bloco de regras movido com sucesso!");
                                rules.showList(moveParams.chain, moveParams.table);
                                $(confirmDialog).dialog("close");
                            } else {
                                showError("Falha ao aplicar as regras: " + response.error);
                            }
                        },
                        error: function() {
                            showError("Erro de comunicação ao tentar aplicar as regras.");
                        }
                    });
                },
                "Cancelar": function() {
                    $(this).dialog("close");
                }
            }
        });

        $("#move-rule-dialog").dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Pré-visualizar Mudanças": function() {
                    const start = $('#move-from-start').val();
                    const end = $('#move-from-end').val();
                    const targetIndex = $('#move-to-index').val();
                    const table = rules.currentTable;
                    const chain = rules.currentChain;
                    console.log(`[Debug] Move modal read state: table='${table}', chain='${chain}'`);

                    if (!start || !end || !targetIndex) {
                        showError("Todos os campos são obrigatórios.");
                        return;
                    }

                    moveParams = { table, chain, start, end, targetIndex };
                    const initialModal = $(this);

                    $.ajax({
                        type: 'POST',
                        url: '/previewMoveRules',
                        data: moveParams,
                        dataType: 'json',
                        success: function(response) {
                            if (response.success) {
                                $('#original-rules-preview').val(response.oldRules);
                                $('#new-rules-preview').val(response.newRules);
                                confirmDialog.dialog("open");
                                initialModal.dialog("close");
                            } else {
                                showError("Falha ao gerar pré-visualização: " + response.error);
                            }
                        },
                        error: function() {
                            showError("Erro de comunicação ao gerar pré-visualização.");
                        }
                    });
                },
                "Cancelar": function() {
                    $(this).dialog("close");
                }
            }
        });
    },

    /**
     * Abre a janela modal para funcionalidades de Backup e Restore.
     */
    backup: function() {
        $("#backup-dialog").dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Gerar Backup": function() {
                    console.log("Iniciando download do backup...");
                    // Redireciona para a rota de backup, o que iniciará o download
                    window.location.href = '/backupRules';
                },
                "Recuperar Backup": function() {
                    const fileInput = document.getElementById('restore-file-input');
                    const file = fileInput.files[0];

                    if (!file) {
                        showError("Por favor, selecione um arquivo de backup para recuperar.");
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const rulesContent = e.target.result;
                        showInfo("Enviando arquivo de backup para o servidor...");

                        // Envia o conteúdo para o backend
                        $.post("/restoreRules", { content: rulesContent })
                            .done(function(response) {
                                if(response.success) {
                                    showInfo("Backup recuperado com sucesso! As regras foram atualizadas.");
                                    // Recarrega a visualização principal para mostrar as novas regras
                                    rules.showChannel(); 
                                } else {
                                    showError("Falha ao recuperar backup: " + response.error);
                                }
                            })
                            .fail(function() {
                                showError("Erro de comunicação ao tentar recuperar o backup.");
                            });
                    };

                    reader.readAsText(file);
                    $(this).dialog("close");
                },
                "Cancelar": function() {
                    $(this).dialog("close");
                }
            }
        });
    }
};