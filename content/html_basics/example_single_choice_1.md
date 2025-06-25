### 请问以下 JavaScript 代码的输出是什么？

```javascript
let x = 10;
function sum(a, b) {
  x = a + b;
  return x;
}
sum(5, 7);
console.log(x);

--- Explanation ---

这段代码首先定义了一个全局变量 x 并赋值为 10。

sum 函数内部修改了外部作用域的 x 变量。当 sum(5, 7) 被调用时，x 的值被更新为 5 + 7 = 12。

因此，console.log(x) 会输出 12。