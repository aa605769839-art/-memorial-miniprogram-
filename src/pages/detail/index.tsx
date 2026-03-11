import { View, Text, Image, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Heart, User, Calendar, Award, Send, Flower2, Trash2 } from 'lucide-react-taro';

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
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  description: string | null;
  achievements: string[] | null;
  mourning_count: number;
  visit_count: number;
  photos?: Photo[];
}

interface Comment {
  id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

const DetailPage = () => {
  const router = useRouter();
  const { id } = router.params;
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMemorial();
      fetchComments();
      recordVisit();
      // 从本地存储加载用户昵称
      const userProfile = Taro.getStorageSync('userProfile');
      if (userProfile && userProfile.name) {
        setVisitorName(userProfile.name);
      }
    }
  }, [id]);

  const fetchMemorial = async () => {
    try {
      const res = await Network.request({
        url: `/api/memorials/${id}`,
        method: 'GET'
      });
      console.log('Memorial detail response:', res.data);
      if (res.data?.code === 200) {
        setMemorial(res.data.data);
        
        // 检查是否是创建者
        const currentUserId = Taro.getStorageSync('userId');
        setIsCreator(res.data.data.user_id === currentUserId);
      }
    } catch (error) {
      console.error('Failed to fetch memorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
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

            if (deleteRes.data?.code === 200) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success'
              });
              setTimeout(() => {
                Taro.navigateBack();
              }, 1000);
            } else {
              Taro.showToast({
                title: deleteRes.data?.msg || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('Failed to delete memorial:', error);
            Taro.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  };

  const handleEdit = () => {
    Taro.navigateTo({
      url: `/pages/profile/form?id=${id}`
    });
  };

  const fetchComments = async () => {
    try {
      const res = await Network.request({
        url: `/api/memorials/${id}/comments`,
        method: 'GET'
      });
      console.log('Comments response:', res.data);
      if (res.data?.code === 200) {
        setComments(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const recordVisit = async () => {
    try {
      await Network.request({
        url: '/api/visits',
        method: 'POST',
        data: {
          memorialId: id,
          visitorName: '访客'
        }
      });
    } catch (error) {
      console.error('Failed to record visit:', error);
    }
  };

  const handleMourning = async () => {
    if (!visitorName.trim()) {
      Taro.showToast({
        title: '请输入您的名字',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/mourning',
        method: 'POST',
        data: {
          memorialId: id,
          visitorName: visitorName.trim()
        }
      });

      if (res.data?.code === 200) {
        Taro.showToast({
          title: '悼念成功',
          icon: 'success'
        });
        fetchMemorial();
      }
    } catch (error) {
      console.error('Failed to mourn:', error);
      Taro.showToast({
        title: '悼念失败',
        icon: 'none'
      });
    }
  };

  const handleVisit = async () => {
    try {
      await Network.request({
        url: '/api/visits',
        method: 'POST',
        data: {
          memorialId: id,
          visitorName: visitorName.trim() || '访客'
        }
      });

      Taro.showToast({
        title: '拜访成功',
        icon: 'success'
      });
      fetchMemorial();
    } catch (error) {
      console.error('Failed to visit:', error);
      Taro.showToast({
        title: '拜访失败',
        icon: 'none'
      });
    }
  };

  const handleComment = async () => {
    if (!visitorName.trim()) {
      Taro.showToast({
        title: '请输入您的名字',
        icon: 'none'
      });
      return;
    }

    if (!message.trim()) {
      Taro.showToast({
        title: '请输入留言内容',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/comments',
        method: 'POST',
        data: {
          memorialId: id,
          authorName: visitorName.trim(),
          content: message.trim()
        }
      });

      if (res.data?.code === 200) {
        Taro.showToast({
          title: '留言成功',
          icon: 'success'
        });
        setMessage('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to comment:', error);
      Taro.showToast({
        title: '留言失败',
        icon: 'none'
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const calculateAge = (birthDate: string, deathDate: string) => {
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    const age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-blue-50">
        <View className="flex flex-col items-center gap-3">
          <View className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <Text className="block text-sm text-slate-400">
            加载中...
          </Text>
        </View>
      </View>
    );
  }

  if (!memorial) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-blue-50">
        <Flower2 color="#94a3b8" size={64} strokeWidth={1.5} />
        <Text className="block text-base text-slate-500 mt-4">
          纪念空间不存在
        </Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-blue-50 pb-32">
      {/* 顶部操作栏 */}
      <View className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm px-4 pt-12 pb-3 flex justify-end">
        {isCreator && (
          <View className="flex gap-2">
            <View
              className="cursor-pointer p-2"
              onClick={handleEdit}
            >
              <Text className="text-base text-blue-500 font-medium">编辑</Text>
            </View>
            <View
              className="cursor-pointer p-2"
              onClick={handleDelete}
            >
              <Trash2 color="#ef4444" size={24} />
            </View>
          </View>
        )}
      </View>

      {/* 头像和姓名 - 正方形头像 */}
      <View className="bg-white pt-16">
        <View className="w-full aspect-square bg-blue-100 flex items-center justify-center overflow-hidden">
          {memorial.avatar_url ? (
            <Image
              src={memorial.avatar_url}
              className="w-full h-full"
              mode="aspectFill"
            />
          ) : (
            <User color="#94a3b8" size={96} />
          )}
        </View>
        <View className="px-6 py-6 text-center">
          <Text className="block text-3xl font-bold text-blue-900 mb-2">
            {memorial.name}
          </Text>
          {memorial.birth_date && memorial.death_date && (
            <View className="flex items-center justify-center gap-2 mb-4">
              <Calendar color="#94a3b8" size={16} />
              <Text className="block text-sm text-slate-500">
                {formatDate(memorial.birth_date)} ~ {formatDate(memorial.death_date)}
              </Text>
            </View>
          )}
          <View className="flex justify-center gap-6">
            <View className="flex items-center gap-2">
              <Heart color="#3b82f6" size={18} />
              <Text className="text-base text-blue-500 font-semibold">
                {memorial.mourning_count}
              </Text>
              <Text className="text-sm text-slate-500">悼念</Text>
            </View>
            <View className="flex items-center gap-2">
              <User color="#94a3b8" size={18} />
              <Text className="text-base text-slate-600 font-semibold">
                {memorial.visit_count}
              </Text>
              <Text className="text-sm text-slate-500">拜访</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 姓名、享年、简介 */}
      <View className="bg-white mt-4 px-6 py-4">
        <Text className="block text-xl font-bold text-blue-900 mb-3">
          {memorial.name}
          {memorial.birth_date && memorial.death_date && (
            <Text className="text-base font-semibold text-slate-700 ml-2">
              享年{calculateAge(memorial.birth_date, memorial.death_date)}岁
            </Text>
          )}
        </Text>
        {memorial.description && (
          <Text className="block text-sm text-slate-600 leading-relaxed">
            {memorial.description}
          </Text>
        )}
      </View>

      {/* 生活照片 */}
      {memorial.photos && memorial.photos.length > 0 && (
        <View className="bg-white mt-4 px-6 py-4">
          <View className="flex items-center justify-between mb-3">
            <Text className="block text-lg font-semibold text-blue-900">
              生活照片
            </Text>
            {memorial.photos.length > 3 && (
              <Text
                className="text-sm text-blue-500 cursor-pointer"
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
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 主要成就 */}
      {memorial.achievements && memorial.achievements.length > 0 && (
        <View className="bg-white mt-4 px-6 py-4">
          <View className="flex items-center gap-2 mb-3">
            <Award color="#3b82f6" size={20} />
            <Text className="block text-lg font-semibold text-blue-900">
              主要成就
            </Text>
          </View>
          <View className="flex flex-col gap-2">
            {memorial.achievements.map((achievement, index) => (
              <View key={index} className="flex items-start gap-3">
                <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <Text className="block text-sm text-slate-600 leading-relaxed flex-1">
                  {achievement}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 悼念和拜访按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 p-4 z-50">
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-blue-500 text-white rounded-full py-3 shadow-md"
            onClick={handleMourning}
          >
            悼念
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
          <Text className="block text-lg font-semibold text-blue-900">
            留言板
          </Text>
          <Text className="block text-sm text-slate-500">
            {comments.length} 条
          </Text>
        </View>

        {comments.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-10">
            <Text className="block text-sm text-slate-400">
              还没有留言，留下您的思念
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {comments.map((comment) => (
              <View
                key={comment.id}
                className="bg-blue-50 rounded-xl p-4"
              >
                <View className="flex items-center justify-between mb-2">
                  <View className="flex items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
                      {comment.author_avatar ? (
                        <Image
                          src={comment.author_avatar}
                          className="w-full h-full"
                          mode="aspectFill"
                        />
                      ) : (
                        <Text className="text-xs text-slate-500">
                          {comment.author_name.charAt(0)}
                        </Text>
                      )}
                    </View>
                    <Text className="block text-sm font-medium text-slate-700">
                      {comment.author_name}
                    </Text>
                  </View>
                  <Text className="block text-xs text-slate-500">
                    {formatTime(comment.created_at)}
                  </Text>
                </View>
                <Text className="block text-sm text-slate-600 leading-relaxed">
                  {comment.content}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 留言输入框 */}
        <View className="mt-4 pt-4 border-t border-blue-100">
          <View className="bg-blue-50 rounded-xl px-4 py-3 mb-3">
            <Input
              className="w-full bg-transparent text-slate-700 placeholder-slate-400"
              placeholder="您的名字"
              value={visitorName}
              onInput={(e) => setVisitorName(e.detail.value)}
            />
          </View>
          <View className="bg-blue-50 rounded-xl px-4 py-3 mb-3">
            <Input
              className="w-full bg-transparent text-slate-700 placeholder-slate-400"
              placeholder="写下您的思念..."
              value={message}
              onInput={(e) => setMessage(e.detail.value)}
              style={{ minHeight: '100px' }}
              maxlength={500}
            />
          </View>
          <View className="flex items-center justify-end gap-2">
            <Text className="text-xs text-slate-400">{message.length}/500</Text>
            <Button
              className="bg-blue-500 text-white rounded-full px-6 py-2 flex items-center gap-2"
              onClick={handleComment}
            >
              <Send size={16} />
              <Text>发送</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DetailPage;
