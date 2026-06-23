#include <stdio.h>
#include <stdbool.h>

// 函数声明
bool isPrime(int num);
void printPrimesInRange(int start, int end);

int main() {
    printf("=== 1-100之间的质数判断与统计 ===\n\n");

    // 调用函数打印1-100之间的所有质数
    printPrimesInRange(1, 100);

    return 0;
}

// 判断一个数是否为质数的函数
bool isPrime(int num) {
    // 小于2的数不是质数
    if (num < 2) {
        return false;
    }

    // 2是质数
    if (num == 2) {
        return true;
    }

    // 偶数（除了2）不是质数
    if (num % 2 == 0) {
        return false;
    }

    // 检查奇数因子，只需要检查到sqrt(num)
    for (int i = 3; i * i <= num; i += 2) {
        if (num % i == 0) {
            return false;
        }
    }

    return true;
}

// 打印指定范围内的所有质数并统计
void printPrimesInRange(int start, int end) {
    int count = 0;  // 质数计数器
    int lineCount = 0;  // 每行打印的质数计数

    printf("在 %d 到 %d 之间的质数有：\n", start, end);
    printf("========================================\n");

    for (int i = start; i <= end; i++) {
        if (isPrime(i)) {
            count++;
            lineCount++;

            // 格式化输出，每10个质数换一行
            printf("%3d ", i);
            if (lineCount % 10 == 0) {
                printf("\n");
            }
        }
    }

    // 如果最后一行不满10个，换行
    if (lineCount % 10 != 0) {
        printf("\n");
    }

    printf("========================================\n");
    printf("总计：%d 个质数\n\n", count);

    // 额外信息：质数密度
    int totalNumbers = end - start + 1;
    double density = (double)count / totalNumbers * 100;
    printf("在 %d-%d 范围内，质数密度为：%.2f%%\n", start, end, density);
    printf("（平均每 %.1f 个数中有1个质数）\n", 100.0 / density);

    // 显示质数分布的一些统计信息
    printf("\n=== 质数分布统计 ===\n");

    // 按十位数分组统计
    int tensCount[10] = {0};  // 0-9十位数的质数计数
    for (int i = start; i <= end; i++) {
        if (isPrime(i)) {
            int tensDigit = i / 10;  // 获取十位数
            if (tensDigit < 10) {
                tensCount[tensDigit]++;
            }
        }
    }

    printf("按十位数分组统计：\n");
    for (int i = 0; i < 10; i++) {
        int rangeStart = i * 10;
        int rangeEnd = rangeStart + 9;
        if (rangeStart == 0) rangeStart = 1;  // 1-9
        if (rangeEnd > 100) rangeEnd = 100;   // 90-100

        printf("  %2d-%3d: %2d 个质数", rangeStart, rangeEnd, tensCount[i]);

        // 简单可视化
        printf(" [");
        for (int j = 0; j < tensCount[i]; j++) {
            printf("*");
        }
        printf("]\n");
    }
}