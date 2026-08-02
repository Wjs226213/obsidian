# 第二部分：模板

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-ii-templates](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-ii-templates) | Flask Mega-Tutorial 作者 Miguel Grinberg

---

在 Flask Mega-Tutorial 系列的第二部分中，我将讨论如何使用*模板*。

您正在阅读的是 2024 版的 Flask Mega-Tutorial。本课程完整版也可以在亚马逊上以电子书和平装本的形式订购。感谢您的支持！

如果您正在寻找 2018 版的课程，可以在此处找到。

作为参考，以下是本系列文章的完整列表：

- 第 1 章：Hello, World!

- 第 2 章：模板（本文）

- 第 3 章：Web 表单

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

完成第 1 章后，您应该有一个简单但功能完整的 Web 应用程序，其文件结构如下：

```
microblog\
  venv\
  app\
    __init__.py
    routes.py
  microblog.py

```

要运行应用程序，您在终端会话中设置 `FLASK_APP=microblog.py`（或者更好的做法，添加一个包含此变量的 *.flaskenv* 文件），然后执行 `flask run`。这将启动一个带有该应用程序的 Web 服务器，您可以通过在浏览器地址栏中输入 *http://localhost:5000/* URL 来打开它。

在本章中，您将继续处理同一个应用程序，特别是您将学习如何生成更复杂的网页，这些网页具有复杂的结构和许多动态组件。如果到目前为止有关应用程序或开发流程的任何内容不清楚，请在继续之前重新阅读第 1 章。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## 什么是模板？

我希望我的微博应用程序的主页有一个欢迎用户的标题。目前，我将忽略应用程序还没有用户概念的事实，因为这将在后面实现。相反，我将使用一个*模拟*用户，用一个 Python 字典来实现，如下所示：

```
user = {'username': 'Miguel'}

```

创建模拟对象是一种有用的技术，它允许您专注于应用程序的一部分，而不必担心系统中尚不存在的其他部分。我想设计应用程序的主页，我不想因为没有用户系统而分心，所以我就创建了一个模拟用户对象，以便继续前进。

应用程序中的视图函数返回一个简单的字符串。我现在要做的是将该返回的字符串扩展成一个完整的 HTML 页面，大概像这样：

*app/routes.py*：从视图函数返回完整的 HTML 页面

```
from app import app

@app.route('/')
@app.route('/index')
def index():
    user = {'username': 'Miguel'}
    return '''
<html>
    <head>
        <title>Home Page - Microblog</title>
    </head>
    <body>
        <h1>Hello, ''' + user'username' + '''!</h1>
    </body>
</html>'''

```

如果您不熟悉 HTML，我建议您阅读维基百科上的 HTML 标记语言以获得简要介绍。

按上述方式更新视图函数，然后再次运行应用程序，看看它在浏览器中的效果。

我希望您同意我的观点，上述用于向浏览器提供 HTML 的解决方案并不好。想一想，当您添加来自用户的博客帖子（这些帖子会不断变化）时，这个视图函数中的代码会变得多么复杂。应用程序还将有更多与其他 URL 关联的视图函数，所以想象一下，如果有一天我决定更改此应用程序的布局，并且必须更新每个视图函数中的 HTML。这显然不是一个随着应用程序增长而可扩展的方案。

如果您能将应用程序的逻辑与网页的布局或呈现分开，那么事情就会组织得更好，您不觉得吗？您甚至可以聘请网页设计师来创建出色的网站，而您在 Python 中编写应用程序逻辑。

模板有助于实现这种呈现与业务逻辑的分离。在 Flask 中，模板编写为单独的文件，存储在应用程序包内的 *templates* 文件夹中。确保您位于 *microblog* 目录中后，创建用于存储模板的目录：

```
(venv) $ mkdir app/templates

```

下面您会看到您的第一个模板，其功能与上面 `index()` 视图函数返回的 HTML 页面类似。将此文件写入 *app/templates/index.html*：

*app/templates/index.html*：主页模板

```
<!doctype html>
<html>
    <head>
        <title>{{ title }} - Microblog</title>
    </head>
    <body>
        <h1>Hello, {{ user.username }}!</h1>
    </body>
</html>

```

这是一个标准的简短 HTML 页面。此页面中唯一有趣的地方是有几个用于动态内容的占位符，包含在 `{{ ... }}` 部分中。这些占位符代表页面中可变的部分，只有在运行时才能知道。

现在页面的呈现已被转移到了 HTML 模板，视图函数可以简化：

*app/routes.py*：使用 render_template() 函数

```
from flask import render_template
from app import app

@app.route('/')
@app.route('/index')
def index():
    user = {'username': 'Miguel'}
    return render_template('index.html', title='Home', user=user)

```

这样看起来好多了，对吧？尝试这个新版本的应用程序，看看模板是如何工作的。在浏览器中加载页面后，您可能想查看 HTML 源代码，并将其与原始模板进行比较。

将模板转换为完整 HTML 页面的操作称为*渲染*。要渲染模板，我必须导入 Flask 框架提供的一个名为 `render_template()` 的函数。此函数接受一个模板文件名和一系列模板参数，并返回相同的模板，但其中所有占位符都被替换为实际值。

`render_template()` 函数调用 Flask 框架自带的 Jinja 模板引擎。Jinja 将 `{{ ... }}` 代码块替换为 `render_template()` 调用中提供的参数对应的值。

## 条件语句

您已经看到 Jinja 如何在渲染过程中用实际值替换占位符，但这只是 Jinja 在模板文件中支持的众多强大操作之一。例如，模板还支持控制语句，位于 `{% ... %}` 代码块内。下一个版本的 *index.html* 模板添加了一个条件语句：

*app/templates/index.html*：模板中的条件语句

```
<!doctype html>
<html>
    <head>
        {% if title %}
        <title>{{ title }} - Microblog</title>
        {% else %}
        <title>Welcome to Microblog!</title>
        {% endif %}
    </head>
    <body>
        <h1>Hello, {{ user.username }}!</h1>
    </body>
</html>

```

现在模板更智能了一些。如果视图函数忘记为 `title` 占位符变量传递值，那么模板不会显示空标题，而是提供一个默认标题。您可以通过在视图函数的 `render_template()` 调用中删除 `title` 参数来测试这个条件语句的效果。

## 循环

登录用户可能希望在主頁上看到来自已连接用户的最近帖子，所以我现在要做的是扩展应用程序以支持这一点。

再次，我将依靠方便的模拟对象技巧来创建一些用户和一些要显示的帖子：

*app/routes.py*：视图函数中的模拟帖子

```
from flask import render_template
from app import app

@app.route('/')
@app.route('/index')
def index():
    user = {'username': 'Miguel'}
    posts = 
        {
            'author': {'username': 'John'},
            'body': 'Beautiful day in Portland!'
        },
        {
            'author': {'username': 'Susan'},
            'body': 'The Avengers movie was so cool!'
        }
    
    return render_template('index.html', title='Home', user=user, posts=posts)

```

为了表示用户的帖子，我使用了一个列表，其中每个元素是一个包含 `author` 和 `body` 字段的字典。当我真正实现用户和博客帖子时，我将尽量保持这些字段名称不变，这样我使用这些模拟对象设计和测试主页模板所做的所有工作，在引入真实用户和帖子后仍然有效。

在模板方面，我必须解决一个新问题。帖子列表可以有任意数量的元素，由视图函数决定在页面中呈现多少帖子。模板不能对帖子的数量做任何假设，因此它需要准备好以通用方式渲染视图发送的任意数量的帖子。

对于这类问题，Jinja 提供了 `for` 控制结构：

*app/templates/index.html*：模板中的 for 循环

```
<!doctype html>
<html>
    <head>
        {% if title %}
        <title>{{ title }} - Microblog</title>
        {% else %}
        <title>Welcome to Microblog</title>
        {% endif %}
    </head>
    <body>
        <h1>Hi, {{ user.username }}!</h1>
        {% for post in posts %}
        <div><p>{{ post.author.username }} says: <b>{{ post.body }}</b></p></div>
        {% endfor %}
    </body>
</html>

```

很简单，对吧？试试这个新版本的应用程序，并尝试在帖子列表中添加更多内容，看看模板如何自适应地渲染视图函数发送的所有帖子。

## 模板继承

如今大多数 Web 应用程序在页面顶部都有一个导航栏，其中包含一些常用链接，例如编辑个人资料、登录、注销等链接。我可以很容易地在 `index.html` 模板中添加一些 HTML 代码来添加导航栏，但是随着应用程序的增长，我将在其他页面中也需要这个相同的导航栏。我不希望在许多 HTML 模板中维护导航栏的多个副本，如果可能的话，不重复自己是良好的实践。

Jinja 有一个模板继承功能，专门解决了这个问题。本质上，您可以做的是将页面布局中所有模板共有的部分移动到一个基础模板中，所有其他模板都从此基础模板派生。

所以我现在要做的是定义一个名为 `base.html` 的基础模板，其中包含一个简单的导航栏以及我之前实现的标题逻辑。您需要在文件 *app/templates/base.html* 中写入以下模板：

*app/templates/base.html*：带导航栏的基础模板

```
<!doctype html>
<html>
    <head>
      {% if title %}
      <title>{{ title }} - Microblog</title>
      {% else %}
      <title>Welcome to Microblog</title>
      {% endif %}
    </head>
    <body>
        <div>Microblog: <a href="/index">Home</a></div>
        <hr>
        {% block content %}{% endblock %}
    </body>
</html>

```

在这个模板中，我使用了 `block` 控制语句来定义派生模板可以插入自身内容的位置。代码块被赋予唯一的名称，派生模板在提供其内容时可以引用这些名称。

有了基础模板，我现在可以通过让 *index.html* 继承自 *base.html* 来简化它：

*app/templates/index.html*：继承自基础模板

```
{% extends "base.html" %}

{% block content %}
    <h1>Hi, {{ user.username }}!</h1>
    {% for post in posts %}
    <div><p>{{ post.author.username }} says: <b>{{ post.body }}</b></p></div>
    {% endfor %}
{% endblock %}

```

由于 *base.html* 模板现在将负责通用的页面结构，我已从 *index.html* 中删除了所有这些元素，只保留了内容部分。`extends` 语句建立了两个模板之间的继承关系，这样 Jinja 就知道当它被要求渲染 `index.html` 时，需要将其嵌入到 `base.html` 内部。两个模板具有名称匹配的 `block` 语句（名称为 `content`），这就是 Jinja 如何知道将两个模板合并为一个的方式。现在，如果我需要为应用程序创建其他页面，我可以将它们创建为从同一个 *base.html* 模板派生的模板，这样我就可以让应用程序的所有页面共享相同的外观和风格，而无需重复代码。

继续下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
