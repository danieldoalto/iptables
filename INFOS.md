# Informações do Projeto iptables Manager

## Visão Geral
O iptables Manager é uma aplicação web para gerenciar regras de firewall iptables em sistemas Linux. Ele fornece uma interface amigável para visualizar, adicionar, remover e modificar regras de firewall.

## Estrutura do Projeto

### Arquivos Principais
- `server.js` - Servidor principal que gerencia requisições HTTP e WebSocket
- `handlers.js` - Manipuladores de rotas HTTP
- `tpl/` - Diretório com templates e recursos estáticos
  - `client.js` - Lógica principal do lado do cliente
  - `template.js` - Funções que geram templates HTML
  - `tools.js` - Funções de utilidade e carregamento de configurações
  - `index.html` - Página principal da interface web
  - `theme/` - Temas de estilo CSS

### Portas Utilizadas
- `1337` - Servidor HTTP principal
- `8001` - Servidor WebSocket para comunicação em tempo real

## Funcionalidades Principais

### Interface do Usuário (UI)
- **Menus Dropdown**: Para seleção de tabelas (`filter`, `nat`, `mangle`) e chains.
- **Visualização de Regras**: Tabela principal que exibe as regras da chain selecionada, com syntax highlighting para melhor legibilidade.
- **Edição In-line**: Permite editar regras diretamente na tabela.
- **Breadcrumb de Navegação**: Facilita a navegação entre chains aninhadas.
- **Construtor de Regras (Rule Builder)**: Um diálogo que guia o usuário na criação de regras complexas, com campos para protocolo, origem, destino, estado, etc.
- **Painéis de Monitoramento**: Diálogos para visualização em tempo real de `syslog` e `tcpdump`.
- **Diálogo de Configurações**: Permite ao usuário definir apelidos para interfaces de rede e portas, facilitando o reconhecimento nas regras.

### Gerenciamento de Regras
- Visualização de regras iptables
- Adição de novas regras
- Remoção de regras existentes
- Modificação de regras

### Monitoramento em Tempo Real
- Visualização de logs do sistema (`/var/log/syslog`)
- Captura de pacotes de rede usando `tcpdump`
- Atualização em tempo real via WebSocket

### Autenticação
- Sistema de login/logout
- Controle de acesso baseado em usuários
- Gerenciamento de usuários

## Estrutura do Código

### server.js
O servidor principal que gerencia:
1. **Servidor HTTP**
   - Rotas para interface web
   - API para manipulação de regras
   - Autenticação de usuários

2. **Servidor WebSocket**
   - Comunicação em tempo real
   - Monitoramento de logs
   - Captura de pacotes de rede

### handlers.js
Este arquivo é o coração do backend. Ele exporta um módulo que contém todos os manipuladores de rota (route handlers) para as requisições HTTP. Suas principais responsabilidades são:
- **Executar Comandos `iptables`**: Funções como `showChannel`, `deleteRule`, e `insertRule` interagem diretamente com o sistema para listar, apagar e adicionar regras.
- **Gerenciamento de Configurações**: As funções `loadSettings` e `saveSettings` cuidam da persistência das configurações do usuário em um arquivo JSON.
- **Autenticação**: Gerencia o login (`authMe`), logout (`logout`) e a verificação de sessão (`isAuth`) dos usuários.

### client.js
Lógica do lado do cliente que gerencia toda a interatividade da interface. É dividido em três objetos principais:

- **`parser`**: Responsável por processar e formatar os dados brutos das regras recebidos do servidor. Ele aplica syntax highlighting para facilitar a leitura das regras, transformando o texto puro em HTML formatado.

- **`rules`**: Contém toda a lógica para manipulação das regras de iptables. Funções incluem:
  - Exibir listas de regras por chain e tabela.
  - Adicionar, remover e editar regras.
  - Gerenciar chains customizadas (criar e deletar).
  - Navegação entre chains com um sistema de breadcrumb.
  - Monitoramento em tempo real dos contadores de pacotes e bytes.

- **`tools`**: Agrupa funcionalidades de utilidade, como:
  - Salvar e carregar as configurações de iptables.
  - Gerenciar o diálogo de configurações, incluindo apelidos para interfaces (LANs) e portas.
  - Um construtor de regras ("Rule Builder") que oferece uma interface gráfica para criar regras complexas.
  - Gerenciamento da conexão WebSocket para os painéis de `syslog` e `tcpdump`.

### template.js
Contém o objeto `tpl` com funções que geram dinamicamente snippets de HTML. Estes templates são usados para construir elementos da UI, como as linhas da tabela de regras, itens de menu e campos no diálogo de configurações.

### tools.js
Este arquivo é responsável por carregar as configurações do usuário (`_settings`) do servidor assim que a página é carregada. Ele também fornece funções globais de utilidade, como `showError()` e `showInfo()`, para exibir feedback visual ao usuário.

## Dependências Principais
- `nodejs-websocket` - Para comunicação WebSocket
- Módulos nativos do Node.js:
  - `http`
  - `url`
  - `fs`
  - `child_process`

## Segurança
- Autenticação necessária para acessar as funcionalidades
- Recomenda-se executar atrás de um proxy reverso com HTTPS
- As credenciais devem ser protegidas

## Fluxo de Trabalho
1. O usuário faz login na interface web
2. Visualiza as regras atuais
3. Pode adicionar, remover ou modificar regras
4. Pode monitorar logs e tráfego em tempo real

## Melhorias Recentes
- Concluída a documentação interna (comentários) de todos os principais arquivos JavaScript do projeto (`server.js`, `handlers.js`, `tpl/client.js`, `tpl/template.js`, `tpl/tools.js`).
- Organização do código em módulos.
- Melhoria nos comentários e documentação geral.

## Próximos Passos
- [ ] Adicionar mais testes
- [ ] Melhorar tratamento de erros
- [ ] Adicionar mais documentação
- [ ] Implementar recursos adicionais de monitoramento
