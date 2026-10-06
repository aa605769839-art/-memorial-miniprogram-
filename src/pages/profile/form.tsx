import { View, Text, Image, Button, Input, Textarea, Picker, Switch } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network'
import { uploadCrossPlatform, resolveUploadUrls } from '@/utils/upload';
import { Auth } from '@/auth';
import { User } from 'lucide-react-taro';
import { StarsBackground } from '@/components/StarsBackground';

interface NewMemorial {
  name: string;
  nickName: string;
  gender: string;
  nationality: string;
  birthDate: string;
  deathDate: string;
  nativePlace: string;
  occupation: string;
  burialPlace: string;
  epitaph: string;
  biography: string;
  description: string;
  achievements: string;
  privacyType: number; // 1公开 2仅家属 3密码访问
  accessPassword: string;
  allowAnonymousMsg: boolean;
}

const GENDER_OPTIONS = ['男', '女', '未知'];
const PRIVACY_OPTIONS = [
  { value: 1, label: '公开' },
  { value: 2, label: '仅家属' },
  { value: 3, label: '密码访问' },
];

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
      <Text className="block text-sm font-medium text-white/85 mb-2">{label}</Text>
      <Picker
        mode="multiSelector"
        range={[years, months, days]}
        value={[Math.max(0, yearIndex), Math.max(0, monthIndex), Math.max(0, dayIndex)]}
        onChange={handlePickerChange}
      >
        <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Text className={`${value ? 'text-white' : 'text-[#7e99a3]'}`}>
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
    nickName: '',
    gender: '未知',
    nationality: '',
    birthDate: '',
    deathDate: '',
    nativePlace: '',
    occupation: '',
    burialPlace: '',
    epitaph: '',
    biography: '',
    description: '',
    achievements: '',
    privacyType: 1,
    accessPassword: '',
    allowAnonymousMsg: true
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
          nickName: memorial.nick_name || memorial.nickName || '',
          gender: memorial.gender || '未知',
          nationality: memorial.nationality || '',
          birthDate: formatDate(memorial.birth_date || memorial.birthDate),
          deathDate: formatDate(memorial.death_date || memorial.deathDate),
          nativePlace: memorial.native_place || memorial.nativePlace || '',
          occupation: memorial.occupation || '',
          burialPlace: memorial.burial_place || memorial.burialPlace || '',
          epitaph: memorial.epitaph || '',
          biography: memorial.biography || '',
          description: memorial.description || '',
          achievements: memorial.achievements ? memorial.achievements.join('，') : '',
          privacyType: memorial.privacy_type ?? memorial.privacyType ?? 1,
          accessPassword: memorial.access_password || memorial.accessPassword || '',
          allowAnonymousMsg: memorial.allow_anonymous_msg ?? memorial.allowAnonymousMsg ?? true
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
        Taro.showLoading({ title: '头像上传中...', mask: true });
        try {
          const uploadRes = await uploadCrossPlatform({ filePath: tempFilePath, category: 'avatars' });

          if (uploadRes.statusCode === 200) {
            const urls = resolveUploadUrls(uploadRes.data || '');
            if (urls.length > 0) {
              setAvatarUrl(urls[0]);
              Taro.hideLoading();
              setTimeout(() => Taro.showToast({ title: '上传成功', icon: 'success' }), 80);
            } else {
              Taro.hideLoading();
              setTimeout(() => Taro.showToast({ title: '上传失败', icon: 'none' }), 80);
            }
          } else {
            Taro.hideLoading();
            setTimeout(() => Taro.showToast({ title: '上传失败', icon: 'none' }), 80);
          }
        } catch (error) {
          console.error('Failed to upload avatar:', error);
          Taro.hideLoading();
          setTimeout(() => Taro.showToast({ title: '上传失败', icon: 'none' }), 80);
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
        const tempFilePaths = res.tempFilePaths.slice(0, 9 - photos.length);
        const uploadPromises = tempFilePaths.map(filePath =>
          uploadCrossPlatform({ filePath, category: 'photos' })
        );

        Taro.showLoading({ title: '照片上传中...', mask: true });
        try {
          const results = await Promise.all(uploadPromises);
          const uploadedUrls: string[] = [];
          results.forEach(result => {
            if (result.statusCode === 200) {
              uploadedUrls.push(...resolveUploadUrls(result.data || ''));
            }
          });

          Taro.hideLoading();
          if (uploadedUrls.length > 0) {
            setPhotos(prev => [...prev, ...uploadedUrls]);
            Taro.showToast({ title: `成功上传${uploadedUrls.length}张照片`, icon: 'success' });
          } else {
            Taro.showToast({ title: '上传失败', icon: 'none' });
          }
        } catch (error) {
          console.error('Failed to upload photos:', error);
          Taro.hideLoading();
          setTimeout(() => Taro.showToast({ title: '上传失败', icon: 'none' }), 80);
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
          header: Auth.headers(),
          data: {
            name: formData.name,
            nickName: formData.nickName || null,
            gender: formData.gender,
            nationality: formData.nationality || null,
            birthDate: toISODate(formData.birthDate),
            deathDate: toISODate(formData.deathDate),
            nativePlace: formData.nativePlace || null,
            occupation: formData.occupation || null,
            burialPlace: formData.burialPlace || null,
            epitaph: formData.epitaph || null,
            biography: formData.biography || null,
            description: formData.description || null,
            achievements,
            privacyType: formData.privacyType,
            accessPassword: formData.privacyType === 3 ? (formData.accessPassword || null) : null,
            allowAnonymousMsg: formData.allowAnonymousMsg,
            avatarUrl: finalAvatarUrl
          }
        });

        if (updateRes.data?.code === 200) {
          await Network.request({ url: `/api/photos/memorial/${id}`, method: 'DELETE', header: Auth.headers() });
          if (photos.length > 0) {
            await Network.request({
              url: `/api/photos/batch/${id}`,
              method: 'POST',
              header: Auth.headers(),
              data: { urls: photos }
            });
          }
          Taro.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      } else {
        if (!Auth.isLoggedIn()) {
          Taro.showToast({ title: '请先登录', icon: 'none' });
          setTimeout(() => Taro.navigateTo({ url: '/pages/profile/index' }), 800);
          return;
        }

        const res = await Network.request({
          url: '/api/memorials',
          method: 'POST',
          header: Auth.headers(),
          data: {
            name: formData.name,
            nickName: formData.nickName || null,
            gender: formData.gender,
            nationality: formData.nationality || null,
            birthDate: toISODate(formData.birthDate),
            deathDate: toISODate(formData.deathDate),
            nativePlace: formData.nativePlace || null,
            occupation: formData.occupation || null,
            burialPlace: formData.burialPlace || null,
            epitaph: formData.epitaph || null,
            biography: formData.biography || null,
            description: formData.description || null,
            achievements,
            privacyType: formData.privacyType,
            accessPassword: formData.privacyType === 3 ? (formData.accessPassword || null) : null,
            allowAnonymousMsg: formData.allowAnonymousMsg,
            avatarUrl: finalAvatarUrl
          }
        });

        if (res.data?.code === 200) {
          if (photos.length > 0) {
            const memorialId = res.data.data.id;
            await Network.request({
              url: `/api/photos/batch/${memorialId}`,
              method: 'POST',
              header: Auth.headers(),
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
    <StarsBackground dim="light">
      {/* 头部 */}
      <View className="px-4 pt-14 pb-5" style={{ borderBottom: '1px solid rgba(232,192,122,0.25)' }}>
        <Text className="block text-2xl font-bold text-white">
          {isEditMode ? '编辑' : '添加故人'}
        </Text>
      </View>

      {/* 加载状态 */}
      {loading && (
        <View className="flex flex-col items-center justify-center py-20">
          <View className="w-12 h-12 border-4 border-[#e8c07a]/30 border-t-[#e8c07a] rounded-full animate-spin" />
          <Text className="block text-sm text-white/60 mt-4">加载中...</Text>
        </View>
      )}

      {/* 表单 */}
      {!loading && (
        <View className="px-4 py-6">
          <View className="rounded-2xl p-6"
            style={{ backgroundColor: 'rgba(18,42,53,0.82)', border: '1px solid rgba(232,192,122,0.3)' }}
          >
            {/* 头像预览 */}
            <View className="flex flex-col items-center mb-6">
              <View className="w-40 h-40 rounded-2xl flex items-center justify-center overflow-hidden mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(232,192,122,0.4)' }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} className="w-full h-full" mode="aspectFill" onClick={handlePreviewAvatar} />
                ) : (
                  <View className="flex flex-col items-center gap-2">
                    <User color="#8ea9b4" size={64} />
                    <Text className="text-sm text-white/50">暂无头像</Text>
                  </View>
                )}
              </View>
              {avatarUrl ? (
                <Text className="text-base font-semibold text-[#e8c07a] underline cursor-pointer" onClick={handleUploadAvatar}>
                  {isUploading ? '上传中...' : '更换头像'}
                </Text>
              ) : (
                <Text className="text-base font-semibold text-[#e8c07a] underline cursor-pointer" onClick={generateAvatar}>
                  {isGenerating ? '生成中...' : 'AI 生成头像'}
                </Text>
              )}
              <Text className="block text-xs text-white/40 mt-2 text-center">
                {avatarUrl ? '点击更换头像' : '点击生成或上传头像'}
              </Text>
            </View>

            {/* 照片上传 */}
            <View className="mb-6">
              <Text className="block text-sm font-medium text-white/85 mb-2">生活照片（可选，最多9张）</Text>
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
                  <View className="aspect-square rounded-lg flex flex-col items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '2px dashed rgba(232,192,122,0.4)' }}
                    onClick={handleUploadPhotos}
                  >
                    <Text className="text-3xl text-[#e8c07a] font-light">+</Text>
                    <Text className="text-xs text-white/50 mt-1">添加照片</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 表单字段 */}
            <View className="flex flex-col gap-4">
              {/* 姓名 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">姓名 *</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    placeholder="请输入姓名"
                    placeholderStyle="color:#7e99a3"
                    value={formData.name}
                    onInput={(e) => handleInputChange('name', e.detail.value)}
                  />
                </View>
              </View>

              {/* 性别 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">性别</Text>
                <View className="flex gap-3">
                  {GENDER_OPTIONS.map((option) => (
                    <View
                      key={option}
                      className="flex-1 py-3 px-4 rounded-xl text-center cursor-pointer transition-colors"
                      style={{ backgroundColor: formData.gender === option ? '#e8c07a' : 'rgba(255,255,255,0.08)' }}
                      onClick={() => handleInputChange('gender', option)}
                    >
                      <Text className={formData.gender === option ? 'text-[#2e1f0f] font-semibold' : 'text-white/80'}>{option}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 别名 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">别名（可选）</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    placeholder="请输入别名/字号"
                    placeholderStyle="color:#7e99a3"
                    value={formData.nickName}
                    onInput={(e) => handleInputChange('nickName', e.detail.value)}
                  />
                </View>
              </View>

              {/* 民族 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">民族（可选）</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    placeholder="如：汉族"
                    placeholderStyle="color:#7e99a3"
                    value={formData.nationality}
                    onInput={(e) => handleInputChange('nationality', e.detail.value)}
                  />
                </View>
              </View>

              {/* 籍贯 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">籍贯（可选）</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    placeholder="如：浙江杭州"
                    placeholderStyle="color:#7e99a3"
                    value={formData.nativePlace}
                    onInput={(e) => handleInputChange('nativePlace', e.detail.value)}
                  />
                </View>
              </View>

              {/* 生前职业 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">生前职业（可选）</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    placeholder="如：教师"
                    placeholderStyle="color:#7e99a3"
                    value={formData.occupation}
                    onInput={(e) => handleInputChange('occupation', e.detail.value)}
                  />
                </View>
              </View>

              {/* 安葬地点 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">安葬地点（可选）</Text>
                <View className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Input
                    className="w-full bg-transparent"
                    style={{ color: '#fff' }}
                    placeholder="请输入安葬地点"
                    placeholderStyle="color:#7e99a3"
                    value={formData.burialPlace}
                    onInput={(e) => handleInputChange('burialPlace', e.detail.value)}
                  />
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
                  <Text className="block text-sm font-medium text-white/85">简介</Text>
                  <Text className="text-xs font-semibold text-[#e8c07a] underline cursor-pointer" onClick={() => handlePolish('description')}>AI润色</Text>
                </View>
                <View className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', color: '#fff' }}
                    placeholder="请输入简介..."
                    placeholderStyle="color:#7e99a3"
                    value={formData.description}
                    onInput={(e) => handleInputChange('description', e.detail.value)}
                    maxlength={600}
                  />
                  <Text className="block text-xs text-[#e8c07a]/50 mt-1 text-right">{formData.description.length}/600</Text>
                </View>
              </View>

              {/* 主要成就 */}
              <View>
                <View className="flex justify-between items-center mb-2">
                  <Text className="block text-sm font-medium text-white/85">主要成就</Text>
                  <Text className="text-xs font-semibold text-[#e8c07a] underline cursor-pointer" onClick={() => handlePolish('achievements')}>AI润色</Text>
                </View>
                <View className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', color: '#fff' }}
                    placeholder="请输入主要成就，用逗号分隔..."
                    placeholderStyle="color:#7e99a3"
                    value={formData.achievements}
                    onInput={(e) => handleInputChange('achievements', e.detail.value)}
                    maxlength={1000}
                  />
                  <Text className="block text-xs text-[#e8c07a]/50 mt-1 text-right">{formData.achievements.length}/1000</Text>
                </View>
              </View>

              {/* 墓志铭 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">墓志铭（可选，上限200字）</Text>
                <View className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Textarea
                    style={{ width: '100%', minHeight: '70px', backgroundColor: 'transparent', color: '#fff' }}
                    placeholder="写下一句心意，纪念逝者..."
                    placeholderStyle="color:#7e99a3"
                    value={formData.epitaph}
                    onInput={(e) => handleInputChange('epitaph', e.detail.value)}
                    maxlength={200}
                  />
                  <Text className="block text-xs text-[#e8c07a]/50 mt-1 text-right">{formData.epitaph.length}/200</Text>
                </View>
              </View>

              {/* 追忆文稿 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">追忆文稿（可选，生平故事）</Text>
                <View className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Textarea
                    style={{ width: '100%', minHeight: '90px', backgroundColor: 'transparent', color: '#fff' }}
                    placeholder="记录逝者的生平故事、手稿、遗物资料…"
                    placeholderStyle="color:#7e99a3"
                    value={formData.biography}
                    onInput={(e) => handleInputChange('biography', e.detail.value)}
                    maxlength={5000}
                  />
                  <Text className="block text-xs text-[#e8c07a]/50 mt-1 text-right">{formData.biography.length}/5000</Text>
                </View>
              </View>

              {/* 隐私设置 */}
              <View>
                <Text className="block text-sm font-medium text-white/85 mb-2">隐私模式</Text>
                <View className="flex gap-3">
                  {PRIVACY_OPTIONS.map((option) => (
                    <View
                      key={option.value}
                      className="flex-1 py-3 px-4 rounded-xl text-center cursor-pointer"
                      style={{ backgroundColor: formData.privacyType === option.value ? '#e8c07a' : 'rgba(255,255,255,0.08)' }}
                      onClick={() => setFormData((prev) => ({ ...prev, privacyType: option.value }))}
                    >
                      <Text className={formData.privacyType === option.value ? 'text-[#2e1f0f] font-semibold' : 'text-white/80'}>{option.label}</Text>
                    </View>
                  ))}
                </View>
                {formData.privacyType === 3 && (
                  <View className="rounded-xl px-4 py-3 mt-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <Input
                      className="w-full bg-transparent"
                      style={{ color: '#fff' }}
                      placeholder="设置6位访问密码"
                      placeholderStyle="color:#7e99a3"
                      value={formData.accessPassword}
                      onInput={(e) => setFormData((prev) => ({ ...prev, accessPassword: e.detail.value }))}
                      maxlength={6}
                    />
                  </View>
                )}
              </View>

              {/* 匿名留言开关 */}
              <View className="flex items-center justify-between">
                <Text className="block text-sm font-medium text-white/85">允许匿名访客留言</Text>
                <Switch
                  checked={formData.allowAnonymousMsg}
                  onChange={(e) => setFormData((prev) => ({ ...prev, allowAnonymousMsg: e.detail.value }))}
                  color="#e8c07a"
                />
              </View>

              {/* 提交按钮 */}
              <Button className="rounded-full py-3 shadow-md mt-2"
                style={{ backgroundColor: '#e8c07a', color: '#2e1f0f' }}
                onClick={handleSubmit} disabled={isSaving}
              >
                <Text>{isSaving ? '保存中...' : (isEditMode ? '保存修改' : '保存故人')}</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </StarsBackground>
  );
};

export default FormPage;
