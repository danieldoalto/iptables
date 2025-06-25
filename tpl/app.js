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
            buttons: [
                {
                    text: "Confirmar e Aplicar",
                    click: function() {
                        $.ajax({
                            type: 'POST',
                            url: '/moveRulesBlock',
                            data: moveParams,
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
                    class: 'primary-button'
                },
                {
                    text: "Cancelar",
                    click: function() {
                        $(this).dialog("close");
                    },
                    class: 'secondary-button'
                }
            ]
        });

        $("#move-rule-dialog").dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: [
                {
                    text: "Pré-visualizar Mudanças",
                    click: function() {
                        const start = $('#move-from-start').val();
                        const end = $('#move-from-end').val();
                        const targetIndex = $('#move-to-index').val();
                        const table = rules.currentTable;
                        const chain = rules.currentChain;

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
                    class: 'primary-button'
                },
                {
                    text: "Cancelar",
                    click: function() {
                        $(this).dialog("close");
                    },
                    class: 'secondary-button'
                }
            ]
        });
    },

    /**
     * Abre a janela modal para funcionalidades de Backup e Restore.
     */
    backup: function() {
        // Configura o evento para mostrar o nome do arquivo selecionado
        $('#restore-file-input').on('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Nenhum arquivo selecionado';
            $('#file-name-display').text(fileName);
        });

        // Configura o botão de download de backup
        $('#download-backup').off('click').on('click', function() {
            console.log("Iniciando download do backup...");
            window.location.href = '/backupRules';
        });

        // Configura o formulário de restauração
        $('#restore-form').off('submit').on('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('restore-file-input');
            const file = fileInput.files[0];

            if (!file) {
                showError("Por favor, selecione um arquivo de backup para restaurar.");
                return false;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const rulesContent = e.target.result;
                showInfo("Enviando arquivo de backup para o servidor...");

                // Envia o conteúdo para o backend
                $.post("/restoreRules", { content: rulesContent })
                    .done(function(response) {
                        if(response.success) {
                            showInfo("Backup restaurado com sucesso! As regras foram atualizadas.");
                            // Recarrega a visualização principal para mostrar as novas regras
                            rules.showChannel();
                            $("#backup-dialog").dialog("close");
                        } else {
                            showError("Falha ao restaurar backup: " + response.error);
                        }
                    })
                    .fail(function() {
                        showError("Erro de comunicação ao tentar restaurar o backup.");
                    });
            };

            reader.readAsText(file);
        });

        // Abre a janela modal
        $("#backup-dialog").dialog({
            resizable: false,
            height: "auto",
            width: 550,
            modal: true,
            buttons: {
                "Fechar": function() {
                    $(this).dialog("close");
                }
            },
            open: function() {
                // Reset do formulário e da exibição do nome do arquivo
                $('#restore-form')[0].reset();
                $('#file-name-display').text('Nenhum arquivo selecionado');
            }
        });
    },
    
    /**
     * Inicia o processo de edição da chain atual.
     * Por enquanto, apenas chama o endpoint para teste.
     */
    editChain: function() {
        // Usar as variáveis globais channel e table definidas em client.js
        const currentChain = channel;
        const currentTable = table;
        
        if (!currentChain || !currentTable) {
            showError("Nenhuma chain selecionada.");
            return;
        }
        
        console.log("[EditChain] Chain:", currentChain, "Table:", currentTable);
        // Chama o endpoint de edição de chain
        $.ajax({
            type: 'POST',
            url: '/editChain',
            data: {
                chain: currentChain,
                table: currentTable
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showInfo(response.message || "Edit Chain endpoint chamado com sucesso!");
                } else {
                    showError(response.error || "Erro ao chamar o endpoint de edição de chain.");
                }
            },
            error: function(xhr, status, error) {
                console.error("[EditChain] Erro:", error);
                showError("Erro na requisição: " + error);
            }
        });
    }
};