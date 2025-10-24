// ============================================
// Node-008: 智能延迟
// ============================================
// 功能：
// 1. 根据delayType执行不同的延迟策略
// 2. 重试时使用指数退避算法
// 3. 随机化延迟时间，避免规律性请求
// 4. 输出延迟日志便于监控
// ============================================

const account = $input.first().json;

// ============================================
// 1. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config');
}

const accountDelay = config.accountDelay || 3;  // 账号间延迟(秒)
const batchDelay = config.batchDelay || 10;      // 批次间延迟(秒)

// ============================================
// 2. 确定延迟时长
// ============================================
let delaySeconds = 0;

switch (account.delayType) {
  case 'none':
    // 第一个账号，无需延迟
    delaySeconds = 0;
    console.log(`⏰ 首个账号，立即开始`);
    break;

  case 'account':
    // 账号间延迟
    delaySeconds = accountDelay;
    console.log(`⏰ 账号间延迟: ${delaySeconds}秒`);
    break;

  case 'batch':
    // 批次间延迟
    delaySeconds = batchDelay;
    console.log(`⏰ 批次间延迟: ${delaySeconds}秒`);
    break;

  default:
    // 默认使用账号间延迟
    delaySeconds = accountDelay;
    console.warn(`⚠️  未知的延迟类型: ${account.delayType}，使用默认延迟`);
}

// ============================================
// 3. 重试时使用指数退避
// ============================================
const failureCount = account.progress.failureCount || 0;

if (failureCount > 0) {
  // 指数退避算法：
  // 第1次重试：延迟 × 2
  // 第2次重试：延迟 × 4
  // 第3次重试：延迟 × 8
  const backoffMultiplier = Math.pow(2, failureCount);
  const originalDelay = delaySeconds;
  delaySeconds = delaySeconds * backoffMultiplier;

  console.log(`🔄 重试账号（第${failureCount}次失败）`);
  console.log(`   应用指数退避: ${originalDelay}秒 × ${backoffMultiplier} = ${delaySeconds}秒`);
}

// ============================================
// 4. 添加随机抖动（±20%）
// ============================================
if (delaySeconds > 0) {
  // 随机因子：0.8 ~ 1.2
  const jitterFactor = 0.8 + (Math.random() * 0.4);
  const originalDelay = delaySeconds;
  delaySeconds = Math.round(delaySeconds * jitterFactor);

  console.log(`🎲 添加随机抖动: ${originalDelay}秒 × ${jitterFactor.toFixed(2)} = ${delaySeconds}秒`);
}

// ============================================
// 5. 执行延迟
// ============================================
if (delaySeconds > 0) {
  console.log(`⏱️  开始延迟 ${delaySeconds}秒...`);
  const startTime = Date.now();

  // 使用Promise实现延迟（n8n兼容方式）
  await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

  const actualDelay = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ 延迟完成，实际用时: ${actualDelay}秒`);
} else {
  console.log(`⚡ 无需延迟，立即执行`);
}

// ============================================
// 6. 记录延迟信息到输出
// ============================================
const outputData = {
  ...account,

  // 延迟信息
  delayInfo: {
    type: account.delayType,
    configuredDelay: account.delayType === 'batch' ? batchDelay : accountDelay,
    actualDelay: delaySeconds,
    isRetry: failureCount > 0,
    retryCount: failureCount,
    hasJitter: delaySeconds > 0
  }
};

console.log(`✅ Node-008 执行完成\n`);

// ============================================
// 7. 返回账号数据（延迟已执行）
// ============================================
return [{
  json: outputData
}];
