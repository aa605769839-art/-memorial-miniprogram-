#!/usr/bin/env node
/**
 * 修复 H5 构建产物 (dist-web/css/*.css) 中 Tailwind v4 在 weapp-tailwindcss
 * rem2rpx 处理下丢失的样式特性：
 *  1) 主题变量从 :host 提升到 :root（否则 light DOM 下变量不生效，渐变/颜色失效）
 *  2) rounded-full 的非法值 3.40282e30.4rpx -> 9999px（否则 border-radius 解析失败）
 *  3) 补回缺失的 @property --tw-* 注册（否则 --tw-gradient-* 等自定义属性无法级联）
 *
 * 仅作用于 H5 构建产物；不影响小程序产物。
 */
const fs = require('fs');
const path = require('path');

// Tailwind v4 默认的 @property --tw-* 注册块（从 dev 正常产物提取）
const PROPERTY_BLOCK = `
@property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-translate-y { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-translate-z { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-rotate-x { syntax: "*"; inherits: false; }
@property --tw-rotate-y { syntax: "*"; inherits: false; }
@property --tw-rotate-z { syntax: "*"; inherits: false; }
@property --tw-skew-x { syntax: "*"; inherits: false; }
@property --tw-skew-y { syntax: "*"; inherits: false; }
@property --tw-space-y-reverse { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid; }
@property --tw-gradient-position { syntax: "*"; inherits: false; }
@property --tw-gradient-from { syntax: "<color>"; inherits: false; initial-value: #0000; }
@property --tw-gradient-via { syntax: "<color>"; inherits: false; initial-value: #0000; }
@property --tw-gradient-to { syntax: "<color>"; inherits: false; initial-value: #0000; }
@property --tw-gradient-stops { syntax: "*"; inherits: false; }
@property --tw-gradient-via-stops { syntax: "*"; inherits: false; }
@property --tw-gradient-from-position { syntax: "<length-percentage>"; inherits: false; initial-value: 0%; }
@property --tw-gradient-via-position { syntax: "<length-percentage>"; inherits: false; initial-value: 50%; }
@property --tw-gradient-to-position { syntax: "<length-percentage>"; inherits: false; initial-value: 100%; }
@property --tw-leading { syntax: "*"; inherits: false; }
@property --tw-font-weight { syntax: "*"; inherits: false; }
@property --tw-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-shadow-color { syntax: "*"; inherits: false; }
@property --tw-shadow-alpha { syntax: "<percentage>"; inherits: false; initial-value: 100%; }
@property --tw-inset-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-inset-shadow-color { syntax: "*"; inherits: false; }
@property --tw-inset-shadow-alpha { syntax: "<percentage>"; inherits: false; initial-value: 100%; }
@property --tw-ring-color { syntax: "*"; inherits: false; }
@property --tw-ring-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-inset-ring-color { syntax: "*"; inherits: false; }
@property --tw-inset-ring-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-ring-inset { syntax: "*"; inherits: false; }
@property --tw-ring-offset-width { syntax: "<length>"; inherits: false; initial-value: 0rem; }
@property --tw-ring-offset-color { syntax: "*"; inherits: false; initial-value: #fff; }
@property --tw-ring-offset-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-backdrop-blur { syntax: "*"; inherits: false; }
@property --tw-backdrop-brightness { syntax: "*"; inherits: false; }
@property --tw-backdrop-contrast { syntax: "*"; inherits: false; }
@property --tw-backdrop-grayscale { syntax: "*"; inherits: false; }
@property --tw-backdrop-hue-rotate { syntax: "*"; inherits: false; }
@property --tw-backdrop-invert { syntax: "*"; inherits: false; }
@property --tw-backdrop-opacity { syntax: "*"; inherits: false; }
@property --tw-backdrop-saturate { syntax: "*"; inherits: false; }
@property --tw-backdrop-sepia { syntax: "*"; inherits: false; }
`;

const cssDir = path.resolve(__dirname, '../dist-web/css');

/**
 * 将 CSS 中 H5 不支持的 rpx 单位转为 rem。
 * weapp-tailwindcss 的 rem2rpx 会把整个产物转成 rpx，但 H5 浏览器不识别 rpx，
 * 导致 spacing/padding/margin/尺寸全部失效。此处按 1rem = 32rpx（Taro 设计稿 750
 * 下 1/10 逻辑换算的常见基准）转回 rem，与原 Tailwind rem 产物像素一致。
 */
function rpxToRem(css) {
  // 数值型 rpx：192rpx/8rpx/0.8rpx -> x/32 rem
  return css.replace(/(-?[\d.]+)rpx/g, (_m, num) => {
    const remVal = parseFloat(num) / 32;
    const rounded = Math.round(remVal * 10000) / 10000;
    return `${rounded}rem`;
  });
}

function fixCss(file) {
  let css = fs.readFileSync(file, 'utf8');

  // 0) 先修复 rounded-full 的极值非法值（含 rem2rpx 产生的 3.40282e30.4rpx / 3.40282e30rpx）
  css = css.replace(/3\.40282e30(?:\.4)?rpx|\b3\.40282e30(?:\.4)?\b/g, '9999px');

  // 1) rpx 单位转 rem（H5 浏览器不识别 rpx）——必须在数值型替换前完成
  css = rpxToRem(css);

  // 2) 主题变量 :host -> :root,:host
  css = css.replace(/:host\{/g, ':root,:host{');

  // 3) 补 @property 注册（若缺失）
  if (!css.includes('@property --tw-gradient-stops')) {
    css = PROPERTY_BLOCK + '\n' + css;
  }

  fs.writeFileSync(file, css);
  console.log(`[fix-h5-css] patched: ${path.basename(file)}`);
}

if (!fs.existsSync(cssDir)) {
  console.log('[fix-h5-css] dist-web/css not found, skip');
  process.exit(0);
}

fs.readdirSync(cssDir)
  .filter((f) => f.endsWith('.css'))
  .forEach((f) => fixCss(path.join(cssDir, f)));

console.log('[fix-h5-css] done');