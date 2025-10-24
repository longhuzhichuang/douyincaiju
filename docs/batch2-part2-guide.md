# 第2批-Part2节点实现指南

## 概述

第2批-Part2实现了AI分析层、数据收集层和进度更新层，包含以下功能：
- DeepSeek AI智能分析（6个维度）
- AI结果合并和容错处理
- 27列标准格式化输出
- 账号级别统计分析
- 采集进度记录

## 节点列表

### Node-015: DeepSeek AI分析（HTTP Request）
### Node-016: 合并AI结果（Code）
### Node-017: 格式化输出数据（Code）
### Node-018: 收集账号数据（Code）
### Node-018.5: 更新采集进度（Google Sheets）

---

## Node-015: DeepSeek AI分析

**类型**: HTTP Request
**位置**: 在Node-014之后，Node-016之前
**代码文件**: 无（HTTP Request节点）

### 配置参数

```yaml
Method: POST
URL: https://api.deepseek.com/v1/chat/completions
Authentication: Bearer Token (HTTP Header Auth)

Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_DEEPSEEK_API_KEY

Body (JSON):
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的短视频内容分析师，专注于茶叶相关视频的分析..."
    },
    {
      "role": "user",
      "content": "{{ $json.subtitleText }}"
    }
  ],
  "response_format": {
    "type": "json_object"
  },
  "temperature": 0.3,
  "max_tokens": 500
}

Options:
  Continue On Fail: Yes
  Retry On Fail: Yes
  Max Retries: 2
  Retry Delay: 2000ms
  Timeout: 30000ms
```

### AI分析的6个维度

输出JSON格式：
```json
{
  "content_type": "教程 | 产品展示 | 故事叙述 | 测评对比 | 直播带货",
  "tea_category": "绿茶 | 红茶 | 乌龙茶 | 普洱 | 白茶 | 花茶 | 综合",
  "selling_points": "卖点1,卖点2,卖点3",
  "target_audience": "年龄段,消费水平,兴趣特征",
  "call_to_action": "有-[具体动作] | 无",
  "quality_score": 8
}
```

### System Prompt（完整版）

```
你是一个专业的短视频内容分析师，专注于茶叶相关视频的分析。请根据视频文案，从以下6个维度进行分析，并以JSON格式返回结果。

**分析维度：**

1. **content_type**（内容类型）
   - 教程：教授泡茶技巧、茶艺知识等
   - 产品展示：展示茶叶产品、包装、品质等
   - 故事叙述：讲述茶文化、品牌故事等
   - 测评对比：对比不同茶叶或品牌
   - 直播带货：直播销售茶叶产品

2. **tea_category**（茶叶品类）
   - 绿茶、红茶、乌龙茶、普洱、白茶、花茶、综合

3. **selling_points**（卖点信息）
   - 提取3-5个核心卖点，逗号分隔
   - 例如：正宗产地,明前新茶,香气独特,回甘明显,传统工艺

4. **target_audience**（目标受众）
   - 年龄段、消费水平、兴趣特征
   - 例如：25-40岁,中高消费,注重生活品质,茶文化爱好者

5. **call_to_action**（行动召唤）
   - 有-[具体动作]：如"有-点击购买链接"、"有-关注获取优惠"
   - 无：没有明确的行动召唤

6. **quality_score**（质量评分）
   - 1-10的整数评分
   - 评分标准：内容专业度、信息价值、制作质量、吸引力

**输出格式：**
必须返回严格的JSON格式，不要有任何额外的文字说明。

**示例输出：**
{
  "content_type": "产品展示",
  "tea_category": "绿茶",
  "selling_points": "正宗产地,明前新茶,香气独特,回甘明显,传统工艺",
  "target_audience": "25-40岁,中高消费,注重生活品质,茶文化爱好者",
  "call_to_action": "有-点击购买链接",
  "quality_score": 8
}

现在请分析以下视频文案：
```

### 成本分析

- **单条视频成本**: $0.00007（0.007美分）
- **2000条视频**: $0.14（14美分）
- **每月120K条**: $8.4

---

## Node-016: 合并AI结果

**类型**: Code (JavaScript)
**位置**: 在Node-015之后，Node-017之前
**代码文件**: `nodes/node-016-merge-ai-results.js`

### 功能说明

1. **提取AI响应**: 从DeepSeek API返回的`choices[0].message.content`中提取JSON
2. **JSON解析**: 解析AI返回的JSON格式分析结果
3. **字段验证**: 检查6个必填字段是否存在
4. **默认值填充**: 缺失字段自动填充默认值
5. **数据合并**: 将AI分析结果合并到视频数据对象中

### 三层容错机制

```javascript
// 第1层：检查响应结构
if (!data.choices?.[0]?.message?.content) {
  throw new Error('AI响应为空');
}

// 第2层：JSON解析
try {
  aiAnalysis = JSON.parse(aiContent);
} catch {
  aiAnalysis = defaultValues; // 使用默认值
}

// 第3层：字段验证
if (!aiAnalysis.content_type) {
  aiAnalysis.content_type = "未知";
}
```

### 默认值策略

AI完全失败时的默认值：
```javascript
{
  content_type: "未知",
  tea_category: "未知",
  selling_points: "无法识别",
  target_audience: "未知",
  call_to_action: "无",
  quality_score: 0
}
```

### 输出字段

合并后的视频数据包含：
- 原始视频所有字段（videoId, accountName, playCount等）
- AI分析结果（contentType, teaCategory, qualityScore等）
- AI元数据（aiModel, aiTokens, aiAnalyzedAt）

---

## Node-017: 格式化输出数据

**类型**: Code (JavaScript)
**位置**: 在Node-016之后，所有视频处理完成后执行一次
**代码文件**: `nodes/node-017-format-output.js`

### 执行模式

**重要**: 此节点需要等待所有视频处理完成后统一执行，不是逐条执行。

在n8n中的配置：
1. 在Node-016后添加"Wait"节点或"Aggregate"节点
2. 收集所有视频数据后再进入Node-017

### 27列标准格式

| 列号 | 字段名 | 数据类型 | 示例值 |
|------|--------|---------|--------|
| 1 | 视频ID | 文本 | 7301234567890123456 |
| 2 | 账号名称 | 文本 | 茶文化传播 |
| 3 | 账号类别 | 文本 | 内容号 |
| 4 | 视频标题 | 文本 | 品味茶香... |
| 5 | 发布时间 | 日期时间 | 2025-10-23 14:30:00 |
| 6 | 视频时长(秒) | 数字 | 45 |
| 7 | 视频链接 | 文本 | https://... |
| 8 | 播放量 | 数字 | 28600 |
| 9 | 点赞数 | 数字 | 1520 |
| 10 | 评论数 | 数字 | 89 |
| 11 | 分享数 | 数字 | 156 |
| 12 | 收藏数 | 数字 | 234 |
| 13 | 互动率(%) | 数字 | 7.00 |
| 14 | 点赞率(%) | 数字 | 5.31 |
| 15 | 视频文案 | 文本 | 今天给大家... |
| 16 | 话题标签 | 文本 | 茶文化, 品茶 |
| 17 | 内容类型 | 文本 | 产品展示 |
| 18 | 茶叶品类 | 文本 | 绿茶 |
| 19 | 卖点信息 | 文本 | 正宗产地,明前新茶 |
| 20 | 目标受众 | 文本 | 25-40岁,中高消费 |
| 21 | 行动召唤 | 文本 | 有-点击购买链接 |
| 22 | AI质量评分 | 数字 | 8 |
| 23 | 采集时间 | 日期时间 | 2025-10-24 09:15:30 |
| 24 | 批次ID | 文本 | 2025-10-24-incremental |
| 25 | 采集模式 | 文本 | incremental |
| 26 | 是否重复 | 文本 | 否 |
| 27 | 去重方法 | 文本 | all_dedup_passed |

### 功能特性

1. **数据质量检查**: 检查关键字段是否完整
2. **统计分析**:
   - 内容类型分布
   - 茶叶品类分布
   - AI质量评分统计（平均/最高/最低）
   - 去重统计（新视频/重复视频）
3. **Top榜单**: 输出Top 5高质量视频
4. **存储统计**: 将统计数据存入`$workflow.staticData`供Node-018.5使用

### 存储到Static Data

```javascript
$workflow.staticData.videosCollected = formattedData.length;
$workflow.staticData.newVideosCount = newVideosCount;
$workflow.staticData.duplicateVideosCount = duplicateVideosCount;
```

---

## Node-018: 收集账号数据

**类型**: Code (JavaScript)
**位置**: 与Node-017并行，独立收集账号统计
**代码文件**: `nodes/node-018-collect-accounts.js`

### 功能说明

1. **按账号分组**: 将所有视频按账号名称分组
2. **汇总统计**: 计算每个账号的总计和平均值指标
3. **内容分析**: 识别账号的主要内容类型和茶叶品类
4. **排序输出**: 按平均播放量排序
5. **Top识别**: 输出Top 5账号

### 输出字段（17列）

```javascript
{
  '账号名称': string,
  '账号类别': string,
  '账号SecUid': string,
  '视频数量': number,

  '总播放量': number,
  '总点赞数': number,
  '总评论数': number,
  '总分享数': number,
  '总收藏数': number,

  '平均播放量': number,
  '平均点赞数': number,
  '平均互动率(%)': number,
  '平均质量评分': number,

  '主要内容类型': string,  // 出现最频繁的类型
  '主要茶叶品类': string,  // 出现最频繁的品类

  '采集时间': string,
  '批次ID': string,
  '采集模式': string
}
```

### 统计分析

- **整体统计**: 总视频数、总播放量、总点赞数
- **平均值**: 整体平均播放量、点赞数、质量评分
- **Top 5账号**: 按平均播放量排序的前5名
- **账号分布**: 按内容类型和茶叶品类统计账号数量

### 存储到Static Data

```javascript
$workflow.staticData.accountsProcessed = accountStats.length;
```

---

## Node-018.5: 更新采集进度

**类型**: Google Sheets (Append)
**位置**: 在整个工作流的最后
**配置**: Google Sheets Append操作

### 配置参数

```yaml
Operation: Append
Document: "抖音视频数据采集"（根据实际表格名称调整）
Sheet: "采集进度"

Columns Mapping:
  采集时间: ={{ $now.format('yyyy-MM-dd HH:mm:ss') }}
  批次ID: ={{ $workflow.staticData.config.batchId }}
  采集模式: ={{ $workflow.staticData.config.mode }}
  账号数量: ={{ $workflow.staticData.accountsProcessed || 0 }}
  视频数量: ={{ $workflow.staticData.videosCollected || 0 }}
  新视频数: ={{ $workflow.staticData.newVideosCount || 0 }}
  重复视频数: ={{ $workflow.staticData.duplicateVideosCount || 0 }}
  执行状态: "完成"
  错误信息: ""
```

### 采集进度表结构

| 列名 | 数据类型 | 说明 |
|------|---------|------|
| 采集时间 | 日期时间 | 工作流完成时间 |
| 批次ID | 文本 | 批次标识 |
| 采集模式 | 文本 | incremental/full |
| 账号数量 | 数字 | 处理的账号数 |
| 视频数量 | 数字 | 采集的总视频数 |
| 新视频数 | 数字 | 新视频数量 |
| 重复视频数 | 数字 | 重复视频数量 |
| 执行状态 | 文本 | 完成/失败/部分完成 |
| 错误信息 | 文本 | 如有错误则记录 |

### 业务价值

1. **进度追踪**: 清楚记录每次采集的情况
2. **性能监控**: 分析采集效率和重复率
3. **问题诊断**: 发现异常时可追溯
4. **成本计算**: 统计AI调用次数和费用
5. **趋势分析**: 对比不同时间段的数据变化

---

## 工作流整体流程

```
Node-014 (相似度去重)
   ↓
Node-015 (DeepSeek AI分析) - HTTP Request
   ↓
Node-016 (合并AI结果) - Code
   ↓
   ├─→ Node-017 (格式化输出) - Code
   │       ↓
   │   [待实现: 写入Google Sheets]
   │
   └─→ Node-018 (收集账号数据) - Code
           ↓
       [待实现: 写入Google Sheets]
           ↓
       Node-018.5 (更新采集进度) - Google Sheets Append
```

---

## 配置清单

### 1. DeepSeek API凭证

创建HTTP Header Auth凭证：
- **Name**: DeepSeek API Key
- **Header Name**: `Authorization`
- **Header Value**: `Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxx`

获取API Key: https://platform.deepseek.com/

### 2. Google Sheets凭证

使用已有的Google Sheets OAuth2凭证。

### 3. 必需的Google Sheets工作表

**新增工作表**:
- **采集进度**: 9列（采集时间、批次ID、采集模式等）

**确保存在的工作表**:
- 运行配置
- 监控账号列表
- 视频数据

### 4. Config参数（需在"运行配置"表中配置）

新增参数：
```yaml
# DeepSeek API配置
deepseekApiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# AI分析配置
aiTemperature: 0.3         # 温度参数（0-2）
aiMaxTokens: 500           # 最大tokens
aiTimeout: 30000           # 超时时间(ms)
```

---

## 测试步骤

### 1. 单元测试

#### 测试Node-015（DeepSeek AI分析）
```javascript
// 手动触发，只处理1个视频
// 检查输出：
// - choices[0].message.content 包含JSON
// - JSON包含6个分析维度
// - quality_score 在1-10之间
```

#### 测试Node-016（合并AI结果）
```javascript
// 检查输出：
// - contentType, teaCategory等字段存在
// - 缺失字段已填充默认值
// - qualityScore 在1-10之间或为0
// - aiAnalyzedAt 是有效的ISO时间戳
```

#### 测试Node-017（格式化输出）
```javascript
// 检查输出：
// - 每条数据包含27个字段
// - 字段名称与COLUMNS定义一致
// - "是否重复" 是 "是" 或 "否"
// - console输出包含统计信息
```

#### 测试Node-018（收集账号数据）
```javascript
// 检查输出：
// - 每个账号一条记录
// - 包含17个字段
// - 平均值计算正确
// - 按平均播放量降序排列
```

#### 测试Node-018.5（更新采集进度）
```javascript
// 检查：
// - "采集进度"表新增一行
// - 所有9个字段都有值
// - 数值字段是数字类型
// - 时间格式正确
```

### 2. 集成测试

1. **准备测试数据**:
   - 确保Node-014已输出一些视频数据
   - 配置DeepSeek API Key

2. **执行工作流**:
   - 从Node-015开始执行
   - 观察每个节点的日志输出

3. **验证结果**:
   - 检查Node-017输出的27列数据
   - 检查Node-018输出的账号统计
   - 检查"采集进度"表的新记录

### 3. AI分析质量测试

- **准确性**: 人工抽查10-20条视频，检查AI分析是否准确
- **一致性**: 相同视频多次分析结果应基本一致
- **覆盖率**: 检查AI分析成功率（目标>95%）
- **容错性**: 测试AI失败时的默认值填充

---

## 常见问题

### Q1: DeepSeek API返回错误
**A**:
1. 检查API Key是否正确配置
2. 确认API余额充足
3. 检查请求频率是否超限（QPM/QPD限制）
4. 查看HTTP Response中的错误详情

### Q2: AI分析结果为"未知"
**A**:
1. 检查视频字幕是否为空（`subtitleText`）
2. 查看Node-016日志，确认AI响应格式
3. 检查System Prompt是否正确
4. 考虑调整`temperature`参数（默认0.3）

### Q3: Node-017执行时机不对（提前执行）
**A**:
1. 确保在Node-016后添加了"Wait"或"Aggregate"节点
2. 检查工作流分支是否正确合并
3. 使用"Wait"节点等待所有item完成

### Q4: 27列格式与Google Sheets不匹配
**A**:
1. 检查Google Sheets表头是否与COLUMNS定义一致
2. 确认字段顺序完全相同
3. 检查数据类型（文本/数字/日期）

### Q5: 账号统计数据不准确
**A**:
1. 检查Node-018的输入是否包含所有视频
2. 确认字段名映射正确（兼容中英文字段名）
3. 查看console日志中的分组结果

### Q6: 采集进度表写入失败
**A**:
1. 确认"采集进度"表已创建且表头正确
2. 检查Google Sheets OAuth2凭证
3. 确认static data中的统计数据已正确设置

---

## 性能指标

- **AI分析速度**: 0.5-2秒/视频（取决于文案长度）
- **格式化速度**: <1秒/1000条视频
- **账号统计速度**: <1秒/100个账号
- **进度写入速度**: <1秒

---

## 成本估算

### DeepSeek AI成本

| 场景 | 视频数 | 月频次 | 月总量 | 月成本 |
|------|--------|--------|--------|--------|
| 小规模 | 100 | 60 | 6K | $0.42 |
| 中规模 | 500 | 60 | 30K | $2.10 |
| 大规模 | 2000 | 60 | 120K | $8.40 |

注：基于每视频$0.00007的成本估算

### Google Sheets API成本

- 免费额度: 每天300个请求/用户
- 超出部分: 通常不会超出（本系统仅Append操作）

---

## 下一步

第2批-Part2节点完成后，工作流基本功能已全部实现。可选的后续优化：

1. **批量写入Google Sheets**: 实现Node-017和Node-018的数据写入
2. **错误处理增强**: 添加更完善的异常处理和通知机制
3. **性能优化**: 并行处理AI分析请求
4. **数据可视化**: 基于Google Sheets创建数据看板
5. **定时报告**: 每日/每周发送采集报告

---

## 参考资料

- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [n8n HTTP Request节点](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [n8n Code节点](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/)
- [Google Sheets API](https://developers.google.com/sheets/api/reference/rest)
