import {Config} from '@remotion/cli/config';

// 云端没有显卡：用 Playwright 预装的 headless shell，纯 CPU 渲染（全片是 Canvas/SVG，没有 WebGL）。
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ??
    '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setCodec('h264');
Config.setCrf(17);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('swangle');
