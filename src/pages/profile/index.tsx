import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import {
  Heart,
  User,
  ChevronRight,
  LogIn,
  ShieldCheck,
  BookOpen,
  Users,
  HeartHandshake,
  Settings,
  Bell,
  Medal,
  Gift,
  Cross,
  Flower2,
  CalendarDays,
  Pencil,
  LogOut
} from 'lucide-react-taro';
import { Network } from '@/network';
import { uploadCrossPlatform } from '@/utils/upload';
import { Auth, type LoginUser } from '@/auth';
import { StarsBackground } from '@/components/StarsBackground';

interface UserProfile {
  name: string;
  avatar: string | null;
  bio: string;
}

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '访客',
    avatar: null,
    bio: '还没有简介'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: ''
  });
  const [tempAvatar, setTempAvatar] = useState<string | null>(null); // 编辑模式下的临时头像

  // 登录相关状态
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', nickname: '' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    loadUserProfile();
    setLoginUser(Auth.getUser());
  }, []);

  const loadUserProfile = () => {
    const saved = Taro.getStorageSync('userProfile');
    if (saved) {
      setUserProfile(saved);
      setEditForm({
        name: saved.name,
        bio: saved.bio
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTempAvatar(userProfile.avatar); // 初始化临时头像
    setEditForm({
      name: userProfile.name,
      bio: userProfile.bio
    });
  };

  const handleAvatarUpload = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        Taro.showLoading({ title: '上传中...' });

        try {
          const uploadRes = await uploadCrossPlatform({ filePath: res.tempFilePaths[0], category: 'avatars' });

          const data = uploadRes.data ? JSON.parse(uploadRes.data) : null;

          if (uploadRes.statusCode === 200 && data && data.code === 200 && data.data.url) {
            // 只更新临时头像，不保存到 storage
            setTempAvatar(data.data.url);
            Taro.showToast({
              title: '头像上传成功',
              icon: 'success'
            });
          } else {
            throw new Error('上传失败');
          }
        } catch (uploadError) {
          console.error('头像上传失败:', uploadError);
          Taro.showToast({
            title: '上传失败',
            icon: 'none'
          });
        } finally {
          Taro.hideLoading();
        }
      }
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  };

  const handleSave = () => {
    if (!editForm.name.trim()) {
      Taro.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    const newProfile: UserProfile = {
      name: editForm.name.trim(),
      avatar: tempAvatar, // 使用临时头像
      bio: editForm.bio.trim() || '还没有简介'
    };

    // 先保存数据
    setUserProfile(newProfile);
    Taro.setStorageSync('userProfile', newProfile);

    // 然后退出编辑模式
    setIsEditing(false);
    setTempAvatar(null); // 清空临时头像

    // 显示成功提示
    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    });
  };

  const handleCancel = () => {
    // 重新加载用户资料，恢复原来的数据
    loadUserProfile();

    // 退出编辑模式
    setIsEditing(false);
    setTempAvatar(null); // 清空临时头像
  };

  // 点击遮罩层关闭弹窗
  const handleMaskClick = (e: any) => {
    // 阻止事件冒泡，避免点击弹窗内容时关闭
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleAddMemorial = () => {
    if (!Auth.isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      setShowAuth(true);
      return;
    }
    Taro.navigateTo({
      url: '/pages/profile/memorials'
    });
  };

  // ---- 登录/注册/登出 ----
  const openLogin = () => {
    setAuthTab('login');
    setAuthForm({ username: '', password: '', nickname: '' });
    setShowAuth(true);
  };

  const handleAuthSubmit = async () => {
    if (authSubmitting) return;
    if (!authForm.username.trim() || !authForm.password) {
      Taro.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    if (authTab === 'register' && authForm.password.length < 6) {
      Taro.showToast({ title: '密码至少 6 位', icon: 'none' });
      return;
    }
    setAuthSubmitting(true);
    try {
      const isLogin = authTab === 'login';
      const res = await Network.request({
        url: isLogin ? '/api/auth/login' : '/api/auth/register',
        method: 'POST',
        data: isLogin
          ? { username: authForm.username.trim(), password: authForm.password }
          : {
              username: authForm.username.trim(),
              password: authForm.password,
              ...(authForm.nickname.trim() ? { nickname: authForm.nickname.trim() } : {})
            }
      });
      const body = res.data as any;
      if (body?.code === 200 && body?.data?.token && body?.data?.user) {
        Auth.setAuth(body.data.token, body.data.user);
        setLoginUser(body.data.user);
        setShowAuth(false);
        // 登录后同步本地昵称
        const u = body.data.user as LoginUser;
        if (u.nickname) {
          const p = { name: u.nickname, avatar: null, bio: '已登录用户' };
          Taro.setStorageSync('userProfile', p);
          setUserProfile(p);
        }
        Taro.showToast({ title: isLogin ? '登录成功' : '注册成功', icon: 'success' });
      } else {
        Taro.showToast({ title: body?.msg || (isLogin ? '登录失败' : '注册失败'), icon: 'none' });
      }
    } catch (err) {
      const msg = (err as any)?.data?.msg || '网络异常，请稍后重试';
      Taro.showToast({ title: msg, icon: 'none' });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    Auth.clear();
    setLoginUser(null);
    setConfirmLogout(false);
    Taro.showToast({ title: '已退出登录', icon: 'none' });
  };

  const goTo = (url: string) => {
    if (url.startsWith('/pages/profile/memorials') || url.startsWith('/pages/admin/')) {
      if (!Auth.isLoggedIn()) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        setShowAuth(true);
        return;
      }
    }
    Taro.navigateTo({ url });
  };

  const displayName = loginUser?.nickname || loginUser?.username || userProfile.name || '访客';
  const isAdmin = loginUser?.role === 'admin';

  // 功能列表（参考图语义映射到真实入口）
  const menuItems = [
    { icon: Cross, color: '#48A8A8', label: '我的电子墓碑', onClick: () => goTo('/pages/profile/memorials') },
    { icon: Users, color: '#48A8A8', label: '家属管理', onClick: () => goTo('/pages/profile/family') },
    { icon: CalendarDays, color: '#C9A86A', label: '纪念日历', onClick: () => goTo('/pages/profile/calendar') },
    { icon: BookOpen, color: '#48A8A8', label: '我的故事', onClick: () => goTo('/pages/profile/memorials') },
    { icon: Flower2, color: '#C9A86A', label: '我的献花记录', onClick: () => Taro.switchTab({ url: '/pages/memorial/index' }) },
    { icon: HeartHandshake, color: '#48A8A8', label: '暖心服务', onClick: () => Taro.switchTab({ url: '/pages/memorial/index' }) },
    { icon: Settings, color: '#48A8A8', label: '设置与帮助', onClick: () => Taro.showToast({ title: '晚星纪念 v1.0', icon: 'none' }) }
  ];

  return (
    <StarsBackground dim="light">
      {/* 顶部青蓝渐变头部 */}
      <View className="px-5 pt-14 pb-16" style={{ background: 'linear-gradient(180deg, rgba(30,72,84,0.55) 0%, rgba(18,46,58,0.35) 100%)' }}>
        <Text className="block text-white text-2xl font-bold text-center">
          个人中心
        </Text>
      </View>

      {/* 用户信息主卡片（上移覆盖头部） */}
      <View className="px-4 -mt-14">
        <View className="rounded-3xl overflow-hidden p-5"
          style={{ backgroundColor: 'rgba(18,42,53,0.85)', border: '1px solid rgba(232,192,122,0.4)' }}
        >
          {/* 卡片内渐变区 */}
          <View style={{ background: 'linear-gradient(135deg, rgba(64,110,120,0.6) 0%, rgba(40,80,95,0.5) 60%, rgba(60,50,30,0.4) 100%)' }} className="rounded-2xl p-5">
            <View className="flex items-center gap-4">
              <View className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(143,212,218,0.3)', border: '2px solid rgba(232,192,122,0.6)' }}
              >
                {userProfile.avatar ? (
                  <Image src={userProfile.avatar} className="w-full h-full" mode="aspectFill" />
                ) : (
                  <View
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(180deg,#6aa9b4,#3f8090)' }}
                  >
                    <User color="#ffffff" size={44} />
                  </View>
                )}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="block text-3xl font-extrabold text-white mb-2 whitespace-nowrap" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                  {displayName}
                </Text>
                <View className="flex flex-wrap gap-2">
                  <View className="rounded-full px-3 py-1 flex items-center gap-1 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(246,240,224,0.18)', border: '1px solid rgba(232,192,122,0.4)' }}
                  >
                    <ShieldCheck color="#e8c07a" size={13} strokeWidth={3} />
                    <Text className="text-[#f0d9a8] text-xs font-medium whitespace-nowrap">社区成员</Text>
                  </View>
                  {isAdmin && (
                    <View className="rounded-full px-3 py-1 flex items-center gap-1 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(232,192,122,0.2)', border: '1px solid rgba(232,192,122,0.5)' }}
                    >
                      <Medal color="#e8c07a" size={13} strokeWidth={2.4} />
                      <Text className="text-[#e8c07a] text-xs font-medium whitespace-nowrap">管理员</Text>
                    </View>
                  )}
                </View>
              </View>
              <Button
                className="flex-shrink-0"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  width: 'auto',
                  minWidth: 0,
                  height: 'auto',
                  lineHeight: 'normal',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: 'none'
                }}
                onClick={handleEdit}
              >
                <View
                  className="flex items-center gap-1 rounded-full px-3 py-1.5"
                  style={{ background: 'linear-gradient(135deg,#e8c07a,#d9a84c)' }}
                >
                  <Pencil color="#2e1f0f" size={14} strokeWidth={2.2} />
                  <Text className="text-sm font-semibold" style={{ color: '#2e1f0f' }}>编辑资料</Text>
                </View>
              </Button>
            </View>
          </View>

          {/* 数据统计栏 */}
          <View className="flex flex-row mt-2">
            <View className="flex-1 flex flex-col items-center py-3">
              <Gift color="#e8c07a" size={22} strokeWidth={1.8} />
              <Text className="block text-xs text-[#e8c07a]/60 mt-2 whitespace-nowrap">创建纪念册</Text>
              <Text className="block text-2xl font-extrabold text-white mt-1">{isAdmin ? '2' : '—'}</Text>
            </View>
            <View className="w-px my-3" style={{ backgroundColor: 'rgba(232,192,122,0.2)' }} />
            <View className="flex-1 flex flex-col items-center py-3">
              <BookOpen color="#7fc3ce" size={22} strokeWidth={1.8} />
              <Text className="block text-xs text-[#7fc3ce]/60 mt-2 whitespace-nowrap">参与纪念</Text>
              <Text className="block text-2xl font-extrabold text-white mt-1">—</Text>
            </View>
            <View className="w-px my-3" style={{ backgroundColor: 'rgba(232,192,122,0.2)' }} />
            <View className="flex-1 flex flex-col items-center py-3">
              <Cross color="#7fc3ce" size={22} strokeWidth={1.8} />
              <Text className="block text-xs text-[#7fc3ce]/60 mt-2 whitespace-nowrap">亲友成员</Text>
              <Text className="block text-2xl font-extrabold text-white mt-1">—</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 功能列表 */}
      <View className="px-4 mt-6">
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(18,42,53,0.75)', border: '1px solid rgba(232,192,122,0.25)' }}>
          {menuItems.map((item, i) => (
            <View
              key={item.label}
              className={`flex items-center justify-between px-5 py-4 ${i !== menuItems.length - 1 ? 'border-b' : ''}`}
              onClick={item.onClick}
              style={{ backgroundColor: 'transparent', borderColor: 'rgba(232,192,122,0.15)' }}
            >
              <View className="flex items-center gap-4">
                <item.icon color={item.color} size={22} strokeWidth={1.8} />
                <Text className="text-white/85 text-base">{item.label}</Text>
              </View>
              <ChevronRight color="#8ea9b4" size={20} />
            </View>
          ))}
        </View>
      </View>

      {/* 活动提示条 */}
      <View className="px-4 mt-5">
        <View className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(232,192,122,0.12)', border: '1px solid rgba(232,192,122,0.35)' }}
        >
          <Bell color="#e8c07a" size={20} strokeWidth={1.8} />
          <Text className="text-[#f0d9a8] text-sm">每周日晚 8 点，社区会发起集体追思活动</Text>
        </View>
      </View>

      {/* 登录/账号区域 */}
      <View className="px-4 mt-5">
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(18,42,53,0.75)', border: '1px solid rgba(232,192,122,0.25)' }}>
          {loginUser ? (
            <View className="px-5 py-4">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(127,195,206,0.2)' }}
                >
                  <ShieldCheck color="#7fc3ce" size={20} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="block text-white/90 font-semibold whitespace-nowrap">
                    {loginUser.nickname || loginUser.username}
                  </Text>
                  <Text className="block text-xs text-[#7fc3ce]/60 whitespace-nowrap">
                    {isAdmin ? '管理员账号' : '普通用户'}
                  </Text>
                </View>
                <Button
                  className="flex-shrink-0"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    width: 'auto',
                    minWidth: 0,
                    height: 'auto',
                    lineHeight: 'normal',
                    display: 'inline-flex',
                    alignItems: 'center',
                    boxShadow: 'none'
                  }}
                  onClick={() => setConfirmLogout(true)}
                >
                  <View
                    className="flex items-center gap-1 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: 'rgba(232,192,122,0.15)', border: '1px solid rgba(232,192,122,0.4)' }}
                  >
                    <LogOut color="#e8c07a" size={15} strokeWidth={2.2} />
                    <Text className="text-sm font-semibold" style={{ color: '#e8c07a' }}>退出登录</Text>
                  </View>
                </Button>
              </View>
              {isAdmin && (
                <View
                  className="flex items-center justify-between mt-3 pt-3 border-t"
                  style={{ borderColor: 'rgba(232,192,122,0.15)' }}
                  onClick={() => Taro.navigateTo({ url: '/pages/admin/gift-configs/index' })}
                >
                  <View className="flex items-center gap-2">
                    <Gift color="#e8c07a" size={18} />
                    <Text className="text-sm text-white/80">礼物配置管理</Text>
                  </View>
                  <ChevronRight color="#8ea9b4" size={18} />
                </View>
              )}
            </View>
          ) : (
            <View className="px-5 py-4 flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(232,192,122,0.2)' }}
                >
                  <LogIn color="#e8c07a" size={20} />
                </View>
                <View>
                  <Text className="block text-white/90 font-semibold">未登录</Text>
                  <Text className="block text-xs text-[#8ea9b4]">登录后可创建与管理故友空间</Text>
                </View>
              </View>
              <Button
                className="flex-shrink-0"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  width: 'auto',
                  minWidth: 0,
                  height: 'auto',
                  lineHeight: 'normal',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: 'none'
                }}
                onClick={openLogin}
              >
                <View
                  className="flex items-center gap-1 rounded-full px-3.5 py-1.5"
                  style={{ background: 'linear-gradient(90deg,#e8c07a,#d9a84c)' }}
                >
                  <LogIn color="#2e1f0f" size={16} strokeWidth={2.3} />
                  <Text className="text-sm font-semibold" style={{ color: '#2e1f0f' }}>登录 / 注册</Text>
                </View>
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* 我的故友入口 */}
      <View className="px-4 mt-4">
        <View
          className="rounded-2xl flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: 'rgba(18,42,53,0.75)', border: '1px solid rgba(232,192,122,0.25)' }}
          onClick={handleAddMemorial}
        >
          <View className="flex items-center gap-4">
            <View className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(127,195,206,0.2)' }}
            >
              <Heart color="#7fc3ce" size={22} strokeWidth={1.8} />
            </View>
            <Text className="text-white/85 text-base">我的故友</Text>
          </View>
          <ChevronRight color="#8ea9b4" size={20} />
        </View>
      </View>

      {/* 编辑弹窗 */}
      {isEditing && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={handleMaskClick}
        >
          <View
            className="rounded-2xl p-6 mx-4 w-full max-w-md"
            style={{ backgroundColor: '#112933', border: '1px solid rgba(232,192,122,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="block text-lg font-bold text-white mb-1 text-center">编辑个人信息</Text>
            <Text className="block text-xs text-[#8ea9b4] mb-4 text-center">完善资料，让家人更好地记住你</Text>
            <View className="flex flex-col gap-4">
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">头像</Text>
                <View
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mx-auto cursor-pointer"
                  style={{ backgroundColor: 'rgba(127,195,206,0.2)' }}
                  onClick={handleAvatarUpload}
                >
                  {tempAvatar ? (
                    <Image src={tempAvatar} className="w-full h-full" mode="aspectFill" />
                  ) : (
                    <User color="#8ea9b4" size={40} />
                  )}
                </View>
                <Text className="block text-xs text-center text-[#8ea9b4] mt-2">点击上传头像</Text>
              </View>
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">姓名 *</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent text-white"
                    style={{ color: '#fff' }}
                    value={editForm.name}
                    onInput={(e) => setEditForm({ ...editForm, name: e.detail.value })}
                    placeholder="请输入姓名"
                    placeholderStyle="color:#7e99a3"
                  />
                </View>
              </View>
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">简介</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent text-white"
                    style={{ color: '#fff' }}
                    value={editForm.bio}
                    onInput={(e) => setEditForm({ ...editForm, bio: e.detail.value })}
                    placeholder="请输入简介"
                    placeholderStyle="color:#7e99a3"
                  />
                </View>
              </View>
              <View className="flex gap-3 mt-2">
                <Button
                  className="flex-1 rounded-full py-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', height: 'auto', lineHeight: '1.6' }}
                  onClick={handleCancel}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 rounded-full py-3"
                  style={{ backgroundColor: '#e8c07a', color: '#2e1f0f', height: 'auto', lineHeight: '1.6' }}
                  onClick={handleSave}
                >
                  保存
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 登录/注册弹窗 */}
      {showAuth && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}
        >
          <View className="rounded-2xl p-6 mx-4 w-full max-w-md" style={{ backgroundColor: '#112933', border: '1px solid rgba(232,192,122,0.4)' }} onClick={(e) => e.stopPropagation()}>
            <Text className="block text-lg font-bold text-white mb-4 text-center">
              {authTab === 'login' ? '欢迎回来' : '加入晚星纪念'}
            </Text>
            <View className="flex gap-2 mb-4 rounded-full p-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Button
                className="flex-1 rounded-full py-2 text-sm"
                style={authTab === 'login' ? { backgroundColor: '#e8c07a', color: '#2e1f0f', height: 'auto', lineHeight: '1.6' } : { backgroundColor: 'transparent', color: '#8ea9b4', height: 'auto', lineHeight: '1.6' }}
                onClick={() => setAuthTab('login')}
              >
                登录
              </Button>
              <Button
                className="flex-1 rounded-full py-2 text-sm"
                style={authTab === 'register' ? { backgroundColor: '#e8c07a', color: '#2e1f0f', height: 'auto', lineHeight: '1.6' } : { backgroundColor: 'transparent', color: '#8ea9b4', height: 'auto', lineHeight: '1.6' }}
                onClick={() => setAuthTab('register')}
              >
                注册
              </Button>
            </View>
            {authTab === 'register' && (
              <View className="mb-3">
                <Text className="block text-sm font-medium text-white/85 mb-2">昵称</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    value={authForm.nickname}
                    onInput={(e) => setAuthForm({ ...authForm, nickname: e.detail.value })}
                    placeholder="请输入昵称（可选）"
                    placeholderStyle="color:#7e99a3"
                  />
                </View>
              </View>
            )}
            <View className="mb-3">
              <Text className="block text-sm font-medium text-white/85 mb-2">账号</Text>
              <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Input
                  className="w-full bg-transparent"
                  style={{ color: '#fff' }}
                  value={authForm.username}
                  onInput={(e) => setAuthForm({ ...authForm, username: e.detail.value })}
                  placeholder="3-32位字母/数字"
                  placeholderStyle="color:#7e99a3"
                />
              </View>
            </View>
            <View className="mb-4">
              <Text className="block text-sm font-medium text-white/85 mb-2">密码</Text>
              <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Input
                  className="w-full bg-transparent"
                  style={{ color: '#fff' }}
                  password
                  value={authForm.password}
                  onInput={(e) => setAuthForm({ ...authForm, password: e.detail.value })}
                  placeholder="至少6位"
                  placeholderStyle="color:#7e99a3"
                />
              </View>
            </View>
            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: '#e8c07a', color: '#2e1f0f', height: 'auto', lineHeight: '1.6' }}
              onClick={handleAuthSubmit}
              loading={authSubmitting}
            >
              {authTab === 'login' ? '登录' : '注册'}
            </Button>
          </View>
        </View>
      )}

      {/* 退出确认弹窗 */}
      {confirmLogout && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmLogout(false); }}
        >
          <View className="rounded-2xl p-6 mx-4 w-full max-w-xs" style={{ backgroundColor: '#112933', border: '1px solid rgba(232,192,122,0.4)' }} onClick={(e) => e.stopPropagation()}>
            <Text className="block text-lg font-bold text-white mb-4 text-center">确认退出登录？</Text>
            <View className="flex gap-3">
              <Button
                className="flex-1 rounded-full py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', height: 'auto', lineHeight: '1.6' }}
                onClick={() => setConfirmLogout(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 rounded-full py-3"
                style={{ backgroundColor: '#e8c07a', color: '#2e1f0f', height: 'auto', lineHeight: '1.6' }}
                onClick={handleLogout}
              >
                退出
              </Button>
            </View>
          </View>
        </View>
      )}
    </StarsBackground>
  );
};

export default ProfilePage;