# 第五部分：用户登录

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-v-user-logins](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-v-user-logins) | Flask Mega-Tutorial 作者 Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第五部分，我将告诉您如何创建用户登录子系统。

您正在阅读的是 2024 版的 Flask Mega-Tutorial。本课程完整版也可以在亚马逊上以电子书和平装本的形式订购。感谢您的支持！

如果您正在寻找 2018 版的课程，可以在此处找到。

作为参考，以下是本系列文章的完整列表：

- 第 1 章：Hello, World!

- 第 2 章：模板

- 第 3 章：Web 表单

- 第 4 章：数据库

- 第 5 章：用户登录（本文）

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

在第 3 章中，您学习了如何创建用户登录表单；在第 4 章中，您学习了如何使用数据库。本章将教您如何结合这两章的主题来创建一个简单的用户登录系统。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## 密码哈希

在第 4 章中，用户模型被添加了一个 `password_hash` 字段，到目前为止尚未使用。该字段的目的是保存用户密码的哈希值，用于验证用户在登录过程中输入的密码。密码哈希是一个复杂的话题，应交由安全专家处理，但有几个易于使用的库以简单的方式实现了所有这些逻辑，可以从应用程序中调用。

实现密码哈希的包之一是 Werkzeug，在您安装 Flask 时可能已经在 pip 的输出中看到过它，因为它是 Flask 的核心依赖之一。由于它是依赖项，Werkzeug 已经安装在您的虚拟环境中。以下 Python shell 会话演示了如何使用此包对密码进行哈希：

```
>>> from werkzeug.security import generate_password_hash
>>> hash = generate_password_hash('foobar')
>>> hash
'scrypt:32768:8:1$DdbIPADqKg2nniws$4ab051ebb6767a...'

```

在此示例中，密码 `foobar` 通过一系列没有已知逆运算的加密操作转换为一个长编码字符串，这意味着获取哈希密码的人将无法使用它来恢复原始密码。作为额外的措施，如果您多次哈希相同的密码，您将得到不同的结果，因为所有哈希密码都会获得不同的加密*盐*，因此无法通过查看哈希来识别两个用户是否拥有相同的密码。

验证过程使用 Werkzeug 的第二个函数完成，如下所示：

```
>>> from werkzeug.security import check_password_hash
>>> check_password_hash(hash, 'foobar')
True
>>> check_password_hash(hash, 'barfoo')
False

```

验证函数接受之前生成的密码哈希和用户在登录时输入的密码。如果用户提供的密码与哈希匹配，则函数返回 `True`，否则返回 `False`。

整个密码哈希逻辑可以作为用户模型中的两个新方法实现：

*app/models.py*：密码哈希和验证

```
from werkzeug.security import generate_password_hash, check_password_hash

# ...

class User(db.Model):
    # ...

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

```

有了这两个方法，用户对象现在能够进行安全的密码验证，而无需存储原始密码。以下是这些新方法的示例用法：

```
>>> u = User(username='susan', email='susan@example.com')
>>> u.set_password('mypassword')
>>> u.check_password('anotherpassword')
False
>>> u.check_password('mypassword')
True

```

## Flask-Login 简介

在本章中，我将向您介绍一个非常流行的 Flask 扩展，叫做 Flask-Login。该扩展管理用户的登录状态，例如用户可以登录到应用程序，然后在不同页面之间导航，而应用程序"记住"用户已登录。它还提供了"记住我"功能，允许用户即使在关闭浏览器窗口后仍保持登录状态。为了做好准备，您可以先在虚拟环境中安装 Flask-Login：

```
(venv) $ pip install flask-login

```

与其他扩展一样，Flask-Login 需要在 *app/__init__.py* 中的应用程序实例之后立即创建并初始化。以下是该扩展的初始化方式：

*app/__init__.py*：Flask-Login 初始化

```
# ...
from flask_login import LoginManager

app = Flask(__name__)
# ...
login = LoginManager(app)

# ...

```

## 为 Flask-Login 准备用户模型

Flask-Login 扩展与应用程序的用户模型协同工作，并期望在其中实现某些属性和方法。这种方法很好，因为只要将这些必需的项添加到模型中，Flask-Login 就没有其他要求了，例如，它可以与基于任何数据库系统的用户模型一起工作。

以下列出了四个必需的项：

- `is_authenticated`：如果用户具有有效凭据则为 `True`，否则为 `False` 的属性。

- `is_active`：如果用户帐户处于活动状态则为 `True`，否则为 `False` 的属性。

- `is_anonymous`：对于普通用户为 `False`，仅对于特殊的匿名用户为 `True` 的属性。

- `get_id()`：返回用户唯一标识符（字符串类型）的方法。

我可以轻松实现这四个项，但由于实现相当通用，Flask-Login 提供了一个名为 `UserMixin` 的 *mixin* 类，其中包含适用于大多数用户模型类的安全实现。以下是如何将 mixin 类添加到模型中：

*app/models.py*：Flask-Login 用户 mixin 类

```
# ...
from flask_login import UserMixin

class User(UserMixin, db.Model):
    # ...

```

## 用户加载函数

Flask-Login 通过将登录用户的唯一标识符存储在 Flask 的*用户会话*中来跟踪登录用户，用户会话是为连接到应用程序的每个用户分配的存储空间。每次登录用户导航到新页面时，Flask-Login 都会从会话中检索用户的 ID，然后将该用户加载到内存中。

由于 Flask-Login 对数据库一无所知，它需要应用程序的帮助来加载用户。因此，该扩展期望应用程序配置一个用户加载函数，可以调用该函数来根据 ID 加载用户。此函数可以添加到 *app/models.py* 模块中：

*app/models.py*：Flask-Login 用户加载函数

```
from app import login
# ...

@login.user_loader
def load_user(id):
    return db.session.get(User, int(id))

```

用户加载器使用 `@login.user_loader` 装饰器向 Flask-Login 注册。Flask-Login 作为参数传递给函数的 `id` 将是字符串类型，因此使用数字 ID 的数据库需要像上面那样将字符串转换为整数。

## 用户登录

让我们重新审视登录视图函数，您还记得它实现了一个只发出 `flash()` 消息的假登录。现在应用程序可以访问用户数据库，并知道如何生成和验证密码哈希，这个视图函数可以完成了。

*app/routes.py*：登录视图函数逻辑

```
# ...
from flask_login import current_user, login_user
import sqlalchemy as sa
from app import db
from app.models import User

# ...

@app.route('/login', methods='GET', 'POST')
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == form.username.data))
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        return redirect(url_for('index'))
    return render_template('login.html', title='Sign In', form=form)

```

`login()` 函数中的前两行处理一种特殊情况。想象一下，有一个已登录的用户，然后该用户导航到应用程序的 */login* URL。这明显是一个错误，所以我想禁止这种情况。`current_user` 变量来自 Flask-Login，可以在处理请求的任何时候使用，以获取代表该请求客户端的用户对象。该变量的值可以是来自数据库的用户对象（Flask-Login 通过我上面提供的用户加载器回调读取的），或者是特殊的匿名用户对象（如果用户尚未登录）。还记得 Flask-Login 在用户对象中要求的那些属性吗？其中之一是 `is_authenticated`，它可用于检查用户是否已登录。当用户已经登录时，我只需重定向到索引页面。

替换我之前使用的 `flash()` 调用，现在我可以真正地登录用户了。第一步是从数据库加载用户。用户名随表单提交而来，因此我可以用它来查询数据库以找到该用户。为此，我使用 `where()` 子句来查找具有给定用户名的用户。由于我知道只会有一个或零个结果，我调用 `db.session.scalar()` 来执行查询，如果存在则返回用户对象，否则返回 `None`。在第 4 章中，您已经看到当您调用 `all()` 方法时，查询会执行并返回一个包含所有匹配结果的列表。当您只需要一个结果时，`first()` 方法是另一种常用的执行查询的方式。

如果我找到了提供的用户名的匹配项，接下来我可以检查随表单提交的密码是否有效。这是通过调用我上面定义的 `check_password()` 方法来完成的。它将获取存储在用户中的密码哈希，并确定表单中输入的密码是否与哈希匹配。所以现在我有了两个可能的错误条件：用户名无效，或用户的密码不正确。在任一情况下，我都会闪现一条消息，并重定向回登录提示，以便用户可以重试。

如果用户名和密码都正确，那么我调用 `login_user()` 函数，该函数来自 Flask-Login。此函数会将用户注册为已登录状态，这意味着用户将来导航到的任何页面都将把 `current_user` 变量设置为该用户。

为了完成登录过程，我只需将新登录的用户重定向到索引页面。

## 用户注销

我知道我还需要为用户提供注销应用程序的选项。这可以通过 Flask-Login 的 `logout_user()` 函数完成。以下是注销视图函数：

*app/routes.py*：注销视图函数

```
# ...
from flask_login import logout_user

# ...

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

```

为了向用户暴露此链接，我可以让导航栏中的登录链接在用户登录后自动切换为注销链接。这可以通过 *base.html* 模板中的条件语句实现：

*app/templates/base.html*：条件显示登录和注销链接

```
        <div>
            Microblog:
            <a href="{{ url_for('index') }}">Home</a>
            {% if current_user.is_anonymous %}
            <a href="{{ url_for('login') }}">Login</a>
            {% else %}
            <a href="{{ url_for('logout') }}">Logout</a>
            {% endif %}
        </div>

```

`is_anonymous` 属性是 Flask-Login 通过 `UserMixin` 类添加到用户对象的属性之一。`current_user.is_anonymous` 表达式仅当用户未登录时为 `True`。

## 要求用户登录

Flask-Login 提供了一个非常有用的功能，强制用户在查看应用程序的某些页面之前先登录。如果未登录的用户尝试查看受保护的页面，Flask-Login 将自动将用户重定向到登录表单，并且仅在登录过程完成后才重定向回用户想要查看的页面。

为了实现此功能，Flask-Login 需要知道哪个视图函数处理登录。这可以在 *app/__init__.py* 中添加：

```
# ...
login = LoginManager(app)
login.login_view = 'login'

```

上面的 `'login'` 值是登录视图的函数（或端点）名称。换句话说，您将在 `url_for()` 调用中使用的名称。

Flask-Login 保护视图函数免受匿名用户访问的方式是使用一个名为 `@login_required` 的装饰器。当您在视图函数上、在来自 Flask 的 `@app.route` 装饰器下方添加此装饰器时，该函数将受到保护，不允许未经身份验证的用户访问。以下是如何将该装饰器应用于应用程序的索引视图函数：

*app/routes.py*：@login_required 装饰器

```
from flask_login import login_required

@app.route('/')
@app.route('/index')
@login_required
def index():
    # ...

```

剩下的工作是从成功登录后重定向回用户想要访问的页面。当未登录的用户访问受 `@login_required` 装饰器保护的视图函数时，装饰器将重定向到登录页面，但它会在此重定向中包含一些额外信息，以便应用程序随后可以返回到原始页面。例如，如果用户导航到 */index*，`@login_required` 装饰器将拦截请求并以重定向到 */login* 作为响应，但它会向此 URL 添加一个查询字符串参数，使完整重定向 URL 变为 */login?next=/index*。`next` 查询字符串参数设置为原始 URL，因此应用程序可以在登录后使用它来重定向回来。

下面是一段代码片段，展示了如何读取和处理 `next` 查询字符串参数。更改在 `login_user()` 调用下面的四行中。

*app/routes.py*：重定向到 "next" 页面

```
from flask import request
from urllib.parse import urlsplit

@app.route('/login', methods='GET', 'POST')
def login():
    # ...
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == form.username.data))
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or urlsplit(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    # ...

```

在调用 Flask-Login 的 `login_user()` 函数登录用户后，立即获取 `next` 查询字符串参数的值。Flask 提供了一个 `request` 变量，其中包含客户端随请求发送的所有信息。特别是，`request.args` 属性以友好的字典格式公开查询字符串的内容。实际上需要考虑三种可能的情况来确定成功登录后重定向到哪里：

- 如果登录 URL 没有 `next` 参数，则用户被重定向到索引页面。

- 如果登录 URL 包含设置为相对路径的 `next` 参数（换句话说，没有域名部分的 URL），则用户被重定向到该 URL。

- 如果登录 URL 包含设置为包含域名的完整 URL 的 `next` 参数，则此 URL 被忽略，用户被重定向到索引页面。

第一种和第二种情况不言自明。第三种情况是为了使应用程序更安全。攻击者可以在 `next` 参数中插入指向恶意网站的 URL，因此应用程序仅在 URL 是相对的时才重定向，这确保了重定向保持在应用程序的同一站点内。为了确定 URL 是绝对还是相对，我使用 Python 的 `urlsplit()` 函数解析它，然后检查 `netloc` 组件是否已设置。

## 在模板中显示登录用户

还记得在第 2 章中，我创建了一个模拟用户来帮助我在用户子系统就位之前设计应用程序的主页吗？现在应用程序有了真实的用户，所以我可以移除模拟用户并开始使用真实用户。我可以不再使用模拟用户，而是在模板 *index.html* 中使用 Flask-Login 的 `current_user`：

*app/templates/index.html*：将当前用户传递给模板

```
{% extends "base.html" %}

{% block content %}
    <h1>Hi, {{ current_user.username }}!</h1>
    {% for post in posts %}
    <div><p>{{ post.author.username }} says: <b>{{ post.body }}</b></p></div>
    {% endfor %}
{% endblock %}

```

并且我可以在视图函数中移除 `user` 模板参数：

*app/routes.py*：不再将用户传递给模板

```
@app.route('/')
@app.route('/index')
@login_required
def index():
    # ...
    return render_template("index.html", title='Home Page', posts=posts)

```

现在是测试登录和注销功能的好时机。由于仍然没有用户注册功能，将用户添加到数据库的唯一方法是通过 Python shell，所以运行 `flask shell` 并输入以下命令来注册用户：

```
>>> u = User(username='susan', email='susan@example.com')
>>> u.set_password('cat')
>>> db.session.add(u)
>>> db.session.commit()

```

如果您现在启动应用程序并访问应用程序的 */* 或 */index* URL，您将立即被重定向到登录页面，在您使用添加到数据库中的用户凭据登录后，您将返回原始页面，在那里您会看到个性化的问候语和模拟博客帖子。如果您随后点击顶部导航栏中的注销链接，您将以匿名用户身份被发送回索引页面，并立即被 Flask-Login 再次重定向到登录页面。

## 用户注册

我将在本章中构建的最后一个功能是注册表单，使用户可以通过 Web 表单自行注册。让我们开始在 *app/forms.py* 中创建 Web 表单类：

*app/forms.py*：用户注册表单

```
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
import sqlalchemy as sa
from app import db
from app.models import User

# ...

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=DataRequired())
    email = StringField('Email', validators=DataRequired(), Email())
    password = PasswordField('Password', validators=DataRequired())
    password2 = PasswordField(
        'Repeat Password', validators=DataRequired(), EqualTo('password'))
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = db.session.scalar(sa.select(User).where(
            User.username == username.data))
        if user is not None:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = db.session.scalar(sa.select(User).where(
            User.email == email.data))
        if user is not None:
            raise ValidationError('Please use a different email address.')

```

这个新表单中有几个与验证相关的有趣之处。首先，对于 `email` 字段，我在 `DataRequired` 之后添加了第二个验证器，称为 `Email`。这是 WTForms 自带的另一个标准验证器，用于确保用户在该字段中输入的内容符合电子邮件地址的结构。

`Email()` 验证器需要安装一个外部依赖：

```
(venv) $ pip install email-validator

```

由于这是一个注册表单，通常要求用户输入两次密码以减少输入错误的风险。因此，我有 `password` 和 `password2` 字段。第二个密码字段使用了另一个名为 `EqualTo` 的标准验证器，它将确保其值与第一个密码字段的值相同。

当您添加任何符合 `validate_<field_name>` 模式的方法时，WTForms 会将这些方法视为自定义验证器，并在标准验证器之外调用它们。我已经为 `username` 和 `email` 字段向此类添加了两个这样的方法。在这种情况下，我想确保用户输入的用户名和电子邮件地址尚未存在于数据库中，因此这两个方法发出数据库查询，期望没有结果。如果存在结果，则通过引发类型为 `ValidationError` 的异常来触发验证错误。异常中包含的消息将作为参数显示在字段旁边供用户查看。

注意这两个验证查询是如何发出的。这些查询永远不会找到多于一个结果，因此我没有使用 `db.session.scalars()` 来运行它们，而是使用了单数形式的 `db.session.scalar()`，如果没有结果则返回 `None`，否则返回第一个结果。

为了在网页上显示此表单，我需要有一个 HTML 模板，将其存储在文件 *app/templates/register.html* 中。此模板的构造与登录表单的模板类似：

*app/templates/register.html*：注册模板

```
{% extends "base.html" %}

{% block content %}
    <h1>Register</h1>
    <form action="" method="post">
        {{ form.hidden_tag() }}
        <p>
            {{ form.username.label }}<br>
            {{ form.username(size=32) }}<br>
            {% for error in form.username.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>
            {{ form.email.label }}<br>
            {{ form.email(size=64) }}<br>
            {% for error in form.email.errors %}
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
        <p>
            {{ form.password2.label }}<br>
            {{ form.password2(size=32) }}<br>
            {% for error in form.password2.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>{{ form.submit() }}</p>
    </form>
{% endblock %}

```

登录表单模板需要在表单下方添加一个链接，将新用户引导到注册表单：

*app/templates/login.html*：注册页面链接

```
    <p>New User? <a href="{{ url_for('register') }}">Click to Register!</a></p>

```

最后，我需要编写在 *app/routes.py* 中处理用户注册的视图函数：

*app/routes.py*：用户注册视图函数

```
from app import db
from app.forms import RegistrationForm

# ...

@app.route('/register', methods='GET', 'POST')
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

```

这个视图函数也基本不言自明。我首先确保调用此路由的用户未登录。表单的处理方式与登录表单相同。`if validate_on_submit()` 条件内的逻辑使用提供的用户名、电子邮件和密码创建一个新用户，将其写入数据库，然后重定向到登录提示，以便用户可以登录。

通过这些更改，用户应该能够在此应用程序上创建帐户，并登录和注销。请确保您尝试了我在注册表单中添加的所有验证功能，以更好地理解它们的工作原理。我将在未来的章节中重新审视用户身份验证子系统，以添加其他功能，例如允许用户在忘记密码时重置密码。但就目前而言，这足以继续构建应用程序的其他领域。

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
