import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { useState, useEffect, Component } from 'react';
import { Network } from '@/network';
import { StarsBackground } from '@/components/StarsBackground';
import HomeTabBar from '@/components/HomeTabBar';
import { Auth } from '@/auth';
import { trackEvent } from '@/utils/track';
import {
  Cross,
  CalendarDays,
  HeartHandshake,
  Sun,
  UserRound,
  Users,
  Flower2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Inbox
} from 'lucide-react-taro';

interface RecommendItem {
  id: string;
  name: string;
  gender?: string;
  avatarUrl: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  occupation?: string | null;
  biography?: string | null;
  isDeleted?: boolean;
  tags?: { type: string; label: string }[];
  preview?: string;
  mourningCount?: number;
  visitCount?: number;
}

interface UpcomingItem {
  memorialId: string;
  name: string;
  gender?: string;
  avatarUrl?: string | null;
  type: string;
  label: string;
  daysLeft: number;
  date: string;
}

const IndexPage = () => {
  const [summary, setSummary] = useState({ totalMemorials: 0, todayGifts: 0, familyCount: 0, todayWorship: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [list, setList] = useState<RecommendItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [brokenImgs, setBrokenImgs] = useState<Record<string, boolean>>({});

  const markBroken = (url: string) => {
    if (url && !brokenImgs[url]) setBrokenImgs((s) => ({ ...s, [url]: true }));
  };

  const goDetail = (id: string) => Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });

  // 各数据源并行加载
  const fetchAll = async (_drop = true) => {
    const userId = Auth.getUser()?.id || '';
    try {
      const [summaryRes, upcomingRes] = await Promise.all([
        Network.request({ url: '/api/memorials/home/summary', method: 'GET' }).catch(() => null),
        Network.request({
          url: `/api/memorials/home/upcoming-anniversaries?userId=${encodeURIComponent(userId)}&days=7`,
          method: 'GET',
        }).catch(() => null),
      ]);
      const sBody: any = summaryRes?.data || summaryRes;
      if (sBody?.code === 200 && sBody?.data) {
        const d = sBody.data;
        setSummary({
          totalMemorials: Number(d.totalMemorials) || 0,
          todayGifts: Number(d.todayGifts) || 0,
          familyCount: Number(d.familyCount) || 0,
          todayWorship: Number(d.todayWorship) || 0,
        });
      }
      const uBody: any = upcomingRes?.data || upcomingRes;
      if (uBody?.code === 200) {
        const arr = Array.isArray(uBody.data) ? uBody.data : [];
        setUpcoming(arr.slice(0, 5));
      }
    } catch {
      /* 忽略 */
    }
    await loadRecommend(1, true);
  };

  const loadRecommend = async (targetPage = 1, reset = false) => {
    if (loading) return;
    setLoading(true);
    const userId = Auth.getUser()?.id || '';
    try {
      const res: any = await Network.request({
        url: `/api/memorials/home/recommend?userId=${encodeURIComponent(userId)}&page=${targetPage}&pageSize=8`,
        method: 'GET',
      });
      const body = res?.data || res;
      if (body?.code === 200) {
        const data = body.data || {};
        const items: RecommendItem[] = data.list || [];
        setList((prev) => (reset ? items : [...prev, ...items]));
        setPage(targetPage);
        setHasMore(!!data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      if (refreshing) setRefreshing(false);
    }
  };

  // 下拉刷新
  usePullDownRefresh(async () => {
    setRefreshing(true);
    await fetchAll(true);
    Taro.stopPullDownRefresh();
  });

  // 触底加载更多
  useReachBottom(() => {
    if (hasMore && !loading && !refreshing) {
      loadRecommend(page + 1);
    }
  });

  useEffect(() => {
    fetchAll(true);
  }, []);


  // 近期纪念日点击
  const goRecent = (item: UpcomingItem) => {
    trackEvent('home_recent_click', { memorialId: item.memorialId });
    goDetail(item.memorialId);
  };

  // 2×2 功能入口
  const goEntrance = (key: string) => {
    if (key === 'tomb') Taro.navigateTo({ url: '/pages/profile/form' });
    else if (key === 'calendar') Taro.navigateTo({ url: '/pages/profile/calendar' });
    else if (key === 'family') Taro.navigateTo({ url: '/pages/profile/family' });
    else if (key === 'service') Taro.switchTab({ url: '/pages/profile/index' });
  };

  const entrances = [
    { key: 'tomb', icon: <Cross color="#e8c07a" size={22} strokeWidth={1.8} />, label: '创建墓碑', color: 'rgba(232,192,122,0.12)' },
    { key: 'calendar', icon: <CalendarDays color="#7fc3ce" size={22} strokeWidth={1.8} />, label: '纪念日历', color: 'rgba(127,195,206,0.12)' },
    { key: 'family', icon: <Users color="#f0c87d" size={22} strokeWidth={1.8} />, label: '家属管理', color: 'rgba(240,200,125,0.12)' },
    { key: 'service', icon: <HeartHandshake color="#c9a86a" size={22} strokeWidth={1.8} />, label: '暖心服务', color: 'rgba(201,168,106,0.12)' },
  ];

  const stats = [
    { icon: <Cross color="#e8c07a" size={20} strokeWidth={1.8} />, value: summary.totalMemorials, label: '纪念墓碑', color: '#e8c07a' },
    { icon: <Sun color="#f0c87d" size={20} strokeWidth={1.8} />, value: summary.todayGifts, label: '今日献花', color: '#f0c87d' },
    { icon: <UserRound color="#7fc3ce" size={20} strokeWidth={1.8} />, value: summary.familyCount, label: '家属参与', color: '#7fc3ce' },
    { icon: <Flower2 color="#c9a86a" size={20} strokeWidth={1.8} />, value: summary.todayWorship, label: '今日祭拜', color: '#c9a86a' },
  ];

  return (
    <StarsBackground>
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
        <View className="flex flex-row items-center gap-2">
          {refreshing && <RefreshCw color="#e8c07a" size={16} className="animate-spin" />}
          <View className="w-10 h-10 rounded-full flex items-center justify-center mt-1"
            style={{ border: '1px solid rgba(255,255,255,0.5)' }}
            onClick={async () => { await fetchAll(true); }}
          >
            <RefreshCw color="#ffffff" size={19} strokeWidth={1.8} />
          </View>
        </View>
      </View>

      {/* 顶部统计窄条（轻量化 4 项） */}
      <View className="px-5 mt-3">
        <View
          className="rounded-3xl px-3 py-4 flex flex-row"
          style={{
            backgroundColor: 'rgba(20,46,57,0.82)',
            border: '1px solid rgba(232,192,122,0.25)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {stats.map((s, i) => (
            <View key={s.label} className="flex-1 flex flex-col items-center">
              <View className="flex flex-row items-center gap-1">
                {s.icon}
                <Text className="text-xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</Text>
              </View>
              <Text className="mt-1 text-sm" style={{ color: 'rgba(200,212,214,0.75)' }}>{s.label}</Text>
              {i < 3 && <View className="absolute right-0 top-2 bottom-2 w-px" style={{ backgroundColor: 'rgba(232,192,122,0.18)' }} />}
            </View>
          ))}
        </View>
      </View>

      {/* 功能入口 2×2 */}
      <View className="px-5 mt-6">
        <View className="grid grid-cols-2 gap-2.5">
          {entrances.map((e) => (
            <View
              key={e.key}
              className="rounded-2xl py-4 flex flex-row items-center justify-center gap-2"
              style={{ backgroundColor: e.color, border: '1px solid rgba(232,192,122,0.18)' }}
              onClick={() => goEntrance(e.key)}
            >
              {e.icon}
              <Text className="text-sm font-medium" style={{ color: '#f0d9a8' }}>{e.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 近期纪念日（未来 7 天） */}
      <View className="px-5 mt-6">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="block text-base font-medium" style={{ color: '#e8c07a' }}>近期纪念日</Text>
          <Text className="text-xs" style={{ color: 'rgba(200,212,214,0.7)' }}>未来 7 天</Text>
        </View>
        {upcoming.length === 0 ? (
          <View
            className="rounded-2xl py-4 px-4 flex flex-row items-center"
            style={{ backgroundColor: 'rgba(20,46,57,0.7)', border: '1px solid rgba(232,192,122,0.15)' }}
          >
            <Sparkles color="#7fc3ce" size={16} strokeWidth={1.8} />
            <Text className="ml-2 text-xs" style={{ color: 'rgba(200,212,214,0.7)' }}>
              近 7 天暂无纪念日，愿故人安好
            </Text>
          </View>
        ) : (
          upcoming.map((it) => (
            <View
              key={it.memorialId + it.type + it.daysLeft}
              className="mb-2 rounded-2xl px-4 py-3 flex flex-row items-center"
              style={{ backgroundColor: 'rgba(20,46,57,0.8)', border: '1px solid rgba(232,192,122,0.2)' }}
              onClick={() => goRecent(it)}
            >
              <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: it.daysLeft === 0 ? '#f0c87d' : '#7fc3ce' }} />
              <View className="flex-1">
                <View className="flex flex-row items-center">
                  <Text className="text-base font-bold" style={{ color: '#f0d9a8' }}>{it.name}</Text>
                  <Text className="ml-2 text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(127,195,206,0.18)', color: '#7fc3ce' }}>{it.label}</Text>
                </View>
                <Text className="block mt-1 text-xs" style={{ color: 'rgba(200,212,214,0.7)' }}>{it.date}</Text>
              </View>
              <View className="flex flex-row items-center">
                <Text className="text-sm font-semibold" style={{ color: '#e8c07a' }}>
                  {it.daysLeft === 0 ? '今天' : `${it.daysLeft} 天后`}
                </Text>
                <ChevronRight color="rgba(200,212,214,0.6)" size={16} />
              </View>
            </View>
          ))
        )}
      </View>

      {/* 推荐纪念空间 */}
      <View className="px-5 mt-6">
        <Text className="block text-base font-medium mb-3" style={{ color: '#e8c07a' }}>推荐纪念空间</Text>
        {list.length === 0 && !loading ? (
          <View className="rounded-2xl py-10 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(20,46,57,0.7)' }}
          >
            <Inbox color="rgba(200,212,214,0.5)" size={40} strokeWidth={1.5} />
            <Text className="mt-3 text-xs" style={{ color: 'rgba(200,212,214,0.7)' }}>暂无纪念空间，敬请期待</Text>
            <View className="mt-4 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(232,192,122,0.15)' }}
              onClick={() => loadRecommend(1, true)}
            >
              <Text className="text-xs" style={{ color: '#e8c07a' }}>重新加载</Text>
            </View>
          </View>
        ) : (
          list.map((m) => {
            const todayTag = (m.tags || []).find((t) => t.type === 'today');
            const upcomingTag = (m.tags || []).find((t) => t.type === 'upcoming');
            const mineTag = (m.tags || []).find((t) => t.type === 'mine');
            const intro = m.preview || m.biography || '';
            return (
              <View
                key={m.id}
                className="mb-3 rounded-3xl p-4 flex flex-row items-center"
                style={{ backgroundColor: 'rgba(12,26,40,0.82)', border: '1px solid rgba(232,192,122,0.3)' }}
                onClick={() => goDetail(m.id)}
              >
                <View className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '1.5px solid rgba(232,192,122,0.55)' }}
                >
                  <Image
                    src={m.avatarUrl || ''}
                    className="w-full h-full"
                    mode="aspectFill"
                    onError={() => markBroken(m.avatarUrl || '')}
                  />
                </View>
                <View className="flex-1 ml-5 min-w-0">
                  <View className="flex flex-row items-center">
                    <Text className="text-xl font-bold whitespace-nowrap" style={{ color: '#f4dfb2' }}>{m.name}</Text>
                    <View className="w-9 h-px flex-shrink-0 ml-2"
                      style={{ background: 'linear-gradient(90deg,rgba(232,192,122,0),rgba(232,192,122,0.85),rgba(232,192,122,0))' }}
                    />
                  </View>
                  <View className="flex flex-row items-center flex-wrap gap-2 mt-1.5">
                    {todayTag && (
                      <Text className="text-sm whitespace-nowrap rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'rgba(240,200,125,0.28)', color: '#f2ce8a' }}>{todayTag.label}</Text>
                    )}
                    {upcomingTag && (
                      <Text className="text-sm whitespace-nowrap rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'rgba(127,195,206,0.22)', color: '#8ad0d8' }}>{upcomingTag.label}</Text>
                    )}
                    {mineTag && (
                      <Text className="text-sm whitespace-nowrap rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'rgba(232,192,122,0.2)', color: '#e8c07a' }}>{mineTag.label}</Text>
                    )}
                  </View>
                  {intro && (
                    <Text className="block mt-2 text-sm leading-relaxed" style={{ color: 'rgba(200,210,214,0.95)' }} numberOfLines={2}>{intro}</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
        {/* 加载更多 */}
        {list.length > 0 && (
          <View className="pt-2 pb-28 flex items-center justify-center">
            {loading ? (
              <View className="flex flex-row items-center gap-2">
                <View className="w-4 h-4 rounded-full border-2 border-[#e8c07a]/30 border-t-[#e8c07a] animate-spin" />
                <Text className="text-xs" style={{ color: 'rgba(200,212,214,0.7)' }}>加载中...</Text>
              </View>
            ) : !hasMore ? (
              <Text className="text-xs" style={{ color: 'rgba(200,212,214,0.5)' }}>—— 到底啦 ——</Text>
            ) : (
              <Text className="text-xs" style={{ color: 'rgba(200,212,214,0.5)' }}>上滑加载更多</Text>
            )}
          </View>
        )}
      </View>
      <HomeTabBar />
    </StarsBackground>
  );
};

// 错误边界：兜底首页渲染异常，避免裸白屏并暴露真实错误
class HomeBoundary extends Component<{ children: any }, { err: string }> {
  state = { err: '' };
  static getDerivedStateFromError(e: any) {
    return { err: e?.message || String(e) };
  }
  componentDidCatch(e: any) {
    console.error('HOME_PAGE_CRASH', e);
    try {
      trackEvent('home_page_error', { msg: e?.message || String(e) });
    } catch {
      /* 上报失败静默 */
    }
  }
  render() {
    if (this.state.err) {
      return (
        <View className="flex flex-col items-center justify-center px-8"
          style={{ minHeight: '100vh', backgroundColor: '#0a1920' }}
        >
          <Text className="block text-center text-white/80">纪念空间暂时加载失败</Text>
          <Text className="block text-center text-white/50 text-xs mt-2" style={{ wordBreak: 'break-all' }}>{this.state.err}</Text>
          <Button
            onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}
            style={{ marginTop: 20, color: '#e8c07a', background: 'rgba(232,192,122,0.15)', borderRadius: 999 }}
          >
            重新加载
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function HomePage() {
  return <HomeBoundary><IndexPage /></HomeBoundary>;
}