# 节点代码说明

本目录包含n8n工作流中Code节点的JavaScript代码实现。

## 📁 文件列表

| 文件 | 节点 | 功能 |
|------|------|------|
| `node-003-parse-config.js` | Node-003 | 解析运行配置，类型转换，存储到static data |
| `node-005-filter-accounts.js` | Node-005 | 筛选启用账号，数据清洗 |
| `node-005.5-load-progress.js` | Node-005.5-B | 读取采集进度，合并账号数据 |
| `node-005.6-smart-filter.js` | Node-005.6 | 智能过滤与重试策略 |
| `node-007-batch-info.js` | Node-007 | 计算批次信息，进度百分比 |
| `node-008-smart-delay.js` | Node-008 | 智能延迟，指数退避，随机抖动 |

## 🔧 使用方法

### 在n8n中使用

1. **创建Code节点**
   - 在n8n编辑器中添加"Code"节点
   - 选择"Run Once for All Items"或"Run Once for Each Item"（根据节点类型）

2. **复制代码**
   - 打开对应的`.js`文件
   - 复制完整代码到Code节点的编辑器中

3. **配置节点名称**
   - 将节点命名为对应的编号（如"Node-003"）
   - 这对于使用`$('Node-XXX')`引用很重要

### 节点依赖关系

某些节点依赖其他节点的输出或static data：

```javascript
// Node-003: 存储config到static data
$workflow.staticData.config = config;

// Node-005.5-B: 读取多个输入
const accountsInput = $('Node-005').all();
const progressInput = $('Node-005.5-A').all();

// Node-007: 从static data读取config
const config = $workflow.staticData.config;
```

## 💡 代码特性

### 1. 类型转换（Node-003）

```javascript
// 数字类型
if (['videosPerAccount', 'minLikeCount_incremental', ...].includes(key)) {
  value = parseInt(value);
}

// 浮点数类型
else if (['minInteractionRate_incremental', ...].includes(key)) {
  value = parseFloat(value);
}

// 布尔类型
else if (key === 'enableDedup') {
  value = value === 'TRUE' || value === true;
}
```

### 2. 数据清洗（Node-005）

```javascript
// 去除空格
accountName: account['账号昵称'].trim()

// 默认值
category: account['分类'] || '未分类'

// 类型转换
originalIndex: parseInt(account['序号']) || index + 1
```

### 3. 智能过滤（Node-005.6）

```javascript
// 根据mode和status决定处理策略
if (status === '已完成') {
  if (mode === 'incremental') {
    return { process: true, reason: '增量模式：采集新视频' };
  } else {
    return { process: false, reason: '全量模式：已采集完成' };
  }
}
```

### 4. 指数退避（Node-008）

```javascript
// 第1次重试：延迟 × 2
// 第2次重试：延迟 × 4
// 第3次重试：延迟 × 8
const backoffMultiplier = Math.pow(2, failureCount);
delaySeconds = delaySeconds * backoffMultiplier;
```

### 5. 随机抖动（Node-008）

```javascript
// 随机因子：0.8 ~ 1.2
const jitterFactor = 0.8 + (Math.random() * 0.4);
delaySeconds = Math.round(delaySeconds * jitterFactor);
```

## 🧪 测试建议

### 单元测试

每个代码文件都包含详细的测试步骤和预期结果，参考设计文档中的"测试建议"部分。

### 调试技巧

1. **使用console.log**
   ```javascript
   console.log(`📊 开始处理账号: ${account.accountName}`);
   console.log(`配置信息: ${JSON.stringify(config, null, 2)}`);
   ```

2. **查看n8n执行日志**
   - 点击节点查看"Output"
   - 在"Executions"页面查看完整日志

3. **单步执行**
   - 在n8n中使用"Execute Node"逐个测试节点
   - 检查每个节点的输入和输出

## 📝 代码规范

### 注释风格

```javascript
// ============================================
// Node-XXX: 节点名称
// ============================================
// 功能：
// 1. 功能描述1
// 2. 功能描述2
// ============================================
```

### 日志规范

使用emoji增强可读性：

```javascript
console.log(`📊 统计信息`);    // 数据统计
console.log(`✅ 执行完成`);    // 成功
console.log(`❌ 错误信息`);    // 错误
console.log(`⚠️  警告信息`);   // 警告
console.log(`🔄 重试中`);      // 重试
console.log(`⏰ 延迟中`);      // 延迟
console.log(`📌 关键节点`);    // 重要
console.log(`🆕 新数据`);      // 新建
console.log(`⏭️  跳过`);       // 跳过
```

### 错误处理

```javascript
// 验证必填参数
if (missingParams.length > 0) {
  const error = `❌ 缺少必填参数: ${missingParams.join(', ')}`;
  console.error(error);
  throw new Error(error);
}

// 验证数据
if (!config) {
  throw new Error('❌ 无法从static data读取config');
}
```

## 🔗 相关文档

- [第1批节点设计文档](../docs/batch1-design.md) - 完整的节点设计
- [Google Sheets模板](../templates/google-sheets-template.md) - 数据表结构
- [部署指南](../docs/deployment.md) - 部署和配置
- [n8n官方文档](https://docs.n8n.io/) - n8n使用指南

## 💡 最佳实践

1. **使用static data存储全局配置**
   - 避免在数据流中传递完整的config对象
   - 减少数据传输量

2. **合理使用循环变量**
   ```javascript
   const currentIndex = $itemIndex;  // 当前索引
   const totalItems = $totalItems;   // 总数
   ```

3. **清晰的日志输出**
   - 关键步骤都有日志
   - 使用emoji增强可读性
   - 输出统计信息

4. **错误处理**
   - 验证必填参数
   - 捕获异常并输出清晰的错误信息
   - 使用`throw new Error()`停止执行

5. **代码复用**
   - 提取公共逻辑到函数
   - 使用配置参数控制行为
   - 保持代码DRY（Don't Repeat Yourself）

## 🚀 后续开发

第2批节点（Node-010到Node-018.5）将包含：
- TikHub API调用
- 数据清洗转换
- 双重去重
- DeepSeek AI分析
- 批量写入Google Sheets

敬请期待！
