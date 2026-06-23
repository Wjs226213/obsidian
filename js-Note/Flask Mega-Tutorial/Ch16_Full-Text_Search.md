# Part 16: Full-Text Search

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xvi-full-text-search](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xvi-full-text-search) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第十六篇，在这篇文章中，我将为 Microblog 添加全文搜索功能。

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

- 第 15 章：更好的应用结构

- 第 16 章：全文搜索（本文）

- 第 17 章：在 Linux 上部署

- 第 18 章：在 Heroku 上部署

- 第 19 章：在 Docker 容器上部署

- 第 20 章：一些 JavaScript 魔法

- 第 21 章：用户通知

- 第 22 章：后台任务

- 第 23 章：应用程序编程接口（API）

本章的目标是为 Microblog 实现搜索功能，以便用户可以使用自然语言找到感兴趣的帖子。对于许多类型的网站来说，只需让 Google、Bing 等搜索引擎索引所有内容，并通过它们的搜索 API 提供搜索结果即可。这对于主要由静态页面组成的网站效果不错。但在我的应用中，内容的基本单位是用户帖子，它只是整个网页的一小部分。我想要的搜索结果是针对这些单独的博客帖子，而不是整个页面。例如，如果我搜索单词"dog"，我想看到任何包含该单词的用户写的博客帖子。显然，一个显示所有包含"dog"（或任何其他可能的搜索词）的博客帖子的页面，并非作为大搜索引擎可以找到和索引的页面而存在，所以我别无选择，只能自己实现搜索功能。

*本章的 GitHub 链接：浏览, Zip, Diff.*

## 全文检索引擎简介

全文搜索的支持不像关系数据库那样标准化。有几个开源全文搜索引擎：Elasticsearch、Apache Solr、Whoosh、Xapian、Sphinx 等。好像选择还不够多似的，有几个数据库也提供了可与上述专用搜索引擎相媲美的搜索功能。SQLite、MySQL 和 PostgreSQL 都提供某种程度的文本搜索支持，NoSQL 数据库（如 MongoDB 和 CouchDB）也提供。

如果你想知道其中哪些可以在 Flask 应用中使用，答案是所有都可以！这是 Flask 的优势之一——它做好本职工作，而不固执己见。那么什么是最好的选择呢？

在专用搜索引擎列表中，Elasticsearch 对我来说是相当流行的一个，部分原因是它作为 ELK 堆栈中的"E"（与 Logstash 和 Kibana 一起）在日志索引方面广受欢迎。使用其中一个关系数据库的搜索功能也是一个不错的选择，但鉴于 SQLAlchemy 不支持此功能，我将不得不使用原始 SQL 语句来处理搜索，或者找到一个能提供高层文本搜索访问同时又能与 SQLAlchemy 共存的包。

基于以上分析，我决定使用 Elasticsearch，但我将以一种非常容易切换到其他引擎的方式来实现所有文本索引和搜索功能。这样，你只需重写单个模块中的几个函数，就可以将我的实现替换为基于不同引擎的替代方案。

## 安装 Elasticsearch

安装 Elasticsearch 有几种方法，包括一键安装程序、包含需要自行安装的二进制文件的 zip 文件，甚至是 Docker 镜像。文档中有一个安装页面，提供了所有这些选项的详细信息。如果你使用的是 Linux，你的发行版很可能有可用的软件包，但你需要确保它是较新的版本，理想情况下是 8.0 或更高版本。

要启动一个用于开发的单节点 Elasticsearch 节点，建议使用以下配置选项：

- `memory="2GB"`：为小索引请求足够的内存。

- `discovery.type=single-node`：表示这是单节点而不是集群。

- `xpack.security.enabled=false`：禁用 SSL 证书和用户凭据的使用，这在开发期间不需要。

在使用 Docker 运行 Elasticsearch 时，启动命令是：

```
$ docker run --name elasticsearch -d --rm -p 9200:9200 \
    --memory="2GB" \
    -e discovery.type=single-node -e xpack.security.enabled=false \
    -t docker.elastic.co/elasticsearch/elasticsearch:9.0.3

```

你可能需要根据上面的命令调整版本号。

因为我将通过 Python 管理 Elasticsearch，所以我还将使用 Python 客户端库：

```
(venv) $ pip install elasticsearch

```

你可能还想更新 *requirements.txt* 文件：

```
(venv) $ pip freeze > requirements.txt

```

为避免兼容性问题，请确保 Elasticsearch Docker 镜像的主版本号（如果你使用与我相同的版本，则为版本 9）与 `elasticsearch` Python 包的主版本号匹配。如果 Python 包的主版本号更高，请查阅 Elasticsearch Docker 页面以找到具有匹配主版本号的最新镜像。

## Elasticsearch 教程

我将首先向你展示如何在 Python shell 中使用 Elasticsearch 的基础知识。这将帮助你熟悉此服务，以便理解稍后讨论的实现。

要创建到 Elasticsearch 的连接，创建一个 `Elasticsearch` 类的实例，并传递连接 URL 作为参数：

```
>>> from elasticsearch import Elasticsearch
>>> es = Elasticsearch('http://localhost:9200')

```

Elasticsearch 中的数据写入到*索引*中。与关系数据库不同，数据只是一个 JSON 对象。以下示例将一个包含 `text` 字段的对象写入名为 `my_index` 的索引：

```
>>> es.index(index='my_index', id=1, document={'text': 'this is a test'})

```

对于存储的每个文档，Elasticsearch 需要一个唯一的 id 和一个包含要存储数据的字典。

让我们在此索引上存储第二个文档：

```
>>> es.index(index='my_index', id=2, document={'text': 'a second test'})

```

现在此索引中有两个文档了，我可以进行自由形式的搜索。在这个例子中，我将搜索 `this test`：

```
>>> es.search(index='my_index', query={'match': {'text': 'this test'}})

```

`es.search()` 调用的响应是一个响应对象，它包装了一个包含搜索结果的 Python 字典：

```
ObjectApiResponse({
    'took': 6,
    'timed_out': False,
    '_shards': {'total': 1, 'successful': 1, 'skipped': 0, 'failed': 0},
    'hits': {
        'total': {'value': 2, 'relation': 'eq'},
        'max_score': 0.82713,
        'hits': 
            {
                '_index': 'my_index',
                '_id': '1',
                '_score': 0.82713,
                '_source': {'text': 'this is a test'}
            },
            {
                '_index': 'my_index',
                '_id': '2',
                '_score': 0.19363807,
                '_source': {'text': 'a second test'}
            }
        
    }
})

```

在这里你可以看到搜索返回了两个文档，每个文档都有一个分配的相关性分数。得分最高的文档包含我搜索的两个单词，而另一个文档只包含其中一个。你可以看到，即使是最好的结果也没有完美的 1 分，因为单词并不完全匹配文本。

现在，如果我搜索单词 `second`，结果如下：

```
>>> es.search(index='my_index', query={'match': {'text': 'second'}})
ObjectApiResponse({
    'took': 2,
    'timed_out': False,
    '_shards': {'total': 1, 'successful': 1, 'skipped': 0, 'failed': 0},
    'hits': {
        'total': {'value': 1, 'relation': 'eq'},
        'max_score': 0.7361701,
        'hits': 
            {
                '_index': 'my_index',
                '_id': '2',
                '_score': 0.7361701,
                '_source': {'text': 'a second test'}
            }
        
    }
})

```

我仍然没有得到完美的分数，因为我的搜索与此文档中的文本并不完全匹配，但由于两个文档中只有一个包含单词"second"，另一个文档根本没有出现。

Elasticsearch 查询对象还有更多选项，所有选项都有详细的文档记录，并包括分页和排序等选项，就像关系数据库一样。

随意向此索引添加更多条目并尝试不同的搜索。当你完成实验后，可以使用以下命令删除索引：

```
>>> es.indices.delete(index='my_index')

```

## Elasticsearch 配置

将 Elasticsearch 集成到应用中是一个很好的例子，展示了 Flask 的强大。这是一个与 Flask 完全无关的服务和 Python 包组合，然而，我将实现一个相当不错的集成级别，从配置开始，我将把它写入 Flask 的 `app.config` 字典中：

*config.py*：Elasticsearch 配置。

```
class Config:
    # ...
    ELASTICSEARCH_URL = os.environ.get('ELASTICSEARCH_URL')

```

与许多其他配置条目一样，Elasticsearch 的连接 URL 将来自环境变量。如果该变量未定义，我将让该设置保持为 `None`，并将其用作禁用 Elasticsearch 的信号。这主要是为了方便，这样你在开发应用时不必总是运行 Elasticsearch 服务，特别是在运行单元测试时。因此，要确保使用该服务，我需要定义 `ELASTICSEARCH_URL` 环境变量，可以直接在终端中定义，也可以将其添加到 *.env* 文件中，如下所示：

```
ELASTICSEARCH_URL=http://localhost:9200

```

Elasticsearch 带来的挑战是它没有被 Flask 扩展封装。我不能像上面的例子那样在全局作用域中创建 Elasticsearch 实例，因为要初始化它，我需要访问 `app.config`，而这只有在调用 `create_app()` 函数之后才可用。我的解决方案是在应用工厂函数中向 `app` 实例添加一个 `elasticsearch` 属性：

*app/__init__.py*：Elasticsearch 实例。

```
# ...
from elasticsearch import Elasticsearch

# ...

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ...
    app.elasticsearch = Elasticsearch(app.config['ELASTICSEARCH_URL']) \
        if app.config['ELASTICSEARCH_URL'] else None

    # ...

```

向 `app` 实例添加新属性可能看起来有点奇怪，但 Python 对象在结构上并不严格，可以随时向它们添加新属性。你也可以考虑的另一种替代方案是创建 `Flask` 的子类（也许叫做 `Microblog`），并在其 `__init__()` 函数中定义 `elasticsearch` 属性。

注意我如何使用条件表达式，在环境中没有定义 Elasticsearch 服务的 URL 时，使 Elasticsearch 实例为 `None`。

## 全文搜索抽象

正如我在本章引言中所说，我希望能够轻松地从 Elasticsearch 切换到其他搜索引擎，而且我也不想专门为搜索博客帖子编写代码，我更喜欢设计一个将来可以轻松扩展到其他模型（如果需要的话）的解决方案。出于所有这些原因，我决定为搜索功能创建一个*抽象*。其理念是以通用术语设计该功能，因此我不会假设 `Post` 模型是唯一需要索引的模型，也不会假设 Elasticsearch 是首选的索引引擎。但如果我不能对任何事情做假设，那怎么能完成这项工作呢？

我首先需要的是找到一种通用方式来指示哪个模型及其哪个或哪些字段需要被索引。我规定，任何需要索引的模型都需要定义一个 `__searchable__` 类属性，列出需要包含在索引中的字段。对于 `Post` 模型，更改如下：

*app/models.py*：向 Post 模型添加 **searchable** 属性。

```
class Post(db.Model):
    __searchable__ = ['body']
    # ...

```

所以这里我声明该模型需要将其 `body` 字段编入索引以供搜索。但为了确保这完全清楚，我添加的这个 `__searchable__` 属性只是一个变量，它没有任何相关行为。它只是帮助我以通用方式编写索引函数。

我将把所有与 Elasticsearch 索引交互的代码写在一个 *app/search.py* 模块中。其理念是将所有 Elasticsearch 代码保留在此模块中。应用的其余部分将使用这个新模块中的函数来访问索引，而不会直接访问 Elasticsearch。这一点很重要，因为如果有一天我不再喜欢 Elasticsearch 并想切换到不同的引擎，我只需重写此模块中的函数，应用就会像以前一样继续工作。

对于这个应用，我决定需要三个与文本索引相关的支持函数：我需要向全文索引添加条目，需要从索引中删除条目（假设有一天我会支持删除博客帖子），以及需要执行搜索查询。以下是实现这三个函数的 *app/search.py* 模块，用于 Elasticsearch，使用上面在 Python 控制台中展示的功能：

*app/search.py*：搜索函数。

```
from flask import current_app

def add_to_index(index, model):
    if not current_app.elasticsearch:
        return
    payload = {}
    for field in model.__searchable__:
        payload[field] = getattr(model, field)
    current_app.elasticsearch.index(index=index, id=model.id, document=payload)

def remove_from_index(index, model):
    if not current_app.elasticsearch:
        return
    current_app.elasticsearch.delete(index=index, id=model.id)

def query_index(index, query, page, per_page):
    if not current_app.elasticsearch:
        return [], 0
    search = current_app.elasticsearch.search(
        index=index,
        query={'multi_match': {'query': query, 'fields': '*'}},
        from_=(page - 1) * per_page,
        size=per_page)
    ids = [int(hit['_id']) for hit in search['hits']['hits']]
    return ids, search['hits']['total']['value']

```

这些函数都以检查 `app.elasticsearch` 是否为 `None` 开始，如果是，则不执行任何操作直接返回。这样，当 Elasticsearch 服务器未配置时，应用继续运行，没有搜索功能，也不会给出任何错误。这只是为了方便，在开发期间或运行单元测试时使用。

这些函数接受索引名称作为参数。添加和删除索引条目的函数接受 SQLAlchemy 模型作为第二个参数。`add_to_index()` 函数使用我添加到模型中的 `__searchable__` 类变量来构建插入到索引中的文档。如果你还记得，Elasticsearch 文档还需要一个唯一标识符。为此我使用了 SQLAlchemy 模型的 `id` 字段，它也是唯一的。在 SQLAlchemy 和 Elasticsearch 中使用相同的 `id` 值在执行搜索时非常有用，因为它允许我连接两个数据库中的条目。我之前没有提到的是，如果你尝试添加一个已存在 `id` 的条目，Elasticsearch 会用新条目替换旧条目，因此 `add_to_index()` 既可以用于新对象，也可以用于修改过的对象。

我之前没有展示过 `remove_from_index()` 中使用的 `es.delete()` 函数。这个函数删除存储在给定 `id` 下的文档。这是一个很好的例子，说明了使用相同 `id` 连接两个数据库中的条目的便利性。

`query_index()` 函数接受索引名称和要搜索的文本，以及分页控制参数，以便搜索结果可以像 Flask-SQLAlchemy 的结果一样进行分页。你之前已经在 Python 控制台中看到过 `es.search()` 函数的用法示例。我在此处发出的调用相当类似，但我没有使用 `match` 查询类型，而是使用了 `multi_match`，它可以跨多个字段进行搜索。通过传递 `*` 作为字段名，我告诉 Elasticsearch 搜索所有已索引的字段，所以基本上我是在搜索整个索引。这对于使该函数通用化很有用，因为不同的模型在索引中可能有不同的字段名。

`from_` 和 `size` 参数控制需要返回的整个结果集的哪个子集。Elasticsearch 没有提供像 Flask-SQLAlchemy 的 `Pagination` 那样漂亮的 `Pagination` 对象，所以我必须自己计算分页的数学逻辑来确定 `from` 值。

`query_index()` 函数中的 `return` 语句有些复杂。它返回两个值：第一个是搜索结果的 `id` 元素列表，第二个返回值是结果总数。两者都是从 `es.search()` 函数返回的 Python 字典中获取的。如果你不熟悉我用来获取 ID 列表的表达式，这称为*列表推导式*，是 Python 语言的一个极好特性，允许你将列表从一种格式转换为另一种格式。在这里，我使用列表推导式从 Elasticsearch 提供的更大的结果列表中提取 `id` 值。

这太令人困惑了吗？也许从 Python 控制台对这些函数进行演示可以帮助你更好地理解它们。在下面的会话中，我手动将数据库中的所有帖子添加到 Elasticsearch 索引中。在我的开发数据库中，我写了几篇包含数字"one"、"two"、"three"、"four"和"five"的帖子，所以我用这些作为搜索查询。你可能需要调整查询以匹配你数据库的内容：

```
>>> from app.search import add_to_index, remove_from_index, query_index
>>> for post in db.session.scalars(sa.select(Post)):
...     add_to_index('posts', post)
>>> query_index('posts', 'one two three four five', 1, 100)
([15, 13, 12, 4, 11, 8, 14, 7], 7)
>>> query_index('posts', 'one two three four five', 1, 3)
([15, 13, 12], 7)
>>> query_index('posts', 'one two three four five', 2, 3)
([4, 11, 8], 7)
>>> query_index('posts', 'one two three four five', 3, 3)
([14, 7], 7)

```

我发出的查询返回了七个结果。当我请求第 1 页（每页 100 项）时，我得到了全部七个结果，但接下来的三个示例展示了如何以与 Flask-SQLAlchemy 非常类似的方式对结果进行分页，不同之处在于结果以 ID 列表的形式返回，而不是 SQLAlchemy 对象。

如果你想保持整洁，请在实验结束后删除 `posts` 索引：

```
>>> app.elasticsearch.indices.delete(index='posts')

```

## 将搜索与 SQLAlchemy 集成

我在上一节中展示的解决方案还不错，但它仍然存在几个问题。最明显的问题是结果以数字 ID 列表的形式返回。这非常不方便——我需要 SQLAlchemy 模型以便将它们传递给模板进行渲染，我需要一种方法来将该数字列表替换为数据库中对应的模型。第二个问题是，该解决方案要求应用在添加或删除帖子时显式发出索引调用，这虽然不算糟糕，但不太理想，因为在 SQLAlchemy 端进行更改时，如果由于错误导致索引调用被遗漏，这种错误不容易被发现，两个数据库将越来越不同步，而且你可能在相当长的时间内不会注意到。更好的解决方案是，这些调用在 SQLAlchemy 数据库发生更改时自动触发。

将 ID 替换为对象的问题可以通过创建一个从数据库读取这些对象的 SQLAlchemy 查询来解决。这听起来在实践中很容易，但高效地通过单个查询完成实际上有点棘手。

对于自动触发索引更改的问题，我决定从 SQLAlchemy*事件*驱动对 Elasticsearch 索引的更新。SQLAlchemy 提供了大量事件，应用可以收到这些事件的通知。例如，每次提交会话时，可以让 SQLAlchemy 调用应用中的某个函数，在该函数中，我可以将对 SQLAlchemy 会话所做的相同更新应用到 Elasticsearch 索引。

为了实现这两个问题的解决方案，我将编写一个*mixin*类。还记得 mixin 类吗？在第 5 章中，我将 Flask-Login 的 `UserMixin` 类添加到了 `User` 模型中，以赋予它 Flask-Login 所需的一些功能。对于搜索支持，我将定义自己的 `SearchableMixin` 类，当附加到模型时，它将赋予模型自动管理关联全文索引的能力。mixin 类将充当 SQLAlchemy 和 Elasticsearch 世界之间的"粘合"层，为上述两个问题提供解决方案。

让我展示实现，然后我会介绍一些有趣的细节。请注意，这使用了一些高级技术，所以你需要仔细研究这些代码才能完全理解。

*app/models.py*：SearchableMixin 类。

```
from app.search import add_to_index, remove_from_index, query_index

class SearchableMixin(object):
    @classmethod
    def search(cls, expression, page, per_page):
        ids, total = query_index(cls.__tablename__, expression, page, per_page)
        if total == 0:
            return [], 0
        when = []
        for i in range(len(ids)):
            when.append((ids[i], i))
        query = sa.select(cls).where(cls.id.in_(ids)).order_by(
            db.case(*when, value=cls.id))
        return db.session.scalars(query), total

    @classmethod
    def before_commit(cls, session):
        session._changes = {
            'add': list(session.new),
            'update': list(session.dirty),
            'delete': list(session.deleted)
        }

    @classmethod
    def after_commit(cls, session):
        for obj in session._changes['add']:
            if isinstance(obj, SearchableMixin):
                add_to_index(obj.__tablename__, obj)
        for obj in session._changes['update']:
            if isinstance(obj, SearchableMixin):
                add_to_index(obj.__tablename__, obj)
        for obj in session._changes['delete']:
            if isinstance(obj, SearchableMixin):
                remove_from_index(obj.__tablename__, obj)
        session._changes = None

    @classmethod
    def reindex(cls):
        for obj in db.session.scalars(sa.select(cls)):
            add_to_index(cls.__tablename__, obj)

db.event.listen(db.session, 'before_commit', SearchableMixin.before_commit)
db.event.listen(db.session, 'after_commit', SearchableMixin.after_commit)

```

这个 mixin 类中有四个函数，都是类方法。作为复习，类方法是与类关联的特殊方法，而不是与特定实例关联。请注意，我将常规实例方法中使用的 `self` 参数重命名为 `cls`，以明确此方法接收的是一个类而不是实例作为其第一个参数。例如，一旦附加到 `Post` 模型，上面的 `search()` 方法就可以作为 `Post.search()` 调用，而无需拥有 `Post` 类的实际实例。

`search()` 类方法封装了 *app/search.py* 中的 `query_index()` 函数，将对象 ID 列表替换为来自 SQLAlchemy 的实际对象。你可以看到，此函数首先调用 `query_index()`，将 `cls.__tablename__` 作为索引名称传递。这将成为一个约定——所有索引都将以 Flask-SQLAlchemy 分配给关系表的名称命名。该函数返回结果 ID 列表和结果总数。通过 ID 检索对象列表的 SQLAlchemy 查询基于 SQL 语言的 `CASE` 语句，需要使用它来确保数据库返回的结果顺序与 Elasticsearch 返回的 ID 顺序相同（这些 ID 按相关性排序）。如果你想了解更多关于此查询工作方式的信息，可以查阅 StackOverflow 问题上的这个被接受的答案。`search()` 函数返回将 ID 列表替换为对象的查询结果，并将搜索结果的总数作为第二个返回值传递。

`before_commit()` 和 `after_commit()` 方法将响应 SQLAlchemy 的两个事件，它们分别在提交之前和之后触发。前置处理程序很有用，因为此时会话尚未提交，因此我可以查看它并找出将要添加、修改和删除的对象，分别作为 `session.new`、`session.dirty` 和 `session.deleted` 可用。这些对象在会话提交后将不再可用，所以我需要在提交发生之前保存它们。我使用一个 `session._changes` 字典将这些对象写在一个能够在会话提交后仍然存在的地方，因为一旦会话提交，我将使用它们来更新 Elasticsearch 索引。

当 `after_commit()` 处理程序被调用时，会话已成功提交，所以这是在 Elasticsearch 端进行更改的合适时机。会话对象具有我在 `before_commit()` 中添加的 `_changes` 变量，所以现在我可以遍历添加、修改和删除的对象，并对具有 `SearchableMixin` 类的对象调用 *app/search.py* 中相应的索引函数。

`reindex()` 类方法是一个简单的辅助方法，你可以使用它从关系端的所有数据刷新索引。你在上面的 Python shell 会话中看到我做了类似的事情，将初始加载的所有帖子放入到一个测试索引中。有了这个方法，我可以发出 `Post.reindex()` 来将数据库中的所有帖子添加到搜索索引。

在类定义之后，我对 SQLAlchemy 的函数 `db.event.listen()` 进行了两次调用。请注意，这些调用不在类内部，而是在它之后。这两个语句的目的是设置事件处理程序，使 SQLAlchemy 分别在每次提交之前和之后调用 `before_commit()` 和 `after_commit()` 方法。

要将 `SearchableMixin` 类合并到 `Post` 模型中，我需要将其添加为子类，并且还需要连接提交前后的事件：

*app/models.py*：将 SearchableMixin 类添加到 Post 模型。

```
class Post(SearchableMixin, db.Model):
    # ...

```

现在 `Post` 模型自动维护博客帖子的全文搜索索引。我可以使用 `reindex()` 方法从数据库中当前所有帖子初始化索引：

```
>>> Post.reindex()

```

我可以通过运行 `Post.search()` 来搜索帖子并使用 SQLAlchemy 模型进行工作。在以下示例中，我请求了我的查询的第一页（五个元素）：

```
>>> query, total = Post.search('one two three four five', 1, 5)
>>> total
7
>>> query.all()
[<Post five>, <Post two>, <Post one>, <Post one more>, <Post one>]

```

## 搜索表单

这非常紧张。我上面所做的保持通用性的工作涉及几个高级主题，所以你可能需要一些时间来完全理解它。但现在我有了一个完整的系统来处理博客帖子的自然语言搜索。我现在需要做的是将所有功能集成到应用中。

一个相当标准的基于 Web 的搜索方法是让搜索词作为 URL 查询字符串中的 `q` 参数。例如，如果你想在 Google 上搜索 `Python`，并想节省几秒钟，你只需在浏览器地址栏中输入以下 URL 即可直接进入结果页面：

```
https://www.google.com/search?q=python

```

允许搜索完全封装在 URL 中很好，因为这些 URL 可以与其他人共享，他们只需点击链接就可以访问搜索结果。

这引入了我之前展示的处理 Web 表单方式的一个变化。到目前为止，我使用 `POST` 请求来提交应用所有表单的表单数据，但为了实现上述的搜索方式，表单提交必须以 `GET` 请求进行，这是你在浏览器中输入 URL 或点击链接时使用的请求方法。另一个有趣的差异是，搜索表单将位于导航栏中，因此它需要出现在应用的所有页面中。

以下是搜索表单类，只有一个 `q` 文本字段：

*app/main/forms.py*：搜索表单。

```
from flask import request

class SearchForm(FlaskForm):
    q = StringField(_l('Search'), validators=[DataRequired()])

    def __init__(self, *args, **kwargs):
        if 'formdata' not in kwargs:
            kwargs['formdata'] = request.args
        if 'meta' not in kwargs:
            kwargs['meta'] = {'csrf': False}
        super(SearchForm, self).__init__(*args, **kwargs)

```

`q` 字段不需要任何解释，它与我过去使用的其他文本字段类似。对于这个表单，我决定不设提交按钮。对于有文本字段的表单，当焦点在字段上时按 Enter 键，浏览器就会提交表单，因此不需要按钮。我还添加了一个 `__init__` 构造函数，如果调用者没有提供 `formdata` 和 `meta` 参数，它会为它们提供值。`formdata` 参数决定了 Flask-WTF 从何处获取表单提交数据。默认是使用 `request.form`，这是 Flask 存放通过 `POST` 请求提交的表单值的地方。通过 `GET` 请求提交的表单，其字段值在查询字符串中，所以我需要将 Flask-WTF 指向 `request.args`，这是 Flask 写入查询字符串参数的地方。如你所记，表单默认具有 CSRF 保护，通过 `form.hidden_tag()` 构造在模板中添加 CSRF 令牌。为了使可点击的搜索链接能够工作，需要禁用 CSRF，所以我将 `meta` 设置为 `{'csrf': False}`，以便让 Flask-WTF 知道需要为此表单跳过 CSRF 验证。

因为我需要在所有页面中显示此表单，无论用户正在查看哪个页面，我都需要创建一个 `SearchForm` 类的实例。唯一的要求是用户已登录，因为对于匿名用户，我目前不显示任何内容。我没有在每个路由中创建表单对象，然后将表单传递给所有模板，我将向你展示一个非常有用的技巧，可以消除在需要跨整个应用实现某个功能时的代码重复。我之前在第 6 章中使用过 `before_request` 处理程序来记录每个用户的最后访问时间。我将在此同一个函数中创建搜索表单，但有一个变化：

*app/main/routes.py*：在 before_request 处理程序中实例化搜索表单。

```
from flask import g
from app.main.forms import SearchForm

@bp.before_app_request
def before_request():
    if current_user.is_authenticated:
        current_user.last_seen = datetime.now(timezone.utc) 
        db.session.commit()
        g.search_form = SearchForm()
    g.locale = str(get_locale())

```

在这里，当我有已认证的用户时，我创建一个搜索表单类的实例。但当然，我需要这个表单对象持续存在，直到可以在请求结束时被渲染，所以我需要将它存储在某个地方。这个地点就是 Flask 提供的 `g` 容器。Flask 提供的这个 `g` 变量是应用可以在请求的生命周期内存储数据的地方。在这里，我将表单存储在 `g.search_form` 中，因此当 before request 处理程序结束，Flask 调用处理请求 URL 的视图函数时，`g` 对象仍然是同一个，并且仍然附加了表单。需要注意的是，这个 `g` 变量是每个请求和每个客户端特有的，因此即使你的 Web 服务器同时处理多个客户端的多个请求，你仍然可以依赖 `g` 作为每个请求的私有存储，独立于同时处理的其他请求。

下一步是将表单渲染到页面中。我上面提到我希望此表单出现在所有页面中，所以最有意义的是将其作为导航栏的一部分进行渲染。实际上，这很简单，因为模板也可以看到存储在 `g` 变量中的数据，所以我无需担心在应用中所有的 `render_template()` 调用中明确将表单作为模板参数添加。以下是我如何在基础模板中渲染表单：

*app/templates/base.html*：在导航栏中渲染搜索表单。

```
            ...
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    ... home and explore links ...
                </ul>
                {% if g.search_form %}
                <form class="navbar-form navbar-left" method="get"
                        action="{{ url_for('main.search') }}">
                    <div class="form-group">
                        {{ g.search_form.q(size=20, class='form-control',
                            placeholder=g.search_form.q.label.text) }}
                    </div>
                </form>
                {% endif %}
                ...

```

只有在 `g.search_form` 被定义时才渲染表单。这个检查是必要的，因为某些页面（如错误页面）可能没有定义它。这个表单与我之前做的略有不同。我将其 `method` 属性设置为 `get`，因为我希望表单数据通过 `GET` 请求在查询字符串上提交。此外，我创建的其他表单的 `action` 属性为空，因为它们被提交到渲染表单的同一页面。这个表单很特殊，因为它出现在所有页面中，所以我需要明确告诉它需要提交到哪里——一个专门用于处理搜索的新路由。

## 搜索视图函数

完成搜索功能的最后一点是接收搜索表单提交的视图函数。此视图函数将附加到 */search* 路由，这样你就可以使用 *http://localhost:5000/search?q=search-words* 发送搜索请求，就像 Google 一样。

*app/main/routes.py*：搜索视图函数。

```
@bp.route('/search')
@login_required
def search():
    if not g.search_form.validate():
        return redirect(url_for('main.explore'))
    page = request.args.get('page', 1, type=int)
    posts, total = Post.search(g.search_form.q.data, page,
                               current_app.config['POSTS_PER_PAGE'])
    next_url = url_for('main.search', q=g.search_form.q.data, page=page + 1) \
        if total > page * current_app.config['POSTS_PER_PAGE'] else None
    prev_url = url_for('main.search', q=g.search_form.q.data, page=page - 1) \
        if page > 1 else None
    return render_template('search.html', title=_('Search'), posts=posts,
                           next_url=next_url, prev_url=prev_url)

```

你已经看到，在其他表单中，我使用了 `form.validate_on_submit()` 方法来检查表单提交是否有效。不幸的是，该方法只适用于通过 `POST` 请求提交的表单，所以对于这个表单，我需要使用 `form.validate()`，它只验证字段值，而不检查数据是如何提交的。如果验证失败，那是因为用户提交了空的搜索表单，所以在这种情况下，我只是重定向到探索页面，该页面显示所有博客帖子。

我的 `SearchableMixin` 类中的 `Post.search()` 方法用于获取搜索结果列表。分页的处理方式与首页和探索页面非常相似，但在没有 Flask-SQLAlchemy 的 `Pagination` 对象帮助的情况下，生成上一页和下一页链接稍微有些棘手。这就是从 `Post.search()` 作为第二个返回值传递的结果总数派上用场的地方。

一旦计算出搜索结果的页面和分页链接，剩下的就是使用所有这些数据渲染一个模板。我本来可以找到一种方法来重用 *index.html* 模板来显示搜索结果，但考虑到有一些差异，我决定创建一个专用的 *search.html* 模板来显示搜索结果，利用 *_post.html* 子模板来渲染搜索结果：

*app/templates/search.html*：搜索结果模板。

```
{% extends "base.html" %}

{% block content %}
    <h1>{{ _('Search Results') }}</h1>
    {% for post in posts %}
        {% include '_post.html' %}
    {% endfor %}
    <nav aria-label="Post navigation">
        <ul class="pagination">
            <li class="page-item{% if not prev_url %} disabled{% endif %}">
                <a class="page-link" href="{{ prev_url }}">
                    <span aria-hidden="true">&larr;</span> {{ _('Newer posts') }}
                </a>
            </li>
            <li class="page-item{% if not next_url %} disabled{% endif %}">
                <a class="page-link" href="{{ next_url }}">
                    {{ _('Older posts') }} <span aria-hidden="true">&rarr;</span>
                </a>
            </li>
        </ul>
    </nav>
{% endblock %}

```

上一页和下一页链接的渲染逻辑与我在 *index.html* 和 *user.html* 模板中使用的类似。

你觉得怎么样？这是一个紧张密集的章节，我展示了一些相当高级的技术。本章中的一些概念可能需要一些时间来消化。本章最重要的收获是，如果你想使用不同于 Elasticsearch 的搜索引擎，你只需要重新实现 *app/search.py* 中的三个函数。完成这一工作的另一个重要好处是，将来如果需要为不同的数据库模型添加搜索支持，我只需将 `SearchableMixin` 类添加到该模型，并添加 `__searchable__` 属性（包含要索引的字段列表）以及 SQLAlchemy 事件处理程序连接即可。我认为这非常值得努力，因为从现在开始，处理全文索引将变得容易。

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
