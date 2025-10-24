// ============================================
// Node-022-A: 邮件通知（成功/失败）
// ============================================
// 功能：根据输入数据判断是成功还是失败，生成相应的HTML邮件
// 输入：来自Node-020（成功）或Node-021（失败）
// 输出：包含subject和html的邮件数据

// ============================================
// 检测是成功还是失败通知
// ============================================

const inputData = $input.first().json;
const isFailure = !!inputData.errorMessage;

const config = $workflow.staticData.config || {};
const stats = {
  videosCollected: $workflow.staticData.videosCollected || 0,
  newVideosCount: $workflow.staticData.newVideosCount || 0,
  duplicateVideosCount: $workflow.staticData.duplicateVideosCount || 0,
  accountsProcessed: $workflow.staticData.accountsProcessed || 0,
  executionTime: $workflow.staticData.executionTime || 0
};

let subject, html;

// ============================================
// 场景1：成功通知邮件
// ============================================

if (!isFailure) {
  subject = `✅ 抖音视频采集完成 - ${stats.videosCollected}条视频`;

  html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    .info-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #666;
      font-weight: 500;
    }
    .value {
      color: #333;
      font-weight: bold;
    }
    .success-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 采集任务完成</h1>
      <div class="success-badge">执行成功</div>
    </div>

    <div class="content">
      <h2>📊 本次采集统计</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总视频数</div>
          <div class="stat-number">${stats.videosCollected}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">新视频</div>
          <div class="stat-number">${stats.newVideosCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">重复视频</div>
          <div class="stat-number">${stats.duplicateVideosCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">处理账号</div>
          <div class="stat-number">${stats.accountsProcessed}</div>
        </div>
      </div>

      <div class="info-section">
        <h3>📋 执行详情</h3>
        <div class="info-row">
          <span class="label">批次ID</span>
          <span class="value">${config.batchId || '未知'}</span>
        </div>
        <div class="info-row">
          <span class="label">采集模式</span>
          <span class="value">${config.mode === 'incremental' ? '增量模式' : '全量模式'}</span>
        </div>
        <div class="info-row">
          <span class="label">执行时间</span>
          <span class="value">${config.currentTime || '未知'}</span>
        </div>
        <div class="info-row">
          <span class="label">总耗时</span>
          <span class="value">${Math.round(stats.executionTime / 60000)} 分钟</span>
        </div>
        <div class="info-row">
          <span class="label">去重率</span>
          <span class="value">${stats.videosCollected > 0 ? ((stats.duplicateVideosCount / stats.videosCollected) * 100).toFixed(1) : 0}%</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID" class="button">
          📊 查看数据表格
        </a>
      </div>

      <div class="info-section">
        <h3>💡 数据亮点</h3>
        <ul>
          <li>采集了 <strong>${stats.accountsProcessed}</strong> 个账号的视频</li>
          <li>发现 <strong>${stats.newVideosCount}</strong> 条新视频</li>
          <li>去重过滤了 <strong>${stats.duplicateVideosCount}</strong> 条重复内容</li>
          <li>平均每个账号 <strong>${stats.accountsProcessed > 0 ? Math.round(stats.videosCollected / stats.accountsProcessed) : 0}</strong> 条视频</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>此邮件由 n8n 自动发送</p>
      <p>抖音视频采集系统 © 2025</p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================
// 场景2：失败通知邮件
// ============================================

else {
  subject = `❌ 抖音视频采集失败 - ${inputData.errorNode || '未知节点'}`;

  // 严重程度对应颜色
  const severityColor = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#10b981'
  };

  html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .error-badge {
      display: inline-block;
      background: #fecaca;
      color: #991b1b;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      margin: 10px 0;
      font-weight: bold;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .error-box {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .error-message {
      font-family: monospace;
      background: white;
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
      word-break: break-word;
    }
    .info-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #666;
      font-weight: 500;
    }
    .value {
      color: #333;
      font-weight: bold;
    }
    .solution-box {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ 采集任务失败</h1>
      <div class="error-badge">${(inputData.severity || 'ERROR').toUpperCase()}</div>
    </div>

    <div class="content">
      <div class="error-box">
        <h3>❌ 错误信息</h3>
        <div class="error-message">
          ${inputData.errorMessage || '未知错误'}
        </div>
      </div>

      <div class="info-section">
        <h3>📋 错误详情</h3>
        <div class="info-row">
          <span class="label">错误节点</span>
          <span class="value">${inputData.errorNode || '未知'}</span>
        </div>
        <div class="info-row">
          <span class="label">节点类型</span>
          <span class="value">${inputData.errorNodeType || '未知'}</span>
        </div>
        <div class="info-row">
          <span class="label">错误分类</span>
          <span class="value">${inputData.errorCategory || '其他错误'}</span>
        </div>
        <div class="info-row">
          <span class="label">严重程度</span>
          <span class="value" style="color: ${severityColor[inputData.severity] || '#666'}">
            ${(inputData.severity || 'UNKNOWN').toUpperCase()}
          </span>
        </div>
        <div class="info-row">
          <span class="label">发生时间</span>
          <span class="value">${inputData.errorTime || new Date().toISOString().slice(0, 19).replace('T', ' ')}</span>
        </div>
        <div class="info-row">
          <span class="label">批次ID</span>
          <span class="value">${config.batchId || '未知'}</span>
        </div>
      </div>

      <div class="solution-box">
        <h3>💡 建议解决方案</h3>
        <div style="white-space: pre-line; margin: 10px 0;">
          ${inputData.suggestedFix || '请查看详细错误信息并联系技术支持'}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://YOUR_N8N_URL/workflow/${$workflow.id}/executions/${$execution.id}" class="button">
          🔍 查看执行日志
        </a>
      </div>

      <div class="info-section">
        <h3>📊 已完成的工作</h3>
        <p>虽然任务失败，但部分数据可能已成功采集：</p>
        <ul>
          <li>已处理账号：${stats.accountsProcessed} 个</li>
          <li>已采集视频：${stats.videosCollected} 条</li>
          <li>执行时长：${Math.round(stats.executionTime / 60000)} 分钟</li>
        </ul>
        <p><em>注意：如果错误发生在数据写入阶段，采集的数据可能未保存到Google Sheets。</em></p>
      </div>
    </div>

    <div class="footer">
      <p>此邮件由 n8n 自动发送</p>
      <p>抖音视频采集系统 © 2025</p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================
// 输出邮件数据
// ============================================

console.log(`\n📧 准备邮件通知...`);
console.log(`   类型: ${isFailure ? '失败通知' : '成功通知'}`);
console.log(`   主题: ${subject}`);

return [{
  json: {
    subject: subject,
    html: html,
    to: 'admin@company.com',  // 修改为实际收件人
    isFailure: isFailure
  }
}];
