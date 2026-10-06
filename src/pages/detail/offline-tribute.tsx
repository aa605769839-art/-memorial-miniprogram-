import { View, Text, Image, Button, Textarea, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Network } from '@/network';
import { Auth } from '@/auth';
import { uploadCrossPlatform, resolveUploadUrls } from '@/utils/upload';
import { trackEvent } from '@/utils/track';
import {
  ImagePlus,
  Camera,
  X,
  Flower2,
  CalendarDays,
  Lock
} from 'lucide-react-taro';

interface OfflinePhoto {
  id: string;
  memorialId: string;
  userId: string;
  nick?: string | null;
  photoUrl: string;
  worshipDate?: string | null;
  message?: string | null;
  createdAt?: string | null;
}

interface Props {
  memorialId: string;
  isCreator: boolean;
  allowVisitorOffline: boolean;
  onVisitorChange: (v: boolean) => void;
}

const todayStr = new Date().toISOString().slice(0, 10);

export default function OfflineTribute({ memorialId, isCreator, allowVisitorOffline, onVisitorChange }: Props) {
  const [photos, setPhotos] = useState<OfflinePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [worshipDate, setWorshipDate] = useState(todayStr);
  const [message, setMessage] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const isAdmin = Auth.isAdmin();
  const userId = Auth.getUser()?.id || '';
  const canUpload = isCreator || isAdmin || allowVisitorOffline;
  const canManage = isCreator || isAdmin;

  const fetchPhotos = async () => {
    try {
      const res: any = await Network.request({ url: `/api/offline-photos/memorial/${memorialId}`, method: 'GET' });
      const body = res?.data || res;
      if (body?.code === 200) {
        const arr = Array.isArray(body.data) ? body.data : [];
        setPhotos(arr as OfflinePhoto[]);
        setPreviewUrls(arr.map((p: OfflinePhoto) => p.photoUrl));
      }
    } catch {
      /* 忽略 */
    }
  };

  useDidShow(() => {
    fetchPhotos();
  });

  // 选择照片并上传
  const chooseAndUpload = async () => {
    trackEvent('offline_upload_click', { memorialId });
    if (!Auth.isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (!canUpload) {
      Taro.showToast({ title: '当前未开放访客上传，仅家属可上传', icon: 'none' });
      return;
    }
    const remaining = 200 - photos.length;
    if (remaining <= 0) {
      Taro.showToast({ title: '该墓碑照片已达上限（200张）', icon: 'none' });
      return;
    }
    const count = Math.min(9, remaining);
    try {
      const res = await Taro.chooseImage({ count, sizeType: ['compressed'], sourceType: ['album', 'camera'] });
      const paths: string[] = res.tempFilePaths || [];
      if (paths.length === 0) return;
      setSubmitting(true);
      const urls: string[] = [];
      for (const p of paths) {
        try {
          const up = await uploadCrossPlatform({ filePath: p, category: 'offline' });
          const raw = typeof up.data === 'string' ? up.data : JSON.stringify((up as any).data || {});
          const u = resolveUploadUrls(raw);
          if (u[0]) urls.push(u[0]);
        } catch {
          /* 单张失败继续 */
        }
      }
      if (urls.length === 0) {
        Taro.showToast({ title: '照片上传失败，请重试', icon: 'none' });
        return;
      }
      const user = Auth.getUser();
      const userProfile: any = Taro.getStorageSync('userProfile');
      const r: any = await Network.request({
        url: '/api/offline-photos',
        method: 'POST',
        header: { ...Auth.headers() },
        data: {
          memorialId,
          nick: user?.nickname || userProfile?.name || '',
          worshipDate,
          message,
          urls,
        },
      });
      const rb = r?.data || r;
      if (rb?.code === 200) {
        Taro.showToast({ title: '上传成功', icon: 'success' });
        setMessage('');
        trackEvent('offline_upload_success', { memorialId, count: urls.length });
        fetchPhotos();
      } else {
        Taro.showToast({ title: rb?.msg || '上传失败', icon: 'none' });
      }
    } catch (e: any) {
      Taro.showToast({ title: e?.data?.msg || '网络异常，请稍后重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const openPreview = (index: number) => {
    trackEvent('offline_photo_preview', { memorialId });
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      Taro.previewImage({ urls: previewUrls, current: previewUrls[index] });
    } else {
      Taro.previewImage({ urls: previewUrls, current: previewUrls[index] }).catch(() => {
        /* H5 降级：忽略 */
      });
    }
  };

  const removePhoto = async (photo: OfflinePhoto, e: any) => {
    e.stopPropagation?.();
    if (photo.userId !== userId && !isAdmin) return;
    try {
      const res: any = await Network.request({
        url: `/api/offline-photos/${photo.id}`,
        method: 'DELETE',
        header: { ...Auth.headers() },
      });
      const body = res?.data || res;
      if (body?.code === 200) {
        Taro.showToast({ title: '已删除', icon: 'none' });
        fetchPhotos();
      } else {
        Taro.showToast({ title: body?.msg || '删除失败', icon: 'none' });
      }
    } catch {
      Taro.showToast({ title: '删除失败', icon: 'none' });
    }
  };

  const toggleVisitor = async () => {
    if (!canManage) return;
    try {
      const res: any = await Network.request({
        url: '/api/offline-photos/setting/visitor-upload',
        method: 'PUT',
        header: { ...Auth.headers() },
        data: { memorialId, allow: !allowVisitorOffline },
      });
      const body = res?.data || res;
      if (body?.code === 200) {
        onVisitorChange(!!body.data?.allowVisitorOffline);
        Taro.showToast({ title: body.data?.allowVisitorOffline ? '已开放访客上传' : '已关闭访客上传', icon: 'none' });
      } else {
        Taro.showToast({ title: body?.msg || '设置失败', icon: 'none' });
      }
    } catch {
      Taro.showToast({ title: '设置失败', icon: 'none' });
    }
  };

  return (
    <View className="mt-5 mx-4 rounded-3xl px-6 py-5 mb-4"
      style={{ backgroundColor: 'rgba(20,42,55,0.5)', border: '1px solid rgba(232,192,122,0.35)', backdropFilter: 'blur(14px)' }}
    >
      {/* 头部 */}
      <View className="flex items-center justify-between mb-4">
        <View className="flex items-center gap-2">
          <Camera color="#e8c07a" size={20} />
          <Text className="block text-lg font-semibold text-white">线下悼念</Text>
        </View>
        <View className="flex items-center gap-2">
          {canManage && (
            <View
              className="px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: 'rgba(127,195,206,0.18)', border: '1px solid rgba(127,195,206,0.35)' }}
              onClick={toggleVisitor}
            >
              {allowVisitorOffline ? <ImagePlus color="#7fc3ce" size={13} /> : <Lock color="#7fc3ce" size={13} />}
              <Text className="text-[11px] text-[#7fc3ce]">{allowVisitorOffline ? '访客可传' : '仅家属可传'}</Text>
            </View>
          )}
          {!canUpload && (
            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,192,122,0.12)' }}>
              <Text className="text-[11px] text-[#e8c07a]/70">仅家属可上传</Text>
            </View>
          )}
        </View>
      </View>

      <Text className="block text-xs" style={{ color: 'rgba(200,212,214,0.65)' }}>
        上传 JPG/PNG/WebP 照片，单次最多 9 张，墓碑上限 200 张；每批上传视为一次悼念
      </Text>

      {/* 上传表单 */}
      {canUpload ? (
        <View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <View className="flex flex-row items-center gap-3 mb-3">
            <View className="flex items-center gap-1.5">
              <CalendarDays color="#7fc3ce" size={15} />
              <Text className="text-xs text-white/70">祭扫日期</Text>
            </View>
            <Picker mode="date" value={worshipDate} onChange={(e) => setWorshipDate(e.detail.value)}>
              <View className="rounded-full px-3 py-1 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(127,195,206,0.15)', border: '1px solid rgba(127,195,206,0.3)' }}
              >
                <Text className="text-xs text-[#7fc3ce]">{worshipDate}</Text>
              </View>
            </Picker>
          </View>
          <Textarea
            style={{ width: '100%', minHeight: '60px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', color: '#fff' }}
            placeholder="写下悼念寄语（可选，≤150字）"
            placeholderStyle="color:#8ea9b4"
            value={message}
            onInput={(e) => setMessage(e.detail.value.slice(0, 150))}
            maxlength={150}
          />
          <View className="flex items-center justify-between mt-3">
            <Text className="text-xs text-[#e8c07a]/60">{message.length}/150</Text>
            <Button
              className="!rounded-full !px-6 !py-1.5 !border-0 flex items-center gap-1.5"
              style={{ backgroundColor: '#e8c07a', color: '#2e1f0f' }}
              loading={submitting}
              disabled={submitting}
              onClick={chooseAndUpload}
            >
              <ImagePlus size={15} color="#2e1f0f" />
              <Text>{submitting ? '上传中...' : '选择照片上传'}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="mt-4 rounded-2xl p-3 flex items-center justify-center" style={{ backgroundColor: 'rgba(232,192,122,0.08)' }}>
          <Text className="text-xs text-[#e8c07a]/80">当前未开放访客上传，仅家属可上传线下悼念照片</Text>
        </View>
      )}

      {/* 照片瀑布流 */}
      <View className="mt-4">
        {photos.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-10">
            <Flower2 color="#e8c07a" size={40} strokeWidth={1.5} />
            <Text className="block text-sm text-white/60 mt-3">还没有线下悼念照片</Text>
            {canUpload && (
              <Text className="block text-xs text-white/40 mt-1">点击上方按钮，记录您的祭扫时刻</Text>
            )}
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-2.5">
            {photos.map((p, idx) => {
              const canDel = p.userId === userId || isAdmin;
              return (
                <View key={p.id} className="relative overflow-hidden rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', aspectRatio: '1' }}
                  onClick={() => openPreview(idx)}
                >
                  <Image src={p.photoUrl} className="w-full h-full" mode="aspectFill" />
                  {p.worshipDate && (
                    <View className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <Text className="text-[10px] text-white/85">{p.worshipDate.slice(0, 10)}</Text>
                    </View>
                  )}
                  {canDel && (
                    <View
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                      onClick={(e) => removePhoto(p, e)}
                    >
                      <X size={13} color="#fff" />
                    </View>
                  )}
                  {p.message && (
                    <View className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                      <Text className="block text-[10px] text-white/80" numberOfLines={1}>{p.message}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}