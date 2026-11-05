import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Background, DepthGauge, Finish, useFonts} from './kit/Stage';
import {SeqBase} from './kit/Text';
import {Define} from './scenes/Define';
import {Flip} from './scenes/Flip';
import {L1} from './scenes/L1';
import {DaolangScene, ScaleScene} from './scenes/L2';
import {LockIntroScene, MoneyScene} from './scenes/L3a';
import {KnowScene, TimeScene} from './scenes/L3b';
import {L3c} from './scenes/L3c';
import {L4} from './scenes/L4';
import {L6} from './scenes/L6';
import {L7} from './scenes/L7';
import {Quiz} from './scenes/Quiz';
import {Relabel} from './scenes/Relabel';
import {Scarcity} from './scenes/Scarcity';
import {Sorter} from './scenes/Sorter';
import {Tickets} from './scenes/Tickets';
import {Title} from './scenes/Title';
import {at, len, ShotId, span} from './timeline';

/** 一个场景占从 from 到 to（含）这几个镜头；场景内部的帧号从 0 开始 */
const Shot: React.FC<{from: ShotId; to?: ShotId; children: React.ReactNode}> = ({from, to, children}) => (
  <Sequence from={at(from)} durationInFrames={span(from, to ?? from)} layout="none">
    <SeqBase.Provider value={at(from)}>{children}</SeqBase.Provider>
  </Sequence>
);

export const Main: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#0A0D13'}}>
      <Background />
      {/* 开场 */}
      <Shot from="quiz" to="wrong">
        <Quiz />
      </Shot>
      <Shot from="title">
        <Title dur={len('title')} />
      </Shot>
      {/* 先说「土」 */}
      <Shot from="word" to="wall">
        <Define />
      </Shot>
      {/* 第一层 */}
      <Shot from="phone" to="key1">
        <L1 />
      </Shot>
      <Shot from="flip">
        <Flip />
      </Shot>
      {/* 第二层 */}
      <Shot from="scale">
        <ScaleScene />
      </Shot>
      <Shot from="tickets">
        <Tickets />
      </Shot>
      <Shot from="sorter">
        <Sorter />
      </Shot>
      <Shot from="daolang">
        <DaolangScene />
      </Shot>
      {/* 第三层 */}
      <Shot from="lockIntro">
        <LockIntroScene />
      </Shot>
      <Shot from="scarcity">
        <Scarcity />
      </Shot>
      <Shot from="money">
        <MoneyScene />
      </Shot>
      <Shot from="time">
        <TimeScene />
      </Shot>
      <Shot from="know">
        <KnowScene />
      </Shot>
      <Shot from="express" to="allOpen">
        <L3c />
      </Shot>
      {/* 第四层 */}
      <Shot from="climb" to="disrupt">
        <L4 />
      </Shot>
      <Shot from="relabel">
        <Relabel />
      </Shot>
      {/* 反面 */}
      <Shot from="profit" to="survive">
        <L6 />
      </Shot>
      {/* 收尾 */}
      <Shot from="rings" to="sea">
        <L7 />
      </Shot>
      <DepthGauge from={at('word')} until={at('sea') - 30} />
      <Finish />
    </AbsoluteFill>
  );
};
