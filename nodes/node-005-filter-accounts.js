// ============================================
// Node-005: 筛选启用账号
// ============================================
// 功能：
// 1. 过滤启用状态为TRUE的账号
// 2. 数据清洗和格式化
// 3. 验证必填字段
// 4. 统计账号数量
// ============================================

const items = $input.all();

console.log(`📊 开始筛选账号，总数: ${items.length}`);

// ============================================
// 1. 过滤和清洗账号数据
// ============================================
const enabledAccounts = items
  .map(item => item.json)
  .filter(account => {
    // 过滤条件：启用状态为TRUE
    const isEnabled = account['启用状态'] === 'TRUE' || account['启用状态'] === true;

    if (!isEnabled) {
      console.log(`⏭️  跳过禁用账号: ${account['账号昵称']}`);
      return false;
    }

    // 验证必填字段
    if (!account['sec_uid'] || !account['账号昵称']) {
      console.warn(`⚠️  账号数据不完整，已跳过: ${JSON.stringify(account)}`);
      return false;
    }

    return true;
  })
  .map((account, index) => {
    // 格式化账号数据（使用英文字段名）
    return {
      index: index + 1,  // 重新编号（从1开始）
      accountName: account['账号昵称'].trim(),
      secUid: account['sec_uid'].trim(),
      category: account['分类'] || '未分类',
      originalIndex: parseInt(account['序号']) || index + 1,

      // 不在这里添加config，由后续节点从static data读取
    };
  });

console.log(`✅ 筛选完成，启用账号数: ${enabledAccounts.length}`);

// ============================================
// 2. 验证账号列表
// ============================================
if (enabledAccounts.length === 0) {
  const error = '❌ 没有启用的账号，请检查"监控账号列表"中的启用状态';
  console.error(error);
  throw new Error(error);
}

// ============================================
// 3. 输出统计信息
// ============================================
const stats = {
  totalAccounts: items.length,
  enabledAccounts: enabledAccounts.length,
  disabledAccounts: items.length - enabledAccounts.length,
  categories: {}
};

// 统计各分类账号数
enabledAccounts.forEach(account => {
  const cat = account.category;
  stats.categories[cat] = (stats.categories[cat] || 0) + 1;
});

console.log(`\n📊 账号统计:`);
console.log(`  总账号数: ${stats.totalAccounts}`);
console.log(`  启用: ${stats.enabledAccounts}`);
console.log(`  禁用: ${stats.disabledAccounts}`);
console.log(`  分类统计: ${JSON.stringify(stats.categories, null, 2)}`);

// ============================================
// 4. 返回启用的账号列表
// ============================================
console.log(`✅ Node-005 执行完成\n`);

return enabledAccounts.map(account => ({
  json: account
}));
