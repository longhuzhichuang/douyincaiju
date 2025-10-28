# 快速开始指南

> 5分钟快速部署抖音视频采集系统

## 🚀 最快路径

### 1️⃣ 克隆项目（1分钟）

```bash
git clone https://github.com/longhuzhichuang/douyincaiju.git
cd douyincaiju
```

### 2️⃣ 准备Google Sheets（2分钟）

1. **创建新的Google Sheets文档**
   - 访问 [Google Sheets](https://sheets.google.com)
   - 创建新文档，命名为"抖音视频采集系统"

2. **创建4个工作表**（Sheet标签）
   - `运行配置`
   - `监控账号列表`
   - `采集进度`
   - `视频数据`

3. **复制模板数据**
   - 打开 [templates/google-sheets-template.md](templates/google-sheets-template.md)
   - 按照模板填充数据

4. **获取表格URL**
   ```
   复制浏览器地址栏的URL
   格式：https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```

### 3️⃣ 导入n8n工作流（2分钟）

1. **打开n8n**
   - 访问 `http://localhost:5678`（或你的n8n地址）
   - 登录账号

2. **导入工作流**
   - 点击右上角菜单 → "Import from File"
   - 选择 `workflows/douyin-collector-batch1.json`
   - 点击 "Import"

3. **配置Google Sheets**
   - **创建凭证**：Credentials → Add → Google Sheets OAuth2 API
   - **配置节点**：在以下3个节点中填入你的表格URL
     - Node-002: 读取运行配置
     - Node-004: 读取监控账号
     - Node-005.5-A: 读取采集进度

4. **测试运行**
   - 点击 "001-B: 手动触发(全量模式)"
   - 点击 "Execute Workflow"
   - 观察执行过程

5. **激活定时器**
   - 点击右上角 "Inactive" → "Active"
   - 系统将每天9:00和21:00自动执行

## ✅ 完成！

如果所有节点变为绿色，恭喜你成功部署了抖音视频采集系统！

---

## 📚 详细文档

如需更多信息，请查看：

- **📖 [README.md](README.md)** - 项目概述和功能介绍
- **⚙️ [n8n导入指南](docs/n8n-import-guide.md)** - 详细的导入和配置步骤
- **🚀 [部署指南](docs/deployment.md)** - 完整的部署流程
- **📋 [Google Sheets模板](templates/google-sheets-template.md)** - 数据表结构说明
- **🎨 [第1批节点设计](docs/batch1-design.md)** - 技术设计文档

---

## 🎯 快速测试

### 最小化测试配置

1. **运行配置表**
   ```
   mode = incremental
   videosPerAccount = 5
   accountDelay = 3
   batchDelay = 10
   maxRetries = 3
   （其他参数按模板填写）
   ```

2. **监控账号列表**
   - 只启用2-3个账号进行测试
   - 确保填入有效的sec_uid

3. **执行测试**
   - 手动触发工作流
   - 检查日志输出
   - 验证功能正常

---

## 🐛 遇到问题？

### 常见问题快速解决

| 问题 | 解决方案 |
|------|---------|
| 导入失败 | 确保n8n版本≥1.0 |
| Google Sheets认证失败 | 重新创建OAuth2凭证 |
| 节点报错 | 检查节点配置和凭证 |
| 没有输出 | 检查账号列表是否有启用的账号 |

详细排查请查看 [n8n导入指南](docs/n8n-import-guide.md#常见问题)

---

## 💡 提示

### 第1批节点（已实现）

当前工作流包含以下功能：
- ✅ 定时/手动触发
- ✅ 配置读取和解析
- ✅ 账号筛选和清洗
- ✅ **断点续传**（核心功能）
- ✅ **智能过滤与重试**（核心功能）
- ✅ 批次计算和智能延迟
- ✅ 模式判断和分流

### 第2批节点（待实现）

以下功能在第2批开发：
- ⏳ TikHub API调用
- ⏳ 数据清洗转换
- ⏳ 双重去重
- ⏳ DeepSeek AI分析
- ⏳ 批量写入Google Sheets

---

## 📞 获取帮助

- **GitHub Issues**: 提交问题和反馈
- **项目文档**: 查看完整文档
- **n8n社区**: [community.n8n.io](https://community.n8n.io/)

---

## 🎉 下一步

1. **测试基础功能**
   - 验证所有第1批节点正常工作

2. **调整配置参数**
   - 根据实际需求调整延迟时间
   - 调整质量阈值

3. **扩展账号列表**
   - 测试成功后，增加到50-100个账号

4. **等待第2批节点**
   - API调用、数据处理、AI分析功能
   - 完整的数据采集和存储

---

**开始你的抖音视频采集之旅吧！** 🚀
