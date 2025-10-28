// ============================================
// Node-018: 收集账号数据
// ============================================
// 功能：
// 1. 从所有视频中提取账号级别的统计数据
// 2. 按账号分组并计算汇总指标
// 3. 分析账号的内容类型和茶叶品类分布
// 4. 按平均播放量排序
// 5. 识别Top账号
// ============================================

const allVideos = $input.all().map(item => item.json);

console.log(`\n📊 收集账号数据`);
console.log(`   视频总数: ${allVideos.length}条`);

// ============================================
// 1. 按账号分组
// ============================================

const accountsMap = new Map();

allVideos.forEach(video => {
  const accountName = video['账号名称'] || video.accountName;

  if (!accountName) {
    console.warn(`   ⚠️  跳过缺少账号名称的视频: ${video['视频ID'] || video.videoId}`);
    return;
  }

  if (!accountsMap.has(accountName)) {
    accountsMap.set(accountName, {
      videos: [],
      name: accountName,
      category: video['账号类别'] || video.accountCategory || '',
      secUid: video.accountSecUid || ''
    });
  }

  accountsMap.get(accountName).videos.push(video);
});

console.log(`   账号数量: ${accountsMap.size}个`);

// ============================================
// 2. 辅助函数：获取出现最频繁的元素
// ============================================

function getMostFrequent(arr) {
  if (arr.length === 0) return '未知';

  const freq = {};
  arr.forEach(item => {
    const key = item || '未知';
    freq[key] = (freq[key] || 0) + 1;
  });

  let maxCount = 0;
  let mostFrequent = '未知';

  Object.entries(freq).forEach(([item, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  });

  return mostFrequent;
}

// ============================================
// 3. 计算每个账号的统计数据
// ============================================

const accountStats = [];

accountsMap.forEach((accountData, accountName) => {
  const videos = accountData.videos;

  // 基础统计
  const videoCount = videos.length;

  // 互动数据统计（兼容两种字段名）
  const totalPlays = videos.reduce((sum, v) => {
    return sum + (v['播放量'] || v.playCount || 0);
  }, 0);

  const totalLikes = videos.reduce((sum, v) => {
    return sum + (v['点赞数'] || v.likeCount || 0);
  }, 0);

  const totalComments = videos.reduce((sum, v) => {
    return sum + (v['评论数'] || v.commentCount || 0);
  }, 0);

  const totalShares = videos.reduce((sum, v) => {
    return sum + (v['分享数'] || v.shareCount || 0);
  }, 0);

  const totalCollects = videos.reduce((sum, v) => {
    return sum + (v['收藏数'] || v.collectCount || 0);
  }, 0);

  // 平均值
  const avgPlays = Math.round(totalPlays / videoCount);
  const avgLikes = Math.round(totalLikes / videoCount);

  const avgInteractionRate = videos.reduce((sum, v) => {
    return sum + (v['互动率(%)'] || v.interactionRate || 0);
  }, 0) / videoCount;

  // AI分析统计
  const avgQualityScore = videos.reduce((sum, v) => {
    return sum + (v['AI质量评分'] || v.qualityScore || 0);
  }, 0) / videoCount;

  // 内容类型分布
  const contentTypes = videos.map(v => v['内容类型'] || v.contentType || '未知');
  const mainContentType = getMostFrequent(contentTypes);

  // 茶叶品类分布
  const teaCategories = videos.map(v => v['茶叶品类'] || v.teaCategory || '未知');
  const mainTeaCategory = getMostFrequent(teaCategories);

  // 获取批次信息（从第一个视频）
  const firstVideo = videos[0];
  const batchId = firstVideo['批次ID'] || firstVideo.batchId || '';
  const collectionMode = firstVideo['采集模式'] || firstVideo.collectionMode || '';

  // 构建账号统计对象
  accountStats.push({
    '账号名称': accountName,
    '账号类别': accountData.category,
    '账号SecUid': accountData.secUid,
    '视频数量': videoCount,

    '总播放量': totalPlays,
    '总点赞数': totalLikes,
    '总评论数': totalComments,
    '总分享数': totalShares,
    '总收藏数': totalCollects,

    '平均播放量': avgPlays,
    '平均点赞数': avgLikes,
    '平均互动率(%)': parseFloat(avgInteractionRate.toFixed(2)),
    '平均质量评分': parseFloat(avgQualityScore.toFixed(2)),

    '主要内容类型': mainContentType,
    '主要茶叶品类': mainTeaCategory,

    '采集时间': new Date().toISOString().replace('T', ' ').substring(0, 19),
    '批次ID': batchId,
    '采集模式': collectionMode
  });
});

// ============================================
// 4. 按平均播放量排序
// ============================================

accountStats.sort((a, b) => b['平均播放量'] - a['平均播放量']);

// ============================================
// 5. 输出统计信息
// ============================================

console.log(`\n📈 账号统计汇总:`);
console.log(`   账号总数: ${accountStats.length}个`);

// 总体统计
const totalVideosCount = accountStats.reduce((sum, acc) => sum + acc['视频数量'], 0);
const totalPlaysCount = accountStats.reduce((sum, acc) => sum + acc['总播放量'], 0);
const totalLikesCount = accountStats.reduce((sum, acc) => sum + acc['总点赞数'], 0);

console.log(`   视频总数: ${totalVideosCount}条`);
console.log(`   总播放量: ${totalPlaysCount.toLocaleString()}`);
console.log(`   总点赞数: ${totalLikesCount.toLocaleString()}`);

// 平均值统计
const overallAvgPlays = Math.round(totalPlaysCount / totalVideosCount);
const overallAvgLikes = Math.round(totalLikesCount / totalVideosCount);
const overallAvgQuality = accountStats.reduce((sum, acc) => sum + acc['平均质量评分'], 0) / accountStats.length;

console.log(`\n   整体平均值:`);
console.log(`     播放量: ${overallAvgPlays.toLocaleString()}`);
console.log(`     点赞数: ${overallAvgLikes.toLocaleString()}`);
console.log(`     质量评分: ${overallAvgQuality.toFixed(2)}/10`);

// Top 5账号
console.log(`\n   📌 Top 5 账号（按平均播放量）:`);
accountStats.slice(0, 5).forEach((account, index) => {
  console.log(`   ${index + 1}. ${account['账号名称']}`);
  console.log(`      视频数: ${account['视频数量']}条`);
  console.log(`      平均播放: ${account['平均播放量'].toLocaleString()}`);
  console.log(`      平均点赞: ${account['平均点赞数'].toLocaleString()}`);
  console.log(`      质量评分: ${account['平均质量评分']}/10`);
  console.log(`      主要类型: ${account['主要内容类型']}`);
  console.log(`      主要品类: ${account['主要茶叶品类']}`);
});

// 按主要内容类型统计账号数
const accountsByContentType = {};
accountStats.forEach(acc => {
  const type = acc['主要内容类型'];
  accountsByContentType[type] = (accountsByContentType[type] || 0) + 1;
});

console.log(`\n   账号内容类型分布:`);
Object.entries(accountsByContentType).forEach(([type, count]) => {
  const percentage = (count / accountStats.length * 100).toFixed(1);
  console.log(`     ${type}: ${count}个账号 (${percentage}%)`);
});

// 按主要茶叶品类统计账号数
const accountsByTeaCategory = {};
accountStats.forEach(acc => {
  const category = acc['主要茶叶品类'];
  accountsByTeaCategory[category] = (accountsByTeaCategory[category] || 0) + 1;
});

console.log(`   账号茶叶品类分布:`);
Object.entries(accountsByTeaCategory).forEach(([category, count]) => {
  const percentage = (count / accountStats.length * 100).toFixed(1);
  console.log(`     ${category}: ${count}个账号 (${percentage}%)`);
});

// ============================================
// 6. 存储账号数量到static data
// ============================================

$workflow.staticData.accountsProcessed = accountStats.length;

console.log(`\n💾 账号数量已存储到workflow.staticData`);

// ============================================
// 7. 返回账号统计数据
// ============================================

console.log(`\n✅ Node-018 完成\n`);

return accountStats.map(stat => ({ json: stat }));
