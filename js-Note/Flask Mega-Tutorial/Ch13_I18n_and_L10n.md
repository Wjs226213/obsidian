# 第13部分：国际化与本地化

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xiii-i18n-and-l10n](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xiii-i18n-and-l10n) | Flask Mega-Tutorial by Miguel Grinberg

---

这是Flask Mega-Tutorial系列的第十三部分，我将介绍如何扩展Microblog以支持多种语言。在此过程中，你还将学习如何为flask命令创建自己的CLI扩展。

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

- 第12章：日期和时间

- 第13章：国际化与本地化（本文）

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

本章的主题是国际化和本地化，通常缩写为I18n和L10n。为了使我的应用程序对不讲英语的用户友好，我将实现一个翻译工作流程，在翻译团队的帮助下，我可以向用户提供多种语言选择的应用程序。

*本章的GitHub链接：浏览、ZIP压缩包、差异对比。*

## 介绍Flask-Babel

正如你可能猜到的，有一个Flask扩展使得处理翻译变得非常容易。这个扩展叫做Flask-Babel，通过pip安装：

```
(venv) $ pip install flask-babel

```

作为本章的一部分，我将向你展示如何将应用程序翻译成西班牙语，因为我恰好会这门语言。我也可以与其他语言的翻译合作，支持更多的语言。为了跟踪支持的语言列表，我将添加一个配置变量：

*config.py*：支持的语言列表。

```
class Config:
    # ...
    LANGUAGES = 'en', 'es'

```

对于这个应用程序，我使用的是两个字母的语言代码，但如果需要更具体，也可以添加国家代码。例如，你可以使用`en-US`、`en-GB`和`en-CA`来支持美国英语、英国英语和加拿大英语作为不同的语言。

`Babel`实例在初始化时需要传入一个`locale_selector`参数，该参数必须设置为一个函数，这个函数将在每个请求时被调用。该函数可以查看用户请求并为该请求选择最佳的语言翻译。以下是Flask-Babel扩展的初始化：

*app/__init__.py*：初始化Flask-Babel。

```
from flask import request
# ...
from flask_babel import Babel

def get_locale():
    return request.accept_languages.best_match(app.config'LANGUAGES')

app = Flask(__name__)
# ...
babel = Babel(app, locale_selector=get_locale)
# ...

```

这里我使用了Flask的`request`对象的一个名为`accept_languages`的属性。这个对象提供了一个高级接口，用于处理客户端随请求发送的Accept-Language头。这个头指定了客户端语言和区域设置偏好，以加权列表的形式呈现。该头的内容可以在浏览器的偏好设置页面中配置，默认值通常从计算机操作系统的语言设置中导入。大多数人甚至不知道存在这样的设置，但这很有用，因为用户可以提供一系列首选语言，每种语言都有一个权重。如果你好奇，以下是一个复杂的`Accept-Languages`头的示例：

```
Accept-Language: da, en-gb;q=0.8, en;q=0.7

```

这表示丹麦语（`da`）是首选语言（默认权重=1.0），其次是英国英语（`en-GB`）权重0.8，最后是通用英语（`en`）权重0.7。

要选择最佳语言，你需要将客户端请求的语言列表与应用程序支持的语言进行比较，并使用客户端提供的权重找到最佳语言。实现此逻辑的代码有些复杂，但全部被封装在`request.accept_languages`的`best_match()`方法中，该方法将应用程序提供的语言列表作为参数，并返回最佳选择。

## 在Python源代码中标记要翻译的文本

好了，现在来说坏消息。当让应用程序支持多种语言时，正常的工作流程是在源代码中标记所有需要翻译的文本。标记文本后，Flask-Babel将扫描所有文件并使用gettext工具将这些文本提取到单独的翻译文件中。不幸的是，这是一项繁琐但必须完成的任务，以实现翻译功能。

我将在这里展示几个标记的例子，但你可以从本章上面显示的GitHub仓库链接中获取完整的更改集。

标记文本的方式是将其包裹在一个习惯上称为`_()`的函数调用中，就是一个下划线。最简单的情况是源代码中出现的文字字符串。以下是一个`flash()`语句的例子：

```
from flask_babel import _
# ...
flash(_('Your post is now live!'))

```

其思想是`_()`函数包裹了基础语言（这里是英语）中的文本。这个函数将使用`get_locale()`函数选择的语言来为特定客户端找到正确的翻译。然后`_()`函数返回翻译后的文本，在本例中将成为`flash()`的参数。

不幸的是，并非所有情况都如此简单。考虑一下应用程序中的另一个`flash()`调用：

```
flash(f'User {username} not found.')

```

这段文本有一个动态组件插入在静态文本中间。`_()`函数有一种语法支持这种类型的文本，但它基于Python较旧的字符串替换语法：

```
flash(_('User %(username)s not found.', username=username))

```

还有一种更难处理的情况。某些字符串字面量是在Web请求之外赋值的，通常是在应用程序启动时，因此在评估这些文本时无法知道使用哪种语言。表单字段的标签就是一个例子。处理这些文本的唯一解决方案是找到一种方法，将字符串的评估延迟到它们被使用时——这将在实际请求上下文中进行。Flask-Babel提供了一个`_()`的*延迟评估*版本，叫做`lazy_gettext()`：

```
from flask_babel import lazy_gettext as _l

class LoginForm(FlaskForm):
    username = StringField(_l('Username'), validators=DataRequired())
    # ...

```

这里我导入了这个替代的翻译函数，并将其重命名为`_l()`，使其看起来与原始的`_()`类似。这个新函数将文本包裹在一个特殊对象中，触发翻译在稍后字符串在请求中使用时执行。

Flask-Login扩展在任何时候将用户重定向到登录页面时都会闪现一条消息。这条消息是英文的，来自扩展本身。为了确保这条消息也能被翻译，我将覆盖默认消息并提供我自己的消息，用`_l()`函数包装以实现延迟处理：

```
login = LoginManager(app)
login.login_view = 'login'
login.login_message = _l('Please log in to access this page.')

```

## 在模板中标记要翻译的文本

在上一节中，你已经看到了如何在Python源代码中标记可翻译文本，但这只是这个过程的一部分，因为模板文件中也有文本。`_()`函数在模板中也可用，因此过程类似。例如，考虑*404.html*中的这段HTML片段：

```
<h1>File Not Found</h1>

```

启用翻译后的版本变成：

```
<h1>{{ _('File Not Found') }}</h1>

```

注意，除了用`_()`包裹文本外，还需要添加`{{ ... }}`，以强制计算`_()`，而不是将其视为模板中的字面量。

对于具有动态组件的更复杂短语，也可以使用参数：

```
<h1>{{ _('Hi, %(username)s!', username=current_user.username) }}</h1>

```

*_post.html*中有一个特别棘手的案例，我花了些时间才弄清楚：

```
        {% set user_link %}
            <a href="{{ url_for('user', username=post.author.username) }}">
                {{ post.author.username }}
            </a>
        {% endset %}
        {{ _('%(username)s said %(when)s',
            username=user_link, when=moment(post.timestamp).fromNow()) }}

```

问题在于我希望`username`是一个指向用户个人资料页面的链接，而不仅仅是用户名，所以我不得不使用`set`和`endset`模板指令创建一个名为`user_link`的中间变量，然后将其作为参数传递给翻译函数。

正如我上面提到的，你可以下载包含所有Python源代码和模板中可翻译文本标记的应用程序版本。

## 提取要翻译的文本

一旦你拥有了所有`_()`和`_l()`标记就位的应用程序，就可以使用`pybabel`命令将它们提取到*.pot*文件中，*.pot*代表*portable object template*（可移植对象模板）。这是一个文本文件，包含所有被标记为需要翻译的文本。这个文件的目的是作为为每种语言创建翻译文件的模板。

提取过程需要一个小的配置文件，告诉`pybabel`应该扫描哪些文件以查找可翻译文本。以下是我为此应用程序创建的*babel.cfg*：

*babel.cfg*：PyBabel配置文件。

```
python: app/**.py
jinja2: app/templates/**.html

```

这些行分别定义了Python和Jinja模板文件的文件名模式。Flask-Babel将查找任何匹配这些模式的文件，并扫描其中被包裹用于翻译的文本。

要将所有文本提取到*.pot*文件，可以使用以下命令：

```
(venv) $ pybabel extract -F babel.cfg -k _l -o messages.pot .

```

`pybabel extract`命令读取通过`-F`选项给出的配置文件，然后扫描从命令中给定的目录（当前目录或本例中的`.`）开始，匹配配置源的所有代码和模板文件。默认情况下，`pybabel`会查找`_()`作为文本标记，但我也使用了延迟版本（导入为`_l()`），所以我需要使用`-k _l`告诉工具也要查找这些标记。`-o`选项提供输出文件的名称。

我应该指出，*messages.pot*文件不是一个需要纳入项目的文件。这是一个可以在需要时通过重新运行上述命令轻松重新生成的文件。因此无需将此文件提交到版本控制。

## 生成语言目录

该过程的下一步是为除基础语言（此处为英语）之外要支持的每种语言创建翻译。我说过我将从添加西班牙语（语言代码`es`）开始，所以这是执行此操作的命令：

```
(venv) $ pybabel init -i messages.pot -d app/translations -l es
creating catalog app/translations/es/LC_MESSAGES/messages.po based on messages.pot

```

`pybabel init`命令将*messages.pot*文件作为输入，并为`-l`选项中指定的语言在`-d`选项指定的目录中写入一个新的语言目录。我打算将所有翻译安装在*app/translations*目录中，因为Flask-Babel默认会在此处查找翻译文件。该命令将在此目录内创建一个*es*子目录，用于存放西班牙语数据文件。具体来说，将有一个名为*app/translations/es/LC_MESSAGES/messages.po*的新文件，这就是需要进行翻译的地方。

如果你想支持其他语言，只需使用你想要的语言代码重复上述命令，以便每种语言都有自己的包含*messages.po*文件的仓库。

每种语言仓库中创建的`messages.po`文件使用的格式是语言翻译的标准格式，即gettext实用程序使用的格式。以下是西班牙语*messages.po*开头的一些行：

```
# Spanish translations for PROJECT.
# Copyright (C) 2021 ORGANIZATION
# This file is distributed under the same license as the PROJECT project.
# FIRST AUTHOR <EMAIL@ADDRESS>, 2021.
#
msgid ""
msgstr ""
"Project-Id-Version: PROJECT VERSION\n"
"Report-Msgid-Bugs-To: EMAIL@ADDRESS\n"
"POT-Creation-Date: 2021-06-29 23:23-0700\n"
"PO-Revision-Date: 2021-06-29 23:25-0700\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\n"
"Language: es\n"
"Language-Team: es <LL@li.org>\n"
"Plural-Forms: nplurals=2; plural=(n != 1)\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=utf-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Generated-By: Babel 2.5.1\n"

#: app/email.py:21
msgid "Microblog Reset Your Password"
msgstr ""

#: app/forms.py:12 app/forms.py:19 app/forms.py:50
msgid "Username"
msgstr ""

#: app/forms.py:13 app/forms.py:21 app/forms.py:43
msgid "Password"
msgstr ""

```

如果跳过头部，可以看到后面是从`_()`和`_l()`调用中提取的字符串列表。对于每个文本，你会得到一个对应用程序中文本位置的引用。然后`msgid`行包含基础语言的文本，其后的`msgstr`行包含一个空字符串。这些空字符串需要被编辑为包含目标语言中该文本的版本。

有许多翻译应用程序可以处理`.po`文件。如果你觉得直接编辑文本文件就够了，那也行，但如果你在处理一个大型项目，建议使用专门的翻译编辑器。最流行的翻译应用程序是开源的poedit，可在所有主要操作系统上使用。如果你熟悉vim，那么po.vim插件提供了一些键映射，使得处理这些文件更加容易。

以下是我添加翻译后的西班牙语*messages.po*的一部分：

```
#: app/email.py:21
msgid "Microblog Reset Your Password"
msgstr "Microblog Nueva Contraseña"

#: app/forms.py:12 app/forms.py:19 app/forms.py:50
msgid "Username"
msgstr "Nombre de usuario"

#: app/forms.py:13 app/forms.py:21 app/forms.py:43
msgid "Password"
msgstr "Contraseña"

```

本章的下载包中也包含这个文件，所有翻译都已就位，因此你不必为这个应用程序担心这部分内容。

*messages.po*文件是翻译的源文件。当你想要开始使用这些翻译文本时，需要将此文件*编译*成运行时应用程序可以高效使用的格式。要编译应用程序的所有翻译，可以使用`pybabel compile`命令，如下所示：

```
(venv) $ pybabel compile -d app/translations
compiling catalog app/translations/es/LC_MESSAGES/messages.po to
app/translations/es/LC_MESSAGES/messages.mo

```

此操作在每个语言仓库中的*messages.po*旁边添加一个*messages.mo*文件。*.mo*文件是Flask-Babel将用来加载应用程序翻译的文件。

在你为西班牙语或你添加到项目中的任何其他语言创建了*messages.mo*文件之后，这些语言就可以在应用程序中使用了。如果你想看看应用程序在西班牙语下的显示效果，可以在Web浏览器中编辑语言配置，将西班牙语设置为首选语言。在Chrome中，这是在设置页面的高级部分：

如果你不想更改浏览器设置，另一种选择是通过让`get_locale()`函数始终返回你想要使用的语言来强制使用某种语言。对于西班牙语，你可以这样做：

*app/__init__.py*：选择最佳语言。

```
def get_locale():
    # return request.accept_languages.best_match(app.config'LANGUAGES')
    return 'es'

```

使用配置为西班牙语的浏览器运行应用程序，或者让`get_locale()`函数返回`es`，将使所有文本在应用程序中以西班牙语显示。

## 更新翻译

处理翻译时的一种常见情况是，你可能希望即使翻译文件不完整也开始使用它。这完全没问题，你可以编译一个不完整的*messages.po*文件，所有可用的翻译将被使用，而缺失的翻译将回退到基础语言。然后，你可以继续处理翻译，并在取得进展时再次编译以更新*messages.mo*文件。

另一种常见情况是，你在添加`_()`包装器时遗漏了一些文本。在这种情况下，你会看到那些被遗漏的文本将保持为英语，因为Flask-Babel不知道它们。在这种情况下，当你检测到缺少`_()`或`_l()`包装器的文本时，你需要添加包装器，然后执行更新过程，包括两个步骤：

```
(venv) $ pybabel extract -F babel.cfg -k _l -o messages.pot .
(venv) $ pybabel update -i messages.pot -d app/translations

```

`extract`命令与我之前发出的命令相同，但现在它将生成一个新版本的*messages.pot*，其中包含所有之前的文本以及你最近用`_()`或`_l()`包装的任何新内容。`update`调用接受新的*messages.pot*文件并将其合并到项目的所有*messages.po*文件中。这将是一个智能合并，其中任何现有文本都将保持不变，只有*messages.pot*中添加或删除的条目会受到影响。

在*messages.po*更新后，你可以继续翻译任何新的文本，然后再次编译消息，使其在应用程序中可用。

## 翻译日期和时间

现在，Python代码和模板中的所有文本都有了完整的西班牙语翻译，但如果你以西班牙语运行应用程序并且观察仔细，你会注意到仍然有一些内容以英语显示。我指的是由Flask-Moment和moment.js生成的时间戳，这些显然没有被包含在翻译工作中，因为这些包生成的文本都不属于应用程序的源代码或模板。

moment.js库确实支持本地化和国际化，所以我需要做的就是配置正确的语言。Flask-Babel通过`get_locale()`函数返回给定请求所选的语言和区域设置，所以我将把区域设置添加到`before_request`处理程序中的`g`对象中，以便我随后可以从基础模板访问它：

*app/routes.py*：在flask.g中存储所选语言。

```
# ...
from flask import g
from flask_babel import get_locale

# ...

@app.before_request
def before_request():
    # ...
    g.locale = str(get_locale())

```

Flask-Babel的`get_locale()`函数返回一个区域设置对象，但我只想要语言代码，可以通过将对象转换为字符串来获得。现在我有`g.locale`，可以从基础模板访问它来配置moment.js使用正确的语言：

*app/templates/base.html*：为moment.js设置区域设置。

```
...

    {{ moment.include_moment() }}
    {{ moment.lang(g.locale) }}
  </body>
</html>

```

现在所有日期和时间应该与文本以相同的语言显示。下面你可以看到应用程序在西班牙语下的显示效果：

至此，除了用户博客文章或个人资料描述中提供的内容之外，所有文本都应该可以翻译成其他语言了。

## 命令行增强

你可能同意我的看法，`pybabel`命令有点长且难以记忆。我将利用这个机会向你展示如何创建与`flask`命令集成的自定义命令。到目前为止，你已经看到我使用了`flask run`、`flask shell`以及Flask-Migrate扩展提供的几个`flask db`子命令。实际上，向`flask`添加应用程序特定的命令也很容易。所以我现在要做的是创建几个简单的命令，用于触发带有该应用程序特有参数的`pybabel`命令。我将添加的命令有：

- `flask translate init LANG` 用于添加新语言

- `flask translate update` 用于更新所有语言仓库

- `flask translate compile` 用于编译所有语言仓库

`babel extract`步骤不会作为一个单独的命令，因为生成*messages.pot*文件始终是运行`init`或`update`命令的前提条件，所以这些命令的实现将把翻译模板文件作为临时文件生成。

Flask依赖Click来处理其所有命令行操作。像`translate`这样作为多个子命令根的命令通过`app.cli.group()`装饰器创建。我将把这些命令放在一个名为*app/cli.py*的新模块中：

*app/cli.py*：翻译命令组。

```
from app import app

@app.cli.group()
def translate():
    """Translation and localization commands."""
    pass

```

命令的名称来自被装饰函数的名称，帮助信息来自文档字符串。由于这是一个父命令，仅作为子命令的基础存在，函数本身不需要做任何事情。

`update`和`compile`易于实现，因为它们不带任何参数：

*app/cli.py*：更新和编译子命令。

```
import os

# ...

@translate.command()
def update():
    """Update all languages."""
    if os.system('pybabel extract -F babel.cfg -k _l -o messages.pot .'):
        raise RuntimeError('extract command failed')
    if os.system('pybabel update -i messages.pot -d app/translations'):
        raise RuntimeError('update command failed')
    os.remove('messages.pot')

@translate.command()
def compile():
    """Compile all languages."""
    if os.system('pybabel compile -d app/translations'):
        raise RuntimeError('compile command failed')

```

注意这些函数的装饰器源自`translate`父函数。这可能看起来令人困惑，因为`translate()`是一个函数，但这是Click构建命令组的标准方式。与`translate()`函数一样，这些函数的文档字符串用作`--help`输出中的帮助信息。

你可以看到，对于所有命令，我都运行它们并确保返回值为零，这表示命令没有返回任何错误。如果命令出错，我会引发一个`RuntimeError`，这将导致脚本停止。`update()`函数将`extract`和`update`步骤结合在同一个命令中，如果一切顺利，它会在更新完成后删除*messages.pot*文件，因为该文件可以在需要时轻松重新生成。

`init`命令接受新的语言代码作为参数。以下是实现：

*app/cli.py*：初始化子命令。

```
import click

@translate.command()
@click.argument('lang')
def init(lang):
    """Initialize a new language."""
    if os.system('pybabel extract -F babel.cfg -k _l -o messages.pot .'):
        raise RuntimeError('extract command failed')
    if os.system(
            'pybabel init -i messages.pot -d app/translations -l ' + lang):
        raise RuntimeError('init command failed')
    os.remove('messages.pot')

```

此命令使用`@click.argument`装饰器来定义语言代码。Click将命令中提供的值作为参数传递给处理函数，然后我将该参数合并到`init`命令中。

启用这些命令工作的最后一步是导入它们，以便命令被注册。我决定在顶级目录的*microblog.py*文件中执行此操作：

*microblog.py*：注册命令行命令。

```
from app import cli

```

在这里，我需要做的就是导入新的*cli.py*模块，无需对其进行任何操作，因为导入会导致命令装饰器运行并注册每个命令。

此时，运行`flask --help`将把`translate`命令列为选项。而`flask translate --help`将显示我定义的三个子命令：

```
(venv) $ flask translate --help
Usage: flask translate OPTIONS COMMAND ARGS...

  Translation and localization commands.

Options:
  --help  Show this message and exit.

Commands:
  compile  Compile all languages.
  init     Initialize a new language.
  update   Update all languages.

```

所以现在，工作流程更加简单，无需记住又长又复杂的命令。要添加新语言，你使用：

```
(venv) $ flask translate init <language-code>

```

在对`_()`和`_l()`语言标记进行更改后更新所有语言：

```
(venv) $ flask translate update

```

以及在更新翻译文件后编译所有语言：

```
(venv) $ flask translate compile

```

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
