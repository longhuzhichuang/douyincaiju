# 部署指南

## 📋 部署前准备

### 1. 环境要求

- **n8n 版本**：v1.0 或更高
- **Node.js**：v18.0 或更高（如果自托管n8n）
- **Google 账号**：用于 Google Sheets API
- **TikHub API Key**：[注册获取](https://tikhub.io/)
- **DeepSeek API Key**（可选）：[注册获取](https://www.deepseek.com/)

### 2. n8n 安装选项

#### 选项A：n8n Cloud（推荐新手）

1. 访问 [n8n.cloud](https://n8n.cloud)
2. 注册账号并创建工作区
3. 直接在云端使用，无需本地安装

#### 选项B：Docker部署（推荐）

```bash
# 1. 安装Docker（如果未安装）
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. 启动n8n容器
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# 访问 http://localhost:5678
```

#### 选项C：npm全局安装

```bash
# 1. 安装n8n
npm install n8n -g

# 2. 启动n8n
n8n

# 访问 http://localhost:5678
```

---

## 🔧 配置步骤

### 步骤1：创建 Google Sheets

1. **创建新的 Google Sheets 文档**
   - 访问 [Google Sheets](https://sheets.google.com)
   - 创建新文档，命名为"抖音视频采集系统"

2. **创建4个工作表**
   - `运行配置`
   - `监控账号列表`
   - `采集进度`
   - `视频数据`

3. **填充数据**
   - 按照 [templates/google-sheets-template.md](../templates/google-sheets-template.md) 填充数据
   - 至少配置5个测试账号

4. **获取表格ID**
   ```
   URL格式：https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   复制 {SHEET_ID} 部分
   ```

### 步骤2：配置 Google Sheets API

#### 方法A：使用 OAuth2（推荐）

1. **创建 Google Cloud 项目**
   - 访问 [Google Cloud Console](https://console.cloud.google.com)
   - 创建新项目或选择现有项目

2. **启用 Google Sheets API**
   - 导航到"API和服务" > "库"
   - 搜索"Google Sheets API"
   - 点击"启用"

3. **创建 OAuth2 凭证**
   - 导航到"API和服务" > "凭据"
   - 点击"创建凭据" > "OAuth 客户端ID"
   - 应用类型：Web应用
   - 授权重定向URI：`http://localhost:5678/rest/oauth2-credential/callback`
   - 记录 Client ID 和 Client Secret

4. **在 n8n 中配置**
   - 打开n8n界面
   - 导航到"Credentials" > "New"
   - 选择"Google Sheets OAuth2 API"
   - 输入 Client ID 和 Client Secret
   - 点击"Connect"完成授权

#### 方法B：使用服务账号（适合生产环境）

1. 创建服务账号
2. 下载JSON密钥文件
3. 在n8n中配置服务账号凭证
4. 在Google Sheets中共享表格给服务账号邮箱

### 步骤3：配置 TikHub API

1. **获取 API Key**
   - 访问 [TikHub](https://tikhub.io/)
   - 注册账号并订阅套餐
   - 在控制台获取 API Key

2. **在 n8n 中配置**
   - 导航到"Credentials" > "New"
   - 选择"Header Auth"
   - 设置：
     - Name: `Authorization`
     - Value: `Bearer YOUR_API_KEY`

### 步骤4：导入工作流

1. **下载工作流文件**
   ```bash
   # 克隆项目
   git clone https://github.com/yourusername/douyincaiju.git
   cd douyincaiju
   ```

2. **导入到 n8n**
   - 打开n8n界面
   - 点击右上角菜单 > "Import from File"
   - 选择 `workflows/douyin-collector.json`
   - 点击"Import"

3. **配置节点**
   - Node-002（读取运行配置）：
     - 选择 Google Sheets 凭证
     - 输入 Sheet ID
     - 工作表名称：`运行配置`

   - Node-004（读取监控账号）：
     - 选择 Google Sheets 凭证
     - 输入 Sheet ID
     - 工作表名称：`监控账号列表`

   - Node-005.5-A（读取采集进度）：
     - 选择 Google Sheets 凭证
     - 输入 Sheet ID
     - 工作表名称：`采集进度`

### 步骤5：测试工作流

1. **配置测试参数**
   - 在Google Sheets的"运行配置"中：
     - 设置 `mode = incremental`
     - 设置 `videosPerAccount = 5`（测试用）

   - 在"监控账号列表"中：
     - 只启用2-3个账号进行测试

2. **手动测试**
   - 在n8n中点击"Execute Workflow"
   - 观察执行过程
   - 检查每个节点的输出

3. **验证结果**
   - 检查"采集进度"表是否有更新
   - 检查"视频数据"表是否有数据
   - 验证数据的完整性和准确性

---

## 🚀 投入生产

### 1. 激活定时触发

1. **检查触发器配置**
   - Node-001-A（定时触发）
   - 时区：Asia/Shanghai
   - 时间：09:00, 21:00

2. **激活工作流**
   - 点击右上角"Inactive"切换为"Active"
   - 工作流将在设定时间自动执行

### 2. 扩展账号列表

1. 在测试成功后，逐步增加账号数量：
   - 第一周：10-20个账号
   - 第二周：30-50个账号
   - 第三周：50-100个账号

2. 监控系统性能和API配额使用情况

### 3. 调整配置参数

根据实际情况调整"运行配置"中的参数：

```
# 延迟调整（如果遇到限流）
accountDelay: 3 → 5
batchDelay: 10 → 15

# 质量阈值调整（如果数据过多/过少）
minLikeCount_incremental: 100 → 200
minPlayCount_incremental: 1000 → 2000
```

---

## 🔒 安全建议

### 1. 凭证管理

- ❌ 不要在代码中硬编码API密钥
- ✅ 使用n8n的Credentials管理
- ✅ 定期轮换API密钥
- ✅ 使用环境变量存储敏感信息

### 2. Google Sheets 权限

- 只授予必要的权限（读写权限）
- 不要公开共享表格
- 定期审查共享权限

### 3. 数据备份

```bash
# 每周备份Google Sheets数据
# 方法1：手动下载为Excel
# 方法2：使用Google Takeout
# 方法3：定期导出到本地数据库
```

---

## 📊 监控与维护

### 1. 日志监控

在n8n中查看执行日志：
- 导航到"Executions"
- 筛选失败的执行
- 查看错误信息和节点输出

### 2. 性能监控

关键指标：
- **执行时长**：100个账号约5-10分钟
- **成功率**：应 >95%
- **API配额使用**：不超过限制的80%

### 3. 定期维护任务

**每日**：
- 检查执行日志，确认无错误
- 检查"采集进度"表，处理失败账号

**每周**：
- 备份Google Sheets数据
- 清理旧数据（可选）
- 更新监控账号列表

**每月**：
- 审查和优化配置参数
- 评估API使用成本
- 更新n8n版本（如有新版本）

---

## 🐛 常见问题排查

### 问题1：Google Sheets认证失败

**症状**：Node-002报错"Authentication failed"

**解决方案**：
1. 重新授权Google账号
2. 检查OAuth2凭证是否过期
3. 确保表格已共享给正确的账号

### 问题2：TikHub API限流

**症状**：Node-010返回 429 Too Many Requests

**解决方案**：
1. 增加延迟时间：
   - `accountDelay: 3 → 5`
   - `batchDelay: 10 → 20`
2. 减少并发账号数
3. 升级TikHub API套餐

### 问题3：断点续传不工作

**症状**：重新执行时从头开始

**解决方案**：
1. 检查Node-018.5是否正常更新"采集进度"表
2. 验证Google Sheets写入权限
3. 检查Node-005.6的过滤逻辑

### 问题4：数据未写入

**症状**："视频数据"表无数据

**解决方案**：
1. 检查质量过滤阈值是否过高
2. 验证API返回的数据格式
3. 查看Node-011的数据清洗日志
4. 检查去重逻辑是否过滤了所有数据

---

## 📞 获取帮助

如果遇到问题：

1. **查看文档**：
   - [README.md](../README.md)
   - [第1批节点设计文档](batch1-design.md)
   - [Google Sheets模板](../templates/google-sheets-template.md)

2. **检查日志**：
   - n8n执行日志
   - 节点输出
   - Console输出

3. **提交Issue**：
   - [GitHub Issues](https://github.com/yourusername/douyincaiju/issues)
   - 附上错误信息和截图

4. **社区支持**：
   - [n8n社区](https://community.n8n.io/)
   - [n8n文档](https://docs.n8n.io/)

---

## 🎉 部署完成检查清单

- [ ] n8n已安装并运行
- [ ] Google Sheets已创建并填充数据
- [ ] Google Sheets API已配置
- [ ] TikHub API已配置
- [ ] n8n工作流已导入
- [ ] 所有节点已配置凭证
- [ ] 测试执行成功
- [ ] 定时触发器已激活
- [ ] 监控账号列表已扩展
- [ ] 日志监控已设置

完成以上所有项目后，系统即可正式投入使用！
