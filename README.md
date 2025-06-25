# iptables WEB GUI - Fork

> **Nota**: Este é um fork aprimorado do projeto original [puux/iptables](https://github.com/puux/iptables), com diversas melhorias de segurança, usabilidade e novas funcionalidades.

![iptables Web Interface](http://i.mcgl.ru/RGGJv4MAvA)

## 🚀 Melhorias em relação ao original

- **Autenticação Aprimorada**: Sistema de sessão seguro com cookies `HttpOnly`
- **Interface Unificada**: Design consistente em todas as janelas modais
- **Melhor Segurança**: Autenticação baseada em sessão ao invés de IP
- **Experiência do Usuário**: Melhorias na usabilidade e feedback visual
- **Documentação Expandida**: Guias detalhados e informações de instalação

## ✨ Principais Recursos

* Visualize e edite regras iptables em uma interface web amigável
* Adicione e remova regras com um simples clique
* Crie e gerencie chains personalizadas
* **Mova blocos de regras**: Selecione um intervalo de regras e mova-as para uma nova posição na mesma chain, com visualização das alterações antes de aplicar
* **Backup e Restauração**: Crie um backup completo das suas regras e restaure a partir de um arquivo
* Monitoramento em tempo real do syslog e tráfego de rede
* Autenticação de usuário para acesso seguro

## 📦 Instalação

### Pré-requisitos

- Node.js 14.x ou superior
- NPM (geralmente vem com o Node.js)
  
### Passos para instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/danieldoalto/iptables.git
   ```

2. **Instale as dependências**
   ```bash
   cd iptables
   npm install
   ```

3. **Inicie o servidor**
   ```bash
   node server.js
   ```

4. **Acesse a interface**
   Abra seu navegador e acesse:
   ```
   http://localhost:1337
   ```

## 🚀 Como usar

### Credenciais padrão
- **Usuário**: admin
- **Senha**: admin

> **Importante**: Altere as credenciais padrão após o primeiro login nas configurações do sistema.

### Configuração Inicial

1. **Autenticação**:
   - Faça login com as credenciais fornecidas
   - Recomenda-se alterar a senha padrão imediatamente

2. **Gerenciamento de Regras**:
   - Selecione a tabela desejada (filter, nat, mangle)
   - Escolha uma chain para visualizar suas regras
   - Utilize os botões de ação para adicionar, remover ou modificar regras

3. **Backup e Restauração**:
   - Acesse o menu "Backup" para baixar um backup atual
   - Utilize "Restaurar" para carregar um backup anterior

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📜 Licença

Este projeto é um fork do [puux/iptables](https://github.com/puux/iptables) e é distribuído sob a mesma licença. Consulte o arquivo `LICENSE` para obter mais informações.

## ⚙️ Executando como serviço (opcional)

Para executar o iptables Manager como um serviço em segundo plano, você pode usar o PM2:

```bash
# instale o PM2 globalmente (se ainda não tiver)
npm install pm2 -g

# inicie o servidor com PM2
pm2 start server.js --name iptables

# salve a configuração do PM2
pm2 save

# configure para iniciar automaticamente na inicialização do sistema
pm2 startup

# inicie o serviço PM2 na inicialização (siga as instruções exibidas)
# Exemplo: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 🔒 Segurança

### Alterando credenciais de acesso

As credenciais de acesso podem ser alteradas editando o arquivo de configuração:

```bash
sudo nano /etc/iptables/config.json
```

Altere os valores de `user` e `pass` conforme necessário e reinicie o serviço:

```bash
pm2 restart iptables
```

### Recomendações de segurança

1. **Nunca exponha a interface na internet pública**
2. Utilize um proxy reverso com HTTPS (como Nginx ou Apache)
3. Mantenha o Node.js e as dependências atualizadas
4. Altere as credenciais padrão imediatamente após a instalação
5. Monitore os logs regularmente

## 🎨 Criando Temas Personalizados

Você pode criar seus próprios temas personalizados para o iptables Manager:

1. Acesse o diretório de estilos:
   ```bash
   cd tpl/styles/
   ```

2. Crie um novo arquivo de tema baseado no tema existente:
   ```bash
   cp _variables.scss meu-tema.scss
   ```

3. Edite as variáveis de cores e estilos conforme desejado

4. Compile o tema para CSS:
   ```bash
   sass --sourcemap=none meu-tema.scss ../theme/MeuTema.css
   ```

5. Recarregue a página e selecione seu novo tema em Configurações > Tema

## 📝 Licença

Este projeto é um fork de [puux/iptables](https://github.com/puux/iptables) e é distribuído sob a mesma licença. Consulte o arquivo `LICENSE` para obter mais informações.
