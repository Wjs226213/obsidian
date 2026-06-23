# Part 9: 分页

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-ix-pagination](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-ix-pagination) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第九部分，我将告诉你如何对数据库条目列表进行分页。

你正在阅读 2024 版的 Flask Mega-Tutorial。完整的课程也可以从亚马逊以电子书和平装书的形式订购。感谢你的支持！

如果你正在寻找该课程 2018 版，可以在这里找到。

作为参考，以下是本系列文章的完整列表：

- Chapter 1: Hello, World!

- Chapter 2: Templates

- Chapter 3: Web Forms

- Chapter 4: Database

- Chapter 5: User Logins

- Chapter 6: Profile Page and Avatars

- Chapter 7: Error Handling

- Chapter 8: Followers

- Chapter 9: Pagination（本文）

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

在第八章中，我进行了几个数据库更改，以支持社交网络中非常流行的"关注者"模式。有了这些功能，我准备移除开始时放置的最后一部分脚手架——假帖子。在本章中，应用程序将开始接受用户的博客帖子，并在首页和用户主页中以分页列表的形式呈现它们。

*本章的 GitHub 链接: Browse, Zip, Diff.*

## 博客帖子提交

首页需要一个表单，用户可以在其中输入新帖子。首先创建一个表单类：

*app/forms.py*: 博客提交表单

```
class PostForm(FlaskForm):
    post = TextAreaField('Say something', validators=[
        DataRequired(), Length(min=1, max=140)])
    submit = SubmitField('Submit')

```

接下来，我可以将此表单添加到应用程序主页的模板中：

*app/templates/index.html*: 首页模板中的帖子提交表单

```
{% extends "base.html" %}

{% block content %}
    <h1>Hi, {{ current_user.username }}!</h1>
    <form action="" method="post">
        {{ form.hidden_tag() }}
        <p>
            {{ form.post.label }}<br>
            {{ form.post(cols=32, rows=4) }}<br>
            {% for error in form.post.errors %}
            <span style="color: red;">{{ error }}</span>
            {% endfor %}
        </p>
        <p>{{ form.submit() }}</p>
    </form>
    {% for post in posts %}
    <p>
    {{ post.author.username }} says: <b>{{ post.body }}</b>
    </p>
    {% endfor %}
{% endblock %}

```

此模板中的更改与之前处理表单的方式类似。最后一步是在视图函数中添加表单的创建和处理：

*app/routes.py*: 首页视图函数中的帖子提交表单

```
from app.forms import PostForm
from app.models import Post

@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    form = PostForm()
    if form.validate_on_submit():
        post = Post(body=form.post.data, author=current_user)
        db.session.add(post)
        db.session.commit()
        flash('Your post is now live!')
        return redirect(url_for('index'))
    posts = [
        {
            'author': {'username': 'John'},
            'body': 'Beautiful day in Portland!'
        },
        {
            'author': {'username': 'Susan'},
            'body': 'The Avengers movie was so cool!'
        }
    ]
    return render_template("index.html", title='Home Page', form=form,
                           posts=posts)

```

让我们逐一回顾此视图函数中的更改：

- 我现在导入了 `Post` 和 `PostForm` 类。

- 除了 `GET` 请求外，我还接受与 `index` 视图函数关联的两个路由上的 `POST` 请求，因为这个视图函数现在将接收表单数据。

- 表单处理逻辑将一条新的 `Post` 记录插入数据库。

- 模板现在接收 `form` 对象作为额外参数，以便在页面上渲染它。

在继续之前，我想提一件与处理 Web 表单相关的重要事项。请注意，在处理完表单数据后，我通过将请求重定向到首页来结束该请求。我本可以轻松跳过重定向，让函数继续进入模板渲染部分，因为这里已经是首页视图函数。

那么，为什么要重定向到同一个页面呢？因为始终以重定向来响应 Web 表单提交产生的 `POST` 请求是一种标准做法。这有助于缓解 Web 浏览器刷新命令的一个让人头疼的问题。当你按下刷新键时，Web 浏览器只会重新发出最后一个请求。如果最后一个请求是带有表单提交的 `POST` 请求，那么刷新将重新提交表单。由于这是意外的，浏览器会要求用户确认重复提交，但大多数用户不理解浏览器在问什么。如果 `POST` 请求通过重定向来响应，浏览器就会被告知发送一个 `GET` 请求来获取重定向中指出的页面，这样一来最后一个请求就不再是 `POST` 请求了，刷新命令也能更可预测地工作。

这个简单的技巧称为 Post/Redirect/Get 模式。它可以避免用户在提交 Web 表单后无意中刷新页面时插入重复的帖子。

## 显示博客帖子

如果你还记得，我创建了几个假的博客帖子，很长时间以来一直显示在首页上。这些假对象是在 `index` 视图函数中明确创建的一个简单 Python 列表：

```
    posts = [
        {
            'author': {'username': 'John'},
            'body': 'Beautiful day in Portland!'
        },
        {
            'author': {'username': 'Susan'},
            'body': 'The Avengers movie was so cool!'
        }
    ]

```

但现在我在 `User` 模型中有了 `following_posts()` 方法，它返回给定用户想要看到的帖子的查询。所以现在我可以将假帖子替换为真实帖子：

*app/routes.py*: 在首页显示真实帖子

```
@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    # ...
    posts = db.session.scalars(current_user.following_posts()).all()
    return render_template("index.html", title='Home Page', form=form,
                           posts=posts)

```

`User` 类的 `following_posts` 方法返回一个 SQLAlchemy 查询对象，该对象配置为从数据库中获取用户感兴趣的帖子。执行此查询并在结果对象上调用 `all()` 后，`posts` 变量最终得到一个包含所有结果的列表。所以我最终得到的结构与之前一直使用的假帖子的结构非常相似。它如此接近，以至于模板甚至不需要更改。

## 让查找要关注的用户更容易

我相信你已经注意到，应用程序在让用户查找其他用户进行关注方面做得并不好。事实上，目前根本没有办法看到其他用户的存在。我将通过一些简单的更改来解决这个问题。

我将创建一个新页面，称为"探索"页面。这个页面的工作方式类似于首页，但不是只显示关注用户的帖子，而是显示来自所有用户的全局帖子流。以下是新的探索视图函数：

*app/routes.py*: 探索视图函数

```
@app.route('/explore')
@login_required
def explore():
    query = sa.select(Post).order_by(Post.timestamp.desc())
    posts = db.session.scalars(query).all()
    return render_template('index.html', title='Explore', posts=posts)

```

你注意到这个视图函数中有什么奇怪的地方吗？`render_template()` 调用引用了 *index.html* 模板，该模板在应用程序的主页中使用。由于这个页面将与主页非常相似，我决定重用该模板。但与主页的一个区别是，在探索页面中我不希望有写博客帖子的表单，所以在这个视图函数中，我没有在 `render_template()` 调用中包含 `form` 参数。

为了防止 *index.html* 模板在尝试渲染不存在的 Web 表单时崩溃，我将添加一个条件语句，仅当视图函数传递了表单时才渲染它：

*app/templates/index.html*: 使博客帖子提交表单可选

```
{% extends "base.html" %}

{% block content %}
    <h1>Hi, {{ current_user.username }}!</h1>
    {% if form %}
    <form action="" method="post">
        ...
    </form>
    {% endif %}
    ...
{% endblock %}

```

我还将在这个新页面的导航栏中添加一个链接，紧跟在首页链接之后：

*app/templates/base.html*: 导航栏中的探索页面链接

```
        <a href="{{ url_for('explore') }}">Explore</a>

```

还记得我在第六章中引入的 *_post.html* 子模板吗？它用于在用户主页中渲染博客帖子。这是一个小的模板，从用户主页模板中包含进来，并且被放在单独的文件中以便也可以从其他模板中使用。我现在要对其进行一个小改进，即显示博客帖子作者的用户名作为可点击的链接：

*app/templates/_post.html*: 在博客帖子中显示作者链接

```
    <table>
        <tr valign="top">
            <td><img src="{{ post.author.avatar(36) }}"></td>
            <td>
                <a href="{{ url_for('user', username=post.author.username) }}">
                    {{ post.author.username }}
                </a>
                says:<br>{{ post.body }}
            </td>
        </tr>
    </table>

```

我现在可以使用这个子模板在首页和探索页面中渲染博客帖子：

*app/templates/index.html*: 使用博客帖子子模板

```
    ...
    {% for post in posts %}
        {% include '_post.html' %}
    {% endfor %}
    ...

```

子模板期望存在一个名为 `post` 的变量，而首页模板中的循环变量正是这个名字，所以这完美地工作。

通过这些小的更改，应用程序的可用性有了显著提高。现在用户可以访问探索页面阅读未知用户的博客帖子，并根据这些帖子找到要关注的新用户，只需点击用户名访问其主页即可完成关注。很棒，对吧？

此时我建议你再试一次应用程序，体验这些最新的用户界面改进。你可能还需要创建几个不同的用户并作为他们写一些帖子，以便系统有来自多个用户的多样化内容。

## 博客帖子分页

应用程序看起来比以往都好，但在首页显示所有关注的帖子迟早会成为问题。如果一个用户有上千篇关注帖子呢？或者一百万篇？可以想象，管理如此大量的帖子列表会极其缓慢和低效。

为了解决这个问题，我将对帖子列表进行*分页*。这意味着初始时我只显示有限数量的帖子，并包含链接，以便在完整的帖子列表中向前和向后导航。Flask-SQLAlchemy 通过 `db.paginate()` 函数原生支持分页，该函数的工作方式类似于 `db.session.scalars()`，但内置了分页功能。例如，如果我想获取用户前二十篇关注的帖子，可以这样做：

```
>>> query = sa.select(Post).order_by(Post.timestamp.desc())
>>> posts = db.paginate(query, page=1, per_page=20, error_out=False).items

```

`paginate` 函数可以在任何查询上调用。它接受几个参数，其中以下三个是最重要的：

- `page`: 页码，从 1 开始

- `per_page`: 每页的项目数

- `error_out`: 错误标志。如果为 `True`，当请求超出范围的页面时，将自动向客户端返回 404 错误。如果为 `False`，超出范围的页面将返回一个空列表。

`db.paginate()` 的返回值是一个 `Pagination` 对象。该对象的 `items` 属性包含请求页面中的项目列表。`Pagination` 对象中还有其他有用的内容，我将在后面讨论。

现在让我们思考如何在 `index()` 视图函数中实现分页。我可以首先在应用程序中添加一个配置项，决定每页显示多少项目。

*config.py*: 每页帖子数配置

```
class Config:
    # ...
    POSTS_PER_PAGE = 3

```

在配置文件中拥有这些可以改变行为的全局"旋钮"是个好主意，因为之后我可以到一个地方进行调整。在最终的应用程序中，我自然会使用比每页三个更大的数字，但用于测试的小数字很有用。

接下来，我需要决定页码如何融入应用程序 URL。一种相当常见的方式是使用*查询字符串*参数来指定可选的页码，如果未给出则默认为第 1 页。以下是一些示例 URL，展示我将如何实现这一点：

- 第 1 页，隐式: *http://localhost:5000/index*

- 第 1 页，显式: *http://localhost:5000/index?page=1*

- 第 3 页: *http://localhost:5000/index?page=3*

要访问查询字符串中给出的参数，我可以使用 Flask 的 `request.args` 对象。你在第五章中已经见过这个，当时我实现了 Flask-Login 的用户登录 URL，有时会包含一个 `next` 查询字符串参数。

以下是我如何在首页和探索视图函数中添加分页功能：

*app/routes.py*: 分页

```
@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    # ...
    page = request.args.get('page', 1, type=int)
    posts = db.paginate(current_user.following_posts(), page=page,
                        per_page=app.config['POSTS_PER_PAGE'], error_out=False)
    return render_template('index.html', title='Home', form=form,
                           posts=posts.items)

@app.route('/explore')
@login_required
def explore():
    page = request.args.get('page', 1, type=int)
    query = sa.select(Post).order_by(Post.timestamp.desc())
    posts = db.paginate(query, page=page,
                        per_page=app.config['POSTS_PER_PAGE'], error_out=False)
    return render_template("index.html", title='Explore', posts=posts.items)

```

通过这些更改，两个路由确定要显示的页码（通过 `page` 查询字符串参数，默认为 1），然后使用 `paginate()` 方法仅检索所需页面的结果。决定页面大小的 `POSTS_PER_PAGE` 配置项通过 `app.config` 对象访问。

注意这些更改有多简短，每次更改所影响的代码量有多小。我尽量让应用程序的每个部分不假定其他部分的工作方式，这使我能够编写模块化和健壮的应用程序，更容易扩展和测试，也不太容易失败或有 bug。

现在试试分页功能。首先确保你有多于三篇博客帖子。这在探索页面更容易看到，因为该页面显示所有用户的帖子。你现在只会看到最近的三篇帖子。如果你想看到接下来的三篇，在浏览器的地址栏中输入 *http://localhost:5000/explore?page=2*。

## 页面导航

下一个更改是在博客帖子列表底部添加链接，允许用户导航到下一页和/或上一页。还记得我之前提到 `paginate()` 调用的返回值是 Flask-SQLAlchemy 的 `Pagination` 类的一个对象吗？到目前为止，我使用了该对象的 `items` 属性，它包含所选页面的项目列表。但这个对象还有其他一些在构建分页链接时非常有用的属性：

- `has_next`: 如果当前页之后至少还有一页，则为 `True`

- `has_prev`: 如果当前页之前至少还有一页，则为 `True`

- `next_num`: 下一页的页码

- `prev_num`: 上一页的页码

有了这四个元素，我可以生成下一页和上一页链接，并将它们传递到模板进行渲染：

*app/routes.py*: 上一页和下一页链接

```
@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    # ...
    page = request.args.get('page', 1, type=int)
    posts = db.paginate(current_user.following_posts(), page=page,
                        per_page=app.config['POSTS_PER_PAGE'], error_out=False)
    next_url = url_for('index', page=posts.next_num) \
        if posts.has_next else None
    prev_url = url_for('index', page=posts.prev_num) \
        if posts.has_prev else None
    return render_template('index.html', title='Home', form=form,
                           posts=posts.items, next_url=next_url,
                           prev_url=prev_url)

@app.route('/explore')
@login_required
def explore():
    page = request.args.get('page', 1, type=int)
    query = sa.select(Post).order_by(Post.timestamp.desc())
    posts = db.paginate(query, page=page,
                        per_page=app.config['POSTS_PER_PAGE'], error_out=False)
    next_url = url_for('explore', page=posts.next_num) \
        if posts.has_next else None
    prev_url = url_for('explore', page=posts.prev_num) \
        if posts.has_prev else None
    return render_template("index.html", title='Explore', posts=posts.items,
                           next_url=next_url, prev_url=prev_url)

```

这两个视图函数中的 `next_url` 和 `prev_url` 将设置为 Flask 的 `url_for()` 函数返回的 URL，但前提是有相应方向的页面可跳转。如果当前页面位于帖子集合的一端，则 `Pagination` 对象的 `has_next` 或 `has_prev` 属性将为 `False`，在这种情况下，该方向的链接将设置为 `None`。

我之前没有讨论过 `url_for()` 函数的一个有趣方面：你可以向其添加任何关键字参数，如果这些参数名称不是路由定义的 URL 的一部分，Flask 会将它们作为查询参数包含进去。

分页链接被传递到 *index.html* 模板，现在让我们在页面上渲染它们，就在帖子列表下方：

*app/templates/index.html*: 在模板上渲染分页链接

```
    ...
    {% for post in posts %}
        {% include '_post.html' %}
    {% endfor %}
    {% if prev_url %}
    <a href="{{ prev_url }}">Newer posts</a>
    {% endif %}
    {% if next_url %}
    <a href="{{ next_url }}">Older posts</a>
    {% endif %}
    ...

```

此更改在首页和探索页面的帖子列表下方添加了两个链接。第一个链接标记为"Newer posts"，指向上一页（请记住我按最新优先排序帖子，所以第一页是最新内容）。第二个链接标记为"Older posts"，指向下一页。如果这两个链接中的任何一个为 `None`，则通过条件判断将其从页面中省略。

## 用户主页的分页

对首页的更改目前已经足够了。然而，用户主页中也有一个帖子列表，只显示主页所有者的帖子。为了保持一致性，用户主页也应更改以匹配首页的分页风格。

我首先更新用户主页视图函数，其中仍然包含一个假帖子对象列表。

*app/routes.py*: 用户主页视图函数中的分页

```
@app.route('/user/<username>')
@login_required
def user(username):
    user = db.first_or_404(sa.select(User).where(User.username == username))
    page = request.args.get('page', 1, type=int)
    query = user.posts.select().order_by(Post.timestamp.desc())
    posts = db.paginate(query, page=page,
                        per_page=app.config['POSTS_PER_PAGE'],
                        error_out=False)
    next_url = url_for('user', username=user.username, page=posts.next_num) \
        if posts.has_next else None
    prev_url = url_for('user', username=user.username, page=posts.prev_num) \
        if posts.has_prev else None
    form = EmptyForm()
    return render_template('user.html', user=user, posts=posts.items,
                           next_url=next_url, prev_url=prev_url, form=form)

```

为了获取用户的帖子列表，我利用了 `user.posts` 关系被定义为只写关系这一事实，这意味着该属性有一个 `select()` 方法，返回相关对象的查询。我获取这个查询并添加一个 `order_by()` 子句，以便先获取最新的帖子，然后像处理首页和探索页面的帖子一样进行分页。请注意，此页面中由 `url_for()` 函数生成的分页链接需要额外的 `username` 参数，因为它们指向用户主页，该页面将用户名作为 URL 中的动态组件。

最后，*user.html* 模板的更改与我在首页上所做的相同：

*app/templates/user.html*: 用户主页模板中的分页链接

```
    ...
    {% for post in posts %}
        {% include '_post.html' %}
    {% endfor %}
    {% if prev_url %}
    <a href="{{ prev_url }}">Newer posts</a>
    {% endif %}
    {% if next_url %}
    <a href="{{ next_url }}">Older posts</a>
    {% endif %}

```

完成分页功能实验后，你可以将 `POSTS_PER_PAGE` 配置项设置为更合理的值：

*config.py*: 每页帖子数配置

```
class Config:
    # ...
    POSTS_PER_PAGE = 25

```

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
