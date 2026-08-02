# Day 2 — 常见的 Linux 命令

---

## 一、Linux 系统基础配置

### 1.1 主机名配置
- 规范格式：`主机名.域名`
- 示例：`node1.itcast.cn`

### 1.2 静态 IP 地址配置
- 动态 IP（DHCP）弊端
  - 服务器重启后 IP 随机变化
  - 远程连接中断、服务无法稳定访问
- 静态 IP 必要性
  - 生产环境服务器必须固定 IP
  - 避免 IP 变更导致业务服务失效
- 配置方式：可视化图形界面配置静态 IP

---

## 二、远程连接工具安装

1. 远程工具使用意义
2. 工具选型：Xshell/XMAX 远程连接工具
3. 实操步骤：安装远程工具 → 基于协议连接 Linux 远端服务器

**安装 openssh-server**

```bash
# Ubuntu
sudo apt update
sudo apt install openssh-server -y

# CentOS
sudo dnf install openssh-server -y
```

**启动**

```bash
# Ubuntu
sudo systemctl start ssh
sudo systemctl enable ssh

# CentOS
sudo systemctl start sshd
sudo systemctl enable sshd
```

**查看状态**

```bash
# Ubuntu
sudo systemctl status ssh

# CentOS
sudo systemctl status sshd
```

**放行防火墙**

```bash
# Ubuntu
sudo ufw allow 22/tcp
```

---

## 三、开关机命令

### 3.1 重启
- `reboot [-f]`：直接立即重启，`-f` 强制重启
- 权限限制：仅 root 可执行

### 3.2 定时关机/重启
- 立即关机：`shutdown -h now` 或 `shutdown -h 0`
- 延迟 N 分钟关机：`shutdown -h N`
- 立即重启：`shutdown -r now` 或 `shutdown -r 0`
- 延迟 N 分钟重启：`shutdown -r N`

---

## 四、Linux 核心目录体系

唯一根目录 `/`，树形层级结构，无 Windows 盘符概念。

| 目录      | 作用说明                |
| --------- | ----------------------- |
| `/root`   | root 超级管理员专属家目录 |
| `/home`   | 所有普通用户默认家目录根路径 |
| `/bin`    | 基础系统命令存储目录       |
| `/sbin`   | 高级管理员权限命令目录     |
| `/opt`    | 第三方应用软件推荐安装目录  |
| `/usr`    | 系统预装软件默认存放目录   |
| `/dev`    | 硬件设备挂载信息目录       |
| `/etc`    | 全局系统配置文件存放目录   |
| `/tmp`    | 系统全局临时文件目录       |

---

## 五、目录操作命令

### 5.1 pwd / ls
- `pwd`：打印当前绝对路径
- `ls [选项] [目标路径]`
  - `-a`：显示全部文件（含隐藏文件 `.` 开头）
  - `-l`：列表展示详细属性
  - `-h`：人性化单位展示大小（搭配 `-l`）
- 简化别名：`ll` = `ls -l`

### 5.2 cd 目录切换

**路径分类**
- 绝对路径：从根目录 `/` 开始的完整路径
- 相对路径：`.` 当前目录，`../` 上一级父目录

**快捷跳转**
- `cd` 或 `cd ~`：回到当前用户家目录
- `cd -`：返回上一次访问的目录

### 5.3 tree 目录树
```bash
tree [指定路径]
# 系统默认不自带，需安装
dnf -y install tree
```

### 5.4 mkdir 创建目录
```bash
mkdir a b c              # 创建多个目录
mkdir -p 一级/二级/三级    # 递归多级创建
mkdir -pv 展示创建的过程    # 可视化创建过程
mkdir -m 777 test        # 指定权限创建
mkdir -p family/parents/{dad,mon}  # 括号展开创建
```

### 5.5 rmdir / rm
```bash
rmdir 空目录名            # 仅删除完全为空的文件夹
rm -rf 目录名             # 递归删除 + 强制执行（慎用）
```

---

## 六、文件操作命令

1. 创建空文件：`touch 文件名`
2. 复制：`cp 源文件 目标位置`
3. 移动/重命名：`mv 源 目标`
4. 删除：`rm 文件`
5. 查找：`find`
6. 上传下载：XMAX 远程工具配套实现

---

## 七、文件上传下载 scp

```bash
# 上传：本地 → 远程
scp -r 本地路径 用户名@远程IP:远程路径

# 下载：远程 → 本地
scp -r 用户名@远程IP:远程路径 本地路径
```

---

## 八、文件查找 find

### 按名称查找（递归）
```bash
find ./ -name '*.json'
```

### 按大小查找
```bash
# 查找大于 23M 的普通文件、文件夹、链接
find ./ -size +23M -type f -o -type d -o -type l
```

### 按修改时间查找
```bash
find ./ -name '*.json' -size +23M -type f -mtime +2
```

### 查找后执行命令 -exec
```bash
# 找到 temp 目录直接删除
find -type d -name "temp" -exec rm -rf {} \;
```

---

## 九、文本搜索 grep

grep 用于从文件或命令输出中筛选包含指定关键词的行。

```bash
grep [参数] "关键词" 文件名
命令 | grep [参数] "关键词"
```

### 常用参数

| 参数 | 作用             | 示例                                      |
| ---- | -------------- | --------------------------------------- |
| `-i` | 忽略大小写          | `grep -i "error" log.txt`              |
| `-n` | 显示行号            | `grep -n "Port" /etc/ssh/sshd_config`  |
| `-v` | 反向匹配（排除）       | `ps -ef \| grep ssh \| grep -v grep`   |
| `-c` | 统计匹配行数          | `grep -c "warn" log.txt`               |
| `-r` | 递归搜索目录下所有文件     | `grep -r "Port" /etc/ssh/`             |
| `-A n` | 匹配行 + 后 n 行（After） | `grep -A 3 "error" log.txt`          |
| `-B n` | 匹配行 + 前 n 行（Before）| `grep -B 3 "error" log.txt`          |
| `-C n` | 前后各 n 行            | `grep -C 3 "error" app.log`           |
| `-E` | 多关键词匹配（或）       | `grep -E "error\|warn\|fail" log.txt` |

### 正则基础

```bash
# 行首匹配：以关键词开头
grep "^Port" /etc/ssh/sshd_config

# 行尾匹配：以关键词结尾
grep "bash$" /etc/passwd
```

### ps | grep 搜到自身的解决办法

grep 本身也是进程，`ps -ef | grep ssh` 会搜到 grep 自己。

```bash
# 写法1：正则规避
ps -ef | grep [s]sh

# 写法2：反向过滤 grep 自身
ps -ef | grep ssh | grep -v grep
```

### 实用组合

```bash
# 查看是否存在某进程
ps -ef | grep [s]shd

# 查找配置文件有效配置（排除注释和空行）
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"

# 搜索日志错误并查看上下文
grep -C 5 "Exception" app.log

# 统计报错次数
grep -c "error" app.log
```

---

## 十、命令查找 which

which 查找命令的真实安装路径（绝对路径），只搜索 PATH 环境变量中的目录。

### 基本用法

```bash
which ssh        # /usr/bin/ssh
which python
which vim
```

### 查找所有同名命令 -a

默认只显示第一个匹配，`-a` 显示系统中所有同名命令：

```bash
which -a python
which -a node
which -a java
```

### 注意事项

- **shell 内置命令找不到是正常的**：`cd`、`pwd`、`exit`、`umask`、`history` 是 shell 自带的，不是外部程序，`which cd` 无输出属于正常
- 别名（如 `ll`、`la`）也查不到

### which / whereis / find 区别

| 命令      | 搜索范围                  | 速度  |
| --------- | ----------------------- | ----- |
| `which`   | 只找可执行命令（PATH）        | 最快  |
| `whereis` | 命令 + 帮助文档 + 源码位置    | 中等  |
| `find`    | 全盘搜索任意文件              | 最慢  |

```bash
which ssh
whereis ssh
find / -name "ssh" 2>/dev/null
```

---

## 十一、链接 ln

### 硬链接
```bash
ln 源文件 目标文件
```
- 两个文件同步同一份数据，相当于动态备份
- 删除其中一个，另一个仍可访问

### 软链接（符号链接）
```bash
ln -s 源目录/文件 目标路径
```
- 目录层级很深时创建快捷方式
- 类似 Windows 的快捷方式

---

## 十二、打包压缩 tar

### 参数速查

| 参数   | 作用         | 说明                       |
| ------ | ---------- | -------------------------- |
| `-c`  | create     | 创建全新归档打包文件            |
| `-x`  | extract    | 解压、提取归档内文件            |
| `-t`  | list       | 预览归档内部文件列表（不解压）    |
| `-f`  | file       | 指定归档文件名，**必须放最后一位** |
| `-v`  | verbose    | 可视化输出，调试用；脚本中建议关闭 |
| `-z`  | gzip       | 归档后缀 `.tar.gz`           |
| `-j`  | bzip2      | 归档后缀 `.tar.bz2`          |
| `-J`  | xz         | 归档后缀 `.tar.xz`           |
| `-C`  | directory  | 指定解压/打包的目标目录          |
| `-p`  | permissions| 保留原始权限和所属用户组          |
| `-P`  | absolute   | 支持绝对路径打包（日常慎用）      |
| `--exclude` | —    | 打包时排除指定文件或文件夹       |

### 打包不压缩
```bash
tar -cvf archive.tar *.txt
```

### 打包 + gzip 压缩
```bash
tar -zcvf archive.tar.gz *.txt
```

### 解压到指定目录
```bash
tar -xvf archive.tar.gz -C ./
```

---

## 十三、zip 格式

### 解压
```bash
# 安装 unzip
sudo apt update && sudo apt install unzip -y

# 解压到当前目录
unzip html_template.zip

# 解压到指定文件夹
unzip html_template.zip -d ./temp
```

### 压缩
```bash
# 打包单个/多个文件
zip test.zip file.txt original_file.txt

# 打包整个目录
zip -r all_folder.zip all_folder
```

---

## 速查表

### grep 常用组合
```
grep -i "关键词" 文件        # 忽略大小写
grep -n "关键词" 文件        # 显示行号
grep -v "关键词" 文件        # 反向排除
grep -C 3 "关键词" 文件      # 前后各3行上下文
ps -ef | grep [s]sh         # 查进程（避免搜到自身）
grep -v "^#" 文件 | grep -v "^$"  # 排除注释和空行
```

### tar 常用组合
```
tar -cvf  archive.tar     文件/目录     # 打包不压缩
tar -zcvf archive.tar.gz  文件/目录     # 打包+gzip
tar -jcvf archive.tar.bz2 文件/目录     # 打包+bzip2
tar -xvf  archive.tar.gz -C 目录       # 解压到指定目录
tar -tvf  archive.tar.gz              # 预览内容不解压
```

---

## 十四、Vim 编辑器

### 工作模式切换

| 当前模式 | 操作 | 目标模式 |
| ------- | ---- | ------- |
| 打开文件 `vi filename` | 直接进入 | 命令模式 |
| 命令模式 | `i` / `a` / `o` | 输入模式 |
| 命令模式 | `:` | 底线命令模式 |
| 输入模式 / 底线命令模式 | 按 `ESC` | 命令模式 |
| 底线命令模式 | 指令回车执行完毕 | 自动回到命令模式 |

### 命令模式快捷键

| 快捷键 | 功能说明 |
| ------- | ------- |
| `gg` | 跳转至文件开头 |
| `G` | 跳转至文件末尾 |
| `yy` | 复制当前整行 |
| `nyy` | 向下连续复制 n 行 |
| `dd` | 删除当前整行 |
| `ndd` | 向下连续删除 n 行 |
| `p` | 粘贴内容 |
| `Shift+Z+Z` | 保存并退出 |
| `/内容` | 向下搜索指定内容 |
| `u` | 撤销操作 |
| `Ctrl+r` | 反撤销 |
| `i` | 在光标当前位置插入内容 |
| `o` | 在当前行下方新建一行并插入 |

### 底线命令模式

| 指令 | 功能说明 |
| ---- | ------- |
| `:q` | 退出，不保存 |
| `:q!` | 强制退出，不保存修改 |
| `:wq` | 保存修改后退出 |
| `:wq!` | 强制保存并退出 |
| `:set nu` | 开启显示行号 |
| `:set nonu` | 关闭行号显示 |
| `:noh` / `:nohl` | 取消搜索高亮 |
| `:%s/旧内容/新内容/gc` | 全文替换，逐项确认 |
