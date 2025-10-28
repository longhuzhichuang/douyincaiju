// ============================================
// Node-016: 合并AI结果
// ============================================
// 功能：
// 1. 提取DeepSeek AI响应内容
// 2. 解析JSON格式的分析结果
// 3. 验证必填字段并补充默认值
// 4. 合并AI分析到视频数据中
// 5. 三层容错机制保障工作流稳定性
// ============================================

const data = $input.first().json;

console.log(`\n📊 合并AI分析结果`);
console.log(`   视频ID: ${data.videoId || '未知'}`);

// ============================================
// 1. 提取AI响应内容
// ============================================

let aiAnalysis = null;

try {
  // DeepSeek返回的JSON在choices[0].message.content中
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) {
    throw new Error('AI响应为空');
  }

  console.log(`   AI原始响应长度: ${aiContent.length}字符`);

  // 解析JSON
  aiAnalysis = JSON.parse(aiContent);

  console.log(`   ✅ JSON解析成功`);

} catch (error) {
  console.error(`   ❌ AI结果解析失败: ${error.message}`);

  // 失败时使用默认值
  aiAnalysis = {
    content_type: "未知",
    tea_category: "未知",
    selling_points: "无法识别",
    target_audience: "未知",
    call_to_action: "无",
    quality_score: 0
  };

  console.log(`   ⚠️  使用默认AI分析值`);
}

// ============================================
// 2. 验证必填字段
// ============================================

const requiredFields = [
  'content_type',
  'tea_category',
  'selling_points',
  'target_audience',
  'call_to_action',
  'quality_score'
];

let missingFields = [];

for (const field of requiredFields) {
  if (aiAnalysis[field] === undefined || aiAnalysis[field] === null) {
    missingFields.push(field);
    // 设置默认值
    aiAnalysis[field] = field === 'quality_score' ? 0 : "未知";
  }
}

if (missingFields.length > 0) {
  console.warn(`   ⚠️  缺少字段: ${missingFields.join(', ')}`);
  console.warn(`   已补充默认值`);
}

// ============================================
// 3. 数据类型转换和验证
// ============================================

// quality_score必须是1-10的整数
if (typeof aiAnalysis.quality_score !== 'number') {
  aiAnalysis.quality_score = parseInt(aiAnalysis.quality_score) || 0;
}

// 确保在1-10范围内
if (aiAnalysis.quality_score < 1 || aiAnalysis.quality_score > 10) {
  console.warn(`   ⚠️  quality_score超出范围: ${aiAnalysis.quality_score}`);
  aiAnalysis.quality_score = Math.max(1, Math.min(10, aiAnalysis.quality_score));
}

// ============================================
// 4. 构建最终的视频数据对象
// ============================================

const finalVideo = {
  // ========== 基础信息（从原始数据） ==========
  videoId: data.videoId,
  accountName: data.accountName,
  accountSecUid: data.accountSecUid,
  accountCategory: data.accountCategory,

  desc: data.desc || '',
  createTime: data.createTime,
  createTimeStr: data.createTimeStr,
  duration: data.duration,

  // ========== 视频元数据 ==========
  playAddr: data.playAddr || '',
  coverUrl: data.coverUrl || '',
  dynamicCoverUrl: data.dynamicCoverUrl || '',
  width: data.width || 0,
  height: data.height || 0,
  ratio: data.ratio || '',

  // ========== 互动数据 ==========
  playCount: data.playCount,
  likeCount: data.likeCount,
  commentCount: data.commentCount,
  shareCount: data.shareCount,
  collectCount: data.collectCount,
  forwardCount: data.forwardCount || 0,
  interactionRate: data.interactionRate,

  // ========== 内容信息 ==========
  subtitleText: data.subtitleText || '',

  // ========== 音乐信息 ==========
  musicId: data.musicId || '',
  musicTitle: data.musicTitle || '',
  musicAuthor: data.musicAuthor || '',

  // ========== AI分析结果（新增）==========
  contentType: aiAnalysis.content_type,
  teaCategory: aiAnalysis.tea_category,
  sellingPoints: aiAnalysis.selling_points,
  targetAudience: aiAnalysis.target_audience,
  callToAction: aiAnalysis.call_to_action,
  qualityScore: aiAnalysis.quality_score,

  // ========== 采集信息 ==========
  collectionMode: data.collectionMode,
  collectionTime: data.collectionTime,
  batchId: data.batchId,
  batchNumber: data.batchNumber,

  // ========== 去重信息 ==========
  deduplication: {
    ...data.deduplication,
    aiAnalyzed: true
  },

  // ========== AI元数据 ==========
  aiModel: data.model || 'deepseek-chat',
  aiTokens: data.usage?.total_tokens || 0,
  aiAnalyzedAt: new Date().toISOString()
};

// ============================================
// 5. 日志输出
// ============================================

console.log(`   内容类型: ${finalVideo.contentType}`);
console.log(`   茶叶品类: ${finalVideo.teaCategory}`);
console.log(`   质量评分: ${finalVideo.qualityScore}/10`);
console.log(`   使用tokens: ${finalVideo.aiTokens}`);
console.log(`✅ Node-016 完成\n`);

// ============================================
// 6. 返回合并后的数据
// ============================================

return [{
  json: finalVideo
}];
