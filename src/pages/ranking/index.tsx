import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Award, Heart, User } from 'lucide-react-taro';

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

const RankingPage = () => {
  const [rankings, setRankings] = useState<Memorial[]>([]);
  const [type, setType] = useState<'mourning' | 'visit'>('mourning');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, [type]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await Network.request({
        url: '/api/rankings',
        method: 'GET',
        data: { type }
      });
      console.log('Rankings response:', res.data);
      if (res.data?.code === 200) {
        setRankings(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { color: '#fbbf24', text: '1' }; // gold
    if (index === 1) return { color: '#9ca3af', text: '2' }; // silver
    if (index === 2) return { color: '#b45309', text: '3' }; // bronze
    return { color: '#a8a29e', text: `${index + 1}` }; // gray
  };

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-orange-50">
        <View className="flex flex-col items-center gap-3">
          <View className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <Text className="block text-sm text-stone-400">
            加载中...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-orange-50">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-orange-100">
        <View className="flex items-center justify-between mb-4">
          <Text className="block text-2xl font-bold text-stone-900">
            排行榜
          </Text>
        </View>

        {/* 切换按钮 */}
        <View className="flex bg-orange-100 rounded-full p-1">
          <View
            className={`flex-1 py-2 rounded-full text-center ${
              type === 'mourning' ? 'bg-orange-500' : ''
            }`}
            onClick={() => setType('mourning')}
          >
            <Text
              className={`text-sm font-medium ${
                type === 'mourning' ? 'text-white' : 'text-stone-600'
              }`}
            >
              悼念排行
            </Text>
          </View>
          <View
            className={`flex-1 py-2 rounded-full text-center ${
              type === 'visit' ? 'bg-orange-500' : ''
            }`}
            onClick={() => setType('visit')}
          >
            <Text
              className={`text-sm font-medium ${
                type === 'visit' ? 'text-white' : 'text-stone-600'
              }`}
            >
              拜访排行
            </Text>
          </View>
        </View>
      </View>

      {/* 排行榜列表 */}
      <View className="px-4 py-6">
        {rankings.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <View className="w-24 h-24 mb-6 opacity-30">
              <Award color="#a8a29e" size={96} strokeWidth={1.5} />
            </View>
            <Text className="block text-base text-stone-500 mb-2">
              暂无排行数据
            </Text>
            <Text className="block text-sm text-stone-400">
              还没有人进行悼念或拜访
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {rankings.map((item, index) => {
              const badge = getRankBadge(index);
              return (
                <View
                  key={item.id}
                  className={`flex items-center gap-4 py-4 ${
                    index !== rankings.length - 1 ? 'border-b border-orange-100' : ''
                  }`}
                  onClick={() => goToDetail(item.id)}
                >
                  {/* 排名 */}
                  <View
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: badge.color }}
                  >
                    <Text className="text-white font-bold text-lg">
                      {badge.text}
                    </Text>
                  </View>

                  {/* 信息 */}
                  <View className="flex-1">
                    <Text className="block text-base font-medium text-stone-900 mb-1">
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text className="block text-xs text-stone-500 line-clamp-1">
                        {item.description}
                      </Text>
                    )}
                  </View>

                  {/* 数据 */}
                  <View className="flex items-center gap-2">
                    {type === 'mourning' ? (
                      <>
                        <Heart color="#f97316" size={18} />
                        <Text className="text-lg font-bold text-orange-500">
                          {item.mourning_count}
                        </Text>
                      </>
                    ) : (
                      <>
                        <User color="#a8a29e" size={18} />
                        <Text className="text-lg font-bold text-stone-600">
                          {item.visit_count}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default RankingPage;
