import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Heart, Award, User, Flower2 } from 'lucide-react-taro';

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

  const goToRanking = () => {
    Taro.navigateTo({
      url: '/pages/ranking/index'
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-slate-50">
        <View className="flex flex-col items-center gap-3">
          <View className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
          <Text className="block text-sm text-slate-400">
            加载中...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-slate-50">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-slate-100">
        <View className="flex items-center justify-between">
          <View>
            <Text className="block text-2xl font-bold text-slate-800">
              永恒纪念
            </Text>
            <Text className="block text-xs text-slate-400 mt-1">
              为逝者建立数字家园
            </Text>
          </View>
          <View
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full"
            onClick={goToRanking}
          >
            <Award color="#d4af37" size={16} />
            <Text className="text-sm text-amber-600 font-medium">
              排行榜
            </Text>
          </View>
        </View>
      </View>

      {/* 墓碑列表 */}
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
              还没有创建纪念空间
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {memorials.map((memorial) => (
              <View
                key={memorial.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                onClick={() => goToDetail(memorial.id)}
              >
                <View className="flex items-center gap-3 mb-3">
                  <View className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {memorial.avatar_url ? (
                      <Image
                        src={memorial.avatar_url}
                        className="w-full h-full"
                        mode="aspectFill"
                      />
                    ) : (
                      <User color="#94a3b8" size={32} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="block text-lg font-bold text-slate-800">
                      {memorial.name}
                    </Text>
                    <Text className="block text-xs text-slate-400">
                      {memorial.birth_date && memorial.death_date
                        ? `${formatDate(memorial.birth_date)} ~ ${formatDate(memorial.death_date)}`
                        : '日期未知'}
                    </Text>
                  </View>
                </View>
                {memorial.description && (
                  <Text className="block text-sm text-slate-600 mb-3 line-clamp-2">
                    {memorial.description}
                  </Text>
                )}
                <View className="flex items-center gap-2">
                  <View className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 rounded-full">
                    <Heart color="#d4af37" size={16} />
                    <Text className="text-xs text-amber-600 font-medium">
                      悼念 {memorial.mourning_count}
                    </Text>
                  </View>
                  <View className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 rounded-full">
                    <User color="#64748b" size={16} />
                    <Text className="text-xs text-slate-500 font-medium">
                      拜访 {memorial.visit_count}
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
