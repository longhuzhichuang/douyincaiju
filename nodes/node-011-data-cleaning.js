// ============================================
// Node-011: 数据清洗与转换
// ============================================
// 功能：
// 1. 从API响应中提取视频数据
// 2. 数据扩展：1个账号 → N个视频
// 3. 清洗和格式化字段
// 4. 合并字幕文本
// 5. 计算互动率
// 6. 添加账号信息
// ============================================

const account = $input.first().json;

console.log(`\n🔧 开始数据清洗与转换`);
console.log(`   账号: ${account.accountName}`);

// ============================================
// 1. 检查API调用结果
// ============================================
if (!account.apiResult || !account.apiResult.success) {
  const errorMsg = account.apiResult?.errorMessage || '未知错误';
  console.error(`❌ API调用失败: ${errorMsg}`);

  // 返回空数组，后续节点会跳过
  return [];
}

const videos = account.apiResult.videos || [];
const mode = account.apiResult.mode;

console.log(`📊 原始视频数: ${videos.length}`);
console.log(`🔄 采集模式: ${mode}`);

if (videos.length === 0) {
  console.warn(`⚠️  无视频数据，跳过清洗`);
  return [];
}

// ============================================
// 2. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config');
}

// ============================================
// 3. 数据清洗和转换函数
// ============================================

/**
 * 合并字幕文本
 */
function mergeSubtitles(subtitleInfos) {
  if (!subtitleInfos || !Array.isArray(subtitleInfos) || subtitleInfos.length === 0) {
    return '';
  }

  try {
    // 提取所有字幕文本并合并
    const texts = subtitleInfos
      .map(item => item.utterances || [])
      .flat()
      .map(utterance => utterance.text || '')
      .filter(text => text.length > 0);

    return texts.join(' ');
  } catch (error) {
    console.warn(`⚠️  字幕合并失败: ${error.message}`);
    return '';
  }
}

/**
 * 计算互动率
 */
function calculateInteractionRate(stats) {
  const playCount = parseInt(stats.play_count) || 0;

  if (playCount === 0) {
    return 0;
  }

  const likeCount = parseInt(stats.digg_count) || 0;
  const commentCount = parseInt(stats.comment_count) || 0;
  const shareCount = parseInt(stats.share_count) || 0;

  // 互动率 = (点赞 + 评论 + 分享) / 播放量
  const interactionRate = (likeCount + commentCount + shareCount) / playCount;

  return parseFloat(interactionRate.toFixed(4));  // 保留4位小数
}

/**
 * 安全获取嵌套属性
 */
function safeGet(obj, path, defaultValue = null) {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    return result;
  } catch {
    return defaultValue;
  }
}

// ============================================
// 4. 遍历并清洗每个视频
// ============================================
const cleanedVideos = [];

videos.forEach((video, index) => {
  try {
    // 提取统计数据
    const stats = video.statistics || {};

    // 提取视频信息
    const videoInfo = video.video || {};
    const musicInfo = video.music || {};
    const authorInfo = video.author || {};

    // 计算互动率
    const interactionRate = calculateInteractionRate(stats);

    // 合并字幕
    const subtitleText = mergeSubtitles(safeGet(video, 'video.subtitle_infos', []));

    // 清洗后的视频对象
    const cleanedVideo = {
      // ============================================
      // 视频基本信息
      // ============================================
      videoId: video.aweme_id || '',
      createTime: parseInt(video.create_time) || 0,
      createTimeStr: video.create_time ? new Date(parseInt(video.create_time) * 1000).toISOString() : '',

      // 视频内容
      desc: (video.desc || '').trim(),
      subtitleText: subtitleText.trim(),

      // ============================================
      // 统计数据
      // ============================================
      likeCount: parseInt(stats.digg_count) || 0,
      commentCount: parseInt(stats.comment_count) || 0,
      shareCount: parseInt(stats.share_count) || 0,
      playCount: parseInt(stats.play_count) || 0,
      collectCount: parseInt(stats.collect_count) || 0,
      forwardCount: parseInt(stats.forward_count) || 0,

      // 互动率（计算字段）
      interactionRate: interactionRate,

      // ============================================
      // 视频元数据
      // ============================================
      duration: parseInt(videoInfo.duration) || 0,
      width: parseInt(videoInfo.width) || 0,
      height: parseInt(videoInfo.height) || 0,
      ratio: videoInfo.ratio || '',

      // 视频URL
      playAddr: safeGet(videoInfo, 'play_addr.url_list.0', ''),
      coverUrl: safeGet(videoInfo, 'cover.url_list.0', ''),
      dynamicCoverUrl: safeGet(videoInfo, 'dynamic_cover.url_list.0', ''),

      // ============================================
      // 音乐信息
      // ============================================
      musicId: musicInfo.id || '',
      musicTitle: (musicInfo.title || '').trim(),
      musicAuthor: (musicInfo.author || '').trim(),

      // ============================================
      // 作者信息（来自API）
      // ============================================
      authorUid: authorInfo.uid || '',
      authorSecUid: authorInfo.sec_uid || '',
      authorNickname: (authorInfo.nickname || '').trim(),

      // ============================================
      // 账号信息（来自监控列表）
      // ============================================
      accountName: account.accountName,
      accountSecUid: account.secUid,
      accountCategory: account.category,

      // ============================================
      // 采集信息
      // ============================================
      collectionMode: mode,
      collectionTime: account.apiResult.collectionTime,
      batchId: config.batchId,
      batchNumber: account.batchNumber,

      // ============================================
      // 索引信息
      // ============================================
      videoIndex: index + 1,  // 视频在该账号中的序号（从1开始）
      accountIndex: account.index,  // 账号在列表中的序号
    };

    cleanedVideos.push(cleanedVideo);

  } catch (error) {
    console.error(`❌ 视频数据清洗失败 [索引${index}]: ${error.message}`);
    // 继续处理其他视频
  }
});

console.log(`✅ 数据清洗完成: ${cleanedVideos.length}/${videos.length}`);

// ============================================
// 5. 数据验证
// ============================================
if (cleanedVideos.length === 0) {
  console.error(`❌ 清洗后无有效视频数据`);
  return [];
}

// ============================================
// 6. 统计清洗结果
// ============================================
const stats = {
  totalVideos: cleanedVideos.length,
  withSubtitles: cleanedVideos.filter(v => v.subtitleText.length > 0).length,
  avgInteractionRate: cleanedVideos.reduce((sum, v) => sum + v.interactionRate, 0) / cleanedVideos.length,
  avgPlayCount: Math.round(cleanedVideos.reduce((sum, v) => sum + v.playCount, 0) / cleanedVideos.length),
  avgLikeCount: Math.round(cleanedVideos.reduce((sum, v) => sum + v.likeCount, 0) / cleanedVideos.length)
};

console.log(`\n📊 清洗结果统计:`);
console.log(`  总视频数: ${stats.totalVideos}`);
console.log(`  带字幕: ${stats.withSubtitles}/${stats.totalVideos}`);
console.log(`  平均互动率: ${(stats.avgInteractionRate * 100).toFixed(2)}%`);
console.log(`  平均播放量: ${stats.avgPlayCount}`);
console.log(`  平均点赞数: ${stats.avgLikeCount}`);

console.log(`✅ Node-011 执行完成\n`);

// ============================================
// 7. 返回清洗后的视频列表（数据扩展：1→N）
// ============================================
// 注意：这里将1个账号扩展为N个视频item
return cleanedVideos.map(video => ({
  json: video
}));
