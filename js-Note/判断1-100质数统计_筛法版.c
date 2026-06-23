#include <stdio.h>
#include <stdbool.h>  // 使用bool类型

#define MAX_NUM 100

/*
 * 埃拉托斯特尼筛法（Sieve of Eratosthenes）
 * 一种高效的质数筛选算法
 *
 * 算法步骤：
 * 1. 创建一个布尔数组，标记所有数字为质数（true）
 * 2. 从2开始，将2的倍数标记为非质数（false）
 * 3. 找到下一个未被标记的数字（质数），将其倍数标记为非质数
 * 4. 重复步骤3直到处理完所有数字
 */

int main() {
    // 创建布尔数组，isPrime[i]表示数字i是否为质数
    bool isPrime[MAX_NUM + 1];
    int primeCount = 0;

    printf("=== 埃拉托斯特尼筛法：1-%d质数筛选 ===\n\n", MAX_NUM);

    // ========== 第一步：初始化数组 ==========
    printf("1. 初始化数组，假设所有数字都是质数...\n");
    for (int i = 0; i <= MAX_NUM; i++) {
        isPrime[i] = true;
    }

    // 0和1不是质数
    isPrime[0] = false;
    isPrime[1] = false;

    // ========== 第二步：执行筛法 ==========
    printf("2. 开始筛选过程...\n\n");

    for (int i = 2; i * i <= MAX_NUM; i++) {
        if (isPrime[i]) {
            printf("找到质数 %d，标记其倍数：", i);

            // 标记i的所有倍数
            int count = 0;
            for (int j = i * i; j <= MAX_NUM; j += i) {
                if (isPrime[j]) {
                    isPrime[j] = false;
                    count++;
                }
            }
            printf("标记了 %d 个非质数\n", count);
        }
    }

    // ========== 第三步：统计质数数量 ==========
    printf("\n3. 统计质数数量...\n");
    for (int i = 2; i <= MAX_NUM; i++) {
        if (isPrime[i]) {
            primeCount++;
        }
    }
    printf("1-%d之间共有 %d 个质数\n\n", MAX_NUM, primeCount);

    // ========== 第四步：输出所有质数 ==========
    printf("4. 所有质数列表：\n");
    printf("----------------------------------------\n");

    int lineCount = 0;
    for (int i = 2; i <= MAX_NUM; i++) {
        if (isPrime[i]) {
            printf("%3d ", i);
            lineCount++;

            if (lineCount % 10 == 0) {
                printf("\n");
            }
        }
    }

    if (lineCount % 10 != 0) {
        printf("\n");
    }
    printf("----------------------------------------\n");

    // ========== 第五步：质数分布分析 ==========
    printf("\n5. 质数分布分析：\n");
    printf("----------------------------------------\n");

    // 按区间统计
    int intervals[][2] = {
        {1, 10}, {11, 20}, {21, 30}, {31, 40}, {41, 50},
        {51, 60}, {61, 70}, {71, 80}, {81, 90}, {91, 100}
    };

    int intervalCount[10] = {0};
    int totalInInterval[10] = {0};

    for (int idx = 0; idx < 10; idx++) {
        int start = intervals[idx][0];
        int end = intervals[idx][1];

        for (int i = start; i <= end; i++) {
            totalInInterval[idx]++;
            if (isPrime[i]) {
                intervalCount[idx]++;
            }
        }
    }

    // 打印统计表
    printf("区间     质数个数  质数列表\n");
    printf("----------------------------------------\n");

    for (int idx = 0; idx < 10; idx++) {
        int start = intervals[idx][0];
        int end = intervals[idx][1];

        printf("%2d-%3d:     %2d      ", start, end, intervalCount[idx]);

        // 列出该区间的所有质数
        for (int i = start; i <= end; i++) {
            if (isPrime[i]) {
                printf("%d ", i);
            }
        }
        printf("\n");
    }

    // ========== 第六步：孪生质数（相差2的质数对） ==========
    printf("\n6. 孪生质数（相差2的质数对）：\n");
    printf("----------------------------------------\n");

    int twinPrimeCount = 0;
    int lastPrime = -1;

    for (int i = 2; i <= MAX_NUM; i++) {
        if (isPrime[i]) {
            if (lastPrime != -1 && i - lastPrime == 2) {
                twinPrimeCount++;
                printf("第%d对: (%d, %d)\n", twinPrimeCount, lastPrime, i);
            }
            lastPrime = i;
        }
    }

    printf("1-%d之间共有 %d 对孪生质数\n", MAX_NUM, twinPrimeCount);

    // ========== 第七步：性能对比 ==========
    printf("\n7. 算法性能说明：\n");
    printf("----------------------------------------\n");
    printf("埃拉托斯特尼筛法的时间复杂度：O(n log log n)\n");
    printf("传统试除法的时间复杂度：O(n√n)\n");
    printf("筛法在判断大量质数时更高效！\n");

    // ========== 第八步：验证结果 ==========
    printf("\n8. 结果验证：\n");
    printf("----------------------------------------\n");

    // 已知的1-100质数数量
    const int knownPrimeCount = 25;
    printf("已知1-100之间有 %d 个质数\n", knownPrimeCount);
    printf("程序计算得到 %d 个质数\n", primeCount);

    if (primeCount == knownPrimeCount) {
        printf("✓ 结果正确！\n");
    } else {
        printf("✗ 结果可能有误\n");
    }

    // 列出所有质数供验证
    printf("\n1-100之间的质数应为：\n");
    printf("2, 3, 5, 7, 11, 13, 17, 19, 23, 29,\n");
    printf("31, 37, 41, 43, 47, 53, 59, 61, 67,\n");
    printf("71, 73, 79, 83, 89, 97\n");

    return 0;
}