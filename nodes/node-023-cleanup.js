// ============================================
// Node-023: 清理临时数据
// ============================================
// 功能：清理本次执行的临时数据，释放内存
// 输入：来自Node-022（通知发送后）
// 输出：清理报告

console.log(`\n🧹 清理临时数据...`);

// ============================================
// 1. 保存最终统计（用于下次对比）
// ============================================

const finalStats = {
  lastBatchId: $workflow.staticData.config?.batchId,
  lastExecutionTime: new Date().toISOString(),
  lastVideosCollected: $workflow.staticData.videosCollected || 0,
  lastNewVideosCount: $workflow.staticData.newVideosCount || 0,
  lastDuplicateVideosCount: $workflow.staticData.duplicateVideosCount || 0,
  lastAccountsProcessed: $workflow.staticData.accountsProcessed || 0,
  lastExecutionDuration: $workflow.staticData.executionTime || 0
};

console.log(`   保存最终统计:`);
console.log(`   - 批次ID: ${finalStats.lastBatchId}`);
console.log(`   - 采集视频: ${finalStats.lastVideosCollected}条`);
console.log(`   - 新视频: ${finalStats.lastNewVideosCount}条`);
console.log(`   - 处理账号: ${finalStats.lastAccountsProcessed}个`);

// ============================================
// 2. 清理工作数据
// ============================================

// 清理配置数据（保留部分用于下次执行）
if ($workflow.staticData.config) {
  console.log(`   清理配置数据...`);

  // 保留必要的配置
  const keepConfig = {
    // 保留批次ID用于防重复执行
    lastBatchId: $workflow.staticData.config.batchId,
    lastExecutionTime: new Date().toISOString()
  };

  // 清除其他配置
  $workflow.staticData.config = keepConfig;
}

// 清理统计数据
console.log(`   清理统计数据...`);
delete $workflow.staticData.videosCollected;
delete $workflow.staticData.newVideosCount;
delete $workflow.staticData.duplicateVideosCount;
delete $workflow.staticData.accountsProcessed;
delete $workflow.staticData.executionTime;

// 清理去重缓存（重要！防止内存泄漏）
console.log(`   清理去重缓存...`);
delete $workflow.staticData.existingVideoIds;
delete $workflow.staticData.allVideos;

// 清理其他临时数据
console.log(`   清理其他临时数据...`);
delete $workflow.staticData.currentBatch;
delete $workflow.staticData.batchIndex;
delete $workflow.staticData.accountData;

// ============================================
// 3. 保存到历史记录
// ============================================

// 初始化历史记录
if (!$workflow.staticData.history) {
  $workflow.staticData.history = [];
}

// 添加本次统计到历史
$workflow.staticData.history.push(finalStats);

// 只保留最近10次的历史记录
if ($workflow.staticData.history.length > 10) {
  const removed = $workflow.staticData.history.length - 10;
  $workflow.staticData.history = $workflow.staticData.history.slice(-10);
  console.log(`   历史记录: 保留最近10条，移除${removed}条旧记录`);
} else {
  console.log(`   历史记录: 当前${$workflow.staticData.history.length}条`);
}

// ============================================
// 4. 计算历史趋势（可选）
// ============================================

if ($workflow.staticData.history.length >= 3) {
  const recentHistory = $workflow.staticData.history.slice(-3);
  const avgVideos = recentHistory.reduce((sum, h) => sum + h.lastVideosCollected, 0) / recentHistory.length;
  const avgNewVideos = recentHistory.reduce((sum, h) => sum + h.lastNewVideosCount, 0) / recentHistory.length;

  console.log(`\n   📊 近期趋势分析（最近3次）:`);
  console.log(`   - 平均采集: ${Math.round(avgVideos)}条/次`);
  console.log(`   - 平均新视频: ${Math.round(avgNewVideos)}条/次`);

  // 检测异常
  if (finalStats.lastVideosCollected < avgVideos * 0.5) {
    console.warn(`   ⚠️ 警告：本次采集量 (${finalStats.lastVideosCollected}) 显著低于平均值 (${Math.round(avgVideos)})`);
  }
}

// ============================================
// 5. 日志输出
// ============================================

console.log(`\n✅ 清理完成`);
console.log(`   保留数据:`);
console.log(`   - 最后批次ID: ${$workflow.staticData.config?.lastBatchId}`);
console.log(`   - 最后执行时间: ${$workflow.staticData.config?.lastExecutionTime}`);
console.log(`   - 历史记录: ${$workflow.staticData.history?.length || 0}条`);

console.log(`\n   已清理数据:`);
console.log(`   ✅ videosCollected`);
console.log(`   ✅ newVideosCount`);
console.log(`   ✅ duplicateVideosCount`);
console.log(`   ✅ accountsProcessed`);
console.log(`   ✅ executionTime`);
console.log(`   ✅ existingVideoIds`);
console.log(`   ✅ allVideos`);
console.log(`   ✅ currentBatch`);
console.log(`   ✅ batchIndex`);

// ============================================
// 6. 返回清理报告
// ============================================

return [{
  json: {
    cleaned: true,
    timestamp: new Date().toISOString(),
    finalStats: finalStats,
    historyCount: $workflow.staticData.history?.length || 0,
    retainedData: {
      lastBatchId: $workflow.staticData.config?.lastBatchId,
      lastExecutionTime: $workflow.staticData.config?.lastExecutionTime,
      historyRecords: $workflow.staticData.history?.length || 0
    },
    cleanedFields: [
      'videosCollected',
      'newVideosCount',
      'duplicateVideosCount',
      'accountsProcessed',
      'executionTime',
      'existingVideoIds',
      'allVideos',
      'currentBatch',
      'batchIndex',
      'accountData'
    ]
  }
}];
