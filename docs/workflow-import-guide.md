# 抖音视频采集系统 - 完整工作流导入指南

> **版本**: 1.0.0
> **更新日期**: 2025-10-24
> **适用**: n8n v1.0+

---

## 📋 目录

- [快速导入](#快速导入)
- [配置要求](#配置要求)
- [节点代码配置](#节点代码配置)
- [凭证配置](#凭证配置)
- [Google Sheets设置](#google-sheets设置)
- [测试验证](#测试验证)
- [常见问题](#常见问题)

---

## 快速导入

### 1. 导入工作流JSON

**步骤**：

1. 登录n8n管理界面
2. 点击右上角 "+" → "Import from File"
3. 选择文件：`workflows/douyin-collector-full.json`
4. 点击 "Import"

**预期结果**：
- ✅ 导入成功，显示25个节点
- ⚠️ 部分节点显示红色（缺少凭证）
- ⚠️ 部分Code节点需要修改

---

## 配置要求

### 系统要求

```yaml
n8n版本: >= 1.0.0
Node.js: >= 18.0.0
内存: >= 2GB
磁盘: >= 500MB（用于日志）
```

### API服务要求

| 服务 | 用途 | 获取方式 | 月度成本 |
|------|------|---------|---------|
| TikHub API | 抖音数据采集 | https://tikhub.io | $0-50 |
| DeepSeek API | AI内容分析 | https://deepseek.com | $8-12 |
| Google Sheets | 数据存储 | Google Cloud | 免费 |
| SMTP服务 | 邮件通知 | Gmail/SendGrid | 免费-$10 |

### 可选服务

| 服务 | 用途 | 获取方式 |
|------|------|---------|
| 企业微信 | 即时通知 | 企业微信后台 |
| Webhook | 系统集成 | 自定义接收端 |

---

## 节点代码配置

工作流中的Code节点使用了文件系统加载方式，需要根据您的部署环境进行调整：

### 方案A：使用文件系统（推荐本地部署）

如果您的n8n部署可以访问文件系统（如Docker挂载、本地安装），保持当前配置：

```javascript
// Code节点中的代码
const fs = require('fs');
const code = fs.readFileSync('/home/user/douyincaiju/nodes/node-003-parse-config.js', 'utf8');
eval(code);
```

**配置步骤**：

1. 将整个`douyincaiju`项目克隆到服务器
2. 确保n8n可以访问该目录
3. 修改所有Code节点中的文件路径为实际路径

**Docker部署示例**：

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v /path/to/douyincaiju:/data/douyincaiju \
  n8nio/n8n
```

### 方案B：直接嵌入代码（推荐云部署）

如果使用n8n Cloud或无文件系统访问权限，需要将代码直接复制到每个Code节点：

**操作步骤**：

1. 打开对应的代码文件（如`nodes/node-003-parse-config.js`）
2. 复制全部内容
3. 在n8n中打开对应的Code节点
4. 删除文件加载代码，直接粘贴完整代码

**示例 - Node-003**：

```javascript
// 删除这些行：
const fs = require('fs');
const code = fs.readFileSync('/home/user/douyincaiju/nodes/node-003-parse-config.js', 'utf8');
eval(code);

// 替换为node-003-parse-config.js的完整代码：
// ============================================
// Node-003: 解析配置
// ============================================

const config = $input.first().json;

// 参数验证
if (!config.mode) {
  throw new Error('缺少采集模式参数 (mode)');
}

// ... 复制完整代码 ...
```

**需要修改的Code节点列表**：

```
✅ Node-003: 解析配置
✅ Node-005: 筛选启用账号
✅ Node-005.6: 智能过滤
✅ Node-007: 计算批次信息
✅ Node-008: 智能延迟
✅ Node-010-B: 全量采集API
✅ Node-011: 数据清洗
✅ Node-013-B: ID去重
✅ Node-014: 相似度去重
✅ Node-017: 合并AI结果
✅ Node-018: 格式化输出
✅ Node-019: 收集账号数据
✅ Node-021-B: 格式化错误
✅ Node-022-A: 构建邮件内容
✅ Node-022-B: 构建企业微信消息
✅ Node-022-C: 构建Webhook数据
✅ Node-024: 清理临时数据
✅ Node-025: 工作流结束
```

---

## 凭证配置

### 1. Google Sheets OAuth2

**步骤**：

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目或选择现有项目
3. 启用 "Google Sheets API"
4. 创建 OAuth 2.0 客户端ID
5. 下载凭证JSON文件

**在n8n中配置**：

1. 点击 "Credentials" → "New"
2. 选择 "Google Sheets OAuth2 API"
3. 输入名称：`Google Sheets account`
4. 上传凭证JSON或手动输入：
   - Client ID
   - Client Secret
5. 点击 "Connect my account"
6. 授权访问
7. 保存

**需要配置的节点**：
```
✅ Node-002: 读取运行配置
✅ Node-004: 读取监控账号
✅ Node-005.5: 读取采集进度
✅ Node-013-A: 读取已有视频ID
✅ Node-018.5: 更新采集进度
✅ Node-020: 写入视频数据
✅ Node-021: 写入账号数据
✅ Node-021-C: 写入错误日志
```

### 2. TikHub API

**步骤**：

1. 访问 https://tikhub.io
2. 注册账号
3. 购买套餐或使用免费额度
4. 获取API Key

**在n8n中配置**：

1. 点击 "Credentials" → "New"
2. 选择 "HTTP Header Auth"
3. 输入名称：`TikHub API`
4. Header Name: `Authorization`
5. Header Value: `Bearer YOUR_API_KEY`
6. 保存

**需要配置的节点**：
```
✅ Node-010-A: 增量采集API
✅ Node-010-B: 全量采集API（如果使用HTTP Request方式）
```

### 3. DeepSeek API

**步骤**：

1. 访问 https://platform.deepseek.com
2. 注册账号
3. 充值（建议$10起）
4. 获取API Key

**在n8n中配置**：

1. 点击 "Credentials" → "New"
2. 选择 "HTTP Header Auth"
3. 输入名称：`DeepSeek API`
4. Header Name: `Authorization`
5. Header Value: `Bearer YOUR_API_KEY`
6. 保存

**需要配置的节点**：
```
✅ Node-016: DeepSeek AI分析
```

### 4. SMTP（邮件发送）

**使用Gmail**：

1. 登录Gmail账号
2. 启用两步验证
3. 生成应用专用密码：
   - 访问 https://myaccount.google.com/security
   - 找到 "App passwords"
   - 创建新密码（选择 Mail → Other）
   - 复制16位密码

**在n8n中配置**：

1. 点击 "Credentials" → "New"
2. 选择 "SMTP"
3. 输入名称：`SMTP account`
4. 配置：
   ```
   Host: smtp.gmail.com
   Port: 465
   SSL/TLS: Yes
   User: your-email@gmail.com
   Password: [16位应用专用密码]
   ```
5. 保存

**需要配置的节点**：
```
✅ Node-022-A: 发送邮件
```

### 5. 企业微信Webhook（可选）

**步骤**：

1. 登录企业微信管理后台
2. 进入目标群聊
3. 添加群机器人
4. 复制Webhook URL

**在n8n中配置**：

1. 打开 "Node-022-B: 发送企业微信" 节点
2. 修改URL参数：
   ```
   https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY
   ```
3. 将 `YOUR_KEY` 替换为实际的Key

**无需创建凭证**（URL中包含认证信息）

### 6. 自定义Webhook（可选）

**在n8n中配置**：

1. 点击 "Credentials" → "New"
2. 选择 "HTTP Header Auth"
3. 输入名称：`Webhook API`
4. 配置认证信息（根据您的系统）
5. 保存

**修改节点**：

1. 打开 "Node-022-C: 发送Webhook" 节点
2. 修改URL为实际接收端地址
3. 选择刚创建的凭证

---

## Google Sheets设置

### 1. 创建Google Sheets文档

**步骤**：

1. 访问 https://sheets.google.com
2. 创建新的电子表格
3. 命名为：`抖音视频采集系统`
4. 复制Spreadsheet ID（URL中的部分）
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 2. 创建工作表

**需要创建的工作表**（按顺序）：

#### Sheet 1: 运行配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| mode | incremental | 采集模式（incremental/full） |
| videosPerAccount | 20 | 每账号采集视频数 |
| minLikeCount | 100 | 最低点赞数 |
| minPlayCount | 1000 | 最低播放量 |
| daysToCrawl | 7 | 采集天数（增量模式） |
| accountDelay | 3 | 账号间延迟（秒） |
| batchDelay | 10 | 批次间延迟（秒） |
| batchSize | 10 | 批次大小 |
| enableDeduplication | TRUE | 是否启用去重 |
| dedupDays | 3 | 去重天数 |
| similarityThreshold | 0.85 | 相似度阈值 |

#### Sheet 2: 监控账号列表

| 账号名称 | 账号ID | sec_user_id | 账号类别 | 是否启用 | 备注 |
|---------|--------|-------------|---------|---------|------|
| 茶叶小铺 | 123456 | MS4wLjAB... | 茶商 | TRUE | 主推账号 |

#### Sheet 3: 采集进度

| 批次ID | 账号名称 | 账号ID | 开始时间 | 结束时间 | 采集视频数 | 新视频数 | 重复视频数 | 状态 |
|--------|---------|--------|---------|---------|-----------|---------|-----------|------|
| 自动填充 | 自动填充 | 自动填充 | 自动填充 | 自动填充 | 自动填充 | 自动填充 | 自动填充 | 自动填充 |

#### Sheet 4: 视频数据

创建27列，列名为：
```
视频ID, 账号名称, 账号类别, 视频标题, 发布时间, 视频时长(秒), 视频链接,
播放量, 点赞数, 评论数, 分享数, 收藏数, 互动率(%), 点赞率(%),
视频文案, 话题标签,
内容类型, 茶叶品类, 卖点信息, 目标受众, 行动召唤, AI质量评分,
采集时间, 批次ID, 采集模式, 是否重复, 去重方法
```

#### Sheet 5: 账号统计

创建17列，列名为：
```
账号名称, 账号ID, 账号类别, 视频数量,
总播放量, 总点赞数, 总评论数, 总分享数, 总收藏数,
平均播放量, 平均点赞数, 平均互动率, 平均质量评分,
主要内容类型, 主要茶叶品类, 统计时间, 批次ID
```

#### Sheet 6: 错误日志

创建15列，列名为：
```
错误时间, 批次ID, 错误节点, 节点类型, 错误分类, 严重程度,
错误消息, 建议修复方案, 错误发生次数, 错误堆栈,
上下文数据, 工作流ID, 执行ID, 是否已修复, 修复时间
```

### 3. 配置Spreadsheet ID

**在工作流中查找并替换**：

1. 在n8n中打开工作流
2. 搜索 `YOUR_SPREADSHEET_ID`（会找到多处）
3. 全部替换为实际的Spreadsheet ID

**或者手动修改每个Google Sheets节点**：

1. 打开节点
2. 在 "Document" 字段选择您的表格
3. 在 "Sheet" 字段选择对应的工作表
4. 保存

---

## 测试验证

### 1. 测试配置读取

**步骤**：

1. 确保Google Sheets配置完成
2. 在n8n中打开工作流
3. 点击 "Node-002: 读取运行配置"
4. 点击 "Test step"
5. 验证输出包含配置数据

**预期输出**：
```json
[
  {
    "参数名": "mode",
    "参数值": "incremental",
    "说明": "采集模式"
  },
  ...
]
```

### 2. 测试配置解析

**步骤**：

1. 点击 "Node-003: 解析配置"
2. 点击 "Test step"
3. 验证输出包含解析后的配置

**预期输出**：
```json
{
  "mode": "incremental",
  "videosPerAccount": 20,
  "minLikeCount": 100,
  ...
}
```

### 3. 测试账号读取

**步骤**：

1. 在监控账号列表中添加测试账号
2. 点击 "Node-004: 读取监控账号"
3. 点击 "Test step"
4. 验证读取到账号数据

### 4. 测试API调用

**步骤**：

1. 确保TikHub API凭证配置正确
2. 点击 "Node-010-A: 增量采集API"
3. 点击 "Test step"
4. 验证返回视频数据

**如果失败**：
- 检查API Key是否正确
- 检查API配额是否充足
- 检查sec_user_id是否有效

### 5. 测试完整流程

**步骤**：

1. 点击工作流右上角的 "Execute Workflow"
2. 选择 "Manual"
3. 观察执行过程
4. 检查每个节点的输出
5. 验证数据写入Google Sheets

**检查项**：
- ✅ 所有节点执行成功（绿色）
- ✅ 视频数据写入到 "视频数据" 表
- ✅ 账号统计写入到 "账号统计" 表
- ✅ 采集进度更新
- ✅ 收到通知（邮件/企业微信）

---

## 常见问题

### Q1: 导入后部分节点显示错误？

**原因**：缺少凭证配置

**解决**：
1. 检查所有红色节点
2. 按照上面的凭证配置章节配置
3. 重新打开节点，选择凭证
4. 保存

### Q2: Code节点报错 "Cannot read property of undefined"？

**原因**：文件系统路径不正确或无访问权限

**解决**：
- **方案1**: 修改文件路径为实际路径
- **方案2**: 使用直接嵌入代码的方式（见上文）

### Q3: Google Sheets连接失败？

**原因**：OAuth2授权问题

**解决**：
1. 重新创建Google Sheets凭证
2. 确保启用了Google Sheets API
3. 检查OAuth2重定向URI配置
4. 重新授权

### Q4: TikHub API返回401错误？

**原因**：API Key无效或过期

**解决**：
1. 登录TikHub检查API Key
2. 检查API配额是否充足
3. 重新生成API Key
4. 更新n8n凭证

### Q5: DeepSeek AI分析失败？

**原因**：API配额不足或请求格式错误

**解决**：
1. 检查DeepSeek账户余额
2. 检查API Key是否正确
3. 验证请求格式（JSON格式）
4. 检查网络连接

### Q6: 邮件发送失败？

**原因**：SMTP配置错误或Google安全限制

**解决**：
1. 确认使用应用专用密码（不是普通密码）
2. 检查端口（Gmail使用465）
3. 启用SSL/TLS
4. 检查Gmail安全设置

### Q7: 工作流执行缓慢？

**原因**：
- 处理视频数量多
- API响应慢
- DeepSeek AI分析耗时

**优化**：
1. 减少 `videosPerAccount` 参数
2. 增加 `accountDelay` 避免限流
3. 使用增量模式代替全量模式
4. 考虑禁用部分非必需的AI分析

### Q8: 如何修改定时执行时间？

**步骤**：

1. 打开 "Node-001-A: 定时触发"
2. 修改 Cron Expression
3. 当前配置：`0 9,21 * * *`（每天9:00和21:00）
4. 修改示例：
   - 每天12:00: `0 12 * * *`
   - 每6小时: `0 */6 * * *`
   - 每周一9:00: `0 9 * * 1`

### Q9: 如何查看历史执行记录？

**步骤**：

1. 在n8n中打开工作流
2. 点击顶部的 "Executions"
3. 查看所有历史执行
4. 点击任意执行查看详情
5. 可以看到每个节点的输入输出

### Q10: 如何备份工作流？

**方法1 - 导出JSON**：
1. 打开工作流
2. 点击右上角 "..." → "Download"
3. 保存JSON文件

**方法2 - 复制工作流**：
1. 打开工作流
2. 点击 "..." → "Duplicate"
3. 重命名为备份版本

**方法3 - Git版本控制**：
1. 定期导出JSON
2. 提交到Git仓库
3. 记录变更历史

---

## 下一步

完成配置后，您可以：

1. **设置定时执行**：每天自动采集
2. **监控执行状态**：通过邮件/企业微信接收通知
3. **分析采集数据**：使用Google Sheets或BI工具
4. **优化参数**：根据实际情况调整配置
5. **扩展功能**：添加新的分析维度或通知渠道

---

**🎉 恭喜！您已经完成了工作流的配置！**

如有问题，请参考：
- [第2批-Part1实现指南](./batch2-nodes-guide.md)
- [第2批-Part2实现指南](./batch2-part2-guide.md)
- [第3批-Part1实现指南](./batch3-part1-guide.md)
- [第3批-Part2实现指南](./batch3-part2-guide.md)
