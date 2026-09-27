import { View, Text, Image, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Network } from '@/network';
import { Auth } from '@/auth';
import {
  User,
  Calendar,
  Award,
  Send,
  Flower2,
  Trash2,
  X,
  Gift,
  Pencil,
  Eye,
  Heart,
  ArrowLeft,
} from 'lucide-react-taro';

// H5环境下从URL hash获取参数
const getHashParams = () => {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash;
  const queryString = hash.split('?')[1];
  if (!queryString) return {};
  const params: Record<string, string> = {};
  queryString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

// 统一的 API 响应处理
const handleApiResponse = (res: any) => {
  if (res.data?.code === 200) {
    return res.data.data;
  }
  throw new Error(res.data?.msg || '请求失败');
};

// 通用取值：优先 camelCase，其次 snake_case（兼容两种后端格式）
const pick = (obj: any, camel: string, snake?: string) => {
  if (obj == null) return undefined;
  if (obj[camel] !== undefined) return obj[camel];
  if (snake && obj[snake] !== undefined) return obj[snake];
  return undefined;
};

// 判断是否为图片URL
const isImageUrl = (icon: string | null | undefined): boolean => {
  if (!icon) return false;
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('//');
};

// 礼物图标组件
const GiftIcon = ({ icon, size = 'normal' }: { icon: string | null | undefined; size?: 'small' | 'normal' | 'large' }) => {
  const sizeClass = size === 'large' ? 'w-16 h-16' : size === 'small' ? 'w-8 h-8' : 'w-12 h-12';
  const textSize = size === 'large' ? 'text-5xl' : size === 'small' ? 'text-xl' : 'text-4xl';

  if (isImageUrl(icon)) {
    return (
      <Image
        src={icon!}
        className={`${sizeClass} object-contain`}
        mode="aspectFit"
      />
    );
  }
  return <Text className={`${textSize}`}>{icon || '🎁'}</Text>;
};

interface Photo {
  id: string;
  memorial_id: string;
  url: string;
  order_index: number;
  created_at: string;
}

interface Memorial {
  id: string;
  name: string;
  gender?: string;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  description: string | null;
  achievements: string[] | null;
  mourning_count: number;
  visit_count: number;
  photos?: Photo[];
  user_id?: string;
}

interface Comment {
  id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

interface GiftConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  price: number;
}

interface GiftSender {
  name: string;
  avatar: string | null;
}

interface GiftItem {
  id: string;
  gift_id: string;
  gift_name: string;
  gift_icon: string | null;
  sender: GiftSender;
  message: string | null;
  created_at: string;
}

type MessageItem = Comment | GiftItem;

const DetailPage = () => {
  const router = useRouter();
  const hashParams = getHashParams();
  const id = router.params?.id || hashParams.id;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [message, setMessage] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorAvatar, setVisitorAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // 礼物相关状态
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftConfigs, setGiftConfigs] = useState<GiftConfig[]>([]);
  const [selectedGift, setSelectedGift] = useState<GiftConfig | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isSendingGift, setIsSendingGift] = useState(false);

  // 留言和礼物列表
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // 删除确认弹窗状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; authorName: string } | null>(null);

  // 后端统一返回 camelCase，兼容 old snake_case 供渲染层安全取值
  const mem = useMemo(() => {
    if (!memorial) return null;
    return {
      name: pick(memorial, 'name'),
      gender: pick(memorial, 'gender'),
      avatarUrl: pick(memorial, 'avatarUrl', 'avatar_url'),
      birthDate: pick(memorial, 'birthDate', 'birth_date'),
      deathDate: pick(memorial, 'deathDate', 'death_date'),
      description: pick(memorial, 'description'),
      achievements: pick(memorial, 'achievements'),
      visitCount: pick(memorial, 'visitCount', 'visit_count') ?? 0,
      mourningCount: pick(memorial, 'mourningCount', 'mourning_count') ?? 0,
      photos: pick(memorial, 'photos'),
      userId: pick(memorial, 'userId', 'user_id'),
    };
  }, [memorial]);

  // 获取故人详情
  const fetchMemorial = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await Network.request({
        url: `/api/memorials/${id}`,
        method: 'GET'
      });
      const data = handleApiResponse(res);
      setMemorial(data as Memorial);

      // 检查是否是创建者
      const currentUser = Auth.getUser();
      const memorialUserId = (data as any)?.userId ?? (data as any)?.user_id;
      setIsCreator(!!currentUser && memorialUserId === currentUser.id);
    } catch (error) {
      console.error('Failed to fetch memorial:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 获取留言和礼物（合并）
  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const [commentsRes, giftsRes] = await Promise.all([
        Network.request({ url: `/api/memorials/${id}/comments`, method: 'GET' }),
        Network.request({ url: `/api/gifts/memorial/${id}`, method: 'GET' })
      ]);

      const comments = handleApiResponse(commentsRes) || [];
      const gifts = handleApiResponse(giftsRes) || [];

      // 兼容 comment 的 createdAt / created_at
      const combined = [...comments, ...gifts].sort((a: any, b: any) => {
        const aT = pick(a, 'createdAt', 'created_at');
        const bT = pick(b, 'createdAt', 'created_at');
        return new Date(bT || 0).getTime() - new Date(aT || 0).getTime();
      });
      setMessages(combined);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [id]);

  // 获取礼物配置
  const fetchGiftConfigs = async () => {
    try {
      const res = await Network.request({
        url: '/api/gift-configs/enabled',
        method: 'GET'
      });
      const data = handleApiResponse(res);
      setGiftConfigs(data || []);
    } catch (error) {
      console.error('Failed to fetch gift configs:', error);
    }
  };

  // 记录访问
  const recordVisit = async () => {
    if (!id) return;
    try {
      await Network.request({
        url: '/api/visits',
        method: 'POST',
        data: { memorialId: id, visitorName: '访客' }
      });
    } catch (error) {
      console.error('Failed to record visit:', error);
    }
  };

  // 发送礼物
  const handleSendGift = async () => {
    if (!selectedGift || !id) {
      Taro.showToast({ title: '请选择礼物', icon: 'none' });
      return;
    }

    setIsSendingGift(true);
    try {
      const res = await Network.request({
        url: '/api/gifts',
        method: 'POST',
        data: {
          memorialId: id,
          giftType: selectedGift.id,
          giftName: selectedGift.name,
          giftIcon: selectedGift.icon,
          senderName: visitorName.trim() || '访客',
          senderAvatar: visitorAvatar,
          message: giftMessage.trim() || null
        }
      });
      handleApiResponse(res);

      Taro.showToast({ title: '赠送成功', icon: 'success' });
      setShowGiftModal(false);
      setSelectedGift(null);
      setGiftMessage('');
      // 刷新数据
      fetchMessages();
      fetchMemorial();
    } catch (error) {
      console.error('Failed to send gift:', error);
      Taro.showToast({ title: '赠送失败', icon: 'none' });
    } finally {
      setIsSendingGift(false);
    }
  };

  // 拜访
  const handleVisit = async () => {
    if (!id) return;
    try {
      await Network.request({
        url: '/api/visits',
        method: 'POST',
        data: { memorialId: id, visitorName: visitorName.trim() || '访客' }
      });
      Taro.showToast({ title: '拜访成功', icon: 'success' });
      fetchMemorial();
    } catch (error) {
      console.error('Failed to visit:', error);
      Taro.showToast({ title: '拜访失败', icon: 'none' });
    }
  };

  // 发表评论
  const handleComment = async () => {
    if (!id) return;
    if (!visitorName.trim()) {
      Taro.showToast({ title: '请输入您的名字', icon: 'none' });
      return;
    }
    if (!message.trim()) {
      Taro.showToast({ title: '请输入留言内容', icon: 'none' });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/comments',
        method: 'POST',
        data: {
          memorialId: id,
          authorName: visitorName.trim(),
          authorAvatar: visitorAvatar,
          content: message.trim()
        }
      });
      handleApiResponse(res);

      Taro.showToast({ title: '留言成功', icon: 'success' });
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to comment:', error);
      Taro.showToast({ title: '留言失败', icon: 'none' });
    }
  };

  // 删除留言
  const handleDeleteComment = async (commentId: string, authorName: string) => {
    if (authorName !== visitorName.trim()) {
      Taro.showToast({ title: '只能删除自己的留言', icon: 'none' });
      return;
    }
    setDeleteTarget({ id: commentId, authorName });
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteTarget) return;
    try {
      const res = await Network.request({
        url: `/api/comments/${deleteTarget.id}?authorName=${encodeURIComponent(visitorName.trim())}`,
        method: 'DELETE'
      });
      handleApiResponse(res);

      Taro.showToast({ title: '删除成功', icon: 'success' });
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      Taro.showToast({ title: '删除失败', icon: 'none' });
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // 删除故人
  const handleDeleteMemorial = () => {
    if (!id) return;
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这位故友吗？此操作不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const deleteRes = await Network.request({
              url: `/api/memorials/${id}`,
              method: 'DELETE',
              header: Auth.headers()
            });
            handleApiResponse(deleteRes);

            Taro.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (error) {
            console.error('Failed to delete memorial:', error);
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  };

  // 编辑故人
  const handleEdit = () => {
    if (id) {
      Taro.navigateTo({ url: `/pages/profile/form?id=${id}` });
    }
  };

  // 返回
  const handleBack = () => {
    Taro.navigateBack();
  };

  // 预览图片
  const handlePreviewPhoto = (currentUrl: string) => {
    if (!mem?.photos) return;
    const urls = mem.photos.map(p => p.url);
    Taro.previewImage({ urls, current: currentUrl });
  };

  const handlePreviewAvatar = () => {
    if (mem?.avatarUrl) {
      Taro.previewImage({ urls: [mem.avatarUrl], current: mem.avatarUrl });
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 格式化时间（相对时间）
  const formatTime = (item: any) => {
    const t = pick(item, 'createdAt', 'created_at');
    if (!t) return '';
    const date = new Date(t);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  // 计算年龄
  const calculateAge = (birthDate: string, deathDate: string) => {
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 判断是否为礼物
  const isGiftItem = (item: MessageItem): item is GiftItem => {
    return 'gift_id' in item || 'giftId' in item;
  };

  // 页面显示时重新加载
  useDidShow(() => {
    if (id) {
      fetchMemorial();
    }
  });

  // 组件挂载时加载数据
  useEffect(() => {
    if (id) {
      fetchMemorial();
      fetchMessages();
      recordVisit();
      fetchGiftConfigs();
      // 从本地存储加载用户信息
      const userProfile = Taro.getStorageSync('userProfile');
      if (userProfile) {
        if (userProfile.name) setVisitorName(userProfile.name);
        if (userProfile.avatar) setVisitorAvatar(userProfile.avatar);
      }
    }
  }, [id, fetchMemorial, fetchMessages]);

  // 加载中
  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen bg-[#eef3e4]">
        <View className="w-12 h-12 border-4 border-[#cfe0d3] border-t-[#6f9b86] rounded-full animate-spin" />
        <Text className="block text-sm text-slate-400 mt-3">加载中...</Text>
      </View>
    );
  }

  // 数据不存在
  if (!mem) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen bg-[#eef3e4]">
        <Flower2 color="#94a3b8" size={64} strokeWidth={1.5} />
        <Text className="block text-base text-slate-500 mt-4">纪念空间不存在</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-[#f7f1e2] pb-32">
      {/* 顶部操作栏 */}
      <View className="fixed top-0 left-0 right-0 z-50 px-2 pt-12 pb-2 flex items-center justify-between">
        <View className="p-2" onClick={handleBack}>
          <ArrowLeft color="#4a3728" size={22} />
        </View>
        {isCreator && (
          <View className="flex gap-2">
            <View className="p-2" onClick={handleEdit}>
              <Pencil color="#8a7a6a" size={22} />
            </View>
            <View className="p-2" onClick={handleDeleteMemorial}>
              <Trash2 color="#8a7a6a" size={22} />
            </View>
          </View>
        )}
      </View>

      {/* 头像和基本信息 */}
      <View className="bg-gradient-to-br from-[#dce8dd] to-[#f3ead9] pt-16">
        {/* 居中圆形头像 */}
        <View className="flex flex-col items-center px-6">
          <View className="w-32 h-32 rounded-full bg-white/70 flex items-center justify-center overflow-hidden mb-4">
            {mem.avatarUrl ? (
              <Image
                src={mem.avatarUrl}
                className="w-full h-full"
                mode="aspectFill"
                onClick={handlePreviewAvatar}
              />
            ) : (
              <User color="#7bac8f" size={56} />
            )}
          </View>

          {/* 姓名 + 性别 */}
          <View className="flex items-center justify-center gap-2 mb-2">
            <Text className="text-3xl font-bold text-[#3f5d50]">{mem.name}</Text>
            {mem.gender === '男' && (
              <View className="w-6 h-6 rounded-full border border-[#7bac8f] flex items-center justify-center">
                <Text className="text-[#7bac8f] text-xs font-bold">♂</Text>
              </View>
            )}
            {mem.gender === '女' && (
              <View className="w-6 h-6 rounded-full border border-[#c9a86a] flex items-center justify-center">
                <Text className="text-[#c9a86a] text-xs font-bold">♀</Text>
              </View>
            )}
          </View>

          {/* 悼念人数 + 拜访数 */}
          <View className="flex items-center justify-center gap-6 mb-2 bg-white/50 rounded-full px-6 py-2">
            <View className="flex items-center gap-1.5">
              <Heart size={16} color="#c9a86a" />
              <Text className="text-sm text-[#4a3728] font-medium">{mem.mourningCount} 次悼念</Text>
            </View>
            <View className="flex items-center gap-1.5">
              <Eye size={16} color="#7bac8f" />
              <Text className="text-sm text-[#4a3728] font-medium">{mem.visitCount} 次拜访</Text>
            </View>
          </View>

          {/* 生卒日期 + 享年 */}
          {mem.birthDate && mem.deathDate && (
            <View className="flex items-center justify-center gap-2 mb-2">
              <Calendar color="#8a7a6a" size={15} />
              <Text className="block text-sm text-[#6b5b4a]">
                {formatDate(mem.birthDate)} ~ {formatDate(mem.deathDate)}
              </Text>
              <Text className="block text-sm font-semibold text-[#6b5b4a]">
                享年 {calculateAge(mem.birthDate, mem.deathDate)} 岁
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 简介和成就 */}
      {(mem.description || (mem.achievements && mem.achievements.length > 0)) && (
        <View className="bg-white mt-5 mx-4 rounded-3xl shadow-sm px-6 py-5">
          {mem.description && (
            <View className="mb-5">
              <View className="flex items-center gap-2 mb-3">
                <Flower2 color="#7bac8f" size={20} />
                <Text className="block text-lg font-semibold text-[#3f5d50]">生平简介</Text>
              </View>
              <Text className="block text-sm text-[#6b5b4a] leading-relaxed">{mem.description}</Text>
            </View>
          )}

          {mem.achievements && mem.achievements.length > 0 && (
            <View>
              <View className="flex items-center gap-2 mb-3">
                <Award color="#7bac8f" size={20} />
                <Text className="block text-lg font-semibold text-[#3f5d50]">生平成就</Text>
              </View>
              <View className="flex flex-wrap gap-2">
                {mem.achievements.map((achievement, index) => (
                  <View key={index} className="bg-[#eef3e4] rounded-full px-4 py-1.5">
                    <Text className="block text-sm text-[#3f5d50] font-medium">{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 生活照片 */}
      {mem.photos && mem.photos.length > 0 && (
        <View className="bg-white mt-5 mx-4 rounded-3xl shadow-sm px-6 py-5">
          <View className="flex items-center justify-between mb-3">
            <Text className="block text-lg font-semibold text-[#3f5d50]">记忆相册</Text>
            {mem.photos.length > 3 && (
              <Text
                className="text-sm text-[#7bac8f]"
                onClick={() => setShowAllPhotos(!showAllPhotos)}
              >
                {showAllPhotos ? '收起' : `展开全部${mem.photos.length}张`}
              </Text>
            )}
          </View>
          <View className="grid grid-cols-3 gap-2">
            {(showAllPhotos ? mem.photos : mem.photos.slice(0, 3)).map((photo) => (
              <View key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-[#eef3e4]">
                <Image
                  src={photo.url}
                  className="w-full h-full"
                  mode="aspectFill"
                  onClick={() => handlePreviewPhoto(photo.url)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 底部操作按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5ddd0'
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            className="!bg-[#7bac8f] !text-white !rounded-full !py-3 !border-0 flex items-center justify-center gap-2 shadow-md"
            onClick={() => {
              fetchGiftConfigs();
              setShowGiftModal(true);
            }}
          >
            <Gift size={18} color="#ffffff" />
            <Text>悼念</Text>
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            className="!bg-[#f3ead9] !text-[#7a6a54] !rounded-full !py-3 !border-0"
            onClick={handleVisit}
          >
            <Text>拜访</Text>
          </Button>
        </View>
      </View>

      {/* 留言区域 */}
      <View className="bg-white mt-5 mx-4 rounded-3xl shadow-sm px-6 py-5">
        <View className="flex items-center justify-between mb-4">
          <Text className="block text-lg font-semibold text-[#3f5d50]">留言板</Text>
          <Text className="block text-sm text-[#8a7a6a]">{messages.length} 条</Text>
        </View>

        {messages.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-10">
            <Flower2 color="#c9d8cd" size={48} strokeWidth={1.5} />
            <Text className="block text-sm text-[#8a7a6a] mt-3">还没有留言，留下您的思念</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {messages.map((msg) => {
              if (isGiftItem(msg)) {
                // 礼物卡片
                const senderName = pick((msg as any).sender, 'name');
                const senderAvatar = pick((msg as any).sender, 'avatar');
                return (
                  <View key={msg.id} className="bg-[#f3ead9] rounded-2xl p-4">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <View className="w-8 h-8 rounded-full bg-[#eed9a8] flex items-center justify-center overflow-hidden">
                          {senderAvatar ? (
                            <Image src={senderAvatar} className="w-full h-full" mode="aspectFill" />
                          ) : (
                            <Text className="text-xs text-[#a8843f]">{(senderName || '访').charAt(0)}</Text>
                          )}
                        </View>
                        <View>
                          <Text className="block text-sm font-medium text-[#7a6a54]">{senderName || '访客'}</Text>
                          <Text className="block text-xs text-[#b08d3f]">赠 {pick(msg, 'gift_name', 'giftName')}</Text>
                        </View>
                      </View>
                      <Text className="block text-xs text-[#a39480]">{formatTime(msg)}</Text>
                    </View>
                    <View className="flex items-end gap-3">
                      <View className="flex-shrink-0 flex items-center justify-center">
                        <GiftIcon icon={pick(msg, 'gift_icon', 'giftIcon')} size="large" />
                      </View>
                      {pick(msg, 'message') && (
                        <View className="flex-1 bg-white/60 rounded-lg p-3">
                          <Text className="block text-sm text-[#6b5b4a] leading-relaxed">{pick(msg, 'message')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              } else {
                // 普通留言（兼容 createdAt / created_at）
                const cmt = msg as any;
                const authorName = pick(cmt, 'authorName', 'author_name');
                const authorAvatar = pick(cmt, 'authorAvatar', 'author_avatar');
                const isMyComment = authorName === visitorName.trim();
                return (
                  <View key={cmt.id} className="bg-[#eef3e4] rounded-2xl p-4">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <View className="w-8 h-8 rounded-full bg-[#cfe0d3] flex items-center justify-center overflow-hidden">
                          {authorAvatar ? (
                            <Image src={authorAvatar} className="w-full h-full" mode="aspectFill" />
                          ) : (
                            <Text className="text-xs text-slate-500">{(authorName || '访').charAt(0)}</Text>
                          )}
                        </View>
                        <Text className="block text-sm font-medium text-[#3f5d50]">{authorName || '访客'}</Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <Text className="block text-xs text-[#8a7a6a]">{formatTime(cmt)}</Text>
                        {isMyComment && (
                          <View
                            className="px-2 py-1 bg-[#f3d9c2] rounded-full"
                            onClick={() => handleDeleteComment(cmt.id, authorName)}
                          >
                            <Text className="text-xs text-[#a85c3f]">删除</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text className="block text-sm text-[#6b5b4a] leading-relaxed">{pick(cmt, 'content')}</Text>
                  </View>
                );
              }
            })}
          </View>
        )}

        {/* 留言输入 */}
        <View className="mt-4 pt-4 border-t border-[#e5ddd0]">
          {/* 用户信息 */}
          <View className="flex items-center gap-3 mb-3 px-1">
            <View className="w-10 h-10 rounded-full bg-[#cfe0d3] flex items-center justify-center overflow-hidden">
              {visitorAvatar ? (
                <Image src={visitorAvatar} className="w-full h-full" mode="aspectFill" />
              ) : (
                <Text className="text-sm text-slate-500">{(visitorName || '访').charAt(0)}</Text>
              )}
            </View>
            <View>
              <Text className="block text-sm font-medium text-[#3f5d50]">{visitorName || '访客'}</Text>
            </View>
          </View>

          {/* 输入框 */}
          <View className="bg-[#eef3e4] rounded-2xl p-4 mb-3">
            <Textarea
              style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', textAlign: 'left' }}
              placeholder="写下您的思念..."
              value={message}
              onInput={(e) => setMessage(e.detail.value)}
              maxlength={500}
            />
            <View className="flex justify-end mt-2">
              <Text className="text-xs text-slate-400">{message.length}/500</Text>
            </View>
          </View>

          {/* 发送按钮 */}
          <View className="flex justify-end">
            <Button
              className="!bg-[#7bac8f] !text-white !rounded-full !px-6 !py-2 !border-0 flex items-center gap-2"
              onClick={handleComment}
            >
              <Send size={16} color="#ffffff" />
              <Text>发送</Text>
            </Button>
          </View>
        </View>
      </View>

      {/* 礼物选择弹窗 */}
      {showGiftModal && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e: any) => {
            if (e.target === e.currentTarget) {
              setShowGiftModal(false);
              setSelectedGift(null);
              setGiftMessage('');
            }
          }}
        >
          <View className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <View className="px-6 py-4 border-b border-[#e5ddd0] flex items-center justify-between">
              <Text className="text-lg font-bold text-[#3f5d50]">选择礼物</Text>
              <View className="p-2" onClick={() => { setShowGiftModal(false); setSelectedGift(null); setGiftMessage(''); }}>
                <X size={24} color="#8a7a6a" />
              </View>
            </View>

            {/* 礼物列表 */}
            <View className="px-6 py-4">
              <View className="grid grid-cols-3 gap-4">
                {giftConfigs.map((gift) => (
                  <View
                    key={gift.id}
                    className={`flex flex-col items-center justify-end p-4 rounded-2xl border-2 min-h-[140px] ${
                      selectedGift?.id === gift.id ? 'border-[#7bac8f] bg-[#eef3e4]' : 'border-transparent bg-[#f7f1e2]'
                    }`}
                    onClick={() => setSelectedGift(gift)}
                  >
                    <View className="flex-1 flex items-center justify-center w-full mb-2">
                      <GiftIcon icon={gift.icon} size="normal" />
                    </View>
                    <Text className={`block text-sm font-semibold ${gift.color || 'text-[#7a6a54]'}`}>{gift.name}</Text>
                    <Text className="block text-xs text-[#8a7a6a] mt-1">{gift.price || 0}积分</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 留言输入 */}
            {selectedGift && (
              <View className="px-6 py-4 border-t border-[#e5ddd0]">
                <Text className="block text-sm font-medium text-[#3f5d50] mb-2">给故人留句话（可选）</Text>
                <View className="bg-[#eef3e4] rounded-2xl p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="写下您的思念..."
                    value={giftMessage}
                    onInput={(e) => setGiftMessage(e.detail.value)}
                    maxlength={200}
                  />
                  <Text className="block text-xs text-slate-400 mt-1 text-right">{giftMessage.length}/200</Text>
                </View>
              </View>
            )}

            {/* 确认按钮 */}
            <View className="px-6 py-4 border-t border-[#e5ddd0]">
              <Button
                className={`!rounded-full !py-3 ${selectedGift ? '!bg-[#7bac8f] !text-white' : '!bg-[#eee7db] !text-[#a89a85]'}`}
                onClick={handleSendGift}
                disabled={!selectedGift || isSendingGift}
              >
                <Text>{isSendingGift ? '赠送中...' : `赠送 ${selectedGift ? selectedGift.name : ''}`}</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <View
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        >
          <View className="bg-white rounded-2xl mx-6 w-full max-w-sm overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <View className="bg-[#7bac8f] px-6 py-4">
              <Text className="block text-lg font-bold text-white text-center">确认删除</Text>
            </View>
            <View className="px-6 py-6">
              <Text className="block text-base text-slate-600 text-center leading-relaxed">确定要删除这条留言吗？</Text>
              <Text className="block text-sm text-slate-400 text-center mt-2">删除后无法恢复</Text>
            </View>
            <View className="flex border-t border-[#e5ddd0]">
              <View className="flex-1 py-4 bg-[#f3ead9] flex items-center justify-center" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                <Text className="block text-base text-slate-600 text-center font-medium">取消</Text>
              </View>
              <View className="w-px bg-[#e5ddd0]" />
              <View className="flex-1 py-4 bg-[#7bac8f] flex items-center justify-center" onClick={confirmDeleteComment}>
                <Text className="block text-base text-white text-center font-medium">确定</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DetailPage;