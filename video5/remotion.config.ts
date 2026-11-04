import {Config} from '@remotion/cli/config';

import path from 'path';

// 云端没有显卡：用 Playwright 预装的 headless shell，经 scripts/chrome-sw.sh 走纯 CPU 光栅化（全片是 Canvas/SVG，没有 WebGL）。
// 在 video5 目录里运行。本地渲染时把 REMOTION_BROWSER 指向本机的 Chrome 即可。
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? path.resolve('scripts/chrome-sw.sh'));
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setCodec('h264');
Config.setCrf(19);
Config.setX264Preset('slow');
Config.setPixelFormat('yuv420p');
// 截图是 sRGB；转成 BT.709 有限范围并写好色彩标记，播放器和 B 站转码都按标准 HD 解读
Config.setColorSpace('bt709');
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('swangle');
