Installing Express MVC on Local System
==================================
ENV: Ubuntu 14.04
- Follow steps as below:

----------------------------------
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm
sudo apt-get install git
sudo apt-add-repository ppa:chris-lea/redis-server
sudo apt-get update
sudo apt-get install redis-server
cd ~
mkdir express-mvc
cd express-mvc
git clone {repo_url}
cd awtools
npm install
nodejs app.js
----------------------------------