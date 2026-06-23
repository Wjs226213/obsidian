# 第23部分：应用程序编程接口

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxiii-application-programming-interfaces-apis](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxiii-application-programming-interfaces-apis) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第二十三篇也是最后一篇文章，我将在此告诉您如何为 microblog 扩展一个应用程序编程接口（或称 API），客户端可以通过比传统 Web 浏览器工作流程更直接的方式使用该接口与应用程序交互。

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

- 第21章：用户通知

- 第22章：后台任务

- 第23章：应用程序编程接口（API）（本文）

到目前为止，我为这个应用程序构建的所有功能都是针对一种特定类型的客户端：Web 浏览器。但其他类型的客户端呢？例如，如果我想构建一个 Android 或 iOS 应用，我有两种主要方式来实现。最简单的解决方案是构建一个简单的应用，其中只有一个填充整个屏幕的 Web 视图组件，加载 Microblog 网站，但这比在设备的 Web 浏览器中打开应用程序几乎没有任何优势。一个更好的解决方案（尽管耗时得多）是构建一个原生应用，但这个应用如何与只返回 HTML 页面的服务器交互呢？

这就是应用程序编程接口（或 API）可以帮助解决的领域。API 是一组 HTTP 路由，设计为应用程序的低级入口点。API 不定义返回 HTML 供 Web 浏览器消费的路由和视图函数，而是允许客户端直接操作应用程序的*资源*，将如何向用户呈现信息的决定完全留给客户端。例如，Microblog 中的 API 可以向客户端提供用户和博客文章信息，也可以允许用户编辑现有的博客文章，但仅限于数据层面，而不将这些逻辑与 HTML 混合。

如果您研究一下当前在应用程序中定义的所有路由，您会注意到有一些路由符合我上面使用的 API 定义。您找到了吗？我说的是那些返回 JSON 的少数路由，例如第14章中定义的 */translate* 路由。这是一个接受文本、源语言和目标语言的路由，所有内容都以 `POST` 请求的 JSON 格式提供。此请求的响应是该文本的翻译，也以 JSON 格式返回。服务器只返回请求的信息，将如何向用户呈现此信息的责任留给客户端。

虽然应用程序中的 JSON 路由具有 API 的"感觉"，但它们是为了支持在浏览器中运行的 Web 应用程序而设计的。考虑一下，如果智能手机应用想要使用这些路由，它将无法使用，因为它们需要登录用户，而登录只能通过 HTML 表单进行。在本章中，我将展示如何构建不依赖 Web 浏览器并且不对连接的是哪种客户端做任何假设的 API。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## REST 作为 API 设计的基础

有些人可能强烈不同意我上面的说法，即 */translate* 和其他 JSON 路由是 API 路由。其他人可能会同意，但附带说明认为它们是一个设计糟糕的 API。那么，一个设计良好的 API 有哪些特征，为什么 JSON 路由不属于这一类别？

您可能听说过 REST API 这个术语。REST 代表 Representational State Transfer（表现层状态转移），是 Roy Fielding 博士在其博士论文中提出的一种架构。在他的工作中，Fielding 博士以相当抽象和通用的方式提出了 REST 的六个定义性特征。

除了 Fielding 博士的论文之外，REST 没有权威规范，这给读者留下了很多解释空间。关于给定的 API 是否符合 REST 的争论，经常成为 REST"纯粹主义者"和 REST"实用主义者"之间激烈辩论的话题。前者认为 REST API 必须遵守所有六个特征，并且必须以非常特定的方式做到这一点；后者则将 Fielding 博士在其论文中提出的思想视为指导方针或建议。Fielding 博士本人站在纯粹主义者一边，并在他博客文章和在线评论中提供了一些关于其愿景的额外见解。

目前绝大多数已实现的 API 都遵循"实用主义"的 REST 实现。这包括大多数"大公司"的 API，如 Facebook、GitHub、Twitter 等。很少有公共 API 被一致认为是纯粹的 REST，因为大多数 API 缺少某些纯粹主义者认为是必备的实现细节。尽管 Fielding 博士和其他 REST 纯粹主义者对什么是或不是 REST API 持有严格观点，但在软件行业中，以实用主义的意义来引用 REST 是很常见的。

为了让您了解 REST 论文的内容，以下各节描述了 Fielding 博士列举的六项原则。

### 客户端-服务器

客户端-服务器原则相当直接，因为它只是说明在 REST API 中，客户端和服务器的角色应该明确区分。在实践中，这意味着客户端和服务器位于不同的进程中，通过传输层进行通信，在大多数情况下，这是基于 TCP 网络的 HTTP 协议。

### 分层系统

分层系统原则说明，当客户端需要与服务器通信时，它可能最终连接到一个中间节点而不是实际的服务器。其思想是，对于客户端来说，如果没有直接连接到服务器，其发送请求的方式应该完全没有区别；事实上，它甚至可能不知道自己是连接到了目标服务器还是没有。同样，该原则规定，服务器可能从中间节点接收客户端请求，而不是直接从客户端接收，因此服务器绝不能假设连接的另一端是客户端。

这是 REST 的一个重要特性，因为能够添加中间节点允许应用程序架构师设计大型而复杂的网络，通过使用负载均衡器、缓存、代理服务器等来满足大量请求。

### 缓存

这一原则扩展了分层系统，明确指示允许服务器或中间节点缓存经常收到的请求的响应，以提高系统性能。您可能熟悉的一种缓存的实现：在所有的 Web 浏览器中。Web 浏览器缓存层通常用于避免必须反复请求相同文件（例如图像）。

对于 API 的目的，目标服务器需要通过使用*缓存控制*来指示响应在返回客户端的途中是否可以被中间节点缓存。请注意，由于安全原因，部署到生产环境的 API 必须使用加密，因此缓存通常不会在中间节点上进行，除非该节点*终止* SSL 连接，或执行解密和重新加密。

### 按需代码

这是一个可选要求，规定服务器可以在响应中向客户端提供可执行代码。由于这一原则要求服务器和客户端就已达成协议，确定客户端能够运行哪种类型的可执行代码，因此它在 API 中很少使用。您可能会认为服务器可以为 Web 浏览器客户端返回 JavaScript 代码来执行，但 REST 并非专门针对 Web 浏览器客户端。例如，执行 JavaScript 可能会在客户端是 iOS 或 Android 设备时引入复杂性。

### 无状态

无状态原则是 REST 纯粹主义者和实用主义者之间大多数辩论的两个核心原则之一。它规定 REST API 不应保存任何客户端状态以供每次特定客户端发送请求时调用。这意味着 Web 开发中常见的那些用于在用户浏览应用程序页面时"记住"用户的机制都不能使用。在无状态 API 中，每个请求都需要包含服务器识别和验证客户端以及执行请求所需的信息。这也意味着服务器不能将任何与客户端连接相关的数据存储在数据库或其他形式的存储中。

如果您想知道为什么 REST 要求无状态服务器，主要原因是无状态服务器非常容易扩展，您只需在负载均衡器后面运行多个服务器实例即可。如果服务器存储客户端状态，事情就会变得更加复杂，因为您必须弄清楚多个服务器如何访问和更新该状态，或者确保特定客户端始终由同一台服务器处理，这通常被称为*粘性会话*。

如果您再次考虑本章引言中讨论的 */translate* 路由，您会发现它不能被认为是 *RESTful* 的，因为与该路由关联的视图函数依赖于 Flask-Login 的 `@login_required` 装饰器，而后者又将用户的登录状态存储在 Flask 的用户会话中。

### 统一接口

最后一项、也是最重要、最具争议且最模糊的 REST 原则是统一接口。Fielding 博士列举了 REST 统一接口的四个区别性方面：唯一资源标识符、资源表示、自描述消息和超媒体。

唯一资源标识符通过为每个资源分配唯一的 URL 来实现。例如，与给定用户关联的 URL 可以是 */api/users/<user-id>*，其中 *<user-id>* 是数据库表主键中分配给用户的标识符。大多数 API 在这方面都实现得相当好。

使用资源表示意味着当服务器和客户端交换有关资源的信息时，它们必须使用约定好的格式。对于大多数现代 API，JSON 格式用于构建资源表示。API 可以选择支持多种资源表示格式，在这种情况下，HTTP 协议中的*内容协商*选项是客户端和服务器就双方都喜欢的格式达成一致的机制。

自描述消息意味着客户端和服务器之间交换的请求和响应必须包含对方所需的所有信息。作为一个典型示例，HTTP 请求方法用于指示客户端希望服务器执行什么操作。`GET` 请求表示客户端想要检索关于资源的信息，`POST` 请求表示客户端想要创建新资源，`PUT` 或 `PATCH` 请求定义对现有资源的修改，`DELETE` 表示移除资源的请求。目标资源被指示为请求 URL，附加信息在 HTTP 头、URL 的查询字符串部分或请求体中提供。

超媒体要求是这套原则中最具争议性的，很少有 API 实现它，而那些实现的 API 也极少以让 REST 纯粹主义者满意的方式实现。由于应用程序中的资源都是相互关联的，这一要求规定这些关系应该包含在资源表示中，以便客户端可以通过遍历关系来发现新资源，这与您通过点击链接从一个页面导航到下一个页面来发现 Web 应用程序中新页面的方式非常相似。其思想是客户端可以在没有任何关于资源先验知识的情况下进入 API，只需跟随超媒体链接即可了解它们。使这一要求实现复杂化的一个方面是，与 HTML 和 XML 不同，API 中常用于资源表示的 JSON 格式没有定义包含链接的标准方式，因此您被迫使用自定义结构，或尝试解决此差距的提议 JSON 扩展之一，例如 JSON-API、HAL、JSON-LD 或类似格式。

## 实现 API 蓝图

为了让您体验开发 API 涉及的内容，我将为 Microblog 添加一个 API。这将不是一个完整的 API，我将实现所有与用户相关的功能，将博客文章等其他资源的实现留给读者作为练习。

为了保持组织井然有序，并遵循我在第15章中描述的结构，我将创建一个新的蓝图来包含所有 API 路由。那么，让我们开始创建此蓝图所在的目录：

```
(venv) $ mkdir app/api

```

蓝图的 *__init__.py* 文件创建蓝图对象，与应用程序中的其他蓝图类似：

*app/api/__init__.py*：API 蓝图构造函数。

```
from flask import Blueprint

bp = Blueprint('api', __name__)

from app.api import users, errors, tokens

```

您可能还记得，有时需要将导入移到末尾以避免循环依赖错误。这就是为什么 *app/api/users.py*、*app/api/errors.py* 和 *app/api/tokens.py* 模块（我尚未编写）在蓝图创建之后才导入的原因。

API 的核心内容将存储在 *app/api/users.py* 模块中。下表总结了我将要实现的路由：

HTTP 方法
资源 URL
说明

`GET`
*/api/users/<id>*
返回一个用户。

`GET`
*/api/users*
返回所有用户的集合。

`GET`
*/api/users/<id>/followers*
返回该用户的关注者。

`GET`
*/api/users/<id>/following*
返回该用户正在关注的用户。

`POST`
*/api/users*
注册一个新用户账户。

`PUT`
*/api/users/<id>*
修改一个用户。

现在我将创建一个骨架模块，为所有这些路由提供占位符：

*app/api/users.py*：用户 API 资源占位符。

```
from app.api import bp

@bp.route('/users/<int:id>', methods='GET')
def get_user(id):
    pass

@bp.route('/users', methods='GET')
def get_users():
    pass

@bp.route('/users/<int:id>/followers', methods='GET')
def get_followers(id):
    pass

@bp.route('/users/<int:id>/following', methods='GET')
def get_following(id):
    pass

@bp.route('/users', methods='POST')
def create_user():
    pass

@bp.route('/users/<int:id>', methods='PUT')
def update_user(id):
    pass

```

*app/api/errors.py* 模块将定义一些处理错误响应的辅助函数。但现在，我仍将使用稍后填充的占位符：

*app/api/errors.py*：错误处理占位符。

```
def bad_request():
    pass

```

*app/api/tokens.py* 是定义认证子系统的模块。这将为不是 Web 浏览器的客户端提供一种替代的登录方式。现在，我也为这个模块编写一个占位符：

*app/api/tokens.py*：令牌处理占位符。

```
def get_token():
    pass

def revoke_token():
    pass

```

新的 API 蓝图需要在应用工厂函数中注册：

*app/__init__.py*：将 API 蓝图注册到应用程序。

```
# ...

def create_app(config_class=Config):
    app = Flask(__name__)

    # ...

    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # ...

```

## 将用户表示为 JSON 对象

实现 API 时首先要考虑的是确定其资源的表示形式。我将实现一个与用户交互的 API，因此我需要决定用户资源的表示形式。经过一番思考，我想出了以下 JSON 表示：

```
{
    "id": 123,
    "username": "susan",
    "password": "my-password",
    "email": "susan@example.com",
    "last_seen": "2021-06-20T15:04:27+00:00",
    "about_me": "Hello, my name is Susan!",
    "post_count": 7,
    "follower_count": 35,
    "following_count": 21,
    "_links": {
        "self": "/api/users/123",
        "followers": "/api/users/123/followers",
        "following": "/api/users/123/following",
        "avatar": "https://www.gravatar.com/avatar/..."
    }
}

```

许多字段直接来自用户数据库模型。`password` 字段很特殊，它只会在注册新用户时使用。正如您从第5章中回忆的，用户密码不存储在数据库中，只存储哈希值，因此永远不会返回密码。`email` 字段也受到特殊对待，因为我不想暴露用户的电子邮件地址。`email` 字段只会在用户请求自己的条目时返回，但在他们检索其他用户的条目时不会返回。`post_count`、`follower_count` 和 `following_count` 字段是"虚拟"字段，它们不作为数据库中的字段存在，而是作为便利提供给客户端。这是一个很好的示例，展示了资源表示不需要与服务器中实际资源的定义方式相匹配。

注意 `_links` 部分，它实现了超媒体要求。定义的链接包括当前资源的链接、关注此用户的用户列表的链接、此用户关注的用户列表的链接，以及用户头像图像的链接。将来，如果我决定将文章添加到这个 API，这里还应该包含指向该用户文章列表的链接。

JSON 格式的一个好处是它总是可以转换为 Python 字典或列表的表示形式。Python 标准库中的 `json` 包负责将 Python 数据结构与 JSON 之间进行转换。因此，为了生成这些表示，我将在 `User` 模型中添加一个名为 `to_dict()` 的方法，它返回一个 Python 字典：

*app/models.py*：User 模型到表示。

```
from flask import url_for
# ...

class User(UserMixin, db.Model):
    # ...

    def posts_count(self):
        query = sa.select(sa.func.count()).select_from(
            self.posts.select().subquery())
        return db.session.scalar(query)

    def to_dict(self, include_email=False):
        data = {
            'id': self.id,
            'username': self.username,
            'last_seen': self.last_seen.replace(
                tzinfo=timezone.utc).isoformat() if self.last_seen else None,
            'about_me': self.about_me,
            'post_count': self.posts_count(),
            'follower_count': self.followers_count(),
            'following_count': self.following_count(),
            '_links': {
                'self': url_for('api.get_user', id=self.id),
                'followers': url_for('api.get_followers', id=self.id),
                'following': url_for('api.get_following', id=self.id),
                'avatar': self.avatar(128)
            }
        }
        if include_email:
            data'email' = self.email
        return data

```

这个方法应该基本不言自明。我确定的用户表示字典被简单地生成并返回。为了计算文章、关注者和正在关注的数量，我使用了辅助方法，并为文章计数添加了一个我之前从未需要的方法。正如我上面提到的，`email` 字段需要特殊处理，因为我只想在用户请求自己的数据时包含电子邮件。因此，我使用 `include_email` 标志来确定该字段是否包含在表示中。

注意 `last_seen` 字段是如何生成的。对于日期和时间字段，我将使用 ISO 8601 格式，Python 的 `datetime` 可以通过 `isoformat()` 方法生成该格式。但由于 SQLAlchemy 使用原始的 `datetime` 对象（是 UTC 但未在状态中记录时区），我需要先设置时区，以确保它包含在 ISO 8601 字符串中。

最后，看看我是如何实现超媒体链接的。对于指向其他应用程序路由的三个链接，我使用 `url_for()` 生成 URL（这些 URL 目前指向我在 *app/api/users.py* 中定义的占位符视图函数）。头像链接是特殊的，因为它是一个 Gravatar URL，位于应用程序外部。对于这个链接，我使用与在网页中渲染头像相同的 `avatar()` 方法。

`to_dict()` 方法将用户对象转换为 Python 表示，然后将转换为 JSON。我还需要研究反向过程，即客户端在请求中传递用户表示，服务器需要解析它并将其转换为 `User` 对象。以下是从 Python 字典到模型的 `from_dict()` 方法：

*app/models.py*：从表示到 User 模型。

```
class User(UserMixin, db.Model):
    # ...

    def from_dict(self, data, new_user=False):
        for field in 'username', 'email', 'about_me':
            if field in data:
                setattr(self, field, datafield)
        if new_user and 'password' in data:
            self.set_password(data'password')

```

在这种情况下，我决定使用循环来导入客户端可以设置的字段，包括 `username`、`email` 和 `about_me`。对于每个字段，我检查 `data` 参数中是否提供了值，如果有，我使用 Python 的 `setattr()` 在对象的对应属性中设置新值。

`password` 字段被作为特殊情况处理，因为它不是对象中的字段。`new_user` 参数确定这是否为新用户注册，这意味着包含 `password`。为了在用户模型中设置密码，我调用 `set_password()` 方法，该方法会创建密码哈希。

## 表示用户集合

除了处理单个资源表示外，此 API 还需要集合的表示。例如，这将是客户端请求用户列表或关注者列表时使用的格式。以下是用户集合的表示：

```
{
    "items": 
        { ... user resource ... },
        { ... user resource ... },
        ...
    ,
    "_meta": {
        "page": 1,
        "per_page": 10,
        "total_pages": 20,
        "total_items": 195
    },
    "_links": {
        "self": "http://localhost:5000/api/users?page=1",
        "next": "http://localhost:5000/api/users?page=2",
        "prev": null
    }
}

```

在这种表示中，`items` 是用户资源的列表，每个资源按照上一节所述定义。`_meta` 部分包含集合的元数据，客户端可能在呈现分页控件时会觉得有用。`_links` 部分定义了相关链接，包括指向集合本身的链接以及上一页和下一页的链接，也用于帮助客户端进行分页。

由于分页逻辑的存在，生成用户集合的表示有些棘手，但该逻辑对于我将来可能添加到此 API 的其他资源来说是通用的，因此我将以通用的方式实现这种表示，以便以后可以应用于其他模型。在第16章中，我遇到了类似的情况，涉及全文搜索索引，这是另一个我希望以通用方式实现以便应用于任何模型的功能。我使用的解决方案是实现了一个 `SearchableMixin` 类，任何需要全文索引的模型都可以继承它。我将对这里采用相同的思路，因此这是一个名为 `PaginatedAPIMixin` 的新 mixin 类：

*app/models.py*：分页表示 mixin 类。

```
class PaginatedAPIMixin(object):
    @staticmethod
    def to_collection_dict(query, page, per_page, endpoint, **kwargs):
        resources = db.paginate(query, page=page, per_page=per_page,
                                error_out=False)
        data = {
            'items': item.to_dict() for item in resources.items,
            '_meta': {
                'page': page,
                'per_page': per_page,
                'total_pages': resources.pages,
                'total_items': resources.total
            },
            '_links': {
                'self': url_for(endpoint, page=page, per_page=per_page,
                                **kwargs),
                'next': url_for(endpoint, page=page + 1, per_page=per_page,
                                **kwargs) if resources.has_next else None,
                'prev': url_for(endpoint, page=page - 1, per_page=per_page,
                                **kwargs) if resources.has_prev else None
            }
        }
        return data

```

`to_collection_dict()` 方法生成一个包含用户集合表示的字典，包括 `items`、`_meta` 和 `_links` 部分。您可能需要仔细查看该方法以理解其工作原理。前三个参数是一个 SQLAlchemy 查询、一个页码和一个页面大小。这些参数决定了将返回哪些项目。该实现使用 Flask-SQLAlchemy 的 `db.paginate()` 方法来获取一页项目，就像我在 Web 应用程序的首页、发现页和个人资料页中对文章所做的那样。

复杂的部分在于生成链接，包括自引用以及指向下一页和前一页的链接。我希望使这个函数通用，因此我不能例如使用 `url_for('api.get_users', id=id, page=page)` 来生成自链接。`url_for()` 的参数将取决于特定的资源集合，因此我将依赖调用者传入 `endpoint` 参数，该参数是在 `url_for()` 调用中需要使用的视图函数。由于应用程序中的许多路由需要参数，我还需要在 `kwargs` 中捕获任何额外的路由参数，并将它们也传递给 `url_for()`。`page` 和 `per_page` 查询字符串参数是显式给出的，因为它们控制所有 API 路由的分页。

这个 mixin 类需要作为父类添加到 `User` 模型中：

*app/models.py*：将 PaginatedAPIMixin 添加到 User 模型。

```
class User(PaginatedAPIMixin, UserMixin, db.Model):
    # ...

```

对于集合的情况，我不需要反向方向，因为我不打算有任何需要客户端发送用户列表的路由。如果项目要求客户端发送用户集合，我还需要实现 `from_collection_dict()` 方法。

## 错误处理

我在第7章中定义的错误页面仅适用于使用 Web 浏览器与应用程序交互的用户。当 API 需要返回错误时，它需要是"机器友好"的错误类型，是客户端应用程序可以轻松解释的。因此，与我以 JSON 格式定义 API 资源的表示方式类似，现在我决定为 API 错误消息定义一个表示形式。以下是我要使用的基本结构：

```
{
    "error": "short error description",
    "message": "error message (optional)"
}
```

除了错误的负载之外，我还将使用 HTTP 协议的状态码来指示错误的一般类别。为了帮助我生成这些错误响应，我将在 *app/api/errors.py* 中编写 `error_response()` 函数：

*app/api/errors.py*：错误响应。

```
from werkzeug.http import HTTP_STATUS_CODES

def error_response(status_code, message=None):
    payload = {'error': HTTP_STATUS_CODES.get(status_code, 'Unknown error')}
    if message:
        payload'message' = message
    return payload, status_code

```

此函数使用了 Werkzeug（Flask 的核心依赖）中方便的 `HTTP_STATUS_CODES` 字典，它为每个 HTTP 状态码提供了简短的描述性名称。我将这些名称用于我的错误表示中的 `error` 字段，这样我只需要关心数字状态码和可选的详细描述。该表示被返回给 Flask，Flask 会将其转换为 JSON 并发送给客户端。添加了第二个返回值（错误的状态码），以覆盖 Flask 发送响应时默认的状态码 200（表示"OK"的 HTTP 状态码）。

API 将返回的最常见错误是状态码 400，表示"错误请求"。当客户端发送包含无效数据的请求时，会使用此错误。为了使生成此错误更加容易，我将添加一个专用函数，它只需要详细的描述性消息作为参数。这是我之前添加的 `bad_request()` 占位符：

*app/api/errors.py*：错误请求响应。

```
# ...

def bad_request(message):
    return error_response(400, message)

```

API 蓝图可能会生成各种错误，Flask 默认会将这些错误渲染为 HTML 错误页面。为了确保来自 API 蓝图的所有错误都返回 JSON 格式的响应，我可以安装一个兜底错误处理程序：

*app/api/errors.py*：API 错误的兜底处理。

```
from werkzeug.exceptions import HTTPException
from app.api import bp

# ...

@bp.errorhandler(HTTPException)
def handle_exception(e):
    return error_response(e.code)

```

API 蓝图的 `errorhandler()` 装饰器现在将被调用，以处理基于 `HTTPException` 类的所有错误，Flask 使用该类处理所有 HTTP 错误。

## 用户资源端点

处理用户 JSON 表示所需的支持现已完成，因此我准备开始编写 API 端点。

### 检索用户

让我们从按 `id` 检索单个用户的请求开始：

*app/api/users.py*：返回一个用户。

```
from app.models import User

@bp.route('/users/<int:id>', methods='GET')
def get_user(id):
    return db.get_or_404(User, id).to_dict()

```

视图函数接收请求用户的 `id` 作为 URL 中的动态参数。Flask-SQLAlchemy 的 `db.get_or_404()` 辅助函数返回具有给定 `id` 的模型（如果存在），但如果 `id` 不存在，它会中止请求并向客户端返回 404 错误，而不是返回 `None`。这很方便，因为它消除了检查查询结果的需要，简化了视图函数中的逻辑。

最后，我添加到 `User` 的 `to_dict()` 方法用于生成所选用户的资源表示字典，Flask 在将其返回给客户端时会自动转换为 JSON。

如果您想看看这第一个 API 路由是如何工作的，启动服务器，然后在浏览器地址栏中输入以下 URL：

```
http://localhost:5000/api/users/1

```

这应该会显示第一个用户，以 JSON 格式渲染。也可以尝试使用一个很大的 `id` 值，看看 SQLAlchemy 查询对象的 `get_or_404()` 方法是如何触发 404 错误的（我稍后将向您展示如何扩展错误处理，以便这些错误也以 JSON 格式返回）。

为了以更合适的方式测试这个新路由，我将安装 HTTPie，这是一个用 Python 编写的命令行 HTTP 客户端，可以轻松发送 API 请求：

```
(venv) $ pip install httpie

```

现在，我可以从终端使用以下命令请求 `id` 为 `1`（很可能是您自己）的用户信息：

```
(venv) $ http GET http://localhost:5000/api/users/1
HTTP/1.0 200 OK
Content-Length: 457
Content-Type: application/json
Date: Mon, 27 Jun 2021 20:19:01 GMT
Server: Werkzeug/2.0.1 Python/3.9.6

{
    "_links": {
        "avatar": "https://www.gravatar.com/avatar/993c...2724?d=identicon&s=128",
        "following": "/api/users/1/following",
        "followers": "/api/users/1/followers",
        "self": "/api/users/1"
    },
    "about_me": "Hello! I'm the author of the Flask Mega-Tutorial.",
    "following_count": 0,
    "following_count": 1,
    "id": 1,
    "last_seen": "2021-06-26T07:40:52.942865+00:00",
    "post_count": 10,
    "username": "miguel"
}

```

### 检索用户集合

要返回所有用户的集合，我现在可以依赖 `PaginatedAPIMixin` 的 `to_collection_dict()` 方法：

*app/api/users.py*：返回所有用户的集合。

```
import sqlalchemy as sa
from flask import request

# ...

@bp.route('/users', methods='GET')
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    return User.to_collection_dict(sa.select(User), page, per_page,
                                   'api.get_users')

```

对于这个实现，我首先从请求的查询字符串中提取 `page` 和 `per_page`，如果未定义，则分别使用默认值 1 和 10。`per_page` 参数有额外的逻辑，将其上限限制为 100。让客户端控制请求非常大的页面并不是一个好主意，因为这可能导致服务器的性能问题。`page` 和 `per_page` 参数然后被传递给 `to_collection_dict()` 方法，以及一个返回所有用户的查询。最后一个参数是 `api.get_users`，这是我在表示中使用的三个链接所需的端点名称。

要使用 HTTPie 测试这个端点，请使用以下命令：

```
(venv) $ http GET http://localhost:5000/api/users

```

接下来的两个端点是返回关注者和正在关注用户的端点。它们与上面的端点非常相似：

*app/api/users.py*：返回关注者和被关注用户。

```
@bp.route('/users/<int:id>/followers', methods='GET')
def get_followers(id):
    user = db.get_or_404(User, id)
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    return User.to_collection_dict(user.followers.select(), page, per_page,
                                   'api.get_followers', id=id)

@bp.route('/users/<int:id>/following', methods='GET')
def get_following(id):
    user = db.get_or_404(User, id)
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    return User.to_collection_dict(user.following.select(), page, per_page,
                                   'api.get_following', id=id)

```

由于这两个路由特定于某个用户，它们在 URL 中具有 `id` 动态参数。`id` 用于从数据库中获取用户，然后用于向 `to_collection_dict()` 方法提供 `user.followers` 和 `user.following` 关系查询。希望现在您能明白为什么花费一点额外时间以通用方式设计这个方法是非常值得的。`to_collection_dict()` 的最后两个参数是端点名称和 `id`，该方法将把 `id` 作为 `kwargs` 中的额外关键字参数，然后在生成表示的链接部分时将其传递给 `url_for()`。

与前面的示例类似，您可以像这样使用 HTTPie 测试这两个路由：

```
(venv) $ http GET http://localhost:5000/api/users/1/followers
(venv) $ http GET http://localhost:5000/api/users/1/following

```

我应该指出，得益于超媒体，您不需要记住这些 URL，因为它们包含在用户表示的 `_links` 部分中。

### 注册新用户

对 */users* 路由的 `POST` 请求将用于注册新用户账户。您可以在下面看到此路由的实现：

*app/api/users.py*：注册新用户。

```
from flask import url_for
from app import db
from app.api.errors import bad_request

@bp.route('/users', methods='POST')
def create_user():
    data = request.get_json()
    if 'username' not in data or 'email' not in data or 'password' not in data:
        return bad_request('must include username, email and password fields')
    if db.session.scalar(sa.select(User).where(
            User.username == data'username')):
        return bad_request('please use a different username')
    if db.session.scalar(sa.select(User).where(
            User.email == data'email')):
        return bad_request('please use a different email address')
    user = User()
    user.from_dict(data, new_user=True)
    db.session.add(user)
    db.session.commit()
    return user.to_dict(), 201, {'Location': url_for('api.get_user',
                                                     id=user.id)}

```

此请求将从客户端接受 JSON 格式的用户表示，该表示位于请求体中。Flask 提供 `request.get_json()` 方法从请求中提取 JSON 体，并将其作为 Python 结构返回。如果客户端发送的不是 JSON 格式的内容，此方法可能导致请求失败并返回 415 状态码（不支持的媒体类型）；如果 JSON 内容格式错误，则返回 400 状态码（错误请求），这两种情况都由 *app/api/errors.py* 中的 `handle_http_exception()` 处理程序处理。

在可以使用数据之前，我需要确保拥有所有信息，因此我首先检查三个必填字段是否都已包含。它们是 `username`、`email` 和 `password`。如果缺少任何一个，我就使用 *app/api/errors.py* 模块中的 `bad_request()` 辅助函数向客户端返回错误。除了检查之外，我还需要确保 `username` 和 `email` 字段没有被其他用户使用，因此我尝试通过提供的用户名和电子邮件从数据库加载用户，如果其中任何一个返回有效用户，我也会向客户端返回错误。

一旦我通过了数据验证，我就可以轻松创建用户对象并将其添加到数据库。为了创建用户，我依赖于 `User` 模型中的 `from_dict()` 方法。`new_user` 参数设置为 `True`，这样它也接受通常不属于用户表示的 `password` 字段。

我为此请求返回的响应将是新用户的表示，因此 `to_dict()` 生成该负载。创建资源的 `POST` 请求的状态码应为 201，这是用于已创建新实体的状态码。此外，HTTP 协议要求 201 响应包含一个 `Location` 头，设置为其新资源的 URL，我可以使用 `url_for()` 生成。

以下是通过 HTTPie 从命令行注册新用户的方法：

```
(venv) $ http POST http://localhost:5000/api/users username=alice password=dog \
    email=alice@example.com "about_me=Hello, my name is Alice."

```

### 编辑用户

我将在 API 中使用的最后一个端点是修改现有用户的端点：

*app/api/users.py*：修改用户。

```
@bp.route('/users/<int:id>', methods='PUT')
def update_user(id):
    user = db.get_or_404(User, id)
    data = request.get_json()
    if 'username' in data and data'username' != user.username and \
        db.session.scalar(sa.select(User).where(
            User.username == data'username')):
        return bad_request('please use a different username')
    if 'email' in data and data'email' != user.email and \
        db.session.scalar(sa.select(User).where(
            User.email == data'email')):
        return bad_request('please use a different email address')
    user.from_dict(data, new_user=False)
    db.session.commit()
    return user.to_dict()

```

对于此请求，我接收用户 `id` 作为 URL 的动态部分，因此我可以加载指定的用户，如果未找到则返回 404 错误。请注意，目前还没有认证，因此目前 API 允许用户更改任何其他用户的账户。这显然是一个安全问题，但我将在下一节中解决。

与创建新用户的情况类似，在我使用客户端提供的 `username` 和 `email` 字段之前，需要验证它们不会与其他用户冲突，但在这种情况下，验证更加棘手。首先，这些字段在此请求中是可选的，因此我需要检查字段是否存在。第二个复杂之处是客户端可能为它们提供相同的值，因此在检查用户名或电子邮件是否被占用之前，我需要确保它们与当前值不同。如果任何这些验证检查失败，那么我将像之前一样向客户端返回 400 错误。

数据验证通过后，我可以使用 `User` 模型的 `from_dict()` 方法导入客户端提供的所有数据，然后将更改提交到数据库。此请求的响应将更新后的用户表示返回给用户，使用默认的 200 状态码。

以下是一个使用 HTTPie 编辑 `about_me` 字段的示例请求：

```
(venv) $ http PUT http://localhost:5000/api/users/2 "about_me=Hi, I am Miguel"

```

## API 认证

我在上一节中添加的 API 端点目前对任何客户端都是开放的。显然，它们需要只对注册用户可用，为此我需要添加*身份认证*和*授权*，简称为"AuthN"和"AuthZ"。其思想是客户端发送的请求提供了某种标识，以使服务器知道客户端代表哪个用户，并可以验证该用户是否被允许执行所请求的操作。

保护这些 API 端点最明显的方法是使用 Flask-Login 的 `@login_required` 装饰器，但这种方法对 API 端点有一些问题。当装饰器检测到未经认证的用户时，它会将用户重定向到 HTML 登录页面。在 API 中没有 HTML 或登录页面的概念，如果客户端发送带有无效或缺失凭据的请求，服务器必须拒绝该请求，返回 401 状态码。服务器不能假设 API 客户端是 Web 浏览器，或它可以处理重定向，或它可以渲染和处理 HTML 登录表单。当 API 客户端收到 401 状态码时，它知道需要向用户请求凭据，但具体如何做实际上不是服务器的事情。

### 用户模型中的令牌

对于 API 身份认证需求，我将使用*令牌*认证方案。当客户端想要开始与 API 交互时，它需要请求一个临时令牌，使用用户名和密码进行身份认证。然后，在令牌有效期间，客户端可以在发送 API 请求时将该令牌作为认证信息传递。一旦令牌过期，就需要请求新的令牌。为了支持用户令牌，我将扩展 `User` 模型：

*app/models.py*：对用户令牌的支持。

```
from datetime import timedelta
import secrets

class User(PaginatedAPIMixin, UserMixin, db.Model):
    # ...
    token: so.MappedOptional[str] = so.mapped_column(
        sa.String(32), index=True, unique=True)
    token_expiration: so.MappedOptional[datetime]

    # ...

    def get_token(self, expires_in=3600):
        now = datetime.now(timezone.utc)
        if self.token and self.token_expiration.replace(
                tzinfo=timezone.utc) > now + timedelta(seconds=60):
            return self.token
        self.token = secrets.token_hex(16)
        self.token_expiration = now + timedelta(seconds=expires_in)
        db.session.add(self)
        return self.token

    def revoke_token(self):
        self.token_expiration = datetime.now(timezone.utc) - timedelta(
            seconds=1)

    @staticmethod
    def check_token(token):
        user = db.session.scalar(sa.select(User).where(User.token == token))
        if user is None or user.token_expiration.replace(
                tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return None
        return user

```

通过此更改，我为用户模型添加了一个 `token` 属性，并且由于我将需要通过它来搜索数据库，我将其设置为唯一且带索引。我还添加了 `token_expiration` 字段，其中包含令牌过期的日期和时间。这是为了确保令牌不会在很长一段时间内保持有效，这可能会成为安全风险。

我创建了三个方法来处理这些令牌。`get_token()` 方法返回用户的令牌。令牌使用 Python 标准库中的 `secrets.token_hex()` 函数生成。`token` 字段长度为 32 个字符，因此我必须向 `token_hex()` 传递 16，以便生成的令牌有 16 个字节，以十六进制渲染时使用 32 个字符。在创建新令牌之前，此方法检查当前分配的令牌是否至少还剩一分钟的有效期，如果是，则返回现有令牌。

在处理令牌时，最好有一个策略可以立即使令牌失效，而不是仅仅依赖过期日期。这是一个经常被忽视的安全最佳实践。`revoke_token()` 方法使当前分配给用户的令牌失效，只需将过期日期设置为当前时间之前的一秒。

`check_token()` 方法是一个静态方法，它接受一个令牌作为输入，并返回此令牌所属的用户作为响应。如果令牌无效或已过期，该方法返回 `None`。

因为我对数据库进行了更改，所以需要生成一个新的数据库迁移，然后升级数据库：

```
(venv) $ flask db migrate -m "user tokens"
(venv) $ flask db upgrade

```

### 令牌请求

当您编写 API 时，必须考虑到您的客户端不总是连接到 Web 应用程序的 Web 浏览器。API 的真正威力在于，当智能手机应用甚至基于浏览器的单页应用等独立客户端能够访问后端服务时。当这些专门的客户端需要访问 API 服务时，它们首先请求一个令牌，这相当于传统 Web 应用程序中的登录表单。

为了简化使用令牌认证时客户端和服务器之间的交互，我将使用一个名为 Flask-HTTPAuth 的 Flask 扩展。Flask-HTTPAuth 可以通过 pip 安装：

```
(venv) $ pip install flask-httpauth

```

Flask-HTTPAuth 支持几种不同的认证机制，都对 API 友好。首先，我将使用 HTTP 基本认证，其中客户端在标准的 HTTP 头（Authorization）中发送用户凭据。为了与 Flask-HTTPAuth 集成，应用程序需要提供两个函数：一个定义检查用户提供的用户名和密码的逻辑，另一个在身份认证失败时返回错误响应。这些函数通过装饰器注册到 Flask-HTTPAuth，然后在认证流程中根据需要由扩展自动调用。您可以在下面看到实现：

*app/api/auth.py*：基本认证支持。

```
import sqlalchemy as sa
from flask_httpauth import HTTPBasicAuth
from app import db
from app.models import User
from app.api.errors import error_response

basic_auth = HTTPBasicAuth()

@basic_auth.verify_password
def verify_password(username, password):
    user = db.session.scalar(sa.select(User).where(User.username == username))
    if user and user.check_password(password):
        return user

@basic_auth.error_handler
def basic_auth_error(status):
    return error_response(status)

```

来自 Flask-HTTPAuth 的 `HTTPBasicAuth` 类实现了基本认证流程。两个必需的函数分别通过 `verify_password` 和 `error_handler` 装饰器配置。

验证函数接收客户端提供的用户名和密码，如果凭据有效则返回认证后的用户，否则返回 `None`。为了检查密码，我依赖于 `User` 类的 `check_password()` 方法，Web 应用程序的 Flask-Login 在认证过程中也使用该方法。认证后的用户随后可以作为 `basic_auth.current_user()` 使用，以便在 API 视图函数中使用。

错误处理函数返回标准错误响应，由 *app/api/errors.py* 中的 `error_response()` 函数生成。`status` 参数是 HTTP 状态码，在无效认证的情况下将为 401。401 错误在 HTTP 标准中被定义为"未授权"错误。HTTP 客户端知道当收到此错误时，它们发送的请求需要重新发送并附带有效凭据。

现在我已经实现了基本认证支持，因此可以添加客户端在需要令牌时将调用的令牌获取路由：

*app/api/tokens.py*：生成用户令牌。

```
from app import db
from app.api import bp
from app.api.auth import basic_auth

@bp.route('/tokens', methods='POST')
@basic_auth.login_required
def get_token():
    token = basic_auth.current_user().get_token()
    db.session.commit()
    return {'token': token}

```

该视图函数使用了 `HTTPBasicAuth` 实例的 `@basic_auth.login_required` 装饰器，这将指示 Flask-HTTPAuth 验证身份认证（通过我上面定义的验证函数），并且仅在提供的凭据有效时才允许该函数运行。此视图函数的实现依赖于用户模型的 `get_token()` 方法来生成令牌。在生成令牌后发出数据库提交，以确保令牌及其过期时间被写回数据库。

如果您尝试向令牌 API 路由发送 POST 请求，结果如下：

```
(venv) $ http POST http://localhost:5000/api/tokens
HTTP/1.0 401 UNAUTHORIZED
Content-Length: 30
Content-Type: application/json
Date: Mon, 27 Jun 2021 20:01:00 GMT
Server: Werkzeug/2.0.1 Python/3.9.6
WWW-Authenticate: Basic realm="Authentication Required"

{
    "error": "Unauthorized"
}
```

HTTP 响应包含 401 状态码和我在 `basic_auth_error()` 函数中定义的错误负载。以下是相同的请求，这次包含了基本认证凭据：

```
(venv) $ http --auth <username>:<password> POST http://localhost:5000/api/tokens
HTTP/1.0 200 OK
Content-Length: 50
Content-Type: application/json
Date: Mon, 27 Jun 2021 20:01:22 GMT
Server: Werkzeug/2.0.1 Python/3.9.6

{
    "token": "a3b67df3547a49e6cd338a05c442d666"
}
```

现在状态码是 200，这是成功请求的代码，负载包含为用户新生成的令牌。请注意，当您发送此请求时，您需要将 `<username>:<password>` 替换为您自己的凭据，与您在登录表单中使用的相同。用户名和密码需要以冒号作为分隔符提供。

### 使用令牌保护 API 路由

客户端现在可以请求令牌以用于 API 端点，因此剩下的工作是将令牌验证添加到这些端点。这也是 Flask-HTTPAuth 可以为我处理的。我需要创建第二个基于 `HTTPTokenAuth` 类的认证实例，并提供一个令牌验证回调：

*app/api/auth.py*：令牌认证支持。

```
# ...
from flask_httpauth import HTTPTokenAuth

# ...
token_auth = HTTPTokenAuth()

# ...

@token_auth.verify_token
def verify_token(token):
    return User.check_token(token) if token else None

@token_auth.error_handler
def token_auth_error(status):
    return error_response(status)

```

当使用令牌认证时，Flask-HTTPAuth 使用一个 `verify_token` 装饰的函数，但除此之外，令牌认证的工作方式与基本认证相同。我的令牌验证函数使用 `User.check_token()` 来定位拥有所提供令牌的用户并将其返回。和之前一样，返回 `None` 会导致客户端被拒绝并返回认证错误。

为了保护 API 路由的令牌安全，需要添加 `@token_auth.login_required` 装饰器：

*app/api/users.py*：使用令牌认证保护用户路由。

```
from flask import abort
from app.api.auth import token_auth

@bp.route('/users/<int:id>', methods='GET')
@token_auth.login_required
def get_user(id):
    # ...

@bp.route('/users', methods='GET')
@token_auth.login_required
def get_users():
    # ...

@bp.route('/users/<int:id>/followers', methods='GET')
@token_auth.login_required
def get_followers(id):
    # ...

@bp.route('/users/<int:id>/following', methods='GET')
@token_auth.login_required
def get_following(id):
    # ...

@bp.route('/users', methods='POST')
def create_user():
    # ...

@bp.route('/users/<int:id>', methods='PUT')
@token_auth.login_required
def update_user(id):
    if token_auth.current_user().id != id:
        abort(403)
    # ...

```

请注意，装饰器被添加到除 `create_user()` 之外的所有 API 视图函数，因为创建用户显然不能接受认证——需要首先创建用户才能请求令牌。还要注意，修改用户的 PUT 请求有一个额外的检查，阻止用户尝试修改其他用户的账户。如果我找到请求的用户 id 与认证用户的 id 不匹配，则返回 403 错误响应，表示客户端没有权限执行请求的操作。

如果您像之前一样向这些端点中的任何一个发送请求，您将收到 401 错误响应。要获得访问权限，您需要添加 `Authorization` 头，其中包含您从对 */api/tokens* 的请求中收到的令牌。Flask-HTTPAuth 期望令牌以"bearer"令牌的形式发送，可以通过 HTTPie 如下发送：

```
(venv) $ http -A bearer --auth <token> GET http://localhost:5000/api/users/1

```

### 撤销令牌

我要实现的最后一个与令牌相关的功能是令牌撤销，您可以在下面看到：

*app/api/tokens.py*：撤销令牌。

```
from app.api.auth import token_auth

@bp.route('/tokens', methods='DELETE')
@token_auth.login_required
def revoke_token():
    token_auth.current_user().revoke_token()
    db.session.commit()
    return '', 204

```

客户端可以向 */tokens* URL 发送 `DELETE` 请求以使令牌失效。此路由的认证是基于令牌的，实际上在 `Authorization` 头中发送的令牌就是被撤销的那一个。撤销本身使用 `User` 类中的辅助方法，重置令牌的过期日期。数据库会话被提交，以便将此更改写入数据库。此请求的响应没有正文，因此我可以返回空字符串。返回语句中的第二个值将响应的状态码设置为 204，这是用于没有响应正文的成功请求的状态码。

以下是通过 HTTPie 发送的令牌撤销请求示例：

```
(venv) $ http -A bearer --auth <token> DELETE http://localhost:5000/api/tokens

```

## API 友好的错误消息

您还记得在本章开始时，当我要求您从浏览器发送带有无效用户 URL 的 API 请求时发生了什么吗？服务器返回了 404 错误，但这个错误被格式化为标准的 404 HTML 错误页面。API 可能需要返回的许多错误可以在 API 蓝图中使用 JSON 版本覆盖，但有些由 Flask 处理的错误仍然会通过为应用程序全局注册的错误处理程序，而这些处理程序继续返回 HTML。

HTTP 协议支持一种机制，通过该机制客户端和服务器可以就响应的最佳格式达成一致，称为*内容协商*。客户端需要在请求中发送一个 `Accept` 头，指示格式偏好。然后服务器查看该列表，并响应使用客户端提供的列表中所支持的最佳格式。

我想要做的是修改全局应用程序错误处理程序，使它们使用内容协商根据客户端的偏好以 HTML 或 JSON 格式回复。这可以通过 Flask 的 `request.accept_mimetypes` 对象来实现：

*app/errors/handlers.py*：错误响应的内容协商。

```
from flask import render_template, request
from app import db
from app.errors import bp
from app.api.errors import error_response as api_error_response

def wants_json_response():
    return request.accept_mimetypes'application/json' >= \
        request.accept_mimetypes'text/html'

@bp.app_errorhandler(404)
def not_found_error(error):
    if wants_json_response():
        return api_error_response(404)
    return render_template('errors/404.html'), 404

@bp.app_errorhandler(500)
def internal_error(error):
    db.session.rollback()
    if wants_json_response():
        return api_error_response(500)
    return render_template('errors/500.html'), 500

```

`wants_json_response()` 辅助函数比较客户端在其首选格式列表中选择的 JSON 或 HTML 的偏好。如果 JSON 的评分高于 HTML，则返回 JSON 响应。否则，我将返回基于模板的原始 HTML 响应。对于 JSON 响应，我将从 API 蓝图导入 `error_response` 辅助函数，但在这里将其重命名为 `api_error_response()`，以明确其功能及来源。

## 结束语

恭喜您完成了 Flask Mega-Tutorial！我希望您现在已准备就绪，能够构建自己的 Web 应用程序，并以此为基石继续您的学习之旅。祝您好运！

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
