// ============================================
// Node-003: 解析配置
// ============================================
// 功能：
// 1. 将配置数组转换为config对象
// 2. 进行类型转换（字符串→数字/布尔）
// 3. 验证必填参数
// 4. 存储到workflow static data
// 5. 添加元数据（批次标识、时间戳等）
// ============================================

const items = $input.all();

console.log(`📊 开始解析配置，共 ${items.length} 个参数`);

// ============================================
// 1. 转换配置数组为对象
// ============================================
const configArray = items.map(item => item.json);
const config = {};

configArray.forEach(item => {
  const key = item['参数名'];
  let value = item['参数值'];

  // 类型转换
  // 数字类型
  if (['videosPerAccount', 'minLikeCount_incremental', 'minLikeCount_full',
       'minPlayCount_incremental', 'minPlayCount_full', 'minDuration',
       'maxDuration', 'daysToCrawl', 'dedupDays', 'accountDelay',
       'batchDelay', 'maxRetries'].includes(key)) {
    value = parseInt(value);
  }
  // 浮点数类型
  else if (['minInteractionRate_incremental', 'minInteractionRate_full',
            'similarityThreshold'].includes(key)) {
    value = parseFloat(value);
  }
  // 布尔类型
  else if (key === 'enableDedup') {
    value = value === 'TRUE' || value === true;
  }

  config[key] = value;
});

console.log(`✅ 配置解析完成：${JSON.stringify(config, null, 2)}`);

// ============================================
// 2. 验证必填参数
// ============================================
const requiredParams = [
  'mode', 'videosPerAccount', 'minLikeCount_incremental',
  'minLikeCount_full', 'minPlayCount_incremental', 'minPlayCount_full',
  'minDuration', 'maxDuration', 'daysToCrawl', 'enableDedup',
  'accountDelay', 'batchDelay', 'maxRetries'
];

const missingParams = requiredParams.filter(param => !config.hasOwnProperty(param));

if (missingParams.length > 0) {
  const error = `❌ 缺少必填参数: ${missingParams.join(', ')}`;
  console.error(error);
  throw new Error(error);
}

console.log(`✅ 参数验证通过，所有必填参数齐全`);

// ============================================
// 3. 添加元数据
// ============================================
const now = new Date();
const batchId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${config.mode}`;

config.batchId = batchId;
config.startTime = now.toISOString();
config.accountsPerBatch = 10;  // 固定值：每10个账号批量写入一次

console.log(`📅 批次标识: ${batchId}`);
console.log(`⏰ 开始时间: ${config.startTime}`);

// ============================================
// 4. 根据mode选择对应的质量阈值
// ============================================
if (config.mode === 'incremental') {
  config.minLikeCount = config.minLikeCount_incremental;
  config.minPlayCount = config.minPlayCount_incremental;
  config.minInteractionRate = config.minInteractionRate_incremental;
  console.log(`🔄 使用增量模式阈值: 点赞≥${config.minLikeCount}, 播放≥${config.minPlayCount}`);
} else if (config.mode === 'full') {
  config.minLikeCount = config.minLikeCount_full;
  config.minPlayCount = config.minPlayCount_full;
  config.minInteractionRate = config.minInteractionRate_full;
  console.log(`📦 使用全量模式阈值: 点赞≥${config.minLikeCount}, 播放≥${config.minPlayCount}`);
} else {
  throw new Error(`❌ 无效的mode值: ${config.mode}，必须是incremental或full`);
}

// ============================================
// 5. 存储到workflow static data
// ============================================
// 关键：存储后所有节点都能访问，无需在数据流中携带
$workflow.staticData.config = config;

console.log(`💾 配置已存储到 workflow.staticData.config`);
console.log(`✅ Node-003 执行完成\n`);

// ============================================
// 6. 返回简化的输出（只包含关键信息）
// ============================================
return [{
  json: {
    mode: config.mode,
    batchId: config.batchId,
    startTime: config.startTime,
    videosPerAccount: config.videosPerAccount,
    minLikeCount: config.minLikeCount,
    minPlayCount: config.minPlayCount,
    accountsPerBatch: config.accountsPerBatch,
    message: "配置解析完成，已存储到static data"
  }
}];
