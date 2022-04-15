// a>1&&((b<2||c!=3)||(d==hello&&version<=2.5.0))

// check('a>1&&((b<2||c!=3)||(d==hello&&version<=2.5.0))',{a:2,b:3,c:4,d:"hello",version:"2.5.1"})
// xiunen@163.com

// 2 > 1 && (( 3 < 2 || 4 != 3)) || (hello == hello && 2.5.1 >= 2.5.0)
// true && ((false || true)) || (true && false)
// true && (true || false)
// true

function check(str, valObj) {
  let queue = [];
  let i = 0;

  str = str.replace(/\s/gi, "");

  while (i < str.length) {
    // 当前操作运算符号
    let opStr = getOperate(i, str);
    if (opStr.length > 1) {
      i = i + opStr.length - 1;
    }
    // 不是运算符号或者 是括号
    if (!opStr) {
      // 判断下一个是不是括号
      if (str[i] === ")") {
        // 找到第一个左括号做数据合并
        let subQueue = getFirstLeftBracketsQueue(queue);
        let res = calculateSubStr(subQueue, valObj);
        queue.push(res);
      } else {
        let val = "";
        if (str[i] === "(") {
          queue.push(str[i]);
        } else {
          let opList = [">", "<", "&", "|", "<", "=", "!", "(", ")"];
          while (i < str.length && !opList.includes(str[i])) {
            val += str[i];
            i++;
          }
          i--;
          if (val) {
            queue.push(val);
          }
        }
      }
    } else {
      queue.push(opStr);
    }
    i++;
    // console.log(queue);
  }

  // console.log("最后一次打印", queue);
  // 最后剩下的就一定是一个没有括号的操作表达式
  let res = calculateSubStr(queue, valObj);
  // console.log("最终结果", !!res);
  return !!res;
}

// 从第 i 位有没有可能是操作符号，如果是，返回，否则返回false
function getOperate(i, str) {
  let opList = [">", "<", "&&", "||", "<=", ">=", "!=", "=="];
  let opStr = false;
  if (opList.includes(str.slice(i, i + 2))) {
    opStr = str.slice(i, i + 2);
    i++;
  } else if (opList.includes(str[i])) {
    // 一个运算符号情况
    opStr = str[i];
  }
  return opStr;
}

// 计算没有任何括号的运算
function calculateSubStr(queue, valObj) {
  // console.log("子字符串", queue.join(""));
  let res = false;
  // 先计算 > < >= <=
  res = calAboveEqual(queue, valObj);
  // console.log(res);
  // 计算 != ==
  res = calEqual(res, valObj);
  // console.log(res);
  // 计算所有的 &&
  res = calAnd(res, valObj);
  // console.log(res);
  // 计算所有的 ||
  // console.log("字串计算结果之前", res);
  res = calOr(res, valObj);
  // console.log("字串计算结果", res);
  return res[0];
}

// 遍历没有括号的表达式
/**
 *
 * @param {*} queue 分割处理后的表达式队列
 * @param {*} opList 寻找的操作符列表
 * @param {*} valObj 可背替换的变量
 * @param {*} fn 命中目标操作符时执行的函数
 * @returns
 */
function traverseQueue(queue, opList, valObj = {}, fn) {
  // 这里其实还需要处理 !a ，>=a的特殊情况，但是不知具体要求暂时不处理，如果需要可以在这里添加外的处理逻辑
  if (queue.length <= 1) {
    return queue;
  }

  // 如果只有两个可操作元素，判断第一个是不是操作符号，如果是，默认left 为 null
  if (queue.length === 2) {
    if (opList.includes(queue[i])) {
      let res = fn(null, queue[1], queue[0]);
      return [res];
    } else {
    }
    return queue;
  }

  let res = [];
  let i = 0;
  while (i < queue.length) {
    if (opList.includes(queue[i])) {
      res.pop();
      let left = valObj[queue[i - 1]] || queue[i - 1];
      let right = valObj[queue[i + 1]] || queue[i + 1];
      // 判断是否是版本号类型, 这里暂时不做额外的处理
      let tempVal = fn(left, right, queue[i]);
      res.push(tempVal);
      i++;
    } else {
      res.push(queue[i]);
    }
    i++;
  }
  return res;
}
//先计算 > < >= <=
function calAboveEqual(queue, valObj) {
  return traverseQueue(queue, ["<", ">", ">=", "<="], valObj, function (left, right, op) {
    // 判断是不是版本号类型
    if (isVersion(left) || isVersion(right)) {
      // 1: left > right
      // -1: left < right
      // 0: left == right
      res = compareVersion(left, right);
      let tempVal;
      //  当 left 为空时需要额外处理，这里暂时不做处理，如果需要，可在此处添加代码
      switch (op) {
        case "<":
          tempVal = { 0: false, 1: false, ["-1"]: true }[res];
          break;
        case ">":
          tempVal = { 0: false, 1: true, ["-1"]: false }[res];
          break;
        case "<=":
          tempVal = { 0: true, 1: false, ["-1"]: true }[res];
          break;
        case ">=":
          tempVal = { 0: true, 1: true, ["-1"]: false }[res];
          break;
      }
      return tempVal;
    }
    // 不是版本号都直接比较
    let tempVal;
    //  当 left 为空时需要额外处理，这里暂时不做处理，如果需要，可在此处添加代码
    switch (op) {
      case "<":
        tempVal = left < right;
        break;
      case ">":
        tempVal = left > right;
        break;
      case "<=":
        tempVal = left <= right;
        break;
      case ">=":
        tempVal = left >= right;
        break;
    }
    return tempVal;
  });
}

// 计算 != ==
function calEqual(queue, valObj) {
  return traverseQueue(queue, ["!=", "=="], valObj, function (left, right, op) {
    let tempVal;
    //  当 left 为空时需要额外处理，这里暂时不做处理，如果需要，可在此处添加代码
    switch (op) {
      case "!=":
        tempVal = left != right;
        break;
      case "==":
        tempVal = left == right;
        break;
    }
    return tempVal;
  });
}

function calAnd(queue, valObj) {
  return traverseQueue(queue, ["&&"], valObj, function (left, right, op) {
    let tempVal;
    //  当 left 为空时需要额外处理，这里暂时不做处理，如果需要，可在此处添加代码
    switch (op) {
      case "&&":
        tempVal = left && right;
        break;
    }
    return tempVal;
  });
}

// 计算所有的 || 操作符
function calOr(queue, valObj) {
  return traverseQueue(queue, ["||"], valObj, function (left, right, op) {
    let tempVal;
    //  当 left 为空时需要额外处理，这里暂时不做处理，如果需要，可在此处添加代码
    switch (op) {
      case "||":
        tempVal = left || right;
        break;
    }
    return tempVal;
  });
}
/**
 * 获取第一个左括号的
 * @param {*} queue
 * @returns
 */
function getFirstLeftBracketsQueue(queue) {
  let subQueue = [];
  let i = queue.length - 1;
  while (i >= 0 && queue[i] !== "(") {
    subQueue.push(queue.pop());
    i--;
  }
  // 移除左括号
  queue.pop();
  return subQueue.reverse();
}

function isVersion(str) {
  return /^[0-9]+\.[0-9]+\.[0-9]+$/.test(str);
}

function compareVersion(v1, v2) {
  v1 = v1.split(".");
  v2 = v2.split(".");
  const len = Math.max(v1.length, v2.length);

  // 调整两个版本号位数相同
  while (v1.length < len) {
    v1.push("0");
  }
  while (v2.length < len) {
    v2.push("0");
  }

  // 循环判断每位数的大小
  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}

console.log(check("3<4 && 2>3"));
console.log(check("3<4  && (1 < 3 || a > 6)", { a: 7 }));
console.log(check("version > 1.1", { a: 7, version: "0.2" }));
console.log(check("0 && a", { a: 7, version: "0.2" }));
console.log(check("1 && a", { a: 7, version: "0.2" }));
console.log(
  check("a>1&&((b<2||c!=3)||(d==hello&&version<=2.5.0))", { a: 2, b: 3, c: 4, d: "hello", version: "2.5.1" })
);

console.log(check("2.5.1 == 2.5.0", { a: 7, version: "0.2" }));
console.log(check("2.5.1 >= 2.5.0", { a: 7, version: "0.2" }));
