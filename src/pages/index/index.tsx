import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Heart, User, Flame } from 'lucide-react-taro';

interface Memorial {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  description: string | null;
  mourning_count: number;
  visit_count: number;
  gender?: string;
}

const IndexPage = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemorials();
  }, []);

  const fetchMemorials = async () => {
    try {
      const res = await Network.request({
        url: '/api/memorials',
        method: 'GET'
      });
      console.log('Memorials response:', res.data);
      if (res.data?.code === 200) {
        setMemorials(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch memorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  };

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
        <View className="flex flex-col items-center gap-3">
          <View className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <Text className="block text-sm text-slate-500 font-medium">
            加载中...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
      {/* 头部 - 直接从顶部开始，增加高度 */}
      <View className="bg-gradient-to-b from-white to-blue-50 px-4 py-4 border-b border-blue-200" style={{ paddingTop: '44px' }}>
        <View className="flex items-center justify-between">
          <View>
            <Text className="block text-2xl font-bold text-blue-900">
              温故
            </Text>
            <Text className="block text-xs text-slate-500 mt-0.5">
              温暖回忆，永存心间
            </Text>
          </View>
          {/* 右侧装饰图标 - 蜡烛 */}
          <View className="flex flex-col items-center opacity-30">
            <Flame color="#3b82f6" size={20} />
            <View className="w-4 h-5 bg-blue-400 rounded-sm -mt-1" />
          </View>
        </View>
      </View>

      {/* 故人列表 */}
      <View className="px-4 py-4">
        {memorials.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-24">
            <View className="w-24 h-24 mb-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-sm">
              <Flame color="#3b82f6" size={48} strokeWidth={1.5} />
            </View>
            <Text className="block text-base font-medium text-slate-600 mb-2">
              暂无纪念空间
            </Text>
            <Text className="block text-sm text-slate-400 mb-6">
              前往&ldquo;我的&rdquo;页面创建纪念空间
            </Text>
            <View
              className="px-6 py-2.5 bg-blue-500 text-white rounded-full shadow-md cursor-pointer"
              onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
            >
              <Text className="text-sm font-medium">前往创建</Text>
            </View>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {memorials.map((memorial) => (
              <View
                key={memorial.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-blue-100"
                onClick={() => goToDetail(memorial.id)}
              >
                {/* 正方形图片区域 - 添加渐变背景 */}
                <View className="aspect-square relative bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center overflow-hidden">
                  {memorial.avatar_url ? (
                    <Image
                      src={memorial.avatar_url}
                      className="w-full h-full"
                      mode="aspectFill"
                      onError={() => {
                        console.log('Image load failed:', memorial.avatar_url);
                      }}
                    />
                  ) : (
                    <View className="flex flex-col items-center gap-2">
                      <View className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        <User color="#3b82f6" size={32} strokeWidth={1.5} />
                      </View>
                      <Text className="text-xs text-slate-400">暂无头像</Text>
                    </View>
                  )}
                </View>

                {/* 信息区域 - 高度自适应 */}
                <View className="p-3 bg-gradient-to-b from-blue-50 to-white flex flex-col">
                  {/* 名字和日期 */}
                  <View className="flex items-center justify-between mb-1">
                    <Text className="text-base font-bold text-blue-900 truncate flex-1">
                      {memorial.name}
                    </Text>
                    <Text className="text-xs text-slate-400 ml-1">
                      {memorial.birth_date && memorial.death_date
                        ? `${String(new Date(memorial.birth_date).getFullYear()).slice(-2)}年/${String(new Date(memorial.birth_date).getMonth() + 1).padStart(2, '0')}月 ~ ${String(new Date(memorial.death_date).getFullYear()).slice(-2)}年/${String(new Date(memorial.death_date).getMonth() + 1).padStart(2, '0')}月`
                        : ''}
                    </Text>
                  </View>
                  {/* 简介 - 最多两行，去除名字 */}
                  {memorial.description && (
                    <Text className="block text-xs text-slate-500 mb-2 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {memorial.description.replace(memorial.name, '').trim()}
                    </Text>
                  )}
                  <View className="flex items-center gap-1.5">
                    <View className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                      <Heart color="#3b82f6" size={10} />
                      <Text className="text-xs text-blue-600 font-medium">
                        {memorial.mourning_count}
                      </Text>
                    </View>
                    <View className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                      <User color="#94a3b8" size={10} />
                      <Text className="text-xs text-slate-500">
                        {memorial.visit_count}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default IndexPage;
