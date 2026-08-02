# MySQL 数据库学习笔记

---

## 一、配置阶段（Linux 手动安装 MySQL 8.x）

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