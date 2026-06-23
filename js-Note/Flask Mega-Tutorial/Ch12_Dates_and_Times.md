# 第12部分：日期和时间

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xii-dates-and-times](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xii-dates-and-times) | Flask Mega-Tutorial by Miguel Grinberg

---

这是Flask Mega-Tutorial系列的第十二部分，我将介绍如何处理日期和时间，使其对所有用户都适用，无论他们身处何地。

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

- 第10章：电子邮件支持

- 第11章：改头换面

- 第12章：日期和时间（本文）

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

我的Microblog应用程序长期以来被忽视的一个方面是日期和时间的显示。到目前为止，我只是让Python在`User`模型中渲染了`datetime`对象，甚至没有费心去显示`Post`模型中的那个。在本章中，你将学习如何处理这些时间戳。

*本章的GitHub链接：浏览、ZIP压缩包、差异对比。*

## 时区地狱

在服务器上使用Python来渲染向用户呈现在其Web浏览器上的日期和时间实际上不是一个好主意，因为服务器认为是本地时间的东西，对于生活在不同时区的用户来说毫无意义。

很明显，服务器必须管理一致且独立于其自身位置和用户位置的时间。如果这个应用程序发展到需要在世界不同地区部署多个生产服务器，我不希望每个服务器以不同的时区向数据库写入时间戳，因为这将使处理这些时间变得不可能。由于UTC是最常用的统一时区，并且在`datetime`类中得到支持，这就是我将要使用的。

在第4章中，你已经看到了如何为博客文章生成UTC时间戳。作为提醒，以下是一个简短的示例，展示了其实现方式：

```
>>> from datetime import datetime, timezone
>>> str(datetime.now(timezone.utc))
'2023-11-19 19:05:51.288261+00:00'

```

但这种方法存在一个重要问题。对于不同地点的用户，如果他们看到的是UTC时区的时间，将很难判断帖子是何时发布的。他们需要提前知道时间是UTC格式，这样才能在脑海中将其调整到自己的时区。想象一下，一个在PDT时区（美国西海岸）的用户在下午3:00发布了某条内容，然后立即看到该帖子显示的是UTC时间晚上10:00（或者更准确地说22:00）。这将非常令人困惑。

虽然从服务器的角度来看，将时间戳标准化为UTC非常有意义，但这给用户带来了可用性问题。本章的目标是提供一个解决方案，使服务器管理的所有时间戳都保持在UTC时区，同时又不会疏远用户。

## 时区转换

解决这个问题的显而易见的方法是在渲染时间戳时，将所有存储的UTC时间转换为每个用户的本地时间。这样服务器可以继续使用UTC保持一致性，同时针对每个用户进行即时转换解决了可用性问题。这个解决方案的棘手之处在于要知道每个用户的位置。

许多网站都有一个配置页面，用户可以在其中指定其时区。这需要我添加一个新页面，包含一个表单，在其中向用户提供一个有时区列表的下拉选择框。可以在用户首次访问网站时（作为注册的一部分）要求他们输入时区。

虽然这是一个可行的解决方案，但要求用户输入一个他们已经在其操作系统中配置过的信息显得有些奇怪。如果我能直接从他们的计算机中获取时区设置，似乎会更高效。

事实证明，Web浏览器知道用户的时区，并通过标准的日期和时间JavaScript API将其暴露出来。实际上，有两种方法可以利用JavaScript提供的时区信息：

- "老派"方法是在用户首次登录应用程序时，让Web浏览器以某种方式将时区信息发送到服务器。这可以通过Ajax调用来实现，或者更简单地通过meta刷新标签来实现。一旦服务器知道了时区，它可以将其保存在用户会话中或写入数据库的users表中，然后从那时起在渲染模板时用它来调整所有时间戳。

- "新派"方法是不对服务器做任何更改，让从UTC到本地时区的转换在浏览器中通过JavaScript完成。

两种方法都可行，但第二种有一个很大的优势。知道用户的时区并不总是足以以用户期望的格式显示日期和时间。浏览器还可以访问系统区域设置配置，它指定了诸如上午/下午与24小时制、DD/MM/YYYY与MM/DD/YYYY日期渲染格式以及许多其他文化或区域风格等信息。

如果这还不够，新派方法还有一个优势。有一个开源库可以完成所有这些工作！

## 介绍Moment.js和Flask-Moment

Moment.js是一个小型开源JavaScript库，它将日期和时间渲染提升到了另一个水平，因为它提供了所有可以想象到的格式化选项，甚至更多。不久前，我创建了Flask-Moment，这是一个小型Flask扩展，使得将moment.js集成到你的应用程序中变得非常容易。

那么让我们开始安装Flask-Moment：

```
(venv) $ pip install flask-moment

```

这个扩展按照通常的方式添加到Flask应用程序中：

*app/__init__.py*：Flask-Moment实例。

```
# ...
from flask_moment import Moment

app = Flask(__name__)
# ...
moment = Moment(app)
# ...

```

与其他扩展不同，Flask-Moment与*moment.js*一起工作，因此应用程序的所有模板都必须包含这个库。为了确保这个库始终可用，我将其添加到基础模板中。这可以通过两种方式完成。最直接的方法是显式添加一个导入该库的`<script>`标签，但Flask-Moment使得这一过程更简单，它暴露了一个`moment.include_moment()`函数来生成`<script>`标签：

*app/templates/base.html*：在基础模板中包含moment.js。

```
...
    {{ moment.include_moment() }}
  </body>
</html>

```

在大多数情况下，应用程序使用的JavaScript库被包含在`<body>`内容的末尾，也就是Bootstrap JavaScript代码所在的位置。

## 使用Moment.js

Moment.js向浏览器提供了一个`moment`类。渲染时间戳的第一步是创建这个类的一个对象，传入ISO 8601格式的所需时间戳。以下是一个在浏览器JavaScript控制台中运行的示例：

```
t = moment('2021-06-28T21:45:23+00:00')

```

如果你不熟悉ISO 8601日期和时间的标准格式，其格式如下：

```
{yyyy}-{mm}-{dd}T{hh}:{mm}:{ss}{tz}

```

我已经决定只使用UTC时区，所以最后一部分始终是`+00:00`，或者在某些情况下是等价的`Z`，它在ISO 8601标准中代表UTC。

`moment`对象提供了多种用于不同渲染选项的方法。以下是一些最常见的选项：

```
moment('2021-06-28T21:45:23+00:00').format('L')
'06/28/2021'
moment('2021-06-28T21:45:23+00:00').format('LL')
'June 28, 2021'
moment('2021-06-28T21:45:23+00:00').format('LLL')
'June 28, 2021 10:45 PM'
moment('2021-06-28T21:45:23+00:00').format('LLLL')
'Monday, June 28, 2021 10:45 PM'
moment('2021-06-28T21:45:23+00:00').format('dddd')
'Monday'
moment('2021-06-28T21:45:23+00:00').fromNow()
'2 years ago'

```

这个示例创建了一个moment对象，初始化为2021年6月28日晚上9:45 UTC。你可以看到我上面尝试的所有选项都渲染为UTC+1，这是我计算机上配置的时区。你可以在浏览器的控制台中输入上述命令，确保打开控制台的页面包含了moment.js。你可以在microblog上操作，只要你做了上述更改以包含moment.js，或者在*https://momentjs.com/*上操作。

注意不同的方法如何创建不同的表示形式。使用`format()`方法，你可以通过格式字符串来控制输出的格式。`fromNow()`方法很有趣，因为它相对于当前时间渲染时间戳，因此你会得到诸如"a minute ago"或"in two hours"之类的输出。

如果你直接在JavaScript中工作，上述调用会返回一个包含渲染后时间戳的字符串。然后你需要将这个文本插入到页面的适当位置，这不幸地需要操作DOM。Flask-Moment扩展通过在模板中启用类似于JavaScript的`moment`对象，大大简化了moment.js的使用。

让我们看看个人资料页面中出现的时间戳。当前的*user.html*模板让Python生成时间的字符串表示。我现在可以使用Flask-Moment来渲染这个时间戳，如下所示：

*app/templates/user.html*：使用moment.js渲染时间戳。

```
                {% if user.last_seen %}
                <p>Last seen on: {{ moment(user.last_seen).format('LLL') }}</p>
                {% endif %}

```

正如你所看到的，Flask-Moment使用的语法与JavaScript库的语法类似，唯一的区别是传递给`moment()`的参数现在是一个Python `datetime`对象，而不是ISO 8601字符串。从模板发出的`moment()`调用会自动生成所需的JavaScript代码，将渲染后的时间戳插入到DOM的适当位置。

第二个可以利用Flask-Moment的地方是*_post.html*子模板，它从首页和用户页面被调用。在当前版本的模板中，每篇帖子前面都有一行"username says:"。现在我可以添加一个使用`fromNow()`渲染的时间戳：

*app/templates/_post.html*：在帖子子模板中渲染时间戳。

```
                <a href="{{ url_for('user', username=post.author.username) }}">
                    {{ post.author.username }}
                </a>
                said {{ moment(post.timestamp).fromNow() }}:
                <br>
                {{ post.body }}

```

下面你可以看到这两个时间戳在使用Flask-Moment和moment.js渲染时的效果：

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
