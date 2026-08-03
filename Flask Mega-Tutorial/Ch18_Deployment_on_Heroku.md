# 第18部分：在 Heroku 上部署

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xviii-deployment-on-heroku](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xviii-deployment-on-heroku) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第18篇，本文将把 Microblog 部署到 Heroku 云平台。

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

- 第18章：在 Heroku 上部署（本文）

- 第19章：在 Docker 容器上部署

- 第20章：一些 JavaScript 魔法

- 第21章：用户通知

- 第22章：后台作业

- 第23章：应用程序编程接口（API）

在上一篇文章中，我向你展示了"传统"的 Python 应用托管方式，并给出了一个实际部署到基于 Linux 的服务器的示例。如果你不习惯管理 Linux 系统，可能会觉得这项工作需要付出大量的精力，而且肯定会有更简单的方法。

在本章中，我将向你展示一种完全不同的方法，你将依赖第三方*云*托管提供商来完成大部分管理任务，从而腾出更多时间专注于应用程序开发。

许多云托管提供商提供一个托管平台来运行应用程序。要将你的应用程序部署到这些平台，你只需要提供实际的应用程序本身，因为硬件、操作系统、脚本语言解释器、数据库等都由服务方管理。这种类型的服务称为平台即服务（Platform as a Service，简称 PaaS）。

听起来好得令人难以置信，对吧？

我将把 Microblog 部署到 Heroku，这是一个流行的云托管服务，对 Python 应用程序非常友好。不幸的是，Heroku 已经取消了其广受欢迎的免费套餐，因此完成这个部署练习将花费你少量资金。如果你决定尝试，请确保在实验完成后删除你的项目。

*本章的 GitHub 链接：浏览，Zip，Diff。*

## 在 Heroku 上托管

Heroku 是最早的"平台即服务"提供商之一。它最初是作为 Ruby 应用程序的托管选项起步的，但后来扩展到支持许多其他语言，如 Java、Node.js，当然还有 Python。

将 Web 应用程序部署到 Heroku 是通过 `git` 版本控制工具完成的，因此你的应用程序必须位于 git 仓库中。Heroku 会在应用的根目录中查找一个名为 *Procfile* 的文件，以获取如何启动应用程序的说明。对于 Python 项目，Heroku 还期望有一个 *requirements.txt* 文件，列出所有需要安装的模块依赖项。通过 git push 操作将应用程序上传到 Heroku 的服务器后，基本上就完成了，只需要等待几秒钟，应用程序就会上线。就是这么简单。

Heroku 提供的不同服务层级允许你选择应用程序获得多少计算能力和时间，因此随着用户群的增长，你可能需要购买更多的计算单元，Heroku 称之为"dynos"。

准备好尝试 Heroku 了吗？让我们开始吧！

## 创建 Heroku 账户

在部署到 Heroku 之前，你需要拥有一个 Heroku 账户。请访问 heroku.com 并创建一个账户。拥有账户并登录 Heroku 后，你将看到一个仪表板，其中列出了你所有的应用程序。

## 安装 Heroku CLI

Heroku 提供了一个名为 Heroku CLI 的命令行工具，用于与其服务交互，支持 Windows、Mac OS X 和 Linux。文档中包含所有支持平台的安装说明。如果你打算部署应用程序以测试服务，请继续在你的系统上安装它。

CLI 安装完成后，你首先要做的是登录你的 Heroku 账户：

```
$ heroku login

```

Heroku CLI 会要求你输入电子邮件地址和账户密码。你的认证状态将在后续命令中被记住。

## 设置 Git

`git` 工具是将应用程序部署到 Heroku 的核心，因此如果你还没有安装它，必须在系统上安装它。如果你的操作系统没有可用的软件包，可以访问 git 网站下载安装程序。

有很多理由说明为什么使用 `git` 管理项目是明智的。如果你计划部署到 Heroku，又多了一个理由，因为要部署到 Heroku，你的应用程序必须位于 `git` 仓库中。如果你要对 Microblog 进行测试部署，你可以从 GitHub 克隆我的这个应用版本：

```
$ git clone https://github.com/miguelgrinberg/microblog
$ cd microblog
$ git checkout v0.18

```

`git checkout` 命令选择了一个特定的提交，该提交对应于本章的历史节点。

如果你更愿意使用自己的代码而不是我的，你可以通过运行 `git init .` 将项目转换为 `git` 仓库（注意 `init` 后面的点，它告诉 git 你想在当前目录中创建仓库）。一旦 git 仓库创建完成，使用 `git add` 命令添加所有源文件，然后使用 `git commit` 将它们提交到仓库。

## 创建 Heroku 应用程序

要在 Heroku 注册一个新应用程序，你可以从应用程序的根目录使用 `apps:create` 命令，传入应用程序名称作为唯一参数：

```
$ heroku apps:create flask-microblog
Creating flask-microblog... done
http://flask-microblog.herokuapp.com/ | https://git.heroku.com/flask-microblog.git

```

Heroku 要求应用程序名称必须唯一。我上面使用的名称 `flask-microblog` 将不可用，因为我已经在使用它，因此你需要为你的部署选择不同的名称。

此命令的输出将包括 Heroku 分配给应用程序的 URL，以及其在 Heroku 服务器上的 git 仓库。你的本地 git 仓库将被配置一个额外的 *remote*，名为 `heroku`，指向该仓库。你可以使用 `git remote` 命令验证它是否存在：

```
$ git remote -v
heroku  https://git.heroku.com/flask-microblog.git (fetch)
heroku  https://git.heroku.com/flask-microblog.git (push)

```

根据你创建 git 仓库的方式，上述命令的输出还可能包含另一个名为 `origin` 的 remote，它不被 Heroku 使用。

## 临时文件系统

Heroku 平台与其他部署平台的不同之处在于，它采用在虚拟化平台上运行的*临时*文件系统。这意味着什么？这意味着 Heroku 可以随时将运行你服务器的虚拟服务器重置为干净状态。你不能假设保存到文件系统的任何数据都会持久存在，事实上 Heroku 会非常频繁地回收服务器。

在这种条件下工作给使用文件的应用程序带来了一些问题：

- 默认的 SQLite 数据库引擎将数据写入磁盘文件

- 应用程序的日志也会写入文件系统

- 编译后的语言翻译文件也会写入本地文件

以下各节将解决这三个问题。

## 使用 Heroku Postgres 数据库

为了解决第一个问题，我将切换到一个不同的数据库引擎。在第17章中，你看到我使用了 MySQL 数据库来增强 Ubuntu 部署的健壮性。Heroku 有自己的数据库产品，基于 Postgres 数据库，因此我将切换使用它，以避开基于文件的 SQLite。

Heroku 应用程序的数据库也是通过 Heroku CLI 来配置的。这里我将创建一个免费层的数据库：

```
$ heroku addons:create heroku-postgresql:mini
Creating heroku-postgresql:mini on flask-microblog... $5/month
Database has been created and is available
 ! This database is empty. If upgrading, you can transfer
 ! data from another database with pg:copy
Created postgresql-parallel-56076 as DATABASE_URL
Use heroku addons:docs heroku-postgresql to view documentation

```

新创建的数据库 URL 存储在一个 `DATABASE_URL` 环境变量中，当应用程序在 Heroku 平台上运行时可以使用它。这非常方便，因为应用程序已经在寻找该变量中的数据库 URL。

要确保你的 Heroku 应用中配置了 `DATABASE_URL` 变量，可以使用以下命令：

```
$ heroku config
DATABASE_URL:  postgres://...

```

最近版本的 SQLAlchemy 有一个不幸的问题：它们期望 Postgres 数据库 URL 以 `postgresql://` 开头，而不是 Heroku 使用的 `postgres://`。为了确保应用程序能够连接到数据库，需要将 URL 更新为 SQLAlchemy 所需的格式。这可以在 `Config` 类中使用字符串替换操作完成：

*config.py*：修复 Postgres 数据库 URL 以兼容 SQLAlchemy。

```
class Config:
    # ...
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace(
        'postgres://', 'postgresql://') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    # ...

```

即使 `DATABASE_URL` 变量设置为其他数据库，这个字符串替换操作也是安全的，不会影响它。

## 日志输出到 stdout

Heroku 期望应用程序直接记录到 `stdout`。应用程序打印到标准输出的任何内容都会被保存，并在你使用 `heroku logs` 命令时返回。因此，我将添加一个配置变量，用于指示是否需要记录到 `stdout` 还是像之前一样记录到文件。以下是配置中的更改：

*config.py*：选择是否输出到 stdout。

```
class Config:
    # ...
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT')

```

然后在应用工厂函数中，我可以检查这个配置来决定如何配置应用程序的日志记录器：

*app/__init__.py*：输出到 stdout 或文件。

```
def create_app(config_class=Config):
    # ...
    if not app.debug and not app.testing:
        # ...

        if app.config['LOG_TO_STDOUT']:
            stream_handler = logging.StreamHandler()
            stream_handler.setLevel(logging.INFO)
            app.logger.addHandler(stream_handler)
        else:
            if not os.path.exists('logs'):
                os.mkdir('logs')
            file_handler = RotatingFileHandler('logs/microblog.log',
                                               maxBytes=10240, backupCount=10)
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s '
                'in %(pathname)s:%(lineno)d'))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('Microblog startup')

    return app

```

所以现在，当应用程序在 Heroku 上运行时，我需要设置 `LOG_TO_STDOUT` 环境变量，但在其他配置中不设置。Heroku CLI 使这变得很容易，它提供了一个选项来设置运行时使用的环境变量：

```
$ heroku config:set LOG_TO_STDOUT=1
Setting LOG_TO_STDOUT and restarting flask-microblog... done, v4
LOG_TO_STDOUT: 1

```

## 编译翻译

Microblog 依赖本地文件的第三个方面是编译后的语言翻译文件。确保这些文件永远不会从临时文件系统中消失的更直接的方法是将编译后的语言文件添加到 git 仓库中，这样它们就成为应用程序部署到 Heroku 后初始状态的一部分。

在我看来，一个更优雅的选择是将 `flask translate compile` 命令包含在提供给 Heroku 的启动命令中，这样每当服务器重启时，这些文件都会被重新编译。我将采用这个选项，因为我知道启动过程无论如何都需要多个命令 —— 我还需要运行数据库迁移。所以目前，我将把这个问题的解决先放一放，稍后在编写 *Procfile* 时再处理。

## Elasticsearch 托管

Elasticsearch 是可以添加到 Heroku 项目中的众多服务之一，但与 Postgres 不同，这不是 Heroku 提供的服务，而是与 Heroku 合作提供附加组件的第三方服务。在我撰写本文时，有三个不同的集成 Elasticsearch 服务提供商。如果你不希望部署搜索功能，可以跳过本节。你仍然可以部署应用程序，但搜索功能将不可用。

在可用的 Elasticsearch 附加组件选项中，我决定尝试 SearchBox，它带有一个免费的入门计划。要将 SearchBox 添加到你的账户，你需要在登录 Heroku 后运行以下命令：

```
$ heroku addons:create searchbox:starter

```

此命令将部署一个 Elasticsearch 服务，并将连接 URL 保存在与你的应用程序关联的 `SEARCHBOX_URL` 环境变量中。再次注意，除非你将信用卡添加到你的 Heroku 账户，否则此命令将失败。

如果你回忆一下第16章，我的应用程序是在 `ELASTICSEARCH_URL` 变量中查找 Elasticsearch 连接 URL 的，因此我需要添加这个变量并将其设置为 SearchBox 分配的连接 URL：

```
$ heroku config:get SEARCHBOX_URL
<your-elasticsearch-url>
$ heroku config:set ELASTICSEARCH_URL=<your-elasticsearch-url>

```

这里我首先让 Heroku 打印出 `SEARCHBOX_URL` 的值，然后添加了一个名为 `ELASTICSEARCH_URL` 的新环境变量，设置为相同的值。

应用程序的许多其他功能也通过环境变量进行配置，例如 `SECRET_KEY`、`MS_TRANSLATOR_KEY`、`MAIL_SERVER` 等。这些变量也需要复制到 Heroku 部署中，以便应用程序可以访问它们。`heroku config:set` 可用于将这些变量从你的 *.env* 文件传输到 Heroku。

下面的示例配置了一个密钥：

```
heroku config:set SECRET_KEY=7853fbd853a249c586f7d810a7938b43

```

## 更新依赖要求

Heroku 期望依赖项列在 *requirements.txt* 文件中，就像我在第15章中定义的那样。但为了让应用程序在 Heroku 上运行，我需要在这个文件中添加两个新的依赖项。

Heroku 不提供自己的 Web 服务器。相反，它期望应用程序在环境变量 `$PORT` 给出的端口号上启动自己的 Web 服务器。由于 Flask 开发 Web 服务器不够健壮，不适合生产环境，我将再次使用 Gunicorn，这是 Heroku 为 Python 应用程序推荐的服务器。

应用程序还将连接到 Postgres 数据库，为此 SQLAlchemy 需要安装 `psycopg2` 或 `psycopg2-binary` 包。通常首选二进制版本，因为它安装的是已经构建好的包，而 `psycopg2` 需要安装 C 编译器才能在安装过程中构建包。

`gunicorn` 和 `psycopg2-binary` 都需要添加到 *requirements.txt* 文件中。

## Procfile

Heroku 需要知道如何执行应用程序，为此它使用应用根目录中名为 *Procfile* 的文件。此文件的格式很简单，每行包括一个进程名称、一个冒号，然后是启动进程的命令。在 Heroku 上运行的最常见的应用程序类型是 Web 应用程序，对于这种类型的应用程序，进程名称应为 `web`。下面是一个 Microblog 的 *Procfile* 示例：

*Procfile*：Heroku Procfile。

```
web: flask db upgrade; flask translate compile; gunicorn microblog:app

```

这里我定义了启动 Web 应用程序的命令，由三个连续的命令组成。首先运行数据库迁移升级，然后编译语言翻译，最后启动服务器。

因为前两个子命令基于 `flask` 命令，我需要添加 `FLASK_APP` 环境变量：

```
$ heroku config:set FLASK_APP=microblog.py
Setting FLASK_APP and restarting flask-microblog... done, v6
FLASK_APP: microblog.py

```

应用程序还依赖其他环境变量，例如配置电子邮件服务器或实时翻译令牌的变量。这些需要通过更多的 `heroku config:set` 命令添加。

`gunicorn` 命令比我在 Ubuntu 部署中使用的更简单，因为该服务器与 Heroku 环境有很好的集成。例如，`$PORT` 环境变量默认会被使用，Heroku 建议添加一个名为 `WEB_CONCURRENCY` 的变量，而不是使用 `-w` 选项来设置工作进程数，当没有提供 `-w` 时 `gunicorn` 会使用该变量，这使你可以灵活地控制工作进程数而无需修改 *Procfile*。

## 部署应用程序

所有准备工作已经完成，现在是时候进行部署了。要将应用程序上传到 Heroku 的服务器进行部署，需要使用 `git push` 命令。这类似于你将本地 git 仓库中的更改推送到 GitHub 或其他远程 git 服务器的方式。

根据你创建 git 仓库的方式，有几种不同的操作方法。如果你使用的是我的 `v0.18` 代码，那么你需要基于此标签创建一个分支，并将其推送到远程的 `main` 分支，如下所示：

```
$ git checkout -b deploy
$ git push heroku deploy:main

```

相反，如果你使用的是自己的仓库，那么你的代码已经在 `main` 或 `master` 分支上，因此你首先需要确保你的更改已提交：

```
$ git commit -a -m "heroku deployment changes"

```

然后你可以运行以下命令开始部署：

```
$ git push heroku main  # you may need to use "master" instead of "main"

```

无论你如何推送分支，都应该看到 Heroku 的以下输出：

```
$ git push heroku deploy:main
Enumerating objects: 264, done.
Counting objects: 100% (264/264), done.
Delta compression using up to 12 threads
Compressing objects: 100% (183/183), done.
Writing objects: 100% (264/264), 59.44 KiB | 5.94 MiB/s, done.
Total 264 (delta 132), reused 143 (delta 62)
remote: Compressing source files... done.
remote: Building source:
remote:
remote: -----> Building on the Heroku-20 stack
remote: -----> Determining which buildpack to use for this app
remote: -----> Python app detected
remote: -----> No Python version was specified. Using the buildpack default: python-3.9.6
remote:        To use a different version, see: https://devcenter.heroku.com/articles/...
remote: -----> Installing python-3.9.6
remote: -----> Installing pip 20.2.4, setuptools 47.1.1 and wheel 0.36.2
remote: -----> Installing SQLite3
remote: -----> Installing requirements with pip
...
remote:
remote: -----> Discovering process types
remote:        Procfile declares types -> web
remote:
remote: -----> Compressing...
remote:        Done: 69.2M
remote: -----> Launching...
remote:        Released v7
remote:        https://flask-microblog.herokuapp.com/ deployed to Heroku
remote:
remote: Verifying deploy... done.
To https://git.heroku.com/flask-microblog.git
 * new branch      deploy -> main

```

我们在 `git push` 命令中使用的 `heroku` 标签是 Heroku CLI 在创建应用程序时自动添加的远程仓库。`deploy:main` 参数表示我将代码从本地仓库的 `deploy` 分支推送到 Heroku 仓库的 `main` 分支。当你使用自己的项目时，你可能会使用 `git push heroku main` 命令推送，该命令推送你的本地 `main` 分支。由于此项目的结构，我推送的不是 `main` 分支，但 Heroku 侧的目标分支始终需要是 `main` 或 `master`，因为这是 Heroku 接受部署的唯一分支名称。

就是这样，现在应用程序应该已经部署到创建应用程序时输出中给出的 URL 上了。在我的例子中，URL 是 *https://flask-microblog.herokuapp.com*，所以这就是我需要输入以访问应用程序的地址。

如果你想查看正在运行的应用程序的日志条目，请使用 `heroku logs` 命令。如果应用程序由于任何原因启动失败，这将非常有用。如果有任何错误，都会出现在日志中。

## 部署应用程序更新

要部署新版本的应用程序，你只需要用新代码运行一个新的 `git push` 命令。这将重复部署过程，将旧部署下线，然后用新代码替换它。*Procfile* 中的命令将在新部署过程中再次运行，因此任何新的数据库迁移或翻译都会在此过程中更新。

继续阅读下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
