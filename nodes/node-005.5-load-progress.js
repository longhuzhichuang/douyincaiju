// ============================================
// Node-005.5-B: 合并采集进度
// ============================================
// 功能：
// 1. 获取账号列表（来自Node-005）
// 2. 获取采集进度表（来自Node-005.5-A）
// 3. 为每个账号附加progress对象
// 4. 构建完整的账号+进度数据
// ============================================

// 获取输入数据（使用n8n的多输入功能）
// 输入1：账号列表（来自Node-005）
// 输入2：采集进度表（来自Node-005.5-A）

const accountsInput = $('Node-005').all();  // 账号列表
const progressInput = $('Node-005.5-A').all();  // 采集进度表

console.log(`📊 开始合并采集进度`);
console.log(`  账号数量: ${accountsInput.length}`);
console.log(`  进度记录数: ${progressInput.length}`);

// ============================================
// 1. 将进度表转换为Map（以secUid为key）
// ============================================
const progressMap = new Map();

if (progressInput && progressInput.length > 0) {
  progressInput.forEach(item => {
    const progress = item.json;
    const secUid = progress['sec_uid'] || progress['secUid'];

    if (secUid) {
      progressMap.set(secUid, {
        status: progress['采集状态'] || progress['status'] || '未开始',
        videosCollected: parseInt(progress['已采集视频数']) || 0,
        lastCrawlTime: progress['最后采集时间'] || null,
        batchId: progress['批次标识'] || null,
        failureCount: parseInt(progress['失败次数']) || 0,
        errorMessage: progress['错误信息'] || null
      });
    }
  });

  console.log(`✅ 进度表解析完成，有效记录: ${progressMap.size}`);
} else {
  console.log(`⚠️  采集进度表为空，所有账号将视为"未开始"`);
}

// ============================================
// 2. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config，请检查Node-003');
}

console.log(`📦 当前模式: ${config.mode}`);
console.log(`📅 批次标识: ${config.batchId}`);

// ============================================
// 3. 为每个账号附加progress对象
// ============================================
const accountsWithProgress = accountsInput.map(item => {
  const account = item.json;
  const secUid = account.secUid;

  // 从progressMap中查找该账号的历史状态
  const historicalProgress = progressMap.get(secUid);

  if (historicalProgress) {
    // 有历史记录
    console.log(`  📌 ${account.accountName}: ${historicalProgress.status}, 失败${historicalProgress.failureCount}次`);

    return {
      ...account,
      progress: {
        hasHistory: true,
        status: historicalProgress.status,
        videosCollected: historicalProgress.videosCollected,
        lastCrawlTime: historicalProgress.lastCrawlTime,
        lastBatchId: historicalProgress.batchId,
        failureCount: historicalProgress.failureCount,
        errorMessage: historicalProgress.errorMessage
      }
    };
  } else {
    // 无历史记录，首次采集
    console.log(`  🆕 ${account.accountName}: 首次采集`);

    return {
      ...account,
      progress: {
        hasHistory: false,
        status: '未开始',
        videosCollected: 0,
        lastCrawlTime: null,
        lastBatchId: null,
        failureCount: 0,
        errorMessage: null
      }
    };
  }
});

// ============================================
// 4. 统计各状态账号数量
// ============================================
const statusStats = {
  未开始: 0,
  进行中: 0,
  已完成: 0,
  失败: 0
};

accountsWithProgress.forEach(account => {
  const status = account.progress.status;
  if (statusStats.hasOwnProperty(status)) {
    statusStats[status]++;
  }
});

console.log(`\n📊 账号状态统计:`);
console.log(`  未开始: ${statusStats['未开始']}`);
console.log(`  进行中: ${statusStats['进行中']}`);
console.log(`  已完成: ${statusStats['已完成']}`);
console.log(`  失败: ${statusStats['失败']}`);
console.log(`✅ Node-005.5 执行完成\n`);

// ============================================
// 5. 返回带进度的账号列表
// ============================================
return accountsWithProgress.map(account => ({
  json: account
}));
