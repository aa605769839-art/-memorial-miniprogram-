import { View, Text, Image, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { User, Calendar, Award, Send, Flower2, Trash2, X, Gift, Pencil, Eye } from 'lucide-react-taro';

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
  console.log('API Response:', res);
  if (res.data?.code === 200) {
    return res.data.data;
  }
  throw new Error(res.data?.msg || '请求失败');
};

// 判断是否为图片URL（以http开头）
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
  console.log('Detail page id:', id);

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
  }, [id]);

  // 获取故人详情
  const fetchMemorial = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await Network.request({
        url: `/api/memorials/${id}`,
        method: 'GET'
      });
      const data = handleApiResponse(res);
      setMemorial(data);
      
      // 检查是否是创建者
      const currentUserId = Taro.getStorageSync('userId');
      setIsCreator(data.user_id === currentUserId);
    } catch (error) {
      console.error('Failed to fetch memorial:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 获取留言和礼物（合并）
  const fetchMessages = async () => {
    if (!id) return;
    try {
      // 并行获取评论和礼物
      const [commentsRes, giftsRes] = await Promise.all([
        Network.request({ url: `/api/memorials/${id}/comments`, method: 'GET' }),
        Network.request({ url: `/api/gifts/memorial/${id}`, method: 'GET' })
      ]);

      const comments = handleApiResponse(commentsRes) || [];
      const gifts = handleApiResponse(giftsRes) || [];

      // 合并并按时间排序
      const combined = [...comments, ...gifts].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMessages(combined);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

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
            const userId = Taro.getStorageSync('userId');
            const deleteRes = await Network.request({
              url: `/api/memorials/${id}?userId=${userId}`,
              method: 'DELETE'
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

  // 预览图片
  const handlePreviewPhoto = (currentUrl: string) => {
    if (!memorial?.photos) return;
    const urls = memorial.photos.map(p => p.url);
    Taro.previewImage({ urls, current: currentUrl });
  };

  const handlePreviewAvatar = () => {
    if (memorial?.avatar_url) {
      Taro.previewImage({ urls: [memorial.avatar_url], current: memorial.avatar_url });
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 格式化时间（相对时间）
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
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
    return 'gift_id' in item;
  };

  // 加载中
  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-blue-50">
        <View className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <Text className="block text-sm text-slate-400 mt-3">加载中...</Text>
      </View>
    );
  }

  // 数据不存在
  if (!memorial) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-blue-50">
        <Flower2 color="#94a3b8" size={64} strokeWidth={1.5} />
        <Text className="block text-base text-slate-500 mt-4">纪念空间不存在</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-blue-50 pb-32">
      {/* 顶部操作栏 */}
      <View className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm px-4 pt-12 pb-3 flex justify-end">
        {isCreator && (
          <View className="flex gap-2">
            <View className="p-2" onClick={handleEdit}>
              <Pencil color="#64748b" size={22} />
            </View>
            <View className="p-2" onClick={handleDeleteMemorial}>
              <Trash2 color="#94a3b8" size={22} />
            </View>
          </View>
        )}
      </View>

      {/* 头像和基本信息 */}
      <View className="bg-white pt-16">
        {/* 正方形头像 */}
        <View className="w-full aspect-square bg-blue-100 flex items-center justify-center overflow-hidden">
          {memorial.avatar_url ? (
            <Image
              src={memorial.avatar_url}
              className="w-full h-full"
              mode="aspectFill"
              onClick={handlePreviewAvatar}
            />
          ) : (
            <User color="#94a3b8" size={96} />
          )}
        </View>
        
        {/* 姓名和基本信息 */}
        <View className="px-6 py-6 text-center">
          {/* 姓名 + 性别 */}
          <View className="flex items-center justify-center gap-2 mb-3">
            <Text className="text-3xl font-bold text-blue-900">{memorial.name}</Text>
            {memorial.gender === '男' && (
              <View className="w-5 h-5 rounded-full border border-blue-400 flex items-center justify-center">
                <Text className="text-blue-400 text-xs font-bold">♂</Text>
              </View>
            )}
            {memorial.gender === '女' && (
              <View className="w-5 h-5 rounded-full border border-pink-400 flex items-center justify-center">
                <Text className="text-pink-400 text-xs font-bold">♀</Text>
              </View>
            )}
          </View>
          
          {/* 享年 + 拜访数 */}
          {memorial.birth_date && memorial.death_date && (
            <View className="flex items-center justify-center gap-4 mb-3">
              <Text className="text-base text-slate-600 font-medium">
                享年{calculateAge(memorial.birth_date, memorial.death_date)}岁
              </Text>
              <View className="flex items-center gap-1">
                <Eye size={16} color="#94a3b8" />
                <Text className="text-sm text-slate-400">{memorial.visit_count || 0}</Text>
              </View>
            </View>
          )}
          
          {/* 生卒日期 */}
          {memorial.birth_date && memorial.death_date && (
            <View className="flex items-center justify-center gap-2">
              <Calendar color="#94a3b8" size={14} />
              <Text className="block text-sm text-slate-400">
                {formatDate(memorial.birth_date)} ~ {formatDate(memorial.death_date)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 简介和成就 */}
      {(memorial.description || (memorial.achievements && memorial.achievements.length > 0)) && (
        <View className="bg-white mt-4 px-6 py-4">
          {memorial.description && (
            <View className="mb-4">
              <View className="flex items-center gap-2 mb-3">
                <User color="#3b82f6" size={20} />
                <Text className="block text-lg font-semibold text-blue-900">简介</Text>
              </View>
              <Text className="block text-sm text-slate-600 leading-relaxed">{memorial.description}</Text>
            </View>
          )}
          
          {memorial.achievements && memorial.achievements.length > 0 && (
            <View>
              <View className="flex items-center gap-2 mb-3">
                <Award color="#3b82f6" size={20} />
                <Text className="block text-lg font-semibold text-blue-900">主要成就</Text>
              </View>
              <View className="flex flex-col gap-2">
                {memorial.achievements.map((achievement, index) => (
                  <View key={index} className="flex items-start gap-3">
                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <Text className="block text-sm text-slate-600 leading-relaxed flex-1">{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 生活照片 */}
      {memorial.photos && memorial.photos.length > 0 && (
        <View className="bg-white mt-4 px-6 py-4">
          <View className="flex items-center justify-between mb-3">
            <Text className="block text-lg font-semibold text-blue-900">生活照片</Text>
            {memorial.photos.length > 3 && (
              <Text
                className="text-sm text-blue-500"
                onClick={() => setShowAllPhotos(!showAllPhotos)}
              >
                {showAllPhotos ? '收起' : `展开全部${memorial.photos.length}张`}
              </Text>
            )}
          </View>
          <View className="grid grid-cols-3 gap-2">
            {(showAllPhotos ? memorial.photos : memorial.photos.slice(0, 3)).map((photo) => (
              <View key={photo.id} className="aspect-square rounded-lg overflow-hidden">
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
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 p-4 z-50">
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-blue-500 text-white rounded-full py-3 shadow-md flex items-center justify-center gap-2"
            onClick={() => {
              fetchGiftConfigs();
              setShowGiftModal(true);
            }}
          >
            <Gift size={18} color="#ffffff" />
            <Text>悼念</Text>
          </Button>
          <Button
            className="flex-1 bg-blue-100 text-blue-700 rounded-full py-3"
            onClick={handleVisit}
          >
            拜访
          </Button>
        </View>
      </View>

      {/* 留言区域 */}
      <View className="bg-white mt-4 px-6 py-4 mb-20">
        <View className="flex items-center justify-between mb-4">
          <Text className="block text-lg font-semibold text-blue-900">留言板</Text>
          <Text className="block text-sm text-slate-500">{messages.length} 条</Text>
        </View>

        {messages.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-10">
            <Text className="block text-sm text-slate-400">还没有留言，留下您的思念</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {messages.map((msg) => {
              if (isGiftItem(msg)) {
                // 礼物卡片
                return (
                  <View key={msg.id} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <View className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden">
                          {msg.sender?.avatar ? (
                            <Image src={msg.sender.avatar} className="w-full h-full" mode="aspectFill" />
                          ) : (
                            <Text className="text-xs text-pink-600">{msg.sender?.name?.charAt(0) || '访'}</Text>
                          )}
                        </View>
                        <View>
                          <Text className="block text-sm font-medium text-pink-700">{msg.sender?.name || '访客'}</Text>
                          <Text className="block text-xs text-pink-500">赠送了 {msg.gift_name}</Text>
                        </View>
                      </View>
                      <Text className="block text-xs text-pink-400">{formatTime(msg.created_at)}</Text>
                    </View>
                    <View className="flex items-end gap-3">
                      <View className="flex-shrink-0 flex items-center justify-center">
                        <GiftIcon icon={msg.gift_icon} size="large" />
                      </View>
                      {msg.message && (
                        <View className="flex-1 bg-white/50 rounded-lg p-2">
                          <Text className="block text-sm text-slate-700 leading-relaxed">{msg.message}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              } else {
                // 普通留言
                const isMyComment = msg.author_name === visitorName.trim();
                return (
                  <View key={msg.id} className="bg-blue-50 rounded-xl p-4">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <View className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
                          {msg.author_avatar ? (
                            <Image src={msg.author_avatar} className="w-full h-full" mode="aspectFill" />
                          ) : (
                            <Text className="text-xs text-slate-500">{msg.author_name.charAt(0)}</Text>
                          )}
                        </View>
                        <Text className="block text-sm font-medium text-slate-700">{msg.author_name}</Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <Text className="block text-xs text-slate-500">{formatTime(msg.created_at)}</Text>
                        {isMyComment && (
                          <View
                            className="px-2 py-1 bg-red-100 rounded-full"
                            onClick={() => handleDeleteComment(msg.id, msg.author_name)}
                          >
                            <Text className="text-xs text-red-500">删除</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text className="block text-sm text-slate-600 leading-relaxed">{msg.content}</Text>
                  </View>
                );
              }
            })}
          </View>
        )}

        {/* 留言输入 */}
        <View className="mt-4 pt-4 border-t border-blue-100">
          {/* 用户信息 */}
          <View className="flex items-center gap-3 mb-3 px-1">
            <View className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
              {visitorAvatar ? (
                <Image src={visitorAvatar} className="w-full h-full" mode="aspectFill" />
              ) : (
                <Text className="text-sm text-slate-500">{visitorName.charAt(0) || '访'}</Text>
              )}
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700">{visitorName || '访客'}</Text>
            </View>
          </View>
          
          {/* 输入框 */}
          <View className="bg-blue-50 rounded-xl p-4 mb-3">
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
              className="bg-blue-500 text-white rounded-full px-6 py-2 flex items-center gap-2"
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
            <View className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
              <Text className="text-lg font-bold text-blue-900">选择礼物</Text>
              <View className="p-2" onClick={() => { setShowGiftModal(false); setSelectedGift(null); setGiftMessage(''); }}>
                <X size={24} color="#94a3b8" />
              </View>
            </View>

            {/* 礼物列表 */}
            <View className="px-6 py-4">
              <View className="grid grid-cols-3 gap-4">
                {giftConfigs.map((gift) => (
                  <View
                    key={gift.id}
                    className={`flex flex-col items-center justify-end p-4 rounded-2xl border-2 min-h-[140px] ${
                      selectedGift?.id === gift.id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'
                    }`}
                    onClick={() => setSelectedGift(gift)}
                  >
                    <View className="flex-1 flex items-center justify-center w-full mb-2">
                      <GiftIcon icon={gift.icon} size="normal" />
                    </View>
                    <Text className={`text-sm font-semibold ${gift.color}`}>{gift.name}</Text>
                    <Text className="text-xs text-gray-500 mt-1">{gift.price || 0}积分</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 留言输入 */}
            {selectedGift && (
              <View className="px-6 py-4 border-t border-blue-100">
                <Text className="block text-sm font-medium text-slate-700 mb-2">给故人留句话（可选）</Text>
                <View className="bg-blue-50 rounded-xl p-4">
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
            <View className="px-6 py-4 border-t border-blue-100">
              <Button
                className={`w-full rounded-full py-3 ${selectedGift ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}
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
            <View className="bg-blue-500 px-6 py-4">
              <Text className="text-lg font-bold text-white text-center">确认删除</Text>
            </View>
            <View className="px-6 py-6">
              <Text className="text-base text-slate-600 text-center leading-relaxed">确定要删除这条留言吗？</Text>
              <Text className="text-sm text-slate-400 text-center mt-2">删除后无法恢复</Text>
            </View>
            <View className="flex border-t border-blue-100">
              <View className="flex-1 py-4 bg-blue-50 flex items-center justify-center" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                <Text className="text-base text-slate-600 text-center font-medium">取消</Text>
              </View>
              <View className="w-px bg-blue-100" />
              <View className="flex-1 py-4 bg-blue-500 flex items-center justify-center" onClick={confirmDeleteComment}>
                <Text className="text-base text-white text-center font-medium">确定</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DetailPage;
