# 第21部分：用户通知

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxi-user-notifications](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxi-user-notifications) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第二十一篇文章，我将在此添加私信功能，以及出现在导航栏中且无需刷新页面即可显示的用户通知。

您正在阅读 2024 版的 Flask Mega-Tutorial。本课程完整版也可在亚马逊上订购电子书和平装本。感谢您的支持！

如果您正在寻找本课程的 2018 版，可以在此处找到。

供您参考，以下是本系列文章的完整列表：

- 第1章：Hello, World!

- 第2章：模板

- 第3章：Web 表单

- 第4章：数据库

- 第5章：用户登录

- 第6章：个人资料页和头像

- 第7章：错误处理

- 第8章：关注者

- 第9章：分页

- 第10章：邮件支持

- 第11章：美化

- 第12章：日期和时间

- 第13章：国际化和本地化

- 第14章：Ajax

- 第15章：更好的应用结构

- 第16章：全文搜索

- 第17章：在 Linux 上部署

- 第18章：在 Heroku 上部署

- 第19章：在 Docker 容器上部署

- 第20章：一些 JavaScript 魔法

- 第21章：用户通知（本文）

- 第22章：后台任务

- 第23章：应用程序编程接口（API）

在本章中，我想继续改进我的 Microblog 应用的用户体验。很多应用都会涉及向用户呈现提示或通知。社交应用会显示这些通知，让您知道有新提及或私信，通常会在顶部导航栏中显示一个小徽章和数字。虽然这是最常见的用法，但通知模式也可以应用于许多其他类型的应用，以告知用户某些事项需要他们注意。

但要向您展示构建用户通知所涉及的技术，我需要先用一个可以受益于通知的功能来扩展 Microblog，因此在本章的第一部分，我将构建一个用户消息系统，允许任何用户向其他用户发送私信。这实际上比听起来简单，并且将很好地复习 Flask 核心实践，并提醒您使用 Flask 编程可以多么简洁、高效和有趣。一旦消息系统就位，我将讨论一些选项来实现一个显示未读消息数量的通知徽章。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## 私信

我要实现的私信功能将非常简单。当您访问某个用户的个人资料页时，会有一个链接可以向该用户发送私信。该链接将带您进入一个新页面，其中有一个用于输入消息的 Web 表单。要阅读发送给您的消息，页面顶部的导航栏将有一个新的"消息"链接，该链接将带您进入一个结构类似于首页或发现页的页面，但不同的是，它将显示其他用户发送给您的消息，而不是博客文章。

以下各节描述了我实现此功能所采取的步骤。

### 私信的数据库支持

第一个任务是扩展数据库以支持私信。以下是一个新的 `Message` 模型：

*app/models.py*：Message 模型。

```
class Message(db.Model):
    id: so.Mappedint = so.mapped_column(primary_key=True)
    sender_id: so.Mappedint = so.mapped_column(sa.ForeignKey(User.id),
                                                 index=True)
    recipient_id: so.Mappedint = so.mapped_column(sa.ForeignKey(User.id),
                                                    index=True)
    body: so.Mappedstr = so.mapped_column(sa.String(140))
    timestamp: so.Mappeddatetime = so.mapped_column(
        index=True, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return '<Message {}>'.format(self.body)

```

这个模型类与 `Post` 模型类似，唯一的区别是有两个用户外键，一个用于发送者，一个用于接收者。`User` 模型可以为已发送和已接收的消息添加两个只写关系，以及一个新字段，用于指示每个用户上次阅读私信的时间：

*app/models.py*：User 模型中的私信支持。

```
class User(UserMixin, db.Model):
    # ...
    last_message_read_time: so.MappedOptional[datetime]

    # ...
    messages_sent: so.WriteOnlyMapped'Message' = so.relationship(
        foreign_keys='Message.sender_id', back_populates='author')
    messages_received: so.WriteOnlyMapped'Message' = so.relationship(
        foreign_keys='Message.recipient_id', back_populates='recipient')

    # ...

    def unread_message_count(self):
        last_read_time = self.last_message_read_time or datetime(1900, 1, 1)
        query = sa.select(Message).where(Message.recipient == self,
                                         Message.timestamp > last_read_time)
        return db.session.scalar(sa.select(sa.func.count()).select_from(
            query.subquery()))

```

`last_message_read_time` 字段将记录用户上次访问消息页的时间，并用于确定是否有未读消息——所有时间戳晚于此字段的消息都属于未读。`unread_message_count()` 辅助方法实际上使用此字段返回用户的未读消息数量。在本章结束时，我将把这个数字显示为页面顶部导航栏中的一个漂亮徽章。

这两个关系分别返回给定用户的已发送和已接收消息。在 `Message` 这边，我也包含了反向关系，分别称为 `author` 和 `recipient`：

*app/models.py*：Message 模型中的私信关系。

```
class Message(db.Model):
    # ...

    author: so.MappedUser = so.relationship(
        foreign_keys='Message.sender_id',
        back_populates='messages_sent')
    recipient: so.MappedUser = so.relationship(
        foreign_keys='Message.recipient_id',
        back_populates='messages_received')

```

我使用 `author` 作为关系名称而不是更直观的 `sender`，原因是使用 `author` 后，我可以用与博客文章相同的逻辑来渲染这些消息，因为文章和消息非常相似。

这样就完成了数据库的更改，现在可以生成新的迁移并升级数据库：

```
(venv) $ flask db migrate -m "private messages"
(venv) $ flask db upgrade

```

### 发送私信

接下来我将处理发送消息。我需要一个接受消息的简单 Web 表单：

*app/main/forms.py*：私信表单类。

```
class MessageForm(FlaskForm):
    message = TextAreaField(_l('Message'), validators=
        DataRequired(), Length(min=0, max=140))
    submit = SubmitField(_l('Submit'))

```

我还需要用于在网页上渲染此表单的 HTML 模板：

*app/templates/send_message.html*：发送私信 HTML 模板。

```
{% extends "base.html" %}
{% import "bootstrap_wtf.html" as wtf %}

{% block content %}
    <h1>{{ _('Send Message to %(recipient)s', recipient=recipient) }}</h1>
    {{ wtf.quick_form(form) }}
{% endblock %}

```

接下来，我将添加一个新的 */send_message/<recipient>* 路由来处理实际的私信发送：

*app/main/routes.py*：发送私信路由。

```
from app.main.forms import MessageForm
from app.models import Message

# ...

@bp.route('/send_message/<recipient>', methods='GET', 'POST')
@login_required
def send_message(recipient):
    user = db.first_or_404(sa.select(User).where(User.username == recipient))
    form = MessageForm()
    if form.validate_on_submit():
        msg = Message(author=current_user, recipient=user,
                      body=form.message.data)
        db.session.add(msg)
        db.session.commit()
        flash(_('Your message has been sent.'))
        return redirect(url_for('main.user', username=recipient))
    return render_template('send_message.html', title=_('Send Message'),
                           form=form, recipient=recipient)

```

我认为这个视图函数中的逻辑应该是不言自明的。发送私信的操作只是向数据库添加一个新的 `Message` 实例。

将所有内容串联起来的最后一个更改是在用户个人资料页中添加一个指向上述路由的链接：

*app/templates/user.html*：用户个人资料页中的发送私信链接。

```
                {% if user != current_user %}
                <p>
                    <a href="{{ url_for('main.send_message',
                                        recipient=user.username) }}">
                        {{ _('Send private message') }}
                    </a>
                </p>
                {% endif %}

```

### 查看私信

此功能的第二个重要部分是查看私信。为此，我将添加另一个位于 */messages* 的路由，其工作方式与首页和发现页非常相似，包括完整的分页支持：

*app/main/routes.py*：查看消息路由。

```
@bp.route('/messages')
@login_required
def messages():
    current_user.last_message_read_time = datetime.now(timezone.utc)
    db.session.commit()
    page = request.args.get('page', 1, type=int)
    query = current_user.messages_received.select().order_by(
        Message.timestamp.desc())
    messages = db.paginate(query, page=page,
                           per_page=current_app.config'POSTS_PER_PAGE',
                           error_out=False)
    next_url = url_for('main.messages', page=messages.next_num) \
        if messages.has_next else None
    prev_url = url_for('main.messages', page=messages.prev_num) \
        if messages.has_prev else None
    return render_template('messages.html', messages=messages.items,
                           next_url=next_url, prev_url=prev_url)

```

在这个视图函数中，我做的第一件事是将 `User.last_message_read_time` 字段更新为当前时间。这基本上是在标记所有发送给该用户的消息为已读。然后我查询 `Message` 模型以获取消息列表，按时间戳从新到旧排序。我决定在这里重用 `POSTS_PER_PAGE` 配置项，因为文章页面和消息页面看起来会非常相似，当然，如果页面设计有所不同，为消息添加单独的配置变量也是合理的。分页逻辑与我用于文章的逻辑相同，所以这些您应该都很熟悉。

上面的视图函数最后渲染了一个新的 */app/templates/messages.html* 模板文件，如下所示：

*app/templates/messages.html*：查看消息 HTML 模板。

```
{% extends "base.html" %}

{% block content %}
    <h1>{{ _('Messages') }}</h1>
    {% for post in messages %}
        {% include '_post.html' %}
    {% endfor %}
    <nav aria-label="...">
        <ul class="pager">
            <li class="previous{% if not prev_url %} disabled{% endif %}">
                <a href="{{ prev_url or '#' }}">
                    <span aria-hidden="true">&larr;</span> {{ _('Newer messages') }}
                </a>
            </li>
            <li class="next{% if not next_url %} disabled{% endif %}">
                <a href="{{ next_url or '#' }}">
                    {{ _('Older messages') }} <span aria-hidden="true">&rarr;</span>
                </a>
            </li>
        </ul>
    </nav>
{% endblock %}

```

这里我使用了另一个小技巧。我注意到 `Post` 和 `Message` 实例的结构几乎相同，唯一的区别是 `Message` 多了一个 `recipient` 关系（我在消息页面中不需要显示它，因为它始终是当前用户）。所以我决定重用 *app/templates/_post.html* 子模板来渲染私信。因此，这个模板使用了奇怪的 for 循环 `for post in messages`，这样子模板中对 `post` 的所有引用也同样适用于消息。

为了让用户能够访问新的视图函数，导航栏添加了一个新的"消息"链接：

*app/templates/base.html*：导航栏中的消息链接。

```
                    {% if current_user.is_anonymous %}
                    ...
                    {% else %}
                    <li class="nav-item">
                        <a class="nav-link" aria-current="page"
                                href="{{ url_for('main.messages') }}">
                            {{ _('Messages') }}
                        </a>
                    </li>
                    ...
                    {% endif %}

```

该功能现已完成，但在所有这些更改中，有几个地方添加了新文本，需要纳入语言翻译。第一步是更新所有语言目录：

```
(venv) $ flask translate update

```

然后，*app/translations* 中的每种语言都需要更新其 *messages.po* 文件以包含新的翻译。您可以在本项目的 GitHub 仓库或下载的 zip 文件中找到西班牙语翻译。

## 静态消息通知徽章

现在私信功能已经实现，但没有任何东西可以告诉用户有待阅读的私信。导航栏指示器的最简单实现可以渲染为基本模板的一部分，使用 Bootstrap 徽章组件：

*app/templates/base.html*：导航栏中的静态消息计数徽章。

```
                    ...
                    <li class="nav-item">
                        <a class="nav-link" aria-current="page"
                                href="{{ url_for('main.messages') }}">
                            {{ _('Messages') }}
                            {% set unread_message_count = current_user.unread_message_count() %}
                            <span class="badge text-bg-danger">
                                {{ unread_message_count }}
                            </span>
                        </a>
                    </li>
                    ...

```

这里，我直接从模板中调用了添加到 `User` 模型的 `unread_message_count()` 方法，并将该数字存储在同名的模板变量中。然后，如果该变量非零，我就在消息链接旁边添加带有该数字的徽章。页面上显示的效果如下：

## 动态消息通知徽章

上一节中介绍的解决方案是一种简单且不错的通知显示方式，但其缺点在于徽章只有在加载新页面时才会出现。如果用户在一页上花很长时间阅读内容而不点击任何链接，那么在此期间到达的新消息将不会显示，直到用户最终点击链接并加载新页面。

为了让我的应用对用户更有用，我希望徽章能够自动更新未读消息的数量，而无需用户点击链接和加载新页面。上一节的解决方案有一个问题：只有当页面加载时的消息计数非零时，徽章才会被渲染到页面中。更实用的做法是将徽章始终包含在导航栏中，并在消息计数为零时将其标记为隐藏。这样，使用 JavaScript 就可以轻松地使徽章可见：

*app/templates/base.html*：对 JavaScript 友好的未读消息徽章。

```
                    <li class="nav-item">
                        <a class="nav-link" aria-current="page"
                                href="{{ url_for('main.messages') }}">
                            {{ _('Messages') }}
                            {% set unread_message_count = current_user.unread_message_count() %}
                            <span id="message_count" class="badge text-bg-danger"
                                style="visibility: {% if unread_message_count %}visible
                                                   {% else %}hidden{% endif %};">
                                {{ unread_message_count }}
                            </span>
                        </a>
                    </li>

```

使用此版本的徽章，我始终包含它，但 `visibility` CSS 属性在 `unread_message_count` 非零时设置为 `visible`，为零时设置为 `hidden`。我还为表示徽章的 `<span>` 元素添加了一个 `id` 属性，以便通过 `document.getElementById('message_count')` 轻松定位该元素。

接下来，我可以编写一个简短的 JavaScript 函数，将此徽章更新为新的数字：

*app/templates/base.html*：导航栏中的静态消息计数徽章。

```
...
{% block scripts %}
  <script>
    // ...

    function set_message_count(n) {
      const count = document.getElementById('message_count');
      count.innerText = n;
      count.style.visibility = n ? 'visible' : 'hidden';
    }
  </script>
{% endblock %}

```

这个新的 `set_message_count()` 函数将设置徽章元素中的消息数量，并调整可见性，使徽章在计数为 0 时隐藏，否则可见。

## 向客户端传递通知

现在剩下的工作是添加一种机制，使客户端能够定期接收关于用户未读消息数量的更新。当发生这些更新时，客户端将调用 `set_message_count()` 函数来让用户知道更新。

实际上有两种方法可以让服务器向客户端传递这些更新，正如您可能猜到的，两者各有利弊，因此选择哪一种很大程度上取决于项目。在第一种方法中，客户端通过发送异步请求定期向服务器询问更新。该请求的响应是一个更新列表，客户端可以用它来更新页面的不同元素，例如未读消息计数徽章。第二种方法需要在客户端和服务器之间建立一种特殊类型的连接，允许服务器自由地向客户端推送数据。请注意，无论采用哪种方法，我都希望将通知视为通用实体，这样我就可以扩展此框架以支持除未读消息徽章之外的其他类型事件。

第一种方案最大的优点是易于实现。我只需要再向应用添加一个路由，比如 */notifications*，它返回一个 JSON 格式的通知列表。然后，客户端应用程序遍历通知列表，并对每个通知应用必要的页面更改。这种解决方案的缺点在于，实际事件和其通知之间会存在延迟，因为客户端会定期请求通知列表。例如，如果客户端每 10 秒请求一次通知，则通知最多可能延迟 10 秒才被接收。

第二种解决方案需要在协议层面进行更改，因为 HTTP 没有规定服务器可以在客户端未请求的情况下向客户端发送数据。目前，实现服务器发起消息的最常见方式是通过扩展服务器以支持 WebSocket 连接（除了 HTTP 之外）。WebSocket 是一种协议，与 HTTP 不同，它在服务器和客户端之间建立永久连接。服务器和客户端都可以随时向对方发送数据，而无需对方请求。这种机制的优点是，每当发生对客户端感兴趣的事件时，服务器可以立即发送通知，没有任何延迟。缺点是 WebSocket 需要比 HTTP 更复杂的设置，因为服务器需要与每个客户端保持永久连接。想象一下，例如，一个有四个工作进程的服务器通常可以服务几百个 HTTP 客户端，因为 HTTP 连接是短暂的并且不断被回收。同样的服务器只能处理四个 WebSocket 客户端，这在绝大多数情况下是不够的。正是由于这个限制，WebSocket 应用通常围绕*异步服务器*设计，因为这些服务器在管理大量工作进程和活动连接方面更有效率。

好消息是，无论您使用哪种方法，在客户端都会有一个回调函数，该函数将使用更新列表来调用。因此，我可以从第一种解决方案开始，它更容易实现，然后如果我发现它不够用，再迁移到 WebSocket 服务器，后者可以配置为调用相同的客户端回调。在我看来，对于这类应用，第一种解决方案实际上是可以接受的。基于 WebSocket 的实现对于需要近乎零延迟交付更新的应用才是有用的。

如果您好奇的话，Twitter 也使用第一种方法来实现其导航栏通知。Facebook 使用了一种称为长轮询的变体，它在仍然使用 HTTP 请求的同时解决了直接轮询的一些限制。Stack Overflow 和 Trello 是两个使用 WebSocket 实现通知的网站。您可以通过浏览器的调试器中的"网络"选项卡查看任何网站上发生的后台活动类型。

那么，让我们来实现轮询解决方案吧。首先，我将添加一个新模型来跟踪所有用户的通知，并在用户模型中添加一个关系。

*app/models.py*：Notification 模型。

```
import json
from time import time

# ...

class User(UserMixin, db.Model):
    # ...
    notifications: so.WriteOnlyMapped'Notification' = so.relationship(
        back_populates='user')

    # ...

class Notification(db.Model):
    id: so.Mappedint = so.mapped_column(primary_key=True)
    name: so.Mappedstr = so.mapped_column(sa.String(128), index=True)
    user_id: so.Mappedint = so.mapped_column(sa.ForeignKey(User.id),
                                               index=True)
    timestamp: so.Mappedfloat = so.mapped_column(index=True, default=time)
    payload_json: so.Mappedstr = so.mapped_column(sa.Text)

    user: so.MappedUser = so.relationship(back_populates='notifications')

    def get_data(self):
        return json.loads(str(self.payload_json))

```

一个通知将有一个名称、一个关联用户、一个 Unix 时间戳和一个负载。时间戳从 `time.time()` 函数获取其默认值。负载对于每种通知类型都不同，所以我将其写为 JSON 字符串，因为这样我可以编写列表、字典或单个值（如数字或字符串）。我添加了 `get_data()` 方法作为便利方法，以便调用者不必担心 JSON 反序列化。

这些更改需要包含在新的数据库迁移中：

```
(venv) $ flask db migrate -m "notifications"
(venv) $ flask db upgrade

```

为了方便起见，我将把新的 `Message` 和 `Notification` 模型添加到 shell 上下文中，这样当我使用 `flask shell` 命令启动 shell 时，模型类会自动导入：

*microblog.py*：将 Message 模型添加到 shell 上下文。

```
# ...
from app.models import User, Post, Message, Notification

# ...

@app.shell_context_processor
def make_shell_context():
    return {'sa': sa, 'so': so, 'db': db, 'User': User, 'Post': Post,
            'Message': Message, 'Notification': Notification}

```

我还将在用户模型中添加一个 `add_notification()` 辅助方法，以便更容易地处理这些对象：

*app/models.py*：Notification 模型。

```
class User(UserMixin, db.Model):
    # ...

    def add_notification(self, name, data):
        db.session.execute(self.notifications.delete().where(
            Notification.name == name))
        n = Notification(name=name, payload_json=json.dumps(data), user=self)
        db.session.add(n)
        return n

```

此方法不仅向数据库添加用户通知，还确保如果已经存在同名的通知，则先将其删除。您之前已经看到，只写关系可以通过调用 `select()` 方法来查询。`delete()` 方法返回关系的一个删除查询，它会删除所有元素而无需加载它们。通过添加 `where()` 子句，我指定了要删除的关系中的确切元素。我即将使用的通知将被称为 `unread_message_count`。如果数据库中已经有一个同名的通知，例如值为 3，那么当用户收到新消息且消息计数变为 4 时，我希望替换旧的通知。

在任何未读消息计数发生变化的地方，我需要调用 `add_notification()` 来更新用户的通知。有两个地方会发生变化。首先，当用户收到新的私信时，在 `send_message()` 视图函数中：

*app/main/routes.py*：更新用户通知。

```
@bp.route('/send_message/<recipient>', methods='GET', 'POST')
@login_required
def send_message(recipient):
    # ...
    if form.validate_on_submit():
        # ...
        user.add_notification('unread_message_count',
                              user.unread_message_count())
        db.session.commit()
        # ...
    # ...

```

第二个需要通知用户的地方是当用户访问消息页面时，此时未读计数归零：

*app/main/routes.py*：查看消息路由。

```
@bp.route('/messages')
@login_required
def messages():
    current_user.last_message_read_time = datetime.now(timezone.utc)
    current_user.add_notification('unread_message_count', 0)
    db.session.commit()
    # ...

```

现在所有用户的通知都维护在数据库中，我可以添加一个新路由，客户端可以使用它来获取登录用户的通知：

*app/main/routes.py*：通知视图函数。

```
from app.models import Notification

# ...

@bp.route('/notifications')
@login_required
def notifications():
    since = request.args.get('since', 0.0, type=float)
    query = current_user.notifications.select().where(
        Notification.timestamp > since).order_by(Notification.timestamp.asc())
    notifications = db.session.scalars(query)
    return {
        'name': n.name,
        'data': n.get_data(),
        'timestamp': n.timestamp
    } for n in notifications

```

这是一个相对简单的函数，返回一个包含用户通知列表的 JSON 负载。每个通知以包含三个元素的字典形式给出：通知名称、与该通知相关的附加数据（如消息计数）以及时间戳。通知按创建顺序从旧到新传递。

我不希望客户端收到重复的通知，所以我给它们提供了仅请求自给定时间以来的通知的选项。`since` 选项可以包含在请求 URL 的查询字符串中，以浮点数形式提供开始时间的 Unix 时间戳。如果包含此参数，将只返回此时间之后发生的通知。

完成此功能的最后一部分是在客户端实现实际的轮询。最好的位置是在基本模板中，这样所有页面都会自动继承此行为：

*app/templates/base.html*：轮询通知。

```
...
{% block scripts %}
  <script>
    // ...

    {% if current_user.is_authenticated %}
    function initialize_notifications() {
      let since = 0;
      setInterval(async function() {
        const response = await fetch('{{ url_for('main.notifications') }}?since=' + since);
        const notifications = await response.json();
        for (let i = 0; i < notifications.length; i++) {
          if (notificationsi.name == 'unread_message_count')
            set_message_count(notificationsi.data);
          since = notificationsi.timestamp;
        }
      }, 10000);
    }
    document.addEventListener('DOMContentLoaded', initialize_notifications);
    {% endif %}
  </script>

```

此函数被包裹在模板条件语句中，因为我只想在用户登录时轮询新消息。对于未登录的用户，此函数将不会被包含，因为他们无法接收通知。

您已经在第20章中看到过 `DOMContentLoaded` 事件。这是注册一个在页面加载后执行的函数的方式。对于这个功能，我需要在页面加载时设置一个定时器来获取用户的通知。您也见过 `setTimeout()` JavaScript 函数，它会在指定时间后运行作为参数给出的函数。`setInterval()` 函数使用与 `setTimeout()` 相同的参数，但不会只触发一次定时器，而是以固定的时间间隔持续调用回调函数。在这里，我的间隔设置为 10 秒（以毫秒为单位），因此徽章的更新分辨率大约为每分钟六次。

与间隔定时器关联的函数使用 `fetch()` 向新的通知路由发出 Ajax 请求。当此调用返回时，它会遍历通知列表。当收到名为 `unread_message_count` 的通知时，会通过调用上面定义的函数来调整消息计数徽章，参数为通知中给出的计数。

我处理 `since` 参数的方式可能令人困惑。我开始时将此参数初始化为 0。该参数始终包含在请求 URL 中，但我不能像以前那样使用 Flask 的 `url_for()` 来生成查询字符串，因为 `url_for()` 只在服务器上运行一次，而我需要 `since` 参数动态更新。第一次请求将发送到 */notifications?since=0*，但一旦我收到通知，我就会将 `since` 更新为其时间戳。这确保了我不会收到重复的通知，因为我总是请求接收自上次看到的通知之后发生的通知。还需要注意，我将 `since` 变量声明在间隔函数外部，因为我不希望它成为局部变量，我希望所有调用都使用同一个变量。

最简单的测试方法是使用两个不同的浏览器。使用不同的用户在两台浏览器上登录 Microblog。然后，从其中一台浏览器向另一用户发送一条或多条消息。另一台浏览器的导航栏应在 10 秒内更新以显示您发送的消息计数。当您点击消息链接时，未读消息计数将重置为零。

继续进入下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
