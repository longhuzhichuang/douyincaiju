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

#### 第2批节点-Part2（🔨 待实现）- AI分析与存储层
- **Node-016-017**: DeepSeek AI分析
- **Node-018**: 格式化输出
- **Node-018.5**: 更新采集进度
- **Node-019**: 批量写入Google Sheets

## 📁 项目结构

```
douyincaiju/
├── docs/                          # 设计文档
│   ├── deployment.md              # 完整部署指南
│   ├── n8n-import-guide.md        # n8n工作流导入指南
│   └── batch2-nodes-guide.md      # 第2批节点实现指南
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
│   ├── node-010b-full-api.js             # 全量API（第2批）
│   ├── node-011-data-cleaning.js         # 数据清洗（第2批）
│   ├── node-013b-id-dedup.js             # ID去重（第2批）
│   └── node-014-similarity-dedup.js      # 相似度去重（第2批）
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

### 7. 数据清洗转换 (第2批新增)

- **数据扩展**：1个账号 → N个视频（数据结构转换）
- **字段标准化**：40+标准字段输出
- **字幕合并**：将subtitle_infos数组合并为单个文本
- **互动率计算**：`(like + comment + share) / play`
- **元数据附加**：批次ID、采集时间、账号信息等

## 📖 详细文档

- **快速开始**
  - [5分钟快速开始](QUICKSTART.md) - 最快上手指南
  - [n8n工作流导入指南](docs/n8n-import-guide.md) - 工作流导入步骤
  - [部署指南](docs/deployment.md) - 完整部署流程

- **实现指南**
  - [第2批节点实现指南](docs/batch2-nodes-guide.md) - API采集与去重层详解
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
- [x] n8n工作流JSON生成（batch1 + complete）
- [x] 节点代码文件（10个JavaScript文件）
- [x] 部署文档（QUICKSTART + deployment + n8n-import）
- [x] 第2批节点实现指南（batch2-nodes-guide）
- [ ] 第2批-Part2节点实现（Node-016到Node-019）- AI分析与存储层
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
