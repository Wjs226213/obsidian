# 第三部分：Web 表单

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-iii-web-forms](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-iii-web-forms) | Flask Mega-Tutorial 作者 Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第三部分，我将告诉您如何使用*Web 表单*。

您正在阅读的是 2024 版的 Flask Mega-Tutorial。本课程完整版也可以在亚马逊上以电子书和平装本的形式订购。感谢您的支持！

如果您正在寻找 2018 版的课程，可以在此处找到。

作为参考，以下是本系列文章的完整列表：

- 第 1 章：Hello, World!

- 第 2 章：模板

- 第 3 章：Web 表单（本文）

- 第 4 章：数据库

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

在第 2 章中，我为应用程序的主页创建了一个简单的模板，并使用模拟对象作为我还未拥有的内容的占位符，比如用户和博客帖子。在本章中，我将解决这个应用程序中仍然存在的许多空白之一，具体来说是如何通过 Web 表单接受用户的输入。

Web 表单是任何 Web 应用程序中最基本的构建块之一。我将使用表单来允许用户提交博客帖子，以及用于登录应用程序。

在继续本章之前，请确保您已经安装了上一章留下的 *microblog* 应用程序，并且可以正常运行而没有任何错误。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## Flask-WTF 简介

为了处理此应用程序中的 Web 表单，我将使用 Flask-WTF 扩展，它是 WTForms 包的一个轻量级包装器，很好地将其与 Flask 集成。这是我向您介绍的第一个 Flask 扩展，但它不会是最后一个。扩展是 Flask 生态系统中非常重要的一部分，因为它们为 Flask 有意不涉及的问题提供了解决方案。

Flask 扩展是常规的 Python 包，可以使用 `pip` 安装。您现在就可以在虚拟环境中安装 Flask-WTF：

```
(venv) $ pip install flask-wtf

```

到目前为止，应用程序非常简单，因此我不需要担心其*配置*。但对于除了最简单应用之外的所有应用程序，您会发现 Flask（以及您可能使用的 Flask 扩展）在如何做事方面提供了一定的自由度，您需要做出一些决定，并将其作为配置变量列表传递给框架。

有几种格式可供应用程序指定配置选项。最基本的解决方案是将变量定义为 `app.config` 中的键，它使用字典风格来处理变量。例如，您可以这样做：

```
app = Flask(__name__)
app.config'SECRET_KEY' = 'you-will-never-guess'
# ... 根据需要在此添加更多变量

```

虽然上述语法足以创建 Flask 的配置选项，但我喜欢贯彻*关注点分离*的原则，因此我不会将配置放在创建应用程序的同一个地方，而是使用一个稍微更复杂的结构，允许我将配置保存在一个单独的文件中。

我特别喜欢的一个解决方案是使用 Python 类来存储配置变量，因为它非常易于扩展。为了保持条理清晰，我将在一个单独的 Python 模块中创建配置类。下面您可以看到此应用程序的新配置类，存储在主目录的 *config.py* 模块中。

*config.py*：密钥配置

```
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'

```

很简单，对吧？配置设置定义为 `Config` 类中的类变量。随着应用程序需要更多的配置项，可以将它们添加到此类中，以后如果我发现需要多个配置集，可以创建它的子类。不过现在先不用担心这个。

我添加的 `SECRET_KEY` 配置变量是大多数 Flask 应用程序中的一个重要部分。Flask 及其一些扩展使用密钥的值作为加密密钥，用于生成签名或令牌。Flask-WTF 扩展使用它来保护 Web 表单免受一种称为跨站请求伪造（Cross-Site Request Forgery 或 CSRF，发音为"sea-surf"）的恶意攻击。顾名思义，密钥应该是秘密的，因为用它生成的令牌和签名的强度取决于应用程序的受信任维护者之外的人不知道它。

密钥的值被设置为一个包含两个项的表达式，由 `or` 运算符连接。第一项查找环境变量的值，也叫做 `SECRET_KEY`。第二项只是一个硬编码的字符串。这是您将经常看到我用于配置变量的模式。其思想是，优先使用来自环境变量的值，但如果环境没有定义该变量，则使用硬编码字符串作为默认值。在开发此应用程序时，安全要求较低，因此您可以忽略此设置，使用硬编码字符串。但当此应用程序部署到生产服务器时，我将在环境中设置一个唯一且难以猜测的值，以便服务器拥有一个其他人不知道的安全密钥。

现在我有了配置文件，需要告诉 Flask 读取并应用它。这可以在 Flask 应用程序实例创建后立即使用 `app.config.from_object()` 方法完成：

*app/__init__.py*：Flask 配置

```
from flask import Flask
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

from app import routes

```

我导入 `Config` 类的方式起初可能看起来令人困惑，但如果您看一下如何从 `flask` 包（小写"f"）导入 `Flask` 类（大写"F"），您会注意到我对配置做了同样的事情。小写的"config"是 Python 模块 *config.py* 的名称，而大写的"C"显然是实际的类。

正如我上面提到的，配置项可以通过字典语法从 `app.config` 访问。以下是一个快速的 Python 解释器会话，我检查了密钥的值：

```
>>> from microblog import app
>>> app.config'SECRET_KEY'
'you-will-never-guess'

```

## 用户登录表单

Flask-WTF 扩展使用 Python 类来表示 Web 表单。一个表单类简单地将表单的字段定义为类变量。

再次考虑到关注点分离，我将使用一个新的 *app/forms.py* 模块来存储我的 Web 表单类。首先，让我们定义一个用户登录表单，它要求用户输入用户名和密码。该表单还将包含一个"记住我"复选框和一个提交按钮：

*app/forms.py*：登录表单

```
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired

class LoginForm(FlaskForm):
    username = StringField('Username', validators=DataRequired())
    password = PasswordField('Password', validators=DataRequired())
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

```

大多数 Flask 扩展在其顶级导入符号中使用 `flask_<name>` 的命名约定。在这种情况下，Flask-WTF 的所有符号都在 `flask_wtf` 下。这就是在 *app/forms.py* 顶部导入 `FlaskForm` 基类的地方。

我为此表单使用的表示字段类型的四个类直接从 WTForms 包导入，因为 Flask-WTF 扩展不提供自定义版本。每个字段都作为 `LoginForm` 类中的类变量创建一个对象。每个字段都以第一个参数的形式给出描述或标签。

您在一些字段中看到的可选 `validators` 参数用于将验证行为附加到字段。`DataRequired` 验证器只是检查该字段是否不是空提交。还有更多可用的验证器，其中一些将在其他表单中使用。

## 表单模板

下一步是将表单添加到 HTML 模板中，以便可以在网页上渲染。好消息是，`LoginForm` 类中定义的字段知道如何将自己渲染为 HTML，因此这个任务相当简单。下面您可以看到登录模板，我将把它存储在文件 *app/templates/login.html* 中：

*app/templates/login.html*：登录表单模板

```
{% extends "base.html" %}

{% block content %}
    <h1>Sign In</h1>
    <form action="" method="post" novalidate>
        {{ form.hidden_tag() }}
        <p>
            {{ form.username.label }}<br>
            {{ form.username(size=32) }}
        </p>
        <p>
            {{ form.password.label }}<br>
            {{ form.password(size=32) }}
        </p>
        <p>{{ form.remember_me() }} {{ form.remember_me.label }}</p>
        <p>{{ form.submit() }}</p>
    </form>
{% endblock %}

```

对于此模板，我通过 `extends` 模板继承语句重用了第 2 章中展示的 `base.html` 模板。实际上，我将对所有模板都这样做，以确保在应用程序的所有页面中保持一致的布局，包括顶部导航栏。

此模板期望一个从 `LoginForm` 类实例化的表单对象作为参数传入，您可以看到它被引用为 `form`。此参数将由登录视图函数发送，我还没有编写该函数。

HTML `<form>` 元素用作 Web 表单的容器。表单的 `action` 属性用于告诉浏览器在提交用户在表单中输入的信息时应使用的 URL。当 action 设置为空字符串时，表单提交到当前地址栏中的 URL，即渲染表单的页面 URL。`method` 属性指定将表单提交到服务器时应使用的 HTTP 请求方法。默认是通过 `GET` 请求发送，但几乎在所有情况下，使用 `POST` 请求可以提供更好的用户体验，因为此类请求可以在请求正文中提交表单数据，而 `GET` 请求将表单字段添加到 URL，使浏览器地址栏变得杂乱。`novalidate` 属性用于告诉 Web 浏览器不对表单中的字段应用验证，从而将此任务留给运行在服务器上的 Flask 应用程序。使用 `novalidate` 完全是可选的，但对于第一个表单，设置它很重要，因为这将允许您在本章后面测试服务器端验证。

`form.hidden_tag()` 模板参数生成一个隐藏字段，其中包含用于保护表单免受 CSRF 攻击的令牌。要使表单受到保护，您需要做的就是包含此隐藏字段，并在 Flask 配置中定义了 `SECRET_KEY` 变量。如果您处理好了这两件事，Flask-WTF 会为您完成其余工作。

如果您以前编写过 HTML Web 表单，您可能会发现此模板中没有 HTML 字段，这很奇怪。这是因为表单对象中的字段知道如何将自己渲染为 HTML。我所需要做的就是在需要字段标签的地方包含 `{{ form.<field_name>.label }}`，在需要字段的地方包含 `{{ form.<field_name>() }}`。对于需要额外 HTML 属性的字段，这些可以作为参数传递。此模板中的用户名和密码字段将 `size` 作为参数，该参数将作为属性添加到 HTML `<input>` 元素中。这也是您可以将 CSS 类或 ID 附加到表单字段的方式。

## 表单视图

在浏览器中看到此表单之前的最后一步是在应用程序中编写一个新的视图函数，用于渲染上一节的模板。

那么让我们编写一个新的视图函数，映射到 */login* URL，该函数创建一个表单，并将其传递给模板进行渲染。这个视图函数也可以放在 *app/routes.py* 模块中，与之前的那个一起：

*app/routes.py*：登录视图函数

```
from flask import render_template
from app import app
from app.forms import LoginForm

# ...

@app.route('/login')
def login():
    form = LoginForm()
    return render_template('login.html', title='Sign In', form=form)

```

我这里做的是从 *forms.py* 导入 `LoginForm` 类，从中实例化一个对象，并将其传递给模板。`form=form` 语法可能看起来有些奇怪，但这只是将上面一行创建（右侧）的 `form` 对象以名称 `form`（左侧）传递给模板。这就是让表单字段被渲染所需的全部操作。

为了便于访问登录表单，基础模板可以扩展 *base.html* 中的 `<div>` 元素，在导航栏中包含一个登录链接：

*app/templates/base.html*：导航栏中的登录链接

```
<div>
    Microblog:
    <a href="/index">Home</a>
    <a href="/login">Login</a>
</div>

```

此时，您可以运行应用程序并在 Web 浏览器中查看表单。在应用程序运行时，在浏览器的地址栏中输入 `http://localhost:5000/`，然后点击顶部导航栏中的"Login"链接来查看新的登录表单。很酷，对吧？

## 接收表单数据

如果您尝试按下提交按钮，浏览器将显示"Method Not Allowed"错误。这是因为上一节的登录视图函数目前只完成了一半的工作。它可以在网页上显示表单，但还没有处理用户提交的数据的逻辑。这是 Flask-WTF 让工作变得非常简单的另一个领域。以下是接受并验证用户提交的数据的视图函数更新版本：

*app/routes.py*：接收登录凭据

```
from flask import render_template, flash, redirect

@app.route('/login', methods='GET', 'POST')
def login():
    form = LoginForm()
    if form.validate_on_submit():
        flash('Login requested for user {}, remember_me={}'.format(
            form.username.data, form.remember_me.data))
        return redirect('/index')
    return render_template('login.html', title='Sign In', form=form)

```

这个版本中的第一个新内容是路由装饰器中的 `methods` 参数。这告诉 Flask 此视图函数接受 `GET` 和 `POST` 请求，覆盖了默认的只接受 `GET` 请求。HTTP 协议规定 `GET` 请求是向客户端（这里指 Web 浏览器）返回信息的请求。到目前为止，应用程序中的所有请求都是这种类型。`POST` 请求通常用于浏览器向服务器提交表单数据（实际上 `GET` 请求也可以用于此目的，但不是推荐的做法）。浏览器之前显示的"Method Not Allowed"错误，是因为浏览器试图发送 `POST` 请求，而应用程序没有配置接受它。通过提供 `methods` 参数，您告诉 Flask 应该接受哪些请求方法。

`form.validate_on_submit()` 方法完成了所有表单处理工作。当浏览器发送 `GET` 请求来接收带有表单的网页时，此方法将返回 `False`，因此在这种情况下，函数跳过 if 语句，直接进入函数的最后一行渲染模板。

当浏览器因用户按下提交按钮而发送 `POST` 请求时，`form.validate_on_submit()` 将收集所有数据，运行所有附加到字段的验证器，如果一切正常，它将返回 `True`，表示数据有效，可以由应用程序处理。但如果至少有一个字段验证失败，则函数将返回 `False`，这将导致表单重新渲染给用户，就像 `GET` 请求的情况一样。稍后我将在验证失败时添加错误消息。

当 `form.validate_on_submit()` 返回 `True` 时，登录视图函数调用两个从 Flask 导入的新函数。`flash()` 函数是向用户显示消息的有用方式。许多应用程序使用这种技术来让用户知道某个操作是否成功。在这种情况下，我将使用这种机制作为临时解决方案，因为我还没有真正登录用户所需的所有基础设施。我现在能做的最好就是显示一条消息，确认应用程序收到了凭据。

登录视图函数中使用的第二个新函数是 `redirect()`。此函数指示客户端 Web 浏览器自动导航到作为参数给出的不同页面。此视图函数使用它将用户重定向到应用程序的索引页面。

当您调用 `flash()` 函数时，Flask 会存储该消息，但闪现的消息不会神奇地出现在网页中。应用程序的模板需要以适合网站布局的方式渲染这些闪现消息。我将把这些消息添加到基础模板中，以便所有模板都继承此功能。这是更新后的基础模板：

*app/templates/base.html*：基础模板中的闪现消息

```
<html>
    <head>
        {% if title %}
        <title>{{ title }} - microblog</title>
        {% else %}
        <title>microblog</title>
        {% endif %}
    </head>
    <body>
        <div>
            Microblog:
            <a href="/index">Home</a>
            <a href="/login">Login</a>
        </div>
        <hr>
        {% with messages = get_flashed_messages() %}
        {% if messages %}
        <ul>
            {% for message in messages %}
            <li>{{ message }}</li>
            {% endfor %}
        </ul>
        {% endif %}
        {% endwith %}
        {% block content %}{% endblock %}
    </body>
</html>

```

这里我使用了 `with` 结构，将调用 `get_flashed_messages()` 的结果赋值给 `messages` 变量，所有这些都在模板的上下文中进行。`get_flashed_messages()` 函数来自 Flask，它返回之前使用 `flash()` 注册的所有消息的列表。接下来的条件检查 `messages` 是否有内容，如果有，则渲染一个包含每条消息作为 `<li>` 列表项的 `<ul>` 元素。这种渲染风格对于状态消息来说看起来不太好，但 Web 应用程序的样式设计将在后面讨论。

这些闪现消息的一个有趣特性是，一旦通过 `get_flashed_messages` 函数请求它们一次，它们就会从消息列表中删除，因此它们只会在 `flash()` 函数被调用后出现一次。

现在是再次尝试应用程序并测试表单工作方式的好时机。确保您尝试提交用户名或密码字段为空的表单，以查看 `DataRequired` 验证器如何阻止提交过程。

## 改进字段验证

附加到表单字段的验证器可防止无效数据被接受到应用程序中。应用程序处理无效表单输入的方式是重新显示表单，让用户进行必要的更正。

如果您尝试提交无效数据，我相信您已经注意到，虽然验证机制工作正常，但没有给用户任何关于表单有问题的指示，用户只是重新看到表单。下一个任务是通过在每个验证失败的字段旁边添加有意义的错误消息来改善用户体验。

实际上，表单验证器已经生成了这些描述性错误消息，所以缺少的只是在模板中添加一些额外的逻辑来渲染它们。

以下是在用户名和密码字段中添加了字段验证消息的登录模板：

*app/templates/login.html*：登录表单模板中的验证错误

```
{% extends "base.html" %}

{% block content %}
    <h1>Sign In</h1>
    <form action="" method="post" novalidate>
        {{ form.hidden_tag() }}
        <p>
            {{ form.username.label }}<br>
            {{ form.username(size=32) }}<br>
            {% for error in form.username.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>
            {{ form.password.label }}<br>
            {{ form.password(size=32) }}<br>
            {% for error in form.password.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>{{ form.remember_me() }} {{ form.remember_me.label }}</p>
        <p>{{ form.submit() }}</p>
    </form>
{% endblock %}

```

我所做的唯一更改是在用户名和密码字段之后添加了 for 循环，以红色渲染验证器添加的错误消息。作为一般规则，任何附加了验证器的字段，验证产生的任何错误消息都将添加到 `form.<field_name>.errors` 下。这将是一个列表，因为字段可以附加多个验证器，并且可能不止一个提供要显示给用户的错误消息。

如果您尝试提交空用户名或密码的表单，您现在将看到漂亮的红色错误消息。

## 生成链接

登录表单现在已经相当完整了，但在结束本章之前，我想讨论在模板和重定向中包含链接的正确方式。到目前为止，您已经看到了一些定义链接的实例。例如，这是基础模板中的当前导航栏：

```
    <div>
        Microblog:
        <a href="/index">Home</a>
        <a href="/login">Login</a>
    </div>

```

登录视图函数也定义了一个传递给 `redirect()` 函数的链接：

```
@app.route('/login', methods='GET', 'POST')
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # ...
        return redirect('/index')
    # ...

```

直接在模板和源文件中编写链接的一个问题是，如果有一天您决定重新组织链接，那么您将不得不在整个应用程序中搜索并替换这些链接。

为了更好地控制这些链接，Flask 提供了一个名为 `url_for()` 的函数，它使用 Flask 内部 URL 到视图函数的映射来生成 URL。例如，表达式 `url_for('login')` 返回 `/login`，`url_for('index')` 返回 `/index`。`url_for()` 的参数是*端点*名称，即视图函数的名称。

您可能会问，为什么使用函数名比使用 URL 更好？事实是，URL 比视图函数名称更可能发生变化，而视图函数名称完全是内部的。第二个原因是，正如您稍后将学到的，一些 URL 包含动态组件，因此手动生成这些 URL 需要连接多个元素，既繁琐又容易出错。`url_for()` 函数还可以以更优雅的语法生成这些复杂的 URL。

所以从现在开始，每当我需要生成应用程序 URL 时，我将使用 `url_for()`。基础模板中的导航栏变为：

*app/templates/base.html*：使用 url_for() 函数生成链接

```
        <div>
            Microblog:
            <a href="{{ url_for('index') }}">Home</a>
            <a href="{{ url_for('login') }}">Login</a>
        </div>

```

这是更新后的 `login()` 视图函数：

*app/routes.py*：使用 url_for() 函数生成链接

```
from flask import render_template, flash, redirect, url_for

# ...

@app.route('/login', methods='GET', 'POST')
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # ...
        return redirect(url_for('index'))
    # ...

```

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
