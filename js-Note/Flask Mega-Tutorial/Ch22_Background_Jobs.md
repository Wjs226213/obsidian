# 第22部分：后台任务

> 来源: [https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxii-background-jobs](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxii-background-jobs) | Flask Mega-Tutorial by Miguel Grinberg

---

这是 Flask Mega-Tutorial 系列的第二十二篇文章，我将在此告诉您如何创建独立于 Web 服务器运行的后台任务。

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

- 第22章：后台任务（本文）

- 第23章：应用程序编程接口（API）

本章致力于实现需要作为应用程序一部分运行的长时间或复杂流程。这些流程无法在请求上下文中同步执行，因为那样会在任务持续期间阻塞对客户端的响应。我在第10章中简要提到过这个主题，当时我将发送电子邮件移到后台线程中，以防止客户端在发送电子邮件所需的 3-4 秒内等待。虽然使用线程发送电子邮件是可以接受的，但当涉及的流程要长得多时，这种解决方案的扩展性就不够了。公认的做法是将长时间任务卸载到工作进程，或者更可能的是卸载到一组工作进程中。

为了证明长时间运行任务的必要性，我将为 Microblog 引入一个导出功能，用户可以通过该功能请求一个包含其所有博客文章的数据文件。当用户使用此选项时，应用程序将启动一个导出任务，该任务会生成一个包含用户所有文章的 JSON 文件，然后通过电子邮件发送给用户。所有这些活动都将在工作进程中发生，并且在执行过程中，用户将看到一个显示完成百分比的通知。

*本章的 GitHub 链接：浏览、压缩包、差异比较。*

## 任务队列简介

任务队列为应用程序提供了一种便捷的解决方案，使其能够请求由*工作进程*执行任务。工作进程独立于应用程序运行，甚至可以位于不同的系统上。应用程序与工作进程之间的通信通过*消息队列*进行。应用程序提交一个任务，然后通过与队列交互来监控其进度。下图显示了一个典型的实现：

Python 最流行的任务队列是 Celery。这是一个相当复杂的包，具有许多选项并支持多种消息队列。另一个流行的 Python 任务队列是 Redis Queue（简称 RQ），它牺牲了一些灵活性（例如仅支持 Redis 消息队列），但作为交换，它比 Celery 设置起来简单得多。

Celery 和 RQ 都完全适合支持 Flask 应用程序中的后台任务，我对此应用的选择将倾向于 RQ 的简洁性。不过，使用 Celery 实现相同的功能应该相对容易。如果您对 Celery 比 RQ 更感兴趣，可以阅读我博客上的《将 Celery 与 Flask 结合使用》文章。

## 使用 RQ

RQ 是一个标准的 Python 包，可以通过 `pip` 安装：

```
(venv) $ pip install rq
(venv) $ pip freeze > requirements.txt

```

正如我前面提到的，应用程序与 RQ 工作进程之间的通信将通过 Redis 消息队列进行，因此您需要有一个正在运行的 Redis 服务器。有多种方式可以安装和运行 Redis 服务器，从一键安装程序到下载源代码并在系统上直接编译。如果您使用的是 Windows，Microsoft 在此处维护有安装程序。在 Linux 上，您很可能可以通过操作系统的包管理器获取它，而 macOS 用户可以运行 `brew install redis`，然后使用 `redis-server` 命令手动启动服务。

除了确保 Redis 服务正在运行并且 RQ 可以访问之外，您完全不需要与 Redis 交互。

请注意，RQ 不能在 Windows 原生 Python 解释器上运行。如果您使用的是 Windows 平台，您只能在 Unix 模拟下运行 RQ。我向 Windows 用户推荐的两种 Unix 模拟层是 Cygwin 和 Windows Subsystem for Linux（WSL），两者都与 RQ 兼容。

### 创建任务

我将向您展示如何通过 RQ 运行一个简单的任务，以便您熟悉它。任务本质上就是一个 Python 函数。以下是一个示例任务，我将把它放在一个新的 *app/tasks.py* 模块中：

*app/tasks.py*：示例后台任务。

```
import time

def example(seconds):
    print('Starting task')
    for i in range(seconds):
        print(i)
        time.sleep(1)
    print('Task completed')

```

这个任务接受一个秒数作为参数，然后等待相应的时间，每秒打印一次计数器。

### 运行 RQ 工作进程

现在任务已经准备好了，可以启动一个工作进程。这可以通过 `rq worker` 命令来完成：

```
(venv) $ rq worker microblog-tasks
18:55:06 RQ worker 'rq:worker:miguelsmac.90369' started, version 0.9.1
18:55:06 Cleaning registries for queue: microblog-tasks
18:55:06
18:55:06 *** Listening on microblog-tasks...

```

工作进程现在已连接到 Redis，并正在监视可能分配给它的任何任务，队列名为 `microblog-tasks`。如果您希望有多个工作进程以获得更高的吞吐量，只需运行更多 `rq worker` 实例，全部连接到同一个队列即可。当一个任务出现在队列中时，任何可用的工作进程都会拾取它。在生产环境中，您可能希望至少拥有与可用 CPU 数量相同的工作进程。

### 执行任务

现在打开第二个终端窗口并激活其中的虚拟环境。我将使用一个 shell 会话来启动 `example()` 任务在工作进程中运行：

```
>>> from redis import Redis
>>> import rq
>>> queue = rq.Queue('microblog-tasks', connection=Redis.from_url('redis://'))
>>> job = queue.enqueue('app.tasks.example', 23)
>>> job.get_id()
'c651de7f-21a8-4068-afd5-8b982a6f6d32'

```

RQ 的 `Queue` 类代表从应用程序端看到的任务队列。它接受的参数是队列名称和一个 `Redis` 连接对象，在这里我使用默认 URL 初始化。如果您的 Redis 服务器运行在不同的主机或端口号上，您需要使用不同的 URL。

队列上的 `enqueue()` 方法用于向队列添加任务。第一个参数是您要执行的任务的名称，可以直接作为函数对象给出，也可以作为导入字符串给出。我发现字符串选项更方便，因为它不需要在应用程序端导入函数。`enqueue()` 的任何剩余参数都将传递给在工作进程中运行的函数。

一旦您调用 `enqueue()`，您就会在第一个终端窗口（运行 RQ 工作进程的那个）中看到一些活动。您将看到 `example()` 函数正在运行，并每秒打印一次计数器。同时，您的另一个终端不会被阻塞，您可以继续在 shell 中计算表达式。在上面的示例中，我调用了 `job.get_id()` 方法来获取分配给任务的唯一标识符。您可以对 `job` 对象尝试的另一个有趣表达式是检查工作进程上的函数是否已经完成：

```
>>> job.is_finished
False

```

如果您像我上面的示例一样传递了 `23`，那么该函数将运行大约 23 秒。在那之后，`job.is_finished` 表达式将变为 `True`。这很酷，不是吗？我真的很喜欢 RQ 的简洁性。

函数完成后，工作进程会返回到等待新任务的状态，因此您可以重复调用 `enqueue()` 并传入不同的参数以进一步实验。队列中与任务相关的数据会保留一段时间（默认 500 秒），但最终会被移除。这很重要，任务队列不会保留已执行任务的历史记录。

### 报告任务进度

我上面使用的示例任务过于简单。通常，对于一个长时间运行的任务，您希望将某种进度信息提供给应用程序，然后应用程序可以将其展示给用户。RQ 通过使用任务对象的 `meta` 属性来支持这一点。让我重写 `example()` 任务以写入进度报告：

*app/tasks.py*：带有进度的示例后台任务。

```
import time
from rq import get_current_job

def example(seconds):
    job = get_current_job()
    print('Starting task')
    for i in range(seconds):
        job.meta'progress' = 100.0 * i / seconds
        job.save_meta()
        print(i)
        time.sleep(1)
    job.meta'progress' = 100
    job.save_meta()
    print('Task completed')

```

这个新版本的 `example()` 使用 RQ 的 `get_current_job()` 函数来获取一个任务实例，类似于应用程序提交任务时返回的那个。任务对象的 `meta` 属性是一个字典，任务可以向其中写入任何希望传递给应用程序的自定义数据。在这个示例中，我写入了一个 `progress` 项，表示任务完成的百分比。每次进度更新时，我调用 `job.save_meta()` 来指示 RQ 将数据写入 Redis，以便应用程序可以找到它。

在应用程序端（目前只是一个 Python shell），我可以运行此任务并按如下方式监控进度：

```
>>> job = queue.enqueue('app.tasks.example', 23)
>>> job.meta
{}
>>> job.refresh()
>>> job.meta
{'progress': 13.043478260869565}
>>> job.refresh()
>>> job.meta
{'progress': 69.56521739130434}
>>> job.refresh()
>>> job.meta
{'progress': 100}
>>> job.is_finished
True

```

如上所示，在这一端可以读取 `meta` 属性。需要调用 `refresh()` 方法才能从 Redis 更新内容。

## 任务的数据库表示

对于上面的示例，启动一个任务并观察其运行就足够了。对于 Web 应用程序来说，情况会变得稍微复杂一些，因为一旦这些任务作为请求的一部分启动，该请求就会结束，并且该任务的所有上下文都将丢失。因为我希望应用程序跟踪每个用户正在运行的任务，所以我需要使用一个数据库表来维护一些状态。下面您可以看到新的 `Task` 模型实现：

*app/models.py*：Task 模型。

```
# ...
import redis
import rq

class User(UserMixin, db.Model):
    # ...
    tasks: so.WriteOnlyMapped'Task' = so.relationship(back_populates='user')

# ...

class Task(db.Model):
    id: so.Mappedstr = so.mapped_column(sa.String(36), primary_key=True)
    name: so.Mappedstr = so.mapped_column(sa.String(128), index=True)
    description: so.MappedOptional[str] = so.mapped_column(sa.String(128))
    user_id: so.Mappedint = so.mapped_column(sa.ForeignKey(User.id))
    complete: so.Mappedbool = so.mapped_column(default=False)

    user: so.MappedUser = so.relationship(back_populates='tasks')

    def get_rq_job(self):
        try:
            rq_job = rq.job.Job.fetch(self.id, connection=current_app.redis)
        except (redis.exceptions.RedisError, rq.exceptions.NoSuchJobError):
            return None
        return rq_job

    def get_progress(self):
        job = self.get_rq_job()
        return job.meta.get('progress', 0) if job is not None else 100

```

这个模型与之前模型的一个有趣区别是 `id` 主键字段是一个字符串，而不是整数。这是因为对于这个模型，我不会依赖数据库自身的主键生成，而是使用 RQ 生成的任务标识符。

该模型将存储任务的完全限定名称（传递给 RQ 的）、适合向用户显示的任务描述、请求该任务的用户关系，以及一个表示任务是否完成的布尔值。`complete` 字段的目的是将已结束的任务与正在运行的任务区分开来，因为正在运行的任务需要特殊处理来显示进度更新。

`get_rq_job()` 方法是一个辅助方法，它从给定的任务 id 加载 RQ `Job` 实例，该 id 可以从模型中获取。这是通过 `Job.fetch()` 完成的，它从 Redis 中存在的相关数据加载 `Job` 实例。`get_progress()` 方法在 `get_rq_job()` 的基础上构建，并返回任务的进度百分比。这个方法有一些有趣的假设。如果模型中的任务 id 在 RQ 队列中不存在，那意味着任务已经完成，数据已过期并从队列中移除，因此在这种情况下返回的百分比是 100。在另一种极端情况下，如果任务存在，但 `meta` 属性没有关联信息，那么可以安全地假设任务已安排运行但尚未开始，因此在这种情况下返回 0 作为进度。

为了应用这些更改到数据库模式，需要生成一个新的迁移，然后升级数据库：

```
(venv) $ flask db migrate -m "tasks"
(venv) $ flask db upgrade

```

新模型也可以添加到 shell 上下文中，以便在 shell 会话中无需导入即可访问：

*microblog.py*：将 Task 模型添加到 shell 上下文。

```
import sqlalchemy as sa
import sqlalchemy.orm as so
from app import create_app, db
from app.models import User, Post, Message, Notification, Task

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'sa': sa, 'so': so, 'db': db, 'User': User, 'Post': Post,
            'Message': Message, 'Notification': Notification, 'Task': Task}

```

## 将 RQ 集成到 Flask 应用中

Redis 服务的连接 URL 需要添加到配置中：

```
class Config:
    # ...
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://'

```

和往常一样，Redis 连接 URL 将从环境变量中获取，如果变量未定义，则使用一个假设服务运行在相同主机和默认端口的默认 URL。

应用工厂函数将负责初始化 Redis 和 RQ：

*app/__init__.py*：RQ 集成。

```
# ...
from redis import Redis
import rq

# ...

def create_app(config_class=Config):
    # ...
    app.redis = Redis.from_url(app.config'REDIS_URL')
    app.task_queue = rq.Queue('microblog-tasks', connection=app.redis)

    # ...

```

`app.task_queue` 将是提交任务的队列。将队列附加到应用程序很方便，因为在应用程序的任何地方我都可以使用 `current_app.task_queue` 来访问它。为了使应用程序的任何部分都能轻松提交或检查任务，我可以在 `User` 模型中创建一些辅助方法：

*app/models.py*：用户模型中的任务辅助方法。

```
# ...

class User(UserMixin, db.Model):
    # ...

    def launch_task(self, name, description, *args, **kwargs):
        rq_job = current_app.task_queue.enqueue(f'app.tasks.{name}', self.id,
                                                *args, **kwargs)
        task = Task(id=rq_job.get_id(), name=name, description=description,
                    user=self)
        db.session.add(task)
        return task

    def get_tasks_in_progress(self):
        query = self.tasks.select().where(Task.complete == False)
        return db.session.scalars(query)

    def get_task_in_progress(self, name):
        query = self.tasks.select().where(Task.name == name,
                                          Task.complete == False)
        return db.session.scalar(query)

```

`launch_task()` 方法负责将任务提交到 RQ 队列，并将其添加到数据库中。`name` 参数是函数名，定义在 *app/tasks.py* 中。提交到 RQ 时，函数会在此名称前加上 `app.tasks.` 以构建完全限定的函数名。`description` 参数是任务的友好描述，可以呈现给用户。对于导出博客文章的函数，我会将名称设置为 `export_posts`，描述设置为 `Exporting posts...`。其余参数是位置参数和关键字参数，将被传递给任务。该函数首先调用队列的 `enqueue()` 方法来提交任务。返回的任务对象包含 RQ 分配的任务 id，因此我可以使用它在数据库中创建一个对应的 `Task` 对象。

请注意，`launch_task()` 将新任务对象添加到会话中，但不会提交。通常，最好在更高级别的函数中操作数据库会话，因为这允许您将较低级别函数所做的多次更新合并到单个事务中。这不是一个严格的规则，事实上，在本章后面您会看到一个例外情况，其中在子函数中发出了提交。

`get_tasks_in_progress()` 方法返回用户所有未完成的任务列表。稍后您将看到，我使用此方法在渲染给用户的页面中包含有关正在运行的任务的信息。

最后，`get_task_in_progress()` 是前一个方法的简化版本，用于返回特定任务。我阻止用户同时启动两个或更多相同类型的任务，因此在启动任务之前，我可以用此方法来检查是否有之前的任务正在运行。

## 从 RQ 任务发送电子邮件

这可能看起来偏离了主要话题，但我上面说过，当后台导出任务完成时，将向用户发送一封包含所有文章的 JSON 文件的电子邮件。我在第11章中构建的电子邮件功能需要在两个方面进行扩展。首先，我需要添加对文件附件的支持，以便能够附加 JSON 文件。其次，`send_email()` 函数始终使用后台线程异步发送电子邮件。当我要从后台任务发送电子邮件时，该任务已经是异步的，再使用基于线程的二级后台任务就没有太大意义了，因此我需要同时支持同步和异步的电子邮件发送。

幸运的是，Flask-Mail 支持附件，所以我只需要扩展 `send_email()` 函数，使其接受附件作为额外参数，然后在 `Message` 对象中进行配置。为了可选地在前台发送电子邮件，我只需要添加一个布尔参数 `sync`：

*app/email.py*：支持附件的电子邮件发送。

```
# ...

def send_email(subject, sender, recipients, text_body, html_body,
               attachments=None, sync=False):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    if attachments:
        for attachment in attachments:
            msg.attach(*attachment)
    if sync:
        mail.send(msg)
    else:
        Thread(target=send_async_email,
               args=(current_app._get_current_object(), msg)).start()

```

`Message` 类的 `attach()` 方法接受三个参数来定义附件：文件名、媒体类型和实际文件数据。文件名只是收件人看到的附件名称，不需要是真正的文件。媒体类型定义了附件的类型，这有助于电子邮件阅读器适当地渲染它。例如，如果您将 `image/png` 作为媒体类型发送，电子邮件阅读器会知道附件是图像，从而可以相应地显示它。对于博客文章数据文件，我将使用 JSON 格式，其媒体类型为 `application/json`。第三个也是最后一个参数是包含附件内容的字符串或字节序列。

为了简单起见，`send_email()` 的 `attachments` 参数将是一个元组列表，每个元组包含三个元素，对应于 `attach()` 的三个参数。因此，对于列表中的每个元素，我需要将元组作为参数发送给 `attach()`。在 Python 中，如果您有一个包含要发送给函数的参数的列表或元组，您可以使用 `func(*args)` 将该列表展开为实际的参数列表，而不必使用像 `func(args0, args1, args2)` 这样更繁琐的语法。例如，如果您有 `args = [1, 'foo']`，该调用将发送两个参数，与调用 `func(1, 'foo')` 相同。如果没有 `*`，调用将有一个参数，即该列表。

至于同步发送电子邮件，我所需要做的就是在 `sync` 为 `True` 时直接调用 `mail.send(msg)`。

## 任务辅助工具

虽然我上面使用的 `example()` 任务是一个简单的独立函数，但导出博客文章的函数将需要使用应用程序中的一些功能，例如访问数据库和电子邮件发送函数。因为它将在单独的进程中运行，所以我需要初始化 Flask-SQLAlchemy 和 Flask-Mail，而这又需要一个 Flask 应用实例来获取其配置。因此，我将在 *app/tasks.py* 模块的顶部添加一个 Flask 应用实例和应用上下文：

*app/tasks.py*：创建应用和上下文。

```
from app import create_app

app = create_app()
app.app_context().push()

```

应用在此模块中创建，因为这是 RQ 工作进程将要导入的唯一模块。当您使用 `flask` 命令时，根目录中的 *microblog.py* 模块会创建应用，但 RQ 工作进程对此一无所知，因此如果任务函数需要，它需要创建自己的应用实例。您已经在几个地方见过 `app.app_context()` 方法，推送上下文会使该应用成为"当前"应用实例，从而使 Flask-SQLAlchemy 等扩展能够使用 `current_app.config` 获取其配置。没有上下文，`current_app` 表达式将返回错误。

然后我开始思考在这个函数运行时如何报告进度。除了通过 `job.meta` 字典传递进度信息外，我还希望向客户端推送通知，这样完成百分比可以动态更新，而无需用户刷新页面。为此，我将使用第21章中构建的通知机制。更新的工作方式与未读消息徽章非常相似。当服务器渲染模板时，它将包含从 `job.meta` 获取的"静态"进度信息，但一旦页面到达客户端浏览器，通知将使用通知动态更新百分比。由于通知的存在，更新正在运行的任务的进度将比之前的示例稍微复杂一些，因此我将创建一个专门用于更新进度的包装函数：

*app/tasks.py*：设置任务进度。

```
from rq import get_current_job
from app import db
from app.models import Task

# ...

def _set_task_progress(progress):
    job = get_current_job()
    if job:
        job.meta'progress' = progress
        job.save_meta()
        task = db.session.get(Task, job.get_id())
        task.user.add_notification('task_progress', {'task_id': job.get_id(),
                                                     'progress': progress})
        if progress >= 100:
            task.complete = True
        db.session.commit()

```

导出任务可以调用 `_set_task_progress()` 来记录进度百分比。该函数首先将百分比写入 `job.meta` 字典并保存到 Redis，然后从数据库加载对应的任务对象，并使用 `task.user` 通过现有的 `add_notification()` 方法向请求该任务的用户推送通知。通知将被命名为 `task_progress`，与其关联的数据将是一个包含两项的字典：任务标识符和进度数字。稍后我将添加 JavaScript 代码来处理这种新的通知类型。

该函数检查进度是否指示函数已完成，如果是，则同时更新数据库中任务对象的 `complete` 属性。数据库提交调用确保任务和由 `add_notification()` 添加的通知对象都立即保存到数据库。我需要非常小心地设计父任务，使其不做任何数据库更改，因为此提交调用也会写入这些更改。

## 实现导出任务

现在所有部分都已就绪，可以编写导出函数了。该函数的高级结构如下：

*app/tasks.py*：导出文章的一般结构。

```
def export_posts(user_id):
    try:
        # read user posts from database
        # send email with data to user
    except Exception:
        # handle unexpected errors
    finally:
        # handle clean up

```

为什么要把整个任务包装在 try/except 块中？存在于请求处理程序中的应用程序代码受到意外错误的保护，因为 Flask 本身会捕获异常，然后根据我为应用程序设置的任何错误处理程序和日志记录配置进行处理。然而，此函数将在由 RQ 控制的独立进程中运行，而不是由 Flask 控制，因此如果发生任何意外错误，任务将中止，RQ 会将错误显示到控制台，然后返回等待新任务。因此，基本来说，除非您正在监视 RQ 工作进程的输出或将其记录到文件中，否则您永远不会发现发生了错误。

让我们先看看上面注释指示的部分中最简单的部分，即最后的错误处理和清理：

*app/tasks.py*：导出文章的错误处理。

```
import sys
# ...

def export_posts(user_id):
    try:
        # ...
    except Exception:
        _set_task_progress(100)
        app.logger.error('Unhandled exception', exc_info=sys.exc_info())
    finally:
        _set_task_progress(100)

```

每当发生意外错误时，我将使用 Flask 应用程序中的日志记录器对象来记录错误以及堆栈跟踪信息，这些信息由 `sys.exc_info()` 调用提供。在这里也使用 Flask 应用程序日志记录器记录错误的好处是，您为 Flask 应用程序实现的任何日志记录机制都将被遵守。例如，在第7章中，我将错误配置为发送给管理员电子邮件。仅仅通过使用 `app.logger`，我也为这些错误获得了相同的行为。在 `finally` 子句中，它将同时为错误和成功运行执行，我通过将进度设置为 100% 来标记任务完成。

接下来，我将编写实际的导出代码，它只是发出数据库查询并循环遍历结果，将它们累积在一个字典中：

*app/tasks.py*：从数据库读取用户文章。

```
import time
from app.models import User, Post

# ...

def export_posts(user_id):
    try:
        user = db.session.get(User, user_id)
        _set_task_progress(0)
        data = 
        i = 0
        total_posts = db.session.scalar(sa.select(sa.func.count()).select_from(
            user.posts.select().subquery()))
        for post in db.session.scalars(user.posts.select().order_by(
                Post.timestamp.asc())):
            data.append({'body': post.body,
                         'timestamp': post.timestamp.isoformat() + 'Z'})
            time.sleep(5)
            i += 1
            _set_task_progress(100 * i // total_posts)

        # send email with data to user
    except Exception:
        # ...
    finally:
        # ...

```

对于每篇文章，该函数将包含一个包含两个元素的字典：文章正文和文章撰写时间。时间将按照 ISO 8601 标准写入。我使用的 Python 的 `datetime` 对象不存储时区，因此在我以 ISO 格式导出时间后，我添加了表示 UTC 的 'Z'。

由于需要跟踪进度，代码变得稍微复杂了一些。我维护了一个计数器 `i`，并且需要在进入循环前发出一个额外的数据库查询来获取 `total_posts` 文章总数。使用 `i` 和 `total_posts`，每次循环迭代可以将任务进度更新为 0 到 100 之间的数字。

您可能注意到，我还在每次循环迭代中添加了 `time.sleep(5)` 调用。添加 sleep 的主要原因是让导出任务持续时间更长，以便能够在即使只导出少量博客文章的情况下也能看到进度上升。

下面您可以看到函数的最后部分，它向用户发送一封包含 `data` 中所有收集信息的邮件作为附件：

*app/tasks.py*：通过电子邮件向用户发送文章。

```
import json
from flask import render_template
from app.email import send_email

# ...

def export_posts(user_id):
    try:
        # ...

        send_email(
            'Microblog Your blog posts',
            sender=app.config'ADMINS'0, recipients=user.email,
            text_body=render_template('email/export_posts.txt', user=user),
            html_body=render_template('email/export_posts.html', user=user),
            attachments=('posts.json', 'application/json',
                          json.dumps({'posts': data}, indent=4)),
            sync=True)
    except Exception:
        # ...
    finally:
        # ...

```

这只是对 `send_email()` 函数的调用。附件被定义为一个包含三个元素的元组，这些元素随后被传递给 Flask-Mail 的 `Message` 对象的 `attach()` 方法。元组中的第三个元素是附件内容，由 Python 的 `json.dumps()` 函数生成。

这里引用了两个新的模板，它们提供纯文本和 HTML 形式的电子邮件正文内容。以下是文本模板：

*app/templates/email/export_posts.txt*：导出文章的纯文本邮件模板。

```
Dear {{ user.username }},

Please find attached the archive of your posts that you requested.

Sincerely,

The Microblog Team

```

以下是电子邮件的 HTML 版本：

*app/templates/email/export_posts.html*：导出文章的 HTML 邮件模板。

```
<p>Dear {{ user.username }},</p>
<p>Please find attached the archive of your posts that you requested.</p>
<p>Sincerely,</p>
<p>The Microblog Team</p>

```

## 应用程序中的导出功能

现在所有支持后台导出任务的核心部分都已就位。剩下的工作是将此功能连接到应用程序中，以便用户可以请求将他们的文章通过电子邮件发送给自己。

下面您可以看到一个新的 `export_posts` 视图函数：

*app/main/routes.py*：导出文章的路由和视图函数。

```
@bp.route('/export_posts')
@login_required
def export_posts():
    if current_user.get_task_in_progress('export_posts'):
        flash(_('An export task is currently in progress'))
    else:
        current_user.launch_task('export_posts', _('Exporting posts...'))
        db.session.commit()
    return redirect(url_for('main.user', username=current_user.username))

```

该函数首先检查用户是否有一个未完成的导出任务，如果有，则只闪现一条消息。同时为同一个用户运行两个导出任务确实没有意义，因此要防止这种情况。我可以使用之前实现的 `get_task_in_progress()` 方法来检查此条件。

如果用户尚未运行导出，则调用 `launch_task()` 来启动一个任务。第一个参数是函数名，将被传递给 RQ 工作进程，前缀为 `app.tasks.`。第二个参数只是一个友好的文本描述，将显示给用户。这两个值都被写入数据库的 `Task` 对象。该函数以重定向到用户个人资料页结束。

现在我需要暴露一个指向此路由的链接，用户可以通过该链接请求导出。我认为最合适的位置是在用户个人资料页中，该链接只应在用户查看自己的页面时显示，位于"编辑个人资料"链接下方：

*app/templates/user.html*：用户个人资料页中的导出链接。

```
                ...
                <p>
                    <a href="{{ url_for('main.edit_profile') }}">
                        {{ _('Edit your profile') }}
                    </a>
                </p>
                {% if not current_user.get_task_in_progress('export_posts') %}
                <p>
                    <a href="{{ url_for('main.export_posts') }}">
                        {{ _('Export your posts') }}
                    </a>
                </p>
                ...
                {% endif %}

```

此链接与一个条件绑定，因为我不希望在用户已有导出正在进行时显示它。

此时后台任务应该可以工作了，但没有给用户任何反馈。如果您想尝试一下，可以按如下方式启动应用程序和 RQ 工作进程：

- 确保 Redis 正在运行

- 在第一个终端窗口中，启动一个或多个 RQ 工作进程实例。为此，您必须使用命令 `rq worker microblog-tasks`

- 在第二个终端窗口中，使用 `flask run` 启动 Flask 应用程序（记得先设置 `FLASK_APP`）

## 进度通知

为了完成这个功能，我想在后台任务运行时通知用户，包括完成的百分比。在查看 Bootstrap 组件选项后，我决定使用导航栏下方的提示框。提示框是这些水平彩条，用于向用户显示信息。蓝色提示框用于渲染闪现消息。现在我将添加一个绿色的提示框来显示进度状态。下面是它的显示效果：

*app/templates/base.html*：基本模板中的导出进度提示框。

```
...
{% block content %}
    <div class="container">
        {% if current_user.is_authenticated %}
        {% with tasks = current_user.get_tasks_in_progress() %}
        {% if tasks %}
            {% for task in tasks %}
            <div class="alert alert-success" role="alert">
                {{ task.description }}
                <span id="{{ task.id }}-progress">{{ task.get_progress() }}</span>%
            </div>
            {% endfor %}
        {% endif %}
        {% endwith %}
        {% endif %}
        ...
{% endblock %}
...

```

渲染任务提示框的方法与闪现消息几乎相同。外部条件在用户未登录时跳过所有与提示框相关的标记。对于已登录的用户，我通过调用之前创建的 `get_tasks_in_progress()` 方法来获取当前进行中的任务列表。在当前版本的应用中，我最多只会得到一个结果，因为我不允许同时进行多个导出，但在将来我可能希望支持可以共存的其他类型任务，因此以通用方式编写这段代码可以为我节省以后的时间。

对于每个任务，我向页面写入一个提示框元素。提示框的颜色由第二个 CSS 类控制，在这里是 `alert-success`，而闪现消息是 `alert-info`。Bootstrap 文档包含有关提示框 HTML 结构的详细信息。提示框的文本包括存储在 `Task` 模型中的 `description` 字段，后跟完成百分比。

百分比被包裹在一个具有 `id` 属性的 `<span>` 元素中。这样做的原因是，当收到通知时，我将从 JavaScript 刷新百分比。我使用的任务 id 构造为任务 id 后跟 `-progress`。当通知到达时，它将包含任务 id，因此我可以使用 `#<task.id>-progress` 选择器轻松定位要更新的正确 `<span>` 元素。

如果您此时尝试应用程序，您将看到"静态"的进度更新，每次导航到新页面时都会更新。您会注意到，在启动导出任务后，您可以自由地导航到应用程序的不同页面，而正在运行的任务状态始终会被记住。

为了准备对百分比 `<span>` 元素进行动态更新，我将在 JavaScript 端编写一个小辅助函数：

*app/templates/base.html*：用于动态更新任务进度的辅助函数。

```
...
{% block scripts %}
    ...
    <script>
        ...
        function set_task_progress(task_id, progress) {
            const progressElement = document.getElementById(task_id + '-progress');
            if (progressElement) {
                progressElement.innerText = progress;
            }
        }
    </script>
    ...
{% endblock %}

```

此函数接受一个任务 `id` 和一个进度值，使用浏览器中的 DOM API 定位任务的 `<span>` 元素，如果该元素存在，则将新的进度写入其内容。

通知现在已经在到达浏览器，因为 *app/tasks.py* 中的 `_set_task_progress()` 函数每次进度更新时都会调用 `add_notification()`。如果您对这些通知如何无需我做任何事情就能到达浏览器感到困惑，那实际上是因为在第21章中，我明智地以完全通用的方式实现了通知功能。任何通过 `add_notification()` 方法添加的通知都会在浏览器定期向服务器请求通知更新时被浏览器看到。

但是处理这些通知的 JavaScript 代码只识别那些具有 `unread_message_count` 名称的通知，而忽略其余的通知。我现在需要做的是扩展该函数，使其也能处理 `task_progress` 通知，通过调用我上面定义的 `set_task_progress()` 函数。以下是处理来自 JavaScript 的通知循环的更新版本：

*app/templates/base.html*：通知处理程序。

```
          for (let i = 0; i < notifications.length; i++) {
            switch (notificationsi.name) {
              case 'unread_message_count':
                set_message_count(notificationsi.data);
                break;
              case 'task_progress':
                set_task_progress(notificationsi.data.task_id,
                    notificationsi.data.progress);
                break;
            }
            since = notificationsi.timestamp;
          }

```

现在我需要处理两种不同的通知，我决定将检查 `unread_message_count` 通知名称的 `if` 语句替换为一个 `switch` 语句，其中包含我现在需要支持的每种通知的一个分支。如果您不熟悉"C"系列语言，您可能以前没见过 switch 语句。它们提供了一种方便的语法，可以替代长的 `if/elseif` 语句链。这很好，因为随着我需要支持更多通知，我可以简单地继续添加更多的 `case` 块。

如果您还记得，RQ 任务附加到 `task_progress` 通知的数据是一个包含两个元素的字典：`task_id` 和 `progress`，这正是我需要用来调用 `set_task_progress()` 的两个参数。

如果您现在运行应用程序，绿色提示框中的进度指示器将每 10 秒刷新一次，因为通知会被传递给客户端。

由于我在本章中引入了新的可翻译字符串，翻译文件需要更新。如果您维护的是非英语语言文件，您需要使用 Flask-Babel 刷新您的翻译文件，然后添加新的翻译：

```
(venv) $ flask translate update

```

如果您使用的是西班牙语翻译，那么我已经为您完成了翻译工作，因此您只需从本章的下载包中提取 *app/translations/es/LC_MESSAGES/messages.po* 文件并添加到您的项目中即可。

翻译完成后，您需要编译翻译文件：

```
(venv) $ flask translate compile

```

## 部署注意事项

为了完成本章，我想讨论一下应用程序的部署方式将如何变化。为了支持后台任务，我在技术栈中增加了两个新组件：一个 Redis 服务器和一个或多个 RQ 工作进程。显然，这些需要包含在您的部署策略中，因此我将简要回顾我在前几章中介绍的不同部署选项以及它们受这些更改的影响。

### 在 Linux 服务器上部署

如果您在 Linux 服务器上运行应用程序，添加 Redis 就像从操作系统安装此包一样简单。对于 Ubuntu Linux，您需要运行 `sudo apt-get install redis-server`。

要运行 RQ 工作进程，您可以按照第17章中的"设置 Gunicorn 和 Supervisor"部分创建第二个 Supervisor 配置，在其中运行 `rq worker microblog-tasks` 而不是 `gunicorn`。如果您想运行多个工作进程（在生产环境中可能应该这样做），您可以使用 Supervisor 的 `numprocs` 指令来指示您想要同时运行的实例数量。

### 在 Heroku 上部署

要将应用程序部署到 Heroku，您需要向您的帐户添加一个 Redis 服务。这类似于我用来添加 Postgres 数据库的过程。Redis 也有免费层，可以通过以下命令添加：

```
$ heroku addons:create heroku-redis:hobby-dev

```

您的新 Redis 服务的访问 URL 将作为 `REDIS_URL` 变量添加到您的 Heroku 环境中，这正是应用程序所期望的。

Heroku 的免费计划允许一个 web dyno 和一个 worker dyno，因此您可以在不产生任何费用的情况下托管一个 `rq` 工作进程和您的应用程序。为此，您需要在您的 procfile 中使用单独的一行来声明工作进程：

```
web: flask db upgrade; flask translate compile; gunicorn microblog:app
worker: rq worker -u $REDIS_URL microblog-tasks

```

在应用这些更改进行部署后，您可以使用以下命令启动工作进程：

```
$ heroku ps:scale worker=1

```

### 在 Docker 上部署

如果您将应用程序部署到 Docker 容器，那么您首先需要在应用程序使用的同一网络上创建一个 Redis 容器。为此，您可以使用 Docker 仓库中的官方 Redis 镜像：

```
$ docker run --name redis -d -p 6379:6379 --network microblog-network redis:latest

```

当您运行应用程序时，您需要设置 `REDIS_URL` 环境变量，类似于 MySQL 容器的处理方式。以下是启动应用程序的完整命令，包括 Redis 链接：

```
$ docker run --name microblog -d -p 8000:5000 --rm -e SECRET_KEY=my-secret-key \
    -e MAIL_SERVER=smtp.googlemail.com -e MAIL_PORT=587 -e MAIL_USE_TLS=true \
    -e MAIL_USERNAME=<your-gmail-username> -e MAIL_PASSWORD=<your-gmail-password> \
    --network microblog-network \
    -e DATABASE_URL=mysql+pymysql://microblog:<database-password>@mysql/microblog \
    -e REDIS_URL=redis://redis:6379/0 \
    microblog:latest

```

最后，您需要运行一个或多个 RQ 工作进程的容器。由于工作进程基于与主应用程序相同的代码，您可以使用与应用程序相同的容器镜像，覆盖启动命令以便启动工作进程而不是 Web 应用程序。以下是启动工作进程的 `docker run` 命令示例：

```
$ docker run --name rq-worker -d --rm -e SECRET_KEY=my-secret-key \
    -e MAIL_SERVER=smtp.googlemail.com -e MAIL_PORT=587 -e MAIL_USE_TLS=true \
    -e MAIL_USERNAME=<your-gmail-username> -e MAIL_PASSWORD=<your-gmail-password> \
    --network microblog-network \
    -e DATABASE_URL=mysql+pymysql://microblog:<database-password>@mysql/microblog \
    -e REDIS_URL=redis://redis:6379/0 \
    --entrypoint venv/bin/rq \
    microblog:latest worker -u redis://redis:6379/0 microblog-tasks

```

覆盖 Docker 镜像的默认启动命令有点棘手，因为命令需要分两部分给出。`--entrypoint` 参数只接受可执行文件的名称，而参数（如果有的话）需要在镜像和标签之后、命令行末尾给出。请注意，`rq` 需要以 `venv/bin/rq` 的形式给出，这样它才能在虚拟环境未激活的情况下工作。

继续进入下一章。

##

---
> [[Flask Mega-Tutorial 学习笔记|返回目录]]
