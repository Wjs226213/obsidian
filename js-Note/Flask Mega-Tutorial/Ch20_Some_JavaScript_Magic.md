# 第20部分：一些 JavaScript 魔法

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xx-some-javascript-magic](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xx-some-javascript-magic) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第20篇，本文将添加一个漂亮的弹窗，当你将鼠标悬停在用户昵称上时出现。

你正在阅读的是 2024 版的 Flask Mega-Tutorial。完整课程也可以从 Amazon 订购电子书和平装本。感谢你的支持！

如果你在寻找本课程的 2018 版，可以在这里找到。

作为参考，以下是本系列文章的完整列表：

- 第1章：Hello, World!

- 第2章：模板

- 第3章：Web 表单

- 第4章：数据库

- 第5章：用户登录

- 第6章：个人资料页面和头像

- 第7章：错误处理

- 第8章：关注者

- 第9章：分页

- 第10章：电子邮件支持

- 第11章：美化外观

- 第12章：日期和时间

- 第13章：国际化和本地化

- 第14章：Ajax

- 第15章：更好的应用结构

- 第16章：全文搜索

- 第17章：在 Linux 上部署

- 第18章：在 Heroku 上部署

- 第19章：在 Docker 容器上部署

- 第20章：一些 JavaScript 魔法（本文）

- 第21章：用户通知

- 第22章：后台作业

- 第23章：应用程序编程接口（API）

如今，构建一个完全不使用 JavaScript 的 Web 应用程序是不可能的。我相信你知道，原因是 JavaScript 是唯一一种能在 Web 浏览器中原生运行的语言。在第14章中，你看到我在一个 Flask 模板中添加了一个简单的 JavaScript 链接，以提供博客文章的实时语言翻译。在本章中，我将深入探讨这个主题，并向你展示另一个有用的 JavaScript 技巧，使应用程序对用户来说更有趣、更具互动性。

在用户可以相互交互的社交网站中，一个常见的用户界面模式是：当鼠标悬停在用户名上时，以弹窗面板的形式显示该用户的快速摘要信息，无论用户名出现在页面的哪个位置。如果你之前没有注意到这一点，可以访问 Twitter、Facebook、LinkedIn 或任何其他主要社交网络，当你看到一个用户名时，只需将鼠标指针停留在上面几秒钟，就能看到弹窗出现。本章将致力于为 Microblog 构建这个功能，你可以在下面预览效果：

*本章的 GitHub 链接：浏览，Zip，Diff。*

## 服务器端支持

在深入探讨客户端之前，我们先完成支持这些用户弹窗所需的服务器端工作。用户弹窗的内容将由一个新的路由返回，该路由将是现有用户资料页面的简化版本。以下是视图函数：

*app/main/routes.py*：用户弹窗视图函数。

```
@bp.route('/user/<username>/popup')
@login_required
def user_popup(username):
    user = db.first_or_404(sa.select(User).where(User.username == username))
    form = EmptyForm()
    return render_template('user_popup.html', user=user, form=form)

```

该路由将绑定到 */user/<username>/popup* URL，并简单地加载请求的用户，然后使用模板进行渲染。该模板是用户资料页面所用模板的简化版本：

*app/templates/user_popup.html*：用户弹窗模板。

```
<div>
  <img src="{{ user.avatar(64) }}" style="margin: 5px; float: left">
  <p><a href="{{ url_for('main.user', username=user.username) }}">{{ user.username }}</a></p>
  {% if user.about_me %}<p>{{ user.about_me }}</p>{% endif %}
  <div class="clearfix"></div>
  {% if user.last_seen %}
  <p>{{ _('Last seen on') }}: {{ moment(user.last_seen).format('lll') }}</p>
  {% endif %}
  <p>{{ _('%(count)d followers', count=user.followers_count()) }}, {{ _('%(count)d following', count=user.following_count()) }}</p>
  {% if user != current_user %}
    {% if not current_user.is_following(user) %}
    <p>
      <form action="{{ url_for('main.follow', username=user.username) }}" method="post">
        {{ form.hidden_tag() }}
        {{ form.submit(value=_('Follow'), class_='btn btn-outline-primary btn-sm') }}
      </form>
    </p>
    {% else %}
    <p>
      <form action="{{ url_for('main.unfollow', username=user.username) }}" method="post">
        {{ form.hidden_tag() }}
        {{ form.submit(value=_('Unfollow'), class_='btn btn-outline-primary btn-sm') }}
      </form>
    </p>
    {% endif %}
  {% endif %}
</div>

```

我将在接下来的小节中添加的弹窗组件，会在用户将鼠标指针悬停在用户名上时调用该路由。作为响应，服务器将返回弹窗的 HTML 内容，客户端将显示它。当用户将鼠标移开时，弹窗将被移除。

## Bootstrap Popover 组件简介

在第11章中，我向你介绍了 Bootstrap 框架，这是一种创建漂亮网页的便捷方式。到目前为止，我只使用了这个框架的一小部分。Bootstrap 自带了许多常见的 UI 元素，所有这些元素都在 *https://getbootstrap.com* 的 Bootstrap 文档中有演示和示例。其中一个组件就是 Popover，文档中将其描述为"用于容纳辅助信息的小型内容覆盖层"。这正是我需要的！

大多数 Bootstrap 组件通过引用 Bootstrap CSS 定义的 HTML 标记来添加漂亮的样式。一些更高级的组件还需要 JavaScript。应用程序将这些组件包含在网页中的标准方法是，在适当的位置添加 HTML，然后对于需要脚本支持的组件，调用一个 JavaScript 函数来初始化或激活它。Popover 组件确实需要 JavaScript 支持。

首先，我只需要决定页面中的哪些元素将触发弹窗出现。为此，我将使用每条帖子中出现的可点击用户名。*app/templates/_post.html* 子模板中已经定义了用户名：

```
            <a href="{{ url_for('main.user', username=post.author.username) }}">
                {{ post.author.username }}
            </a>

```

根据 Popover 文档，我需要为页面上出现的每个类似上面的链接创建一个 `bootstrap.Popover` 类的对象，这将初始化弹窗。不幸的是，阅读完文档后，我的问题比答案还多，因为这个组件似乎不是按照我需要的方式设计的。以下是我需要解决的一系列问题，以实现这个功能：

- 页面中会有许多用户名链接，每条博客帖子上一个。我需要找到一种方法来查找所有这些链接，以便随后在一个 JavaScript 函数中将它们初始化为弹窗，且该函数需要在用户与页面交互之前运行。

- Bootstrap 文档中的 Popover 示例都将弹窗内容作为 `data-bs-content` 属性添加到目标 HTML 元素中。这对我来说非常不方便，因为我想通过 Ajax 调用服务器来获取弹窗中显示的内容。

- 当使用"悬停"模式时，只要鼠标指针停留在目标元素内，弹窗就会保持可见。当你移开鼠标时，弹窗就会消失。这有一个令人不快的副作用：如果用户想将鼠标指针移动到弹窗本身，弹窗会消失。我需要找到一种方法来扩展悬停行为，使其也包含弹窗，这样用户就可以移入弹窗，例如点击其中的链接。

实际上，在开发基于浏览器的应用程序时，事情很快变得复杂起来并不罕见。你必须非常具体地考虑 DOM 元素如何相互交互，并使它们以给用户良好体验的方式运行。在接下来的小节中，我将逐个分析上述问题。

## 页面加载时执行函数

Popover 组件需要显式地通过 JavaScript 初始化，因此很明显，我需要在每个页面加载完成后立即运行一些代码，搜索页面中所有指向用户名的链接，并为其初始化 Bootstrap 的 Popover 组件。

在现代浏览器中，在页面加载完成后运行初始化代码的标准方式是为 `DOMContentLoaded` 事件定义一个处理函数。我可以在 *app/templates/base.html* 模板中添加此处理函数，使其在应用程序的每个页面上都运行：

*app/templates/base.html*：页面加载后运行函数。

```
...
<script>
    // ...

    function initialize_popovers() {
      // write initialization code here
    }
    document.addEventListener('DOMContentLoaded', initialize_popovers);
</script>

```

如你所见，我在第14章中定义 `translate()` 函数的 `<script>` 元素内添加了初始化函数。

## 使用选择器查找 DOM 元素

我的下一个问题是编写 JavaScript 逻辑来查找页面中的所有用户链接。

如果你还记得第14章，参与实时翻译的 HTML 元素都有唯一的 ID。例如，ID=123 的帖子有一个 `id="post123"` 属性。然后我可以使用 `document.getElementById()` 函数在 DOM 中定位此元素。该函数属于一组允许在浏览器中运行的应用程序根据其特性查找元素的函数。

对于翻译功能，我必须找到一个具有 `id` 属性的特定元素，该属性在页面上唯一标识元素。另一种更适合查找元素组的搜索选项是给它们添加一个 CSS `class`。与 `id` 不同，`class` 属性可以分配给多个元素，因此它非常适合查找所有需要弹窗的链接。我要做的是为所有用户链接标记一个 `class="user_popup"` 属性，然后从 JavaScript 中使用 `document.getElementsByClassName('user_popup')` 获取列表。返回值将是一个包含所有具有该类的元素的集合。

*app/templates/base.html*：页面加载后运行函数。

```
...
<script>
    // ...

    function initialize_popovers() {
      const popups = document.getElementsByClassName('user_popup');
      for (let i = 0; i < popups.length; i++) {
        // create popover here
      }
    }
    document.addEventListener('DOMContentLoaded', initialize_popovers);
</script>

```

## Popover 与 DOM

在上一节中，我添加了初始化代码，用于查找页面中所有被分配了 `user_popup` 类的元素。这个类需要添加到在 *_post.html* 模板页面中定义的用户名链接上。

*app/templates/_post.html*：用户弹窗模板。

```
...
        {% set user_link %}
            <a class="user_popup"
            href="{{ url_for('main.user', username=post.author.username) }}">
                {{ post.author.username }}
            </a>
        {% endset %}
...

```

如果你想知道 Popover HTML 元素是在哪里定义的，好消息是我不用担心这个问题。当我创建 `Popover` 对象时，Bootstrap 框架会自动为我动态插入与弹窗关联的元素。

## 创建 Popover 组件

现在我已经准备好为页面上找到的所有用户名链接创建 Popover 组件了。

*app/templates/base.html*：悬停延迟。

```
      function initialize_popovers() {
        const popups = document.getElementsByClassName('user_popup');
        for (let i = 0; i < popups.length; i++) {
          const popover = new bootstrap.Popover(popups[i], {
            content: 'Loading...',
            trigger: 'hover focus',
            placement: 'right',
            html: true,
            sanitize: false,
            delay: {show: 500, hide: 0},
            container: popups[i],
            customClass: 'd-inline',
          });
        }
      }
      document.addEventListener('DOMContentLoaded', initialize_popovers);

```

`bootstrap.Popover` 构造函数接受第一个参数为要添加弹窗的元素，第二个参数为包含选项的对象。选项包括将在弹窗中显示的内容、触发弹窗显示或消失的方法（点击、悬停等）、弹窗的位置、内容是纯文本还是 HTML，以及其他几个选项。

我之前提到过，这个 Popover 实现的一个大问题在于，需要显示的 HTML 内容是通过向服务器发出请求获取的。因此，我将内容初始化为 `Loading...` 文本，一旦从服务器接收到用户的 HTML 内容，它将被动态替换。为此，我将 `html` 选项设置为 `true`，并禁用了 HTML 内容清理选项。清理 HTML 是一项安全功能，在内容来自用户时非常重要。在这个用例中，HTML 内容由 Flask 服务器通过 Jinja 模板生成，默认情况下会对所有动态内容进行清理。

`delay` 选项将弹窗组件配置为在悬停半秒后出现。当用户移开鼠标指针导致弹窗消失时，没有配置延迟。`container` 选项告诉 Bootstrap 将弹窗组件作为链接元素的子元素插入。这是一个经常推荐的技巧，允许用户将鼠标指针移入弹窗而不会导致弹窗消失。`customClass` 选项为表示弹窗组件的 `<div>` 元素提供了 `inline` 显示样式。这确保了当插入组件时，它不会因为 `<div>` 元素的默认显示样式是 `block` 而间接在页面中的该位置添加换行。

## Ajax 请求

Ajax 请求并不是一个新话题，我在第14章介绍实时语言翻译功能时已经引入了这个主题。和之前一样，我将使用 `fetch()` 函数向服务器发送异步请求。

请求的 URL 应该是 */user/<username>/popup*，我在本章开始时已将其添加到应用程序中。此请求的响应将包含需要插入弹窗组件的 HTML，替换掉最初的 "Loading..." 消息。

我的第一个问题是如何在用户通过悬停用户链接请求弹窗时触发请求。查看 Popover 文档，该组件支持的事件部分包括一个名为 `show.bs.popover` 的事件，它在弹窗组件即将显示时触发。

*app/templates/base.html*：悬停延迟。

```
      function initialize_popovers() {
        const popups = document.getElementsByClassName('user_popup');
        for (let i = 0; i < popups.length; i++) {
          const popover = new bootstrap.Popover(popups[i], {
            ...
          });
          popups[i].addEventListener('show.bs.popover', async (ev) => {
            // send request here
          });
        }
      }
      document.addEventListener('DOMContentLoaded', initialize_popovers);

```

下一个问题是如何知道需要在请求 URL 中包含哪个用户名。这个名称位于 `<a>` 链接的文本中。Popover 组件的 show 事件接收一个 `ev` 参数，即事件对象。触发事件的元素可以通过 `ev.target` 获取，提取此链接文本的表达式是：

```
ev.target.innerText.trim()

```

页面元素的 `innerText` 属性返回该节点的文本内容。文本返回时不会进行任何修剪，例如，如果你的 `<a>` 在一行，文本在下一行，而结束的 `</a>` 在另一行，`innerText` 将包含换行符和文本周围的额外空白。为了消除所有空白，只保留文本，我使用了 `trim()` JavaScript 函数。

这就是向服务器发出请求所需的全部信息：

*app/templates/base.html*：XHR 请求。

```
      function initialize_popovers() {
        const popups = document.getElementsByClassName('user_popup');
        for (let i = 0; i < popups.length; i++) {
          const popover = new bootstrap.Popover(popups[i], {
            ...
          });
          popups[i].addEventListener('show.bs.popover', async (ev) => {
            const response = await fetch('/user/' + ev.target.innerText.trim() + '/popup');
            const data = await response.text();
            // update popover here
          });
        }
      }
      document.addEventListener('DOMContentLoaded', initialize_popovers);

```

这里我使用 `fetch()` 函数请求链接元素所代表用户的 */popup* URL。不幸的是，在 JavaScript 端直接构建 URL 时，我不能使用 Flask 的 `url_for()`，因此在这种情况下我必须显式拼接 URL 的各部分。一旦获得响应，我从中提取文本存储到 `data` 中。这就是需要存储到弹窗组件中的 HTML。

## 更新 Popover

最后，我现在可以用从服务器接收并存储在 `data` 常量中的 HTML 来更新弹窗组件了：

*app/templates/base.html*：显示弹窗。

```
      function initialize_popovers() {
        const popups = document.getElementsByClassName('user_popup');
        for (let i = 0; i < popups.length; i++) {
          const popover = new bootstrap.Popover(popups[i], {
            ...
          });
          popups[i].addEventListener('show.bs.popover', async (ev) => {
            if (ev.target.popupLoaded) {
              return;
            }
            const response = await fetch('/user/' + ev.target.innerText.trim() + '/popup');
            const data = await response.text();
            const popover = bootstrap.Popover.getInstance(ev.target);
            if (popover && data) {
              ev.target.popupLoaded = true;
              popover.setContent({'.popover-body': data});
              flask_moment_render_all();
            }
          });
        }
      }
      document.addEventListener('DOMContentLoaded', initialize_popovers);

```

为了进行此更新，我首先获取弹窗组件，Bootstrap 通过 `getInstance()` 方法提供该组件。如果我有弹窗组件和 HTML 内容，那么我调用弹窗的 `setContent()` 方法来更新其主体。

作为优化，我还在链接元素上将一个 `popupLoaded` 属性设置为 `true`。这样，如果弹窗再次打开，我就不必重新发送同样的请求了。注意我如何更新了 `show` 事件处理函数的开头，以检查这个 `popupLoaded` 属性，如果已设置，就直接返回，因为弹窗的内容已经更新过了。

最后一个需要处理的细节是在弹窗组件中插入的 HTML 内容中包含的日期和时间。这些时间戳是在 Jinja 模板中使用 Flask-Moment 的 `moment()` 函数生成的。Flask-Moment 会向页面添加 JavaScript 代码，在页面加载时渲染所有时间戳。当新的时间戳在页面加载后动态添加时，需要手动调用 `flask_moment_render_all()` 函数来渲染它们，因此我在更新 HTML 内容后插入了对该函数的调用。

继续阅读下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
