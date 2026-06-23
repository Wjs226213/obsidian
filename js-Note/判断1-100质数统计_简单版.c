#include <stdio.h>

int main() {
    int count = 0;  // 质数计数器
    int i, j;
    int isPrime;    // 标记是否为质数：1表示是质数，0表示不是

    printf("1-100之间的质数：\n");
    printf("================\n");

    // 遍历1-100之间的所有数字
    for (i = 2; i <= 100; i++) {
        isPrime = 1;  // 先假设当前数字是质数

        // 判断i是否为质数
        // 只需要检查2到i-1之间是否有能整除i的数
        for (j = 2; j < i; j++) {
            if (i % j == 0) {
                isPrime = 0;  // 找到能整除的因子，不是质数
                break;        // 跳出内层循环
            }
        }

        // 如果是质数，打印并计数
        if (isPrime == 1) {
            count++;
            printf("%3d ", i);

            // 每10个质数换一行
            if (count % 10 == 0) {
                printf("\n");
            }
        }
    }

    // 如果最后一行不满10个，换行
    if (count % 10 != 0) {
        printf("\n");
    }

    printf("================\n");
    printf("1-100之间共有 %d 个质数\n\n", count);

    // 显示所有质数的列表
    printf("质数列表：");
    count = 0;  // 重置计数器
    for (i = 2; i <= 100; i++) {
        isPrime = 1;
        for (j = 2; j < i; j++) {
            if (i % j == 0) {
                isPrime = 0;
                break;
            }
        }
        if (isPrime == 1) {
            if (count > 0) printf(", ");
            printf("%d", i);
            count++;
        }
    }
    printf("\n\n");

    // 优化版本：使用更高效的算法
    printf("=== 优化算法（检查到sqrt(i)）===\n");
    count = 0;
    for (i = 2; i <= 100; i++) {
        isPrime = 1;

        // 优化：只需要检查到sqrt(i)
        // 因为如果i有大于sqrt(i)的因子，那么它必然有一个小于sqrt(i)的对应因子
        for (j = 2; j * j <= i; j++) {
            if (i % j == 0) {
                isPrime = 0;
                break;
            }
        }

        if (isPrime == 1) {
            count++;
        }
    }
    printf("1-100之间共有 %d 个质数（优化算法验证）\n", count);

    return 0;
}