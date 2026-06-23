# Part 14: Ajax

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xiv-ajax](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xiv-ajax) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第十四篇，在这篇文章中，我将使用微软翻译服务和少量 JavaScript 来添加实时语言翻译功能。

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

- 第 14 章：Ajax（本文）

- 第 15 章：更好的应用结构

- 第 16 章：全文搜索

- 第 17 章：在 Linux 上部署

- 第 18 章：在 Heroku 上部署

- 第 19 章：在 Docker 容器上部署

- 第 20 章：一些 JavaScript 魔法

- 第 21 章：用户通知

- 第 22 章：后台任务

- 第 23 章：应用程序编程接口（API）

在本文中，我将暂时离开"安全区"——服务器端开发，去实现一个同样重要的服务器端和客户端组件功能。你是否见过某些网站会在用户生成的内容旁边显示"翻译"链接？这些链接可以触发对非用户母语内容的实时自动翻译。翻译后的文本通常会插入到原文下方。谷歌会在搜索结果中为外语内容显示它。Facebook 在帖子上使用它。Twitter 在推文上也使用它。今天我将向你展示如何将相同的功能添加到 Microblog 中！

*本章的 GitHub 链接：浏览, Zip, Diff.*

## 服务器端 vs 客户端

在我迄今为止遵循的传统服务器端模型中，有一个客户端（由用户操作的 Web 浏览器）向应用服务器发出 HTTP 请求。请求可以简单地请求一个 HTML 页面（比如当你点击"个人资料"链接时），也可以触发一个操作（比如编辑个人资料信息后点击提交按钮）。在这两种类型的请求中，服务器通过向客户端发送新网页（直接发送或通过重定向）来完成请求。然后客户端用新页面替换当前页面。只要用户停留在应用网站上，这个循环就会不断重复。在这种模型中，服务器完成所有工作，而客户端只负责显示网页和接受用户输入。

还有另一种模型，其中客户端扮演更积极的角色。在这种模型中，客户端向服务器发出请求，服务器返回一个网页，但与前面的情况不同，并非所有页面数据都是 HTML，页面中还包含代码部分（通常用 JavaScript 编写）。一旦客户端收到页面，它会显示 HTML 部分并执行代码。这些代码通常不会立即运行，而只是设置事件处理程序，以便在浏览器中响应用户触发的操作。从那时起，你拥有一个活跃的客户端，可以在很少或完全不与服务器接触的情况下独立工作。在严格的客户端应用中，整个应用在初始页面请求时被下载到客户端，然后应用完全在客户端运行，仅在检索或存储数据时与服务器联系，并动态改变第一个也是唯一一个页面的外观。这种类型的应用称为单页应用（SPA）。

大多数应用是两种模型的混合体，结合了两者的技术。我的 Microblog 应用主要是一个服务器端应用，但今天我将在其中添加一些客户端操作。为了实现用户帖子的实时翻译，客户端浏览器将向服务器发送*异步请求*，服务器将在不引起页面刷新的情况下响应。然后客户端将翻译结果动态插入到当前页面中。这种技术称为 Ajax，是 Asynchronous JavaScript and XML（异步 JavaScript 和 XML）的缩写（尽管如今 XML 通常被 JSON 取代）。

## 实时翻译工作流程

得益于 Flask-Babel，该应用对外语有很好的支持，这使其能够支持尽可能多的语言（只要能找到翻译人员）。但当然，还缺少一个元素。用户会用他们自己的语言写博客文章，因此很可能某个用户会遇到其他用户用未知语言写的文章。自动翻译的质量并不总是很好，但在大多数情况下，如果你只是想大致了解另一种语言的文本含义，它已经足够好了。

这是一个非常适合实现为 Ajax 服务功能。考虑一下首页或探索页面可能会显示多篇帖子，其中一些可能是外语。如果我使用传统的服务器端技术实现翻译，那么翻译请求将导致当前页面被替换为新页面。实际上，为众多显示的博客帖子中的一篇请求翻译，并不需要一个完整的页面更新。如果翻译后的文本能动态插入到原文下方，同时保持页面其余部分不变，这个功能会工作得好得多。

实现实时自动翻译需要几个步骤。首先，我需要一种方法来确定待翻译文本的源语言。我还需要知道每个用户的首选语言，因为我只想对以其他语言写的帖子显示"翻译"链接。当翻译链接被提供并且用户点击它时，我需要将 Ajax 请求发送到服务器，然后服务器将联系第三方翻译 API。一旦服务器返回带有翻译文本的响应，客户端 JavaScript 代码就会将此文本动态插入到页面中。你肯定能注意到，这里有几个不小的问题。我将逐一审视这些问题。

## 语言识别

第一个问题是识别一篇帖子是用什么语言写的。这不是一门精确的科学，因为并非总能明确地确定文本的语言，但在大多数情况下，自动检测的效果相当不错。在 Python 中，有一个很好的语言检测库叫做 `langdetect`。

```
(venv) $ pip install langdetect

```

计划是将每篇博客帖子提供给这个包，以尝试确定语言。由于这种分析有点耗时，我不想在每次帖子渲染到页面时重复这项工作。我打算在帖子提交时设置检测到的语言。然后检测到的语言将被存储在 posts 表中。

第一步是向 `Post` 模型添加一个 `language` 字段：

*app/models.py*：向 Post 模型添加检测到的语言。

```
class Post(db.Model):
    # ...
    language: so.MappedOptional[str] = so.mapped_column(sa.String(5))

```

正如你所记得的，每次对数据库模型进行更改时，都需要执行数据库迁移：

```
(venv) $ flask db migrate -m "add language to posts"
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.autogenerate.compare Detected added column 'post.language'
  Generating migrations/versions/2b017edaa91f_add_language_to_posts.py ... done

```

然后需要将迁移应用到数据库：

```
(venv) $ flask db upgrade
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.runtime.migration Upgrade ae346256b650 -> 2b017edaa91f, add language to posts

```

我现在可以在提交帖子时检测并存储语言了：

*app/routes.py*：保存新帖子的语言。

```
from langdetect import detect, LangDetectException

@app.route('/', methods='GET', 'POST')
@app.route('/index', methods='GET', 'POST')
@login_required
def index():
    form = PostForm()
    if form.validate_on_submit():
        try:
            language = detect(form.post.data)
        except LangDetectException:
            language = ''
        post = Post(body=form.post.data, author=current_user,
                    language=language)
        # ...

```

通过此更改，每次提交帖子时，我都会将文本传递给 `detect()` 函数以尝试确定语言。如果无法识别语言，`langdetect` 包会抛出 `LangDetectException` 类型的异常。在这种情况下，我会稳妥行事，将空字符串保存到数据库中。我将采用这样的约定：任何语言设置为空字符串的帖子都被视为语言未知。

## 显示"翻译"链接

第二步是在与当前用户活动语言不同的帖子旁边添加"翻译"链接。

*app/templates/_post.html*：向帖子添加翻译链接。

```
                {% if post.language and post.language != g.locale %}
                <br><br>
                <a href="#">{{ _('Translate') }}</a>
                {% endif %}

```

我在 `_post.html` 子模板中进行此操作，这样该功能会出现在任何显示博客帖子的页面上。翻译链接只会出现在已检测到语言且该语言与 Flask-Babel 的 `locale_selector` 函数选择的语言不匹配的帖子上。回顾第 13 章，在 `before_request` 处理程序中，选定的语言环境被存储为 `g.locale`。链接文本需要以 Flask-Babel 可翻译的方式添加，所以我在定义时使用了 `_()` 函数。

请注意，这个链接还没有关联任何动作。我首先要弄清楚如何执行实际的翻译。

## 使用第三方翻译服务

两个主要的翻译服务是 Google Cloud Translation API 和 Microsoft Translator Text API。两者都是付费服务，并且都有针对低翻译量的免费入门级别。在本章中，我将实现微软的解决方案，但我会以方便替换的方式编写代码，如果你愿意，可以轻松更换翻译服务。

在使用 Microsoft Translator API 之前，你需要拥有一个 Azure（微软的云服务）帐户。你可以注册其免费层。注册过程中会要求你提供信用卡号，但只要你使用免费层，就不会被收费。

有了 Azure 账户后，进入 Azure 门户，点击"创建资源"按钮，在搜索框中输入"translator"并按回车。从搜索结果中找到 Translator 资源，点击"创建"按钮。现在你会看到一个表单，可以在其中定义一个新的翻译器资源并将其添加到你的帐户。按如下方式填写表单：

- 订阅：选择"即用即付"

- 资源组：点击"新建"，输入名称"microblog-translator"

- 区域：选择离你最近的区域

- 名称：输入"microblog"

- 定价层：选择"免费 F0（每月最多翻译 200 万个字符）"

点击"查看 + 创建"按钮继续到下一页，在那里你会看到所选选项的摘要。点击"创建"按钮确认创建翻译资源。等待几秒钟后，你会收到顶部栏的通知，告知翻译器资源已部署。点击"转到资源"按钮，然后点击左侧边栏的"密钥和端点"选项。现在你会看到两个密钥，标记为"密钥 1"和"密钥 2"。将任意一个密钥复制到剪贴板，然后在终端中将其设置为环境变量（如果你使用的是 Microsoft Windows，将 `export` 替换为 `set`）：

```
(venv) $ export MS_TRANSLATOR_KEY=<paste-your-key-here>

```

此密钥用于验证翻译服务，因此需要将其添加到应用配置中：

*config.py*：将 Microsoft Translator API 密钥添加到配置中。

```
class Config:
    # ...
    MS_TRANSLATOR_KEY = os.environ.get('MS_TRANSLATOR_KEY')

```

与配置值一样，我更喜欢将它们安装在环境变量中，然后从那里导入到 Flask 配置中。这对于敏感信息（如启用对第三方服务访问的密钥或密码）尤其重要。你绝对不想在代码中显式地写入这些信息。

Microsoft Translator API 是一个接受 HTTP 请求的 Web 服务。Python 中有几个 HTTP 客户端，但最流行且易于使用的是 `requests` 包。让我们将其安装到虚拟环境中：

```
(venv) $ pip install requests

```

下面是我编写的使用 Microsoft Translator API 翻译文本的函数。我将把它放在一个新的 *app/translate.py* 模块中：

*app/translate.py*：文本翻译函数。

```
import requests
from flask_babel import _
from app import app

def translate(text, source_language, dest_language):
    if 'MS_TRANSLATOR_KEY' not in app.config or \
            not app.config['MS_TRANSLATOR_KEY']:
        return _('Error: the translation service is not configured.')
    auth = {
        'Ocp-Apim-Subscription-Key': app.config['MS_TRANSLATOR_KEY'],
        'Ocp-Apim-Subscription-Region': 'westus',
    }
    r = requests.post(
        'https://api.cognitive.microsofttranslator.com'
        '/translate?api-version=3.0&from={}&to={}'.format(
            source_language, dest_language), headers=auth, json={'Text': text})
    if r.status_code != 200:
        return _('Error: the translation service failed.')
    return r.json()[0]['translations'][0]['text']

```

该函数接受待翻译文本以及源语言和目标语言代码作为参数，并返回包含翻译文本的字符串。它首先检查配置中是否有翻译服务的密钥，如果未定义密钥则返回错误。错误也是一个字符串，所以从外部看，它看起来就像翻译后的文本。这确保了在出错时，用户会看到有意义的错误消息。

`requests` 包的 `post()` 方法向作为第一个参数给出的 URL 发送 HTTP `POST` 请求。我使用的是翻译器资源"密钥和端点"页面中显示的基本 URL，即 https://api.cognitive.microsofttranslator.com/。翻译端点的路径是 /translate，如文档中所示。

源语言和目标语言需要作为查询字符串参数传递到 URL 中，分别命名为 `from` 和 `to`。API 还要求在查询字符串中提供 `api-version=3.0` 参数。待翻译文本需要以 JSON 格式放在请求体中，格式为 `{"Text": "the text to translate here"}`。

为了与服务进行身份验证，我需要传递添加到配置中的密钥。这个密钥需要放在一个名为 `Ocp-Apim-Subscription-Key` 的自定义 HTTP 头中。翻译器资源部署的区域也需要通过一个名为 `Ocp-Apim-Subscription-Region` 的头提供。需要提供的区域名称显示在"密钥和端点"页面中，就在两个密钥下方。在我的例子中，我选择了"美国西部"区域，所以是 `westus`，但如果你选择了不同的区域，则会有所不同。我创建了包含这两个头的 `auth` 字典，然后将其作为 `headers` 参数传递给 `requests`。

`requests.post()` 方法返回一个响应对象，其中包含服务提供的所有详细信息。我首先需要检查状态码是否为 200，这是请求成功的代码。如果得到其他状态码，说明发生了错误，此时我会返回一个错误字符串。如果状态码是 200，那么响应体包含一个 JSON 编码的翻译字符串，所以我只需要使用响应对象的 `json()` 方法将 JSON 解码成可用的 Python 字符串即可。JSON 响应是一个翻译列表，但由于我们只翻译一段文本，我可以获取第一个元素并在翻译结构中找到实际的翻译文本。

下面是一个 Python 控制台会话，展示了使用新的 `translate()` 函数：

```
>>> from app.translate import translate
>>> translate('Hi, how are you today?', 'en', 'es')  # English to Spanish
'Hola, ¿cómo estás hoy?'
>>> translate('Hi, how are you today?', 'en', 'de')  # English to German
'Are Hallo, how you heute?'
>>> translate('Hi, how are you today?', 'en', 'it')  # English to Italian
'Ciao, come stai oggi?'
>>> translate('Hi, how are you today?', 'en', 'fr')  # English to French
"Salut, comment allez-vous aujourd'hui ?"

```

很酷，对吧？现在是时候将这个功能集成到应用中了。

## 服务器端的 Ajax

我首先实现服务器端部分。当用户点击帖子下方显示的"翻译"链接时，将向服务器发出一个异步 HTTP 请求。我将在下一节向你展示如何做到这一点，所以现在我将专注于实现服务器端对此请求的处理。

异步（或 Ajax）请求与我之前在应用中创建的路由和视图函数类似，唯一的区别是它不返回 HTML 或重定向，而是仅返回数据，格式为 XML 或更常见的 JSON。下面是翻译视图函数，它调用 Microsoft Translator API 然后以 JSON 格式返回翻译后的文本：

*app/routes.py*：文本翻译视图函数。

```
from app.translate import translate

@app.route('/translate', methods=['POST'])
@login_required
def translate_text():
    data = request.get_json()
    return {'text': translate(data['text'],
                              data['source_language'],
                              data['dest_language'])}

```

正如你所看到的，这非常简洁。我将此路由实现为 `POST` 请求，这是客户端需要向服务器提交数据时的首选格式。

`request.get_json()` 方法返回一个包含客户端以 JSON 格式提交的数据的字典。我在此函数中所做的是调用上一节的 `translate()` 函数，直接从请求提交的 JSON 数据中传递三个参数。结果被封装到一个只有一个键 `text` 的字典中，作为响应返回。Flask 会自动将视图函数返回的字典格式化为 JSON。

例如，如果客户端想将字符串 `Hello, World!` 翻译成西班牙语，响应的负载将是：

```
{ "text": "Hola, Mundo!" }

```

## 客户端的 Ajax

现在服务器能够通过 */translate* URL 提供翻译服务了，我需要在用户点击上面添加的"翻译"链接时调用这个 URL，传递待翻译文本以及源语言和目标语言。如果你不熟悉在浏览器中使用 JavaScript，这将是一次很好的学习经历。

在浏览器中使用 JavaScript 时，当前显示的页面在内部由文档对象模型（DOM）表示。这是一个层次结构，引用了页面中存在的所有元素。在此上下文中运行的 JavaScript 代码可以对 DOM 进行更改，从而触发页面的变化。

首先讨论一下我的 JavaScript 代码如何获取需要发送给服务器端 `translate()` 函数的三个参数。要获取文本，我需要定位 DOM 中包含博客帖子正文的节点并读取其内容。为了便于识别包含博客帖子的 DOM 节点，我将为它们附加一个唯一的 ID。如果你查看 *_post.html* 模板，渲染帖子正文的那一行只是 `{{ post.body }}`。我打算将此内容包裹在一个 `<span>` 元素中。这不会改变任何视觉效果，但它给了我一个可以插入标识符的地方：

*app/templates/_post.html*：为每篇博客帖子添加 ID。

```
                <span id="post{{ post.id }}">{{ post.body }}</span>

```

这将为每篇博客帖子分配一个唯一标识符，格式为 `post1`、`post2` 等等，其中数字与每篇帖子的数据库标识符对应。现在每篇博客帖子都有了唯一标识符，我可以使用浏览器中可用的 `document.getElementById()` 函数来定位该帖子的 `<span>` 元素并提取其中的文本。例如，如果要获取 ID 为 123 的帖子的文本，我会这样做：

```
document.getElementById('post123').innerText

```

我还希望有一个地方，在收到服务器返回的翻译文本后能够插入它。为此，我将用翻译后的文本替换"翻译"链接，所以我需要有一个唯一的标识符来轻松定位它：

*app/templates/_post.html*：为翻译链接添加 ID。

```
                <span id="translation{{ post.id }}">
                    <a href="#">{{ _('Translate') }}</a>
                </span>

```

所以现在对于给定的帖子 ID，我有一个用于博客帖子的 `post<ID>` 节点，和一个相应的 `translation<ID>` 节点，一旦有了翻译文本，我将在其中替换翻译链接。

下一步是编写一个能够完成所有翻译工作的函数。这个函数将接受输入和输出 DOM 节点，以及源语言和目标语言。然后它将向服务器发出异步请求，传递所需的三个参数，最后用服务器返回的翻译文本替换翻译链接。这听起来工作量很大，但实现相当简短。为了方便起见，我将把这个函数添加到基础模板的 `<body>` 元素底部，这样它在应用的所有页面中都可用。

*app/templates/base.html*：客户端翻译函数。

```
    ...
    <script>
      async function translate(sourceElem, destElem, sourceLang, destLang) {
        document.getElementById(destElem).innerHTML =
          '<img src="{{ url_for('static', filename='loading.gif') }}">';
        const response = await fetch('/translate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json; charset=utf-8'},
          body: JSON.stringify({
            text: document.getElementById(sourceElem).innerText,
            source_language: sourceLang,
            dest_language: destLang
          })
        })
        const data = await response.json();
        document.getElementById(destElem).innerText = data.text;
      }
    </script>
  </body>
</html>

```

`translate()` 函数的前两个参数是帖子和翻译链接节点的唯一 ID，分别称为 `sourceElem` 和 `destElem`。第三和第四个参数是源语言和目标语言代码。该函数被定义为 `async` 关键字，这样它可以使用 `await` 关键字等待异步函数。

函数做的第一件事是装饰性的，但很酷：它用一个*旋转动画*图片替换翻译链接，让用户知道翻译正在进行中。这是通过将 `destElem` 引用的元素的 `innerHTML` 属性赋值来实现的，这实际上会用新的 HTML 替换该元素的内容。对于旋转动画，我将使用一个添加到 *app/static/loading.gif* 目录的小型动画 GIF，Flask 保留该目录用于静态文件。要生成引用此图片的 URL，我使用 `url_for()` 函数，传递特殊的路由名称 `static` 并将图片文件名作为参数。你可以在这章的下载包中找到 *loading.gif* 图片。

现在我有了一个漂亮的旋转动画替代了翻译链接，用户知道等待片刻后翻译就会出现。下一步是向我在上一节中定义的 */translate* URL 发送 `POST` 请求。为此我将使用浏览器提供的 `fetch()` 函数。该函数将数据提交给第一个参数中给出的 URL。作为第二个参数传递的字典定义了请求的特性，包括使用的 HTTP 方法、任何头信息以及包含数据的请求体。

请求体是一个使用 `JSON.stringify()` 函数生成的字符串，该函数接受一个数据字典并返回该数据的 JSON 负载。`Content-Type` 头被添加到请求中，以告知服务器数据是以 JSON 格式提供的。

`fetch()` 函数是异步的，这意味着它返回一个 promise 对象。为了简化处理，使用 `await` 关键字等待该函数完成。返回值是一个响应对象。

服务器在此请求中返回 JSON 数据，因此使用 `response.json()` 方法将其转换为字典（在 JavaScript 中称为"对象"）。这也是一个异步操作，因此再次使用 `await` 关键字。此转换的结果存储在 `data` 中。

函数的最后一行设置 `destElem` 节点（现在有一个旋转动画图片）的 `innerText` 属性为服务器返回的文本，这要么是输入文本的翻译版本，要么是错误消息。

所以现在剩下唯一的事情就是当用户点击翻译链接时，使用正确的参数触发 `translate()` 函数。有几种方法可以做到这一点，我打算将函数调用嵌入到链接的 `href` 属性中：

*app/templates/_post.html*：翻译链接处理程序。

```
                <span id="translation{{ post.id }}">
                    <a href="javascript:translate(
                                'post{{ post.id }}',
                                'translation{{ post.id }}',
                                '{{ post.language }}',
                                '{{ g.locale }}');">{{ _('Translate') }}</a>
                </span>

```

链接的 `href` 元素可以接受任何以 `javascript:` 为前缀的 JavaScript 代码，因此这是一种便捷的方式来调用翻译函数。由于这个链接是在客户端请求页面时由服务器渲染的，我可以使用 `{{ }}` 表达式来生成该函数的四个参数。每篇帖子都有自己的翻译链接，带有唯一生成的参数。

现在实时翻译功能就完成了！如果你在环境中设置了有效的 Microsoft Translator API 密钥，你现在应该能够触发翻译。假设你的浏览器设置为偏好英语，你需要用另一种语言写一篇帖子才能看到"翻译"链接。下面是一个示例：

在本章中，我引入了一些需要翻译成应用支持的所有语言的新文本，因此有必要更新翻译目录：

```
(venv) $ flask translate update

```

对于你自己的项目，你需要在每个语言仓库中编辑 *messages.po* 文件以包含这些新文本的翻译，但我已经在本章的下载包或 GitHub 仓库中创建了西班牙语翻译。

要发布新的翻译，需要编译它们：

```
(venv) $ flask translate compile

```

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
