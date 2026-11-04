import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Background, DepthGauge, Finish, useFonts} from './kit/Stage';
import {SeqBase} from './kit/Text';
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
        <SeqBase.Provider value={at('01')}>
          <Hook />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('05')} durationInFrames={len('05')} layout="none">
        <SeqBase.Provider value={at('05')}>
          <Title dur={len('05')} />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('06')} durationInFrames={span('06', '08')} layout="none">
        <SeqBase.Provider value={at('06')}>
          <L1 />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('09')} durationInFrames={span('09', '10')} layout="none">
        <SeqBase.Provider value={at('09')}>
          <L2 />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('11')} durationInFrames={span('11', '12')} layout="none">
        <SeqBase.Provider value={at('11')}>
          <L3a />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('13')} durationInFrames={span('13', '14')} layout="none">
        <SeqBase.Provider value={at('13')}>
          <L3b />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('15')} durationInFrames={span('15', '16')} layout="none">
        <SeqBase.Provider value={at('15')}>
          <L3c />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('17')} durationInFrames={span('17', '18')} layout="none">
        <SeqBase.Provider value={at('17')}>
          <L4 />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('19')} durationInFrames={len('19')} layout="none">
        <SeqBase.Provider value={at('19')}>
          <L6 />
        </SeqBase.Provider>
      </Sequence>
      <Sequence from={at('20')} durationInFrames={span('20', '23')} layout="none">
        <SeqBase.Provider value={at('20')}>
          <L7 />
        </SeqBase.Provider>
      </Sequence>
      <DepthGauge from={at('06')} until={at('23') - 30} />
      <Finish />
    </AbsoluteFill>
  );
};
