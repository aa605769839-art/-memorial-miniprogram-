const { getSupabaseClient } = require('../server/src/storage/database/supabase-client');

async function cleanPhotoUrls() {
  const client = getSupabaseClient();

  // 查询所有照片
  const { data: photos, error } = await client
    .from('photos')
    .select('*');

  if (error) {
    console.error('查询照片失败:', error);
    process.exit(1);
  }

  if (!photos) {
    console.log('没有找到照片');
    process.exit(0);
  }

  console.log(`找到 ${photos.length} 张照片`);

  // 清理每张照片的 URL
  for (const photo of photos) {
    try {
      // 尝试解析 URL 字段
      const urlValue = photo.url;

      if (typeof urlValue === 'string') {
        // 检查是否是 JSON 字符串
        if (urlValue.startsWith('{')) {
          const parsed = JSON.parse(urlValue);
          const realUrl = parsed.url;

          if (realUrl) {
            // 更新数据库
            const { error: updateError } = await client
              .from('photos')
              .update({ url: realUrl })
              .eq('id', photo.id);

            if (updateError) {
              console.error(`更新照片 ${photo.id} 失败:`, updateError);
            } else {
              console.log(`✓ 已清理照片 ${photo.id} 的 URL`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`处理照片 ${photo.id} 时出错:`, e);
    }
  }

  console.log('清理完成！');
}

cleanPhotoUrls();
