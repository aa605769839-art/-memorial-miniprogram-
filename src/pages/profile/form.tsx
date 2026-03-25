import { View, Text, Image, Button, Input, Textarea, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { User } from 'lucide-react-taro';

interface NewMemorial {
  name: string;
  gender: string;
  birthDate: string;
  deathDate: string;
  description: string;
  achievements: string;
}

const GENDER_OPTIONS = ['男', '女', '未知'];

interface Photo {
  id: string;
  memorial_id: string;
  url: string;
  order_index: number;
  created_at: string;
}

// 滑动日期选择器组件
interface SlideDatePickerProps {
  label: string;
  value: string; // yyyy-mm-dd
  onChange: (date: string) => void;
  placeholder?: string;
}

const SlideDatePicker = ({ label, value, onChange, placeholder = '请选择日期' }: SlideDatePickerProps) => {
  const [year, month, day] = value ? value.split('-').map(Number) : [new Date().getFullYear(), 1, 1];
  const displayText = value || placeholder;
  
  // 选择器范围：1900-2030年
  const years = Array.from({ length: 131 }, (_, i) => String(1900 + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  
  // 根据年月计算天数
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(year || 2000, month || 1) }, (_, i) => String(i + 1).padStart(2, '0'));
  
  // 当前选择器索引
  const yearIndex = years.findIndex(y => y === String(year));
  const monthIndex = months.findIndex(m => m === String(month).padStart(2, '0'));
  const dayIndex = days.findIndex(d => d === String(day).padStart(2, '0'));
  
  const handlePickerChange = (e: any) => {
    const { value: pickerValue } = e.detail;
    const [yIndex, mIndex, dIndex] = pickerValue;
    const selectedYear = years[yIndex] || years[0];
    const selectedMonth = months[mIndex] || months[0];
    
    // 重新计算该月的天数
    const daysInMonth = getDaysInMonth(Number(selectedYear), Number(selectedMonth));
    const safeDayIndex = Math.min(dIndex, daysInMonth - 1);
    const selectedDay = days[safeDayIndex] || '01';
    
    const newDate = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    onChange(newDate);
  };

  return (
    <View className="flex-1">
      <Text className="block text-sm font-medium text-slate-700 mb-2">{label}</Text>
      <Picker
        mode="multiSelector"
        range={[years, months, days]}
        value={[Math.max(0, yearIndex), Math.max(0, monthIndex), Math.max(0, dayIndex)]}
        onChange={handlePickerChange}
      >
        <View className="bg-blue-50 rounded-xl px-4 py-3">
          <Text className={`${value ? 'text-slate-700' : 'text-slate-400'}`}>
            {displayText}
          </Text>
        </View>
      </Picker>
    </View>
  );
};

const FormPage = () => {
  const router = useRouter();
  const { id } = router.params;
  const isEditMode = !!id;

  const [formData, setFormData] = useState<NewMemorial>({
    name: '',
    gender: '未知',
    birthDate: '',
    deathDate: '',
    description: '',
    achievements: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载故人信息（编辑模式）
  useEffect(() => {
    if (isEditMode) {
      loadMemorial();
    }
  }, [isEditMode]);

  const loadMemorial = async () => {
    setLoading(true);
    try {
      const res = await Network.request({
        url: `/api/memorials/${id}`,
        method: 'GET'
      });

      if (res.data?.code === 200) {
        const memorial = res.data.data;
        // 从 ISO 字符串提取 yyyy-mm-dd
        const formatDate = (dateStr: string | null) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        };
        
        setFormData({
          name: memorial.name,
          gender: memorial.gender || '未知',
          birthDate: formatDate(memorial.birth_date),
          deathDate: formatDate(memorial.death_date),
          description: memorial.description || '',
          achievements: memorial.achievements ? memorial.achievements.join('，') : ''
        });
        setAvatarUrl(memorial.avatar_url);
        // 加载照片
        if (memorial.photos && memorial.photos.length > 0) {
          const photoUrls = memorial.photos
            .sort((a: Photo, b: Photo) => a.order_index - b.order_index)
            .map((p: Photo) => p.url);
          setPhotos(photoUrls);
        }
      }
    } catch (error) {
      console.error('Failed to load memorial:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewMemorial, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        setIsUploading(true);
        try {
          const uploadRes = await Network.uploadFile({
            url: '/api/upload',
            filePath: tempFilePath,
            name: 'file'
          });

          if (uploadRes.statusCode === 200) {
            const data = JSON.parse(uploadRes.data);
            if (data.code === 200) {
              setAvatarUrl(data.data.url);
              Taro.showToast({ title: '上传成功', icon: 'success' });
            }
          }
        } catch (error) {
          console.error('Failed to upload avatar:', error);
          Taro.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  const generateAvatar = async (): Promise<string | null> => {
    if (!formData.name) {
      Taro.showToast({ title: '请先输入姓名', icon: 'none' });
      return null;
    }

    setIsGenerating(true);
    Taro.showLoading({ title: '正在生成头像...', mask: true });
    try {
      // 计算年龄
      let ageHint = '';
      if (formData.birthDate) {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (formData.deathDate) {
          const deathDate = new Date(formData.deathDate);
          const ageAtDeath = deathDate.getFullYear() - birthDate.getFullYear();
          if (ageAtDeath < 13) {
            ageHint = `a ${ageAtDeath}-year-old child, young age, childlike features`;
          } else if (ageAtDeath < 20) {
            ageHint = `a ${ageAtDeath}-year-old teenager, youthful appearance`;
          } else if (ageAtDeath < 35) {
            ageHint = `a ${ageAtDeath}-year-old young adult, youthful face`;
          } else if (ageAtDeath < 50) {
            ageHint = `a ${ageAtDeath}-year-old middle-aged adult, mature appearance`;
          } else if (ageAtDeath < 70) {
            ageHint = `a ${ageAtDeath}-year-old senior adult, mature features with some wrinkles`;
          } else {
            ageHint = `a ${ageAtDeath}-year-old elderly person, elderly features, gentle wrinkles, wise expression`;
          }
        } else {
          if (age < 13) {
            ageHint = `a ${age}-year-old child, young age, childlike features`;
          } else if (age < 20) {
            ageHint = `a ${age}-year-old teenager, youthful appearance`;
          } else if (age < 35) {
            ageHint = `a ${age}-year-old young adult, youthful face`;
          } else if (age < 50) {
            ageHint = `a ${age}-year-old middle-aged adult, mature appearance`;
          } else if (age < 70) {
            ageHint = `a ${age}-year-old senior adult, mature features with some wrinkles`;
          } else {
            ageHint = `a ${age}-year-old elderly person, elderly features, gentle wrinkles, wise expression`;
          }
        }
      }

      const cleanDescription = formData.description 
        ? formData.description.replace(/[#*_`~\[\](){}|\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30)
        : '';

      const genderEn = formData.gender === '男' ? 'male' : formData.gender === '女' ? 'female' : 'person';
      const prompt = `Cute cartoon portrait of ${formData.name}, ${ageHint || 'adult'}, ${genderEn}. ${cleanDescription ? `Personality: ${cleanDescription}.` : ''} Style: gentle smile, warm eyes, soft cartoon art, peaceful atmosphere, pastel blue and warm tones, clean lines, high quality memorial portrait.`;

      const res = await Network.request({
        url: '/api/generate-avatar',
        method: 'POST',
        data: { prompt }
      });

      if (res.data?.code === 200) {
        setAvatarUrl(res.data.data);
        Taro.showToast({ title: '头像生成成功', icon: 'success' });
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      Taro.showToast({ title: '头像生成失败', icon: 'none' });
      return null;
    } finally {
      setIsGenerating(false);
      Taro.hideLoading();
    }
  };

  const handleUploadPhotos = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePaths = res.tempFilePaths;
        const uploadPromises = tempFilePaths.map(filePath =>
          Network.uploadFile({
            url: '/api/upload',
            filePath,
            name: 'file'
          })
        );

        try {
          const results = await Promise.all(uploadPromises);
          const uploadedUrls: string[] = [];
          results.forEach(result => {
            if (result.statusCode === 200) {
              const data = JSON.parse(result.data);
              if (data.code === 200) {
                uploadedUrls.push(data.data.url);
              }
            }
          });

          if (uploadedUrls.length > 0) {
            setPhotos(prev => [...prev, ...uploadedUrls]);
            Taro.showToast({ title: `成功上传${uploadedUrls.length}张照片`, icon: 'success' });
          }
        } catch (error) {
          console.error('Failed to upload photos:', error);
          Taro.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  };

  const handleRemovePhoto = (index: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          setPhotos(prev => prev.filter((_, i) => i !== index));
        }
      }
    });
  };

  const handlePreviewPhoto = (currentUrl: string) => {
    if (photos.length === 0) return;
    Taro.previewImage({ urls: photos, current: currentUrl });
  };

  const handlePreviewAvatar = () => {
    if (!avatarUrl) return;
    Taro.previewImage({ urls: [avatarUrl], current: avatarUrl });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!formData.birthDate || !formData.deathDate) {
      Taro.showToast({ title: '请输入生卒日期', icon: 'none' });
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (!finalAvatarUrl) {
        Taro.showLoading({ title: '正在生成头像...', mask: true });
        finalAvatarUrl = await generateAvatar();
        Taro.hideLoading();
        if (!finalAvatarUrl) {
          Taro.showToast({ title: '头像生成失败，请重试', icon: 'none' });
          setIsSaving(false);
          return;
        }
      }

      const achievements = formData.achievements
        ? formData.achievements.split(/[,，、]/).map(a => a.trim()).filter(Boolean)
        : null;

      // 将 yyyy-mm-dd 转换为 ISO 字符串（与现有接口一致）
      const toISODate = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`).toISOString();

      if (isEditMode) {
        const updateRes = await Network.request({
          url: `/api/memorials/${id}`,
          method: 'PUT',
          data: {
            name: formData.name,
            gender: formData.gender,
            birthDate: toISODate(formData.birthDate),
            deathDate: toISODate(formData.deathDate),
            description: formData.description || null,
            achievements,
            avatarUrl: finalAvatarUrl
          }
        });

        if (updateRes.data?.code === 200) {
          await Network.request({ url: `/api/photos/memorial/${id}`, method: 'DELETE' });
          if (photos.length > 0) {
            await Network.request({
              url: `/api/photos/batch/${id}`,
              method: 'POST',
              data: { urls: photos }
            });
          }
          Taro.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      } else {
        let userId = Taro.getStorageSync('userId');
        if (!userId) {
          userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          Taro.setStorageSync('userId', userId);
        }

        const res = await Network.request({
          url: '/api/memorials',
          method: 'POST',
          data: {
            userId,
            name: formData.name,
            gender: formData.gender,
            birthDate: toISODate(formData.birthDate),
            deathDate: toISODate(formData.deathDate),
            description: formData.description || null,
            achievements,
            avatarUrl: finalAvatarUrl
          }
        });

        if (res.data?.code === 200) {
          if (photos.length > 0) {
            const memorialId = res.data.data.id;
            await Network.request({
              url: `/api/photos/batch/${memorialId}`,
              method: 'POST',
              data: { urls: photos }
            });
          }
          Taro.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      }
    } catch (error) {
      console.error('Failed to save memorial:', error);
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePolish = async (field: 'description' | 'achievements') => {
    const text = formData[field];
    if (!text?.trim()) {
      Taro.showToast({ title: '请先输入内容', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '正在润色...', mask: true });
    try {
      const res = await Network.request({
        url: '/api/memorials/polish-text',
        method: 'POST',
        data: { text }
      });

      if (res.data?.code === 200 && res.data.data?.polishedText) {
        setFormData(prev => ({ ...prev, [field]: res.data.data.polishedText }));
        Taro.showToast({ title: '润色完成', icon: 'success' });
      }
    } catch (error) {
      Taro.showToast({ title: '润色失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  return (
    <View className="min-h-screen bg-blue-50 pb-6">
      {/* 头部 */}
      <View className="bg-white px-4 py-5 border-b border-blue-100">
        <Text className="block text-2xl font-bold text-blue-900">
          {isEditMode ? '编辑' : '添加故人'}
        </Text>
      </View>

      {/* 加载状态 */}
      {loading && (
        <View className="flex flex-col items-center justify-center py-20">
          <View className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <Text className="block text-sm text-slate-400 mt-4">加载中...</Text>
        </View>
      )}

      {/* 表单 */}
      {!loading && (
        <View className="px-4 py-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            {/* 头像预览 */}
            <View className="flex flex-col items-center mb-6">
              <View className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden mb-4 shadow-sm border border-blue-200">
                {avatarUrl ? (
                  <Image src={avatarUrl} className="w-full h-full" mode="aspectFill" onClick={handlePreviewAvatar} />
                ) : (
                  <View className="flex flex-col items-center gap-2">
                    <User color="#94a3b8" size={64} />
                    <Text className="text-sm text-slate-400">暂无头像</Text>
                  </View>
                )}
              </View>
              {avatarUrl ? (
                <Text className="text-base font-semibold text-blue-500 underline cursor-pointer" onClick={handleUploadAvatar}>
                  {isUploading ? '上传中...' : '更换头像'}
                </Text>
              ) : (
                <Text className="text-base font-semibold text-blue-500 underline cursor-pointer" onClick={generateAvatar}>
                  {isGenerating ? '生成中...' : 'AI 生成头像'}
                </Text>
              )}
              <Text className="block text-xs text-slate-400 mt-2 text-center">
                {avatarUrl ? '点击更换头像' : '点击生成或上传头像'}
              </Text>
            </View>

            {/* 照片上传 */}
            <View className="mb-6">
              <Text className="block text-sm font-medium text-slate-700 mb-2">生活照片（可选，最多9张）</Text>
              <View className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <View key={index} className="relative aspect-square">
                    <Image src={photo} className="w-full h-full rounded-lg" mode="aspectFill" onClick={() => handlePreviewPhoto(photo)} />
                    <View className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center" onClick={() => handleRemovePhoto(index)}>
                      <Text className="text-white text-xs font-bold">×</Text>
                    </View>
                  </View>
                ))}
                {photos.length < 9 && (
                  <View className="aspect-square bg-blue-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-blue-200" onClick={handleUploadPhotos}>
                    <Text className="text-3xl text-blue-300 font-light">+</Text>
                    <Text className="text-xs text-slate-400 mt-1">添加照片</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 表单字段 */}
            <View className="flex flex-col gap-4">
              {/* 姓名 */}
              <View>
                <Text className="block text-sm font-medium text-slate-700 mb-2">姓名 *</Text>
                <View className="bg-blue-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-slate-700 placeholder-slate-400"
                    placeholder="请输入姓名"
                    value={formData.name}
                    onInput={(e) => handleInputChange('name', e.detail.value)}
                  />
                </View>
              </View>

              {/* 性别 */}
              <View>
                <Text className="block text-sm font-medium text-slate-700 mb-2">性别</Text>
                <View className="flex gap-3">
                  {GENDER_OPTIONS.map((option) => (
                    <View
                      key={option}
                      className={`flex-1 py-3 px-4 rounded-xl text-center cursor-pointer transition-colors ${formData.gender === option ? 'bg-blue-500' : 'bg-blue-50'}`}
                      onClick={() => handleInputChange('gender', option)}
                    >
                      <Text className={formData.gender === option ? 'text-white' : 'text-slate-700'}>{option}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 出生日期和去世日期 - 滑动选择器 */}
              <View className="flex gap-4">
                <SlideDatePicker
                  label="出生日期 *"
                  value={formData.birthDate}
                  onChange={(date) => handleInputChange('birthDate', date)}
                  placeholder="请选择出生日期"
                />
                <SlideDatePicker
                  label="去世日期 *"
                  value={formData.deathDate}
                  onChange={(date) => handleInputChange('deathDate', date)}
                  placeholder="请选择去世日期"
                />
              </View>

              {/* 简介 */}
              <View>
                <View className="flex justify-between items-center mb-2">
                  <Text className="block text-sm font-medium text-slate-700">简介</Text>
                  <Text className="text-xs font-semibold text-blue-500 underline cursor-pointer" onClick={() => handlePolish('description')}>AI润色</Text>
                </View>
                <View className="bg-blue-50 rounded-xl p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="请输入简介..."
                    value={formData.description}
                    onInput={(e) => handleInputChange('description', e.detail.value)}
                    maxlength={200}
                  />
                  <Text className="block text-xs text-slate-400 mt-1 text-right">{formData.description.length}/200</Text>
                </View>
              </View>

              {/* 主要成就 */}
              <View>
                <View className="flex justify-between items-center mb-2">
                  <Text className="block text-sm font-medium text-slate-700">主要成就</Text>
                  <Text className="text-xs font-semibold text-blue-500 underline cursor-pointer" onClick={() => handlePolish('achievements')}>AI润色</Text>
                </View>
                <View className="bg-blue-50 rounded-xl p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="请输入主要成就，用逗号分隔..."
                    value={formData.achievements}
                    onInput={(e) => handleInputChange('achievements', e.detail.value)}
                    maxlength={300}
                  />
                  <Text className="block text-xs text-slate-400 mt-1 text-right">{formData.achievements.length}/300</Text>
                </View>
              </View>

              {/* 提交按钮 */}
              <Button className="bg-blue-500 text-white rounded-full py-3 shadow-md mt-2" onClick={handleSubmit} disabled={isSaving}>
                <Text>{isSaving ? '保存中...' : (isEditMode ? '保存修改' : '保存故人')}</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default FormPage;
