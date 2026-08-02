# Part 8: 关注者

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-viii-followers](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-viii-followers) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第八部分，我将告诉你如何实现类似于 Twitter 和其他社交网络的"关注者"功能。

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

- Chapter 8: Followers（本文）

- Chapter 9: Pagination

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

在本章中，我将继续对应用程序的数据库进行一些扩展。我希望应用程序的用户能够轻松选择他们想要关注的其他用户。因此，我将扩展数据库以跟踪谁关注了谁，这比你想象的要复杂。

*本章的 GitHub 链接: Browse, Zip, Diff.*

## 回顾数据库关系

上面我说过要为每个用户维护一个"关注"和"关注者"用户列表。不幸的是，关系数据库没有我可以用来存储这些列表的列表类型，只有包含记录和记录之间关系的表。

数据库中有一个代表用户的表，所以需要做的是找到合适的关系类型来建模关注者/被关注链接。现在是回顾基本数据库关系类型的好时机：

### 一对多

我已在第四章中使用了"一对多"关系。以下是这种关系的图示：

这种关系关联的两个实体是用户和帖子。我说一个用户有*多篇*帖子，而一篇帖子有*一个*用户（或作者）。这种关系在数据库中通过在"多"方使用*外键*来表示。在上述关系中，外键是添加到 `posts` 表中的 `user_id` 字段。这个字段将每篇帖子与其作者在用户表中的记录关联起来。

很明显，`user_id` 字段提供了对给定帖子作者的直接访问，但反向呢？为了使关系有用，我应该能够获取给定用户撰写的帖子列表。`posts` 表中的 `user_id` 字段也足以回答这个问题，因为该列已经被索引，可以进行高效的查询，例如"检索所有 user_id 为 X 的帖子"。

### 多对多

多对多关系稍微复杂一些。例如，考虑一个包含 `students` 和 `teachers` 的数据库。可以说一个学生有*多位*老师，一位老师有*多个*学生。这就像从两端重叠的两个一对多关系。

对于这种类型的关系，我应该能够查询数据库，获取教授给定学生的老师列表，以及某个老师班级中的学生列表。这在关系数据库中实际上并不简单，因为无法通过向现有表添加外键来实现。

多对多关系的表示需要使用一个称为*关联表*的辅助表。以下是学生和老师示例的数据库结构：

虽然一开始可能不太明显，但具有两个外键的关联表能够高效地回答与该关系相关的所有查询。

### 多对一和一对一

多对一关系类似于一对多关系。区别在于这种关系是从"多"方的角度来看的。

一对一关系是一对多关系的一种特殊情况。其表示方式类似，但数据库中添加了一个约束，以防止"多"方拥有多个链接。虽然在某些情况下这种关系类型很有用，但它不如其他类型常见。

## 表示关注者

回顾所有关系类型的总结，很容易确定跟踪关注者的合适数据模型是多对多关系，因为一个用户关注*多个*用户，一个用户有*多个*关注者。但这里有一个转折。在学生和老师的示例中，有两个通过多对多关系关联的实体。但在关注者的情况下，是用户关注其他用户，所以只有用户。那么多对多关系的第二个实体是什么？

第二个实体也是用户。一个类的实例与同一个类的其他实例相关联的关系称为*自引用关系*，这正是我在这里的情况。

以下是跟踪关注者的自引用多对多关系图示：

`followers` 表是这种关系的关联表。该表中的外键都指向用户表中的条目，因为它是在将用户与用户关联起来。该表中的每条记录代表一个关注者用户和一个被关注用户之间的链接。与学生和老师示例一样，这样的设置使数据库能够回答我将需要的所有关于被关注和关注者用户的问题。相当巧妙。

## 数据库模型表示

让我们首先在数据库中添加关注者。下面是在 *models.py* 中，请确保将其添加到 `User` 模型之上，以便后续模型可以引用它。

*app/models.py*: 关注者关联表

```
followers = sa.Table(
    'followers',
    db.metadata,
    sa.Column('follower_id', sa.Integer, sa.ForeignKey('user.id'),
              primary_key=True),
    sa.Column('followed_id', sa.Integer, sa.ForeignKey('user.id'),
              primary_key=True)
)

```

这是我上面图示中关联表的直接翻译。注意我没有像对 users 和 posts 表那样将此表声明为一个模型。由于这是一个没有除外键之外其他数据的辅助表，我创建它时没有关联的模型类。

SQLAlchemy 的 `sa.Table` 类直接代表一个数据库表。表名作为第一个参数给出。第二个参数是 *metadata*，SQLAlchemy 在其中存储数据库中所有表的信息。使用 Flask-SQLAlchemy 时，可以通过 `db.metadata` 获取 metadata 实例。该表的列是使用列名、类型和选项初始化的 `sa.Column` 实例。对于此表，两个外键单独来看都不能作为主键使用（因为它们的值可能不唯一），但两个外键的组合是唯一的。因此，这两列都被标记为主键。这被称为*复合主键*。

现在我可以为用户表定义两个多对多关系属性：

*app/models.py*: 多对多关注者关系

```
class User(UserMixin, db.Model):
    # ...
    following: so.WriteOnlyMapped['User'] = so.relationship(
        secondary=followers, primaryjoin=(followers.c.follower_id == id),
        secondaryjoin=(followers.c.followed_id == id),
        back_populates='followers')
    followers: so.WriteOnlyMapped['User'] = so.relationship(
        secondary=followers, primaryjoin=(followers.c.followed_id == id),
        secondaryjoin=(followers.c.follower_id == id),
        back_populates='following')

```

这个关系的设置并不简单。就像我对 `posts` 一对多关系所做的那样，我使用 `so.relationship` 函数在模型类中定义关系。但由于这种关系在两端使用相同的模型，所以两个关系属性是同时定义的。

这种关系将 `User` 实例与其他 `User` 实例关联起来。按照惯例，对于一对通过此关系关联的用户，左侧用户关注右侧用户。我以左侧用户的角度将关系命名为 `following`，因为当我从左侧查询此关系时，会得到左侧用户关注的所有用户列表。相反，`followers` 关系从右侧开始，查找所有关注给定用户的用户。

两个关系都使用 `so.WriteOnlyMapped` 类型定义，与 `posts` 关系相同。让我们逐一检查 `so.relationship()` 调用的参数：

- `secondary` 配置用于此关系的关联表，即我在该类上方定义的关联表。

- `primaryjoin` 指示将实体链接到关联表的条件。在 `following` 关系中，用户必须匹配关联表的 `follower_id` 属性，因此条件反映了这一点。`followers.c.follower_id` 表达式引用了关联表的 `follower_id` 列。在 `followers` 关系中，角色相反，用户必须匹配 `followed_id` 列。

- `secondaryjoin` 指示将关联表链接到关系另一侧用户的条件。在 `following` 关系中，用户必须匹配 `followed_id` 列；在 `followers` 关系中，用户必须匹配 `follower_id` 列。

如果这很难理解，不用担心。稍后我会向你展示如何使用这些查询，届时一切都会变得更清晰。

数据库的变更需要记录在新的数据库迁移中：

```
(venv) $ flask db migrate -m "followers"
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.autogenerate.compare Detected added table 'followers'
  Generating /home/miguel/microblog/migrations/versions/ae346256b650_followers.py ... done

(venv) $ flask db upgrade
INFO  alembic.runtime.migration Context impl SQLiteImpl.
INFO  alembic.runtime.migration Will assume non-transactional DDL.
INFO  alembic.runtime.migration Running upgrade 37f06a334dbf -> ae346256b650, followers

```

## 添加和移除"关注"

借助 SQLAlchemy ORM，可以通过将 `following` 和 `followers` 关系视为列表来记录一个用户关注另一个用户的操作。例如，如果我有两个用户存储在 `user1` 和 `user2` 变量中，可以通过以下简单语句让第一个用户关注第二个用户：

```
user1.following.add(user2)

```

要取消关注该用户，则可以这样做：

```
user1.following.remove(user2)

```

尽管添加和移除关注者相当容易，但我想在代码中促进可重用性，所以不会在代码中到处散布"添加"和"移除"操作。相反，我将在 `User` 模型中实现"关注"和"取消关注"功能作为方法。最好将应用程序逻辑从视图函数移到模型或其他辅助类或模块中，因为正如你在本章后面将看到的，这将使单元测试更加容易。

以下是在用户模型中处理关注关系的更改：

*app/models.py*: 添加和移除关注者

```
class User(UserMixin, db.Model):
    #...

    def follow(self, user):
        if not self.is_following(user):
            self.following.add(user)

    def unfollow(self, user):
        if self.is_following(user):
            self.following.remove(user)

    def is_following(self, user):
        query = self.following.select().where(User.id == user.id)
        return db.session.scalar(query) is not None

    def followers_count(self):
        query = sa.select(sa.func.count()).select_from(
            self.followers.select().subquery())
        return db.session.scalar(query)

    def following_count(self):
        query = sa.select(sa.func.count()).select_from(
            self.following.select().subquery())
        return db.session.scalar(query)

```

`follow()` 和 `unfollow()` 方法使用我上面展示的只写关系对象的 `add()` 和 `remove()` 方法，但在操作关系之前，它们使用 `is_following()` 辅助方法来确保请求的操作是合理的。例如，如果我让 `user1` 关注 `user2`，但发现这个关注关系已经存在于数据库中，我不想添加重复项。取消关注的逻辑也是如此。

`is_following()` 方法对 `following` 关系执行查询，以检查给定用户是否已包含在其中。所有只写关系都有一个 `select()` 方法，用于构建返回关系中所有元素的查询。在这种情况下，我不需要获取所有元素，只查找特定用户，因此可以通过 `where()` 子句限制查询。

`followers_count()` 和 `following_count()` 方法返回用户的关注者和关注计数。这需要不同类型的查询，不返回结果，只返回其计数。这些查询的 `sa.select()` 子句指定了 SQLAlchemy 的 `sa.func.count()` 函数，以指示我想要获取函数的结果。然后通过 `select_from()` 子句添加需要计数的查询。每当查询作为较大查询的一部分时，SQLAlchemy 要求通过调用 `subquery()` 方法将内部查询转换为子查询。

## 获取关注用户的帖子

数据库中对关注者的支持已基本完成，但我实际上缺少一个重要的功能。在应用程序的首页上，我将展示当前登录用户关注的所有人撰写的博客帖子，所以我需要设计一个数据库查询来返回这些帖子。

最直接的方案是使用一个查询返回关注用户的列表，即 `user.following.select()`。执行此查询后，我可以再运行一个查询来获取每个返回用户的帖子。拿到所有帖子后，我就可以将它们合并到一个列表中并按日期排序。听起来不错？嗯，实际上并不好。

这种方法有几个问题。如果一个用户关注了一千个人怎么办？我将需要执行一千次数据库查询才能收集所有帖子。然后我还需要在内存中合并和排序这一千个列表。作为第二个问题，考虑应用程序的主页最终会实现*分页*，所以它不会显示所有可用的帖子，而只显示前几篇，并提供一个链接来获取更多。如果我要按日期排序显示帖子，除非我获取所有帖子并先排序，否则我怎么知道所有关注用户中最新的帖子是什么？这实际上是一个糟糕的解决方案，扩展性不好。

实际上无法避免这种博客帖子的合并和排序，但在应用程序中这样做会导致效率非常低下。这种工作正是关系数据库所擅长的。数据库具有索引，可以比我这边可能做到的更高效地执行查询和排序。所以我真正想要的是设计一个单一的数据库查询，定义我想要获取的信息，然后让数据库找出以最高效方式提取该信息的方法。

下面你可以看到这个查询：

*app/models.py*: 关注用户帖子查询

```
class User(UserMixin, db.Model):
    #...
    def following_posts(self):
        Author = so.aliased(User)
        Follower = so.aliased(User)
        return (
            sa.select(Post)
            .join(Post.author.of_type(Author))
            .join(Author.followers.of_type(Follower))
            .where(Follower.id == self.id)
            .order_by(Post.timestamp.desc())
        )

```

这是我在本应用程序中使用过的最复杂的查询。我将尝试逐部分解读这个查询。暂时忽略两个 `so.aliased()` 调用，当你查看此查询的结构时，会注意到有四个主要部分，由两个 `join()` 子句、`where()` 和 `order_by()` 定义：

```
sa.select(Post)
    .join(...)
    .join(...)
    .where(...)
    .order_by(...)

```

### 连接

要理解连接操作的作用，让我们看一个示例。假设我有一个包含以下内容的 `User` 表：

id
username

1
john

2
susan

3
mary

4
david

为了简单起见，我没有显示用户模型中的所有字段，只显示了对此查询重要的字段。

假设 `followers` 关联表表明用户 `john` 关注用户 `susan` 和 `david`，用户 `susan` 关注 `mary`，用户 `mary` 关注 `david`。表示上述关系的数据如下：

follower_id
followed_id

1
2

1
4

2
3

3
4

最后，`posts` 表包含每个用户的一篇帖子：

id
text
user_id

1
post from susan
2

2
post from mary
3

3
post from david
4

4
post from john
1

该表也省略了不参与此讨论的一些字段。

以下是查询的第一部分，包括第一个 `join()` 子句，暂时去掉 `of_type(Author)`，稍后我会解释：

```
sa.select(Post)
    .join(Post.author)

```

查询的 `select()` 部分定义了需要获取的实体，在这种情况下是帖子。接下来我要做的是*连接* posts 表中的条目与 `Post.author` 关系。

连接是一种数据库操作，根据给定的条件组合两个表中的行。组合后的表是一个临时表，在数据库中并不实际存在，但可以在查询过程中使用。当 `join()` 子句给定一个关系作为参数时，SQLAlchemy 会组合该关系左侧和右侧的行。

使用上面定义的示例数据，对 `Post.author` 关系执行连接操作的结果：

post.id
post.text
post.user_id
user.id
user.username

1
post from susan
2
2
susan

2
post from mary
3
3
mary

3
post from david
4
4
david

4
post from john
1
1
john

你可能会注意到，连接后表中的 `post.user_id` 和 `user.id` 列始终具有相同的值。因为我要求对 `Post.author` 关系进行连接，该关系将帖子链接到它们的作者，所以 SQLAlchemy 知道它需要匹配 posts 表中的行与 users 表中的行。

实际上，上面的连接所做的是创建一个扩展表，提供对帖子以及每篇帖子作者信息的访问。

不幸的是，事情现在变得更复杂了，因为接下来我需要再次连接上面组合后的表，以添加关注者。一旦我有了一个组合表，其每一行都有一个帖子、关注该帖子的关注者以及该帖子的作者，那么我就可以轻松地过滤出给定用户应该看到的帖子。

这个过程如此复杂的原因之一是在这个查询中我们需要以两种身份对待用户。在上面的连接中，用户是帖子的作者，但在第二个连接中，我需要将用户视为其他用户的关注者。为了能够清楚地告诉 SQLAlchemy 如何连接所有这些表，我需要有一种方法独立地将用户引用为作者和关注者。`so.aliased()` 调用用于创建 `User` 模型的两个引用，我可以在查询中使用它们。

所以这个查询中的第一个连接，涉及将帖子与其作者组合，可以写成如下：

```
Author = so.aliased(User)
sa.select(Post)
    .join(Post.author.of_type(Author))

```

这里，连接关系上的 `of_type(Author)` 限定符告诉 SQLAlchemy，在查询的其余部分，我将使用 `Author` 别名来引用关系的右侧实体。

现在让我们来看查询中的第二个连接：

```
Author = so.aliased(User)
Follower = so.aliased(User)
sa.select(Post)
    .join(Post.author.of_type(Author))
    .join(Author.followers.of_type(Follower))

```

对于第二个连接，我希望 SQLAlchemy 在 `Author.followers` 关系上进行连接，其中 `Author` 是上面定义的 `User` 别名。这是一个多对多关系，所以 `followers` 关联表也必须隐式地参与连接。作为此新连接结果添加到组合表中的用户将使用 `Follower` 别名。

`User.followers` 关系左侧是被关注的用户（由关联表中的 `followed_id` 外键定义），右侧是他们的关注者（由 `follower_id` 外键定义）。使用上述示例 `followers` 关联表，组合了帖子、它们的作者和它们的关注者的表如下：

post.id
post.text
post.user_id
author.id
author.username
follower.id
follower.username

1
post from susan
2
2
susan
1
john

2
post from mary
3
3
mary
2
susan

3
post from david
4
4
david
1
john

3
post from david
4
4
david
3
mary

关于此连接的结果，有几件有趣的事情值得一提。首先，表中的每一行都有作为作者的用户和作为关注者的用户，因此需要使用别名来避免混淆。

`post.id == 3` 的帖子在此连接后的表中出现了两次。你能说出为什么吗？这篇帖子的作者是 `david`，`user.id == 4`。在 `followers` 关联表中查找 `followed_id` 外键下的此用户，有两个条目分别对应 1 和 3 号用户，这意味着 `david` 被 `john` 和 `mary` 关注。由于这两个用户都必须连接到 `david` 撰写的这篇帖子，连接操作创建了两行，每行包含这篇帖子及一个连接上的用户。

还有一篇帖子完全没有出现。这是 `post.id == 4`，由 `john` 撰写。根据 `followers` 关联表，没有人关注这个用户，因此没有可以与之匹配的关注者，因此连接操作将此帖子从结果中丢弃了。

### 过滤

连接操作给了我一个用户关注的所有帖子的列表，这比实际需要的数据多得多。我只对这个列表的子集感兴趣——仅被一个用户关注的帖子，所以我需要移除所有不需要的条目，这可以通过 `where()` 子句来实现。

以下是查询的过滤部分：

```
    .where(Follower.id == self.id)

```

由于此查询位于 `User` 类的方法中，`self.id` 表达式指的是我为其检索帖子的用户。`where()` 调用选择连接后表中将该用户作为关注者的条目。请记住，此查询中的 `Follower` 是 `User` 的一个别名，这是必需的，以便 SQLAlchemy 知道过滤基于的是表中每一行包含的两个用户中的哪一个。

假设我感兴趣的用户是 `john`，其 `id` 字段设置为 1。以下是过滤后的连接表：

post.id
post.text
post.user_id
author.id
author.username
follower.id
follower.username

1
post from susan
2
2
susan
1
john

3
post from david
4
4
david
1
john

这些正是我想要的帖子！

请记住，查询是在 `Post` 类上发出的，所以即使我最终得到了一个由数据库作为此查询的一部分创建的更大表，结果将是包含在此临时表中的帖子，不包括由连接操作添加的额外列。

### 排序

过程的最后一步是对结果进行排序。执行此操作的查询部分如下：

```
    .order_by(Post.timestamp.desc())

```

这里我要求结果按帖子的 `timestamp` 字段降序排序。通过这种排序，第一个结果将是最新的博客帖子。

## 合并自己和关注用户的帖子

我在 `following_posts()` 函数中使用的查询非常有用，但有一个局限性。人们期望在自己的关注用户时间线中看到自己的帖子，但上面定义的查询不包括用户自己的帖子。

有两种可能的方法来扩展此查询以包含用户自己的帖子。最直接的方法是保持查询不变，但确保所有用户都关注自己。如果你是你自己的关注者，那么上面的查询将找到你自己的帖子以及你关注的所有人的帖子。这种方法的缺点在于它会影响关注者的计数。所有关注者计数都会增加一，因此在显示之前需要进行调整。

另一种方法是扩展查询逻辑，使结果要么来自关注的帖子，要么来自用户自己的帖子。

经过考虑，我决定采用第二种方法。下面你可以看到 `following_posts()` 方法在通过联合包含用户自己的帖子之后的版本：

*app/models.py*: 包含用户自己帖子的关注帖子查询

```
    def following_posts(self):
        Author = so.aliased(User)
        Follower = so.aliased(User)
        return (
            sa.select(Post)
            .join(Post.author.of_type(Author))
            .join(Author.followers.of_type(Follower), isouter=True)
            .where(sa.or_(
                Follower.id == self.id,
                Author.id == self.id,
            ))
            .group_by(Post)
            .order_by(Post.timestamp.desc())
        )

```

此查询的结构现在如下：

```
sa.select(Post)
    .join(...)
    .join(..., isouter=True)
    .where(sa.or_(..., ...))
    .group_by(...)
    .order_by(...)

```

### 外连接

第二个连接现在是一个*外连接*。你还记得上一节中 `john` 写的帖子发生了什么吗？当计算第二个连接时，这篇帖子被丢弃了，因为这个用户没有关注者。为了能够包含用户自己的帖子，首先需要将连接改为保留连接右侧没有匹配项的帖子。上一节中使用的连接称为*内连接*，只保留左侧有匹配项在右侧的条目。`isouter=True` 选项告诉 SQLAlchemy 改用*左外连接*，它会保留左侧在右侧没有匹配项的条目。

使用左外连接时，连接后的表为：

post.id
post.text
post.user_id
author.id
author.username
follower.id
follower.username

1
post from susan
2
2
susan
1
john

2
post from mary
3
3
mary
2
susan

3
post from david
4
4
david
1
john

3
post from david
4
4
david
3
mary

4
post from john
1
1
john
null
null

外连接确保连接后的表中至少包含 posts 表中每条帖子的一次出现。

### 复合过滤

连接后的表现在包含所有帖子，因此我可以扩展 `where()` 子句，同时包含关注用户的帖子和自己的帖子。SQLAlchemy 提供了 `sa.or_()`、`sa.and_()` 和 `sa.not_()` 辅助函数来创建复合条件。在这个例子中，我需要使用 `sa.or_()` 来指定选择帖子的两种选项。

让我们回顾更新后的过滤条件：

```
    .where(sa.or_(
        Follower.id == self.id,
        Author.id == self.id,
    ))

```

这里我再次利用了别名，没有别名将无法描述我想要做的事情。这个条件的意思是，我想要获取将该用户作为关注者的帖子，或者将该用户作为作者的帖子。

再次以 `john` 为例，过滤后的表将是：

post.id
post.text
post.user_id
author.id
author.username
follower.id
follower.username

1
post from susan
2
2
susan
1
john

3
post from david
4
4
david
1
john

4
post from john
1
1
john
null
null

这很完美，因为这个列表包含两条关注用户的帖子加上用户自己的帖子。

### 分组

不使用 `john`，让我们尝试过滤 `david`：

post.id
post.text
post.user_id
author.id
author.username
follower.id
follower.username

3
post from david
4
4
david
1
john

3
post from david
4
4
david
3
mary

这个用户没有关注任何人，所以唯一的结果来自该用户撰写的帖子。但有一个问题：这个用户只写了一篇帖子，但由于连接的需求，那篇帖子被重复了，而过滤并没有消除重复。

连接表上的重复实际上非常常见。如果你查看完整的连接表，还可以看到 `john` 作为关注者出现了两次。因为这些连接包含一个多对多关系，当数据库匹配两侧的实体时，两端都可能出现重复。

为了消除最终结果列表中的重复项，可以添加一个 `group_by()` 子句到查询中。该子句在过滤后查看结果，并消除提供的参数的任何重复项。对于此查询，我希望确保没有重复的帖子，所以我传递 `Post` 作为参数，SQLAlchemy 会将其解释为模型的所有属性。

## 用户模型的单元测试

虽然我不认为我实现的一对一功能是一个"复杂"的功能，但我认为它并不简单。当我编写不平凡的代码时，我担心的是确保这些代码在未来继续正常工作，同时我在应用程序的不同部分进行修改。确保已编写的代码在未来继续工作的最佳方法是创建一套自动化测试，每次进行更改时都可以重新运行。

Python 包含一个非常有用的 `unittest` 包，使编写和执行单元测试变得容易。让我们在一个 *tests.py* 模块中为 `User` 类中的现有方法编写一些单元测试：

*tests.py*: 用户模型单元测试

```
import os
os.environ['DATABASE_URL'] = 'sqlite://'

from datetime import datetime, timezone, timedelta
import unittest
from app import app, db
from app.models import User, Post

class UserModelCase(unittest.TestCase):
    def setUp(self):
        self.app_context = app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_password_hashing(self):
        u = User(username='susan', email='susan@example.com')
        u.set_password('cat')
        self.assertFalse(u.check_password('dog'))
        self.assertTrue(u.check_password('cat'))

    def test_avatar(self):
        u = User(username='john', email='john@example.com')
        self.assertEqual(u.avatar(128), ('https://www.gravatar.com/avatar/'
                                         'd4c74594d841139328695756648b6bd6'
                                         '?d=identicon&s=128'))

    def test_follow(self):
        u1 = User(username='john', email='john@example.com')
        u2 = User(username='susan', email='susan@example.com')
        db.session.add(u1)
        db.session.add(u2)
        db.session.commit()
        following = db.session.scalars(u1.following.select()).all()
        followers = db.session.scalars(u2.followers.select()).all()
        self.assertEqual(following, [])
        self.assertEqual(followers, [])

        u1.follow(u2)
        db.session.commit()
        self.assertTrue(u1.is_following(u2))
        self.assertEqual(u1.following_count(), 1)
        self.assertEqual(u2.followers_count(), 1)
        u1_following = db.session.scalars(u1.following.select()).all()
        u2_followers = db.session.scalars(u2.followers.select()).all()
        self.assertEqual(u1_following[0].username, 'susan')
        self.assertEqual(u2_followers[0].username, 'john')

        u1.unfollow(u2)
        db.session.commit()
        self.assertFalse(u1.is_following(u2))
        self.assertEqual(u1.following_count(), 0)
        self.assertEqual(u2.followers_count(), 0)

    def test_follow_posts(self):
        # 创建四个用户
        u1 = User(username='john', email='john@example.com')
        u2 = User(username='susan', email='susan@example.com')
        u3 = User(username='mary', email='mary@example.com')
        u4 = User(username='david', email='david@example.com')
        db.session.add_all([u1, u2, u3, u4])

        # 创建四篇帖子
        now = datetime.now(timezone.utc)
        p1 = Post(body="post from john", author=u1,
                  timestamp=now + timedelta(seconds=1))
        p2 = Post(body="post from susan", author=u2,
                  timestamp=now + timedelta(seconds=4))
        p3 = Post(body="post from mary", author=u3,
                  timestamp=now + timedelta(seconds=3))
        p4 = Post(body="post from david", author=u4,
                  timestamp=now + timedelta(seconds=2))
        db.session.add_all([p1, p2, p3, p4])
        db.session.commit()

        # 设置关注关系
        u1.follow(u2)  # john 关注 susan
        u1.follow(u4)  # john 关注 david
        u2.follow(u3)  # susan 关注 mary
        u3.follow(u4)  # mary 关注 david
        db.session.commit()

        # 检查每个用户的关注帖子
        f1 = db.session.scalars(u1.following_posts()).all()
        f2 = db.session.scalars(u2.following_posts()).all()
        f3 = db.session.scalars(u3.following_posts()).all()
        f4 = db.session.scalars(u4.following_posts()).all()
        self.assertEqual(f1, [p2, p4, p1])
        self.assertEqual(f2, [p2, p3])
        self.assertEqual(f3, [p3, p4])
        self.assertEqual(f4, [p4])

if __name__ == '__main__':
    unittest.main(verbosity=2)

```

我添加了四个测试来测试用户模型中的密码哈希、用户头像和关注者功能。`setUp()` 和 `tearDown()` 是特殊的测试方法，单元测试框架会在每个测试之前和之后分别执行。

我实现了一个小技巧，以防止单元测试使用我用于开发的常规数据库。通过将 `DATABASE_URL` 环境变量设置为 `sqlite://`，我更改了应用程序的配置，使 SQLAlchemy 在测试期间使用内存中的 SQLite 数据库。这很重要，因为我不希望测试修改我正在使用的数据库。

`setUp()` 方法随后创建一个*应用程序上下文*并将其推入。这确保 Flask 应用程序实例及其配置数据对 Flask 扩展可访问。如果目前这不太容易理解，不用担心，后续会详细介绍。

`db.create_all()` 调用创建所有数据库表。这是一种从零开始快速创建数据库的方法，对测试非常有用。对于开发和生产使用，我已经展示了如何通过数据库迁移来创建数据库表。

你可以使用以下命令运行整个测试套件：

```
(venv) $ python tests.py
2023-11-19 14:51:07,578 INFO in __init__: Microblog startup
test_avatar (__main__.UserModelCase.test_avatar) ... ok
test_follow (__main__.UserModelCase.test_follow) ... ok
test_follow_posts (__main__.UserModelCase.test_follow_posts) ... ok
test_password_hashing (__main__.UserModelCase.test_password_hashing) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.259s

OK

```

从现在开始，每次对应用程序进行更改后，你可以重新运行测试，以确保被测试的功能没有受到影响。此外，每当向应用程序添加新功能时，也应该为其编写单元测试。

## 将关注者功能集成到应用程序中

数据库和模型中对关注者的支持现已完成，但应用程序中还没有包含这些功能，所以我现在将其添加。

由于关注和取消关注操作会引入应用程序状态的变更，我将把它们实现为 `POST` 请求，通过提交 Web 表单来触发。将这些路由实现为 `GET` 请求会更容易，但这样它们可能受到 CSRF 攻击。因为 `GET` 请求更难防范 CSRF，它们应该只用于不引入状态变更的操作。将其作为表单提交来实现更好，因为可以在表单中添加 CSRF 令牌。

但是，当用户需要做的只是点击"关注"或"取消关注"而不提交任何数据时，如何通过 Web 表单触发关注或取消关注操作呢？为了实现这一点，表单将是空的。表单中唯一的元素是 CSRF 令牌（作为隐藏字段实现，由 Flask-WTF 自动添加）和一个提交按钮，供用户点击以触发操作。由于这两个操作几乎相同，我将为两者使用相同的表单。我将此表单称为 `EmptyForm`。

*app/forms.py*: 用于关注和取消关注的空表单

```
class EmptyForm(FlaskForm):
    submit = SubmitField('Submit')

```

让我们在应用程序中添加两个新路由，用于关注和取消关注用户：

*app/routes.py*: 关注和取消关注路由

```
from app.forms import EmptyForm

# ...

@app.route('/follow/<username>', methods=['POST'])
@login_required
def follow(username):
    form = EmptyForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == username))
        if user is None:
            flash(f'User {username} not found.')
            return redirect(url_for('index'))
        if user == current_user:
            flash('You cannot follow yourself!')
            return redirect(url_for('user', username=username))
        current_user.follow(user)
        db.session.commit()
        flash(f'You are following {username}!')
        return redirect(url_for('user', username=username))
    else:
        return redirect(url_for('index'))

@app.route('/unfollow/<username>', methods=['POST'])
@login_required
def unfollow(username):
    form = EmptyForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == username))
        if user is None:
            flash(f'User {username} not found.')
            return redirect(url_for('index'))
        if user == current_user:
            flash('You cannot unfollow yourself!')
            return redirect(url_for('user', username=username))
        current_user.unfollow(user)
        db.session.commit()
        flash(f'You are not following {username}.')
        return redirect(url_for('user', username=username))
    else:
        return redirect(url_for('index'))

```

这些路由中的表单处理更简单，因为我们只需要实现提交部分。与其他表单（如登录和编辑主页表单）不同，这两个表单没有自己的页面，它们将由 `user()` 路由渲染并显示在用户的主页上。`validate_on_submit()` 调用可能失败的唯一原因是 CSRF 令牌缺失或无效，所以在这种情况下我只是将应用程序重定向回首页。

如果表单验证通过，在执行关注或取消关注操作之前，我会进行一些错误检查。这是为了防止意外问题，并在出现问题时尝试向用户提供有用的消息。

为了渲染关注或取消关注按钮，我需要实例化一个 `EmptyForm` 对象并将其传递给 *user.html* 模板。由于这两个操作是互斥的，我可以将单个通用表单实例传递给模板：

*app/routes.py*: 更新用户路由以包含表单

```
@app.route('/user/<username>')
@login_required
def user(username):
    # ...
    form = EmptyForm()
    return render_template('user.html', user=user, posts=posts, form=form)

```

现在我可以将关注或取消关注表单添加到每个用户的主页中：

*app/templates/user.html*: 用户主页中的关注和取消关注链接

```
        ...
        <h1>User: {{ user.username }}</h1>
        {% if user.about_me %}<p>{{ user.about_me }}</p>{% endif %}
        {% if user.last_seen %}<p>Last seen on: {{ user.last_seen }}</p>{% endif %}
        <p>{{ user.followers_count() }} followers, {{ user.following_count() }} following.</p>
        {% if user == current_user %}
        <p><a href="{{ url_for('edit_profile') }}">Edit your profile</a></p>
        {% elif not current_user.is_following(user) %}
        <p>
            <form action="{{ url_for('follow', username=user.username) }}" method="post">
                {{ form.hidden_tag() }}
                {{ form.submit(value='Follow') }}
            </form>
        </p>
        {% else %}
        <p>
            <form action="{{ url_for('unfollow', username=user.username) }}" method="post">
                {{ form.hidden_tag() }}
                {{ form.submit(value='Unfollow') }}
            </form>
        </p>
        {% endif %}
        ...

```

用户主页模板的更改在最后访问时间戳下方添加了一行，显示该用户有多少关注者和关注了多少人。当你查看自己主页时显示"编辑"链接的那行现在可以有三种可能的链接：

- 如果用户正在查看自己的主页，则"编辑"链接照常显示。

- 如果用户正在查看目前没有关注的用户，则显示"关注"表单。

- 如果用户正在查看目前已经关注的用户，则显示"取消关注"表单。

为了在关注和取消关注表单中复用 `EmptyForm` 实例，我在渲染提交按钮时传递了一个 `value` 参数。在提交按钮中，`value` 属性定义了标签，通过这个技巧，我可以根据需要呈现给用户的操作来更改提交按钮的文本。

现在你可以运行应用程序，创建几个用户，然后试试关注和取消关注用户。你唯一需要记住的是输入你想要关注或取消关注的用户的主页 URL，因为目前还没有办法查看用户列表。例如，如果你想关注用户名为 `susan` 的用户，你需要在浏览器的地址栏中输入 *http://localhost:5000/user/susan* 来访问该用户的主页。看看在关注或取消关注时，关注者和关注计数的变化。

我应该在应用程序的首页显示关注的帖子列表，但我还没有把所有部件都准备好，因为当前版本的应用程序中用户还不能写博客帖子。所以我将推迟这一更改，直到该功能到位。

继续学习下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
