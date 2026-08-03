# Part 6: 用户主页与头像

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vi-profile-page-and-avatars](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vi-profile-page-and-avatars) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第六部分，我将告诉你如何创建用户主页。

你正在阅读 2024 版的 Flask Mega-Tutorial。完整的课程也可以从亚马逊以电子书和平装书的形式订购。感谢你的支持！

如果你正在寻找该课程 2018 版，可以在这里找到。

作为参考，以下是本系列文章的完整列表：

- Chapter 1: Hello, World!

- Chapter 2: Templates

- Chapter 3: Web Forms

- Chapter 4: Database

- Chapter 5: User Logins

- Chapter 6: Profile Page and Avatars（本文）

- Chapter 7: Error Handling

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

本章将致力于为应用程序添加用户主页。用户主页是一个展示用户信息的页面，通常包含用户自己输入的信息。我将向你展示如何为所有用户动态生成主页，然后添加一个小型主页编辑器，供用户输入他们的信息。

*本章的 GitHub 链接: Browse, Zip, Diff.*

## 用户主页

为了创建用户主页，让我们在应用程序中添加一个 */user/<username>* 路由。

*app/routes.py*: 用户主页视图函数

```
@app.route('/user/<username>')
@login_required
def user(username):
    user = db.first_or_404(sa.select(User).where(User.username == username))
    posts = [
        {'author': user, 'body': 'Test post #1'},
        {'author': user, 'body': 'Test post #2'}
    ]
    return render_template('user.html', user=user, posts=posts)

```

我用来声明此视图函数的 `@app.route` 装饰器看起来与之前有些不同。这里有一个动态组件，用 `<username>` 表示，由 `<` 和 `>` 包裹。当路由包含动态组件时，Flask 会接受该 URL 部分中的任何文本，并以实际文本作为参数调用视图函数。例如，如果客户端浏览器请求 URL `/user/susan`，视图函数将被调用，参数 `username` 设置为 `'susan'`。此视图函数仅允许已登录用户访问，因此我添加了来自 Flask-Login 的 `@login_required` 装饰器。

这个视图函数的实现相当简单。我首先尝试通过用户名从数据库中加载用户。之前你已经看到，可以使用 `db.session.scalars()` 获取所有结果，或使用 `db.session.scalar()` 获取第一个结果（如果没有结果则返回 `None`）。在这个视图函数中，我使用了 Flask-SQLAlchemy 提供的 `scalar()` 变体，称为 `db.first_or_404()`，它在有结果时的行为与 `scalar()` 相同，但在没有结果时会自动向客户端发送 404 错误。通过这种方式执行查询，我无需检查查询是否返回了用户，因为当数据库中不存在该用户名时，函数不会返回，而是会引发 404 异常。

如果数据库查询没有触发 404 错误，则意味着找到了给定用户名的用户。接下来，我为该用户初始化一个假的帖子列表，并渲染一个新的 *user.html* 模板，将用户对象和帖子列表传递给它。

*user.html* 模板如下所示：

*app/templates/user.html*: 用户主页模板

```
{% extends "base.html" %}

{% block content %}
    <h1>User: {{ user.username }}</h1>
    <hr>
    {% for post in posts %}
    <p>
    {{ post.author.username }} says: <b>{{ post.body }}</b>
    </p>
    {% endfor %}
{% endblock %}

```

现在主页已经完成，但在网站的任何地方都没有指向它的链接。为了让用户更容易查看自己的主页，我将在顶部的导航栏中添加一个链接：

*app/templates/base.html*: 用户主页链接

```
        <div>
            Microblog:
            <a href="{{ url_for('index') }}">Home</a>
            {% if current_user.is_anonymous %}
            <a href="{{ url_for('login') }}">Login</a>
            {% else %}
            <a href="{{ url_for('user', username=current_user.username) }}">Profile</a>
            <a href="{{ url_for('logout') }}">Logout</a>
            {% endif %}
        </div>

```

这里唯一有趣的变化是用于生成主页链接的 `url_for()` 调用。由于用户主页视图函数接受一个动态参数，`url_for()` 函数需要以关键字参数的形式为该 URL 部分提供值。因为这是一个指向当前登录用户主页的链接，我可以使用 Flask-Login 的 `current_user` 来生成正确的 URL。

现在试试运行应用程序。点击顶部的 `Profile` 链接，应该会跳转到你自己的用户页面。目前还没有指向其他用户主页的链接，但如果你想访问那些页面，可以在浏览器的地址栏中手动输入 URL。例如，如果你有一个名为 "john" 的用户，可以在地址栏中输入 *http://localhost:5000/user/john* 来查看相应的用户主页。

## 头像

我相信你同意我刚才构建的用户主页有些单调。为了让它们更有趣，我打算添加用户头像，但不是在服务器上处理大量可能的上传图片，而是使用 Gravatar 服务为所有用户提供头像。

Gravatar 服务使用起来非常简单。要为给定用户请求头像，需要使用格式为 *https://www.gravatar.com/avatar/<hash>* 的 URL，其中 `<hash>` 是用户电子邮件地址的 MD5 哈希值。下面展示了如何为邮箱为 `john@example.com` 的用户获取 Gravatar URL：

```
>>> from hashlib import md5
>>> 'https://www.gravatar.com/avatar/' + md5(b'john@example.com').hexdigest()
'https://www.gravatar.com/avatar/d4c74594d841139328695756648b6bd6'

```

如果你想看一个实际的例子，我自己的 Gravatar URL 是：

```
https://www.gravatar.com/avatar/729e26a2a2c7ff24a71958d4aa4e5f35

```

如果你在浏览器的地址栏中输入这个 URL，Gravatar 返回的图像如下：

默认情况下，返回的图像大小是 80x80 像素，但可以通过在 URL 的查询字符串中添加 `s` 参数来请求不同的尺寸。例如，要获取我自己的 128x128 像素头像，URL 是 \linebreak *https://www.gravatar.com/avatar/729e26a2a2c7ff24a71958d4aa4e5f35?s=128*。

另一个可以传递给 Gravatar 的有趣参数是 `d`，它决定了 Gravatar 为没有注册头像的用户提供什么图像。我最喜欢的是 "identicon"，它会为每个不同的电子邮件返回一个漂亮的几何图案。例如：

请注意，某些隐私浏览器扩展（如 Ghostery）会屏蔽 Gravatar 图像，因为它们认为 Automattic（Gravatar 服务的所有者）可以根据获取你头像的请求确定你访问了哪些网站。如果你在浏览器中看不到头像，请考虑可能是你安装的扩展导致的问题。

由于头像与用户相关联，将生成头像 URL 的逻辑添加到用户模型中是合理的。

*app/models.py*: 用户头像 URL

```
from hashlib import md5
# ...

class User(UserMixin, db.Model):
    # ...
    def avatar(self, size):
        digest = md5(self.email.lower().encode('utf-8')).hexdigest()
        return f'https://www.gravatar.com/avatar/{digest}?d=identicon&s={size}'

```

`User` 类的新 `avatar()` 方法返回用户头像图像的 URL，按请求的像素尺寸缩放。对于没有注册头像的用户，将生成一个 "identicon" 图像。为了生成 MD5 哈希，我首先将电子邮件转换为小写，这是 Gravatar 服务要求的。然后，由于 Python 中的 MD5 支持处理的是字节而非字符串，我将字符串编码为字节后再传递给哈希函数。

如果你有兴趣了解 Gravatar 服务提供的其他选项，请访问他们的文档网站。

下一步是将头像图像插入用户主页模板：

*app/templates/user.html*: 模板中的用户头像

```
{% extends "base.html" %}

{% block content %}
    <table>
        <tr valign="top">
            <td><img src="{{ user.avatar(128) }}"></td>
            <td><h1>User: {{ user.username }}</h1></td>
        </tr>
    </table>
    <hr>
    {% for post in posts %}
    <p>
    {{ post.author.username }} says: <b>{{ post.body }}</b>
    </p>
    {% endfor %}
{% endblock %}

```

让 `User` 类负责返回头像 URL 的好处在于，如果将来某天我觉得 Gravatar 头像不再合适，只需重写 `avatar()` 方法返回不同的 URL，所有模板就会自动开始显示新头像。

现在用户主页顶部已有漂亮的大头像，但不必止步于此。底部还有一些用户的帖子，每个帖子也可以配上小头像。当然，在用户主页中所有帖子都有相同的头像，但稍后我可以在主页上实现同样的功能，这样每篇帖子都会配上作者的头像，效果会很棒。

要为每篇单独的帖子显示头像，我只需在模板中再做一个小改动：

*app/templates/user.html*: 帖子中的用户头像

```
{% extends "base.html" %}

{% block content %}
    <table>
        <tr valign="top">
            <td><img src="{{ user.avatar(128) }}"></td>
            <td><h1>User: {{ user.username }}</h1></td>
        </tr>
    </table>
    <hr>
    {% for post in posts %}
    <table>
        <tr valign="top">
            <td><img src="{{ post.author.avatar(36) }}"></td>
            <td>{{ post.author.username }} says:<br>{{ post.body }}</td>
        </tr>
    </table>
    {% endfor %}
{% endblock %}

```

## 使用 Jinja 子模板

我设计的用户主页会显示用户撰写的帖子及其头像。现在我希望首页也能以类似布局显示帖子。我可以直接复制粘贴处理帖子渲染的模板部分，但这并不理想，因为以后如果决定更改此布局，我必须记得更新两个模板。

相反，我将创建一个仅渲染单篇帖子的子模板，然后从 *user.html* 和 *index.html* 模板中引用它。首先，创建子模板，只包含单篇帖子的 HTML 标记。我将这个模板命名为 *app/templates/_post.html*。`_` 前缀只是一种命名约定，帮助我识别哪些模板文件是子模板。

*app/templates/_post.html*: 帖子子模板

```
    <table>
        <tr valign="top">
            <td><img src="{{ post.author.avatar(36) }}"></td>
            <td>{{ post.author.username }} says:<br>{{ post.body }}</td>
        </tr>
    </table>

```

从 *user.html* 模板中调用此子模板时，我使用 Jinja 的 `include` 语句：

*app/templates/user.html*: 使用帖子子模板

```
{% extends "base.html" %}

{% block content %}
    <table>
        <tr valign="top">
            <td><img src="{{ user.avatar(128) }}"></td>
            <td><h1>User: {{ user.username }}</h1></td>
        </tr>
    </table>
    <hr>
    {% for post in posts %}
        {% include '_post.html' %}
    {% endfor %}
{% endblock %}

```

应用程序的首页尚未完全充实，所以我暂时不会在那里添加此功能。

## 更有趣的主页

新用户主页的一个问题是它们显示的内容不多。用户喜欢在这些页面上介绍自己，所以我将让他们写一些关于自己的内容显示在这里。我还将记录每个用户最后一次访问网站的时间，并在其主页上显示。

为了支持这些额外信息，我首先需要扩展数据库中的 `users` 表，添加两个新字段：

*app/models.py*: 用户模型中的新字段

```
class User(UserMixin, db.Model):
    # ...
    about_me: so.MappedOptional[str] = so.mapped_column(sa.String(140))
    last_seen: so.MappedOptional[datetime] = so.mapped_column(
        default=lambda: datetime.now(timezone.utc))

```

每次修改数据库后都需要生成数据库迁移。在第四章中，我展示了如何设置应用程序以通过迁移脚本跟踪数据库更改。现在我有两个要添加到数据库的新字段，所以第一步是生成迁移脚本：

```
(venv) $ flask db migrate -m "new fields in user model"
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.autogenerate.compare Detected added column 'user.about_me'
INFO  alembic.autogenerate.compare Detected added column 'user.last_seen'
  Generating migrations/versions/37f06a334dbf_new_fields_in_user_model.py ... done

```

`migrate` 命令的输出看起来不错，它检测到了 `User` 类中的两个新字段。现在我可以将此更改应用到数据库：

```
(venv) $ flask db upgrade
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.runtime.migration Running upgrade 780739b227a7 -> 37f06a334dbf, new fields in user model

```

我希望你能认识到使用迁移框架是多么有用。数据库中的现有用户仍然存在，迁移框架精确地应用迁移脚本中的更改，不会破坏任何数据。

下一步，我将这两个新字段添加到用户主页模板中：

*app/templates/user.html*: 在用户主页模板中显示用户信息

```
{% extends "base.html" %}

{% block content %}
    <table>
        <tr valign="top">
            <td><img src="{{ user.avatar(128) }}"></td>
            <td>
                <h1>User: {{ user.username }}</h1>
                {% if user.about_me %}<p>{{ user.about_me }}</p>{% endif %}
                {% if user.last_seen %}<p>Last seen on: {{ user.last_seen }}</p>{% endif %}
            </td>
        </tr>
    </table>
    ...
{% endblock %}

```

注意我将这两个字段包裹在 Jinja 的条件语句中，因为我只希望在它们被设置时才显示。目前这两个新字段对所有用户都是空的，所以你还看不到它们。

## 记录用户的最后访问时间

让我们从 `last_seen` 字段开始，这是两者中较简单的。我想要做的是，每当用户向服务器发送请求时，将当前时间写入该字段。

在每个可能被浏览器请求的视图函数中都添加设置此字段的代码显然不切实际，但在请求被分发到视图函数之前执行一些通用逻辑是 Web 应用中很常见的任务，Flask 将其作为原生功能提供。看看解决方案：

*app/routes.py*: 记录最后访问时间

```
from datetime import datetime, timezone

@app.before_request
def before_request():
    if current_user.is_authenticated:
        current_user.last_seen = datetime.now(timezone.utc)
        db.session.commit()

```

Flask 的 `@before_request` 装饰器将装饰的函数注册为在视图函数之前执行。这非常有用，因为现在我可以在一个地方插入任何视图函数之前需要执行的代码。实现简单地检查 `current_user` 是否已登录，如果是，则将 `last_seen` 字段设置为当前时间。我之前提到过，服务器应用程序需要使用一致的时间单位，标准做法是使用 UTC 时区。使用系统的本地时间不是一个好主意，因为那样写入数据库的值取决于你的地理位置。

最后一步是提交数据库会话，以便将上述更改写入数据库。如果你想知道为什么在提交之前没有 `db.session.add()`，请考虑：当你引用 `current_user` 时，Flask-Login 会调用用户加载器回调函数，该函数会执行数据库查询，将目标用户放入数据库会话中。因此你可以在此函数中再次添加用户，但没有必要，因为它已经在了。

做出此更改后查看你的主页，你会看到 "Last seen on" 行显示的时间非常接近当前时间。如果你离开主页然后返回，会看到时间不断更新。

我将这些时间戳存储在 UTC 时区，这导致主页上显示的时间也是 UTC 时间。此外，时间的格式也不是你期望的，因为它实际上是 Python `datetime` 对象的内部表示。目前，我不会担心这两个问题，因为我将在后续章节中专门讨论如何在 Web 应用程序中处理日期和时间。

## 主页编辑器

我还需要给用户提供一个可以输入个人信息的表单。该表单允许用户更改用户名和写一些关于自己的内容，存储在新的 `about_me` 字段中。让我们先为其编写一个表单类：

*app/forms.py*: 主页编辑器表单

```
from wtforms import TextAreaField
from wtforms.validators import Length

# ...

class EditProfileForm(FlaskForm):
    username = StringField('Username', validators=DataRequired())
    about_me = TextAreaField('About me', validators=Length(min=0, max=140))
    submit = SubmitField('Submit')

```

我在此表单中使用了一个新的字段类型和一个新的验证器。对于 "About" 字段，我使用 `TextAreaField`，这是一个多行文本框，用户可以在其中输入文本。为了验证此字段，我使用 `Length`，它将确保输入的文本长度在 0 到 140 个字符之间，这正是我在数据库中为该字段分配的空间。

渲染此表单的模板如下所示：

*app/templates/edit_profile.html*: 主页编辑器表单

```
{% extends "base.html" %}

{% block content %}
    <h1>Edit Profile</h1>
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
            {{ form.about_me.label }}<br>
            {{ form.about_me(cols=50, rows=4) }}<br>
            {% for error in form.about_me.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>{{ form.submit() }}</p>
    </form>
{% endblock %}

```

最后，这是将所有内容整合在一起的视图函数：

*app/routes.py*: 编辑主页视图函数

```
from app.forms import EditProfileForm

@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = EditProfileForm()
    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.about_me = form.about_me.data
        db.session.commit()
        flash('Your changes have been saved.')
        return redirect(url_for('edit_profile'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.about_me.data = current_user.about_me
    return render_template('edit_profile.html', title='Edit Profile',
                           form=form)

```

这个视图函数以略有不同的方式处理表单。如果 `validate_on_submit()` 返回 `True`，我将表单中的数据复制到用户对象，然后将对象写入数据库。但当 `validate_on_submit()` 返回 `False` 时，可能有两个不同的原因。首先，可能是浏览器刚刚发送了 `GET` 请求，我需要通过提供表单模板的初始版本来响应。也可能是浏览器发送了包含表单数据的 `POST` 请求，但数据中的某些内容无效。对于此表单，我需要分别处理这两种情况。当表单首次通过 `GET` 请求被请求时，我想用数据库中存储的数据预填充字段，所以我需要反向操作，将用户字段中存储的数据移到表单中，这样可以确保这些表单字段包含该用户的当前数据。但在验证错误的情况下，我不希望向表单字段写入任何内容，因为这些字段已经被 WTForms 填充了。为了区分这两种情况，我检查 `request.method`，初始请求会是 `GET`，而验证失败的提交会是 `POST`。

为了方便用户访问主页编辑器页面，我可以在他们的主页中添加一个链接：

*app/templates/user.html*: 编辑主页链接

```
                {% if user == current_user %}
                <p><a href="{{ url_for('edit_profile') }}">Edit your profile</a></p>
                {% endif %}

```

注意我使用的巧妙条件判断：确保编辑链接只在你查看自己主页时显示，而在查看其他人的主页时不显示。

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
