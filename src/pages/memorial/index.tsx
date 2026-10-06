import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { StarsBackground } from '@/components/StarsBackground';
import { Award, Heart, User, ChevronRight } from 'lucide-react-taro';

interface Memorial {
  id: string;
  name: string;
  description: string | null;
  mourningCount: number;
  visitCount: number;
}

const MemorialPage = () => {
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
      if (res.data?.code === 200) {
        setRankings(res.data.data || []);
      }
    } catch (e) {
      console.error('rankings fail', e);
    } finally {
      setLoading(false);
    }
  };

  const goDetail = (id: string) =>
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });

  const badge = (index: number) => {
    if (index === 0) return { color: '#c9a86a', text: '1' };
    if (index === 1) return { color: '#9ca3af', text: '2' };
    if (index === 2) return { color: '#d97706', text: '3' };
    return { color: '#d6d3c4', text: `${index + 1}` };
  };

  return (
    <StarsBackground>
      <View className="px-5 pt-14 pb-2">
        <Text className="block text-2xl font-bold text-white">纪念</Text>
        <Text className="block text-[#e8c07a] text-xs mt-1">把思念，郑重地交给时间</Text>
      </View>

      <View className="px-5 pt-4">
        <View className="rounded-3xl px-6 py-5" style={{ backgroundColor: 'rgba(20,46,57,0.7)', border: '1px solid rgba(232,192,122,0.25)' }}>
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="block text-[#e8c07a] text-base font-bold">暖心排行</Text>
            <View className="flex flex-row rounded-full p-0.5" style={{ backgroundColor: 'rgba(11,30,41,0.9)' }}>
              <View
                className={`px-4 py-1.5 rounded-full text-center ${type === 'mourning' ? '' : ''}`}
                style={{ backgroundColor: type === 'mourning' ? '#d9a853' : 'transparent' }}
                onClick={() => setType('mourning')}
              >
                <Text className={`text-sm font-medium ${type === 'mourning' ? 'text-white' : 'text-[#e8c07a]/60'}`}>悼念</Text>
              </View>
              <View
                className={`px-4 py-1.5 rounded-full text-center ${type === 'visit' ? '' : ''}`}
                style={{ backgroundColor: type === 'visit' ? '#d9a853' : 'transparent' }}
                onClick={() => setType('visit')}
              >
                <Text className={`text-sm font-medium ${type === 'visit' ? 'text-white' : 'text-[#e8c07a]/60'}`}>拜访</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View className="flex items-center justify-center py-10">
              <View className="w-9 h-9 border-4 border-[#e8c07a]/20 border-t-[#e8c07a] rounded-full animate-spin" />
            </View>
          ) : rankings.length === 0 ? (
            <View className="flex flex-col items-center py-12">
              <View className="opacity-40 mb-4">
                <Award color="#e8c07a" size={72} strokeWidth={1.5} />
              </View>
              <Text className="block text-base text-white mb-2">暂无排行数据</Text>
              <Text className="block text-sm text-[#e8c07a]/60">还没有人进行悼念或拜访</Text>
            </View>
          ) : (
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              {rankings.map((item, index) => {
                const b = badge(index);
                return (
                  <View
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-3.5 ${index !== rankings.length - 1 ? 'border-b border-[#e8c07a]/15' : ''}`}
                    onClick={() => goDetail(item.id)}
                  >
                    <View className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: b.color }}>
                      <Text className="text-white font-bold text-base">{b.text}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-base font-medium text-white mb-0.5">{item.name}</Text>
                      {item.description && (
                        <Text className="block text-xs text-[#e8c07a]/60 line-clamp-1">{item.description}</Text>
                      )}
                    </View>
                    <View className="flex items-center gap-1.5">
                      {type === 'mourning' ? (
                        <>
                          <Heart color="#e8c07a" size={17} />
                          <Text className="text-lg font-bold text-[#e8c07a]">{item.mourningCount}</Text>
                        </>
                      ) : (
                        <>
                          <User color="#ffffff" size={17} />
                          <Text className="text-lg font-bold text-white">{item.visitCount}</Text>
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

      {/* 入口卡片 */}
      <View className="px-5 mt-5 pb-8">
        <View
          className="flex flex-row items-center justify-between rounded-3xl px-5 py-4"
          style={{ backgroundColor: 'rgba(20,46,57,0.7)', border: '1px solid rgba(232,192,122,0.25)' }}
          onClick={() => Taro.navigateTo({ url: '/pages/ranking/index' })}
        >
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(232,192,122,0.2)' }}>
              <Award color="#e8c07a" size={20} />
            </View>
            <Text className="text-base text-white font-medium">查看完整排行榜</Text>
          </View>
          <ChevronRight color="#e8c07a" size={18} />
        </View>
      </View>
    </StarsBackground>
  );
};

export default MemorialPage;