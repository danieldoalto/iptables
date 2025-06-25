iptables WEB gui

![ScreenShot](http://i.mcgl.ru/RGGJv4MAvA)

### Features ###

* View and edit iptables rules in a user-friendly web interface.
* Add and delete rules with a simple click.
* Create and manage custom chains.
* **Move rule blocks**: Select a range of rules and move them to a new position within the same chain, with a visual preview of the changes before applying.
* **Backup and Restore**: Create a full backup of your rules and restore them from a file.
* Real-time monitoring of syslog and network traffic.
* User authentication to secure access.

### Howto install ###

In first time you need to Download and install Node.js

### Howto use ###

* Clone repository:
```bash
git clone https://github.com/puux/iptables.git
```
* Run server:
```bash
cd iptables
# only for first time you, need to download dependancies
npm install
# and then you can start the server
node server.js
```
* Open browser and goto http://127.0.0.1:1337/

### Howto create own theme ###

* cd ./tpl/styles/
* open and change config.scss
* compile: scss --sourcemap=none style.scss ../theme/MyTheme.css
* select theme in Settings->Theme

### Default user and password ###

User: admin
Pass: (empty)

You can change this here https://github.com/puux/iptables/blob/master/handlers.js#L14
