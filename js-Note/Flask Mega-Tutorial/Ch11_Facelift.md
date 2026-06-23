# 第11部分：改头换面

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xi-facelift](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xi-facelift) | Flask Mega-Tutorial by Miguel Grinberg

---

这是Flask Mega-Tutorial系列的第十一部分，我将介绍如何用基于Bootstrap用户界面框架的新模板替换基本的HTML模板。

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

- 第11章：改头换面（本文）

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

你已经使用我的Microblog应用程序一段时间了，所以我相信你注意到了我没有花太多时间让它看起来美观，或者更准确地说，我根本没有花时间在这上面。我组合的模板非常基础，完全没有自定义样式。这有助于我专注于应用程序的实际逻辑，而不必分心去编写好看的HTML和CSS。

但到目前为止，我已经专注于这个应用程序的后端部分。所以在本章中，我将暂时休息一下，花些时间向你展示如何让应用程序看起来更精美、更专业。

本章将与之前的章节有所不同，因为我不会像往常在Python方面那样详细——毕竟Python才是本教程的主要主题。创建美观的网页是一个广泛的课题，与Python Web开发 largely 无关，但我将讨论一些基本指南和思路，告诉你如何着手处理这项任务，并且你还可以通过重新设计的应用程序来学习和研究。

*本章的GitHub链接：浏览、ZIP压缩包、差异对比。*

## CSS框架

虽然我们可以说编程很难，但我们的痛苦与Web设计师相比根本不算什么，他们必须创建在一系列Web浏览器上都能看起来漂亮且一致的网页。近年来情况有所好转，但某些浏览器仍然存在一些晦涩的bug或怪异行为，使得设计在任何地方都好看的网页变得非常困难。如果你还需要针对平板电脑和智能手机等资源和屏幕受限的浏览器，这就更加困难了。

如果你和我一样，只是一个想要创建体面网页的开发者，但没有时间或兴趣学习通过编写原始HTML和CSS来有效实现这一目标的底层机制，那么唯一实用的解决方案就是使用*CSS框架*来简化任务。走这条路你会失去一些创作自由，但另一方面，你的网页将在所有浏览器上都不需要太多努力就能看起来不错。CSS框架提供了一组高级CSS类，其中包含针对常见用户界面元素的预制样式。大多数框架还提供了JavaScript插件，用于处理纯HTML和CSS无法完成的事情。

## 介绍Bootstrap

最流行的CSS框架之一是Bootstrap。如果你想了解可以用这个框架设计什么样的页面，文档中有一些示例。

使用Bootstrap来样式化你的网页有以下几个好处：

- 在所有主流Web浏览器中呈现相似的外观

- 处理桌面、平板和手机屏幕尺寸

- 可自定义的布局

- 漂亮的导航栏、表单、按钮、警告框、弹窗等

使用Bootstrap最直接的方法就是简单地在基础模板中导入*bootstrap.min.css*文件。你可以下载该文件的副本并将其添加到项目中，也可以直接从CDN导入。然后你就可以根据文档（文档相当不错）开始使用它提供的通用CSS类。你可能还需要导入该框架的JavaScript代码，以便使用更高级的功能。

与大多数开源项目一样，Bootstrap在不断演进。Flask Mega-Tutorial的原始版本是围绕Bootstrap 3构建的。你正在阅读的修订版是围绕Bootstrap 5.3构建的。当前的Bootstrap集成方法相当通用，可以适用于更新版本的Bootstrap。

## 使用Bootstrap

将Bootstrap集成到Microblog的第一步是将其CSS和JavaScript文件添加到基础模板中。Bootstrap的快速入门页面提供了一个简短但完整的HTML页面作为示例，为了方便起见，我将其复制如下：

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootstrap demo</title>
    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
        crossorigin="anonymous">
    </head>
    <body>
        <h1>Hello, world!</h1>
        <script
            src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
            crossorigin="anonymous">
        </script>
    </body>
</html>

```

我将其与我的*base.html*模板结合起来的方法是：将上述内容作为新的基础模板，分别用原始基础模板中的标题和正文内容替换`<title>`和`<h1>`标签。

下一步是将基本的导航栏替换为Bootstrap更美观的导航栏。Bootstrap的导航栏文档页面在顶部附近展示了一个不错的示例。以这个示例为指导，我创建了一个导航栏，其中包含Microblog的首页、发现、个人资料、登录和注销链接。为了美观，我将个人资料、登录和注销链接配置为显示在最右侧。

使用Bootstrap时，需要了解一些基本的布局原语。其中最重要的是容器（container），它定义了页面的内容区域。两种主要的容器是`container`和`container-fluid`。前者将页面配置为使用五种预定义页面宽度之一，并将内容居中显示在浏览器窗口中。而流体容器则允许使用页面的整个宽度。对于这个应用程序，我决定使用默认容器，因为它可以防止页面无论屏幕大小如何都变得过宽。这就是我要使用的容器，因此页面的内容部分将被包裹在这样的容器中：

```
<div class="container">
    ... page contents here ...
</div>

```

*base.html*模板中最后一个需要适配的HTML部分是显示闪现消息的区域。Bootstrap的警告组件非常适合这个需求。

你可以从本章的GitHub仓库获取完全重新设计的*base.html*模板。下面你可以看到简化的结构，以便了解它的样子：

*app/templates/base.html*：重新设计的基础模板。

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    {% if title %}
    <title>{{ title }} - Microblog</title>
    {% else %}
    <title>Welcome to Microblog</title>
    {% endif %}
    <link ... bootstrap CSS ...>
  </head>
  <body>
    <nav>
      ... navigation bar (see complete code on GitHub) ...
    </nav>
    <div class="container mt-3">
      {% with messages = get_flashed_messages() %}
      {% if messages %}
        {% for message in messages %}
        <div class="alert alert-info" role="alert">{{ message }}</div>
        {% endfor %}
      {% endif %}
      {% endwith %}
      {% block content %}{% endblock %}
    </div>
    <script ... bootstrap JavaScript ...></script>
  </body>
</html>

```

有了重新设计的基础模板，应用程序的外观已经有了显著的改善，而且不需要修改一行Python代码。如果你想亲自看看，请使用本章开头显示的链接从GitHub仓库下载`base.html`的副本。

## 渲染Bootstrap表单

Bootstrap在表单字段的渲染方面做得非常出色，它提供的表单字段比浏览器默认的字段要美观和干净得多。Bootstrap文档中也有关于表单的部分。在该部分的开始附近，有一个登录表单的示例，展示了基本的HTML结构。

每个字段所需的HTML代码有些冗长。下面你可以看到文档中示例表单的一个文本字段：

```
  <div class="mb-3">
    <label for="exampleInputPassword1" class="form-label">Password</label>
    <input type="password" class="form-control" id="exampleInputPassword1">
  </div>

```

但这对于Microblog的需求来说太简单了，因为Microblog包含字段验证，并且可能需要向用户显示验证错误。文档页面有一个关于服务器端验证的部分，展示了如何样式化带有错误消息的字段。以下是一个示例：

```
  <div class="col-md-3">
    <label for="validationServer05" class="form-label">Zip</label>
    <input type="text" class="form-control is-invalid" id="validationServer05" aria-describedby="validationServer05Feedback" required>
    <div id="validationServer05Feedback" class="invalid-feedback">
      Please provide a valid zip.
    </div>
  </div>

```

不幸的是，在每个表单的每个字段中都要输入如此大量的样板代码是不可行的。这太耗时且容易出错。一种解决方案是利用Jinja的*宏*，它允许你定义可重用的HTML片段，然后像函数一样从模板中调用它们。

例如，一个文本字段的Jinja宏如下所示：

```
{% macro form_field(field) %}
  <div class="mb-3">
    {{ field.label(class='form-label') }}
    {{ field(class='form-control' + (' is-invalid' if field.errors else '')) }}
    {%- for error in field.errors %}
    <div class="invalid-feedback">{{ error }}</div>
    {%- endfor %}
  </div>
{% endmacro %}

```

注意如何使用条件语句来在字段包含一个或多个错误消息时选择性地添加错误样式。

将宏定义在*templates*目录下名为*bootstrap_wtf.html*的文件中，当需要渲染字段时可以调用该宏。例如：

```
{% import "bootstrap_wtf.html" as wtf %}
...
{{ wtf.form_field(form.username) }}

```

字段渲染宏可以扩展为也支持复选框、下拉选择框、提交按钮和其他字段类型的渲染。它还可以接受第二个参数，一个布尔值，指示该字段是否应在页面上自动获得焦点，这应该在表单的第一个字段上执行。为了更加方便，可以创建另一个宏来渲染整个表单，只需遍历表单字段并为每个字段调用`form_field()`宏即可。

完整的*bootstrap_wtf.html*文件可在本章开头链接的GitHub仓库中找到。它包含了上面展示的`form_field()`宏的更完整版本，以及另一个名为`quick_form()`的宏，它接收一个表单对象并使用第一个宏渲染其所有字段。

这在实际的应用程序表单上看起来如何？下面是一个重新设计的*register.html*模板示例：

*app/templates/register.html*：用户注册模板。

```
{% extends "base.html" %}
{% import 'bootstrap_wtf.html' as wtf %}

{% block content %}
    <h1>Register</h1>
    {{ wtf.quick_form(form) }}
{% endblock %}

```

这难道不棒吗？顶部的`import`语句在模板方面与Python的导入类似。这添加了一个`wtf.quick_form()`宏，只需一行代码就能渲染完整的表单，包括验证错误，并且所有样式都适合Bootstrap框架。

再次声明，我不打算展示我对应用程序中其他表单所做的所有更改，但这些更改都在你可以从GitHub下载或检查的模板中。

## 博客文章的渲染

渲染单篇博客文章的显示逻辑被抽象为一个名为*_post.html*的子模板。我需要对这份模板做些小调整，使其在Bootstrap下看起来好看。

*app/templates/_post.html*：重新设计的帖子子模板。

```
    <table class="table table-hover">
        <tr>
            <td width="70px">
                <a href="{{ url_for('user', username=post.author.username) }}">
                    <img src="{{ post.author.avatar(70) }}" />
                </a>
            </td>
            <td>
                <a href="{{ url_for('user', username=post.author.username) }}">
                    {{ post.author.username }}
                </a>
                says:
                <br>
                {{ post.body }}
            </td>
        </tr>
    </table>

```

## 渲染分页链接

分页链接是Bootstrap提供支持的另一个领域。为此，我再次查阅了Bootstrap文档并改编了他们的一个示例。以下是在*index.html*页面中的显示效果：

*app/templates/index.html*：重新设计的分页链接。

```
    ...
    <nav aria-label="Post navigation">
        <ul class="pagination">
            <li class="page-item{% if not prev_url %} disabled{% endif %}">
                <a class="page-link" href="{{ prev_url }}">
                    <span aria-hidden="true">&larr;</span> Newer posts
                </a>
            </li>
            <li class="page-item{% if not next_url %} disabled{% endif %}">
                <a class="page-link" href="{{ next_url }}">
                    Older posts <span aria-hidden="true">&rarr;</span>
                </a>
            </li>
        </ul>
    </nav>

```

请注意，在此实现中，当某个方向没有更多内容时，我不是隐藏上一页或下一页链接，而是应用禁用状态，这将使链接显示为灰色。

我不打算在这里展示，但*user.html*也需要进行类似的更改。本章的下载包中包含这些更改。

## 前后对比

要用这些更改更新你的应用程序，请下载本章的zip文件并相应地更新你的模板。

下面你可以看到一些前后对比的图片，了解改头换面的效果。请记住，这一改变是在没有更改一行应用程序逻辑的情况下实现的！

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
