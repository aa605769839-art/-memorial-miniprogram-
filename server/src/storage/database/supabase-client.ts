import { createClient, SupabaseClient } from '@supabase/supabase-js';

let envLoaded = false;

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

/**
 * 加载环境变量。
 *
 * 为解除对 Coze 平台的依赖，本函数只从进程环境或 .env 文件读取配置，
 * 不再调用任何 Coze 本地平台接口（coze_workload_identity）。
 *
 * 优先使用通用变量名：SUPABASE_URL / SUPABASE_ANON_KEY；
 * 为兼容历史部署，也接受 COZE_SUPABASE_URL / COZE_SUPABASE_ANON_KEY。
 */
function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  const hasSupabaseVars =
    (process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL) &&
    (process.env.SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY);

  if (!hasSupabaseVars) {
    try {
      require('dotenv').config();
    } catch {
      // dotenv not available
    }
  }

  envLoaded = true;
}

function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();

  const url = process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('SUPABASE_URL is not set (or COZE_SUPABASE_URL for legacy)');
  }
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY is not set (or COZE_SUPABASE_ANON_KEY for legacy)');
  }

  return { url, anonKey };
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, anonKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { loadEnv, getSupabaseCredentials, getSupabaseClient };