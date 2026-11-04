#!/bin/sh
# 云端容器没有显卡：让 Chromium 走纯 CPU 光栅化（Skia），不走 SwiftShader 模拟 GPU。
# 实测同一段 180 帧快约 2.4 倍，画面一致（PSNR 38–50 dB，差异肉眼不可见），
# 还避开了 SwiftShader 偶发的"横条重复"伪影（锁的虚线在别处多出一段）。
exec /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell "$@" --disable-gpu --disable-gpu-compositing
