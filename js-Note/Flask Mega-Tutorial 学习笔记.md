# Flask Mega-Tutorial 学习笔记

> **来源**: [The Flask Mega-Tutorial, Part I: Hello, World!](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world) by Miguel Grinberg
> **版本**: 2024 Edition | **Flask 版本**: 3.x
> **适用**: Flask + SQLite + Vanilla JS 博客项目

---

## 📚 全套教程目录

| 章节 | 主题 | 大小 | 状态 |
|------|------|------|------|
| Ch 1 | Hello, World! | — | ⬇️ 本页 |
| Ch 2 | [[Flask Mega-Tutorial/Ch02_Templates\|Templates]] | 13 KB | ✅ |
| Ch 3 | [[Flask Mega-Tutorial/Ch03_Web_Forms\|Web Forms]] | 25 KB | ✅ |
| Ch 4 | [[Flask Mega-Tutorial/Ch04_Database\|Database]] | 36 KB | ✅ |
| Ch 5 | [[Flask Mega-Tutorial/Ch05_User_Logins\|User Logins]] | 26 KB | ✅ |
| Ch 6 | [[Flask Mega-Tutorial/Ch06_Profile_Page_and_Avatars\|Profile Page and Avatars]] | 23 KB | ✅ |
| Ch 7 | [[Flask Mega-Tutorial/Ch07_Error_Handling\|Error Handling]] | 21 KB | ✅ |
| Ch 8 | [[Flask Mega-Tutorial/Ch08_Followers\|Followers]] | 44 KB | ✅ |
| Ch 9 | [[Flask Mega-Tutorial/Ch09_Pagination\|Pagination]] | 23 KB | ✅ |
| Ch 10 | [[Flask Mega-Tutorial/Ch10_Email_Support\|Email Support]] | 24 KB | ✅ |
| Ch 11 | [[Flask Mega-Tutorial/Ch11_Facelift\|Facelift]] | 16 KB | ✅ |
| Ch 12 | [[Flask Mega-Tutorial/Ch12_Dates_and_Times\|Dates and Times]] | 12 KB | ✅ |
| Ch 13 | [[Flask Mega-Tutorial/Ch13_I18n_and_L10n\|I18n and L10n]] | 26 KB | ✅ |
| Ch 14 | [[Flask Mega-Tutorial/Ch14_Ajax\|Ajax]] | 29 KB | ✅ |
| Ch 15 | [[Flask Mega-Tutorial/Ch15_A_Better_Application_Structure\|A Better Application Structure]] | 30 KB | ✅ |
| Ch 16 | [[Flask Mega-Tutorial/Ch16_Full-Text_Search\|Full-Text Search]] | 40 KB | ✅ |
| Ch 17 | [[Flask Mega-Tutorial/Ch17_Deployment_on_Linux\|Deployment on Linux]] | 31 KB | ✅ |
| Ch 18 | [[Flask Mega-Tutorial/Ch18_Deployment_on_Heroku\|Deployment on Heroku]] | 22 KB | ✅ |
| Ch 19 | [[Flask Mega-Tutorial/Ch19_Deployment_on_Docker_Containers\|Deployment on Docker Containers]] | 29 KB | ✅ |
| Ch 20 | [[Flask Mega-Tutorial/Ch20_Some_JavaScript_Magic\|Some JavaScript Magic]] | 20 KB | ✅ |
| Ch 21 | [[Flask Mega-Tutorial/Ch21_User_Notifications\|User Notifications]] | 31 KB | ✅ |
| Ch 22 | [[Flask Mega-Tutorial/Ch22_Background_Jobs\|Background Jobs]] | 46 KB | ✅ |
| Ch 23 | [[Flask Mega-Tutorial/Ch23_Application_Programming_Interfaces\|Application Programming Interfaces (APIs)]] | 59 KB | ✅ |

---

# Part I: Hello, World!
 
## 1. 环境搭建

### 安装 Python
```bash
$ python3
Python 3.12.0 (main, Oct  5 2023, 10:46:39) [GCC 11.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

### 创建虚拟环境
```bash
$ mkdir microblog
$ cd microblog
$ python3 -m venv venv
```

激活虚拟环境：
```bash
# Linux/Mac
$ source venv/bin/activate

# Windows 命令提示符
$ venv\Scripts\activate

# Windows PowerShell
$ venv\Scripts\Activate.ps1
```

### 安装 Flask
```bash
(venv) $ pip install flask
```

> 默认安装最新 Flask 3.x。如需 Flask 2.x：
> ```bash
> (venv) $ pip install "flask<3" "werkzeug<3"
> ```

---

## 2. Flask 项目结构

```
microblog/
  venv/
  app/              ← 应用包
    __init__.py     ← 初始化 Flask 实例
    routes.py       ← 路由定义
  microblog.py      ← 入口文件
```

### app/\_\_init\_\_.py
```python
from flask import Flask

app = Flask(__name__)      # 创建 Flask 应用实例

from app import routes     # 导入路由（放底部避免循环导入）
```

### app/routes.py
```python
from app import app

@app.route('/')           # 装饰器：将 URL 映射到视图函数
@app.route('/index')
def index():
    return "Hello, World!"
```

### microblog.py（入口文件）
```python
from app import app
```

---

## 3. 运行应用

```bash
(venv) $ export FLASK_APP=microblog.py   # 告诉 Flask 入口在哪
(venv) $ flask run

 * Serving Flask app 'microblog.py'
 * Running on http://127.0.0.1:5000/
```

> Windows 用 `set` 代替 `export`

在浏览器打开：`http://localhost:5000/` 或 `http://localhost:5000/index`

**修改端口**（如果 5000 被占用）：
```bash
(venv) $ flask run --port 5001
```

### 使用 .flaskenv 自动设置环境变量

```
(venv) $ pip install python-dotenv
```

创建 *.flaskenv* 文件：
```
FLASK_APP=microblog.py
```

之后每次运行 `flask run` 就不需要手动 export 了。

---

## 4. 核心概念速记

| 概念 | 说明 |
|------|------|
| **Flask 应用实例** | `app = Flask(__name__)`，整个应用的核心对象 |
| **路由 (Route)** | `@app.route('/path')` 装饰器，将 URL 绑定到视图函数 |
| **视图函数 (View Function)** | 处理请求并返回响应的 Python 函数 |
| **装饰器 (Decorator)** | Python 特性，`@app.route` 将函数注册为 URL 回调 |
| **虚拟环境 (venv)** | 隔离的项目 Python 环境，避免包版本冲突 |
| **循环导入** | `app/routes.py` 需要 import `app`，`__init__.py` 把 routes 放底部解决 |

---


> **下一篇**: [[Part II: Templates]] - 学习 Jinja2 模板引擎，渲染 HTML 页面
