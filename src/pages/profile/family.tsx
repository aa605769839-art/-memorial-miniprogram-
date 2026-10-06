import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Users, UserPlus, Trash2, Crown, Star, ShieldCheck, Eye, ArrowLeft, Search } from 'lucide-react-taro';
import { Network } from '@/network';
import { Auth } from '@/auth';
import { StarsBackground } from '@/components/StarsBackground';

interface MemorialOption {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Member {
  id: string;
  user_id: string;
  username: string;
  nickname: string | null;
  role: number; // 1主管理员 2家属管理员 3可编辑 4仅浏览
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 1, label: '主管理员' },
  { value: 2, label: '家属管理员' },
  { value: 3, label: '可编辑' },
  { value: 4, label: '仅浏览' },
];

const FamilyManagementPage = () => {
  const [memorials, setMemorials] = useState<MemorialOption[]>([]);
  const [memorialId, setMemorialId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);

  useDidShow(() => {
    loadMyMemorials();
  });

  const loadMyMemorials = async () => {
    try {
      const res: any = await Network.request({
        url: '/api/memorials/my',
        method: 'GET',
        header: Auth.headers(),
      });
      const list = res.data?.data || [];
      const opts = list.map((m: any) => ({
        id: m.id,
        name: m.name || '未命名',
        avatar_url: m.avatar_url,
      }));
      setMemorials(opts);
      if (!memorialId && opts.length) {
        setMemorialId(opts[0].id);
      }
      if (opts.length) {
        await loadMembers(opts[0].id);
      } else {
        setMembers([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onSelectMemorial = async (id: string) => {
    setMemorialId(id);
    await loadMembers(id);
  };

  const loadMembers = async (mid?: string) => {
    const target = mid || memorialId;
    if (!target) return;
    setLoading(true);
    try {
      const [listRes, meRes]: any = await Promise.all([
        Network.request({ url: `/api/memorials/${target}/members`, method: 'GET', header: Auth.headers() }),
        Network.request({ url: `/api/memorials/${target}/members/me`, method: 'GET', header: Auth.headers() }),
      ]);
      setMembers(listRes.data?.data || []);
      setMyRole(meRes.data?.data?.role ?? 2);
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载家属失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    const uname = inviteUsername.trim();
    if (!uname) {
      Taro.showToast({ title: '请输入要邀请用户的账号', icon: 'none' });
      return;
    }
    if (!memorialId) return;
    if (myRole !== 1 && myRole !== 2) {
      Taro.showToast({ title: '没有邀请权限', icon: 'none' });
      return;
    }
    setInviting(true);
    try {
      const res: any = await Network.request({
        url: `/api/memorials/${memorialId}/members`,
        method: 'POST',
        header: Auth.headers(),
        data: { username: uname, role: 4 },
      });
      if (res.data?.code === 200) {
        Taro.showToast({ title: '邀请成功', icon: 'success' });
        setInviteUsername('');
        loadMembers();
      } else {
        Taro.showToast({ title: res.data?.message || '邀请失败', icon: 'none' });
      }
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '邀请失败', icon: 'none' });
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = (memberId: string, role: number) => {
    Taro.showActionSheet({
      itemList: ROLE_OPTIONS.map((r) => r.label),
      success: async (res) => {
        const newRole = ROLE_OPTIONS[res.tapIndex]?.value;
        if (newRole === undefined || newRole === role) return;
        try {
          const r: any = await Network.request({
            url: `/api/memorials/${memorialId}/members/${memberId}/role`,
            method: 'PUT',
            header: Auth.headers(),
            data: { role: newRole },
          });
          if (r.data?.code === 200) {
            Taro.showToast({ title: '已更新角色', icon: 'success' });
            loadMembers();
          } else {
            Taro.showToast({ title: r.data?.message || '更新失败', icon: 'none' });
          }
        } catch {
          Taro.showToast({ title: '更新失败', icon: 'none' });
        }
      },
    });
  };

  const handleTransfer = (userId: string) => {
    if (userId === undefined || userId === null) return;
    Taro.showModal({
      title: '移交主管理员',
      content: '确定将该墓碑的主管理员移交给该家属吗？你将成为普通成员。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r: any = await Network.request({
            url: `/api/memorials/${memorialId}/members/transfer`,
            method: 'POST',
            header: Auth.headers(),
            data: { userId },
          });
          if (r.data?.code === 200) {
            Taro.showToast({ title: '移交成功', icon: 'success' });
            loadMembers();
          } else {
            Taro.showToast({ title: r.data?.message || '移交失败', icon: 'none' });
          }
        } catch {
          Taro.showToast({ title: '移交失败', icon: 'none' });
        }
      },
    });
  };

  const handleRemove = (memberId: string) => {
    Taro.showModal({
      title: '移除家属',
      content: '确定将该家属移出纪念空间吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r: any = await Network.request({
            url: `/api/memorials/${memorialId}/members/${memberId}`,
            method: 'DELETE',
            header: Auth.headers(),
          });
          if (r.data?.code === 200) {
            Taro.showToast({ title: '已移除', icon: 'success' });
            loadMembers();
          } else {
            Taro.showToast({ title: r.data?.message || '移除失败', icon: 'none' });
          }
        } catch {
          Taro.showToast({ title: '移除失败', icon: 'none' });
        }
      },
    });
  };

  const roleLabel = (role: number) => ROLE_OPTIONS.find((r) => r.value === role)?.label || '仅浏览';
  const roleIcon = (role: number) => {
    if (role === 1) return <Crown size={15} color="#e8c07a" />;
    if (role === 2) return <ShieldCheck size={15} color="#7fc3ce" />;
    if (role === 3) return <Star size={15} color="#7fc3ce" />;
    return <Eye size={15} color="#8a8f94" />;
  };

  return (
    <StarsBackground dim="light">
      {/* 顶部导航 */}
      <View className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(180deg, rgba(30,72,84,0.6) 0%, rgba(18,46,58,0.35) 100%)' }}>
        <View className="flex items-center gap-3">
          <View className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} onClick={() => Taro.navigateBack()}>
            <ArrowLeft size={18} color="#fff" />
          </View>
          <Text className="text-white text-xl font-bold flex-1">家属管理</Text>
        </View>
      </View>

      <View className="px-4 py-4 space-y-4">
        {/* 墓碑选择 */}
        <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
          <Text className="block text-sm font-medium text-white/85 mb-2">选择纪念空间</Text>
          {memorials.length === 0 ? (
            <Text className="block text-sm text-white/50 py-3">还没有创建电子墓碑</Text>
          ) : (
            <View className="flex flex-wrap gap-2">
              {memorials.map((m) => (
                <View
                  key={m.id}
                  className="px-4 py-2 rounded-full text-sm"
                  style={{ backgroundColor: m.id === memorialId ? '#e8c07a' : 'rgba(255,255,255,0.08)', color: m.id === memorialId ? '#2e1f0f' : '#fff' }}
                  onClick={() => onSelectMemorial(m.id)}
                >
                  <Text>{m.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 成员列表 */}
        <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
          <View className="flex items-center justify-between mb-3">
            <View className="flex items-center gap-2">
              <Users size={17} color="#e8c07a" />
              <Text className="text-white font-semibold text-base">家属成员</Text>
            </View>
            {loading ? <Text className="text-xs text-white/40">加载中...</Text> : <Text className="text-xs text-white/40">{members.length} 人</Text>}
          </View>

          {members.length === 0 && !loading ? (
            <Text className="block text-sm text-white/50 py-4 text-center">暂无家属成员</Text>
          ) : (
            members.map((m) => (
              <View key={m.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(143,212,218,0.25)', border: '1px solid rgba(232,192,122,0.4)' }}>
                  {m.nickname ? <Text className="text-white font-semibold">{m.nickname[0]}</Text> : <UserPlus size={18} color="#7fc3ce" />}
                </View>
                <View className="flex-1">
                  <View className="flex items-center gap-2">
                    <Text className="text-white font-medium text-sm">{m.nickname || m.username}</Text>
                    {roleIcon(m.role)}
                    <Text className="text-xs" style={{ color: m.role === 1 ? '#e8c07a' : m.role === 2 || m.role === 3 ? '#7fc3ce' : '#8a8f94' }}>{roleLabel(m.role)}</Text>
                  </View>
                  <Text className="block text-xs text-white/40 mt-0.5">{m.username}</Text>
                </View>
                {myRole === 1 && (
                  <View className="flex items-center gap-2">
                    {m.role !== 1 && (
                      <>
                        <View className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(232,192,122,0.2)' }} onClick={() => handleChangeRole(m.id, m.role)}>
                          <Star size={14} color="#e8c07a" />
                        </View>
                        <View className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} onClick={() => handleTransfer(m.user_id)}>
                          <Crown size={14} color="#7fc3ce" />
                        </View>
                        <View className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(255,70,80,0.2)' }} onClick={() => handleRemove(m.id)}>
                          <Trash2 size={14} color="#ff6666" />
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* 邀请家属 */}
        {myRole === 1 || myRole === 2 ? (
          <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}>
            <View className="flex items-center gap-2 mb-3">
              <UserPlus size={17} color="#e8c07a" />
              <Text className="text-white font-semibold text-base">邀请家属</Text>
            </View>
            <View className="py-3 px-4 rounded-xl mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <View className="flex items-center gap-2">
                <Search size={16} color="#7e99a3" />
                <Input
                  className="w-full bg-transparent"
                  style={{ color: '#fff', fontSize: '14px' }}
                  placeholder="输入对方的登录账号"
                  placeholderStyle="color:#7e99a3"
                  value={inviteUsername}
                  onInput={(e) => setInviteUsername(e.detail.value)}
                />
              </View>
            </View>
            <Button className="rounded-full py-2" style={{ backgroundColor: '#e8c07a', color: '#2e1f0f' }} disabled={inviting} onClick={handleInvite}>
              <Text>{inviting ? '邀请中...' : '邀请加入'}</Text>
            </Button>
            <Text className="block text-xs text-white/40 mt-2">受邀家属可参与祭拜与留言，管理人员可协助维护内容。</Text>
          </View>
        ) : null}
      </View>
    </StarsBackground>
  );
};

export default FamilyManagementPage;