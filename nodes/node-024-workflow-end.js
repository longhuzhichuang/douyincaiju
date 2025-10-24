// ============================================
// Node-024: 工作流正常结束
// ============================================
// 功能：输出最终执行摘要，标记工作流完成
// 输入：来自Node-023（清理完成）
// 输出：执行摘要

console.log(`\n🎉 工作流执行完成！`);
console.log(`==========================================\n`);

// ============================================
// 1. 从历史记录中获取本次执行的统计
// ============================================

const history = $workflow.staticData.history || [];
const latestStats = history.length > 0 ? history[history.length - 1] : {
  lastVideosCollected: 0,
  lastNewVideosCount: 0,
  lastDuplicateVideosCount: 0,
  lastAccountsProcessed: 0,
  lastExecutionDuration: 0
};

const config = $workflow.staticData.config || {};

// ============================================
// 2. 生成执行摘要
// ============================================

const summary = {
  // 执行信息
  workflowName: $workflow.name || '抖音视频采集系统',
  workflowId: $workflow.id,
  executionId: $execution.id,
  executionMode: $execution.mode,

  // 时间信息
  executionTime: latestStats.lastExecutionTime || new Date().toISOString(),
  duration: latestStats.lastExecutionDuration || 0,
  durationMinutes: Math.round((latestStats.lastExecutionDuration || 0) / 60000),
  durationFormatted: formatDuration(latestStats.lastExecutionDuration || 0),

  // 批次信息
  batchId: latestStats.lastBatchId || 'unknown',
  mode: config.mode || 'unknown',

  // 统计数据
  statistics: {
    videosCollected: latestStats.lastVideosCollected || 0,
    newVideos: latestStats.lastNewVideosCount || 0,
    duplicateVideos: latestStats.lastDuplicateVideosCount || 0,
    accountsProcessed: latestStats.lastAccountsProcessed || 0,
    deduplicationRate: latestStats.lastVideosCollected > 0
      ? ((latestStats.lastDuplicateVideosCount / latestStats.lastVideosCollected) * 100).toFixed(1)
      : '0.0',
    averageVideosPerAccount: latestStats.lastAccountsProcessed > 0
      ? Math.round(latestStats.lastVideosCollected / latestStats.lastAccountsProcessed)
      : 0
  },

  // 状态
  status: 'completed',
  message: '所有节点执行成功'
};

// ============================================
// 3. 格式化持续时间
// ============================================

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

// ============================================
// 4. 输出摘要到控制台
// ============================================

console.log(`📊 执行摘要:`);
console.log(`   工作流: ${summary.workflowName}`);
console.log(`   执行ID: ${summary.executionId}`);
console.log(`   批次ID: ${summary.batchId}`);
console.log(`   采集模式: ${summary.mode === 'incremental' ? '增量模式' : summary.mode === 'full' ? '全量模式' : summary.mode}`);
console.log(`   总耗时: ${summary.durationFormatted}`);
console.log(``);
console.log(`   📈 数据统计:`);
console.log(`   - 采集视频: ${summary.statistics.videosCollected} 条`);
console.log(`   - 新视频: ${summary.statistics.newVideos} 条`);
console.log(`   - 重复视频: ${summary.statistics.duplicateVideos} 条`);
console.log(`   - 处理账号: ${summary.statistics.accountsProcessed} 个`);
console.log(`   - 去重率: ${summary.statistics.deduplicationRate}%`);
console.log(`   - 平均每账号: ${summary.statistics.averageVideosPerAccount} 条视频`);
console.log(``);
console.log(`   状态: ✅ ${summary.status}`);

console.log(`\n🔗 相关链接:`);
console.log(`   数据表格: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID`);
console.log(`   执行日志: https://YOUR_N8N_URL/workflow/${summary.workflowId}/executions/${summary.executionId}`);

// ============================================
// 5. 历史统计（如果有多次记录）
// ============================================

if (history.length >= 3) {
  console.log(`\n📊 历史趋势（最近3次）:`);

  const recent3 = history.slice(-3);
  const avgVideos = recent3.reduce((sum, h) => sum + h.lastVideosCollected, 0) / 3;
  const avgNewVideos = recent3.reduce((sum, h) => sum + h.lastNewVideosCount, 0) / 3;
  const avgDuration = recent3.reduce((sum, h) => sum + h.lastExecutionDuration, 0) / 3;

  console.log(`   平均采集: ${Math.round(avgVideos)} 条/次`);
  console.log(`   平均新视频: ${Math.round(avgNewVideos)} 条/次`);
  console.log(`   平均耗时: ${Math.round(avgDuration / 60000)} 分钟/次`);

  // 本次与平均值对比
  const videosChange = ((latestStats.lastVideosCollected - avgVideos) / avgVideos * 100).toFixed(1);
  const changeSymbol = videosChange > 0 ? '↑' : videosChange < 0 ? '↓' : '→';
  console.log(`   本次对比: ${changeSymbol} ${Math.abs(videosChange)}%`);
}

console.log(`\n==========================================`);
console.log(`🎊 感谢使用抖音视频采集系统！`);
console.log(`==========================================\n`);

// ============================================
// 6. 返回最终结果
// ============================================

return [{
  json: {
    success: true,
    summary: summary,
    completedAt: new Date().toISOString(),
    historyCount: history.length
  }
}];
