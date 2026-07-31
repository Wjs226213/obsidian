## 一、Linux系统基础配置
### 1.1 主机名配置
- 规范格式：`主机名.域名`
- 示例：`node1.itcast.cn`

### 1.2 静态IP地址配置
- 动态IP（DHCP）弊端
  - 服务器重启后IP随机变化
  - 远程连接中断、服务无法稳定访问
- 静态IP必要性
  - 生产环境服务器必须固定IP
  - 避免IP变更导致业务服务失效
- 配置方式：可视化图形界面配置静态IP

---
## 二、远程连接工具安装
1. 远程工具使用意义
2. 工具选型：Xshell/XMAX远程连接工具
3. 实操步骤：安装远程工具 → 基于协议连接Linux远端服务器

*首先是安装*
``` 
sudo apt update
sudo apt install openssh-server -y  # ubuntu

sudo dnf installl openssh-server -y # centos

```

*启动远程连接*
```
# ubuntu
sudo systemctl start ssh
sudo systemctl enable ssh

# centos
sudo systemctl start sshd
sudo systemctl enable sshd
```

*查看状态*
```
# ubuntu
sudo systemctl status ssh

#centos
sudo systemctl status sshd
```

*放行防火墙
```
#ubuntu
sudu ufw allow 22/tcp
```


---
## 三、Linux基础系统开关机命令
### 3.1 重启命令
- `reboot [-f]`
  - 直接立即重启
  - `-f`：强制重启
  - 权限限制：仅root管理员可执行

### 3.2 关机&重启定时命令
- 关机
  - 立即关机：`shutdown -h now` / `shutdown -h 0`
  - 延迟N分钟关机：`shutdown -h N`
- 重启
  - 立即重启：`shutdown -r now` / `shutdown -r 0`
  - 延迟N分钟重启：`shutdown -r N`

---
## 四、Linux核心目录体系
### 4.1 目录整体结构
- 唯一根目录 `/`，树形层级结构，无Windows盘符概念

### 4.2 系统核心一级目录
| 目录      | 作用说明           |
| ------- | -------------- |
| `/root` | root超级管理员专属家目录 |
| `/home` | 所有普通用户默认家目录根路径 |
| `/bin`  | 基础系统命令存储目录     |
| `/sbin` | 高级管理员权限命令目录    |
| `/opt`  | 第三方应用软件推荐安装目录  |
| `/usr`  | 系统预装软件默认存放目录   |
| `/dev`  | 硬件设备挂载信息目录     |
| `/etc`  | 全局系统配置文件存放目录   |
| `/tmp`  | 系统全局临时文件目录     |

---
## 五、目录层级操作核心命令
### 5.1 基础定位查看
1. `pwd`
   - 功能：打印当前终端所在绝对路径

2. `ls` 目录内容查看
   - 基础语法：`ls [选项] [目标路径]`
   - 常用参数
     - `-a`：显示全部文件，包含隐藏文件（`.`开头）
     - `-l`：列表展示文件详细属性
     - `-h`：人性化单位展示文件大小（搭配 `-l`）
   - 简化别名：`ll` = `ls -l`

### 5.2 目录切换 `cd`
#### 路径分类
1. 绝对路径
   - 从根目录 `/` 开始的完整路径，任意位置均可精准跳转
2. 相对路径
   - `.`：当前所在目录
   - `../`：上一级父目录
   - 向上多级跳转需重复书写 `../`

#### 特殊快捷跳转
- `cd` / `cd ~`：直接回到当前登录用户家目录
- `cd -`：快速返回上一次访问的目录

### 5.3 目录树展示 `tree`
- 语法：`tree [指定路径]`
- 依赖安装：`dnf -y install tree`（系统默认不自带）

### 5.4 目录创建与删除
1. 创建目录 `mkdir`
   - 基础创建：`mkdir a b c 创建多个目录`
   - 递归多级创建：`mkdir -p 一级/二级/三级`
   - 版本创建 :`mkdir -pv 展示创建的过程`
   - 权限创建 : `mkdir -m 777 test`
   - 使用括号包含 `mkdir -p family/parents/{dad,mon}`
     
2. 删除空目录 `rmdir`
   - 语法：`rmdir 空目录名`
   - 限制：仅可删除**完全为空**的文件夹

### 5.5删除有数据的目录

```
rm -rf 同时完成递归删除和强制执行
```

---
## 六、文件层级操作核心命令
1. 创建空文件：`touch 文件名`
2. 复制操作：`cp 源文件 目标位置`
3. 移动/重命名：`mv 源 目标`
4. 文件删除：`rm 文件`
5. 文件查找：`find`
6. 上传下载：远程XMAX配套工具实现

---
## 7. 文件的上传和下载

*scp 上传*
```
scp -r 本地路径 用户名@远程IP:远程路径
```

*scp 下载*
```
scp -r 用户名@远程IP:远程路径 本地路径
```

## 8. 文件的查找find

*-name : 名称查找(具有递归的性质* 
```
find ./ -name '*.json'
```

*-size : 大小查找*
```
#查找大于23M的普通文件 文件夹 链接
find ./ -size +23M -type f d l

```

*-mtime: 根据文件修改的时间来查找*
```
find ./ -name '*.json' -size +23M -type f -mtime +2
```

*-exec：查找后执行后接的命令*
```
find -exec{} 查找到某些文件后完成执行其他的命令

# 找到目标直接删除
find  -type d -name "temp" -exec rm -rf {} \;
```

## grep 学习笔记

**grep = 文本搜索工具**

作用：从文件、命令输出中 **筛选出包含指定关键词的行**。

核心场景：查日志、查配置、查进程、筛选输出。

语法：

```Plain
grep [参数] "关键词" 文件名
命令 | grep [参数] "关键词"
```

## 二、最常用 6 个参数（必会）

### 1. -i 忽略大小写

不区分大小写匹配

```Plain
grep -i "error" log.txt
```

### 2. -n 显示行号

查看匹配内容在文件第几行

```Plain
grep -n "Port" /etc/ssh/sshd_config
```

### 3. -v 反向匹配（排除）

显示 **不包含** 关键词的行

```Plain
# 过滤掉grep自身进程
ps -ef | grep ssh | grep -v grep
```

### 4. -c 只统计匹配行数

```Plain
grep -c "warn" log.txt
```

### 5. -r 递归搜索文件夹

查找目录下所有文件包含某关键词

```Plain
grep -r "Port" /etc/ssh/
```

### 6. -A -B -C 上下文查看（查日志神器）

- **-A n**：匹配行 + 后面n行（After）
    
- **-B n**：匹配行 + 前面n行（Before）
    
- **-C n**：前后各n行
    

```Plain
grep -C 3 "error" app.log
```

---

## 三、解决你刚才遇到的经典问题

### 问题：ps | grep 总会搜到自己

```Plain
wjs  1518 1406 0 grep --color=auto ssh
```

原因：grep 本身也是一个进程，会被自己搜到。

**两种正确写法（生产常用）**

```Plain
# 写法1：正则规避（最优雅）
ps -ef | grep [s]sh

# 写法2：反向过滤grep自身
ps -ef | grep ssh | grep -v grep
```

---

## 四、grep 正则基础（够用90%场景）

### 1. ^ 行首匹配

只匹配**以关键词开头**的行

```Plain
grep "^Port" /etc/ssh/sshd_config
```

### 2. $ 行尾匹配

只匹配**以关键词结尾**的行

```Plain
grep "bash$" /etc/passwd
```

### 3. -E 多关键词匹配（或）

```Plain
grep -E "error|warn|fail" log.txt
```

---

## 五、工作高频实战命令（直接抄）

**1. 查看是否存在某进程**

```Plain
ps -ef | grep [s]shd
```

**2. 查找配置文件有效配置（排除注释、空行）**

```Plain
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

**3. 搜索日志错误并查看上下文**

```Plain
grep -C 5 "Exception" app.log
```

**4. 统计报错次数**

```Plain
grep -c "error" app.log
```

---

## 六、grep 速记口诀

- **-i** 忽略大小写
    
- **-n** 显示行号
    
- **-v** 反向过滤
    
- **-r** 递归查找
    
- **-C** 查看上下文
    
- **[s]关键词** 过滤自身进程
    

---

## 七、新手常见误区

1. **不要直接 grep ssh** 查进程，会自带 grep 垃圾进程

2. 配置文件大量 # 注释，用 **grep -v "^#"** 清理

3. 查日志一定要带**-A / -B / -C**，否则看不出上下文原因



