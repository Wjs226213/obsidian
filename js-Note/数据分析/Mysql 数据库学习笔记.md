# 一、配置阶段（Linux 手动安装 MySQL 8.x）

> 在 Linux 服务器上手动完成 MySQL 的安装和初次配置。

### 1.1 安装 MySQL 8.x

**Ubuntu / Debian：**

```bash
# 更新包索引
sudo apt update

# 安装 MySQL Server
sudo apt install mysql-server -y

# 启动服务并设置开机自启
sudo systemctl start mysql
sudo systemctl enable mysql
```

**CentOS / RHEL：**

```bash
# 添加 MySQL 官方 YUM 源（以 8.x 为例）
sudo rpm -i https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm

# 安装 MySQL Server
sudo yum install mysql-community-server -y

# 启动服务并设置开机自启
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 1.2 获取初始密码并登录

MySQL 8.x 安装后会生成一个临时 root 密码：

```bash
# CentOS：查看临时密码
sudo grep 'temporary password' /var/log/mysqld.log

# Ubuntu：默认 root 用 auth_socket 认证，直接 sudo 登录
sudo mysql
```

### 1.3 修改 root 密码

```sql
-- 登录后执行（先改密码才能做其他操作）
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
```

> 生产环境密码要设复杂点，学习阶段先用 `123456` 方便。

### 1.4 确认存储引擎为 InnoDB

MySQL 8.x 默认就是 InnoDB，一般不需要改：

```sql
-- 查看当前默认存储引擎
SHOW VARIABLES LIKE 'default_storage_engine';
```

### 1.5 测试 MySQL 安装

```bash
# 查看版本号
mysql --version
mysql -V

# 连接数据库
mysql -u root -p
# 输入密码：123456
```

看到版本信息输出，说明安装配置成功。

### 1.6 常用服务管理命令

```bash
# 启动
sudo systemctl start mysql      # Ubuntu
sudo systemctl start mysqld     # CentOS

# 停止
sudo systemctl stop mysql
sudo systemctl stop mysqld

# 查看状态
sudo systemctl status mysql

# 重启
sudo systemctl restart mysql
```

### 数据库连接
```bash
mysql -h127.0.0.1 -P3306 -uroot -p123456
# host
# port
# user
#password
```

---

## 三、DDL 语句 — 操作数据库

### 3.1 查看所有数据库

```sql
SHOW DATABASES;
```

### 3.2 创建数据库

```sql
-- 基础创建
CREATE DATABASE mydb;

-- 如果不存在才创建（推荐）
CREATE DATABASE IF NOT EXISTS mydb;

-- 指定字符集
CREATE DATABASE mydb CHARACTER SET utf8mb4;
```

### 3.3 查看数据库创建信息

```sql
SHOW CREATE DATABASE mydb;
```

### 3.4 修改数据库字符集

```sql
ALTER DATABASE mydb CHARACTER SET utf8mb4;
```

### 3.5 删除数据库

```sql
DROP DATABASE mydb;
DROP DATABASE IF EXISTS mydb;
```

### 3.6 使用/切换数据库

```sql
USE mydb;

-- 查看当前使用的数据库
SELECT DATABASE();
```

---

## 四、DDL 语句 — 操作数据表

### 4.1 查看当前库下所有表

```sql
SHOW TABLES;
```

### 4.2 创建表

```sql
CREATE TABLE student (
    id      INT         PRIMARY KEY AUTO_INCREMENT,
    name    VARCHAR(20) NOT NULL,
    age     INT,
    gender  CHAR(1)     DEFAULT '男',
    score   DOUBLE(5,2)
);
```

### 4.3 查看表结构

```sql
DESC student;
SHOW CREATE TABLE student;
```

### 4.4 删除表

```sql
DROP TABLE student;
DROP TABLE IF EXISTS student;
```

### 4.5 修改表名

```sql
ALTER TABLE student RENAME TO stu;
```

### 4.6 修改表字符集

```sql
ALTER TABLE student CHARACTER SET utf8mb4;
```

---

## 五、MySQL 数据类型

### 5.1 数值类型

| 类型 | 大小 | 说明 |
|------|------|------|
| `TINYINT` | 1 字节 | 小整数（-128 ~ 127） |
| `SMALLINT` | 2 字节 | 短整数 |
| `INT` / `INTEGER` | 4 字节 | 整数 |
| `BIGINT` | 8 字节 | 大整数 |
| `FLOAT` | 4 字节 | 单精度浮点 |
| `DOUBLE` | 8 字节 | 双精度浮点 |
| `DECIMAL(M,D)` | — | 精确小数，M 总位数，D 小数位 |

### 5.2 字符串类型

| 类型 | 说明 |
|------|------|
| `CHAR(N)` | 定长字符串，最多 255 字符，存不满补空格 |
| `VARCHAR(N)` | 变长字符串，按实际长度存，最常用 |
| `TEXT` | 长文本，最大 65535 字节 |
| `BLOB` | 二进制大数据（图片、文件等） |

> `CHAR` 读取快，`VARCHAR` 省空间。一般用户名、手机号用 `CHAR`，文章内容用 `TEXT`。

### 5.3 日期类型

| 类型 | 格式 | 说明 |
|------|------|------|
| `DATE` | `2026-08-01` | 日期 |
| `TIME` | `14:30:00` | 时间 |
| `DATETIME` | `2026-08-01 14:30:00` | 日期+时间（推荐） |
| `TIMESTAMP` | — | 时间戳，自动更新 |

---

## 六、约束

约束用于保证数据的完整性和正确性。

### 6.1 主键约束 PRIMARY KEY

```sql
id INT PRIMARY KEY AUTO_INCREMENT
```

- 每张表只能有一个主键
- 主键值唯一且不能为空
- `AUTO_INCREMENT` 自增，不用手动赋值

### 6.2 非空约束 NOT NULL

```sql
name VARCHAR(20) NOT NULL
```

### 6.3 唯一约束 UNIQUE

```sql
phone VARCHAR(11) UNIQUE
```

### 6.4 默认值约束 DEFAULT

```sql
gender CHAR(1) DEFAULT '男'
```

### 6.5 外键约束 FOREIGN KEY（了解）

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    stu_id  INT,
    FOREIGN KEY (stu_id) REFERENCES student(id)
);
```

- 外键表的字段值必须是主键表中已存在的值
- 删除主键表数据前，要先删外键表关联数据

---

## 七、DDL 语句 — 操作字段

### 7.1 添加字段

```sql
ALTER TABLE student ADD phone VARCHAR(11);
```

### 7.2 修改字段类型

```sql
ALTER TABLE student MODIFY phone CHAR(11);
```

### 7.3 修改字段名和类型

```sql
ALTER TABLE student CHANGE phone tel VARCHAR(11);
```

### 7.4 删除字段

```sql
ALTER TABLE student DROP tel;
```

---

## 速查表

```sql
-- 数据库
SHOW DATABASES;
CREATE DATABASE IF NOT EXISTS mydb;
USE mydb;
DROP DATABASE IF EXISTS mydb;

-- 数据表
SHOW TABLES;
DESC 表名;
CREATE TABLE 表名 (字段定义);
DROP TABLE IF EXISTS 表名;
ALTER TABLE 表名 RENAME TO 新表名;

-- 字段操作
ALTER TABLE 表名 ADD 字段名 类型;
ALTER TABLE 表名 MODIFY 字段名 新类型;
ALTER TABLE 表名 CHANGE 旧字段名 新字段名 新类型;
ALTER TABLE 表名 DROP 字段名;
```