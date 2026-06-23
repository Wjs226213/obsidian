#include <stdio.h>

/*
 * 判断1-100之间的质数并统计
 *
 * 质数定义：大于1的自然数，除了1和它本身以外不再有其他因数的数
 * 例如：2, 3, 5, 7, 11, 13, 17, 19, 23, 29...
 */

int main() {
    // ========== 第一步：变量声明 ==========
    int num;        // 当前要判断的数字（1-100）
    int divisor;    // 可能的除数（因子）
    int isPrime;    // 标记是否为质数：1=是，0=不是
    int primeCount = 0; // 质数计数器

    printf("========== 1-100质数判断与统计 ==========\n\n");

    // ========== 第二步：遍历1-100的所有数字 ==========
    printf("开始判断1-100之间的每个数字：\n");
    printf("----------------------------------------\n");

    for (num = 1; num <= 100; num++) {
        // 特殊情况处理
        if (num == 1) {
            printf("数字 %2d: 1不是质数（质数定义要求大于1）\n", num);
            continue;  // 跳过1，继续下一个数字
        }

        // 假设当前数字是质数
        isPrime = 1;

        // ========== 第三步：判断是否为质数 ==========
        // 方法：检查2到num-1之间是否有能整除num的数
        for (divisor = 2; divisor < num; divisor++) {
            if (num % divisor == 0) {
                // 找到能整除的因子，不是质数
                isPrime = 0;
                break;  // 已经确定不是质数，跳出循环
            }
        }

        // ========== 第四步：根据判断结果处理 ==========
        if (isPrime == 1) {
            primeCount++;  // 质数计数加1
            printf("数字 %2d: ✓ 是质数（第%d个质数）\n", num, primeCount);
        } else {
            printf("数字 %2d: ✗ 不是质数", num);

            // 显示一个因子（如果不是质数）
            for (divisor = 2; divisor < num; divisor++) {
                if (num % divisor == 0) {
                    printf("（可被%d整除）", divisor);
                    break;
                }
            }
            printf("\n");
        }
    }

    // ========== 第五步：统计结果输出 ==========
    printf("\n========== 统计结果 ==========\n");
    printf("1-100之间共有 %d 个质数\n\n", primeCount);

    // ========== 第六步：列出所有质数 ==========
    printf("所有质数列表：\n");
    primeCount = 0;  // 重置计数器
    for (num = 2; num <= 100; num++) {
        isPrime = 1;

        // 重新判断每个数字
        for (divisor = 2; divisor < num; divisor++) {
            if (num % divisor == 0) {
                isPrime = 0;
                break;
            }
        }

        if (isPrime == 1) {
            primeCount++;
            printf("%3d", num);

            // 每10个质数换一行
            if (primeCount % 10 == 0) {
                printf("\n");
            } else {
                printf(" ");
            }
        }
    }

    // 确保最后有换行
    if (primeCount % 10 != 0) {
        printf("\n");
    }

    // ========== 第七步：算法优化演示 ==========
    printf("\n========== 算法优化 ==========\n");
    printf("原始算法：检查2到num-1的所有数字\n");
    printf("优化算法：只需要检查2到√num（平方根）\n\n");

    printf("优化算法验证：\n");
    primeCount = 0;
    for (num = 2; num <= 100; num++) {
        isPrime = 1;

        // 优化：只需要检查到num的平方根
        for (divisor = 2; divisor * divisor <= num; divisor++) {
            if (num % divisor == 0) {
                isPrime = 0;
                break;
            }
        }

        if (isPrime == 1) {
            primeCount++;
        }
    }
    printf("优化算法结果：1-100之间有 %d 个质数\n", primeCount);

    // ========== 第八步：质数特性总结 ==========
    printf("\n========== 质数特性总结 ==========\n");
    printf("1. 2是唯一的偶质数\n");
    printf("2. 质数在自然数中的分布是不规则的\n");
    printf("3. 随着数字增大，质数越来越稀疏\n");
    printf("4. 1既不是质数也不是合数\n");

    // ========== 第九步：扩展思考 ==========
    printf("\n========== 扩展思考 ==========\n");
    printf("可以尝试修改程序：\n");
    printf("1. 判断1-1000之间的质数\n");
    printf("2. 找出1-100之间的所有孪生质数（相差2的质数对）\n");
    printf("3. 计算质数的和与平均值\n");
    printf("4. 使用筛法（埃拉托斯特尼筛法）优化算法\n");

    return 0;
}