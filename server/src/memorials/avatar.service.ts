import { Injectable } from '@nestjs/common';
import { ImageGenerationClient, Config } from 'coze-coding-dev-sdk';

/**
 * AI 头像兜底服务。
 *
 * 当故人缺少有效头像（或头像为历史脏数据/占位）时，根据姓名、性别、年龄、职业
 * 生成一张符合人物气质的纪念肖像，并返回对象存储（COS）可访问 URL。
 */
@Injectable()
export class AvatarService {
  /** 计算年龄（基于出生/死亡或当前年份） */
  private computeAge(birthDate?: string | null, deathDate?: string | null): number | null {
    if (!birthDate) return null;
    const birthYear = new Date(birthDate).getFullYear();
    if (isNaN(birthYear)) return null;
    const endYear = deathDate ? new Date(deathDate).getFullYear() : new Date().getFullYear();
    if (isNaN(endYear)) return null;
    const age = endYear - birthYear;
    return age > 0 && age < 120 ? age : null;
  }

  /** 判断头像是否为有效可用的 URL */
  static isValidAvatar(avatarUrl?: string | null): boolean {
    if (!avatarUrl) return false;
    const t = avatarUrl.trim();
    if (!/^https?:\/\//i.test(t)) return false;
    // 排除历史脏数据（如接口返回的错误 JSON / 503 提示）
    if (t.startsWith('{') || t.startsWith('"')) return false;
    if (t.includes('未配置') || t.includes('IMAGE_API') || t.startsWith('code:') || t.includes('"code"')) return false;
    return true;
  }

  /** 构造生成提示词 */
  buildPrompt(opts: {
    name?: string | null;
    gender?: string | null;
    birthDate?: string | null;
    deathDate?: string | null;
    description?: string | null;
    achievements?: string[] | string | null;
  }): string {
    const gender = opts.gender === '男' ? 'male' : opts.gender === '女' ? 'female' : 'person';
    const age = this.computeAge(opts.birthDate, opts.deathDate);
    const ageHint = age != null ? `${age}岁` : '中年';

    const job = Array.isArray(opts.achievements) && opts.achievements.length
      ? opts.achievements.join('、')
      : opts.achievements && !Array.isArray(opts.achievements)
        ? String(opts.achievements)
        : '';

    const desc = (opts.description || '').replace(/[#*_`~\[\](){}|\\]/g, '').slice(0, 20);

    const note = `${job ? `职业/身份：${job}。` : ''}${desc ? `性格特质：${desc}。` : ''}`;

    return `一张适合纪念应用的${gender === 'male' ? '男性' : gender === 'female' ? '女性' : '人物'}生前肖像画，${note}约${ageHint}，慈祥温和的面容，眼神温润有神，嘴角带一丝平和的笑意，庄重而不失亲切，柔和的暖色调背景，细腻油画质感，半身构图，高清晰度，肃穆温情的纪念氛围，无文字无水印。`;
  }

  /** 生成头像，成功返回 COS 图片 URL，失败返回 null */
  async generate(opts: Parameters<AvatarService['buildPrompt']>[0]): Promise<string | null> {
    try {
      const prompt = this.buildPrompt(opts);
      const config = new Config();
      const client = new ImageGenerationClient(config);
      const response = await client.generate({
        prompt,
        size: '2048x2048',
        watermark: false,
      });
      const helper = client.getResponseHelper(response);
      const url = helper.imageUrls?.[0];
      return helper.success && url ? url : null;
    } catch (error) {
      console.error('AvatarService.generate 失败:', error);
      return null;
    }
  }
}