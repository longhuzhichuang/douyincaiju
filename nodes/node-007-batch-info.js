// ============================================
// Node-007: 计算批次信息
// ============================================
// 功能：
// 1. 从static data读取config
// 2. 计算当前账号的批次编号
// 3. 计算进度百分比
// 4. 判断是否需要批次延迟
// 5. 为当前账号添加批次信息
// ============================================

const account = $input.first().json;

// ============================================
// 1. 获取循环变量
// ============================================
const currentIndex = $itemIndex;  // 当前索引（从0开始）
const totalAccounts = $totalItems;  // 总账号数

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📊 正在处理第 ${currentIndex + 1}/${totalAccounts} 个账号`);
console.log(`   账号名称: ${account.accountName}`);
console.log(`   处理原因: ${account.processingReason}`);

// ============================================
// 2. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config');
}

const accountsPerBatch = config.accountsPerBatch || 10;  // 每批账号数

// ============================================
// 3. 计算批次信息
// ============================================
// 批次编号（从1开始）
const batchNumber = Math.floor(currentIndex / accountsPerBatch) + 1;

// 批次内的位置（从1开始）
const positionInBatch = (currentIndex % accountsPerBatch) + 1;

// 是否是批次的第一个账号
const isFirstInBatch = positionInBatch === 1;

// 是否是批次的最后一个账号
const isLastInBatch = positionInBatch === accountsPerBatch || (currentIndex === totalAccounts - 1);

// 是否是所有账号的最后一个
const isLastAccount = currentIndex === totalAccounts - 1;

console.log(`   批次信息: 第${batchNumber}批，批内第${positionInBatch}/${accountsPerBatch}个`);

// ============================================
// 4. 计算进度百分比
// ============================================
const progressPercent = Math.round((currentIndex + 1) / totalAccounts * 100);

console.log(`   总体进度: ${progressPercent}% (${currentIndex + 1}/${totalAccounts})`);

// ============================================
// 5. 确定延迟类型
// ============================================
let delayType = 'account';  // 默认：账号间延迟

if (isFirstInBatch && currentIndex > 0) {
  // 批次的第一个账号（且不是第一个批次）→ 批次间延迟
  delayType = 'batch';
  console.log(`   ⏰ 批次切换，将执行批次延迟: ${config.batchDelay}秒`);
} else if (!isFirstInBatch) {
  // 批次内的非第一个账号 → 账号间延迟
  console.log(`   ⏰ 将执行账号延迟: ${config.accountDelay}秒`);
} else {
  // 第一个账号，无需延迟
  console.log(`   ⏰ 首个账号，无需延迟`);
  delayType = 'none';
}

// ============================================
// 6. 构建输出对象
// ============================================
const outputData = {
  // 原始账号数据
  ...account,

  // 循环信息
  loopIndex: currentIndex,
  loopTotal: totalAccounts,

  // 批次信息
  batchNumber: batchNumber,
  positionInBatch: positionInBatch,
  isFirstInBatch: isFirstInBatch,
  isLastInBatch: isLastInBatch,
  isLastAccount: isLastAccount,

  // 进度信息
  progressPercent: progressPercent,

  // 延迟信息
  delayType: delayType,  // 'none' | 'account' | 'batch'

  // config（从static data读取，避免在数据流中传递）
  // 注意：不要在这里添加完整的config对象，后续节点从static data读取
};

console.log(`✅ Node-007 执行完成\n`);

// ============================================
// 7. 返回增强后的账号数据
// ============================================
return [{
  json: outputData
}];
