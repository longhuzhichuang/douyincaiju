# n8n 工作流导入指南

## 📥 快速导入

### 1. 下载工作流文件

```bash
# 克隆项目
git clone https://github.com/longhuzhichuang/douyincaiju.git
cd douyincaiju

# 工作流文件位置
workflows/douyin-collector-batch1.json
```

### 2. 导入到 n8n

#### 方法A：通过界面导入（推荐）

1. **打开 n8n**
   - 访问你的 n8n 实例（如 `http://localhost:5678`）
   - 登录账号

2. **导入工作流**
   - 点击右上角菜单按钮（三个点）
   - 选择 "Import from File"
   - 选择 `douyin-collector-batch1.json`
   - 点击 "Import"

3. **验证导入**
   - 工作流名称：`抖音视频采集系统 - 第1批节点`
   - 节点数量：17个（包含占位节点）
   - 标签：`抖音采集`

#### 方法B：通过 CLI 导入

```bash
# 使用 n8n CLI
n8n import:workflow --input=workflows/douyin-collector-batch1.json

# 或者复制到 n8n 数据目录
cp workflows/douyin-collector-batch1.json ~/.n8n/workflows/
```

---

## ⚙️ 配置步骤

导入成功后，需要配置以下内容：

### 步骤1：配置 Google Sheets 凭证

所有Google Sheets节点需要配置OAuth2凭证：

1. **创建凭证**
   - 在n8n中，点击左侧"Credentials"
   - 点击"Add Credential"
   - 选择"Google Sheets OAuth2 API"

2. **填入配置**
   ```
   Client ID: YOUR_GOOGLE_CLIENT_ID
   Client Secret: YOUR_GOOGLE_CLIENT_SECRET
   ```

3. **授权**
   - 点击"Connect"
   - 登录Google账号
   - 授予权限

4. **应用到节点**
   - Node-002: 读取运行配置
   - Node-004: 读取监控账号
   - Node-005.5-A: 读取采集进度

### 步骤2：配置 Google Sheets URL

在以下3个节点中配置你的Google Sheets URL：

#### Node-002: 读取运行配置

```javascript
documentId: "你的表格URL或ID"
sheetName: "运行配置"
range: "A2:C18"  // 16行参数数据
```

#### Node-004: 读取监控账号

```javascript
documentId: "你的表格URL或ID"
sheetName: "监控账号列表"
range: "A2:E101"  // 100个账号
```

#### Node-005.5-A: 读取采集进度

```javascript
documentId: "你的表格URL或ID"
sheetName: "采集进度"
range: "A2:H"  // 动态行数，读取所有历史记录
```

**如何获取表格URL：**
```
1. 打开你的Google Sheets
2. 复制浏览器地址栏的URL
3. 格式：https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
4. 可以粘贴完整URL，n8n会自动提取ID
```

### 步骤3：配置定时触发器（可选）

**Node-001-A: 定时触发**

默认配置：
- 每天 9:00 执行
- 每天 21:00 执行
- 时区：Asia/Shanghai

如需修改：
1. 打开 Node-001-A
2. 修改 "Trigger Times"
3. 调整时区（如需要）

### 步骤4：激活工作流

配置完成后：
1. 点击右上角 "Inactive" 按钮
2. 切换为 "Active"
3. 定时触发器开始工作

---

## 🧪 测试工作流

### 首次测试

在激活定时器之前，建议先手动测试：

#### 测试步骤1：准备测试数据

1. **配置Google Sheets**
   - 按照 [templates/google-sheets-template.md](../templates/google-sheets-template.md) 创建表格
   - 在"运行配置"中设置：
     ```
     mode = incremental
     videosPerAccount = 5  （测试用，减少数据量）
     ```
   - 在"监控账号列表"中只启用2-3个账号

2. **清空进度表**
   - 确保"采集进度"表为空（只保留表头）
   - 这样可以测试首次采集场景

#### 测试步骤2：手动执行

1. **使用手动触发器**
   - 点击工作流中的 "001-B: 手动触发(全量模式)" 节点
   - 点击 "Execute Node" 或 "Execute Workflow"

2. **观察执行过程**
   - 查看每个节点的执行状态（绿色=成功）
   - 点击节点查看输出数据
   - 检查控制台日志

3. **验证输出**
   - Node-003：检查config对象是否正确解析
   - Node-005：检查启用账号数量
   - Node-005.6：检查过滤后的账号数量
   - Node-007：检查批次计算是否正确
   - Node-008：检查延迟是否执行

#### 测试步骤3：验证第1批功能

由于第2批节点（API调用等）尚未实现，当前工作流会在占位节点处停止。

**预期结果：**
- ✅ 所有第1批节点（Node-001到Node-009）成功执行
- ✅ 日志输出清晰，包含账号信息、批次信息、延迟信息
- ✅ 到达 "第1批完成标记" 节点
- ℹ️  占位节点显示 "待实现" 消息

---

## 📊 节点说明

### 已实现的功能节点

| 节点ID | 节点名称 | 类型 | 功能 |
|--------|---------|------|------|
| 001-A | 定时触发(增量模式) | Schedule Trigger | 每天9:00和21:00自动触发 |
| 001-B | 手动触发(全量模式) | Manual Trigger | 手动执行工作流 |
| 002 | 读取运行配置 | Google Sheets | 读取16个系统参数 |
| 003 | 解析配置 ⭐ | Code | 类型转换、验证、存储到static data |
| 004 | 读取监控账号 | Google Sheets | 读取100个抖音账号 |
| 005 | 筛选启用账号 | Code | 过滤、清洗、格式化 |
| 005.5-A | 读取采集进度 | Google Sheets | 读取历史执行状态 |
| 005.5-B | 合并采集进度 ⭐ | Code | 断点续传核心逻辑 |
| 005.6 | 智能过滤与重试 ⭐ | Code | 根据mode和status决定是否处理 |
| 006 | 循环账号 | Split In Batches | 逐个处理账号 |
| 007 | 计算批次信息 | Code | 批次编号、进度百分比 |
| 008 | 智能延迟 ⭐ | Code | 指数退避、随机抖动 |
| 009 | 判断采集模式 | IF | 分流到增量/全量分支 |

### 占位节点（第2批实现）

| 节点ID | 节点名称 | 说明 |
|--------|---------|------|
| 010-A | 增量采集API | TikHub API调用（增量） |
| 010-B | 全量采集API | TikHub API调用（全量） |
| - | 合并分支 | 合并两个分支的输出 |
| - | 第1批完成标记 | 标记第1批完成 |

---

## 🔍 节点连接关系

```
触发器（001-A/001-B）
    ↓
读取运行配置（002）
    ↓
解析配置（003）⭐ [存储到static data]
    ↓
读取监控账号（004）
    ↓
    ├─→ 筛选启用账号（005）
    │        ↓
    └─→ 读取采集进度（005.5-A）
             ↓
        合并采集进度（005.5-B）⭐ [多输入节点]
             ↓
        智能过滤与重试（005.6）⭐
             ↓
        循环账号（006）─────────┐
             │                  │
             ↓                  │
        [循环体开始]            │
             ↓                  │
        计算批次信息（007）     │
             ↓                  │
        智能延迟（008）⭐       │
             ↓                  │
        判断采集模式（009）     │
           ↙    ↘              │
    增量API    全量API         │
      (010-A)   (010-B)        │
           ↘    ↙              │
        合并分支               │
             │                  │
        [循环体结束]───────────┘
             ↓
        第1批完成标记
```

---

## 🐛 常见问题

### Q1: 导入后节点显示错误

**症状：** 某些节点显示红色错误图标

**解决方案：**
1. 检查节点类型版本是否兼容（需要n8n v1.0+）
2. 检查Code节点的JavaScript语法
3. 尝试重新配置该节点

### Q2: Google Sheets节点无法连接

**症状：** "Authentication failed" 错误

**解决方案：**
1. 重新创建Google Sheets OAuth2凭证
2. 确保表格已共享给OAuth2使用的Google账号
3. 检查API是否启用（Google Sheets API）

### Q3: 节点名称引用错误

**症状：** Code节点中`$('Node-XXX')`找不到节点

**解决方案：**
1. 确保节点名称与代码中的完全一致
2. 特别注意空格和标点符号
3. 在n8n中双击节点查看准确名称

### Q4: static data无法访问

**症状：** `$workflow.staticData.config` 为 undefined

**解决方案：**
1. 确保Node-003（解析配置）已成功执行
2. 检查Node-003的代码是否正确存储config
3. 查看Node-003的执行日志

### Q5: 循环节点不执行

**症状：** Node-006（循环账号）没有输出

**解决方案：**
1. 检查Node-005.6的输出是否为空数组
2. 如果所有账号都被过滤，循环不会执行（这是正常的）
3. 在"监控账号列表"中启用更多账号

---

## 📝 配置检查清单

导入和配置完成后，请检查以下项目：

### Google Sheets配置
- [ ] 已创建"运行配置"工作表，填入16个参数
- [ ] 已创建"监控账号列表"工作表，至少5个账号
- [ ] 已创建"采集进度"工作表（保留表头即可）
- [ ] 已创建"视频数据"工作表（保留表头即可）

### n8n凭证配置
- [ ] 已创建Google Sheets OAuth2凭证
- [ ] 已在3个Google Sheets节点中应用凭证
- [ ] 已测试凭证是否有效

### 节点配置
- [ ] Node-002: documentId已填入
- [ ] Node-004: documentId已填入
- [ ] Node-005.5-A: documentId已填入
- [ ] 所有Code节点代码完整无误

### 测试验证
- [ ] 手动执行测试成功
- [ ] 节点输出数据正确
- [ ] 日志信息清晰
- [ ] 没有错误节点

### 定时触发
- [ ] 定时触发器时间配置正确
- [ ] 时区设置为Asia/Shanghai
- [ ] 工作流已激活

完成以上所有检查后，系统即可正常运行！

---

## 🎯 下一步

### 立即可做

1. **测试第1批节点**
   - 按照上述测试步骤执行
   - 验证所有功能正常

2. **调整配置参数**
   - 根据实际情况调整延迟时间
   - 调整质量阈值

3. **扩展账号列表**
   - 测试成功后，逐步增加账号数量

### 待开发（第2批）

4. **实现Node-010（API调用）**
   - 集成TikHub API
   - 实现增量和全量两种模式

5. **实现数据处理节点**
   - Node-011: 数据清洗
   - Node-012-014: 去重
   - Node-015-016: AI分析

6. **实现数据写入节点**
   - Node-017: 格式化输出
   - Node-018: 批量收集
   - Node-018.5: 更新采集进度

---

## 📞 获取帮助

- **项目文档**：[README.md](../README.md)
- **部署指南**：[deployment.md](deployment.md)
- **设计文档**：[batch1-design.md](batch1-design.md)
- **GitHub Issues**：提交问题和反馈

---

## ✅ 导入成功标志

导入和配置正确后，你应该看到：

1. **工作流画布**
   - 17个节点整齐排列
   - 节点之间用线连接
   - 有两个触发器（定时和手动）

2. **节点状态**
   - 所有节点无红色错误图标
   - Google Sheets节点显示凭证已配置
   - Code节点代码完整

3. **测试执行**
   - 手动触发能成功执行
   - 所有节点变为绿色
   - 日志输出正常

如果以上都满足，恭喜你成功导入工作流！🎉
