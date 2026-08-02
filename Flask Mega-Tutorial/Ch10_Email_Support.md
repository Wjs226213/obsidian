# 第10部分：电子邮件支持

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-x-email-support](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-x-email-support) | Flask Mega-Tutorial by Miguel Grinberg

---

这是Flask Mega-Tutorial系列的第十部分，我将介绍如何让应用程序向用户发送电子邮件，以及如何在电子邮件支持的基础上构建密码恢复功能。

您正在阅读Flask Mega-Tutorial的2024版。本课程完整版也可在亚马逊订购电子书和平装本。感谢您的支持！

如果您正在寻找本课程的2018版，可以在这里找到。

作为参考，以下是本系列文章的完整列表：

- 第1章：Hello, World!

- 第2章：模板

- 第3章：Web表单

- 第4章：数据库

- 第5章：用户登录

- 第6章：个人资料页面和头像

- 第7章：错误处理

- 第8章：关注者

- 第9章：分页

- 第10章：电子邮件支持（本文）

- 第11章：改头换面

- 第12章：日期和时间

- 第13章：国际化与本地化

- 第14章：Ajax

- 第15章：更好的应用结构

- 第16章：全文搜索

- 第17章：在Linux上部署

- 第18章：在Heroku上部署

- 第19章：在Docker容器上部署

- 第20章：一些JavaScript魔法

- 第21章：用户通知

- 第22章：后台任务

- 第23章：应用程序编程接口（API）

现在应用程序在数据库方面已经做得相当不错了，所以在本章中我想暂时离开这个话题，添加大多数Web应用都需要的一个重要功能——发送电子邮件。

为什么应用程序需要向用户发送电子邮件？原因有很多，但其中一个常见的用途是解决与认证相关的问题。在本章中，我将为忘记密码的用户添加密码重置功能。当用户请求密码重置时，应用程序将发送一封包含特殊构造链接的电子邮件。用户需要点击该链接才能进入设置新密码的表单。

*本章的GitHub链接：浏览、ZIP压缩包、差异对比。*

## 介绍Flask-Mail

在实际发送电子邮件方面，Flask有一个流行的扩展叫Flask-Mail。和往常一样，这个扩展通过pip安装：

```
(venv) $ pip install flask-mail

```

密码重置链接中包含一个安全令牌。为了生成这些令牌，我将使用JSON Web令牌，它也有一个流行的Python包：

```
(venv) $ pip install pyjwt

```

Flask-Mail扩展通过`app.config`对象进行配置。还记得在第7章中，我添加了电子邮件配置，用于在生产环境中发生错误时向自己发送电子邮件吗？当时我没有告诉你，但我选择的配置变量实际上是按照Flask-Mail的要求建模的，所以实际上不需要额外的工作，配置变量已经在应用程序中了。

与大多数Flask扩展一样，你需要在Flask应用程序创建后立即创建一个实例。在本例中，这是一个`Mail`类的对象：

*app/__init__.py*：Flask-Mail实例。

```
# ...
from flask_mail import Mail

app = Flask(__name__)
# ...
mail = Mail(app)

```

如果你计划测试发送电子邮件，你可以使用我在第7章中提到的相同选项。如果你想使用模拟的电子邮件服务器，那么你可以在第二个终端中使用以下命令启动之前用过的相同SMTP调试服务器：

```
(venv) $ aiosmtpd -n -c aiosmtpd.handlers.Debugging -l localhost:8025

```

要配置应用程序使用该服务器，你需要设置两个环境变量：

```
(venv) $ export MAIL_SERVER=localhost
(venv) $ export MAIL_PORT=8025

```

如果你希望实际发送电子邮件，则需要使用真实的电子邮件服务器。如果你有现成的，只需为其设置`MAIL_SERVER`、`MAIL_PORT`、`MAIL_USE_TLS`、`MAIL_USERNAME`和`MAIL_PASSWORD`环境变量即可。如果你想要一个快速解决方案，可以使用Gmail帐户发送电子邮件，设置如下：

```
(venv) $ export MAIL_SERVER=smtp.googlemail.com
(venv) $ export MAIL_PORT=587
(venv) $ export MAIL_USE_TLS=1
(venv) $ export MAIL_USERNAME=<your-gmail-username>
(venv) $ export MAIL_PASSWORD=<your-gmail-password>

```

如果你使用Microsoft Windows，则需要将上述每个`export`语句中的`export`替换为`set`。

遗憾的是，你的Gmail帐户的安全功能可能会阻止应用程序通过它发送电子邮件。当你明确允许"不太安全的应用程序"访问你的Gmail帐户时，某些帐户允许这样做，但这并不总是可用。你可以在此处阅读更多相关信息。

如果你希望使用真实的电子邮件服务器，但不想被Gmail配置所困扰，SendGrid是一个不错的选择，它使用免费帐户每天提供100封电子邮件。

## Flask-Mail的使用

为了了解Flask-Mail的工作方式，我将向你展示如何从Python shell会话发送电子邮件。使用`flask shell`启动Python，然后运行以下命令：

```
>>> from flask_mail import Message
>>> from app import mail
>>> msg = Message('test subject', sender=app.config'ADMINS'0,
... recipients='your-email@example.com')
>>> msg.body = 'text body'
>>> msg.html = '<h1>HTML body</h1>'
>>> mail.send(msg)

```

上面的代码片段将向你放在`recipients`参数中的电子邮件地址列表发送邮件。我将发件人设置为第一个配置的管理员（我在第7章中添加了`ADMINS`配置变量）。电子邮件将包含纯文本和HTML版本，因此根据你的电子邮件客户端的配置方式，你可能会看到其中一种或另一种。

现在让我们将电子邮件集成到应用程序中。

## 一个简单的电子邮件框架

我将首先编写一个发送电子邮件的辅助函数，这基本上是上一节中shell练习的通用版本。我将把这个函数放在一个名为`app/email.py`的新模块中：

*app/email.py*：电子邮件发送包装函数。

```
from flask_mail import Message
from app import mail

def send_email(subject, sender, recipients, text_body, html_body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    mail.send(msg)

```

Flask-Mail支持一些我在这里没有使用的功能，例如抄送和密送列表。如果你对这些选项感兴趣，请务必查阅Flask-Mail文档。

## 请求密码重置

正如我上面提到的，我希望用户可以选择请求重置密码。为此，我将在登录页面添加一个链接：

*app/templates/login.html*：登录表单中的密码重置链接。

```
    <p>
        Forgot Your Password?
        <a href="{{ url_for('reset_password_request') }}">Click to Reset It</a>
    </p>

```

当用户点击该链接时，将出现一个新的Web表单，请求用户提供电子邮件地址，以此启动密码重置流程。以下是表单类：

*app/forms.py*：重置密码请求表单。

```
class ResetPasswordRequestForm(FlaskForm):
    email = StringField('Email', validators=DataRequired(), Email())
    submit = SubmitField('Request Password Reset')

```

以及对应的HTML模板：

*app/templates/reset_password_request.html*：重置密码请求模板。

```
{% extends "base.html" %}

{% block content %}
    <h1>Reset Password</h1>
    <form action="" method="post">
        {{ form.hidden_tag() }}
        <p>
            {{ form.email.label }}<br>
            {{ form.email(size=64) }}<br>
            {% for error in form.email.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>{{ form.submit() }}</p>
    </form>
{% endblock %}

```

我还需要一个视图函数来处理此表单：

*app/routes.py*：重置密码请求视图函数。

```
from app.forms import ResetPasswordRequestForm
from app.email import send_password_reset_email

@app.route('/reset_password_request', methods='GET', 'POST')
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = ResetPasswordRequestForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.email == form.email.data))
        if user:
            send_password_reset_email(user)
        flash('Check your email for the instructions to reset your password')
        return redirect(url_for('login'))
    return render_template('reset_password_request.html',
                           title='Reset Password', form=form)

```

这个视图函数与处理表单的其他函数非常相似。我首先确保用户未登录。如果用户已登录，则无需使用密码重置功能，因此我重定向到首页。

当表单提交并验证通过后，我根据用户在表单中提供的电子邮件查找用户。如果找到该用户，则发送密码重置电子邮件。`send_password_reset_email()`辅助函数执行此任务。我将在接下来向你展示这个函数。

发送电子邮件后，我闪现一条消息，指示用户查看电子邮件以获取进一步说明，然后重定向回登录页面。你可能会注意到，即使提供的电子邮件未知，也会显示闪现消息。这样做是为了防止客户端利用此表单来判断某个用户是否是注册用户。

## 密码重置令牌

在实现`send_password_reset_email()`函数之前，我需要一种生成密码请求链接的方法。这将是通过电子邮件发送给用户的链接。当点击该链接时，会向用户显示一个可以设置新密码的页面。这个计划中棘手的部分是确保只有有效的重置链接才能用于重置帐户的密码。

这些链接将配有一个*令牌*，在允许更改密码之前将验证该令牌，以此证明请求电子邮件的用户有权访问该帐户的电子邮件地址。此类流程中使用非常广泛的令牌标准是JSON Web令牌（JWT）。JWT的优点是它们是自包含的。你可以通过电子邮件向用户发送令牌，当用户点击将令牌传回应用程序的链接时，应用程序可以自行验证。

JWT是如何工作的？最好通过一个快速的Python shell会话来理解它们：

```
>>> import jwt
>>> token = jwt.encode({'a': 'b'}, 'my-secret', algorithm='HS256')
>>> token
'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhIjoiYiJ9.dvOo58OBDHiuSHD4uW88nfJik_sfUHq1mDi4G0'
>>> jwt.decode(token, 'my-secret', algorithms='HS256')
{'a': 'b'}

```

`{'a': 'b'}`字典是一个示例负载，将被写入令牌中。为了使令牌安全，需要提供一个密钥来创建加密签名。在这个例子中，我使用了字符串`'my-secret'`，但在应用程序中，我将使用Flask配置中的`SECRET_KEY`。`algorithm`参数指定如何生成令牌签名。`HS256`算法是最广泛使用的。

如你所见，生成的令牌是一长串字符。但不要认为这是一个加密令牌。令牌的内容（包括负载）可以被任何人轻松解码（不信？复制上面的令牌，然后将其输入JWT调试器来查看其内容）。令牌的安全性在于负载是被*签名*的。如果有人试图伪造或篡改令牌中的负载，签名将失效，而生成新签名需要密钥。当验证令牌时，负载的内容被解码并返回给调用者。如果令牌签名验证通过，则负载可以被视为真实可信。

我将用于密码重置令牌的负载格式为`{'reset_password': user_id, 'exp': token_expiration}`。`exp`字段是JWT的标准字段，如果存在，则表示令牌的过期时间。如果令牌具有有效签名但已超过其过期时间戳，则也将被视为无效。对于密码重置功能，我将为这些令牌设置10分钟的有效期。

当用户点击电子邮件中的链接时，令牌将作为URL的一部分发送回应用程序，处理此URL的视图函数首先要做的就是验证它。如果签名有效，则可以通过负载中存储的ID来识别用户。一旦确定了用户身份，应用程序就可以要求输入新密码并将其设置为用户的帐户密码。

由于这些令牌属于用户，我将在`User`模型中编写令牌生成和验证函数：

*app/models.py*：重置密码令牌方法。

```
from time import time
import jwt
from app import app

class User(UserMixin, db.Model):
    # ...

    def get_reset_password_token(self, expires_in=600):
        return jwt.encode(
            {'reset_password': self.id, 'exp': time() + expires_in},
            app.config'SECRET_KEY', algorithm='HS256')

    @staticmethod
    def verify_reset_password_token(token):
        try:
            id = jwt.decode(token, app.config'SECRET_KEY',
                            algorithms='HS256')'reset_password'
        except:
            return
        return db.session.get(User, id)

```

`get_reset_password_token()`函数返回一个JWT令牌字符串，由`jwt.encode()`函数直接生成。

`verify_reset_password_token()`是一个静态方法，这意味着可以直接从类调用它。静态方法与类方法类似，唯一的区别是静态方法不接收类作为第一个参数。该方法接收一个令牌并尝试通过调用PyJWT的`jwt.decode()`函数来解码它。如果令牌无法验证或已过期，则会引发异常，在这种情况下我会捕获它以防止错误，然后向调用者返回`None`。如果令牌有效，则令牌负载中`reset_password`键的值就是用户的ID，因此我可以加载用户并返回它。

## 发送密码重置电子邮件

`send_password_reset_email()`函数依赖我上面编写的`send_email()`函数来生成密码重置电子邮件。

*app/email.py*：发送密码重置电子邮件函数。

```
from flask import render_template
from app import app

# ...

def send_password_reset_email(user):
    token = user.get_reset_password_token()
    send_email('Microblog Reset Your Password',
               sender=app.config'ADMINS'0,
               recipients=user.email,
               text_body=render_template('email/reset_password.txt',
                                         user=user, token=token),
               html_body=render_template('email/reset_password.html',
                                         user=user, token=token))

```

这个函数中有趣的部分是，电子邮件的文本和HTML内容是通过熟悉的`render_template()`函数从模板生成的。模板接收用户和令牌作为参数，以便生成个性化的电子邮件消息。

为了区分电子邮件模板和常规HTML模板，让我们在*templates*目录中创建一个*email*子目录：

```
(venv) $ mkdir app/templates/email

```

以下是重置密码电子邮件的文本模板：

*app/templates/email/reset_password.txt*：密码重置电子邮件的文本。

```
Dear {{ user.username }},

To reset your password click on the following link:

{{ url_for('reset_password', token=token, _external=True) }}

If you have not requested a password reset simply ignore this message.

Sincerely,

The Microblog Team

```

以下是同一封电子邮件的更美观的HTML版本：

*app/templates/email/reset_password.html*：密码重置电子邮件的HTML。

```
<!doctype html>
<html>
    <body>
        <p>Dear {{ user.username }},</p>
        <p>
            To reset your password
            <a href="{{ url_for('reset_password', token=token, _external=True) }}">
                click here
            </a>.
        </p>
        <p>Alternatively, you can paste the following link in your browser's address bar:</p>
        <p>{{ url_for('reset_password', token=token, _external=True) }}</p>
        <p>If you have not requested a password reset simply ignore this message.</p>
        <p>Sincerely,</p>
        <p>The Microblog Team</p>
    </body>
</html>

```

在这两个电子邮件模板中通过`url_for()`引用的`reset_password`路由尚不存在，将在下一节中添加。我在两个模板的`url_for()`调用中包含的`_external=True`参数也是新添加的。默认情况下，`url_for()`生成的URL是相对URL，只包含URL的路径部分。这对于网页中生成的链接来说通常足够了，因为Web浏览器会通过地址栏中的URL补全缺失的部分。然而，通过电子邮件发送URL时，没有这种上下文，因此需要使用完整的限定URL。当传递`_external=True`作为参数时，会生成完整的URL，因此前面的示例将返回*http://localhost:5000/user/susan*，或者当应用程序部署在域名上时返回相应的URL。

## 重置用户密码

当用户点击电子邮件链接时，将触发与此功能关联的第二条路由。以下是密码请求视图函数：

*app/routes.py*：密码重置视图函数。

```
from app.forms import ResetPasswordForm

@app.route('/reset_password/<token>', methods='GET', 'POST')
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    user = User.verify_reset_password_token(token)
    if not user:
        return redirect(url_for('index'))
    form = ResetPasswordForm()
    if form.validate_on_submit():
        user.set_password(form.password.data)
        db.session.commit()
        flash('Your password has been reset.')
        return redirect(url_for('login'))
    return render_template('reset_password.html', form=form)

```

在这个视图函数中，我首先确保用户未登录，然后通过调用`User`类中的令牌验证方法来确定用户是谁。如果令牌有效，该方法返回用户；如果无效，则返回`None`。如果令牌无效，我重定向到首页。

如果令牌有效，则向用户呈现第二个表单，用于请求输入新密码。这个表单的处理方式与之前的表单类似，在表单有效提交后，我调用`User`的`set_password()`方法来更改密码，然后重定向到登录页面，用户现在可以登录了。

以下是`ResetPasswordForm`类：

*app/forms.py*：密码重置表单。

```
class ResetPasswordForm(FlaskForm):
    password = PasswordField('Password', validators=DataRequired())
    password2 = PasswordField(
        'Repeat Password', validators=DataRequired(), EqualTo('password'))
    submit = SubmitField('Request Password Reset')

```

以及对应的HTML模板：

*app/templates/reset_password.html*：密码重置表单模板。

```
{% extends "base.html" %}

{% block content %}
    <h1>Reset Your Password</h1>
    <form action="" method="post">
        {{ form.hidden_tag() }}
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

密码重置功能现已完成，请务必尝试一下。

## 异步电子邮件

如果你使用的是调试电子邮件服务器，可能没有注意到这一点，但实际发送电子邮件会显著降低应用程序的速度。发送电子邮件所需的所有交互使此任务变慢，通常需要几秒钟才能发出一封电子邮件，如果收件人的电子邮件服务器较慢或有多个收件人，则可能需要更长时间。

我真正想要的是让`send_email()`函数变成*异步*的。这意味着什么？这意味着当调用此函数时，发送电子邮件的任务被安排在后台进行，使`send_email()`能够立即返回，以便应用程序可以在发送电子邮件的同时继续运行。

Python支持运行异步任务，实际上有多种方式。`threading`和`multiprocessing`模块都可以做到这一点。为发送电子邮件启动后台线程比启动新进程消耗的资源要少得多，因此我将采用这种方法：

*app/email.py*：异步发送电子邮件。

```
from threading import Thread
# ...

def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

def send_email(subject, sender, recipients, text_body, html_body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    Thread(target=send_async_email, args=(app, msg)).start()

```

`send_async_email`函数现在在后台线程中运行，通过在`send_email()`的最后一行中调用`Thread`类来启动。通过此更改，发送电子邮件将在线程中运行，当进程完成时，线程将结束并自行清理。如果你配置了真实的电子邮件服务器，在密码重置请求表单上按下提交按钮时，你肯定会注意到速度的提升。

你可能以为只有`msg`参数会被发送到线程，但正如你在代码中看到的，我还发送了应用程序实例。在使用线程时，需要记住Flask的一个重要设计方面。Flask使用*上下文*来避免在函数之间传递参数。我暂时不打算详细讨论这个问题，但要知道有两种类型的上下文：*应用上下文*和*请求上下文*。在大多数情况下，这些上下文由Flask自动管理，但当应用程序启动自定义线程时，可能需要手动创建这些线程的上下文。

有许多扩展需要应用上下文才能工作，因为这样它们才能在不传递参数的情况下找到Flask应用程序实例。许多扩展需要知道应用程序实例的原因是因为它们的配置存储在`app.config`对象中。Flask-Mail就是这种情况。`mail.send()`方法需要访问电子邮件服务器的配置值，而这只有知道应用程序是什么才能完成。通过`with app.app_context()`调用创建的应用上下文使得应用程序实例可以通过Flask的`current_app`变量访问。

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
