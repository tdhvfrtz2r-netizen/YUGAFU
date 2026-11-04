import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Background, DepthGauge, Finish, useFonts} from './kit/Stage';
import {Hook} from './scenes/Hook';
import {Title} from './scenes/Title';
import {L1} from './scenes/L1';
import {L2} from './scenes/L2';
import {L3a} from './scenes/L3a';
import {L3b} from './scenes/L3b';
import {L3c} from './scenes/L3c';
import {L4} from './scenes/L4';
import {L6} from './scenes/L6';
import {L7} from './scenes/L7';
import {at, len, span} from './timeline';

export const Main: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#0A0D13'}}>
      <Background />
      <Sequence from={at('01')} durationInFrames={span('01', '04')} layout="none">
        <Hook />
      </Sequence>
      <Sequence from={at('05')} durationInFrames={len('05')} layout="none">
        <Title dur={len('05')} />
      </Sequence>
      <Sequence from={at('06')} durationInFrames={span('06', '08')} layout="none">
        <L1 />
      </Sequence>
      <Sequence from={at('09')} durationInFrames={span('09', '10')} layout="none">
        <L2 />
      </Sequence>
      <Sequence from={at('11')} durationInFrames={span('11', '12')} layout="none">
        <L3a />
      </Sequence>
      <Sequence from={at('13')} durationInFrames={span('13', '14')} layout="none">
        <L3b />
      </Sequence>
      <Sequence from={at('15')} durationInFrames={span('15', '16')} layout="none">
        <L3c />
      </Sequence>
      <Sequence from={at('17')} durationInFrames={span('17', '18')} layout="none">
        <L4 />
      </Sequence>
      <Sequence from={at('19')} durationInFrames={len('19')} layout="none">
        <L6 />
      </Sequence>
      <Sequence from={at('20')} durationInFrames={span('20', '23')} layout="none">
        <L7 />
      </Sequence>
      <DepthGauge from={at('06')} until={at('23') - 30} />
      <Finish />
    </AbsoluteFill>
  );
};
