# C语言学习笔记

---

## 一、C语言基础

### 1.1 运行流程
**编写 → 编译 → 连接 → 运行**

```c
#include <stdio.h>  // 预处理
int main() {
    printf("Hello World");
    return 0;
}
```

---

### 1.2 基本语法

#### 关键字
> **定义**：特殊含义的英文字符，全部都是小写的。

#### 常量
> **定义**：程序执行的过程中值不会发生改变的数据。数据是数值不是计算过程。

**常量类型：**
- **整型常量**：整数
- **实型常量**：小数
- **字符常量**：单引号起来的字母数字和英文符号，只能有一个
- **字符串常量**：双引号起来的字符串常量

#### 输出格式说明符
| 数据类型 | 格式说明符 | 说明 |
|----------|------------|------|
| 整型     | `%d`       | 十进制整数 |
| 实数     | `%f`       | 浮点数 |
| 字符串   | `%s`       | 字符串 |
| 字符     | `%c`       | 单个字符 |

#### 变量
> **定义**：发生改变的数据可以定义为变量。

**使用规则：**
- 变量不可以重复定义
- 一条语句可以定义多个变量
- **先赋值，再使用**（必须遵守）

---

## 二、进制系统

### 2.1 进制表示法
| 进制 | 前缀 | 示例 |
|------|------|------|
| 二进制 | `0b` | `0b1010` |
| 八进制 | `0`  | `0123` |
| 十六进制 | `0x` | `0x1A` |

### 2.2 进制转换原理

#### 任意进制 → 十进制
**公式**：系数 × 基数的权次幂，最后相加

> **术语解释：**
> - **系数**：任意进制的当前位置的数值
> - **基数**：进制位
> - **权次幂**：从右往左从0开始的位置

#### 十进制 → 其他进制
**除基取余法**：对当前的数字不断地除以目标进制基数，得到的余数从下往上排列就是目标进制数字。

---

## 三、数据类型和运算符

### 3.1 数据类型

> [!tip] 提示
> `sizeof` 函数用来确定数据类型的大小。

#### 基本数据类型内存占用
| 数据类型        | 内存大小（字节） | 说明        |
| ----------- | -------- | --------- |
| `short`     | 2        | 短整型       |
| `int`       | 4        | 整型        |
| `long`      | 4 - 8    | 长整型（平台相关） |
| `long long` | 8        | 长长整型      |
| `float`     | 4        | 单精度浮点数    |
| `double`    | 8        | 双精度浮点数    |

#### 整数类型

> [!note] 重要特性
> - 整数类型默认是 `int` 类型
> - 数据类型的作用是能够存储不同类型的数据
> - 每个数据类型大小都不相同

**基本变量定义示例：**
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

**完整数据类型形态：**
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

**有符号和无符号类型：**
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

#### 小数类型
> [!note] 注意
> 小数的取值范围要比整数的取值范围要大。
> `unsigned` 不可以和整数类型以外的数据类型组合。

```c
#include <stdio.h>
int main() {
    float a = 3.14F;
    return 0;
}
```

#### 字符类型
`char` 类型占用一个字节。

---

### 3.2 标识符和键盘录入

#### 标识符规则
> [!tip] 标识符定义
> 标识符是代码中自己起的名称，用来命名变量。

**命名规则：**
1. 不能使用数字开头
2. 不可以是关键字
3. 区分大小写
4. 由数字、字母、下划线组成

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

---

### 3.3 运算符

> [!tip] 运算特性
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

---

### 3.4 数据类型转换

> [!tip] 类型转换规则
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

---

## 四、高级运算符

### 4.1 自增自减运算

#### 运算符类型
| 运算符 | 名称     | 说明                     |
|--------|----------|--------------------------|
| `++a`  | 先自增   | 先加1，再使用            |
| `--a`  | 先自减   | 先减1，再使用            |
| `a++`  | 后自增   | 先使用，再加1            |
| `a--`  | 后自减   | 先使用，再减1            |

> [!note] 先加后用
> 表示先对原始变量完成+1的操作，然后使用增加后的变量。

> [!note] 先用后加
> 表示先使用原始变量，然后将增加的数据给到原始变量中。

---

#### Windows平台机制
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

#### macOS/Linux平台机制
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

---

### 4.2 关系运算符
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

---

### 4.3 逻辑运算符

| 运算符 | 名称     | 说明                     |
|--------|----------|--------------------------|
| `&&`   | 逻辑与   | 同时满足                 |
| `\|\|` | 逻辑或   | 一个满足就是真           |
| `!`    | 逻辑非   | 将结果取反               |

#### 逻辑运算符应用示例
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

#### 短路效果
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

---

### 4.4 三元运算符（条件运算符）

#### 比较两个数字的最大值
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

#### 比较三个数字的最大值
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

---

### 4.5 逗号运算符

> [!tip] 特性
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

---

### 4.6 运算符优先级

> [!tip] 优先级规则
> - 小括号优先于所有
> - 一元运算符 > 二元运算符 > 三元运算符
> - `&&` > `\|\|` > 赋值运算符
> - **注意**：判断运算符中 `>=` 的优先级要高于 `!=`

#### 优先级题目解析

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

> [!tip] 小提示
> 确定优先级后对表达式左右完成括号，有助于理解运算顺序。

---

## 五、流程控制语句

### 5.1 IF 条件语句
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

### 5.2 SWITCH 多分支语句
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

### for and while 循环

**==for 循环==**
>**包含** ：初始化 - 条件按表达式 - 自增表达式 - 循环体
>**适合**：知道需要循环多少次结束。
```c
#include <stdio.h>
int main(){
	for (int i=0; i>10;i++)
	{
		printf("构思");
	}
}
```

**==while循环==**
>初始化 - 条件按表达式 - 自增表达式 - 循环体
>**适合**：不知道需要循环多少次。

```c
#include <stdio.h>
int main(){
	int i = 0;
	while(i <10){
		printf("构思");
		i++；
	}
}

```

==**算法题解析**==

**第一题 反转数字**
>[!tip] 当前的题目需要将任意给的一个数字完成反转，题目的要点是是将原来的低位的数据变到高位（获取问题），其次在原始数据上去掉低位数字，最后完成转换后的拼接

```c
#include <stdio.h>

int main(){
    int a = 12345; // 原始变量
    int rev = 0; //  将原始变量完成转换后的结果
	 while (a != 0)
    {
        // 首先获取到个位
        int temp = a  % 10;
        // 获取到其他位置上的数字 , 并且要对原始的数据完成改变,因为下一次的改变需要使用这个
		a = a / 10;
        // 最后需要将当前的数字提升到最高位置上
	   rev = rev * 10 + temp;
    }
    printf("rev = %d",rev);
    return 0;
}
```
---
**第二题 2的次幂判断**
>[!tip] 判断是不是2的次幂首先要知道2的次幂首先是一个偶数，其次被2除到最后商是1
>

```c
#include <stdio.h>

int main(){
    // 判断一个数字是不是2的次幂
    int a = 2;
    int coumt = 0;
    while (a  % 2 ==0 && a > 1)
    {
        a /= 2;
    }
    if (a == 1)
    {
        printf("是2的次幂");
    }
    else{
        printf("不是2的次幂");
    }
    return 0;
}
```


**第三题 得到数字的算数平方根的整数部分**
>[!tip] 唯一需要注意的一点就是在while中的i在最后一次循环还会增加一次但是不参与下一次的代码运算

```C
#include <stdio.h>

int main()
{
    // 寻找算数平方根
    int a = 9;
    int i = 1;
    while (i * i <= a)
    {
        i++;
        printf("%d",i);
    }
    printf("result = %d",i - 1);
    return 0;
}
```

==do while ==
>[!tip] 先执行代码后执行判断无论怎样代码都会执行一次
```c
#include <stdio.h>
int main()
{
    int i = 1;
    do
    {
        printf("执行do while\n");
        i++;
    } while (i<=10);
    return 0;
}

```

### 循环高级部分

**==嵌套循环==**
```c
#include <stdio.h>
int main()
{
    for (int i = 1; i < 5; i++)
    {
        for (int j = i; j < 5; j++)
        {
            printf("*");
        }
        printf("\n");
    }
    return 0;
    // 第一次 i = 1 第一行 - 内部 1 - 5
    // 第二次 i = 2 第二行 - 内部 2 - 5

}
```

==**输出三角**==
```c
    for (size_t i = 0; i < 4; i++)
    {
        for (size_t j = 0; j <= i; j++)
        {
            printf("*");
        }
        printf("\n");
    }
```

**==输出口诀表==**
```c
    for (size_t i = 1; i <= 9; i++)
    {
        for (size_t j = 1; j <= i; j++)
        {
            printf("%d * %d = %d", i, j, (i * j));
        }
        printf("\n");
    }
    printf("goushi\t");
```

**==无限循环格式==**

> [!tip] 三种循环结构的无限循环写法

**1. while无限循环**
```c
while (1) {
    // 循环体
    // 需要break语句来退出循环
}
```

**2. do while无限循环**
```c
do {
    // 循环体
    // 至少执行一次
    // 需要break语句来退出循环
} while (1);
```

**3. for无限循环**
```c
for (;;) {
    // 循环体
    // 需要break语句来退出循环
}
```

**完整示例：**
```c
#include <stdio.h>
#include <stdbool.h>

int main() {
    int count = 0;

    // while无限循环
    printf("while无限循环示例:\n");
    while (1) {
        printf("循环次数: %d\n", count);
        count++;
        if (count >= 3) break;  // 退出循环
    }

    count = 0;
    printf("\ndo while无限循环示例:\n");

    // do while无限循环
    do {
        printf("循环次数: %d\n", count);
        count++;
        if (count >= 3) break;  // 退出循环
    } while (1);

    count = 0;
    printf("\nfor无限循环示例:\n");

    // for无限循环
    for (;;) {
        printf("循环次数: %d\n", count);
        count++;
        if (count >= 3) break;  // 退出循环
    }

    return 0;
}
```

**关键区别：**
| 循环类型 | 语法 | 特点 | 退出方式 |
|---------|------|------|---------|
| `while` | `while (1) { ... }` | 先判断后执行 | `break` |
| `do while` | `do { ... } while (1);` | 先执行后判断 | `break` |
| `for` | `for (;;) { ... }` | 最简洁的无限循环 | `break` |

**使用建议：**
1. **`for (;;)`** 是最常见和推荐的无限循环写法
2. **`while (1)`** 也很常见，语义清晰
3. **`do while (1)`** 较少用于无限循环，因为`do while`通常用于需要至少执行一次的场景