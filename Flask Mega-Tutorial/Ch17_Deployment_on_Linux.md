# Part 17: Deployment on Linux

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xvii-deployment-on-linux](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xvii-deployment-on-linux) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第十七篇，在这篇文章中，我将把 Microblog 部署到 Linux 服务器上。

你正在阅读 2024 版的 Flask Mega-Tutorial。完整课程也以电子书和平装本的形式在亚马逊上提供订购。感谢你的支持！

如果你正在寻找该课程的 2018 版，可以在这里找到。

供你参考，以下是本系列文章的完整列表：

- 第 1 章：Hello, World!

- 第 2 章：模板

- 第 3 章：Web 表单

- 第 4 章：数据库

- 第 5 章：用户登录

- 第 6 章：个人资料页面和头像

- 第 7 章：错误处理

- 第 8 章：关注者

- 第 9 章：分页

- 第 10 章：邮件支持

- 第 11 章：美化

- 第 12 章：日期和时间

- 第 13 章：国际化和本地化

- 第 14 章：Ajax

- 第 15 章：更好的应用结构

- 第 16 章：全文搜索

- 第 17 章：在 Linux 上部署（本文）

- 第 18 章：在 Heroku 上部署

- 第 19 章：在 Docker 容器上部署

- 第 20 章：一些 JavaScript 魔法

- 第 21 章：用户通知

- 第 22 章：后台任务

- 第 23 章：应用程序编程接口（API）

在本章中，我达到了 Microblog 应用生命中的一个里程碑，因为我要讨论如何将应用部署到生产服务器上，使其可供真实用户访问。

部署是一个广泛的话题，因此不可能在此涵盖所有可能的选项。本章专门探讨传统的托管选项，我将使用一台运行 Ubuntu 的专用 Linux 服务器，以及广受欢迎的 Raspberry Pi 迷你计算机作为主题。我将在后续章节中介绍其他选项，如云和容器部署。

*本章的 GitHub 链接：浏览, Zip, Diff.*

## 传统托管

当我提到"传统托管"时，我指的是在标准的服务器机器上手动或通过脚本安装程序安装应用。这个过程包括安装应用、其依赖项和生产级 Web 服务器，并配置系统以确保安全。

当你要部署自己的项目时，首先需要问的问题是在哪里找到服务器。如今有许多经济实惠的托管服务。例如，每月只需 5 美元，Digital Ocean、Linode 或 Amazon Lightsail 就会租给你一台虚拟化的 Linux 服务器，用于进行部署实验（Linode 和 Digital Ocean 为其入门级服务器提供 1GB 内存，而 Amazon 只提供 512MB）。如果你更喜欢不花钱练习部署，那么 Vagrant 和 VirtualBox 这两个工具组合起来可以让你在自己的计算机上创建一个类似于付费方案的虚拟服务器。

至于操作系统的选择，从技术角度来看，这个应用可以部署在任何主流操作系统上，包括各种开源 Linux 和 BSD 发行版，以及商业版的 macOS 和 Microsoft Windows（macOS 是一种混合开源/商业选项，因为它基于 Darwin，一个开源的 BSD 衍生版）。

由于 macOS 和 Windows 是桌面操作系统，未经优化用作服务器，我将排除这些候选。在 Linux 或 BSD 操作系统之间的选择主要基于个人偏好，所以我将选择两者中更流行的——Linux。至于 Linux 发行版，我再次根据流行度选择 Ubuntu。

## 创建 Ubuntu 服务器

如果你有兴趣和我一起进行这次部署，你显然需要一个可以工作的服务器。我将推荐两个获取服务器的选项，一个付费，一个免费。如果你愿意花一点钱，你可以在 Digital Ocean、Linode 或 Amazon Lightsail 上注册一个账户，并创建一个当前长期支持（LTS）版本的 Ubuntu 虚拟服务器，在我撰写本文时是 22.04。你应该使用最小的服务器选项，那种每月大约 5 美元的选项。费用按服务器运行的小时数按比例计算，所以如果你创建服务器、玩几个小时然后删除它，你只需要支付几美分。

免费的替代方案基于可以在自己计算机上运行的虚拟机。要使用此选项，在你的机器上安装 Vagrant 和 VirtualBox，然后创建一个名为 *Vagrantfile* 的文件，用以下内容描述 VM 的规格：

*Vagrantfile*：Vagrant 配置。

```
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.network "private_network", ip: "192.168.56.10"
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "2048"
  end
end

```

此文件配置了一个具有 2GB 内存的 Ubuntu 22.04 服务器，你可以从主机通过 IP 地址 192.168.56.10 访问它。要创建服务器，运行以下命令：

```
$ vagrant up

```

查阅 Vagrant 命令行文档以了解管理虚拟服务器的其他选项。

## 使用 SSH 客户端

你的服务器是无头服务器，所以你不会有像自己计算机上那样的桌面环境。你将通过 SSH 客户端连接到服务器，并通过命令行进行操作。如果你使用的是 Linux 或 Mac OS X，你很可能已经安装了 OpenSSH。如果你使用的是 Microsoft Windows，Cygwin、Git 和 Windows Subsystem for Linux 都提供 OpenSSH，所以你可以安装其中任何一个。

使用来自第三方提供商的虚拟服务器时，你会获得一个 IP 地址。你可以使用以下命令打开与新服务器的终端会话：

```
$ ssh root@<server-ip-address>

```

系统将提示你输入密码。根据服务的不同，密码可能是自动生成并在创建服务器后显示给你的，或者你可能可以选择自己的密码。

如果你使用的是 Vagrant VM，你可以使用以下命令打开终端会话：

```
$ vagrant ssh

```

如果你使用的是 Windows 并有 Vagrant VM，请注意，你需要从能够调用 OpenSSH 的 `ssh` 命令的 shell 中运行上述命令。

## 免密码登录

如果你使用的是 Vagrant VM，可以跳过此部分，因为你的 VM 已正确配置为使用名为 `vagrant` 或 `ubuntu` 的非 root 账户，Vagrant 会自动免密码登录。

当使用虚拟服务器时，建议创建一个普通用户账户来进行部署工作，并配置此账户无需密码即可登录，这初看起来可能是个坏主意，但你会发现这不仅更方便，而且更安全。

我将创建一个名为 `ubuntu` 的用户账户（如果你愿意，可以使用不同的名称）。要创建此用户账户，使用上一节的 `ssh` 说明登录到服务器的 root 账户，然后输入以下命令来创建用户、授予其 `sudo` 权限，最后切换到该用户：

```
$ adduser --gecos "" ubuntu
$ usermod -aG sudo ubuntu
$ su ubuntu

```

现在我将配置这个新的 `ubuntu` 账户使用公钥认证，这样你可以在不输入密码的情况下登录。

暂时离开你在服务器上打开的终端会话，在你的本地机器上启动第二个终端。如果你使用的是 Windows，这需要是你可以访问 `ssh` 命令的终端，所以很可能是一个 `bash` 或类似的提示符，而不是原生的 Windows 终端。在该终端会话中，检查 *~/.ssh* 目录的内容：

```
$ ls ~/.ssh
id_rsa  id_rsa.pub

```

如果目录列表显示如上所示的 *id_rsa* 和 *id_rsa.pub* 文件，那么你已经有了密钥。如果你没有这两个文件，或者根本没有 *~/.ssh* 目录，那么你需要通过运行以下命令（也是 OpenSSH 工具集的一部分）来创建 SSH 密钥对：

```
$ ssh-keygen

```

此应用会提示你输入一些内容，我建议你接受默认值，在所有提示下按 Enter 即可。如果你知道自己在做什么并想采取其他方式，当然也可以。

此命令运行后，你应该拥有上面列出的两个文件。*id_rsa.pub* 文件是你的*公钥*，这是一个你将提供给第三方以识别你身份的文件。*id_rsa* 文件是你的*私钥*，不应与任何人共享。

你现在需要将公钥配置为服务器上的*授权主机*。在你自己计算机上打开的终端中，将公钥打印到屏幕：

```
$ cat ~/.ssh/id_rsa.pub
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCjw....F8Xv4f/0+7WT miguel@miguelspc

```

这将是一个非常长的字符序列，可能跨越多行。你需要将这些数据复制到剪贴板，然后切换回远程服务器上的终端，在那里发出以下命令来存储公钥：

```
$ echo <paste-your-key-here> >> ~/.ssh/authorized_keys
$ chmod 600 ~/.ssh/authorized_keys

```

免密码登录现在应该可以工作了。其原理是，你机器上的 `ssh` 会通过执行需要私钥的加密操作来向服务器标识自己。然后服务器使用你的公钥验证该操作是否有效。

你现在可以退出 `ubuntu` 会话，然后退出 `root` 会话，然后尝试直接登录 `ubuntu` 账户：

```
$ ssh ubuntu@<server-ip-address>

```

这次你应该不需要输入密码了！

## 保护服务器安全

为了最大限度地降低服务器被入侵的风险，你可以采取一些措施，旨在关闭攻击者可能借以访问的多个潜在入口。

我要做的第一个更改是通过 SSH 禁用 root 登录。你现在可以使用 `ubuntu` 账户的免密码访问，并且可以通过 `sudo` 从此账户运行管理员命令，所以真的没有必要暴露 root 账户。要禁用 root 登录，你需要编辑服务器上的 */etc/ssh/sshd_config* 文件。你的服务器上可能安装了 `vi` 和 `nano` 文本编辑器，你可以使用它们来编辑文件（如果你不熟悉其中任何一个，可以先尝试 `nano`）。你需要在编辑器前加上 `sudo`，因为 SSH 配置对普通用户不可访问（即 `sudo vi /etc/ssh/sshd_config`）。你需要更改此文件中的一行：

*/etc/ssh/sshd_config*：禁用 root 登录。

```
PermitRootLogin no

```

请注意，要进行此更改，你需要找到以 `PermitRootLogin` 开头的行，并将值（无论服务器上是什么）改为 `no`。

下一个更改在同一个文件中。现在我将禁用所有账户的密码登录。你已经设置了免密码登录，所以根本不需要允许密码。如果你对完全禁用密码感到不安，可以跳过此更改，但对于生产服务器来说这是一个好主意，因为攻击者不断在所有服务器上尝试随机的账户名和密码，希望碰碰运气。要禁用密码登录，请更改 */etc/ssh/sshd_config* 中的以下行：

*/etc/ssh/sshd_config*：禁用密码登录。

```
PasswordAuthentication no

```

完成 SSH 配置编辑后，需要重新启动服务才能使更改生效：

```
$ sudo service ssh restart

```

我要做的第三个更改是安装*防火墙*。这是一种软件，用于阻止对服务器上未显式启用的任何端口的访问：

```
$ sudo apt-get install -y ufw
$ sudo ufw allow ssh
$ sudo ufw allow http
$ sudo ufw allow 443/tcp
$ sudo ufw --force enable
$ sudo ufw status

```

这些命令安装 ufw（Uncomplicated Firewall），并将其配置为仅允许端口 22（ssh）、80（http）和 443（https）的外部流量。其他任何端口都不允许。

## 安装基础依赖

如果你听从我的建议，使用 Ubuntu 20.04 版本配置服务器，那么你的系统完全支持 Python 3.8，所以我将在部署中使用此版本。

基本 Python 解释器可能已预安装在你的服务器上，但可能没有一些额外的包，还有 Python 之外的其他一些包对创建健壮的、可用于生产的部署非常有用。对于数据库服务器，我将从 SQLite 切换到 MySQL。postfix 包是一个邮件传输代理，我将用它来发送电子邮件。supervisor 工具将监控 Flask 服务器进程，并在其崩溃时自动重启，或者在服务器重启时自动启动。nginx 服务器将接受来自外部的所有请求，并将其转发到应用。最后，我将使用 git 作为工具，直接从其 git 仓库下载应用。

```
$ sudo apt-get -y update
$ sudo apt-get -y install python3 python3-venv python3-dev
$ sudo apt-get -y install mysql-server postfix supervisor nginx git

```

这些安装大多无人值守运行。根据你安装的 Ubuntu 版本，你可能会收到要求重启服务的提示，你可以接受默认选择。在运行第三条安装语句时，你会被问到几个关于 postfix 包安装的问题，你也可以接受默认答案。

请注意，对于此部署，我选择不安装 Elasticsearch。此服务需要大量 RAM，因此只有当你拥有超过 2GB 内存的大型服务器时，它才可行。为避免服务器内存不足的问题，我将不包含搜索功能。如果你有足够大的服务器，你可以从 Elasticsearch 网站下载官方的 .deb 包，并按照他们的安装说明将其添加到你的服务器。

我还应该指出，postfix 的默认安装可能不足以在生产环境中发送电子邮件。为避免垃圾邮件和恶意邮件，许多服务器要求发送服务器通过安全扩展来标识自己，这意味着你至少需要有一个与服务器关联的域名。如果你想了解如何完全配置邮件服务器以通过标准安全测试，请参阅以下 Digital Ocean 指南：

- Postfix 配置

- 添加 SPF 记录

- DKIM 安装和配置

## 安装应用

现在我将使用 `git` 从我的 GitHub 仓库下载 Microblog 源代码。如果你不熟悉 git 源代码控制，我建议你阅读 git 初学者指南。

要将应用下载到服务器，请确保你在 `ubuntu` 用户的主目录中，然后运行：

```
$ git clone https://github.com/miguelgrinberg/microblog
$ cd microblog
$ git checkout v0.17

```

这将把代码安装到你的服务器上，并将其同步到本章。如果你将本教程的代码保存在自己的 git 仓库中，你可以将仓库 URL 改为你自己的，在这种情况下，你可以跳过 `git checkout` 命令。

现在我需要创建一个虚拟环境，并用所有包依赖项填充它，我在第 15 章中已经方便地将其保存到了 *requirements.txt* 文件中：

```
$ python3 -m venv venv
$ source venv/bin/activate
(venv) $ pip install -r requirements.txt

```

除了 *requirements.txt* 中的通用依赖外，我还将使用三个特定于此生产部署的包，因此它们未包含在通用依赖文件中。`gunicorn` 包是用于 Python 应用的生产 Web 服务器。`pymysql` 包包含 MySQL 驱动程序，使 SQLAlchemy 能够与 MySQL 数据库一起工作。`cryptography` 包被 `pymsql` 用于向 MySQL 数据库服务器进行身份验证。

```
(venv) $ pip install gunicorn pymysql cryptography

```

我需要创建一个 *.env* 文件，包含所有需要的环境变量：

*/home/ubuntu/microblog/.env*：环境配置。

```
SECRET_KEY=52cb883e323b48d78a0a36e8e951ba4a
MAIL_SERVER=localhost
MAIL_PORT=25
DATABASE_URL=mysql+pymysql://microblog:<db-password>@localhost:3306/microblog
MS_TRANSLATOR_KEY=<your-translator-key-here>

```

此 *.env* 文件与第 15 章中展示的示例大致相似，但我为 `SECRET_KEY` 使用了一个随机字符串。你应该在此处生成自己的密钥。你可以使用以下命令：

```
python3 -c "import uuid; print(uuid.uuid4().hex)"

```

对于 `DATABASE_URL` 变量，我定义了一个 MySQL URL。我将在下一节向你展示如何配置数据库。

我需要设置 `FLASK_APP` 环境变量为应用的入口点，以使 `flask` 命令能够工作。如果你的项目仓库中没有 *.flaskenv* 文件，那么是时候添加一个了。你可以通过运行 `flask --help` 来确认 `FLASK_APP` 变量是否已配置。如果帮助信息显示了应用添加的 `translate` 命令，那么你就知道应用已被找到。

现在 `flask` 命令可用了，我可以编译语言翻译：

```
(venv) $ flask translate compile

```

## 设置 MySQL

我在开发期间使用的 SQLite 数据库对于简单应用来说很棒，但当部署一个可能需要同时处理多个请求的完整 Web 服务器时，最好使用更健壮的数据库。出于这个原因，我将设置一个名为 `microblog` 的 MySQL 数据库。

要管理数据库服务器，我将使用 `mysql` 命令，它应该已经安装在你的服务器上：

```
$ sudo mysql -u root
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.0.25-0ubuntu0.20.04.1 (Ubuntu)

Copyright (c) 2000, 2021, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>

```

请注意，你需要使用 `sudo` 从管理员账户访问 MySQL root 用户。

以下是创建名为 `microblog` 的新数据库以及具有完全访问权限的同名用户的命令：

```
mysql> create database microblog character set utf8 collate utf8_bin;
mysql> create user 'microblog'@'localhost' identified by '<db-password>';
mysql> grant all privileges on microblog.* to 'microblog'@'localhost';
mysql> flush privileges;
mysql> quit;

```

你需要将 `<db-password>` 替换为你选择的密码。你在此处选择的密码需要与你在 *.env* 文件的 `DATABASE_URL` 变量中包含的密码匹配。

如果你的数据库配置正确，你现在应该能够运行创建所有表的数据库迁移：

```
(venv) $ flask db upgrade

```

在继续之前，确保上述命令成功完成且没有产生任何错误。

## 设置 Gunicorn 和 Supervisor

当你使用 `flask run` 运行服务器时，你使用的是 Flask 自带的 Web 服务器。这个服务器在开发期间非常有用，但它不是生产服务器的好选择，因为它不是为性能和健壮性而设计的。与 Flask 开发服务器不同，对于此部署，我决定使用 Gunicorn，它也是一个纯 Python Web 服务器，但与 Flask 不同的是，它是一个健壮的生产服务器，被许多人使用，同时非常易于配置。

要在 Gunicorn 下启动 Microblog，你可以使用以下命令：

```
(venv) $ gunicorn -b localhost:8000 -w 4 microblog:app

```

`-b` 选项告诉 Gunicorn 在哪里监听请求，我将其设置为内部网络接口的端口 8000。通常最好让 Python Web 应用在无外部访问的情况下运行，然后让一个优化用于提供静态文件的非常快速的 Web 服务器接受来自客户端的所有请求。这个快速 Web 服务器将直接提供静态文件，并将任何旨在用于应用的请求转发到内部服务器。我将在下一节向你展示如何将 nginx 设置为面向公众的服务器。

`-w` 选项配置 Gunicorn 将运行多少个*工作进程*。拥有四个工作进程允许应用同时处理最多四个客户端，这对于 Web 应用来说通常足以处理相当数量的客户端，因为并非所有客户端都在持续请求内容。根据你的服务器拥有的内存量，你可能需要调整工作进程的数量，以免耗尽内存。

`microblog:app` 参数告诉 Gunicorn 如何加载应用实例。冒号前的名称是包含应用的模块，对于此应用来说是 *microblog.py*。冒号后的名称是应用实例的名称。

虽然 Gunicorn 设置非常简单，但从命令行运行服务器实际上不是生产服务器的好解决方案。我想要的是让服务器在后台运行，并让它处于持续监控之下，因为如果服务器因任何原因崩溃并退出，我想要确保自动启动一个新服务器来替代它。我还想要确保，如果机器重启，服务器会在启动时自动运行，而无需我自己登录并启动事物。我将使用上面安装的 supervisor 包来实现这一点。

supervisor 工具使用配置文件告诉它要监控哪些程序以及如何在必要时重启它们。配置文件必须存储在 */etc/supervisor/conf.d* 中。以下是 Microblog 的配置文件，我将其命名为 *microblog.conf*：

*/etc/supervisor/conf.d/microblog.conf*：Supervisor 配置。

```
[program:microblog]
command=/home/ubuntu/microblog/venv/bin/gunicorn -b localhost:8000 -w 4 microblog:app
directory=/home/ubuntu/microblog
user=ubuntu
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true

```

`command`、`directory` 和 `user` 设置告诉 supervisor 如何运行应用。`autostart` 和 `autorestart` 设置由于计算机启动或崩溃时的自动重启。`stopasgroup` 和 `killasgroup` 选项确保当 supervisor 需要停止应用以重启时，它也能到达顶层 Gunicorn 进程的子进程。

在编写此配置文件后，你需要重新加载 supervisor 服务以导入它：

```
$ sudo supervisorctl reload

```

就这样，Gunicorn Web 服务器现在应该已经启动并运行，并且处于监控之下了！

## 设置 Nginx

由 Gunicorn 驱动的 Microblog 应用服务器现在在端口 8000 上私有运行。我现在需要做的，是将应用暴露给外部世界，开启面向公众的 Web 服务器，监听端口 80 和 443，这是我在防火墙上打开的处理应用 Web 流量的两个端口。

我希望这是一个安全的部署，所以我将配置端口 80 将所有流量转发到端口 443，后者将被加密。所以我首先要创建一个 SSL 证书。现在，我将创建一个*自签名 SSL 证书*，这对于测试一切正常是可以的，但对于真正的部署来说并不好，因为 Web 浏览器会警告用户该证书并非由受信任的证书颁发机构签发。为 microblog 创建 SSL 证书的命令是：

```
$ mkdir certs
$ openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
  -keyout certs/key.pem -out certs/cert.pem

```

该命令会询问你一些关于应用和你自己的信息。这些信息将被包含在 SSL 证书中，如果用户请求查看，Web 浏览器会向用户显示。上述命令的结果是两个文件：*key.pem* 和 *cert.pem*，我将它们放在 Microblog 根目录的 *certs* 子目录中。

要拥有一个由 nginx 提供的网站，你需要为其编写一个配置文件。在大多数 nginx 安装中，此文件需要放在 */etc/nginx/sites-available* 目录中。以下是 Microblog 的 nginx 配置文件，放在 */etc/nginx/sites-available/microblog*：

*/etc/nginx/sites-available/microblog*：Nginx 配置。

```
server {
    # listen on port 80 (http)
    listen 80;
    server_name _;
    location / {
        # redirect any requests to the same URL but on https
        return 301 https://$host$request_uri;
    }
}
server {
    # listen on port 443 (https)
    listen 443 ssl;
    server_name _;

    # location of the self-signed SSL certificate
    ssl_certificate /home/ubuntu/microblog/certs/cert.pem;
    ssl_certificate_key /home/ubuntu/microblog/certs/key.pem;

    # write access and error logs to /var/log
    access_log /var/log/microblog_access.log;
    error_log /var/log/microblog_error.log;

    location / {
        # forward application requests to the gunicorn server
        proxy_pass http://localhost:8000;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static {
        # handle static files directly, without forwarding to the application
        alias /home/ubuntu/microblog/app/static;
        expires 30d;
    }
}

```

nginx 配置一点也不简单，但我添加了一些注释，以便你至少知道每个部分的作用。如果你想了解特定指令的信息，请查阅 nginx 官方文档。

网站现在已经配置好了，但尚未启用。要启用它，必须在 */etc/nginx/sites-enabled* 目录中创建指向此文件的链接。Nginx 附带了一个已启用的测试站点，我不需要它，所以我先删除它：

```
$ sudo rm /etc/nginx/sites-enabled/default

```

现在我可以创建指向 microblog 配置的链接：

```
sudo ln -s /etc/nginx/sites-available/microblog /etc/nginx/sites-enabled/microblog

```

添加此文件后，你需要告诉 nginx 重新加载配置：

```
$ sudo service nginx reload

```

现在应用应该已经部署好了。在你的 Web 浏览器中，你可以输入服务器的 IP 地址（如果你使用的是 Vagrant VM，则为 192.168.56.10），这将连接到应用。因为你使用的是自签名证书，你会收到来自 Web 浏览器的警告，你需要忽略它。

在为你的项目完成上述部署说明后，我强烈建议你将自签名证书替换为真正的证书，这样浏览器就不会向你的用户发出关于你网站的警告。为此，你首先需要购买一个域名，并将其配置为指向你服务器的 IP 地址。拥有域名后，你可以请求免费的 Let's Encrypt SSL 证书。我在博客上写了一篇详细的文章，关于如何通过 HTTPS 运行你的 Flask 应用。

## 部署应用更新

关于基于 Linux 的部署，我想讨论的最后一个主题是如何处理应用升级。应用源代码通过 `git` 安装在服务器上，所以无论何时你想将应用升级到最新版本，你可以运行 `git pull` 来下载自上次部署以来的新提交。

但当然，下载新版本代码不会触发升级。当前正在运行的服务器进程将继续使用旧代码（这些代码已被读取并存储在内存中）。要触发升级，你需要停止当前服务器并启动一个新服务器，以强制重新读取所有代码。

执行升级通常比仅仅重启服务器更复杂。你可能需要应用数据库迁移，或编译新的语言翻译，所以实际上，执行升级的过程涉及一系列命令：

```
(venv) $ git pull                              # 下载新版本
(venv) $ sudo supervisorctl stop microblog     # 停止当前服务器
(venv) $ flask db upgrade                      # 升级数据库
(venv) $ flask translate compile               # 升级翻译
(venv) $ sudo supervisorctl start microblog    # 启动新服务器

```

## Raspberry Pi 托管

Raspberry Pi 是一种低成本的革命性小型 Linux 计算机，功耗非常低，因此它是托管家庭 Web 服务器的理想设备，可以 24/7 在线，而不占用你的台式计算机或笔记本电脑。有几种 Linux 发行版可以在 Raspberry Pi 上运行。我选择的是 Raspberry Pi OS，这是 Raspberry Pi 基金会的官方发行版。

要准备 Raspberry Pi，我将安装一个新的 Raspberry Pi OS 版本。我将使用 Lite 版本，因为我不需要桌面用户界面。你可以在他们的操作系统页面上找到最新版本的 Raspberry Pi OS。

Raspberry Pi OS 镜像需要安装到 SD 卡上，然后将其插入到 Raspberry Pi 中，以便它可以从中启动。将 Raspberry Pi OS 镜像从 Windows、Mac OS X 和 Linux 复制到 SD 卡的说明可在 Raspberry Pi 网站上找到。

当你第一次启动 Raspberry Pi 时，请连接键盘和显示器，以便进行设置。至少你应该启用 SSH，这样你就可以从计算机登录，更舒适地执行部署任务。

与 Ubuntu 一样，Raspberry Pi OS 是 Debian 的一个衍生版，因此上面针对 Ubuntu Linux 的说明在大多数情况下同样适用于 Raspberry Pi。但是，如果你计划在家庭网络上运行小型应用而不进行外部访问，你可以跳过一些步骤。例如，你可能不需要防火墙，或免密码登录。而且你可能想在这种小型计算机上使用 SQLite 而不是 MySQL。你可以选择不使用 nginx，而只需让 Gunicorn 服务器直接监听来自客户端的请求。你可能只需要一个或两个 Gunicorn 工作进程。supervisor 服务在确保应用始终运行方面非常有用，所以我建议你在 Raspberry Pi 上也使用它。

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
