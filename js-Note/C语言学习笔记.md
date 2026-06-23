# C语言学习笔记

## 运行流程

**编写 → 编译 → 连接 → 运行**

```c
#include <stdio.h>  // 预处理
int main() {
    printf("Hello World");
    return 0;
}
```
## 基本语法

### 关键字
特殊含义的英文字符，全部都是小写的。

### 常量
程序执行的过程中值不会发生改变的数据。数据是数值不是计算过程。

**常量类型：**
- 整型常量
- 实型常量
- 字符常量：单引号起来的字母数字和英文符号，只能有一个
- 字符串常量：双引号起来的字符串常量

### 输出格式说明符
| 数据类型 | 格式说明符 |
|----------|------------|
| 整型     | %d         |
| 实数     | %f         |
| 字符串   | %s         |
| 字符     | %c         |

### 变量
发生改变的数据可以定义为变量，变量不可以重复定义，一条语句可以定义多个变量。

**使用条件**：先赋值，再使用。

---

## 进制系统

### 进制表示法
- 二进制：`0b`开头（如 `0b1010`）
- 八进制：`0`开头（如 `0123`）
- 十六进制：`0x`开头（如 `0x1A`）

### 进制转换原理

#### 任意进制 → 十进制
**公式**：系数 × 基数的权次幂，最后相加

- **系数**：任意进制的当前位置的数值
- **基数**：进制位
- **权次幂**：从右往左从0开始的位置

#### 十进制 → 其他进制
**除基取余法**：对当前的数字不断地除以目标进制基数，得到的余数从下往上排列就是目标进制数字。

# 数据类型和运算符

## 数据类型

> **提示**：`sizeof` 函数用来确定数据类型的大小。

### 基本数据类型内存占用
| 数据类型 | 内存大小（字节） |
|----------|------------------|
| short    | 2                |
| int      | 4                |
| long     | 4 - 8            |
| long long| 8                |
| float    | 4                |
| double   | 8                |

### 整数类型

> **提示**：
> - 整数类型默认是 `int` 类型
> - 数据类型的作用是能够存储不同类型的数据
> - 每个数据类型大小都不相同

#### 基本变量定义
```c
#include <stdio.h>
int main()
{
    int a = 1234123;
    int b = sizeof(a);  // 获取数据类型的大小
    printf("b = %d", b);
    return 0;
}
```

#### 完整数据类型形态
```c
#include <stdio.h>
int main()
{
    short int a = 1234123;  // 短整型
    long int t = 234;       // 长整型
    int b = sizeof(a);
    printf("b = %d", b);
    return 0;
}
```

#### 有符号和无符号类型
```c
#include <stdio.h>
int main()
{
    signed int a = 1234123;    // 有符号整数
    unsigned int b = 222;      // 无符号整数
    printf("u = %u", b);       // 无符号类型输出使用 %u
    return 0;
}
```

### 小数类型
小数的取值范围要比整数的取值范围要大。

> **注意**：`unsigned` 不可以和整数类型以外的数据类型组合。

```c
#include <stdio.h>
int main() {
    float a = 3.14F;
    return 0;
}
```

### 字符类型
`char` 类型占用一个字节。

### 标识符和键盘录入

#### 标识符规则
> **提示**：标识符是代码中自己起的名称，用来命名变量。
> - 不能使用数字开头
> - 不可以是关键字
> - 区分大小写
> - 由数字、字母、下划线组成

---

#### 基本键盘录入
```c
#include <stdio.h>
int main() {
    int a;
    scanf("%d", &a);
    printf("a = %d", a);
    return 0;
}
```

---

#### 键盘录入细节

**示例1：混合输入**
```c
#include <stdio.h>

int main() {
    int age;
    char str[10];  // 字符串数组

    printf("请输入年龄：");  // 建议加上提示，用户体验更好
    scanf("%d", &age);

    printf("请输入字符串：");
    scanf("%s", str);  // 注意：字符串不需要 & 符号

    printf("年龄：%d\n", age);
    printf("字符串：%s\n", str);

    return 0;
}
```

**示例2：多个数值输入**
```c
#include <stdio.h>

int main() {
    int a;
    int b;
    scanf("%d %d", &a, &b);  // 输入数据时必须和双引号内容格式一致
    printf("a = %d, b = %d", a, b);
    return 0;
}
```

### 运算符

> **提示**：
> - 小数计算是不精确的
> - 所有的非零数字都表示真（true）

#### 除法运算
```c
#include <stdio.h>
int main() {
    int a = 10;
    int b = 2;
    printf("%d", 10 / 2);
    return 0;
}
```

#### 取余运算（必须全部是整数）
```c
#include <stdio.h>
int main() {
    printf("%d", 10 % 3);
    return 0;
}
```

#### 运算符应用示例：提取数字各位
```c
#include <stdio.h>
int main() {
    int a = 1234;
    // 获取每一位数字：
    // 个位：a % 10
    // 十位：a / 10 % 10
    // 百位：a / 100 % 10
    // 千位：a / 1000 % 10
    printf("个位：%d\n", a % 10);
    printf("十位：%d\n", a / 10 % 10);
    printf("百位：%d\n", a / 100 % 10);
    printf("千位：%d\n", a / 1000 % 10);
    return 0;
}
```

### 数据类型转换

> **提示**：
> - 根据数据类型的大小关系，数据类型小的与数据类型大的结合会让结果变成其中大的数据类型
> - `short`、`char` 类型完成运算的时候会先提升为 `int` 数据类型完成运算

```c
#include <stdio.h>
int main() {
    int a = 1234;
    short s1 = 10;
    short s2 = 24;
    short result = (short)(s1 + s2);  // 强制类型转换
    printf("size = %d", sizeof(result));
    return 0;
}
```
# 高级运算符

## 自增自减运算

### 运算符类型
| 运算符 | 名称     | 说明                     |
|--------|----------|--------------------------|
| `++a`  | 先自增   | 先加1，再使用            |
| `--a`  | 先自减   | 先减1，再使用            |
| `a++`  | 后自增   | 先使用，再加1            |
| `a--`  | 后自减   | 先使用，再减1            |

---

> **提示：先加后用**
> 表示先对原始变量完成+1的操作，然后使用增加后的变量。

> **提示：先用后加**
> 表示先使用原始变量，然后将增加的数据给到原始变量中。

### Windows平台机制
**前缀运算优先于后缀**：先统一完成自增自减运算，再把结果拿出来运算。后缀统一先用等表达式的变量，用完了再进行自增自减。

```c
#include <stdio.h>
int main() {
    int a = 10;
    int k1 = a++ + a++ + a;   // 10 + 10 + 10 = 30, a = 12
    int k2 = ++a + ++a + a;   // 14 + 14 + 14 = 42, a = 14
    int k3 = ++a + a++ + a;   // 15 + 15 + 15 = 45, a = 16
    int k4 = a++ + ++a + a;   // 17 + 17 + 17 = 51, a = 18
    return 0;
}
```

### macOS/Linux平台机制
在Linux和macOS中，前缀和后缀的优先级是一样的，并且每一个前缀和后缀都是一个独立的个体。

```c
#include <stdio.h>
int main() {
    int i = 10;
    int j = 5;
    int k = i++ + ++i - --j - i--;
    printf("%d", k);
    return 0;
}
```

## 关系运算符
- `0` 表示 false（假）
- `1` 表示 true（真）

| 运算符 | 说明         |
|--------|--------------|
| `==`   | 等于         |
| `!=`   | 不等于       |
| `>`    | 大于         |
| `>=`   | 大于等于     |
| `<`    | 小于         |
| `<=`   | 小于等于     |

## 逻辑运算符

| 运算符 | 名称     | 说明                     |
|--------|----------|--------------------------|
| `&&`   | 逻辑与   | 同时满足                 |
| `\|\|` | 逻辑或   | 一个满足就是真           |
| `!`    | 逻辑非   | 将结果取反               |

### 逻辑运算符应用示例
```c
#include <stdio.h>
int main() {
    // 要求：数字中不可以有7，且不是7的倍数
    int a;
    scanf("%d", &a);
    int ge = a % 10;        // 个位
    int shi = a / 10 % 10;  // 十位
    printf("%d", (ge != 7 && shi != 7 && a % 7 != 0));
    return 0;
}
```

### 短路效果
当左边的表达式可以确定整个表达式的计算结果时，就直接结束程序。

- **`&&`（逻辑与）**：当出现第一个不满足条件的情况下，整个式子直接结束
- **`\|\|`（逻辑或）**：当出现第一个满足条件的情况下，整个式子直接结束

**示例1：逻辑与短路**
```c
#include <stdio.h>
int main() {
    int a = 1, b = 5;
    a > 0 && ++b;           // a>0为真，继续执行++b
    printf("a = %d, b = %d\n", a, b);  // 输出：a = 1, b = 6
    return 0;
}
```

**示例2：逻辑或短路**
```c
#include <stdio.h>
int main() {
    int a = 1, b = 5;
    a > 0 || ++b;           // a>0为真，短路，不执行++b
    printf("a = %d, b = %d\n", a, b);  // 输出：a = 1, b = 5
    return 0;
}
```

## 三元运算符（条件运算符）

### 比较两个数字的最大值
```c
#include <stdio.h>
int main() {
    int a = 10;
    int b = 20;
    int c = a > b ? a : b;  // 如果a>b成立，取a，否则取b
    printf("max = %d", c);
    return 0;
}
```

### 比较三个数字的最大值
```c
#include <stdio.h>
int main() {
    int a = 10;
    int b = 20;
    int c = 30;
    int temp = a > b ? a : b;        // 先比较a和b
    int final_max = temp > c ? temp : c;  // 再和c比较
    printf("max = %d", final_max);
    return 0;
}
```

## 逗号运算符

> **提示**：
> - 从左往右执行
> - 优先级最低
> - 最后一个子表达式的结果是整个表达式的结果

```c
#include <stdio.h>
int main() {
    int i = 0;
    printf("%d", (i = 3, ++i, i++, i + 5));  // 结果为9
    return 0;
}
```

## 运算符优先级

> **提示**：
> - 小括号优先于所有
> - 一元运算符 > 二元运算符 > 三元运算符
> - `&&` > `\|\|` > 赋值运算符
> - **注意**：判断运算符中 `>=` 的优先级要高于 `!=`

### 优先级题目解析

**题目1：三元运算符嵌套**
> **要点**：从左边的第一个问号开始找冒号，在过程中如果遇到了其他的问号，那么找冒号的次数+1（三元运算符的 `?` 和 `:` 是匹配的）

```c
#include <stdio.h>
int main() {
    int w = 4, x = 3, y = 2, z = 1;
    int number = w < x ? (w) : (z < y ? z : x);
    printf("number = %d", number);  // 输出：3
    return 0;
}
```

**题目2：嵌套三元运算符求最大值**
```c
#include <stdio.h>
int main() {
    int a = 3, b = 2, c = 1;
    int max = a > b ? (a > c ? a : c) : (b > c ? b : c);
    printf("max = %d", max);  // 输出：3
    return 0;
}
```

**题目3：逻辑运算符优先级**
```c
#include <stdio.h>
int main() {
    int a = 3, b = 4, c = 5;
    int num = a || (b + c && b - c);
    printf("num = %d", num);  // 输出：1
    return 0;
}
```

**题目4：复杂逻辑表达式**
```c
#include <stdio.h>
int main() {
    int a = 3, b = 4, c = 5;
    int num = !(((a < b) && !c) || 1);
    // 分析：((3<4) && !5) || 1 = (1 && 0) || 1 = 0 || 1 = 1
    // !1 = 0
    printf("num = %d", num);  // 输出：0
    return 0;
}
```

> **小提示**：确定优先级后对表达式左右完成括号，有助于理解运算顺序。

# 流程控制语句

## IF 条件语句
```c
#include <stdio.h>
int main() {
    float temperature = 37.5;
    if (temperature > 40) {
        printf("体温过高");
    } else {
        printf("体温正常");
    }
    return 0;
}
```

## SWITCH 多分支语句
```c
#include <stdio.h>
int main() {
    int choice = 1;
    switch (choice) {
    case 1:
        printf("选项1");
        break;
    case 2:
        printf("选项2");
        break;
    default:
        printf("默认选项");
        break;
    }
    return 0;
}
```

---

**笔记整理完成**