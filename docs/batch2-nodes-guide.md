# 第2批节点实现指南

## 概述

第2批节点实现了数据采集层和去重层，包含以下功能：
- TikHub API调用（增量/全量模式）
- 数据清洗与转换
- 两级去重机制（ID精确匹配 + 相似度检测）

## 节点列表

### Node-010-A: 增量采集API（HTTP Request）

**类型**: HTTP Request
**位置**: `2660, 480`

**配置**:
```yaml
URL: https://api.tikhub.io/api/v1/douyin/app/v1/fetch_user_post_videos
Method: GET
Authentication: HTTP Header Auth

Query Parameters:
  - sec_uid: {{ $json.secUid }}
  - count: 20
  - cursor: 0
  - filter_like_count_min: {{ $workflow.staticData.config.minLikeCount_incremental }}
  - filter_play_count_min: {{ $workflow.staticData.config.minPlayCount_incremental }}
  - max_time: {{ Math.floor(Date.now() / 1000) }}
  - min_time: {{ Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000) }}

Timeout: 30000ms
Response Format: JSON
```

**凭证配置**:
- 类型: HTTP Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_TIKHUB_API_KEY`

**功能**:
- 单次请求，返回最多20条视频
- 时间范围：最近7天
- API层过滤：点赞数≥100，播放量≥1000

---

### Node-010-B: 全量采集API（Code）

**类型**: Code
**位置**: `2660, 300`

**代码文件**: `nodes/node-010b-full-api.js`

**功能**:
- 分页循环请求（最多100页）
- 每页20条，总计最多2000条视频
- API层过滤：点赞数≥1000，播放量≥10000
- 页间延迟：1-2秒随机
- 错误处理：第一页失败抛错，后续页失败继续

**关键代码片段**:
```javascript
// 分页循环
while (hasMore && currentPage <= maxPages) {
  const response = await $http.request({
    method: 'GET',
    url: apiUrl,
    headers: { 'Authorization': `Bearer ${apiKey}` },
    timeout: 30000
  });

  allVideos = allVideos.concat(response.body.data.aweme_list);
  cursor = response.body.data.cursor;
  hasMore = response.body.data.has_more;

  currentPage++;
}
```

---

### Node-010-C: 合并API结果（Merge）

**类型**: Merge
**位置**: `2880, 390`

**配置**:
- Mode: Multiplex（合并输入）
- Input 1: Node-010-B（全量API）
- Input 2: Node-010-A（增量API）

---

### Node-011: 数据清洗与转换（Code）

**类型**: Code
**位置**: `3100, 390`

**代码文件**: `nodes/node-011-data-cleaning.js`

**功能**:
1. **数据扩展**: 1个账号 → N个视频（数据展开）
2. **字段清洗**: 提取和格式化关键字段
3. **字幕合并**: 将subtitle_infos数组合并为单个文本
4. **计算互动率**: `(like + comment + share) / play`
5. **添加元数据**: 批次ID、采集时间、账号信息等

**输出字段**（共40+字段）:
```javascript
{
  // 视频基本信息
  videoId: string,
  createTime: number,
  createTimeStr: string,
  desc: string,
  subtitleText: string,

  // 统计数据
  likeCount: number,
  commentCount: number,
  shareCount: number,
  playCount: number,
  collectCount: number,
  forwardCount: number,
  interactionRate: number,  // 计算字段

  // 视频元数据
  duration: number,
  width: number,
  height: number,
  playAddr: string,
  coverUrl: string,

  // 音乐信息
  musicId: string,
  musicTitle: string,
  musicAuthor: string,

  // 账号信息
  accountName: string,
  accountSecUid: string,
  accountCategory: string,

  // 采集信息
  collectionMode: 'incremental' | 'full',
  collectionTime: string,
  batchId: string,
  batchNumber: number
}
```

**关键函数**:
```javascript
// 合并字幕
function mergeSubtitles(subtitleInfos) {
  return subtitleInfos
    .map(item => item.utterances || [])
    .flat()
    .map(utterance => utterance.text)
    .join(' ');
}

// 计算互动率
function calculateInteractionRate(stats) {
  const playCount = parseInt(stats.play_count) || 0;
  if (playCount === 0) return 0;

  const interactions =
    parseInt(stats.digg_count) +
    parseInt(stats.comment_count) +
    parseInt(stats.share_count);

  return interactions / playCount;
}
```

---

### Node-012: 判断是否去重（IF）

**类型**: IF
**位置**: `3320, 390`

**配置**:
```yaml
Condition Type: Boolean
Value 1: {{ $workflow.staticData.config.enableDedup }}
Operation: equals
Value 2: true
```

**分支**:
- **true**: 执行去重（→ Node-013-A + Node-013-B）
- **false**: 跳过去重（→ Node-015）

---

### Node-013-A: 读取历史视频ID（Google Sheets）

**类型**: Google Sheets
**位置**: `3540, 300`

**配置**:
```yaml
Operation: Read
Sheet Name: 视频数据
Range: A2:A
```

**功能**:
- 仅读取第一列（视频ID）
- 用于后续ID精确匹配去重
- 性能优化：只读取必要列

---

### Node-013-B: 第一次去重-ID（Code）

**类型**: Code（多输入）
**位置**: `3760, 390`

**代码文件**: `nodes/node-013b-id-dedup.js`

**输入**:
- Input 1: 新视频（来自Node-011）
- Input 2: 历史视频ID（来自Node-013-A）

**功能**:
1. 将历史ID列表转换为Set（O(1)查找）
2. 遍历新视频，检查videoId是否在历史集合中
3. 过滤出唯一视频
4. 统计去重率

**关键代码**:
```javascript
// 构建历史ID集合
const historicalIds = new Set();
historicalInput.forEach(item => {
  const videoId = item.json['视频ID'] || item.json['videoId'];
  if (videoId) historicalIds.add(videoId.toString().trim());
});

// ID去重
const uniqueVideos = newVideos.filter(video => {
  return !historicalIds.has(video.videoId.toString().trim());
});
```

**性能**:
- 使用Map/Set: O(1)查找
- 适合大规模数据（10万+视频ID）

---

### Node-014: 第二次去重-相似度（Code）

**类型**: Code
**位置**: `3980, 390`

**代码文件**: `nodes/node-014-similarity-dedup.js`

**功能**:
1. **Bigram分词**: 将文本切分为2字词组
2. **Jaccard相似度**: 计算两个集合的交并比
3. **相似度检测**: 阈值80%
4. **性能优化**: 限制比对数量（最多1000条）

**算法示例**:
```javascript
// Bigram分词
'你好世界' → ['你好', '好世', '世界']

// Jaccard相似度
Set A: ['你好', '好世', '世界']
Set B: ['你好', '好朋', '朋友']
交集: ['你好']
并集: ['你好', '好世', '世界', '好朋', '朋友']
Jaccard = 1 / 5 = 0.2 = 20%
```

**关键函数**:
```javascript
// Bigram分词
function generateBigrams(text) {
  const bigrams = new Set();
  for (let i = 0; i < text.length - 1; i++) {
    bigrams.add(text.substring(i, i + 2));
  }
  return bigrams;
}

// Jaccard相似度
function calculateJaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}
```

**性能优化**:
- 限制比对数量：最多1000条历史数据
- 跳过短文本（<10字符）
- 提前终止：相似度≥阈值立即返回

---

### Node-015: 合并去重分支（Merge）

**类型**: Merge
**位置**: `4200, 390`

**功能**:
- 合并去重和跳过去重的两个分支
- 继续后续处理流程

---

### Node-009.5: 返回循环（Merge）

**类型**: Merge
**位置**: `4420, 390`

**功能**:
- 将当前账号的处理结果返回到Node-006（循环节点）
- 触发下一个账号的处理
- 所有账号处理完毕后，进入Node-999

---

## 数据流示意图

```
Node-009: 判断模式
     ├─[full]─→ Node-010-B: 全量API（分页循环）
     │                      ↓
     └─[incremental]─→ Node-010-A: 增量API（单次请求）
                            ↓
                      Node-010-C: 合并API结果
                            ↓
                      Node-011: 数据清洗（1→N扩展）
                            ↓
                      Node-012: 判断是否去重
                       ├─[true]─→ Node-013-A: 读历史ID
                       │          Node-013-B: ID去重（多输入）
                       │                ↓
                       │          Node-014: 相似度去重
                       │                ↓
                       │          Node-015: 合并分支 ←─┐
                       └─[false]──────────────────────┘
                                       ↓
                                 Node-009.5: 返回循环
                                       ↓
                                 Node-006: 下一个账号
```

## 配置清单

### 1. Google Sheets凭证
- OAuth2认证
- 权限：读写表格

### 2. TikHub API凭证
- HTTP Header Auth
- Header: `Authorization: Bearer YOUR_API_KEY`
- 获取地址: https://tikhub.io/

### 3. 必需的Google Sheets工作表
- **运行配置**: 包含tikhubApiKey等参数
- **监控账号列表**: 待采集账号
- **采集进度**: 断点续传数据
- **视频数据**: 历史视频ID（用于去重）

### 4. Config参数（需在"运行配置"表中配置）
```yaml
# API配置
tikhubApiKey: "your-api-key-here"

# 质量阈值（增量模式）
minLikeCount_incremental: 100
minPlayCount_incremental: 1000
minInteractionRate_incremental: 0.05

# 质量阈值（全量模式）
minLikeCount_full: 1000
minPlayCount_full: 10000
minInteractionRate_full: 0.03

# 采集配置
videosPerAccount: 200
daysToCrawl: 7

# 去重配置
enableDedup: TRUE
dedupDays: 30
similarityThreshold: 0.80
maxComparisonCount: 1000
```

## 测试步骤

### 1. 单元测试

#### 测试Node-010-A（增量API）
```javascript
// 手动触发，只处理1个账号
// 检查输出：
// - apiResult.success = true
// - apiResult.videosCount > 0
// - apiResult.videos数组包含视频数据
```

#### 测试Node-011（数据清洗）
```javascript
// 检查输出：
// - 1个账号扩展为N个视频item
// - 每个视频包含40+字段
// - subtitleText已合并
// - interactionRate已计算
```

#### 测试Node-013-B（ID去重）
```javascript
// 检查输出：
// - 重复视频已被过滤
// - deduplication.idDedup = true
// - 统计信息正确
```

#### 测试Node-014（相似度去重）
```javascript
// 检查输出：
// - 相似视频已被过滤
// - deduplication.similarityDedup = true
// - 相似度≥80%的视频被标记为重复
```

### 2. 集成测试

1. **准备测试数据**:
   - 监控账号列表: 添加2-3个测试账号
   - 历史视频数据: 添加一些已存在的视频ID

2. **执行工作流**:
   - 手动触发全量模式
   - 观察日志输出

3. **验证结果**:
   - 检查API调用成功
   - 检查数据清洗正确
   - 检查去重生效
   - 检查循环正常返回

### 3. 性能测试

- **小规模**: 10个账号 × 20视频 = 200条数据
- **中规模**: 50个账号 × 100视频 = 5000条数据
- **大规模**: 100个账号 × 200视频 = 20000条数据

**预期性能**:
- API请求: 1-3秒/页
- 数据清洗: <1秒/账号
- ID去重: <1秒（使用Map）
- 相似度去重: 10-30秒/账号（限制比对1000条）

## 常见问题

### Q1: TikHub API返回403错误
**A**: 检查API Key是否正确配置，确保在HTTP Header Auth凭证中设置。

### Q2: 数据清洗后视频数量为0
**A**: 检查API响应是否包含videos字段，查看console日志中的错误信息。

### Q3: 去重不生效
**A**:
1. 检查enableDedup=TRUE
2. 确保"视频数据"表包含历史视频ID
3. 检查Node-013-B的两个输入是否都连接正确

### Q4: 相似度去重太慢
**A**:
1. 减少maxComparisonCount（默认1000）
2. 提高similarityThreshold（默认0.80）
3. 考虑跳过短文本视频

### Q5: 循环不返回/卡住
**A**:
1. 检查Node-009.5的连接是否正确指向Node-006
2. 确保Split In Batches节点配置正确
3. 查看是否有节点抛出未捕获的异常

## 下一步

第2批节点已完成数据采集和去重功能，下一步可以实现：

- **Node-016-017**: AI分析（内容打标签、质量评分）
- **Node-018**: 格式化输出
- **Node-018.5**: 更新采集进度
- **Node-019**: 批量写入Google Sheets

参考第2批-Part2节点详细设计文档。
