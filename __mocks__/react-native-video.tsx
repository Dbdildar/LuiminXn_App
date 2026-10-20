import * as React from 'react';
import {View} from 'react-native';

// shared through globalThis so tests can read it without a second module instance
const g = globalThis as any;
if (!g.__videoMock) {
  g.__videoMock = {seek: jest.fn(), props: {}};
}
const state = g.__videoMock;

const Video = React.forwardRef((props: any, ref: any) => {
  state.props = props;
  React.useImperativeHandle(ref, () => ({seek: state.seek, pause: jest.fn(), resume: jest.fn()}));
  return <View testID="rn-video" {...props} />;
});

export default Video;
