#!/bin/bash
# salvar como: update_firewall.sh

# Função para log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] - $1"
}

log "=== INICIANDO ATUALIZAÇÃO DO FIREWALL ==="

# 1. Backup das regras atuais
log "[ETAPA 1/5] Fazendo backup das regras atuais..."
BACKUP_FILE="/root/iptables_backup_$(date +%Y%m%d_%H%M%S).rules"
iptables-save > "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    log "Backup salvo com sucesso em: $BACKUP_FILE"
else
    log "ERRO: Falha ao criar o backup das regras. Abortando."
    exit 1
fi

# 2. Criar arquivo com novas regras
log "[ETAPA 2/5] Criando arquivo de configuração com novas regras..."
cat > /tmp/new_rules.rules << 'EOF'
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]

# Criar chains para o Fail2ban (se não existirem)
:f2b-block_syn_ports - [0:0]
:f2b-sshd - [0:0]

# Tráfego essencial
-A INPUT -i lo -j ACCEPT
-A INPUT -s 168.228.0.0/16 -j ACCEPT
-A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

# SERVIÇOS PÚBLICOS - ACESSO TOTAL (antes do fail2ban)
-A INPUT -p tcp -m tcp --dport 22 -j ACCEPT
-A INPUT -p tcp -m tcp --dport 80 -j ACCEPT
-A INPUT -p tcp -m tcp --dport 443 -j ACCEPT

# Fail2ban (depois dos serviços essenciais)
-A INPUT -p tcp -j f2b-block_syn_ports
-A INPUT -p tcp -j f2b-sshd

# Bloqueios específicos
-A INPUT -s 157.173.201.179/32 -j DROP
-A INPUT -s 157.173.201.201/32 -j DROP
-A INPUT -s 206.168.35.0/24 -j DROP
-A INPUT -s 206.168.34.0/24 -j DROP
-A INPUT -s 206.168.33.0/24 -j DROP
-A INPUT -s 206.168.32.0/24 -j DROP
-A INPUT -s 199.45.155.0/24 -j DROP
-A INPUT -s 199.45.154.0/24 -j DROP
-A INPUT -s 167.248.133.0/24 -j DROP
-A INPUT -s 167.94.146.0/24 -j DROP
-A INPUT -s 167.94.145.0/24 -j DROP
-A INPUT -s 167.94.138.0/24 -j DROP
-A INPUT -s 162.142.125.0/24 -j DROP
-A INPUT -s 66.132.159.0/24 -j DROP
-A INPUT -s 66.132.153.0/24 -j DROP
-A INPUT -s 66.132.148.0/24 -j DROP
-A INPUT -s 218.92.0.0/16 -j DROP
-A INPUT -s 92.255.85.0/24 -j DROP
-A INPUT -s 37.44.238.68/32 -j DROP

# Proteção SYN flood (limitada para não afetar serviços web)
-A INPUT -p tcp --syn -m limit --limit 25/s --limit-burst 50 -j ACCEPT
-A INPUT -p tcp --syn -j DROP

# Log e bloqueio padrão
-A INPUT -m limit --limit 5/min -j LOG --log-prefix "IPTABLES-DROPPED: " --log-level 4
-A INPUT -j DROP
COMMIT
EOF

log "Arquivo de regras criado em /tmp/new_rules.rules"

# 3. Aplicar as regras
log "[ETAPA 3/5] Aplicando novas regras com iptables-restore..."
iptables-restore < /tmp/new_rules.rules
if [ $? -eq 0 ]; then
    log "Regras aplicadas com sucesso."
else
    log "ERRO: Falha ao aplicar novas regras. Restaurando backup..."
    iptables-restore < "$BACKUP_FILE"
    log "Backup restaurado. Verifique o arquivo /tmp/new_rules.rules para erros de sintaxe."
    exit 1
fi

# 4. Verificar portas abertas
log "[ETAPA 4/5] Verificando se as portas principais estão abertas..."
iptables -L INPUT -n --line-numbers | grep -E "(ACCEPT|22|80|443)"

# 5. Limpar arquivo temporário
log "[ETAPA 5/5] Limpando arquivo de regras temporário..."
# rm /tmp/new_rules.rules
log "Arquivo /tmp/new_rules.rules removido."

log "=== FIREWALL ATUALIZADO COM SUCESSO ==="
log "Portas 22, 80 e 443 configuradas na chain INPUT."
echo "Backups salvos em: /root/iptables_backup_*.rules"