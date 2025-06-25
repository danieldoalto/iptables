// Objeto para novas funcionalidades do frontend
const app = {
    /**
     * Inicia o processo de mover uma regra.
     * O usuário primeiro clica na regra a ser movida e, em seguida, na posição de destino.
     */
    moveRule: function() {
        console.log("Função app.moveRule() chamada. Lógica a ser implementada.");
        alert("Funcionalidade 'Move' ainda não implementada.");
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