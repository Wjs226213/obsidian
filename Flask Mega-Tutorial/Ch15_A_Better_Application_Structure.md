# Part 15: A Better Application Structure

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xv-a-better-application-structure](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xv-a-better-application-structure) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第十五篇，在这篇文章中，我将使用适用于大型应用的风格来重构应用结构。

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

- 第 15 章：更好的应用结构（本文）

- 第 16 章：全文搜索

- 第 17 章：在 Linux 上部署

- 第 18 章：在 Heroku 上部署

- 第 19 章：在 Docker 容器上部署

- 第 20 章：一些 JavaScript 魔法

- 第 21 章：用户通知

- 第 22 章：后台任务

- 第 23 章：应用程序编程接口（API）

Microblog 已经是一个相当规模的应用了，所以我认为这是一个很好的机会来讨论 Flask 应用如何在不变得混乱或难以管理的情况下成长。Flask 是一个旨在让你以任何方式组织项目的框架，作为这种理念的一部分，它使得在应用变得更大时，或者当你的需求或经验水平发生变化时，可以改变或调整应用的结构。

在本章中，我将讨论一些适用于大型应用的模式，并且为了演示它们，我将对 Microblog 项目的结构进行一些更改，目标是使代码更易于维护和更好地组织。但当然，按照真正的 Flask 精神，我鼓励你仅将这些更改作为建议来参考，以决定如何组织你自己的项目。

*本章的 GitHub 链接：浏览, Zip, Diff.*

## 当前的局限性

应用在其当前状态下存在两个基本问题。如果你看一下应用的结构，你会注意到可以识别出几个不同的子系统，但支持它们的代码都混杂在一起，没有任何清晰的边界。让我们回顾一下这些子系统是什么：

- 用户认证子系统，包括 *app/routes.py* 中的一些视图函数、*app/forms.py* 中的一些表单、*app/templates* 中的一些模板以及 *app/email.py* 中的邮件支持。

- 错误子系统，在 *app/errors.py* 中定义了错误处理程序，在 *app/templates* 中定义了模板。

- 核心应用功能，包括显示和编写博客帖子、用户资料和关注、以及博客帖子的实时翻译，这分布在大多数应用模块和模板中。

思考一下我识别出的这三个子系统以及它们的结构，你可能会注意到一种模式。到目前为止，我所遵循的组织逻辑是基于拥有专用于不同应用功能的模块。有一个模块用于视图函数，另一个用于 Web 表单，一个用于错误，一个用于邮件，一个用于 HTML 模板的目录，等等。虽然这种结构对小项目来说是有意义的，但一旦项目开始增长，它往往会使其中一些模块变得非常庞大和混乱。

清楚看到问题的一种方式是考虑如何通过尽可能多地复制这个项目来开始第二个项目。例如，用户认证部分应该可以在其他应用中很好地工作，但如果你想原样使用这些代码，你将不得不进入几个模块，将相关部分复制/粘贴到新项目的新文件中。看到这有多不方便了吗？如果这个项目将所有与认证相关的文件与应用的其余部分分开，那不是更好吗？Flask 的*蓝图*功能有助于实现更实用的组织方式，使代码更易于重用。

还有第二个不那么明显的问题。Flask 应用实例是作为全局变量在 *app/__init__.py* 中创建的，然后被许多应用模块导入。虽然这本身不是问题，但将应用作为全局变量会使某些场景变得复杂，特别是那些与测试相关的场景。想象一下，你想在不同的配置下测试这个应用。由于应用被定义为全局变量，实际上没有办法实例化使用不同配置变量的两个应用。另一个不理想的情况是，所有测试都使用同一个应用，因此一个测试可能对应用进行更改，从而影响稍后运行的另一个测试。理想情况下，你希望所有测试都在一个全新的应用实例上运行。

你实际上可以在 *tests.py* 模块中看到，我使用了在导入应用之前覆盖 `DATABASE_URL` 环境变量的技巧，以便测试使用内存数据库而不是默认的基于磁盘的 SQLite 数据库。

更好的解决方案是不使用全局变量来保存应用，而是使用*应用工厂*函数在运行时创建应用。这将是一个接受配置对象作为参数并返回一个 Flask 应用实例的函数，该实例已配置了这些设置。如果我能修改应用以使用应用工厂函数，那么编写需要特殊配置的测试将变得容易，因为每个测试都可以创建自己的应用。

在本章中，我将重构应用，为上面识别出的三个子系统引入蓝图，并引入一个应用工厂函数。向你展示详细的更改列表是不切实际的，因为应用的几乎每个文件都有小的更改，所以我将讨论进行重构所采取的步骤，然后你可以下载已经完成这些更改的应用。

## 蓝图

在 Flask 中，蓝图是一个逻辑结构，代表应用的一个子集。蓝图可以包括路由、视图函数、表单、模板和静态文件等元素。如果你将蓝图写在一个单独的 Python 包中，那么你就拥有了一个封装了应用特定功能相关元素的组件。

蓝图的内容最初处于休眠状态。要激活这些元素，需要将蓝图注册到应用中。在注册过程中，添加到蓝图中的所有元素都会传递给应用。因此，你可以将蓝图视为应用功能的临时存储，有助于组织代码。

### 错误处理蓝图

我创建的第一个蓝图是封装错误处理程序支持的。该蓝图的结构如下：

```
app/
    errors/                             <-- 蓝图包
        __init__.py                     <-- 蓝图创建
        handlers.py                     <-- 错误处理程序
    templates/
        errors/                         <-- 错误模板
            404.html
            500.html
    __init__.py                         <-- 蓝图注册

```

本质上，我所做的是将 *app/errors.py* 模块移动到 *app/errors/handlers.py*，并将两个错误模板移动到 *app/templates/errors*，使它们与其他模板分开。我还必须更改两个错误处理程序中的 `render_template()` 调用，以使用新的 *errors* 模板子目录。之后，我将蓝图创建添加到 *app/errors/__init__.py* 模块，并将蓝图注册添加到 *app/__init__.py*（在应用实例创建之后）。

我应该注意到，Flask 蓝图可以配置为拥有单独的模板或静态文件目录。我决定将模板移动到应用模板目录的子目录中，以便所有模板都位于单一层次结构中，但如果你更喜欢将属于蓝图的模板放在蓝图包内部，这也是支持的。例如，如果你在 `Blueprint()` 构造函数中添加 `template_folder='templates'` 参数，那么你可以将蓝图的模板存储在 *app/errors/templates* 中。

蓝图的创建与应用的创建相当类似。这是在蓝图包的 ___init__.py 模块中完成的：

*app/errors/__init__.py*：错误蓝图。

```
from flask import Blueprint

bp = Blueprint('errors', __name__)

from app.errors import handlers

```

`Blueprint` 类接受蓝图名称、基础模块名称（通常设置为 `__name__`，类似于 Flask 应用实例）以及一些可选参数，在本例中我不需要这些参数。在蓝图对象创建之后，我导入 *handlers.py* 模块，以便其中的错误处理程序注册到蓝图中。此导入在底部以避免循环依赖。

在 *handlers.py* 模块中，我不再使用 `@app.errorhandler` 装饰器将错误处理程序附加到应用，而是使用蓝图的 `@bp.app_errorhandler` 装饰器。虽然两个装饰器达到的最终结果相同，但其理念是尽量使蓝图独立于应用，以便更具可移植性。我还需要修改两个错误模板的路径，以考虑它们被移动到的新的 *errors* 子目录。

完成错误处理程序重构的最后一步是将蓝图注册到应用中：

*app/__init__.py*：将错误蓝图注册到应用中。

```
app = Flask(__name__)

# ...

from app.errors import bp as errors_bp
app.register_blueprint(errors_bp)

# ...

from app import routes, models  # <-- 从此导入中移除 errors！

```

注册蓝图时，使用 Flask 应用实例的 `register_blueprint()` 方法。当蓝图被注册时，任何视图函数、模板、静态文件、错误处理程序等都会被连接到应用。我将蓝图导入放在 `app.register_blueprint()` 的正上方以避免循环依赖。

### 认证蓝图

将应用的认证功能重构为蓝图的过程与错误处理程序相当类似。以下是重构后蓝图的图示：

```
app/
    auth/                               <-- 蓝图包
        __init__.py                     <-- 蓝图创建
        email.py                        <-- 认证邮件
        forms.py                        <-- 认证表单
        routes.py                       <-- 认证路由
    templates/
        auth/                           <-- 蓝图模板
            login.html
            register.html
            reset_password_request.html
            reset_password.html
    __init__.py                         <-- 蓝图注册

```

为了创建这个蓝图，我不得不将所有与认证相关的功能移动到在蓝图中创建的新模块中。这包括几个视图函数、Web 表单以及支持函数（如通过邮件发送密码重置令牌的函数）。我还将模板移动到一个子目录中，以便与应用的其余部分分开，就像对错误页面所做的那样。

在蓝图中定义路由时，使用 `@bp.route` 装饰器而不是 `@app.route`。在 `url_for()` 中构建 URL 时，语法也需要更改。对于直接附加到应用的常规视图函数，`url_for()` 的第一个参数是视图函数名称。当路由在蓝图中定义时，此参数必须包含蓝图名称和视图函数名称，以句点分隔。例如，我必须将所有 `url_for('login')` 替换为 `url_for('auth.login')`，其余视图函数也类似。

要将 `auth` 蓝图注册到应用中，我使用了一种略有不同的格式：

*app/__init__.py*：将认证蓝图注册到应用中。

```
# ...
from app.auth import bp as auth_bp
app.register_blueprint(auth_bp, url_prefix='/auth')
# ...

```

`register_blueprint()` 调用在这里有一个额外的参数 `url_prefix`。这完全是可选的，但 Flask 允许你在 URL 前缀下附加蓝图，因此蓝图中定义的所有路由都会在其 URL 中获得此前缀。在许多情况下，这作为一种"命名空间"很有用，使蓝图中所有路由与应用或其他蓝图中的路由分开。对于认证，我认为让所有路由以 */auth* 开头很好，所以添加了前缀。现在登录 URL 将是 *http://localhost:5000/auth/login*。因为我使用 `url_for()` 生成 URL，所有 URL 都会自动包含此前缀。

### 主应用蓝图

第三个蓝图包含核心应用逻辑。重构这个蓝图的过程与我用于前两个蓝图的过程相同。我将这个蓝图命名为 `main`，因此所有引用视图函数的 `url_for()` 调用都必须加上 `main.` 前缀。鉴于这是应用的核心功能，我决定将模板保留在相同的位置。这不是问题，因为我已经将其他两个蓝图的模板移动到了子目录中。

## 应用工厂模式

正如我在本章引言中所提到的，将应用作为全局变量会带来一些复杂问题，主要是对某些测试场景的限制。在引入蓝图之前，应用必须是全局变量，因为所有视图函数和错误处理程序都需要使用来自 `app` 的装饰器（如 `@app.route`）。但现在所有路由和错误处理程序都已移至蓝图，保留应用全局变量的理由就少了很多。

所以我将添加一个名为 `create_app()` 的函数来构造 Flask 应用实例，并消除全局变量。这个转换并不简单，我必须解决一些复杂问题，但让我们先看一下应用工厂函数：

*app/__init__.py*：应用工厂函数。

```
# ...
db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'auth.login'
login.login_message = _l('Please log in to access this page.')
mail = Mail()
moment = Moment()
babel = Babel()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    mail.init_app(app)
    moment.init_app(app)
    babel.init_app(app)

    # ... 蓝图注册无变化

    if not app.debug and not app.testing:
        # ... 日志设置无变化

    return app

```

你已经看到，大多数 Flask 扩展通过创建扩展实例并将应用作为参数传递来初始化。当应用不作为全局变量存在时，有一种替代模式，扩展在两个阶段初始化。扩展实例首先像以前一样在全局作用域中创建，但不传递任何参数。这会创建一个未附加到应用的扩展实例。在工厂函数中创建应用实例时，必须在扩展实例上调用 `init_app()` 方法，以将其绑定到当前已知的应用。

初始化期间执行的其他任务保持不变，但已移至工厂函数而不是全局作用域。这包括蓝图的注册和日志记录配置。请注意，我添加了一个 `not app.testing` 子句到决定是否启用邮件和文件日志记录的条件中，以便在单元测试期间跳过所有这些日志记录。当运行单元测试时，`app.testing` 标志将为 `True`，因为配置中 `TESTING` 变量被设置为 `True`。

那么谁来调用应用工厂函数呢？显而易见的使用地点是顶层的 *microblog.py* 脚本，这是应用中唯一现在在全局作用域中存在应用的模块。另一个地方是 *tests.py*，我将在下一节中更详细地讨论单元测试。

正如我上面提到的，随着蓝图的引入，大多数对 `app` 的引用都消失了，但代码中仍然存在一些需要我处理的引用。例如，*app/models.py*、*app/translate.py* 和 *app/main/routes.py* 模块都引用了 `app.config`。幸运的是，Flask 开发者试图让视图函数更容易地访问应用实例，而不必像我一直做的那样导入它。Flask 提供的 `current_app` 变量是一个特殊的"上下文"变量，Flask 在分发请求之前用应用实例初始化它。你之前已经见过另一个上下文变量——我在其中存储当前语言环境的 `g` 变量。这两个变量，以及 Flask-Login 的 `current_user` 和其他一些你尚未见过的变量，都有点"神奇"，它们像全局变量一样工作，但只能在处理请求期间以及处理该请求的线程中访问。

用 Flask 的 `current_app` 变量替换 `app` 消除了将应用实例作为全局变量导入的需要。通过简单的搜索和替换，我能够将所有对 `app.config` 的引用替换为 `current_app.config`。

*app/email.py* 模块带来了更大的挑战，所以我不得不使用一个小技巧：

*app/email.py*：将应用实例传递给另一个线程。

```
from flask import current_app

def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

def send_email(subject, sender, recipients, text_body, html_body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    Thread(target=send_async_email,
           args=(current_app._get_current_object(), msg)).start()

```

在 `send_email()` 函数中，应用实例作为参数传递给后台线程，该线程将发送邮件而不会阻塞主应用。在作为后台线程运行的 `send_async_email()` 函数中直接使用 `current_app` 是行不通的，因为 `current_app` 是一个上下文感知变量，与处理客户端请求的线程绑定。在不同的线程中，`current_app` 不会有赋值。直接将 `current_app` 作为参数传递给线程对象也行不通，因为 `current_app` 实际上是一个*代理对象*，它会动态映射到应用实例。所以传递代理对象与在线程中直接使用 `current_app` 是一样的。我需要做的是访问存储在代理对象中的实际应用实例，并将其作为 `app` 参数传递。`current_app._get_current_object()` 表达式从代理对象内部提取实际的应用实例，这就是我作为参数传递给线程的内容。

另一个棘手的模块是 *app/cli.py*，它实现了一些用于管理语言翻译的快捷命令，并使用 `@app.cli.group()` 装饰器。在这种情况下，用 `current_app` 替换 `app` 是行不通的，因为这些命令在启动时注册，而不是在处理请求期间，而 `current_app` 只能在请求处理期间使用。为了消除此模块中对 `app` 的引用，我创建了另一个蓝图：

*app/cli.py*：自定义应用命令的蓝图。

```
import os
from flask import Blueprint
import click

bp = Blueprint('cli', __name__, cli_group=None)

@bp.cli.group()
def translate():
    """翻译和本地化命令。"""
    pass

@translate.command()
@click.argument('lang')
def init(lang):
    """初始化新语言。"""
    # ...

@translate.command()
def update():
    """更新所有语言。"""
    # ...

@translate.command()
def compile():
    """编译所有语言。"""
    # ...

```

默认情况下，Flask 将附加到蓝图的命令放在以蓝图名称为名的组下。这会导致这些命令以 `flask cli translate ...` 的形式可用。为了避免额外的 `cli` 组，在创建蓝图时传递了 `cli_group=None`。

然后我在应用工厂函数中注册这个 `cli` 蓝图：

*app/__init__.py*：应用工厂函数。

```
# ...

def create_app(config_class=Config):
    # ...
    from app.cli import bp as cli_bp
    app.register_blueprint(cli_bp)
    # ...

    return app

```

## 单元测试改进

正如我在本章开头暗示的那样，到目前为止我所做的很多工作都是为了改进单元测试工作流程。在运行单元测试时，你需要确保应用的配置方式不会干扰你的开发资源（如数据库）。

当前版本的 *tests.py* 采用在配置已应用于应用实例后修改配置的技巧，这是一种危险的做法，因为并非所有类型的更改在那么晚的阶段都能生效。我想要的是在配置被添加到应用之前就指定我的测试配置。

`create_app()` 函数现在接受一个配置类作为参数。默认情况下使用在 *config.py* 中定义的 `Config` 类，但我现在可以通过向工厂函数传递一个新类来创建使用不同配置的应用实例。以下是一个适用于单元测试的示例配置类：

*tests.py*：测试配置。

```
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite://'

```

我在这里所做的是创建应用的 `Config` 类的子类，并覆盖 SQLAlchemy 配置以使用内存中的 SQLite 数据库。我还添加了一个设置为 `True` 的 `TESTING` 属性，这在应用需要确定它是否在单元测试下运行时非常有用。

如果你还记得，我的单元测试依赖于 `setUp()` 和 `tearDown()` 方法，这些方法由单元测试框架自动调用，用于创建和销毁适合每个测试运行的环境。我现在可以使用这两个方法为每个测试创建和销毁一个全新的应用：

*tests.py*：为每个测试创建应用。

```
class UserModelCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

```

新的应用将存储在 `self.app` 中，并且像以前一样，将从它创建一个应用上下文，但这到底是什么呢？

还记得 `current_app` 变量吗？当没有全局应用可以导入时，它不知何故充当了应用的代理？这个变量知道应用实例，因为它会在当前线程中查找被推送的应用上下文。如果找到了一个，它就从那里获取应用实例。如果没有上下文，那就无法知道哪个应用是活动的，因此 `current_app` 会引发异常。下面是在 Python 控制台中如何工作的演示。这需要通过运行 `python` 启动的控制台，因为 `flask shell` 命令为了方便会自动激活应用上下文。

```
>>> from flask import current_app
>>> current_app.config['SQLALCHEMY_DATABASE_URI']
Traceback (most recent call last):
    ...
RuntimeError: Working outside of application context.

>>> from app import create_app
>>> app = create_app()
>>> app.app_context().push()
>>> current_app.config['SQLALCHEMY_DATABASE_URI']
'sqlite:////home/miguel/microblog/app.db'

```

这就是秘密！在调用你的视图函数之前，Flask 会推送一个应用上下文，从而激活 `current_app` 和 `g`。当请求完成时，上下文连同这些变量一起被移除。为了使 `db.create_all()` 调用在 `setUp()` 方法中正常工作，必须为应用实例推送一个应用上下文，这样 `db.create_all()` 就可以使用 `current_app.config` 来知道数据库的位置。然后在 `tearDown()` 方法中，我弹出上下文以将所有内容重置为干净状态。

你还应该知道，应用上下文是 Flask 使用的两种上下文之一。还有一种*请求上下文*，它更具体，因为它适用于一个请求。当在请求处理之前激活请求上下文时，Flask 的 `request` 和 `session` 变量以及 Flask-Login 的 `current_user` 将变为可用。

## 环境变量

正如你在构建这个应用时所看到的，有许多配置选项依赖于在启动服务器之前在环境中设置变量。这包括你的密钥、邮件服务器信息、数据库 URL 和 Microsoft Translator API 密钥。你可能会同意我的看法，这很不方便，因为每次打开新的终端会话时都需要重新设置这些变量。

对于依赖大量环境变量的应用，一种常见的模式是将它们存储在应用根目录的 *.env* 文件中。应用在启动时导入此文件中的变量，这样就不需要你手动设置所有这些变量了。

有一个支持 *.env* 文件的 Python 包叫做 `python-dotenv`，它已经安装了，因为我之前使用过 *.flaskenv* 文件。虽然 *.env* 和 *.flaskenv* 文件类似，但 Flask 期望 Flask 自己的配置变量放在 *.flaskenv* 中，而应用配置变量（包括一些敏感性质的变量）放在 *.env* 中。*.flaskenv* 文件可以添加到版本控制中，因为它不包含任何密钥或密码。*.env* 文件不应添加到版本控制中，以确保你的密钥得到保护。

`flask` 命令会自动将 *.flaskenv* 和 *.env* 文件中定义的任何变量导入到环境中。这对 *.flaskenv* 文件来说已经足够了，因为其内容仅在通过 `flask` 命令运行应用时才需要。然而，*.env* 文件在应用的生产部署中也会被使用，而生产部署不会使用 `flask` 命令。因此，显式导入 *.env* 文件的内容是一个好主意。

由于 *config.py* 模块是我读取所有环境变量的地方，我将在创建 `Config` 类之前导入 *.env* 文件，这样变量在类构造时就已经设置好了：

*config.py*：导入包含环境变量的 .env 文件。

```
import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # ...

```

所以现在你可以创建一个包含应用所需所有环境变量的 *.env* 文件。重要的是，不要将 *.env* 文件添加到版本控制中。你不想让包含密码和其他敏感信息的文件包含在源代码仓库中。

*.env* 文件可以用于所有配置时的变量，但不能用于 Flask 的 `FLASK_APP` 和 `FLASK_DEBUG` 环境变量，因为它们在应用引导过程非常早期的阶段就需要，此时应用实例及其配置对象尚不存在。

以下示例展示了一个 *.env* 文件，其中定义了一个密钥，配置邮件通过本地运行的邮件服务器在端口 8025 发送且无需认证，设置了 Microsoft Translator API 密钥，并让数据库配置使用默认值：

```
SECRET_KEY=a-really-long-and-unique-key-that-nobody-knows
MAIL_SERVER=localhost
MAIL_PORT=8025
MS_TRANSLATOR_KEY=<your-translator-key-here>

```

## 依赖文件

到目前为止，我已在 Python 虚拟环境中安装了相当多的包。如果你需要在另一台机器上重新生成环境，你将很难记住需要安装哪些包，因此普遍接受的做法是在项目的根文件夹中编写一个 *requirements.txt* 文件，列出所有依赖及其版本。生成这个列表实际上很简单：

```
(venv) $ pip freeze > requirements.txt

```

`pip freeze` 命令将以 *requirements.txt* 文件所需的正确格式转储虚拟环境中安装的所有包。现在，如果你需要在另一台机器上创建相同的虚拟环境，你可以运行以下命令，而不是逐个安装包：

```
(venv) $ pip install -r requirements.txt

```

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
