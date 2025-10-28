// ============================================
// Node-005.6: 智能过滤与重试策略
// ============================================
// 功能：
// 1. 根据mode和status决定是否处理账号
// 2. 实现智能重试机制
// 3. 过滤出需要采集的账号列表
// 4. 标记跳过和放弃的账号
// ============================================

const items = $input.all();

console.log(`📊 开始智能过滤，总账号数: ${items.length}`);

// ============================================
// 1. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config');
}

const mode = config.mode;
const maxRetries = config.maxRetries || 3;

console.log(`📦 当前模式: ${mode}`);
console.log(`🔄 最大重试次数: ${maxRetries}`);

// ============================================
// 2. 定义过滤规则
// ============================================
const filterRules = {
  // ✅ 总是需要处理的情况
  shouldProcess: (account) => {
    const status = account.progress.status;
    const failureCount = account.progress.failureCount;

    // 规则1：未开始 → 总是处理
    if (status === '未开始') {
      return { process: true, reason: '首次采集' };
    }

    // 规则2：进行中 → 总是处理（可能是上次中断）
    if (status === '进行中') {
      return { process: true, reason: '继续未完成的采集' };
    }

    // 规则3：已完成
    if (status === '已完成') {
      if (mode === 'incremental') {
        // 增量模式：即使已完成也要处理（每天都采集新视频）
        return { process: true, reason: '增量模式：采集新视频' };
      } else {
        // 全量模式：已完成就跳过
        return { process: false, reason: '全量模式：已采集完成' };
      }
    }

    // 规则4：失败
    if (status === '失败') {
      if (failureCount >= maxRetries) {
        // 失败次数≥3：放弃
        return { process: false, reason: `失败${failureCount}次，已放弃` };
      } else {
        // 失败次数<3：重试
        return { process: true, reason: `失败${failureCount}次，准备重试` };
      }
    }

    // 默认：不处理
    return { process: false, reason: '未知状态' };
  }
};

// ============================================
// 3. 过滤账号并标记
// ============================================
const filteredAccounts = [];
const skippedAccounts = [];
const abandonedAccounts = [];

items.forEach(item => {
  const account = item.json;
  const decision = filterRules.shouldProcess(account);

  if (decision.process) {
    // 需要处理
    filteredAccounts.push({
      ...account,
      processingReason: decision.reason
    });
    console.log(`  ✅ ${account.accountName}: ${decision.reason}`);
  } else {
    // 跳过或放弃
    if (account.progress.failureCount >= maxRetries) {
      abandonedAccounts.push(account);
      console.log(`  ❌ ${account.accountName}: ${decision.reason}`);
    } else {
      skippedAccounts.push(account);
      console.log(`  ⏭️  ${account.accountName}: ${decision.reason}`);
    }
  }
});

// ============================================
// 4. 输出统计信息
// ============================================
console.log(`\n📊 过滤结果统计:`);
console.log(`  需要处理: ${filteredAccounts.length}`);
console.log(`  跳过: ${skippedAccounts.length}`);
console.log(`  放弃: ${abandonedAccounts.length}`);

// ============================================
// 5. 验证结果
// ============================================
if (filteredAccounts.length === 0) {
  console.warn(`⚠️  没有需要处理的账号`);
  console.log(`\n详细情况:`);
  console.log(`  总账号数: ${items.length}`);
  console.log(`  跳过账号: ${skippedAccounts.map(a => a.accountName).join(', ')}`);
  console.log(`  放弃账号: ${abandonedAccounts.map(a => a.accountName).join(', ')}`);

  // 如果是全量模式且所有账号都已完成，这是正常的
  if (mode === 'full' && skippedAccounts.length === items.length) {
    console.log(`\n✅ 全量模式：所有账号已采集完成，无需再次执行`);
  }

  // 返回空数组，后续节点会跳过
  return [];
}

console.log(`\n✅ Node-005.6 执行完成`);
console.log(`📝 将处理 ${filteredAccounts.length} 个账号\n`);

// ============================================
// 6. 返回需要处理的账号列表
// ============================================
return filteredAccounts.map(account => ({
  json: account
}));
