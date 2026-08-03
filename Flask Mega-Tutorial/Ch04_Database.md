# 第四部分：数据库

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-iv-database](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-iv-database) | Flask Mega-Tutorial 作者 Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第四部分，我将告诉您如何使用*数据库*。

您正在阅读的是 2024 版的 Flask Mega-Tutorial。本课程完整版也可以在亚马逊上以电子书和平装本的形式订购。感谢您的支持！

如果您正在寻找 2018 版的课程，可以在此处找到。

作为参考，以下是本系列文章的完整列表：

- 第 1 章：Hello, World!

- 第 2 章：模板

- 第 3 章：Web 表单

- 第 4 章：数据库（本文）

- 第 5 章：用户登录

- 第 6 章：个人资料页面和头像

- 第 7 章：错误处理

- 第 8 章：关注者

- 第 9 章：分页

- 第 10 章：邮件支持

- 第 11 章：美化界面

- 第 12 章：日期和时间

- 第 13 章：国际化和本地化

- 第 14 章：Ajax

- 第 15 章：更好的应用结构

- 第 16 章：全文搜索

- 第 17 章：在 Linux 上部署

- 第 18 章：在 Heroku 上部署

- 第 19 章：在 Docker 容器上部署

- 第 20 章：一些 JavaScript 魔法

- 第 21 章：用户通知

- 第 22 章：后台任务

- 第 23 章：应用程序编程接口（API）

本章的主题非常重要。对于大多数应用程序来说，都需要维护可以高效检索的持久化数据，而这正是*数据库*的作用。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## Flask 中的数据库

我相信您已经听说过，Flask 本身不原生支持数据库。这是 Flask 有意不做主观规定的众多领域之一，这很好，因为您有自由选择最适合您应用程序的数据库，而不是被迫适应某一种。

Python 中提供了许多优秀的数据库选择，其中许多都有 Flask 扩展，可以实现与应用程序的更好集成。数据库可以分为两大类：遵循*关系型*模型的数据库和不遵循关系型模型的数据库。后者通常被称为*NoSQL*，表示它们不实现流行的关系查询语言 SQL。虽然两类中都有优秀的数据库产品，但我的观点是，关系型数据库更适合具有结构化数据的应用程序，如用户列表、博客帖子等，而 NoSQL 数据库往往更适合结构不太明确的数据。这个应用程序和大多数其他应用程序一样，可以使用任何一种类型的数据库实现，但基于上述原因，我将选择关系型数据库。

在第 3 章中，我向您展示了第一个 Flask 扩展。在本章中，我将使用另外两个扩展。第一个是 Flask-SQLAlchemy，该扩展为流行的 SQLAlchemy 包提供了一个 Flask 友好的包装器，SQLAlchemy 是一个对象关系映射器（ORM）。ORM 允许应用程序使用高级实体（如类、对象和方法）来管理数据库，而不是使用表和 SQL。ORM 的工作是将高级操作转换为数据库命令。

SQLAlchemy 的妙处在于它不仅仅是一个 ORM，而是支持多种关系型数据库的 ORM。SQLAlchemy 支持一长串数据库引擎，包括流行的 MySQL、PostgreSQL 和 SQLite。这非常强大，因为您可以使用不需要服务器的简单 SQLite 数据库进行开发，然后在需要将应用程序部署到生产服务器时，可以选择更强大的 MySQL 或 PostgreSQL 服务器，而无需更改您的应用程序。

要在虚拟环境中安装 Flask-SQLAlchemy，请确保您已激活虚拟环境，然后运行：

```
(venv) $ pip install flask-sqlalchemy

```

## 数据库迁移

我见过的大多数数据库教程涵盖了数据库的创建和使用，但没有充分解决在应用程序需求变化或增长时对现有数据库进行更新​​的问题。这很困难，因为关系型数据库以结构化数据为中心，所以当结构发生变化时，数据库中已有的数据需要被*迁移*到修改后的结构中。

我将在本章中介绍的第二个扩展是 Flask-Migrate，它实际上是我自己创建的。该扩展是 Alembic（一个用于 SQLAlchemy 的数据库迁移框架）的 Flask 包装器。使用数据库迁移会增加一些启动数据库的工作，但这是为将来以稳健的方式更改数据库所付出的微小代价。

Flask-Migrate 的安装过程与您见过的其他扩展类似：

```
(venv) $ pip install flask-migrate

```

## Flask-SQLAlchemy 配置

在开发过程中，我将使用 SQLite 数据库。SQLite 数据库是开发小型应用程序最方便的选择，有时甚至对于不那么小的应用程序也是如此，因为每个数据库都存储为磁盘上的单个文件，而且不需要像 MySQL 和 PostgreSQL 那样运行数据库服务器。

Flask-SQLAlchemy 需要在配置文件中添加一个新的配置项：

*config.py*：Flask-SQLAlchemy 配置

```
import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # ...
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')

```

Flask-SQLAlchemy 扩展从 `SQLALCHEMY_DATABASE_URI` 配置变量中获取应用程序数据库的位置。正如您从第 3 章中回忆的，通常最佳实践是从环境变量设置配置，并在环境未定义该变量时提供回退值。在这种情况下，我从 `DATABASE_URL` 环境变量中获取数据库 URL，如果没有定义，我将配置一个名为 *app.db* 的数据库，位于应用程序的主目录中，该目录存储在 `basedir` 变量中。

数据库将在应用程序中由*数据库实例*表示。数据库迁移引擎也将有一个实例。这些是需要创建的对象，在 *app/__init__.py* 文件的应用程序之后创建：

*app/__init__.py*：Flask-SQLAlchemy 和 Flask-Migrate 初始化

```
from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

from app import routes, models

```

我对 *__init__.py* 文件做了三处修改。首先，我添加了一个代表数据库的 `db` 对象。然后我添加了 `migrate`，代表数据库迁移引擎。希望您能看出使用 Flask 扩展的模式。大多数扩展都像这两个一样进行初始化。最后一处修改是，我在底部导入了一个名为 `models` 的新模块。该模块将定义数据库的结构。

## 数据库模型

将要存储在数据库中的数据将由一组类表示，通常称为*数据库模型*。SQLAlchemy 中的 ORM 层将执行所需的转换，将这些类创建的对象映射到相应数据库表中的行。

让我们首先创建一个代表用户的模型。使用 WWW SQL Designer 工具，我制作了以下图表来表示我们希望在用户表中使用的数据：

`id` 字段通常出现在所有模型中，并用作*主键*。数据库中的每个用户将被分配一个唯一的 id 值，存储在此字段中。在大多数情况下，主键由数据库自动分配，所以我只需要提供标记为主键的 `id` 字段。

`username`、`email` 和 `password_hash` 字段被定义为字符串（或用数据库术语说是 `VARCHAR`），并指定了它们的最大长度，以便数据库可以优化空间使用。虽然 `username` 和 `email` 字段不言自明，但 `password_hash` 字段值得注意。我想确保我正在构建的应用程序采用安全最佳实践，因此我不会以明文形式存储用户密码。存储密码的问题在于，如果数据库被攻破，攻击者将可以访问密码，这对用户来说可能是灾难性的。我不直接存储密码，而是存储*密码哈希*，这大大提高了安全性。这将是另一章的主题，所以现在不要太担心。

既然我知道了用户表需要什么，我可以将其转换为新的 *app/models.py* 模块中的代码：

*app/models.py*：用户数据库模型

```
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from app import db

class User(db.Model):
    id: so.Mappedint = so.mapped_column(primary_key=True)
    username: so.Mappedstr = so.mapped_column(sa.String(64), index=True,
                                                unique=True)
    email: so.Mappedstr = so.mapped_column(sa.String(120), index=True,
                                             unique=True)
    password_hash: so.MappedOptional[str] = so.mapped_column(sa.String(256))

    def __repr__(self):
        return '<User {}>'.format(self.username)

```

我首先从 SQLAlchemy 包中导入 `sqlalchemy` 和 `sqlalchemy.orm` 模块，它们提供了处理数据库所需的大部分元素。`sqlalchemy` 模块包含通用数据库函数和类，如类型和查询构建辅助工具，而 `sqlalchemy.orm` 提供使用模型的支持。由于这两个模块名称较长且需要经常引用，因此在 import 语句中直接定义了 `sa` 和 `so` 别名。同时还导入了来自 Flask-SQLAlchemy 的 `db` 实例和来自 Python 的 `Optional` 类型提示。

上面创建的 `User` 类将代表存储在数据库中的用户。该类继承自 `db.Model`，这是 Flask-SQLAlchemy 所有模型的基础类。`User` 模型定义了多个字段作为类变量。这些是对应数据库表中将要创建的列。

字段使用 Python *类型提示*分配类型，并用 SQLAlchemy 的 `so.Mapped` 泛型类型包装。像 `so.Mappedint` 或 `so.Mappedstr` 这样的类型声明定义了列的类型，同时也使值成为必需的，或者用数据库术语说是*非空*。要定义允许为空或*可空*的列，还需要添加来自 Python 的 `Optional` 辅助类型，如 `password_hash` 所示。

在大多数情况下，定义表列需要的不仅仅是列类型。SQLAlchemy 使用分配给每个列的 `so.mapped_column()` 函数调用来提供额外的配置。对于上面的 `id`，该列被配置为主键。对于字符串列，许多数据库需要指定长度，因此也包含在内。我还包含了其他可选参数，用于指示哪些字段是唯一且已建立索引的，这对于数据库的一致性和搜索效率很重要。

`__repr__` 方法告诉 Python 如何打印此类的对象，这对于调试非常有用。您可以在下面的 Python 解释器会话中看到 `__repr__()` 方法的实际效果：

```
>>> from app.models import User
>>> u = User(username='susan', email='susan@example.com')
>>> u
<User susan>

```

## 创建迁移仓库

上一节中创建的模型类定义了此应用程序的初始数据库结构（或*模式*）。但随着应用程序的持续增长，我可能需要对该结构进行更改，例如添加新内容，有时还需要修改或删除内容。Alembic（Flask-Migrate 使用的迁移框架）将以一种不需要每次更改时从头重新创建数据库的方式进行这些模式更改。

为了完成这个看似困难的任务，Alembic 维护了一个*迁移仓库*，这是一个存储迁移脚本的目录。每次对数据库模式进行更改时，都会向仓库添加一个迁移脚本，其中包含更改的详细信息。要将迁移应用到数据库，这些迁移脚本将按照创建的顺序执行。

Flask-Migrate 通过 `flask` 命令公开其子命令。您已经见过 `flask run`，这是 Flask 原生的子命令。`flask db` 子命令由 Flask-Migrate 添加，用于管理与数据库迁移相关的所有事项。那么让我们通过运行 `flask db init` 来为 microblog 创建迁移仓库：

```
(venv) $ flask db init
  Creating directory /home/miguel/microblog/migrations ... done
  Creating directory /home/miguel/microblog/migrations/versions ... done
  Generating /home/miguel/microblog/migrations/alembic.ini ... done
  Generating /home/miguel/microblog/migrations/env.py ... done
  Generating /home/miguel/microblog/migrations/README ... done
  Generating /home/miguel/microblog/migrations/script.py.mako ... done
  Please edit configuration/connection/logging settings in
  '/home/miguel/microblog/migrations/alembic.ini' before proceeding.

```

请记住，`flask` 命令依靠 `FLASK_APP` 环境变量来了解 Flask 应用程序的位置。对于此应用程序，您需要将 `FLASK_APP` 设置为 `microblog.py`，如第 1 章所述。如果您在项目中包含了 *.flaskenv* 文件，那么 `flask` 命令的所有子命令将自动访问该应用程序。

运行 `flask db init` 命令后，您会找到一个包含一些文件和一个 *versions* 子目录的新 *migrations* 目录。从现在开始，所有这些文件都应被视为项目的一部分，并且特别应该与应用程序代码一起添加到源代码控制中。

## 第一次数据库迁移

有了迁移仓库，现在是时候创建第一次数据库迁移了，这将包括映射到 `User` 数据库模型的 `users` 表。有两种方法可以创建数据库迁移：手动或自动。为了自动生成迁移，Alembic 将数据库模型定义的数据库模式与数据库中当前使用的实际数据库模式进行比较。然后它填充迁移脚本，添加使数据库模式与应用程序模型匹配所需的更改。在这种情况下，由于没有以前的数据库，自动迁移会将整个 `User` 模型添加到迁移脚本中。`flask db migrate` 子命令生成这些自动迁移：

```
(venv) $ flask db migrate -m "users table"
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.autogenerate.compare Detected added table 'user'
INFO  alembic.autogenerate.compare Detected added index 'ix_user_email' on ''email''
INFO  alembic.autogenerate.compare Detected added index 'ix_user_username' on ''username''
  Generating /home/miguel/microblog/migrations/versions/e517276bb1c2_users_table.py ... done

```

命令的输出让您了解 Alembic 在迁移中包含了什么。前两行是信息性的，通常可以忽略。然后它说发现了一个 user 表和两个索引。然后它告诉您迁移脚本写在了哪里。`e517276bb1c2` 值是自动生成的迁移唯一代码（对您来说会不同）。`-m` 选项给出的注释是可选的，它只是为迁移添加了一个简短的描述性文本。

生成的迁移脚本现在是您项目的一部分，如果您正在使用 git 或其他源代码控制工具，它需要作为额外的源文件与存储在 *migrations* 目录中的所有其他文件一起纳入版本控制。如果您好奇想看看它的样子，可以检查该脚本。您会发现它有两个函数：`upgrade()` 和 `downgrade()`。`upgrade()` 函数应用迁移，`downgrade()` 函数撤销迁移。这使得 Alembic 可以将数据库迁移到历史记录中的任何点，甚至是旧版本，通过使用降级路径。

`flask db migrate` 命令不对数据库做任何更改，它只生成迁移脚本。要将更改应用到数据库，必须使用 `flask db upgrade` 命令。

```
(venv) $ flask db upgrade
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.runtime.migration Running upgrade  -> e517276bb1c2, users table

```

由于此应用程序使用 SQLite，`upgrade` 命令将检测到数据库不存在并创建它（您会注意到此命令完成后添加了一个名为 *app.db* 的文件，这就是 SQLite 数据库）。在使用数据库服务器（如 MySQL 和 PostgreSQL）时，您需要在运行 `upgrade` 之前在数据库服务器中创建数据库。

请注意，Flask-SQLAlchemy 默认对数据库表使用"蛇形命名法"命名约定。对于上面的 `User` 模型，数据库中对应的表将命名为 `user`。对于 `AddressAndPhone` 模型类，表将命名为 `address_and_phone`。如果您更喜欢自己选择表名，可以向模型类添加一个名为 `__tablename__` 的属性，设置为所需的字符串名称。

## 数据库升级和降级工作流程

此时应用程序还处于初期阶段，但讨论未来的数据库迁移策略并没有坏处。想象一下，您在开发机器上有应用程序，并且还有一个副本部署到在线使用的生产服务器上。

假设对于应用程序的下一个版本，您必须对模型进行更改，例如需要添加一个新表。没有迁移的话，您需要弄清楚如何更改数据库的模式，包括在开发机器上，然后在您的服务器上，这可能需要很多工作。

但是有了数据库迁移支持，在修改了应用程序中的模型后，您可以生成一个新的迁移脚本（`flask db migrate`），检查它以确保自动生成做了正确的事情，然后将更改应用到您的开发数据库（`flask db upgrade`）。您会将迁移脚本添加到源代码控制并提交它。

当您准备将新版本的应用程序发布到生产服务器时，您需要做的就是获取更新后的应用程序版本（包括新的迁移脚本），然后运行 `flask db upgrade`。Alembic 将检测到生产数据库未更新到最新的模式修订版，并运行自上次发布以来创建的所有新迁移脚本。

如前所述，您还有一个 `flask db downgrade` 命令，用于撤销上一次迁移。虽然您不太可能在生产系统上需要此选项，但您可能会发现在开发过程中它非常有用。您可能生成了一个迁移脚本并应用了它，却发现所做的更改并不是您真正需要的。在这种情况下，您可以降级数据库，删除迁移脚本，然后生成一个新的脚本来替换它。

## 数据库关系

关系型数据库擅长存储数据项之间的关系。考虑用户撰写博客帖子的情况。用户将在 users 表中有一条记录，帖子将在 posts 表中有一条记录。记录谁写了特定帖子的最有效方式是链接两个相关记录。

一旦建立了用户和帖子之间的链接，数据库就可以回答关于此链接的查询。最简单的情况是当您有一个博客帖子，需要知道是哪个用户写了它。更复杂的查询反过来：如果您有一个用户，您可能想知道这个用户写了哪些帖子。SQLAlchemy 有助于这两种类型的查询。

让我们扩展数据库以存储博客帖子，看看关系是如何运作的。以下是新 posts 表的模式：

posts 表将具有必需的 `id`、帖子的 `body` 和 `timestamp`。但除了这些预期的字段之外，我还添加了一个 `user_id` 字段，它将帖子链接到其作者。您已经看到所有用户都有一个唯一的 `id` 主键。将博客帖子链接到其作者的方式是添加对用户 `id` 的引用，这正是 `user_id` 字段的作用。这个 `user_id` 字段被称为*外键*，因为它引用另一个表的主键。上面的数据库图将外键显示为字段与其引用的表的 `id` 字段之间的链接。这种关系被称为*一对多*，因为"一个"用户写了"多篇"帖子。

修改后的 *app/models.py* 如下所示：

*app/models.py*：帖子数据库表与关系

```
from datetime import datetime, timezone
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from app import db

class User(db.Model):
    id: so.Mappedint = so.mapped_column(primary_key=True)
    username: so.Mappedstr = so.mapped_column(sa.String(64), index=True,
                                                unique=True)
    email: so.Mappedstr = so.mapped_column(sa.String(120), index=True,
                                             unique=True)
    password_hash: so.MappedOptional[str] = so.mapped_column(sa.String(256))

    posts: so.WriteOnlyMapped'Post' = so.relationship(
        back_populates='author')

    def __repr__(self):
        return '<User {}>'.format(self.username)

class Post(db.Model):
    id: so.Mappedint = so.mapped_column(primary_key=True)
    body: so.Mappedstr = so.mapped_column(sa.String(140))
    timestamp: so.Mappeddatetime = so.mapped_column(
        index=True, default=lambda: datetime.now(timezone.utc))
    user_id: so.Mappedint = so.mapped_column(sa.ForeignKey(User.id),
                                               index=True)

    author: so.MappedUser = so.relationship(back_populates='posts')

    def __repr__(self):
        return '<Post {}>'.format(self.body)

```

新的 `Post` 类将代表用户撰写的博客帖子。`timestamp` 字段使用 `datetime` 类型提示定义，并配置为已建立索引，这对于按时间顺序高效检索帖子很有用。我还添加了一个 `default` 参数，并传入了一个返回 UTC 时区当前时间的 *lambda* 函数。当您将函数作为默认值传递时，SQLAlchemy 会将字段设置为函数返回的值。通常，在服务器应用程序中，您应该使用 UTC 日期和时间，而不是您所在的本地时间。这确保了无论用户和服务器位于何处，都使用统一的时间戳。这些时间戳在显示时会转换为用户的本地时间。

`user_id` 字段被初始化为 `User.id` 的外键，这意味着它引用 users 表中的 `id` 列的值。由于并非所有数据库都会自动为外键创建索引，所以显式添加了 `index=True` 选项，以便优化基于此列的搜索。

`User` 类有一个新的 `posts` 字段，使用 `so.relationship()` 初始化。这不是实际的数据库字段，而是用户和帖子之间关系的高级视图，因此它不在数据库图中。同样，`Post` 类有一个 `author` 字段，也初始化为关系。这两个属性允许应用程序访问连接的 `user` 和 `post` 条目。

`so.relationship()` 的第一个参数是表示关系另一端的模型类。此参数可以作为字符串提供，当类在模块中稍后定义时这是必需的。`back_populates` 参数引用另一端的关系属性名称，以便 SQLAlchemy 知道这些属性指的是同一关系的两端。

`posts` 关系属性使用不同的类型定义。它使用 `so.WriteOnlyMapped` 而不是 `so.Mapped`，将 `posts` 定义为包含 `Post` 对象的集合类型。如果这些细节现在还不太清楚，请不要担心，我将在本文末尾向您展示这些示例。

由于我对应用程序模型进行了更新，需要生成一个新的数据库迁移：

```
(venv) $ flask db migrate -m "posts table"
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.autogenerate.compare Detected added table 'post'
INFO  alembic.autogenerate.compare Detected added index 'ix_post_timestamp' on
''timestamp''
  Generating /home/miguel/microblog/migrations/versions/780739b227a7_posts_table.py ... done

```

并且需要将迁移应用到数据库：

```
(venv) $ flask db upgrade
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.runtime.migration Running upgrade e517276bb1c2 -> 780739b227a7, posts table

```

如果您将项目存储在源代码控制中，也请记得将新的迁移脚本添加到其中。

## 使用数据库玩耍

我让您经历了一个漫长的过程来定义数据库，但我还没有向您展示一切是如何工作的。由于应用程序还没有任何数据库逻辑，让我们在 Python 解释器中使用数据库来熟悉它。通过在终端上运行 `python` 来启动 Python。在启动解释器之前，请确保您的虚拟环境已激活。

进入 Python 提示符后，让我们导入应用程序、数据库实例、模型和 SQLAlchemy 入口点：

```
>>> from app import app, db
>>> from app.models import User, Post
>>> import sqlalchemy as sa

```

下一步有点奇怪。为了使 Flask 及其扩展能够访问 Flask 应用程序，而不必将 `app` 作为参数传递给每个函数，必须创建并推送一个*应用上下文*。应用上下文将在本教程后面更详细地介绍，所以现在，只需在 Python shell 会话中输入以下代码：

```
>>> app.app_context().push()

```

接下来，创建一个新用户：

```
>>> u = User(username='john', email='john@example.com')
>>> db.session.add(u)
>>> db.session.commit()

```

对数据库的更改是在数据库会话的上下文中完成的，可以通过 `db.session` 访问。多个更改可以累积在一个会话中，一旦所有更改都已注册，您可以发出单个 `db.session.commit()`，它会原子性地写入所有更改。如果在处理会话时的任何时候出现错误，调用 `db.session.rollback()` 将中止会话并删除其中存储的任何更改。要记住的重要事情是，只有在使用 `db.session.commit()` 发出提交时，更改才会写入数据库。会话保证数据库永远不会处于不一致的状态。

您是否想知道所有这些数据库操作如何知道使用哪个数据库？上面推送的应用上下文允许 Flask-SQLAlchemy 访问 Flask 应用程序实例 `app`，而无需将其作为参数接收。该扩展在 `app.config` 字典中查找 `SQLALCHEMY_DATABASE_URI` 条目，其中包含数据库 URL。

让我们添加另一个用户：

```
>>> u = User(username='susan', email='susan@example.com')
>>> db.session.add(u)
>>> db.session.commit()

```

数据库可以回答返回所有用户的查询：

```
>>> query = sa.select(User)
>>> users = db.session.scalars(query).all()
>>> users
<User john>, <User susan>

```

此示例中的 `query` 变量被赋予了一个基本查询，用于*选择*所有用户。这是通过将模型类传递给 SQLAlchemy 的 `sa.select()` 查询辅助函数来实现的。您会发现大多数数据库查询都是从 `sa.select()` 调用开始的。

上面用于定义和提交更改的数据库会话也用于执行查询。`db.session.scalars()` 方法执行数据库查询并返回结果迭代器。调用结果对象的 `all()` 方法会将结果转换为普通列表。

在许多情况下，在 for 循环中使用结果迭代器比将其转换为列表更高效：

```
>>> users = db.session.scalars(query)
>>> for u in users:
...     print(u.id, u.username)
...
1 john
2 susan

```

注意，当这些用户被添加时，`id` 字段自动设置为 1 和 2。这是因为 SQLAlchemy 将整数主键列配置为自动递增。

这是进行查询的另一种方式。如果您知道用户的 `id`，可以按如下方式检索该用户：

```
>>> u = db.session.get(User, 1)
>>> u
<User john>

```

现在让我们添加一篇博客帖子：

```
>>> u = db.session.get(User, 1)
>>> p = Post(body='my first post!', author=u)
>>> db.session.add(p)
>>> db.session.commit()

```

我不需要为 `timestamp` 字段设置值，因为该字段有一个默认值，您可以在模型定义中看到。那 `user_id` 字段呢？回想一下，我在 `Post` 类中创建的 `so.relationship` 为帖子添加了一个 `author` 属性。我使用这个 `author` 字段为帖子分配作者，而不必处理用户 ID。SQLAlchemy 在这方面非常出色，因为它提供了关系和外部键的高级抽象。

为了完成这个会话，让我们再看几个数据库查询：

```
>>> # get all posts written by a user
>>> u = db.session.get(User, 1)
>>> u
<User john>
>>> query = u.posts.select()
>>> posts = db.session.scalars(query).all()
>>> posts
<Post my first post!>

>>> # same, but with a user that has no posts
>>> u = db.session.get(User, 2)
>>> u
<User susan>
>>> query = u.posts.select()
>>> posts = db.session.scalars(query).all()
>>> posts


>>> # print post author and body for all posts
>>> query = sa.select(Post)
>>> posts = db.session.scalars(query)
>>> for p in posts:
...     print(p.id, p.author.username, p.body)
...
1 john my first post!

# get all users in reverse alphabetical order
>>> query = sa.select(User).order_by(User.username.desc())
>>> db.session.scalars(query).all()
<User susan>, <User john>

# get all users that have usernames starting with "s"
>>> query = sa.select(User).where(User.username.like('s%'))
>>> db.session.scalars(query).all()
<User susan>

```

注意上面前两个示例中如何使用用户和帖子之间的关系。回想一下，`User` 模型有一个 `posts` 关系属性，它被配置为 `WriteOnlyMapped` 泛型类型。这是一种特殊类型的关系，它添加了一个 `select()` 方法，该方法返回相关项目的数据库查询。`u.posts.select()` 表达式负责生成将用户与其博客帖子链接起来的查询。

最后一个查询演示了如何使用条件过滤表的内容。`where()` 子句用于创建过滤器，仅从所选实体中选择行的子集。在此示例中，我使用 `like()` 运算符根据模式选择用户。

SQLAlchemy 文档是了解查询数据库可用众多选项的最佳地方。

最后，退出 Python shell 并使用以下命令擦除上面创建的测试用户和帖子，以便数据库干净并准备下一章使用：

```
(venv) $ flask db downgrade base
(venv) $ flask db upgrade

```

第一个命令告诉 Flask-Migrate 以相反的顺序应用数据库迁移。当 `downgrade` 命令未指定目标时，它会降级一个修订版。`base` 目标会导致所有迁移被降级，直到数据库回到初始状态，没有任何表。

`upgrade` 命令以正向顺序重新应用所有迁移。升级的默认目标是 `head`，这是最新迁移的快捷方式。此命令有效地恢复了上面降级的表。由于数据库迁移不保留存储在数据库中的数据，降级然后升级的效果是快速清空所有表。

## Shell 上下文

还记得您在上一节开始时，启动 Python 解释器后做了什么吗？刚开始时，您输入了一些导入语句，然后推送了一个应用上下文：

```
>>> from app import app, db
>>> from app.models import User, Post
>>> import sqlalchemy as sa
>>> app.app_context().push()

```

在开发应用程序时，您需要经常在 Python shell 中测试东西，因此每次都要重复上述语句会变得很繁琐。现在是解决这个问题的好时机。

`flask shell` 子命令是 `flask` 命令系列中的另一个非常有用的工具。`shell` 命令是 Flask 实现的第二个"核心"命令，仅次于 `run`。此命令的目的是在应用程序的上下文中启动 Python 解释器。这意味着什么？请看以下示例：

```
(venv) $ python
>>> app
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
NameError: name 'app' is not defined
>>>

(venv) $ flask shell
>>> app
<Flask 'app'>

```

使用普通的解释器会话，`app` 符号除非显式导入，否则是未知的，但使用 `flask shell` 时，该命令会预先导入应用程序实例，并为您推送其应用上下文。`flask shell` 的好处不仅在于它预导入了 `app`，还在于您可以配置一个"shell 上下文"，即要预导入的其他符号列表。

*microblog.py* 中的以下函数创建了一个 shell 上下文，将数据库实例和模型添加到 shell 会话中：

```
import sqlalchemy as sa
import sqlalchemy.orm as so
from app import app, db
from app.models import User, Post

@app.shell_context_processor
def make_shell_context():
    return {'sa': sa, 'so': so, 'db': db, 'User': User, 'Post': Post}

```

`app.shell_context_processor` 装饰器将该函数注册为 shell 上下文函数。当 `flask shell` 命令运行时，它将调用此函数并将返回的项注册到 shell 会话中。该函数返回字典而不是列表的原因是，对于每个项，您还必须提供一个在 shell 中引用它的名称，这由字典键给出。

添加 shell 上下文处理器函数后，您无需导入即可使用数据库实体：

```
(venv) $ flask shell
>>> db
<SQLAlchemy sqlite:////home/miguel/microblog/app.db>
>>> User
<class 'app.models.User'>
>>> Post
<class 'app.models.Post'>

```

如果您尝试上述操作，在尝试访问 `sa`、`so`、`db`、`User` 和 `Post` 时遇到 `NameError` 异常，则说明 `make_shell_context()` 函数未向 Flask 注册。最可能的原因是您没有在环境中设置 `FLASK_APP=microblog.py`。在这种情况下，请返回第 1 章查看如何设置 `FLASK_APP` 环境变量。如果您经常在打开新终端窗口时忘记设置此变量，您可以考虑向项目添加一个 *.flaskenv* 文件，如该章末尾所述。

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
