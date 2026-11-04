import React from 'react';
import {Composition} from 'remotion';
import '@fontsource/noto-serif-sc/600.css';
import '@fontsource/noto-serif-sc/900.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import {Main} from './Main';
import {FPS, H, W} from './theme';
import {TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
