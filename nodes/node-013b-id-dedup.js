// ============================================
// Node-013-B: 第一次去重（ID去重）
// ============================================
// 功能：
// 1. 获取新采集的视频列表（来自Node-011）
// 2. 获取历史视频ID集合（来自Node-013-A）
// 3. 基于videoId进行精确匹配去重
// 4. 返回未重复的新视频
// 5. 统计去重结果
// ============================================

console.log(`\n🔍 开始第一次去重（ID去重）`);

// ============================================
// 1. 获取输入数据（多输入节点）
// ============================================
// 输入1：新采集的视频（来自Node-011）
// 输入2：历史视频ID（来自Node-013-A Google Sheets）

let newVideos = [];
let historicalIds = new Set();

try {
  // 获取新视频
  const newVideosInput = $('Node-011').all();
  newVideos = newVideosInput.map(item => item.json);
  console.log(`📥 新采集视频数: ${newVideos.length}`);

  // 获取历史ID
  const historicalInput = $('Node-013-A').all();

  if (historicalInput && historicalInput.length > 0) {
    historicalInput.forEach(item => {
      const videoId = item.json['视频ID'] || item.json['videoId'];
      if (videoId) {
        historicalIds.add(videoId.toString().trim());
      }
    });
    console.log(`📚 历史视频ID数: ${historicalIds.size}`);
  } else {
    console.log(`📚 历史视频ID数: 0 (首次采集或表为空)`);
  }

} catch (error) {
  console.error(`❌ 获取输入数据失败: ${error.message}`);
  throw error;
}

// ============================================
// 2. 验证输入数据
// ============================================
if (newVideos.length === 0) {
  console.warn(`⚠️  无新视频数据，跳过去重`);
  return [];
}

// ============================================
// 3. ID去重：精确匹配
// ============================================
const uniqueVideos = [];
const duplicateVideos = [];

newVideos.forEach((video, index) => {
  const videoId = video.videoId;

  if (!videoId) {
    console.warn(`⚠️  视频缺少ID，已跳过 [索引${index}]`);
    return;
  }

  // 检查是否在历史ID集合中
  if (historicalIds.has(videoId.toString().trim())) {
    // 重复视频
    duplicateVideos.push(video);
  } else {
    // 新视频
    uniqueVideos.push(video);

    // 同时添加到历史ID集合中（避免本批次内重复）
    historicalIds.add(videoId.toString().trim());
  }
});

// ============================================
// 4. 统计去重结果
// ============================================
const deduplicationStats = {
  newVideosCount: newVideos.length,
  historicalIdsCount: historicalIds.size,
  uniqueCount: uniqueVideos.length,
  duplicateCount: duplicateVideos.length,
  dedupRate: (duplicateVideos.length / newVideos.length * 100).toFixed(2) + '%'
};

console.log(`\n📊 ID去重统计:`);
console.log(`  新采集视频: ${deduplicationStats.newVideosCount}`);
console.log(`  历史视频ID数: ${deduplicationStats.historicalIdsCount}`);
console.log(`  唯一视频: ${deduplicationStats.uniqueCount}`);
console.log(`  重复视频: ${deduplicationStats.duplicateCount}`);
console.log(`  去重率: ${deduplicationStats.dedupRate}`);

// ============================================
// 5. 打印重复视频信息（仅前5条）
// ============================================
if (duplicateVideos.length > 0) {
  console.log(`\n🔁 重复视频示例（前5条）:`);
  duplicateVideos.slice(0, 5).forEach((video, idx) => {
    console.log(`  ${idx + 1}. ${video.videoId} - ${video.desc.substring(0, 30)}...`);
  });

  if (duplicateVideos.length > 5) {
    console.log(`  ... 还有 ${duplicateVideos.length - 5} 条重复视频`);
  }
}

// ============================================
// 6. 为唯一视频添加去重标记
// ============================================
const outputVideos = uniqueVideos.map(video => ({
  ...video,
  deduplication: {
    idDedup: true,
    isDuplicate: false,
    dedupMethod: 'id-exact-match',
    dedupTime: new Date().toISOString()
  }
}));

console.log(`✅ Node-013-B 执行完成\n`);

// ============================================
// 7. 返回唯一视频列表
// ============================================
if (outputVideos.length === 0) {
  console.warn(`⚠️  ID去重后无新视频`);
  return [];
}

console.log(`📤 输出唯一视频数: ${outputVideos.length}\n`);

return outputVideos.map(video => ({
  json: video
}));
