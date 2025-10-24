// ============================================
// Node-022-C: Webhook通知（成功/失败）
// ============================================
// 功能：生成标准的Webhook通知数据，可集成到任何系统
// 输入：来自Node-020（成功）或Node-021（失败）
// 输出：结构化的JSON数据

// ============================================
// 检测是成功还是失败通知
// ============================================

const inputData = $input.first().json;
const isSuccess = !inputData.errorMessage;

const config = $workflow.staticData.config || {};
const stats = $workflow.staticData;

// ============================================
// 生成Webhook数据
// ============================================

const webhookData = {
  // 基础信息
  event: isSuccess ? 'crawl.completed' : 'crawl.failed',
  timestamp: new Date().toISOString(),
  source: 'douyin-crawler',
  version: '1.0.0',

  // 批次信息
  batch: {
    id: config.batchId || 'unknown',
    mode: config.mode || 'unknown',
    startTime: config.currentTime || new Date().toISOString(),
    endTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    duration: stats.executionTime || 0,
    durationMinutes: Math.round((stats.executionTime || 0) / 60000)
  },

  // 统计数据
  statistics: {
    accounts: {
      total: stats.accountsProcessed || 0,
      processed: stats.accountsProcessed || 0
    },
    videos: {
      total: stats.videosCollected || 0,
      new: stats.newVideosCount || 0,
      duplicate: stats.duplicateVideosCount || 0,
      deduplicationRate: stats.videosCollected > 0
        ? ((stats.duplicateVideosCount / stats.videosCollected) * 100).toFixed(2)
        : '0.00'
    },
    performance: {
      averageVideosPerAccount: stats.accountsProcessed > 0
        ? (stats.videosCollected / stats.accountsProcessed).toFixed(2)
        : '0.00',
      videosPerMinute: stats.executionTime > 0
        ? (stats.videosCollected / (stats.executionTime / 60000)).toFixed(2)
        : '0.00'
    }
  },

  // 执行结果
  result: {
    status: isSuccess ? 'success' : 'failed',
    message: isSuccess
      ? `Successfully collected ${stats.videosCollected || 0} videos from ${stats.accountsProcessed || 0} accounts`
      : inputData.errorMessage || 'Unknown error occurred'
  },

  // 错误信息（仅失败时）
  error: isSuccess ? null : {
    node: inputData.errorNode || 'unknown',
    nodeType: inputData.errorNodeType || 'unknown',
    category: inputData.errorCategory || '其他错误',
    severity: inputData.severity || 'unknown',
    message: inputData.errorMessage || 'Unknown error',
    suggestedFix: inputData.suggestedFix || '请查看详细错误信息',
    errorTime: inputData.errorTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
    contextData: inputData.contextData || null
  },

  // 数据链接
  links: {
    spreadsheet: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID',
    execution: `https://YOUR_N8N_URL/workflow/${$workflow.id}/executions/${$execution.id}`,
    workflow: `https://YOUR_N8N_URL/workflow/${$workflow.id}`
  },

  // 元数据
  metadata: {
    workflowId: $workflow.id,
    workflowName: $workflow.name,
    executionId: $execution.id,
    executionMode: $execution.mode,
    n8nVersion: $vars.version || 'unknown'
  }
};

// ============================================
// 日志输出
// ============================================

console.log(`\n🔗 Webhook通知数据准备完成`);
console.log(`   事件类型: ${webhookData.event}`);
console.log(`   状态: ${webhookData.result.status}`);

if (isSuccess) {
  console.log(`   采集视频: ${webhookData.statistics.videos.total}条`);
  console.log(`   处理账号: ${webhookData.statistics.accounts.processed}个`);
  console.log(`   去重率: ${webhookData.statistics.videos.deduplicationRate}%`);
} else {
  console.log(`   错误节点: ${webhookData.error.node}`);
  console.log(`   错误分类: ${webhookData.error.category}`);
  console.log(`   严重程度: ${webhookData.error.severity}`);
}

// ============================================
// 输出Webhook数据
// ============================================

return [{
  json: webhookData
}];
