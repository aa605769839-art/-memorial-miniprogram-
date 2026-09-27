import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import {
  Cross,
  CalendarDays,
  HeartHandshake,
  Archive,
  Bell,
  Flame,
  Sun,
  UserRound
} from 'lucide-react-taro';

// 老人肖像走 TOS 对象存储
const ELDER_MALE =
  'https://coze-coding-project.tos.coze.site/coze_storage_7688625912493146158/image/generate_image_99407d53-7ceb-4084-a666-0804bb070cec.jpeg?sign=1822036751-3ff48bae20-0-8f3de7f683b12bb244c51ec8963dca0c88e5d329c01c58328650428341448061';
const ELDER_FEMALE =
  'https://coze-coding-project.tos.coze.site/coze_storage_7688625912493146158/image/generate_image_875f3290-29ac-4e8d-97d7-fb78c8501238.jpeg?sign=1822036747-72dcb1b772-0-7ac9f978933a6ec6827cd76c9273a25046c89de94d735bf68a75b9ac27999ab9';

// 深青蓝→藏蓝背景上的暖金光点装饰
const SPARKS = [
  { top: '6%', left: '8%', s: 3, o: 0.8 },
  { top: '10%', left: '78%', s: 2, o: 0.6 },
  { top: '22%', left: '62%', s: 2.5, o: 0.7 },
  { top: '34%', left: '12%', s: 2, o: 0.5 },
  { top: '46%', left: '85%', s: 3, o: 0.55 },
  { top: '58%', left: '30%', s: 2, o: 0.6 },
  { top: '70%', left: '72%', s: 2.5, o: 0.5 },
  { top: '5%', left: '42%', s: 2, o: 0.4 }
];

interface Memorial {
  id: string;
  name: string;
  gender?: string;
  avatarUrl: string | null;
}

// 推荐祭拜故人动态（无真实流时兜底）
const FALLBACK_RECOMMEND = [
  { id: 'a', name: '张怀德', tag: '爷爷·逝世五周年', desc: '家人整理了他的象棋棋谱，供大家缅怀。', time: '2分钟前', avatar: ELDER_MALE },
  { id: 'b', name: '陈慧兰', tag: '外婆·生日纪念', desc: '今天是她的生日，我们都很想念她。', time: '15分钟前', avatar: ELDER_FEMALE },
  { id: 'c', name: '王建国', tag: '爷爷·逝世三周年', desc: '他生前最爱的院子开满了月季。', time: '1小时前', avatar: ELDER_MALE },
  { id: 'd', name: '刘桂兰', tag: '奶奶·生日纪念', desc: '家人一起回忆她在厨房忙碌的身影。', time: '3小时前', avatar: ELDER_FEMALE }
];

const IndexPage = () => {
  const [todayCount, setTodayCount] = useState(128);
  const [visitCount, setVisitCount] = useState(1284);
  const [participant, setParticipant] = useState(568);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [mainMemorial, setMainMemorial] = useState<Memorial | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await Network.request({ url: '/api/memorials', method: 'GET' });
      if (res.data?.code === 200) {
        const list = res.data.data || [];
        setMemorials(list);
        if (list.length > 0) {
          const first = list[0];
          setMainMemorial(first);
          setTodayCount(100 + list.length * 7 + (list.length % 11));
          setParticipant(500 + list.length * 18 + (list.length % 5));
          // 献花数 = 拜访数加和（有则用真实，无则估）
          const visits = list.reduce((s: number, m: Memorial & { visitCount?: number }) => s + (m.visitCount || 0), 0);
          if (visits > 0) setVisitCount(visits);
        }
      }
    } catch (e) {
      console.error('stats fail', e);
    }
  };

  const goDetail = (id: string) => Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  const goPeople = (id?: string) => {
    if (id) return goDetail(id);
    Taro.switchTab({ url: '/pages/people/index' });
  };
  // 四宫格入口映射
  const goEntrance = (key: string) => {
    if (key === 'tomb') return goPeople();
    if (key === 'calendar') return goPeople();
    if (key === 'service') Taro.switchTab({ url: '/pages/profile/index' });
    if (key === 'family') Taro.switchTab({ url: '/pages/people/index' });
  };

  // 主卡故人
  const mainName = mainMemorial?.name || '李淑芬';
  const mainTag = '逝世三周年';
  const mainRelation = '奶奶';

  return (
    <View
      className="min-h-screen relative"
      style={{ background: 'linear-gradient(178deg,#12313f 0%,#0f2734 45%,#0b1e29 100%)' }}
    >
      {/* 星光与暖金光斑装饰 */}
      {SPARKS.map((s, i) => (
        <View
          key={i}
          className="absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            width: s.s,
            height: s.s,
            backgroundColor: '#e8c07a',
            opacity: s.o,
            boxShadow: '0 0 8px 2px rgba(232,192,122,0.5)'
          }}
        />
      ))}

      {/* 品牌标题区 */}
      <View className="px-5 pt-14 pb-3 flex flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="block text-[34px] leading-none font-bold" style={{ color: '#ffffff' }}>
            晚星纪念
          </Text>
          <Text className="block mt-2 text-xs tracking-wide" style={{ color: 'rgba(232,192,122,0.92)' }}>
            专业的老人社区与电子墓碑服务平台
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full flex items-center justify-center mt-1"
          style={{ border: '1px solid rgba(255,255,255,0.5)' }}
        >
          <Bell color="#ffffff" size={19} strokeWidth={1.8} />
        </View>
      </View>

      {/* 今日纪念大卡片 */}
      <View className="px-5 mt-4">
        <View
          className="rounded-[22px] px-5 pt-4 pb-5 relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(20,46,57,0.88)',
            border: '1px solid rgba(232,192,122,0.45)',
            boxShadow: '0 0 0 1px rgba(232,192,122,0.08), 0 10px 30px rgba(0,0,0,0.35), inset 0 0 30px rgba(232,192,122,0.05)'
          }}
        >
          {/* 右下光纹 */}
          <View
            className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(114,198,205,0.28) 0%, transparent 70%)' }}
          />
          <View className="flex flex-row">
            {/* 逝者照片 */}
            <View className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(232,192,122,0.4)' }}
            >
              <Image src={mainMemorial?.avatarUrl || ELDER_MALE} className="w-full h-full" mode="aspectFill" />
            </View>
            {/* 右侧信息 */}
            <View className="flex-1 pl-4">
              <View className="flex flex-row items-baseline">
                <Text className="text-[26px] font-bold" style={{ color: '#e8c07a' }}>{mainName}</Text>
                <Text className="ml-1.5 text-sm" style={{ color: 'rgba(232,192,122,0.75)' }}>{mainRelation}</Text>
              </View>
              <View
                className="self-start mt-2 rounded-full px-3 py-1"
                style={{ backgroundColor: 'rgba(11,30,41,0.9)', border: '1px solid rgba(232,192,122,0.35)' }}
              >
                <Text className="text-xs" style={{ color: '#e8c07a' }}>{mainTag}</Text>
              </View>
              <View className="mt-3 flex flex-row items-baseline">
                <Text className="text-sm mr-1" style={{ color: 'rgba(232,192,122,0.85)' }}>今日有</Text>
                <Text className="text-[30px] font-extrabold" style={{ color: '#f0c87d' }}>{todayCount}</Text>
                <Text className="text-sm ml-1" style={{ color: 'rgba(232,192,122,0.85)' }}>位亲人被想起</Text>
              </View>
            </View>
          </View>
          {/* 前去祭拜按钮 */}
          <View
            className="mt-4 rounded-full py-2.5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(90deg,#f0c87d,#d9a853)',
              border: '1px solid rgba(255,224,164,0.7)',
              boxShadow: '0 6px 18px rgba(217,168,83,0.4)'
            }}
            onClick={() => goPeople(mainMemorial?.id)}
          >
            <Text className="text-base font-bold text-white tracking-wide">前去祭拜</Text>
          </View>
        </View>
      </View>

      {/* 今日服务概览 */}
      <View className="px-5 mt-6">
        <Text className="block text-base mb-3" style={{ color: '#e8c07a' }}>今日服务概览</Text>
        <View className="flex flex-row gap-2.5">
          <View className="flex-1 rounded-2xl py-4 flex flex-col items-center" style={{ backgroundColor: 'rgba(20,46,57,0.8)' }}>
            <View className="flex flex-row items-end">
              <Cross color="#e8c07a" size={15} strokeWidth={2} />
              <Cross color="#e8c07a" size={15} strokeWidth={2} />
            </View>
            <Text className="mt-2 text-xl font-bold" style={{ color: '#e8c07a' }}>{mainMemorial ? memorials.length : 326}</Text>
            <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(232,192,122,0.7)' }}>纪念墓碑</Text>
          </View>
          <View className="flex-1 rounded-2xl py-4 flex flex-col items-center" style={{ backgroundColor: 'rgba(20,46,57,0.8)' }}>
            <Sun color="#e8c07a" size={19} strokeWidth={1.9} />
            <Text className="mt-2 text-xl font-bold" style={{ color: '#e8c07a' }}>{visitCount.toLocaleString()}</Text>
            <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(232,192,122,0.7)' }}>今日献花</Text>
          </View>
          <View className="flex-1 rounded-2xl py-4 flex flex-col items-center" style={{ backgroundColor: 'rgba(20,46,57,0.8)' }}>
            <UserRound color="#e8c07a" size={19} strokeWidth={1.9} />
            <Text className="mt-2 text-xl font-bold" style={{ color: '#e8c07a' }}>{participant.toLocaleString()}</Text>
            <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(232,192,122,0.7)' }}>家属参与</Text>
          </View>
        </View>
      </View>

      {/* 推荐今日祭拜的故人 */}
      <View className="px-5 mt-6">
        <Text className="block text-base mb-3" style={{ color: '#e8c07a' }}>推荐今日祭拜的故人</Text>
        {(memorials.length > 0 ? memorials.slice(0, 4) : FALLBACK_RECOMMEND).map((m, i) => {
          const fb = FALLBACK_RECOMMEND[i];
          const name = (m as Memorial).name || fb.name;
          const tag = fb ? fb.tag : '家属纪念';
          const desc = fb ? fb.desc : (m as Memorial).name + '的纪念空间收到新的问候';
          const time = fb ? fb.time : (i < 3 ? i * 15 + 2 + '分钟前' : '1小时前');
          const avatar = (m as Memorial).avatarUrl || fb.avatar;
          return (
            <View
              key={(m as Memorial).id || fb.id}
              className="mb-2.5 rounded-2xl flex flex-row items-center"
              style={{ backgroundColor: 'rgba(20,46,57,0.8)' }}
              onClick={() => goPeople((m as Memorial).id)}
            >
              <View className="w-12 h-12 rounded-full overflow-hidden mx-3 my-3 flex-shrink-0"
                style={{ border: '1px solid rgba(232,192,122,0.4)' }}
              >
                <Image src={avatar} className="w-full h-full" mode="aspectFill" />
              </View>
              <View className="flex-1 pr-3 py-3">
                <View className="flex flex-row items-baseline">
                  <Text className="text-[15px] font-bold" style={{ color: '#e8c07a' }}>{name}</Text>
                  <Text className="ml-2 text-[11px]" style={{ color: 'rgba(232,192,122,0.75)' }}>{tag}</Text>
                </View>
                <Text className="block text-xs mt-1" style={{ color: 'rgba(216,226,228,0.75)' }} numberOfLines={1}>{desc}</Text>
                <Text className="block mt-1 text-[10px]" style={{ color: 'rgba(170,185,188,0.6)' }}>{time}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 常用服务 */}
      <View className="px-5 mt-6">
        <Text className="block text-base mb-3" style={{ color: '#e8c07a' }}>常用服务</Text>
        <View className="flex flex-row justify-between px-1">
          <View className="flex flex-col items-center" onClick={() => goEntrance('tomb')}>
            <Cross color="#e8c07a" size={24} strokeWidth={1.8} />
            <Text className="text-xs mt-2" style={{ color: 'rgba(232,192,122,0.92)' }}>创建墓碑</Text>
          </View>
          <View className="flex flex-col items-center" onClick={() => goEntrance('calendar')}>
            <CalendarDays color="#e8c07a" size={24} strokeWidth={1.8} />
            <Text className="text-xs mt-2" style={{ color: 'rgba(232,192,122,0.92)' }}>纪念日历</Text>
          </View>
          <View className="flex flex-col items-center" onClick={() => goEntrance('service')}>
            <HeartHandshake color="#e8c07a" size={24} strokeWidth={1.8} />
            <Text className="text-xs mt-2" style={{ color: 'rgba(232,192,122,0.92)' }}>暖心服务</Text>
          </View>
          <View className="flex flex-col items-center" onClick={() => goEntrance('family')}>
            <Archive color="#e8c07a" size={24} strokeWidth={1.8} />
            <Text className="text-xs mt-2" style={{ color: 'rgba(232,192,122,0.92)' }}>家属管理</Text>
          </View>
        </View>
      </View>

      {/* 平台安心服务提示卡 */}
      <View className="px-5 mt-6 pb-8">
        <View
          className="rounded-2xl px-4 py-4 flex flex-row items-center"
          style={{ backgroundColor: 'rgba(20,46,57,0.8)', border: '1px solid rgba(138,192,204,0.25)' }}
        >
          <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(138,192,204,0.15)' }}
          >
            <Flame color="#7fc3ce" size={20} strokeWidth={1.8} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="block text-sm font-semibold mb-1" style={{ color: '#e8c07a' }}>平台安心服务</Text>
            <Text className="block text-[11px] leading-relaxed" style={{ color: 'rgba(200,212,214,0.75)' }}>
              统一身份记录、家属权限管理、重要日期提醒、温暖纪念空间
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;