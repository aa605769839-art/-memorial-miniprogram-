import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Heart, User, Flower2 } from 'lucide-react-taro';

interface Memorial {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  description: string | null;
  mourning_count: number;
  visit_count: number;
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-blue-50">
        <View className="flex flex-col items-center gap-3">
          <View className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <Text className="block text-sm text-slate-400">
            加载中...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-blue-50">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-blue-100">
        <View>
          <Text className="block text-2xl font-bold text-blue-900">
            温故
          </Text>
          <Text className="block text-xs text-slate-500 mt-1">
            温暖回忆，永存心间
          </Text>
        </View>
      </View>

      {/* 故人列表 - 正方形网格 */}
      <View className="px-4 py-6">
        {memorials.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <View className="w-24 h-24 mb-6 opacity-30">
              <Flower2 color="#94a3b8" size={96} strokeWidth={1.5} />
            </View>
            <Text className="block text-base text-slate-500 mb-2">
              暂无内容
            </Text>
            <Text className="block text-sm text-slate-400">
              前往&ldquo;我的&rdquo;页面添加故人
            </Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {memorials.map((memorial) => (
              <View
                key={memorial.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
                onClick={() => goToDetail(memorial.id)}
              >
                {/* 正方形图片区域 */}
                <View className="aspect-square relative bg-blue-100 flex items-center justify-center overflow-hidden">
                  {memorial.avatar_url ? (
                    <Image
                      src={memorial.avatar_url}
                      className="w-full h-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <User color="#94a3b8" size={48} />
                  )}
                </View>

                {/* 信息区域 */}
                <View className="p-3 bg-gradient-to-b from-blue-50 to-white">
                  <Text className="block text-base font-bold text-blue-900 mb-1">
                    {memorial.name}
                  </Text>
                  <Text className="block text-xs text-slate-500 mb-2">
                    {memorial.birth_date && memorial.death_date
                      ? `${formatDate(memorial.birth_date)} ~ ${formatDate(memorial.death_date)}`
                      : '日期未知'}
                  </Text>
                  <View className="flex items-center gap-1">
                    <Heart color="#3b82f6" size={12} />
                    <Text className="text-xs text-blue-500">
                      {memorial.mourning_count}
                    </Text>
                    <View className="mx-1" style={{ width: 2, height: 12, backgroundColor: '#dbeafe' }} />
                    <User color="#94a3b8" size={12} />
                    <Text className="text-xs text-slate-400">
                      {memorial.visit_count}
                    </Text>
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
