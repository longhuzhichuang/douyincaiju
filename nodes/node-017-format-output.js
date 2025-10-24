// ============================================
// Node-017: 格式化输出数据
// ============================================
// 功能：
// 1. 将所有视频数据格式化为Google Sheets标准27列格式
// 2. 数据质量检查和验证
// 3. 统计分析（内容类型、茶叶品类、质量评分）
// 4. 存储统计数据到workflow static data供后续节点使用
// ============================================

// 获取所有视频数据
const allVideos = $input.all().map(item => item.json);

console.log(`\n📋 格式化输出数据`);
console.log(`   视频总数: ${allVideos.length}条`);

// ============================================
// 1. 定义27列标准格式
// ============================================

const COLUMNS = [
  // 基础信息 (1-7)
  '视频ID',
  '账号名称',
  '账号类别',
  '视频标题',
  '发布时间',
  '视频时长(秒)',
  '视频链接',

  // 互动数据 (8-14)
  '播放量',
  '点赞数',
  '评论数',
  '分享数',
  '收藏数',
  '互动率(%)',
  '点赞率(%)',

  // 内容信息 (15-16)
  '视频文案',
  '话题标签',

  // AI分析结果 (17-22)
  '内容类型',
  '茶叶品类',
  '卖点信息',
  '目标受众',
  '行动召唤',
  'AI质量评分',

  // 元数据 (23-27)
  '采集时间',
  '批次ID',
  '采集模式',
  '是否重复',
  '去重方法'
];

console.log(`   输出格式: ${COLUMNS.length}列标准格式`);

// ============================================
// 2. 格式化每条视频数据
// ============================================

const formattedData = allVideos.map((video, index) => {
  try {
    // 计算点赞率
    const likeRate = video.playCount > 0
      ? ((video.likeCount / video.playCount) * 100).toFixed(2)
      : 0;

    // 构建视频链接
    const videoUrl = video.playAddr || `https://www.douyin.com/video/${video.videoId}`;

    // 去重方法描述
    let dedupMethod = 'none';
    if (video.deduplication) {
      if (video.deduplication.isDuplicate) {
        dedupMethod = video.deduplication.dedupMethod || 'unknown';
      } else if (video.deduplication.finalUnique) {
        dedupMethod = 'all_dedup_passed';
      }
    }

    // 构建27列数据（严格按顺序）
    const row = {
      // 基础信息
      '视频ID': video.videoId || '',
      '账号名称': video.accountName || '',
      '账号类别': video.accountCategory || '',
      '视频标题': (video.desc || '').substring(0, 200), // 限制长度
      '发布时间': video.createTimeStr || '',
      '视频时长(秒)': video.duration || 0,
      '视频链接': videoUrl,

      // 互动数据
      '播放量': video.playCount || 0,
      '点赞数': video.likeCount || 0,
      '评论数': video.commentCount || 0,
      '分享数': video.shareCount || 0,
      '收藏数': video.collectCount || 0,
      '互动率(%)': parseFloat((video.interactionRate * 100).toFixed(2)),
      '点赞率(%)': parseFloat(likeRate),

      // 内容信息
      '视频文案': (video.subtitleText || '').substring(0, 500), // 限制长度
      '话题标签': '', // 可以从desc中提取#标签

      // AI分析结果
      '内容类型': video.contentType || '未知',
      '茶叶品类': video.teaCategory || '未知',
      '卖点信息': (video.sellingPoints || '').substring(0, 200),
      '目标受众': (video.targetAudience || '').substring(0, 200),
      '行动召唤': video.callToAction || '无',
      'AI质量评分': video.qualityScore || 0,

      // 元数据
      '采集时间': video.collectionTime || '',
      '批次ID': video.batchId || '',
      '采集模式': video.collectionMode || '',
      '是否重复': video.deduplication?.isDuplicate ? '是' : '否',
      '去重方法': dedupMethod
    };

    return row;

  } catch (error) {
    console.error(`   ❌ 视频${index + 1}格式化失败: ${error.message}`);
    console.error(`      视频ID: ${video.videoId || '未知'}`);

    // 返回空行（保持数量一致）
    return Object.fromEntries(COLUMNS.map(col => [col, '']));
  }
});

// ============================================
// 3. 数据质量检查
// ============================================

console.log(`\n🔍 数据质量检查...`);

let validCount = 0;
let emptyCount = 0;
let aiErrorCount = 0;

formattedData.forEach((row, index) => {
  // 检查关键字段
  if (row['视频ID'] && row['视频标题']) {
    validCount++;
  } else if (!row['视频ID']) {
    emptyCount++;
    console.warn(`   ⚠️  视频${index + 1}: 缺少视频ID`);
  }

  // 检查AI分析字段
  if (row['内容类型'] === '未知' && row['AI质量评分'] === 0) {
    aiErrorCount++;
  }
});

console.log(`   ✅ 有效数据: ${validCount}条`);
console.log(`   ⚠️  缺失数据: ${emptyCount}条`);
console.log(`   ❌ AI失败: ${aiErrorCount}条`);

// ============================================
// 4. 统计分析
// ============================================

console.log(`\n📊 数据统计:`);

// 按内容类型统计
const contentTypeStats = {};
formattedData.forEach(row => {
  const type = row['内容类型'];
  contentTypeStats[type] = (contentTypeStats[type] || 0) + 1;
});

console.log(`   内容类型分布:`);
Object.entries(contentTypeStats).forEach(([type, count]) => {
  const percentage = (count / formattedData.length * 100).toFixed(1);
  console.log(`     ${type}: ${count}条 (${percentage}%)`);
});

// 按茶叶品类统计
const teaCategoryStats = {};
formattedData.forEach(row => {
  const category = row['茶叶品类'];
  teaCategoryStats[category] = (teaCategoryStats[category] || 0) + 1;
});

console.log(`   茶叶品类分布:`);
Object.entries(teaCategoryStats).forEach(([category, count]) => {
  const percentage = (count / formattedData.length * 100).toFixed(1);
  console.log(`     ${category}: ${count}条 (${percentage}%)`);
});

// 质量评分统计
const qualityScores = formattedData
  .map(row => row['AI质量评分'] || 0)
  .filter(score => score > 0); // 排除失败的（0分）

if (qualityScores.length > 0) {
  const avgQualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  const maxQualityScore = Math.max(...qualityScores);
  const minQualityScore = Math.min(...qualityScores);

  console.log(`   AI质量评分统计:`);
  console.log(`     平均分: ${avgQualityScore.toFixed(2)}/10`);
  console.log(`     最高分: ${maxQualityScore}/10`);
  console.log(`     最低分: ${minQualityScore}/10`);
  console.log(`     有效评分数: ${qualityScores.length}条`);
}

// ============================================
// 5. 统计新视频和重复视频
// ============================================

const newVideosCount = formattedData.filter(
  row => row['是否重复'] === '否'
).length;

const duplicateVideosCount = formattedData.filter(
  row => row['是否重复'] === '是'
).length;

console.log(`\n📈 去重统计:`);
console.log(`   新视频: ${newVideosCount}条`);
console.log(`   重复视频: ${duplicateVideosCount}条`);
console.log(`   去重率: ${(duplicateVideosCount / formattedData.length * 100).toFixed(2)}%`);

// ============================================
// 6. 存储统计数据到static data
// ============================================
// 供Node-018.5使用

$workflow.staticData.videosCollected = formattedData.length;
$workflow.staticData.newVideosCount = newVideosCount;
$workflow.staticData.duplicateVideosCount = duplicateVideosCount;

console.log(`\n💾 统计数据已存储到workflow.staticData`);

// ============================================
// 7. 输出Top 5高质量视频
// ============================================

if (qualityScores.length > 0) {
  console.log(`\n⭐ Top 5 高质量视频:`);

  const sortedVideos = formattedData
    .filter(row => row['AI质量评分'] > 0)
    .sort((a, b) => b['AI质量评分'] - a['AI质量评分'])
    .slice(0, 5);

  sortedVideos.forEach((row, index) => {
    console.log(`   ${index + 1}. ${row['账号名称']} - ${row['视频标题'].substring(0, 30)}...`);
    console.log(`      评分: ${row['AI质量评分']}/10, 播放: ${row['播放量'].toLocaleString()}, 点赞: ${row['点赞数'].toLocaleString()}`);
  });
}

// ============================================
// 8. 返回格式化数据
// ============================================

console.log(`\n✅ Node-017 完成`);
console.log(`   输出: ${formattedData.length}条 × 27列\n`);

// 返回数组，每个元素是一条视频的27列数据
return formattedData.map(row => ({ json: row }));
