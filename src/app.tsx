import { PropsWithChildren } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import '@/app.css';
import { Preset } from './presets';

// 全局运行时错误上报（用于定位白屏等组件边界无法捕获的错误）
if (typeof window !== 'undefined') {
  const report = (tag: string, ev: string) => {
    try {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        Network.request({
          url: '/api/track',
          method: 'POST',
          data: { event: tag, extra: `{ from: 'app-global', msg: ${ev} }` },
        }).catch(() => {
          /* ignore */
        });
      }
    } catch (e) {
      /* ignore */
    }
  };
  // 白屏自愈：捕获到脚本加载/求值失败（跨域 Script error）且页面空白时，
  // 自动 reload 拉取最新资源（index.html no-store），清除旧缓存错配导致的加载失败。
  const USESSION_KEY = 'mem_script_guard';
  const tryRecover = () => {
    try {
      const now = Date.now();
      const last = Number(sessionStorage.getItem(USESSION_KEY)) || 0;
      if (now - last < 8000) {
        return; // 避免死循环
      }
      sessionStorage.setItem(USESSION_KEY, String(now));
      // 等浏览器完成渲染再判断是否真的空白
      setTimeout(() => {
        const len = document.body ? document.body.innerText.trim().length : 0;
        if (len < 8) {
          window.location.reload();
        }
      }, 400);
    } catch (e) {
      /* ignore */
    }
  };
  const prevErr = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = String(message || '');
    if (msg.indexOf('Script error') >= 0) {
      tryRecover();
    }
    report('app_global_error', `${msg} @${source}:${lineno}:${colno} :: ${error?.stack || ''}`);
    if (typeof prevErr === 'function') {
      prevErr.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
  window.addEventListener(
    'unhandledrejection',
    (e) => {
      report('app_unhandledrejection', String(e.reason && e.reason.stack ? e.reason.stack : e.reason));
    },
    false
  );
}

const App = ({ children }: PropsWithChildren) => {
  return <Preset>{children}</Preset>;
};

export default App;