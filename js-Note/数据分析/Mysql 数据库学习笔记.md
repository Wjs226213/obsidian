# MySQL 数据库学习笔记

---

## 一、配置阶段（手动安装 MySQL 8.x）

> 没有用小皮面板，手动完成 MySQL 的下载和初次配置。

### 1.1 安装 MySQL 8.x

- 下载地址：https://dev.mysql.com/downloads/mysql/
- 选择 **Windows (x86, 64-bit), MSI Installer**
- 安装类型选 **Custom**，手动选择组件：
  - `MySQL Server 8.x`
  - `MySQL Workbench 8.x`（可视化管理工具，可选）
- 安装路径建议不要有中文和空格

### 1.2 配置 root 密码

```
用户名：root
密码：123456
```

> 生产环境不要用这么简单的密码，学习阶段先用着方便。

### 1.3 修改存储引擎为 InnoDB

MySQL 8.x 默认就是 InnoDB，一般不需要改。如果需要确认或修改：

```sql
-- 查看当前默认存储引擎
SHOW VARIABLES LIKE 'default_storage_engine';

-- 临时修改（重启后失效）
SET default_storage_engine = InnoDB;
```

### 1.4 配置环境变量 Path

手动安装不会自动加到 Path，需要手动配置：

1. 找到 MySQL 安装目录下的 `bin` 文件夹
   - 默认路径：`C:\Program Files\MySQL\MySQL Server 8.x\bin`
2. 右键 **此电脑** → **属性** → **高级系统设置** → **环境变量**
3. 在 **系统变量** 中找到 `Path`，编辑，新增 MySQL 的 `bin` 目录路径
4. 确定保存

### 1.5 测试 MySQL 安装

打开新的 CMD 或 PowerShell：

```bash
# 查看版本号（两种写法都行）
mysql --version
mysql -V

# 连接数据库
mysql -u root -p
# 输入密码：123456
```

看到版本信息输出，说明安装配置成功。

### 1.6 常用服务管理命令

```bash
# 启动 MySQL 服务
net start mysql80

# 停止 MySQL 服务
net stop mysql80

# 查看 MySQL 服务状态
sc query mysql80
```

---

## 二、