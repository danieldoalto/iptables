# Informações do Projeto iptables Manager

## Visão Geral
O iptables Manager é uma aplicação web para gerenciar regras de firewall iptables em sistemas Linux. Ele fornece uma interface amigável para visualizar, adicionar, remover e modificar regras de firewall.

## Estrutura do Projeto

### Arquivos Principais
- `server.js` - Servidor principal que gerencia requisições HTTP e WebSocket
- `handlers.js` - Manipuladores de rotas HTTP (código original)
- `handlers_ext.js` - Extensão para novos manipuladores de rotas (novas funcionalidades)
- `tpl/` - Diretório com templates e recursos estáticos
  - `client.js` - Lógica principal do lado do cliente (código original)
  - `app.js` - Lógica adicional do lado do cliente (novas funcionalidades)
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
- **Backup e Restauração**: Interface modal para criar um backup completo das regras (`iptables-save`) e restaurá-lo a partir de um arquivo, substituindo as regras existentes (`iptables-restore`).
- **Movimentação de Regras**: Permite selecionar um bloco de regras e movê-lo para uma nova posição dentro da mesma chain. Inclui uma janela de pré-visualização que compara o estado antigo e o novo antes de aplicar as mudanças, garantindo uma operação segura e atômica através de `iptables-save` e `iptables-restore`.


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

### handlers_ext.js
Criado para abrigar novas funcionalidades do backend. O `server.js` foi modificado para carregar dinamicamente as rotas definidas neste arquivo, permitindo estender a API sem alterar o `handlers.js` original.

### tpl/app.js
Arquivo para o novo código JavaScript do frontend. Ele é carregado pelo `index.html` após o `client.js` e será usado para implementar novas interações e funcionalidades na interface do usuário.

## Estratégia de Desenvolvimento

Para facilitar a adição de novas funcionalidades e minimizar conflitos com o código-fonte original, foi adotada uma estratégia de extensão:

- **Backend**: Novas rotas e lógicas de servidor são adicionadas em `handlers_ext.js`. O `server.js` foi configurado para carregar e mesclar essas novas rotas.
- **Frontend**: Novas lógicas de interface e interações são implementadas em `tpl/app.js`, que é carregado pelo `index.html`.

Essa abordagem mantém o código original o mais intacto possível, facilitando a manutenção e a identificação de novas funcionalidades.

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
- **Implementada funcionalidade de Movimentação de Regras**: 
  - **Backend**: Adicionadas as rotas `/previewMoveRules` e `/moveRulesBlock` em `handlers_ext.js` para pré-visualizar e aplicar a movimentação de blocos de regras de forma atômica.
  - **Frontend**: Criada uma janela modal para que o usuário defina o bloco de regras a ser movido e o destino, com uma tela de confirmação que exibe um `diff` visual das mudanças antes de aplicá-las.

- **Implementada funcionalidade de Backup e Restauração**:
  - **Backend**: Adicionadas as rotas `/backupRules` e `/restoreRules` em `handlers_ext.js` para gerar e restaurar backups utilizando `iptables-save` e `iptables-restore`.
  - **Frontend**: Criada uma janela modal em `index.html` e a lógica de interação em `tpl/app.js` para permitir que o usuário baixe e envie arquivos de backup.


## Próximos Passos
- [ ] Adicionar mais testes
- [ ] Melhorar tratamento de erros
- [ ] Adicionar mais documentação
- [ ] Implementar recursos adicionais de monitoramento
