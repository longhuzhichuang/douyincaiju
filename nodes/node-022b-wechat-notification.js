// ============================================
// Node-022-B: 企业微信通知（成功/失败）
// ============================================
// 功能：生成企业微信Markdown格式的消息
// 输入：来自Node-020（成功）或Node-021（失败）
// 输出：企业微信Webhook所需的JSON格式

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

let message;

// ============================================
// 场景1：成功通知
// ============================================

if (!isFailure) {
  message = {
    msgtype: "markdown",
    markdown: {
      content: `## ✅ 抖音视频采集完成

**采集统计**
> 总视频数：<font color="info">${stats.videosCollected}</font> 条
> 新视频：<font color="info">${stats.newVideosCount}</font> 条
> 重复视频：${stats.duplicateVideosCount} 条
> 处理账号：${stats.accountsProcessed} 个

**执行详情**
> 批次ID：\`${config.batchId || '未知'}\`
> 采集模式：${config.mode === 'incremental' ? '增量' : '全量'}
> 执行时间：${config.currentTime || '未知'}
> 总耗时：${Math.round(stats.executionTime / 60000)} 分钟
> 去重率：${stats.videosCollected > 0 ? ((stats.duplicateVideosCount / stats.videosCollected) * 100).toFixed(1) : 0}%

**数据亮点**
• 平均每账号 ${stats.accountsProcessed > 0 ? Math.round(stats.videosCollected / stats.accountsProcessed) : 0} 条视频
• 新内容占比 ${stats.videosCollected > 0 ? ((stats.newVideosCount / stats.videosCollected) * 100).toFixed(1) : 0}%

[查看数据表格](https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID)
`
    }
  };

  console.log(`\n💬 企业微信成功通知准备完成`);
  console.log(`   采集视频: ${stats.videosCollected}条`);
  console.log(`   新视频: ${stats.newVideosCount}条`);
}

// ============================================
// 场景2：失败通知
// ============================================

else {
  // 严重程度对应颜色
  const severityColor = {
    critical: "warning",
    high: "warning",
    medium: "comment",
    low: "comment"
  };

  const color = severityColor[inputData.severity] || 'warning';

  message = {
    msgtype: "markdown",
    markdown: {
      content: `## ⚠️ 抖音视频采集失败

**错误信息**
> <font color="${color}">${inputData.errorMessage || '未知错误'}</font>

**错误详情**
> 错误节点：\`${inputData.errorNode || '未知'}\`
> 错误分类：${inputData.errorCategory || '其他错误'}
> 严重程度：<font color="${color}">${(inputData.severity || 'UNKNOWN').toUpperCase()}</font>
> 发生时间：${inputData.errorTime || new Date().toISOString().slice(0, 19).replace('T', ' ')}
> 批次ID：\`${config.batchId || '未知'}\`

**建议方案**
> ${inputData.suggestedFix || '请查看详细错误信息并联系技术支持'}

**已完成工作**
> 已处理账号：${stats.accountsProcessed} 个
> 已采集视频：${stats.videosCollected} 条

⚠️ <font color="warning">注意：数据可能未完全保存，请检查后重新执行</font>

[查看执行日志](https://YOUR_N8N_URL/workflow/${$workflow.id}/executions/${$execution.id})
`
    }
  };

  console.log(`\n💬 企业微信失败通知准备完成`);
  console.log(`   错误节点: ${inputData.errorNode || '未知'}`);
  console.log(`   严重程度: ${inputData.severity || 'UNKNOWN'}`);
}

// ============================================
// 输出企业微信消息数据
// ============================================

return [{
  json: message
}];
