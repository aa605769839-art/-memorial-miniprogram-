import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Award, Heart, User } from 'lucide-react-taro';
import { StarsBackground } from '@/components/StarsBackground';

interface Memorial {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  description: string | null;
  mourningCount: number;
  visitCount: number;
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
    if (index === 2) return { color: '#d97706', text: '3' }; // bronze
    return { color: '#a8a29e', text: `${index + 1}` }; // gray
  };

  if (loading) {
    return (
      <StarsBackground dim="normal">
        <View className="flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
          <View className="flex flex-col items-center gap-3">
            <View className="w-12 h-12 border-4 border-[#e8c07a]/30 border-t-[#e8c07a] rounded-full animate-spin" />
            <Text className="block text-sm text-white/60">
              加载中...
            </Text>
          </View>
        </View>
      </StarsBackground>
    );
  }

  return (
    <StarsBackground dim="light">
      {/* 头部 */}
      <View className="px-4 pt-14 pb-5" style={{ borderBottom: '1px solid rgba(232,192,122,0.25)' }}>
        <View className="flex items-center justify-between mb-4">
          <Text className="block text-2xl font-bold text-white">
            排行榜
          </Text>
        </View>

        {/* 切换按钮 */}
        <View className="flex rounded-full p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <View
            className="flex-1 py-2 rounded-full text-center"
            style={{ backgroundColor: type === 'mourning' ? '#e8c07a' : 'transparent' }}
            onClick={() => setType('mourning')}
          >
            <Text
              className={`text-sm font-medium ${
                type === 'mourning' ? 'text-[#2e1f0f]' : 'text-white/70'
              }`}
            >
              悼念排行
            </Text>
          </View>
          <View
            className="flex-1 py-2 rounded-full text-center"
            style={{ backgroundColor: type === 'visit' ? '#e8c07a' : 'transparent' }}
            onClick={() => setType('visit')}
          >
            <Text
              className={`text-sm font-medium ${
                type === 'visit' ? 'text-[#2e1f0f]' : 'text-white/70'
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
              <Award color="#e8c07a" size={96} strokeWidth={1.5} />
            </View>
            <Text className="block text-base text-white/60 mb-2">
              暂无排行数据
            </Text>
            <Text className="block text-sm text-white/40">
              还没有人进行悼念或拜访
            </Text>
          </View>
        ) : (
          <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(18,42,53,0.75)', border: '1px solid rgba(232,192,122,0.25)' }}>
            {rankings.map((item, index) => {
              const badge = getRankBadge(index);
              return (
                <View
                  key={item.id}
                  className={`flex items-center gap-4 py-4 ${
                    index !== rankings.length - 1 ? 'border-b' : ''
                  }`}
                  style={{ borderColor: 'rgba(232,192,122,0.15)' }}
                  onClick={() => goToDetail(item.id)}
                >
                  {/* 排名 */}
                  <View
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: index === 0 ? 'rgba(251,191,36,0.25)' : index === 1 ? 'rgba(156,163,175,0.25)' : 'rgba(255,255,255,0.12)',
                      border: index === 0 ? '1px solid #fbbf24' : index === 1 ? '1px solid #9ca3af' : '1px solid rgba(255,255,255,0.25)'
                    }}
                  >
                    <Text className="font-bold text-lg" style={{ color: badge.color }}>
                      {badge.text}
                    </Text>
                  </View>

                  {/* 信息 */}
                  <View className="flex-1">
                    <Text className="block text-base font-medium text-white mb-1">
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text className="block text-xs text-white/50 line-clamp-1">
                        {item.description}
                      </Text>
                    )}
                  </View>

                  {/* 数据 */}
                  <View className="flex items-center gap-2">
                    {type === 'mourning' ? (
                      <>
                        <Heart color="#e8c07a" size={18} />
                        <Text className="text-lg font-bold text-[#e8c07a]">
                          {item.mourningCount}
                        </Text>
                      </>
                    ) : (
                      <>
                        <User color="#7fc3ce" size={18} />
                        <Text className="text-lg font-bold text-white">
                          {item.visitCount}
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
    </StarsBackground>
  );
};

export default RankingPage;
