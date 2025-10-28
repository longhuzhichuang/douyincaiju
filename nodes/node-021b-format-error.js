// ============================================
// Node-021-B: 格式化错误信息
// ============================================
// 功能：
// 1. 从Error Trigger提取错误信息
// 2. 错误分类（6大类）
// 3. 严重程度判断（4个等级）
// 4. 生成解决方案建议
// 5. 格式化为标准15列格式
// ============================================

const error = $input.first().json;

console.log(`\n❌ 捕获到错误`);

// ============================================
// 1. 提取错误信息
// ============================================

const errorInfo = {
  // 基本信息
  errorTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
  batchId: $workflow.staticData.config?.batchId || 'unknown',

  // 错误节点信息
  errorNode: error.node?.name || 'unknown',
  errorNodeType: error.node?.type || 'unknown',

  // 错误详情
  errorMessage: error.error?.message || error.message || '未知错误',
  errorStack: (error.error?.stack || '').substring(0, 1000),  // 限制长度
  errorCode: error.error?.code || '',

  // 工作流信息
  workflowId: $workflow.id || 'unknown',
  workflowName: $workflow.name || 'unknown',
  executionId: $execution.id || 'unknown',

  // 上下文数据（前一个节点的输出）
  contextData: JSON.stringify(error.json || {}).substring(0, 500),  // 限制长度

  // 严重程度（将在下面判断）
  severity: 'high',

  // 状态
  resolved: '否',
  resolvedAt: '',
  resolvedBy: '',
  notes: ''
};

// ============================================
// 2. 错误分类函数
// ============================================

function categorizeError(message) {
  const msg = message.toLowerCase();

  if (msg.includes('authentication') ||
      msg.includes('permission') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden')) {
    return '权限问题';
  }

  else if (msg.includes('network') ||
           msg.includes('timeout') ||
           msg.includes('connection') ||
           msg.includes('econnrefused') ||
           msg.includes('dns')) {
    return '网络问题';
  }

  else if (msg.includes('quota') ||
           msg.includes('rate limit') ||
           msg.includes('too many requests') ||
           msg.includes('exceeded')) {
    return '配额限制';
  }

  else if (msg.includes('not found') ||
           msg.includes('does not exist') ||
           msg.includes('no such') ||
           msg.includes('missing')) {
    return '资源不存在';
  }

  else if (msg.includes('invalid') ||
           msg.includes('format') ||
           msg.includes('parse') ||
           msg.includes('malformed') ||
           msg.includes('syntax error')) {
    return '数据格式错误';
  }

  else {
    return '其他错误';
  }
}

// 执行错误分类
errorInfo.errorCategory = categorizeError(errorInfo.errorMessage);

// ============================================
// 3. 判断错误严重程度
// ============================================

function determineSeverity(message, category) {
  const msg = message.toLowerCase();

  // Critical（致命）：系统无法继续运行
  const criticalPatterns = [
    'api key invalid',
    'authentication failed',
    'permission denied',
    'access denied',
    'unauthorized',
    'forbidden',
    'invalid credentials'
  ];

  if (criticalPatterns.some(pattern => msg.includes(pattern))) {
    return 'critical';
  }

  // High（严重）：影响核心功能
  const highPatterns = [
    'write failed',
    'save failed',
    'update failed',
    'insert failed',
    'api error',
    'request failed'
  ];

  if (highPatterns.some(pattern => msg.includes(pattern))) {
    return 'high';
  }

  // Medium（中等）：部分功能受影响
  const mediumPatterns = [
    'timeout',
    'rate limit',
    'slow response',
    'retry',
    'temporary'
  ];

  if (mediumPatterns.some(pattern => msg.includes(pattern))) {
    return 'medium';
  }

  // Low（轻微）：不影响核心功能
  return 'low';
}

errorInfo.severity = determineSeverity(errorInfo.errorMessage, errorInfo.errorCategory);

// ============================================
// 4. 生成建议的解决方案
// ============================================

function getSuggestedFix(category, message, severity) {
  const msg = message.toLowerCase();

  // 根据错误分类提供建议
  const categoryFixes = {
    '权限问题': '1. 检查Google账号权限\n2. 重新授权n8n\n3. 确认API Key有效',
    '网络问题': '1. 检查网络连接\n2. 稍后重试\n3. 检查防火墙设置',
    '配额限制': '1. 等待配额重置\n2. 升级套餐\n3. 优化请求频率',
    '资源不存在': '1. 检查文档名是否正确\n2. 确认Sheet名称\n3. 验证资源ID',
    '数据格式错误': '1. 检查数据清洗逻辑\n2. 验证字段格式\n3. 查看示例数据',
    '其他错误': '1. 查看详细错误信息\n2. 检查n8n日志\n3. 联系技术支持'
  };

  let suggestion = categoryFixes[category] || '请查看错误详情并联系技术支持';

  // 针对特定错误的额外建议
  if (msg.includes('spreadsheet not found')) {
    suggestion += '\n\n特别提示：确认Google Sheets文档名称与配置完全一致';
  } else if (msg.includes('sheet not found')) {
    suggestion += '\n\n特别提示：确认工作表名称正确（区分大小写）';
  } else if (msg.includes('column') && msg.includes('not found')) {
    suggestion += '\n\n特别提示：检查列名映射，确保字段名与表头一致';
  } else if (msg.includes('quota')) {
    suggestion += '\n\n特别提示：当前配额已用完，明天重置或升级账号';
  }

  // 根据严重程度添加紧急提示
  if (severity === 'critical') {
    suggestion = '🚨 紧急处理：\n' + suggestion + '\n\n建议：立即暂停工作流，修复后再启动';
  } else if (severity === 'high') {
    suggestion = '⚠️ 需尽快处理：\n' + suggestion + '\n\n建议：在24小时内修复';
  }

  return suggestion;
}

errorInfo.suggestedFix = getSuggestedFix(
  errorInfo.errorCategory,
  errorInfo.errorMessage,
  errorInfo.severity
);

// ============================================
// 5. 添加错误统计信息（可选）
// ============================================

// 尝试从static data获取错误计数
if (!$workflow.staticData.errorCount) {
  $workflow.staticData.errorCount = {};
}

const errorKey = `${errorInfo.errorCategory}-${errorInfo.errorNode}`;
$workflow.staticData.errorCount[errorKey] = ($workflow.staticData.errorCount[errorKey] || 0) + 1;

// 如果同类错误频繁发生，提升严重程度
const errorFrequency = $workflow.staticData.errorCount[errorKey];
if (errorFrequency >= 3 && errorInfo.severity === 'low') {
  errorInfo.severity = 'medium';
  errorInfo.notes = `同类错误已发生${errorFrequency}次，严重程度提升`;
  console.warn(`   ⚠️  同类错误频繁发生（${errorFrequency}次），严重程度从low提升为medium`);
}

// ============================================
// 6. 格式化为15列标准格式
// ============================================

const formattedError = {
  '错误时间': errorInfo.errorTime,
  '批次ID': errorInfo.batchId,
  '错误节点': errorInfo.errorNode,
  '节点类型': errorInfo.errorNodeType,
  '错误信息': errorInfo.errorMessage,
  '错误代码': errorInfo.errorCode,
  '错误分类': errorInfo.errorCategory,
  '严重程度': errorInfo.severity,
  '建议方案': errorInfo.suggestedFix,
  '上下文数据': errorInfo.contextData,
  '工作流名称': errorInfo.workflowName,
  '执行ID': errorInfo.executionId,
  '是否已解决': errorInfo.resolved,
  '解决时间': errorInfo.resolvedAt,
  '备注': errorInfo.notes
};

// ============================================
// 7. 日志输出
// ============================================

console.log(`\n📊 错误信息详情:`);
console.log(`   错误节点: ${errorInfo.errorNode} (${errorInfo.errorNodeType})`);
console.log(`   错误分类: ${errorInfo.errorCategory}`);
console.log(`   严重程度: ${errorInfo.severity}`);
console.log(`   错误信息: ${errorInfo.errorMessage}`);

if (errorInfo.errorCode) {
  console.log(`   错误代码: ${errorInfo.errorCode}`);
}

console.log(`\n💡 建议解决方案:`);
console.log(errorInfo.suggestedFix.split('\n').map(line => `   ${line}`).join('\n'));

if (errorFrequency > 1) {
  console.log(`\n📈 错误频率: 同类错误已发生${errorFrequency}次`);
}

console.log(`\n✅ Node-021-B 执行完成\n`);

// ============================================
// 8. 返回格式化的错误信息
// ============================================

return [{
  json: formattedError
}];
