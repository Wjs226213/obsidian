# Part 7: 错误处理

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vii-error-handling](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vii-error-handling) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第七部分，我将告诉你如何在 Flask 应用程序中进行错误处理。

你正在阅读 2024 版的 Flask Mega-Tutorial。完整的课程也可以从亚马逊以电子书和平装书的形式订购。感谢你的支持！

如果你正在寻找该课程 2018 版，可以在这里找到。

作为参考，以下是本系列文章的完整列表：

- Chapter 1: Hello, World!

- Chapter 2: Templates

- Chapter 3: Web Forms

- Chapter 4: Database

- Chapter 5: User Logins

- Chapter 6: Profile Page and Avatars

- Chapter 7: Error Handling（本文）

- Chapter 8: Followers

- Chapter 9: Pagination

- Chapter 10: Email Support

- Chapter 11: Facelift

- Chapter 12: Dates and Times

- Chapter 13: I18n and L10n

- Chapter 14: Ajax

- Chapter 15: A Better Application Structure

- Chapter 16: Full-Text Search

- Chapter 17: Deployment on Linux

- Chapter 18: Deployment on Heroku

- Chapter 19: Deployment on Docker Containers

- Chapter 20: Some JavaScript Magic

- Chapter 21: User Notifications

- Chapter 22: Background Jobs

- Chapter 23: Application Programming Interfaces (APIs)

在本章中，我将暂缓为我的微博应用程序编写新功能，而是讨论几种处理错误的策略——错误在每个软件项目中都不可避免。为了帮助说明这个主题，我故意在第六章添加的代码中引入了一个错误。在你继续阅读之前，看看你是否能找到它！

*本章的 GitHub 链接: Browse, Zip, Diff.*

## Flask 中的错误处理

当 Flask 应用程序发生错误时会发生什么？最好的方法是亲自体验。启动应用程序，确保你至少注册了两个用户。以一个用户身份登录，打开用户主页并点击 "Edit" 链接。在主页编辑器中，尝试将用户名更改为另一个已注册用户的用户名，然后——砰！这将出现一个看起来很吓人的 "Internal Server Error" 页面。

如果你查看运行应用程序的终端会话，会看到错误的堆栈跟踪。堆栈跟踪在调试错误时非常有用，因为它们显示了调用序列，一直追溯到产生错误的代码行：

```
(2023-04-28 23:59:42,300 ERROR in app: Exception on /edit_profile POST
Traceback (most recent call last):
  File "venv/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1963, in _exec_single_context
    self.dialect.do_execute(
  File "venv/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 918, in do_execute
    cursor.execute(statement, parameters)
sqlite3.IntegrityError: UNIQUE constraint failed: user.username

```

堆栈跟踪帮助你确定 bug 是什么。应用程序允许用户更改用户名，但没有验证新选择的用户名是否与系统中已有用户冲突。错误来自 SQLAlchemy，它试图将新用户名写入数据库，但数据库拒绝了，因为 `username` 列定义了 `unique=True` 选项。

需要注意的是，呈现给用户的错误页面没有提供太多错误信息，这是好事。我绝对不希望用户知道崩溃是由数据库错误引起的，也不希望他们知道我使用的数据库类型或数据库中的表和字段名称。所有这些信息都应该保持内部可见。

但是有一些事情远非理想。我有一个非常丑陋的错误页面，与应用程序的布局不匹配。我还有重要的应用程序堆栈跟踪被转储到终端，我需要持续关注以确保不会错过任何错误。当然，还有一个 bug 需要修复。我将解决所有这些问题，但首先，让我们谈谈 Flask 的 *debug mode*。

## 调试模式

上面你看到的错误处理方式对于运行在生产服务器上的系统来说是很好的。如果出现错误，用户会得到一个模糊的错误页面（尽管我会让这个错误页面更美观），而错误的重要细节会显示在服务器进程输出或日志文件中。

但在开发应用程序时，你可以启用调试模式，在这种模式下，Flask 会直接在浏览器中输出一个非常漂亮的调试器。要激活调试模式，停止应用程序，然后设置以下环境变量：

```
(venv) $ export FLASK_DEBUG=1

```

如果你在 Microsoft Windows 上，记得使用 `set` 而不是 `export`。

设置 `FLASK_DEBUG` 后，重启服务器。终端上的输出会与之前略有不同：

```
(venv) $ flask run
 * Serving Flask app 'microblog.py' (lazy loading)
 * Environment: development
 * Debug mode: on
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 118-204-854

```

现在让应用程序再次崩溃，在浏览器中查看交互式调试器：

调试器允许你展开每个堆栈帧并查看相应的源代码。你还可以在任何帧上打开 Python 提示符并执行任何有效的 Python 表达式，例如检查变量的值。

在生产服务器上运行处于调试模式的 Flask 应用程序是极其危险的。调试器允许用户在服务器上远程执行代码，因此对于想要入侵你的应用程序或服务器的恶意用户而言，这可能是一个意外的礼物。作为额外的安全措施，浏览器中运行的调试器开始时是锁定的，首次使用时会要求输入 PIN 码，你可以在 `flask run` 命令的输出中看到它。

既然我提到了调试模式，我应该提及启用调试模式的第二个重要功能，即 *reloader*（重载器）。这是一个非常有用的开发功能，当源文件被修改时会自动重启应用程序。如果在调试模式下运行 `flask run`，你就可以在应用程序上工作，每次保存文件时，应用程序都会重启以加载新代码。

## 自定义错误页面

Flask 提供了一种机制，让应用程序可以安装自己的错误页面，这样用户就不必看到单调乏味的默认错误页面。作为示例，让我们为 HTTP 错误 404 和 500 定义自定义错误页面，这是最常见的两个错误。定义其他错误的页面也以相同的方式工作。

要声明自定义错误处理器，需要使用 `@errorhandler` 装饰器。我将把错误处理器放在一个新的 *app/errors.py* 模块中。

*app/errors.py*: 自定义错误处理器

```
from flask import render_template
from app import app, db

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

```

错误函数的工作方式与视图函数非常相似。对于这两个错误，我返回各自模板的内容。注意两个函数在模板之后都返回了第二个值，即错误代码编号。对于我迄今为止创建的所有视图函数，我不需要添加第二个返回值，因为默认的 200（成功响应的状态码）就是我想要的。在这种情况下，这些是错误页面，所以我希望响应的状态码反映这一点。

500 错误的处理器可能在数据库错误后被调用，这实际上就是上面用户名重复的情况。为了确保任何失败的数据库会话不会干扰模板触发的数据库访问，我执行了一个会话回滚。这将把会话重置为干净状态。

这是 404 错误的模板：

*app/templates/404.html*: 未找到错误模板

```
{% extends "base.html" %}

{% block content %}
    <h1>File Not Found</h1>
    <p><a href="{{ url_for('index') }}">Back</a></p>
{% endblock %}

```

这是 500 错误的模板：

*app/templates/500.html*: 内部服务器错误模板

```
{% extends "base.html" %}

{% block content %}
    <h1>An unexpected error has occurred</h1>
    <p>The administrator has been notified. Sorry for the inconvenience!</p>
    <p><a href="{{ url_for('index') }}">Back</a></p>
{% endblock %}

```

两个模板都继承自 `base.html` 模板，因此错误页面与应用程序的正常页面具有相同的外观和风格。

为了让这些错误处理器在 Flask 中注册，我需要在应用程序实例创建后导入新的 *app/errors.py* 模块：

*app/__init__.py*: 导入错误处理器

```
# ...

from app import routes, models, errors

```

如果你在终端会话中将 `FLASK_DEBUG` 设置为 0（或删除 `FLASK_DEBUG` 变量），然后再次触发重复用户名错误，你将看到一个稍微友好的错误页面。

## 通过电子邮件发送错误

Flask 提供的默认错误处理的另一个问题是没有通知机制。任何错误的堆栈跟踪都会打印到终端，这意味着需要监控服务器进程的输出才能发现错误。在开发过程中这完全没问题，但一旦应用程序部署到生产服务器上，没有人会去看服务器的输出，因此需要更健壮的解决方案。

我认为采取主动的方式处理错误非常重要。如果应用程序的生产版本发生错误，我希望立即知道。所以我的第一个解决方案是配置 Flask，在发生错误时立即通过电子邮件将错误堆栈跟踪发送给我。

第一步是将电子邮件服务器详细信息添加到配置文件中：

*config.py*: 电子邮件配置

```
class Config:
    # ...
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    ADMINS = ['your-email@example.com']

```

电子邮件的配置变量包括服务器和端口、启用加密连接的布尔标志以及可选的用户名和密码。这五个配置变量来源于它们对应的环境变量。如果环境中没有设置邮件服务器，我将以此作为禁用邮件发送错误通知的标志。邮件服务器端口也可以通过环境变量指定，但如果没有设置，则使用标准端口 25。默认情况下不使用邮件服务器凭据，但可以根据需要提供。`ADMINS` 配置变量是一个邮件地址列表，用于接收错误报告，因此你的电子邮件地址应该在该列表中。

Flask 使用 Python 的 `logging` 包来写入日志，并且这个包已经具备了通过电子邮件发送日志的能力。我只需要在 Flask 的日志记录器对象 `app.logger` 上添加一个 `SMTPHandler` 实例即可：

*app/__init__.py*: 通过电子邮件记录错误

```
import logging
from logging.handlers import SMTPHandler

# ...

if not app.debug:
    if app.config['MAIL_SERVER']:
        auth = None
        if app.config['MAIL_USERNAME'] or app.config['MAIL_PASSWORD']:
            auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        secure = None
        if app.config['MAIL_USE_TLS']:
            secure = ()
        mail_handler = SMTPHandler(
            mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
            fromaddr='no-reply@' + app.config['MAIL_SERVER'],
            toaddrs=app.config['ADMINS'], subject='Microblog Failure',
            credentials=auth, secure=secure)
        mail_handler.setLevel(logging.ERROR)
        app.logger.addHandler(mail_handler)

from app import routes, models, errors

```

正如你所看到的，我仅在应用程序未以调试模式运行时启用电子邮件日志记录器（通过 `app.debug` 为 `True` 判断），并且配置中存在邮件服务器时才启用。

设置电子邮件日志记录器有些繁琐，因为需要处理许多邮件服务器中存在的可选安全选项。但本质上，上面的代码创建了一个 `SMTPHandler` 实例，将其级别设置为仅报告错误而非警告、信息或调试消息，最后将其附加到 Flask 的 `app.logger` 对象上。

测试此功能有两种方法。最简单的方法是用一个 SMTP 调试服务器。这是一个伪造的邮件服务器，它接受邮件但不发送，而是将其打印到控制台。要运行此服务器，打开第二个终端会话，激活虚拟环境，并安装 `aiosmtpd` 包：

```
(venv) $ pip install aiosmtpd

```

然后运行以下命令启动调试邮件服务器：

```
(venv) $ aiosmtpd -n -c aiosmtpd.handlers.Debugging -l localhost:8025

```

这个命令还不会打印任何内容，但会等待客户端连接。让调试 SMTP 服务器保持运行，回到第一个终端并按如下方式配置邮件服务器：

```
export MAIL_SERVER=localhost
export MAIL_PORT=8025

```

如果你在 Microsoft Windows 上，记得使用 `set` 而不是 `export`。确保 `FLASK_DEBUG` 变量设置为 0 或根本不设置，因为应用程序在调试模式下不会发送邮件。运行应用程序，再次触发 SQLAlchemy 错误，看看运行伪造邮件服务器的终端会话如何显示包含完整错误堆栈跟踪的邮件。

这种功能的第二种测试方法是配置一个真实的邮件服务器。下面是使用 Gmail 帐户邮件服务器的配置：

```
export MAIL_SERVER=smtp.googlemail.com
export MAIL_PORT=587
export MAIL_USE_TLS=1
export MAIL_USERNAME=<your-gmail-username>
export MAIL_PASSWORD=<your-gmail-password>

```

如果你使用 Microsoft Windows，记得在上述每个语句中使用 `set` 而不是 `export`。

Gmail 帐户的安全功能可能会阻止应用程序通过它发送电子邮件，除非你明确允许"安全性较低的应用程序"访问你的 Gmail 帐户。你可以在这里阅读相关信息，如果你担心帐户安全，可以创建一个仅用于测试邮件的辅助帐户，或者只临时启用低安全性应用程序进行测试，然后恢复默认设置。

另一种替代方案是使用专用邮件服务，如 SendGrid，它允许免费帐户每天发送最多 100 封电子邮件。

## 记录日志到文件

通过电子邮件接收错误是很好的，但有时这还不够。有些故障情况不会导致 Python 异常，也不是大问题，但它们可能仍然值得保存以用于调试目的。因此，我还将为应用程序维护一个日志文件。

要启用基于文件的日志，需要将另一个处理器（这次是 `RotatingFileHandler` 类型）附加到应用程序日志记录器，类似于邮件处理器的做法。

*app/__init__.py*: 记录日志到文件

```
# ...
from logging.handlers import RotatingFileHandler
import os

# ...

if not app.debug:
    # ...

    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/microblog.log', maxBytes=10240,
                                       backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s in %(pathname)s:%(lineno)d'))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info('Microblog startup')

```

我将日志文件写入名为 `microblog.log` 的文件中，放在 *logs* 目录下，如果该目录不存在则创建。

`RotatingFileHandler` 类很棒，因为它会轮转日志，确保应用程序长时间运行时日志文件不会变得过大。这里我将日志文件的大小限制为 10KB，并保留最后十个日志文件作为备份。

`logging.Formatter` 类为日志消息提供自定义格式。由于这些消息将被写入文件，我希望它们包含尽可能多的信息。所以我使用的格式包括时间戳、日志级别、消息以及日志条目来源的源文件和行号。

为了让日志更有用，我还将应用程序日志记录器和文件日志处理器的日志级别降低到 `INFO` 类别。如果你不熟悉日志类别，它们按严重程度递增的顺序是 `DEBUG`、`INFO`、`WARNING`、`ERROR` 和 `CRITICAL`。

作为日志文件的第一个有趣用途，服务器每次启动时都会写入一行日志。当此应用程序在生产服务器上运行时，这些日志条目将告诉你服务器何时重启过。

## 修复重复用户名 Bug

我使用用户名重复的 bug 已经太久了。既然我已经向你展示了如何准备应用程序来应对这些类型的错误，现在我可以修复它了。

如果你还记得，`RegistrationForm` 已经实现了用户名验证，但编辑表单的需求略有不同。在注册过程中，我需要确保表单中输入的用户名在数据库中不存在。在编辑主页的表单中，我需要做同样的检查，但有一个例外。如果用户保持原始用户名不变，那么验证应该允许通过，因为这个用户名已经分配给了该用户。下面是我如何为这个表单实现用户名验证的：

*app/forms.py*: 编辑主页表单中的用户名验证

```
class EditProfileForm(FlaskForm):
    username = StringField('Username', validators=DataRequired())
    about_me = TextAreaField('About me', validators=Length(min=0, max=140))
    submit = SubmitField('Submit')

    def __init__(self, original_username, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.original_username = original_username

    def validate_username(self, username):
        if username.data != self.original_username:
            user = db.session.scalar(sa.select(User).where(
                User.username == username.data))
            if user is not None:
                raise ValidationError('Please use a different username.')

```

实现代码位于自定义验证方法中，但有一个重载的构造函数接受原始用户名作为参数。该用户名保存为实例变量，并在 `validate_username()` 方法中进行检查。如果表单中输入的用户名与原始用户名相同，则无需检查数据库中的重复项。

要使用这个新的验证方法，我需要在创建表单对象的视图函数中添加原始用户名参数：

*app/routes.py*: 编辑主页表单中的用户名验证

```
@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = EditProfileForm(current_user.username)
    # ...

```

现在 bug 已修复，在大多数情况下编辑主页表单中的重复用户名将被阻止。这不是一个完美的解决方案，因为当两个或多个进程同时访问数据库时可能不起作用。在这种情况下，*竞争条件*可能导致验证通过，但稍后尝试重命名时，数据库已被另一个进程更改，无法重命名用户。这种情况除了拥有大量服务器进程的繁忙应用程序外不太可能发生，所以我暂时不担心这个问题。

现在你可以再次尝试重现该错误，看看新的表单验证方法如何阻止它。

## 永久启用调试模式

Flask 的调试模式非常有用，你可能希望默认开启它。这可以通过将 `FLASK_DEBUG` 环境变量添加到 *.flaskenv* 文件中来实现。

*.flaskenv*: Flask 命令的环境变量

```
FLASK_APP=microblog.py
FLASK_DEBUG=1

```

通过此更改，当你使用 `flask run` 命令启动服务器时，调试模式将被启用。

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
