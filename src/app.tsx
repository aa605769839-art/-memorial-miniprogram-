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
  const prevErr = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    report('app_global_error', `${message} @${source}:${lineno}:${colno} :: ${error?.stack || ''}`);
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