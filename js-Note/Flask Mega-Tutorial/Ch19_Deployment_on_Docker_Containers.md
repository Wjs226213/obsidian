# 第19部分：在 Docker 容器上部署

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xix-deployment-on-docker-containers](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xix-deployment-on-docker-containers) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第19篇，本文将把 Microblog 部署到 Docker 容器平台。

你正在阅读的是 2024 版的 Flask Mega-Tutorial。完整课程也可以从 Amazon 订购电子书和平装本。感谢你的支持！

如果你在寻找本课程的 2018 版，可以在这里找到。

作为参考，以下是本系列文章的完整列表：

- 第1章：Hello, World!

- 第2章：模板

- 第3章：Web 表单

- 第4章：数据库

- 第5章：用户登录

- 第6章：个人资料页面和头像

- 第7章：错误处理

- 第8章：关注者

- 第9章：分页

- 第10章：电子邮件支持

- 第11章：美化外观

- 第12章：日期和时间

- 第13章：国际化和本地化

- 第14章：Ajax

- 第15章：更好的应用结构

- 第16章：全文搜索

- 第17章：在 Linux 上部署

- 第18章：在 Heroku 上部署

- 第19章：在 Docker 容器上部署（本文）

- 第20章：一些 JavaScript 魔法

- 第21章：用户通知

- 第22章：后台作业

- 第23章：应用程序编程接口（API）

在第17章中，你了解了传统部署方式，需要处理服务器配置的每一个细节。然后在第18章中，我将你带到了另一个极端，向你介绍了 Heroku，这项服务完全接管了配置和部署任务，让你可以完全专注于应用程序。在本章中，你将学习第三种基于*容器*的应用程序部署策略，更具体地说，是基于 Docker 容器平台。在部署工作量方面，这第三种选择介于前两者之间。

容器建立在轻量级虚拟化技术之上，允许应用程序及其依赖项和配置在完全隔离的环境中运行，但不需要使用虚拟机等完整的虚拟化解决方案 —— 虚拟机需要更多的资源，并且与宿主机相比有时会有显著的性能下降。配置为容器主机的系统可以运行许多容器，所有容器共享主机的内核并直接访问主机的硬件。这与虚拟机形成对比，虚拟机必须模拟完整的系统，包括 CPU、磁盘、其他硬件、内核等。

尽管需要共享内核，但容器的隔离级别相当高。容器有自己的文件系统，并且可以基于与容器主机不同的操作系统。例如，你可以在 Fedora 主机上运行基于 Ubuntu Linux 的容器，反之亦然。虽然容器是 Linux 操作系统原生支持的技术，但借助虚拟化技术，也可以在 Windows 和 macOS 主机上运行 Linux 容器。这使你可以在开发系统上测试部署，并且如果愿意，也可以将容器纳入开发工作流程。

*本章的 GitHub 链接：浏览，Zip，Diff。*

## 安装 Docker

虽然 Docker 不是唯一的容器平台，但它是最流行的，因此我选择使用它。

要使用 Docker，你首先需要在系统上安装它。Docker 网站提供了 Windows、macOS 和多种 Linux 发行版的安装程序。到目前为止，在你的计算机上设置 Docker 的最简单方法是使用适用于你操作系统的 Docker Desktop 安装程序。如果你在 Microsoft Windows 系统上工作，需要注意的是 Docker 需要 Hyper-V。如果需要，安装程序会为你启用它，但请记住，启用 Hyper-V 可能会阻止其他虚拟化技术（如 VirtualBox）工作。

在系统上安装 Docker Desktop 后，你可以通过在终端窗口或命令提示符中键入以下命令来验证安装是否成功：

```
$ docker version
Client: Docker Engine - Community
 Version:           23.0.5
 API version:       1.42
 Go version:        go1.19.8
 Git commit:        bc4487a
 Built:             Wed Apr 26 16:17:14 2023
 OS/Arch:           darwin/amd64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          23.0.5
  API version:      1.42 (minimum version 1.12)
  Go version:       go1.19.8
  Git commit:       94d3ad6
  Built:            Wed Apr 26 16:17:14 2023
  OS/Arch:          darwin/amd64
  Experimental:     false
 containerd:
  Version:          1.6.20
  GitCommit:        2806fc1057397dbaeefbea0e4e17bddfbd388f38
 runc:
  Version:          1.1.5
  GitCommit:        v1.1.5-0-gf19387a
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0

```

## 构建容器镜像

为 Microblog 创建容器的第一步是构建一个*镜像*。容器镜像是用于创建容器的模板。它包含容器文件系统的完整表示，以及各种与网络、启动选项等相关的设置。

为你的应用程序创建容器镜像的最基本方法是：为要使用的基础操作系统（Ubuntu、Fedora 等）启动一个容器，连接到其中运行的 bash shell 进程，然后手动安装你的应用程序，可能按照我在第17章中介绍的传统部署指南。安装完所有内容后，你可以对容器进行快照，该快照就成为镜像。这种工作流程受 `docker` 命令支持，但我不会讨论它，因为每次需要生成新镜像时都手动安装应用程序很不方便。

更好的方法是通过脚本来生成容器镜像。创建脚本化容器镜像的命令是 `docker build`。该命令从名为 *Dockerfile* 的文件中读取并执行构建指令，我需要创建这个文件。Dockerfile 基本上是一个安装脚本，它执行安装步骤以部署应用程序，外加一些容器特定的设置。

以下是一个基本的 Microblog *Dockerfile*：

*Dockerfile*：Microblog 的 Dockerfile。

```
FROM python:slim

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install gunicorn

COPY app app
COPY migrations migrations
COPY microblog.py config.py boot.sh ./
RUN chmod a+x boot.sh

ENV FLASK_APP microblog.py
RUN flask translate compile

EXPOSE 5000
ENTRYPOINT "./boot.sh"

```

Dockerfile 中的每一行都是一个命令。`FROM` 命令指定了新镜像将基于的基础容器镜像。思路是从一个现有镜像开始，添加或修改一些内容，最终得到一个派生镜像。镜像通过名称和标签（用冒号分隔）来引用。标签用作版本控制机制，允许一个容器镜像提供多个变体。我选择的镜像名称是 `python`，这是 Python 的官方 Docker 镜像。该镜像的标签允许你指定解释器版本和基础操作系统。`slim` 标签选择了一个只包含运行 Python 解释器所需的最小软件包的容器镜像。你可以在 Python 镜像仓库中查看 Python 可用的其他标签。

根据你编写 Dockerfile 的时间，你可能会发现某些软件包无法在 `slim` 标签使用的最新 Python 版本上安装，这是因为当 Python 发布新版本时，许多软件包需要一些时间才能为其发布二进制包。如果你在构建容器镜像时遇到问题，可以尝试使用较旧版本的 Python，只需在标签中添加所需的版本作为前缀即可。例如，`3.11-slim` 标签安装 Python 3.11。

`COPY` 命令将文件从你的机器传输到容器的文件系统中。该命令需要两个或更多参数，即源和目标文件或目录。源文件必须相对于 Dockerfile 所在的目录。目标可以是绝对路径，也可以是相对于当前目录的路径，默认情况下当前目录是容器文件系统的根目录。在这个第一个 `COPY` 命令中，我将 *requirements.txt* 文件复制到容器文件系统的根目录。

既然 *requirements.txt* 文件已经在容器中，我就可以安装其中列出的所有依赖项。由于 requirements 文件只包含通用依赖项，我随后显式地安装了 `gunicorn`，将其作为 Web 服务器使用。或者，我也可以将该包添加到我的 *requirements.txt* 文件中。

接下来的三个 `COPY` 命令通过复制 *app* 包、包含数据库迁移的 *migrations* 目录以及顶级目录中的 *microblog.py* 和 *config.py* 脚本来安装应用程序。我还复制了一个新文件 *boot.sh*，我将在下面讨论它。

`RUN chmod` 命令确保这个新的 *boot.sh* 文件被正确设置为可执行文件。如果你在基于 Unix 的文件系统中工作，并且源文件已经标记为可执行，那么复制的文件也将具有可执行位。我决定显式设置可执行位，以允许应用程序在没有可执行位概念的 Microsoft Windows 上工作。如果你在 macOS 或 Linux 上工作，可能不需要这条语句，但保留它也无妨。

`ENV` 命令在容器内部设置环境变量。我需要设置 `FLASK_APP`，这是使用 `flask` 命令所必需的。

下一个 `RUN` 语句编译翻译文件。这是一个 `flask` 子命令，因此我必须先在环境中设置 `FLASK_APP`，否则该命令将无法找到应用程序实例和我的自定义子命令。

`EXPOSE` 命令配置容器将用于其服务器的端口。这是必需的，以便 Docker 可以适当地配置容器中的网络。我选择了标准的 Flask 端口 5000，但可以是任何端口。

最后，`ENTRYPOINT` 语句定义了使用此镜像启动容器时应执行的默认命令。这是将启动应用程序 Web 服务器的命令。为了保持组织良好，我决定为此创建一个单独的脚本，这就是我先前复制到容器中的 *boot.sh* 文件。以下是此脚本的内容：

*boot.sh*：Docker 容器启动脚本。

```
#!/bin/bash
flask db upgrade
exec gunicorn -b :5000 --access-logfile - --error-logfile - microblog:app

```

这是一个相当标准的启动脚本，类似于第17章和第18章中部署的启动方式。我通过迁移框架升级数据库，然后使用 Gunicorn 运行服务器。

注意 Gunicorn 命令前面的 `exec`。在 shell 脚本中，`exec` 会触发运行脚本的进程（这里指的是 `bash` 解释器）被给定的命令替换，而不是将该命令作为子进程启动。这很重要，因为 Docker 将容器的生命周期与在其中运行的第一个进程相关联。在这种情况下，启动进程不是容器的主进程，你需要确保主进程取代第一个进程的位置，以防止 Docker 过早终止容器。

如果你在 Windows 上创建 *boot.sh* 文件，请确保在文本编辑器中选择 UNIX 换行符。由于此文件将在运行 Linux 的容器内执行，它必须具有该操作系统正确的换行符。

Docker 的一个有趣之处在于，容器写入 `stdout` 或 `stderr` 的任何内容都将被捕获并存储为容器的日志。因此，`--access-logfile` 和 `--error-logfile` 都配置为 `-`，将日志发送到标准输出，以便 Docker 将其存储为日志。

创建好 Dockerfile 后，我现在可以构建容器镜像：

```
$ docker build -t microblog:latest .

```

我传递给 `docker build` 命令的 `-t` 参数设置了新容器镜像的名称和标签。`.` 表示要构建容器的基目录，即 Dockerfile 所在的目录。构建过程将评估 *Dockerfile* 中的所有命令并创建镜像，该镜像将存储在你自己的机器上。

你可以使用 `docker images` 命令获取本地已有的镜像列表：

```
$ docker images
REPOSITORY    TAG          IMAGE ID        CREATED              SIZE
python        slim         d7971c18b18e    7 months ago         132MB
microblog     latest       03978d7e1007    27 seconds ago       259MB

```

此列表将包括你的新镜像，以及它所基于的基础镜像。每当你对应用程序进行更改时，你可以通过再次运行构建命令来更新容器镜像。

## 启动容器

镜像创建完成后，现在可以运行应用程序的容器版本了。这通过 `docker run` 命令完成，该命令接受一长串参数。我将首先展示一个基本示例：

```
$ docker run --name microblog -d -p 8000:5000 --rm microblog:latest
021da2e1e0d390320248abf97dfbbe7b27c70fefed113d5a41bb67a68522e91c

```

`--name` 选项为新容器提供一个名称。`-d` 选项告诉 Docker 在后台运行容器。如果不加 `-d`，容器会作为前台应用程序运行，阻塞你的命令提示符。`-p` 选项将容器端口映射到主机端口。左边的端口号是主机计算机上的端口，右边的是容器内部的端口。上面的示例将容器中的端口 5000 暴露给主机的端口 8000，因此你将通过 8000 端口访问应用程序，尽管容器内部使用的是 5000 端口。我使用不同的端口号是为了演示端口映射的灵活性，但如果你愿意，也可以在主机和容器上使用相同的端口号。`--rm` 选项将在容器终止后删除它。虽然不是必需的，但完成或被中断的容器通常不再需要，因此可以自动删除。最后一个参数是用于创建容器的容器镜像名称和标签。运行上述命令后，你可以通过 *http://localhost:8000* 访问应用程序。

`docker run` 的输出是分配给新容器的 ID。这是一个长十六进制字符串，当你需要在后续命令中引用容器时可以使用它。实际上，只需要前几个字符就足以使 ID 唯一。

如果你想查看正在运行的容器，可以使用 `docker ps` 命令：

```
$ docker ps
CONTAINER ID  IMAGE             COMMAND      PORTS                   NAMES
021da2e1e0d3  microblog:latest  "./boot.sh"  0.0.0.0:8000->5000/tcp  microblog

```

你可以看到，就连 `docker ps` 命令缩短了容器 ID。如果你现在想停止容器，可以使用 `docker stop` 并传入容器 ID 或使用 `--name` 选项赋予的名称：

```
$ docker stop microblog
microblog

```

如果你还记得，应用程序的配置中有许多选项来自环境变量。例如，Flask 密钥、数据库 URL 和电子邮件服务器选项都是从环境变量导入的。在上面的 `docker run` 示例中，我没有担心这些问题，因此所有配置选项都将使用默认值。

在一个更实际的例子中，你需要在容器内部设置这些环境变量。你在前一节中看到，*Dockerfile* 中的 `ENV` 命令可以设置环境变量，并且对于静态变量来说它是一个方便的选择。然而，对于依赖于安装方式的变量来说，将它们作为构建过程的一部分并不方便，因为你希望容器镜像具有相当的可移植性。如果你想将你的应用程序以容器镜像的形式提供给其他人，你希望他们能够直接使用它，而不必用不同的变量重新构建它。

因此，构建时的环境变量可能很有用，但也需要可以在运行时通过 `docker run` 命令设置的环境变量，对于这些变量，可以使用 `-e` 选项。以下示例设置了一个密钥并通过 Gmail 账户发送电子邮件：

```
$ docker run --name microblog -d -p 8000:5000 --rm -e SECRET_KEY=my-secret-key \
    -e MAIL_SERVER=smtp.googlemail.com -e MAIL_PORT=587 -e MAIL_USE_TLS=true \
    -e MAIL_USERNAME=<your-gmail-username> -e MAIL_PASSWORD=<your-gmail-password> \
    microblog:latest

```

由于需要定义许多环境变量，`docker run` 命令行变得非常冗长，这并不罕见。

## 使用第三方"容器化"服务

Microblog 的容器版本看起来不错，但我还没有考虑存储问题。实际上，由于我没有设置 `DATABASE_URL` 环境变量，应用程序使用的是默认的 SQLite 数据库，它依赖于磁盘上的文件。当你停止并删除容器时，那个 SQLite 文件会发生什么？它会消失！

容器的文件系统是*临时的*，这意味着当容器消失时它也会消失。你可以向文件系统写入数据，并且如果需要读取数据，这些数据会存在于容器中，但如果出于任何原因你需要回收容器并用新容器替换它，应用程序保存到磁盘的任何数据都将永远丢失。

容器应用程序的一个良好设计策略是使应用程序容器*无状态*。如果你有一个包含应用程序代码但不包含数据的容器，你可以随时丢弃它并用新容器替换，而不会出现任何问题。这样，容器变得真正可丢弃，这在简化部署升级方面非常有用。

但当然，这意味着数据必须放在应用程序容器之外的某个地方。这正是 Docker 生态系统发挥作用的领域。Docker 容器注册表包含大量各种容器镜像。我已经告诉过你 Python 容器镜像，我将其作为 Microblog 容器的基础镜像使用。除此之外，Docker 在 Docker 注册表中维护了许多其他语言、数据库和其他服务的镜像，如果这还不够，注册表还允许公司为其产品发布容器镜像，也允许像你我这样的普通用户发布自己的镜像。这意味着安装第三方服务的工作减少到了在注册表中找到合适的镜像，然后使用适当的参数通过 `docker run` 命令启动它。

因此，我现在要做的是创建两个额外的容器，一个用于 MySQL 数据库，另一个用于 Elasticsearch 服务，然后我会让启动 Microblog 容器的命令行变得更长，添加一些选项使其能够与这两个新容器通信。

### 添加 MySQL 容器

在本节中，你将启动一个 MySQL 容器，然后将其连接到 Microblog 容器。运行一组关联容器的推荐方法是为它们创建一个*网络*。Docker 网络是一种虚拟结构，允许添加到其中的所有容器相互可见。使用以下命令创建一个新的 Docker 网络：

```
$ docker network create microblog-network

```

像许多其他产品和服务一样，MySQL 在 Docker 注册表上有公开的容器镜像。和我自己的 Microblog 容器一样，MySQL 依赖于需要传递给 `docker run` 的环境变量。这些变量配置密码、数据库名称等。虽然注册表中有许多 MySQL 镜像，但我决定使用 MySQL 团队官方维护的那个。你可以在其注册表页面找到关于 MySQL 容器镜像的详细信息：*https://hub.docker.com/r/mysql/mysql-server/*。

如果你还记得第17章中设置 MySQL 的繁琐过程，当你看到 Docker 对比之下是多么简单时，你会感激不尽的。这里是启动 MySQL 服务器的 `docker run` 命令：

```
$ docker run --name mysql -d -e MYSQL_RANDOM_ROOT_PASSWORD=yes \
    -e MYSQL_DATABASE=microblog -e MYSQL_USER=microblog \
    -e MYSQL_PASSWORD=<database-password> \
    --network microblog-network \
    mysql:latest

```

就是这样！在任何安装了 Docker 的机器上，你可以运行上述命令，就会得到一个完全安装好的 MySQL 服务器，带有随机生成的 root 密码、一个名为 `microblog` 的全新数据库，以及一个具有相同名称、配置了完整数据库访问权限的用户。请注意，你需要为 `MYSQL_PASSWORD` 环境变量输入一个合适的密码。

上面的 `--network` 选项告诉 Docker 将 MySQL 容器放入上面创建的网络中。

现在，在应用程序端，我需要使用一个 MySQL 客户端包，就像我在 Ubuntu 上传统部署时做的那样。我将再次使用 `pymysql`，并添加到 *Dockerfile* 中，同时还要添加它用于验证 MySQL 服务器身份的 `cryptography` 包：

*Dockerfile*：将 pymysql 和 cryptography 添加到 Dockerfile。

```
# ...
RUN pip install gunicorn pymysql cryptography
# ...

```

每当对应用程序或 *Dockerfile* 进行更改时，都需要重新构建容器镜像：

```
$ docker build -t microblog:latest .

```

现在我可以再次启动 Microblog，但这次要链接到数据库容器，以便两者可以通过网络通信：

```
$ docker run --name microblog -d -p 8000:5000 --rm -e SECRET_KEY=my-secret-key \
    -e MAIL_SERVER=smtp.googlemail.com -e MAIL_PORT=587 -e MAIL_USE_TLS=true \
    -e MAIL_USERNAME=<your-gmail-username> -e MAIL_PASSWORD=<your-gmail-password> \
    --network microblog-network \
    -e DATABASE_URL=mysql+pymysql://microblog:<database-password>@mysql/microblog \
    microblog:latest

```

`--network` 选项告诉 Docker 将此容器包含在与上面 MySQL 容器相同的网络中。位于同一网络中的容器可以使用其名称作为主机名来相互引用。因此，`DATABASE_URL` 使用 `mysql` 作为数据库主机名，因为这是我给 MySQL 容器起的名称。请确保你在上面的命令中输入了为 MySQL 容器选择的正确数据库密码。

我在实验 MySQL 容器时注意到一件事：MySQL 容器需要几秒钟才能完全运行并准备好接受数据库连接。如果你先启动 MySQL 容器，然后立即启动应用程序容器，当 *boot.sh* 脚本尝试运行 `flask db upgrade` 时，可能会因为数据库尚未准备好接受连接而失败。为了使我的解决方案更健壮，我决定在 *boot.sh* 中添加一个重试循环：

*boot.sh*：重试数据库连接。

```
#!/bin/bash
while true; do
    flask db upgrade
    if [ "$?" == "0" ]; then
        break
    fi
    echo Upgrade command failed, retrying in 5 secs...
    sleep 5
done
exec gunicorn -b :5000 --access-logfile - --error-logfile - microblog:app

```

这个循环检查 `flask db upgrade` 命令的退出码，如果非零，则假定出了问题，等待五秒后重试。

### 添加 Elasticsearch 容器

Elasticsearch 的 Docker 文档展示了如何将服务作为单节点用于开发，以及作为双节点用于生产部署。现在，我将选择单节点选项，不带加密和密码。使用以下命令启动容器：

```
$ docker run --name elasticsearch -d --rm -p 9200:9200 \
    -e discovery.type=single-node -e xpack.security.enabled=false \
    --network microblog-network \
    -t docker.elastic.co/elasticsearch/elasticsearch:8.11.1

```

现在我已经启动并运行了 Elasticsearch 服务，可以修改我的 Microblog 容器的启动命令，创建到它的链接并设置 Elasticsearch 服务 URL：

```
$ docker run --name microblog -d -p 8000:5000 --rm -e SECRET_KEY=my-secret-key \
    -e MAIL_SERVER=smtp.googlemail.com -e MAIL_PORT=587 -e MAIL_USE_TLS=true \
    -e MAIL_USERNAME=<your-gmail-username> -e MAIL_PASSWORD=<your-gmail-password> \
    --network microblog-network \
    -e DATABASE_URL=mysql+pymysql://microblog:<database-password>@mysql/microblog \
    -e ELASTICSEARCH_URL=http://elasticsearch:9200 \
    microblog:latest

```

在运行此命令之前，请记住停止你之前还在运行的 Microblog 容器。还要注意在命令的适当位置设置正确的密码。

现在你应该可以访问 *http://localhost:8000* 并使用搜索功能了。如果遇到任何错误，你可以通过查看容器日志来排查问题。你很可能想查看 Microblog 容器的日志，其中会显示任何 Python 堆栈跟踪信息：

```
$ docker logs microblog

```

## Docker 容器注册表

现在，我已经使用三个容器在 Docker 上完整运行了应用程序，其中两个来自公开可用的第三方镜像。如果你想将自己的容器镜像提供给其他人使用，你需要将它们*推送*到 Docker 注册表，任何人都可以从那里获取镜像。

要访问 Docker 注册表，你需要访问 *https://hub.docker.com* 并为自己创建一个账户。确保选择一个你喜欢的用户名，因为它将用于你发布的所有镜像。

为了能够从命令行访问你的账户，你需要使用 `docker login` 命令登录：

```
$ docker login

```

如果你一直按照我的指示操作，你现在有一个名为 `microblog:latest` 的镜像存储在本地计算机上。为了能够将此镜像推送到 Docker 注册表，需要将其重命名以包含拥有它的账户。这通过 `docker tag` 命令完成：

```
$ docker tag microblog:latest <your-docker-registry-account>/microblog:latest

```

如果你再次使用 `docker images` 列出镜像，你会看到 Microblog 有两个条目，一个是原始的 `microblog:latest`，另一个还包含你的账户名称。它们实际上是同一镜像的两个别名。

要将你的镜像发布到 Docker 注册表，使用 `docker push` 命令：

```
$ docker push <your-docker-registry-account>/microblog:latest

```

现在你的镜像已公开发布，你可以像 MySQL 和其他镜像一样记录如何在 Docker 注册表中安装和运行它。

## 容器化应用程序的部署

在 Docker 容器中运行应用程序的最大好处之一是，一旦你在本地测试了容器，就可以将它们带到任何支持 Docker 的平台。例如，你可以使用我在第17章中推荐的来自 Digital Ocean、Linode 或 Amazon Lightsail 的相同服务器。即使这些提供商最便宜的产品也足以运行带有少量容器的 Docker。

Amazon Container Service (ECS) 使你能够创建一个容器主机集群来运行你的容器，在完全集成的 AWS 环境中，支持扩展和负载均衡，还可以选择为你的容器镜像使用私有容器注册表。

最后，像 Kubernetes 这样的容器编排平台提供了更高水平的自动化和便利性，允许你在 YAML 格式的文本文件中描述多容器部署，具备负载均衡、扩展、安全管理密钥以及滚动升级和回滚功能。

继续阅读下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
