// ============================================
// Node-010-B: TikHub API调用（全量模式）
// ============================================
// 功能：
// 1. 调用TikHub API采集历史视频（全量模式）
// 2. 实现分页循环采集（最多2000条）
// 3. 应用全量模式的过滤条件
// 4. 合并多页数据
// 5. 错误处理和重试机制
// ============================================

const account = $input.first().json;

console.log(`\n🌐 开始全量模式API采集`);
console.log(`   账号: ${account.accountName}`);
console.log(`   sec_uid: ${account.secUid}`);

// ============================================
// 1. 从static data读取config
// ============================================
const config = $workflow.staticData.config;

if (!config) {
  throw new Error('❌ 无法从static data读取config');
}

// TikHub API配置
const apiKey = config.tikhubApiKey;
const apiEndpoint = 'https://api.tikhub.io/api/v1/douyin/app/v1/fetch_user_post_videos';

// 全量模式参数
const videosPerAccount = config.videosPerAccount || 200;  // 每次采集数量上限
const minLikeCount = config.minLikeCount_full || 1000;
const minPlayCount = config.minPlayCount_full || 10000;

// 分页参数
const pageSize = 20;  // 每页20条（TikHub API限制）
const maxPages = Math.ceil(Math.min(videosPerAccount, 2000) / pageSize);  // 最多100页

console.log(`📋 全量模式配置:`);
console.log(`   采集上限: ${videosPerAccount}条`);
console.log(`   点赞数≥${minLikeCount}, 播放量≥${minPlayCount}`);
console.log(`   分页策略: 每页${pageSize}条，最多${maxPages}页`);

// ============================================
// 2. 分页循环采集
// ============================================
let allVideos = [];
let currentPage = 1;
let hasMore = true;
let cursor = 0;  // TikHub使用cursor分页

while (hasMore && currentPage <= maxPages) {
  console.log(`\n📄 采集第${currentPage}/${maxPages}页 (cursor: ${cursor})`);

  try {
    // 构建API请求参数
    const requestParams = {
      sec_uid: account.secUid,
      count: pageSize,
      cursor: cursor,

      // API层过滤（减少数据传输）
      filter_like_count_min: minLikeCount,
      filter_play_count_min: minPlayCount,

      // 排序方式：按发布时间倒序
      sort_type: 0
    };

    // 构建请求URL
    const url = new URL(apiEndpoint);
    Object.keys(requestParams).forEach(key => {
      url.searchParams.append(key, requestParams[key]);
    });

    console.log(`🔗 请求URL: ${url.toString().substring(0, 100)}...`);

    // 发起HTTP请求（使用n8n的$http对象）
    const response = await $http.request({
      method: 'GET',
      url: url.toString(),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'n8n-douyin-collector/1.0'
      },
      timeout: 30000,  // 30秒超时
      returnFullResponse: true
    });

    // 检查HTTP状态码
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`);
    }

    const data = response.body;

    // 检查API响应
    if (data.code !== 0) {
      throw new Error(`TikHub API错误 [${data.code}]: ${data.message || '未知错误'}`);
    }

    // 提取视频列表
    const videos = data.data?.aweme_list || [];
    const videosCount = videos.length;

    console.log(`✅ 第${currentPage}页采集成功: ${videosCount}条视频`);

    if (videosCount === 0) {
      console.log(`⚠️  无更多数据，停止采集`);
      hasMore = false;
      break;
    }

    // 合并到总列表
    allVideos = allVideos.concat(videos);

    // 更新cursor（用于下一页）
    cursor = data.data?.cursor || 0;
    hasMore = data.data?.has_more || false;

    console.log(`   总计已采集: ${allVideos.length}条`);
    console.log(`   下一页cursor: ${cursor}`);
    console.log(`   是否还有更多: ${hasMore}`);

    // 检查是否达到上限
    if (allVideos.length >= videosPerAccount) {
      console.log(`✅ 已达到采集上限(${videosPerAccount}条)，停止采集`);
      hasMore = false;
      break;
    }

    // 如果还有更多页，等待一下（避免API限流）
    if (hasMore && currentPage < maxPages) {
      const pageDelay = 1 + Math.random();  // 1~2秒随机延迟
      console.log(`⏱️  页间延迟 ${pageDelay.toFixed(2)}秒...`);
      await new Promise(resolve => setTimeout(resolve, pageDelay * 1000));
    }

    currentPage++;

  } catch (error) {
    console.error(`❌ 第${currentPage}页采集失败: ${error.message}`);

    // 如果是第一页就失败，直接抛出错误
    if (currentPage === 1) {
      throw new Error(`全量模式API调用失败: ${error.message}`);
    }

    // 如果是后续页失败，记录警告但继续处理已采集的数据
    console.warn(`⚠️  后续页采集失败，将处理已采集的${allVideos.length}条数据`);
    hasMore = false;
    break;
  }
}

// ============================================
// 3. 数据验证和统计
// ============================================
console.log(`\n📊 全量模式采集完成:`);
console.log(`   总视频数: ${allVideos.length}`);
console.log(`   实际页数: ${currentPage - 1}`);

if (allVideos.length === 0) {
  const error = `❌ 全量模式未采集到任何视频（账号: ${account.accountName}）`;
  console.error(error);

  // 返回错误标记，由后续节点处理
  return [{
    json: {
      ...account,
      apiResult: {
        success: false,
        mode: 'full',
        errorMessage: '未采集到符合条件的视频',
        videosCount: 0,
        videos: []
      }
    }
  }];
}

// 截取到指定数量
if (allVideos.length > videosPerAccount) {
  console.log(`✂️  截取前${videosPerAccount}条视频`);
  allVideos = allVideos.slice(0, videosPerAccount);
}

// ============================================
// 4. 构建输出数据
// ============================================
const outputData = {
  ...account,

  apiResult: {
    success: true,
    mode: 'full',
    videosCount: allVideos.length,
    pagesCount: currentPage - 1,
    videos: allVideos,

    // API响应元数据
    collectionTime: new Date().toISOString(),
    filters: {
      minLikeCount: minLikeCount,
      minPlayCount: minPlayCount
    }
  }
};

console.log(`✅ Node-010-B 执行完成\n`);

// ============================================
// 5. 返回带API结果的账号数据
// ============================================
return [{
  json: outputData
}];
