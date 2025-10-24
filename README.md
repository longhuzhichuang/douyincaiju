# 抖音视频采集系统

> 基于 n8n 工作流的抖音视频智能采集与分析系统

**🚀 [5分钟快速开始](QUICKSTART.md)** | **📥 [n8n工作流导入指南](docs/n8n-import-guide.md)** | **📖 [完整部署指南](docs/deployment.md)**

## 📋 项目概述

本项目是一个自动化的抖音视频采集系统，通过 n8n 工作流引擎实现：
- 定时/手动触发采集
- 多账号批量监控
- 智能断点续传
- 数据去重与 AI 分析
- Google Sheets 数据存储

## 🏗️ 系统架构

```
触发层 → 配置层 → 断点续传层 → 循环控制层 → API采集层 → 数据处理层 → 存储层
```

### 核心功能模块

#### 第1批节点（✅ 已完成）- 触发与控制层
- **Node-001-A/B**: 定时/手动触发
- **Node-002**: 读取运行配置
- **Node-003**: 解析配置 ⭐
- **Node-004**: 读取监控账号
- **Node-005**: 筛选启用账号
- **Node-005.5**: 读取采集进度 ⭐
- **Node-005.6**: 智能过滤与重试策略 ⭐
- **Node-006**: 循环账号
- **Node-007**: 计算批次信息
- **Node-008**: 智能延迟 ⭐
- **Node-009**: 判断采集模式

#### 第2批节点-Part1（✅ 已完成）- 采集与去重层
- **Node-010-A**: 增量采集API（HTTP Request）
- **Node-010-B**: 全量采集API（分页循环）⭐
- **Node-011**: 数据清洗转换（1→N扩展）⭐
- **Node-012**: 判断是否去重（IF）
- **Node-013-A/B**: 第一次去重（ID精确匹配）⭐
- **Node-014**: 第二次去重（相似度检测）⭐
- **Node-015**: 合并去重分支
- **Node-009.5**: 返回循环

#### 第2批节点-Part2（✅ 已完成）- AI分析与收集层
- **Node-015**: DeepSeek AI分析（6维度智能分析）⭐
- **Node-016**: 合并AI结果（三层容错机制）⭐
- **Node-017**: 格式化输出（27列标准格式）⭐
- **Node-018**: 收集账号数据（账号级统计）
- **Node-018.5**: 更新采集进度（进度追踪）⭐

#### 第3批节点-Part1（✅ 已完成）- 数据写入与错误处理层
- **Node-019**: 写入视频数据到Sheets（批量写入27列）⭐
- **Node-020**: 写入账号数据到Sheets（批量写入17列）
- **Node-021-A**: 错误触发器（Error Trigger）
- **Node-021-B**: 格式化错误信息（6类错误×4个严重程度）⭐
- **Node-021-C**: 写入错误日志到Sheets（15列错误日志）

## 📁 项目结构

```
douyincaiju/
├── docs/                          # 设计文档
│   ├── deployment.md              # 完整部署指南
│   ├── n8n-import-guide.md        # n8n工作流导入指南
│   ├── batch2-nodes-guide.md      # 第2批-Part1实现指南（API采集+去重）
│   ├── batch2-part2-guide.md      # 第2批-Part2实现指南（AI分析+收集）
│   └── batch3-part1-guide.md      # 第3批-Part1实现指南（数据写入+错误处理）
├── workflows/                     # n8n工作流文件
│   ├── douyin-collector-batch1.json      # 第1批节点工作流
│   └── douyin-collector-complete.json    # 完整工作流（含第2批）
├── nodes/                         # 节点代码（JavaScript）
│   ├── node-003-parse-config.js          # 解析配置
│   ├── node-005-filter-accounts.js       # 筛选账号
│   ├── node-005.5-load-progress.js       # 加载进度
│   ├── node-005.6-smart-filter.js        # 智能过滤
│   ├── node-007-batch-info.js            # 批次信息
│   ├── node-008-smart-delay.js           # 智能延迟
│   ├── node-010b-full-api.js             # 全量API（第2批-Part1）
│   ├── node-011-data-cleaning.js         # 数据清洗（第2批-Part1）
│   ├── node-013b-id-dedup.js             # ID去重（第2批-Part1）
│   ├── node-014-similarity-dedup.js      # 相似度去重（第2批-Part1）
│   ├── node-016-merge-ai-results.js      # 合并AI结果（第2批-Part2）
│   ├── node-017-format-output.js         # 格式化输出（第2批-Part2）
│   ├── node-018-collect-accounts.js      # 收集账号数据（第2批-Part2）
│   └── node-021b-format-error.js         # 格式化错误信息（第3批-Part1）
├── templates/                     # 配置模板
│   └── google-sheets-template.md
├── QUICKSTART.md                  # 5分钟快速开始
└── README.md
```

## 🚀 快速开始

### 前置要求

- n8n 工作流引擎（v1.0+）
- Google Sheets API 访问权限
- TikHub API Key
- DeepSeek API Key（可选，用于AI分析）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/douyincaiju.git
cd douyincaiju
```

2. **配置 Google Sheets**
   - 复制 `templates/google-sheets-template.md` 中的表格模板
   - 创建以下工作表：
     - 运行配置
     - 监控账号列表
     - 采集进度
     - 视频数据

3. **导入 n8n 工作流**
```bash
# 在 n8n 界面中导入 workflows/douyin-collector.json
```

4. **配置凭证**
   - Google Sheets OAuth2
   - TikHub API Key
   - DeepSeek API Key

5. **启动工作流**
   - 增量模式：每天自动执行（9:00, 21:00）
   - 全量模式：手动触发

## 📊 核心特性

### 1. 智能断点续传 ⭐

- **账号级别精确恢复**：工作流中断后，从未完成的账号继续
- **失败重试机制**：自动重试失败账号，最多3次
- **指数退避算法**：失败后延迟时间指数增长，避免频繁重试

```javascript
// 重试延迟示例
第1次失败：延迟 6秒 (3×2¹)
第2次失败：延迟 12秒 (3×2²)
第3次失败：延迟 24秒 (3×2³)
```

### 2. 双模式采集

| 模式 | 触发方式 | 采集范围 | 质量阈值 | 使用场景 |
|------|---------|---------|---------|---------|
| **增量** | 定时自动 | 最近7天 | 点赞≥100 | 日常监控 |
| **全量** | 手动触发 | 全部历史 | 点赞≥1000 | 首次建库 |

### 3. 智能延迟控制

- **账号间延迟**：3秒（可配置）
- **批次间延迟**：10秒（每10个账号）
- **随机抖动**：±20%，模拟人类行为
- **指数退避**：失败后自动增加延迟

### 4. 数据质量保障

- **多维度过滤**：点赞数、播放量、互动率、时长
- **智能去重**：基于视频ID和内容相似度
- **AI内容分析**：使用DeepSeek分析视频质量和相关性

### 5. 双重去重机制 ⭐ (第2批新增)

#### 第一次去重：ID精确匹配
- 使用Map数据结构，O(1)时间复杂度
- 精确匹配历史视频ID
- 去重率：通常10-30%（取决于更新频率）

#### 第二次去重：相似度检测
- **Bigram分词**：将文本切分为2字词组
- **Jaccard相似度**：计算集合交并比
- **阈值控制**：默认80%相似度视为重复
- **性能优化**：限制比对1000条，跳过短文本

```javascript
// 示例：相似度计算
文本A: "今天天气真不错，适合出门散步"
文本B: "今天天气很不错，适合外出散步"

Bigram A: ['今天', '天天', '天气', '气真', '真不', '不错', ...]
Bigram B: ['今天', '天天', '天气', '气很', '很不', '不错', ...]

Jaccard相似度 = |A ∩ B| / |A ∪ B| = 85% → 判定为重复
```

### 6. API层智能采集 (第2批新增)

#### 增量模式（Node-010-A）
- 单次HTTP请求
- 时间范围：最近7天
- 返回最多20条视频
- API层过滤：点赞≥100，播放≥1000

#### 全量模式（Node-010-B）
- 分页循环请求（最多100页）
- 采集所有历史视频（最多2000条）
- API层过滤：点赞≥1000，播放≥10000
- 页间延迟：1-2秒随机
- 错误处理：首页失败抛错，后续页失败继续

### 7. 数据清洗转换 (第2批-Part1新增)

- **数据扩展**：1个账号 → N个视频（数据结构转换）
- **字段标准化**：40+标准字段输出
- **字幕合并**：将subtitle_infos数组合并为单个文本
- **互动率计算**：`(like + comment + share) / play`
- **元数据附加**：批次ID、采集时间、账号信息等

### 8. DeepSeek AI智能分析 ⭐ (第2批-Part2新增)

#### 6维度深度分析
- **内容类型**: 教程/产品展示/故事叙述/测评对比/直播带货
- **茶叶品类**: 绿茶/红茶/乌龙茶/普洱/白茶/花茶/综合
- **卖点信息**: 自动提取3-5个核心卖点
- **目标受众**: 年龄段、消费水平、兴趣特征
- **行动召唤**: 识别视频中的CTA（Call to Action）
- **质量评分**: 1-10分AI评分（内容专业度、信息价值、制作质量、吸引力）

#### 三层容错机制
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

#### 成本控制
- **单条视频**: $0.00007（0.007美分）
- **2000条视频**: $0.14（14美分）
- **每月120K条**: $8.4
- **极低成本**：适合大规模批量分析

### 9. 标准化输出 (第2批-Part2新增)

#### 27列标准格式
- **基础信息**（7列）: 视频ID、账号名称、视频标题、发布时间等
- **互动数据**（7列）: 播放量、点赞数、评论数、分享数、收藏数、互动率、点赞率
- **内容信息**（2列）: 视频文案、话题标签
- **AI分析结果**（6列）: 内容类型、茶叶品类、卖点信息、目标受众、行动召唤、AI质量评分
- **元数据**（5列）: 采集时间、批次ID、采集模式、是否重复、去重方法

#### 账号级统计
- 总计指标：总播放量、总点赞数、总评论数、总分享数、总收藏数
- 平均指标：平均播放量、平均点赞数、平均互动率、平均质量评分
- 内容分析：主要内容类型、主要茶叶品类
- 排序输出：按平均播放量降序

### 10. 批量数据写入 ⭐ (第3批-Part1新增)

#### 高性能批量写入
- **Node-019**: 批量写入视频数据（27列）
  - Auto-Map自动字段映射
  - 单次API调用写入所有数据
  - 2000条视频仅需3.1秒
  - 性能提升375倍（vs 逐条写入12.5分钟）

- **Node-020**: 批量写入账号统计（17列）
  - 账号级别聚合数据
  - 按平均播放量降序输出
  - 快速识别优质账号

#### Google Sheets配置
```javascript
// Auto-Map模式：自动匹配字段名与列名
操作: Append
数据模式: Auto-Map Columns
字段匹配: 自动识别JSON字段名
```

### 11. 智能错误处理系统 ⭐ (第3批-Part1新增)

#### 6大错误分类
1. **权限问题**: API Key无效、授权失败、访问被拒
2. **网络问题**: 连接超时、DNS错误、连接被拒
3. **配额限制**: API配额耗尽、请求频率超限
4. **资源不存在**: 文档未找到、Sheet不存在、列名错误
5. **数据格式错误**: JSON解析失败、字段格式错误、数据缺失
6. **其他错误**: 未分类的错误

#### 4级严重程度判定
- **Critical（致命）**: API认证失败、权限被拒 → 🚨 立即暂停工作流
- **High（严重）**: 数据写入失败、API错误 → ⚠️ 24小时内修复
- **Medium（中等）**: 超时、配额限制 → 稍后重试
- **Low（轻微）**: 临时性错误 → 自动恢复

#### 智能解决方案建议
```javascript
// 根据错误分类和严重程度自动生成解决建议
权限问题 + Critical:
  🚨 紧急处理：
  1. 检查Google账号权限
  2. 重新授权n8n
  3. 确认API Key有效
  建议：立即暂停工作流，修复后再启动

网络问题 + Medium:
  1. 检查网络连接
  2. 稍后重试
  3. 检查防火墙设置
```

#### 错误频率追踪
- 统计同类错误发生次数
- 频繁错误（≥3次）自动提升严重程度
- 15列详细错误日志（错误时间、节点、分类、严重程度、建议方案等）

#### Error Trigger自动捕获
- 捕获工作流中任何节点的错误
- 无需手动try-catch
- 自动记录上下文数据
- 异步处理不阻塞主流程

## 📖 详细文档

- **快速开始**
  - [5分钟快速开始](QUICKSTART.md) - 最快上手指南
  - [n8n工作流导入指南](docs/n8n-import-guide.md) - 工作流导入步骤
  - [部署指南](docs/deployment.md) - 完整部署流程

- **实现指南**
  - [第2批-Part1实现指南](docs/batch2-nodes-guide.md) - API采集与去重层详解
  - [第2批-Part2实现指南](docs/batch2-part2-guide.md) - AI分析与收集层详解
  - [第3批-Part1实现指南](docs/batch3-part1-guide.md) - 数据写入与错误处理层详解
  - [Google Sheets模板](templates/google-sheets-template.md) - 配置表结构

- **节点代码**
  - [nodes/](nodes/) - 所有节点的JavaScript代码

## 🔧 配置说明

### 运行配置参数

在 Google Sheets 的"运行配置"表中配置以下参数：

| 参数 | 说明 | 增量模式 | 全量模式 |
|------|------|---------|---------|
| mode | 采集模式 | incremental | full |
| videosPerAccount | 每账号采集数 | 20 | 2000 |
| minLikeCount | 最低点赞数 | 100 | 1000 |
| minPlayCount | 最低播放量 | 1000 | 10000 |
| daysToCrawl | 采集天数 | 7 | - |
| accountDelay | 账号间延迟(秒) | 3 | 3 |
| batchDelay | 批次间延迟(秒) | 10 | 10 |

## 📈 性能指标

- **采集速度**：100个账号约5-8分钟（增量模式）
- **成功率**：>95%（带重试机制）
- **断点恢复**：精确到账号级别
- **并发控制**：智能延迟，避免API限流

## 🛠️ 技术栈

- **工作流引擎**：n8n
- **数据存储**：Google Sheets
- **API服务**：TikHub API
- **AI分析**：DeepSeek API
- **开发语言**：JavaScript (ES6+)

## 📝 开发进度

- [x] 第1批节点实现（Node-001到Node-009）- 触发与控制层
- [x] 第2批-Part1节点实现（Node-010到Node-015）- API采集与去重层
- [x] 第2批-Part2节点实现（Node-015到Node-018.5）- AI分析与收集层
- [x] 第3批-Part1节点实现（Node-019到Node-021）- 数据写入与错误处理层
- [x] n8n工作流JSON生成（batch1 + complete）
- [x] 节点代码文件（14个JavaScript文件）
- [x] 部署文档（QUICKSTART + deployment + n8n-import）
- [x] 实现指南（batch2-nodes-guide + batch2-part2-guide + batch3-part1-guide）
- [x] 批量数据写入（Auto-Map模式，375倍性能提升）
- [x] 智能错误处理（6类错误×4级严重程度）
- [ ] 第3批-Part2节点实现（通知、清理、工作流结束）
- [ ] 完整的单元测试
- [ ] 性能优化与压力测试

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

[MIT License](LICENSE)

## 👤 作者

- 项目创建时间：2025-10-24
- 设计文档：第1批节点详细设计完成

## 🙏 致谢

- [n8n](https://n8n.io/) - 强大的工作流自动化平台
- [TikHub API](https://tikhub.io/) - 抖音数据接口
- [DeepSeek](https://www.deepseek.com/) - AI内容分析
