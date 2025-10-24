// ============================================
// Node-014: 第二次去重（相似度去重）
// ============================================
// 功能：
// 1. 对已通过ID去重的视频进行相似度检测
// 2. 使用Jaccard相似度 + Bigram分词
// 3. 相似度阈值：80%
// 4. 性能优化：限制比对数量
// 5. 返回最终的唯一视频列表
// ============================================

console.log(`\n🎯 开始第二次去重（相似度去重）`);

// ============================================
// 1. 获取输入数据
// ============================================
const videos = $input.all().map(item => item.json);

console.log(`📥 输入视频数: ${videos.length}`);

// ============================================
// 2. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config');
}

const similarityThreshold = config.similarityThreshold || 0.80;  // 默认80%
const maxComparisonCount = config.maxComparisonCount || 1000;  // 最多比对1000条历史数据

console.log(`📊 相似度阈值: ${(similarityThreshold * 100).toFixed(0)}%`);
console.log(`🔢 最大比对数: ${maxComparisonCount}`);

// ============================================
// 3. 验证输入数据
// ============================================
if (videos.length === 0) {
  console.warn(`⚠️  无视频数据，跳过相似度去重`);
  return [];
}

// ============================================
// 4. Bigram分词函数
// ============================================
/**
 * 将文本分割为bigram集合
 * 例如：'你好世界' → ['你好', '好世', '世界']
 */
function generateBigrams(text) {
  if (!text || text.length < 2) {
    return new Set();
  }

  // 去除空格和特殊字符
  const cleanText = text.replace(/\s+/g, '').trim();

  if (cleanText.length < 2) {
    return new Set();
  }

  const bigrams = new Set();

  for (let i = 0; i < cleanText.length - 1; i++) {
    const bigram = cleanText.substring(i, i + 2);
    bigrams.add(bigram);
  }

  return bigrams;
}

// ============================================
// 5. Jaccard相似度计算函数
// ============================================
/**
 * 计算两个集合的Jaccard相似度
 * Jaccard = |A ∩ B| / |A ∪ B|
 */
function calculateJaccardSimilarity(set1, set2) {
  if (set1.size === 0 && set2.size === 0) {
    return 1.0;  // 两个空集合视为完全相似
  }

  if (set1.size === 0 || set2.size === 0) {
    return 0.0;  // 一个空一个非空，完全不相似
  }

  // 计算交集
  const intersection = new Set([...set1].filter(x => set2.has(x)));

  // 计算并集
  const union = new Set([...set1, ...set2]);

  // Jaccard相似度
  return intersection.size / union.size;
}

// ============================================
// 6. 构建文本特征
// ============================================
/**
 * 为视频构建用于比对的文本特征
 */
function buildTextFeature(video) {
  // 合并标题和字幕
  const combinedText = [
    video.desc || '',
    video.subtitleText || ''
  ].join(' ').trim();

  return combinedText;
}

// ============================================
// 7. 相似度去重主逻辑
// ============================================
const uniqueVideos = [];
const duplicateVideos = [];

// 为每个视频计算bigram特征
const videoFeatures = videos.map(video => {
  const text = buildTextFeature(video);
  const bigrams = generateBigrams(text);

  return {
    video: video,
    text: text,
    bigrams: bigrams,
    textLength: text.length
  };
});

console.log(`\n🔍 开始相似度比对...`);

// 遍历每个视频
for (let i = 0; i < videoFeatures.length; i++) {
  const current = videoFeatures[i];

  // 跳过文本过短的视频（无法有效比对）
  if (current.textLength < 10) {
    console.warn(`⚠️  视频文本过短，跳过相似度检测 [${current.video.videoId}]`);
    uniqueVideos.push(current.video);
    continue;
  }

  let isDuplicate = false;
  let maxSimilarity = 0;
  let similarVideoId = null;

  // 与已确认唯一的视频比对（限制比对数量）
  const comparisonLimit = Math.min(uniqueVideos.length, maxComparisonCount);

  for (let j = 0; j < comparisonLimit; j++) {
    const existingFeature = videoFeatures.find(f => f.video === uniqueVideos[j]);

    if (!existingFeature) continue;

    // 跳过文本过短的历史视频
    if (existingFeature.textLength < 10) continue;

    // 计算Jaccard相似度
    const similarity = calculateJaccardSimilarity(current.bigrams, existingFeature.bigrams);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      similarVideoId = existingFeature.video.videoId;
    }

    // 如果相似度超过阈值，标记为重复
    if (similarity >= similarityThreshold) {
      isDuplicate = true;
      break;
    }
  }

  if (isDuplicate) {
    // 标记为重复
    duplicateVideos.push({
      ...current.video,
      similarityInfo: {
        isDuplicate: true,
        similarity: maxSimilarity,
        similarVideoId: similarVideoId
      }
    });

    console.log(`  🔁 重复: [${current.video.videoId}] 与 [${similarVideoId}] 相似度 ${(maxSimilarity * 100).toFixed(1)}%`);
  } else {
    // 确认为唯一
    uniqueVideos.push(current.video);
  }

  // 进度日志（每100条）
  if ((i + 1) % 100 === 0) {
    console.log(`  ⏳ 已处理 ${i + 1}/${videoFeatures.length}`);
  }
}

// ============================================
// 8. 统计去重结果
// ============================================
const similarityStats = {
  inputCount: videos.length,
  uniqueCount: uniqueVideos.length,
  duplicateCount: duplicateVideos.length,
  dedupRate: (duplicateVideos.length / videos.length * 100).toFixed(2) + '%'
};

console.log(`\n📊 相似度去重统计:`);
console.log(`  输入视频数: ${similarityStats.inputCount}`);
console.log(`  唯一视频: ${similarityStats.uniqueCount}`);
console.log(`  相似重复: ${similarityStats.duplicateCount}`);
console.log(`  去重率: ${similarityStats.dedupRate}`);

// ============================================
// 9. 打印相似重复示例
// ============================================
if (duplicateVideos.length > 0) {
  console.log(`\n🔁 相似重复视频示例（前3条）:`);
  duplicateVideos.slice(0, 3).forEach((video, idx) => {
    console.log(`  ${idx + 1}. [${video.videoId}] 相似度 ${(video.similarityInfo.similarity * 100).toFixed(1)}%`);
    console.log(`     内容: ${video.desc.substring(0, 50)}...`);
  });

  if (duplicateVideos.length > 3) {
    console.log(`  ... 还有 ${duplicateVideos.length - 3} 条相似重复视频`);
  }
}

// ============================================
// 10. 为唯一视频添加去重标记
// ============================================
const outputVideos = uniqueVideos.map(video => ({
  ...video,
  deduplication: {
    ...video.deduplication,
    similarityDedup: true,
    similarityThreshold: similarityThreshold,
    finalUnique: true
  }
}));

console.log(`✅ Node-014 执行完成\n`);

// ============================================
// 11. 返回最终的唯一视频列表
// ============================================
if (outputVideos.length === 0) {
  console.warn(`⚠️  相似度去重后无新视频`);
  return [];
}

console.log(`📤 最终输出视频数: ${outputVideos.length}\n`);

return outputVideos.map(video => ({
  json: video
}));
