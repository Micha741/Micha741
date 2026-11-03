import { requireNativeView } from 'expo';
import * as React from 'react';

import type { HighSpeedCameraViewProps, HighSpeedCameraViewRef } from './HighSpeedCamera.types';

const NativeView = requireNativeView<HighSpeedCameraViewProps & React.RefAttributes<HighSpeedCameraViewRef>>(
  'HighSpeedCamera'
);

export default function HighSpeedCameraView(
  props: HighSpeedCameraViewProps & { ref?: React.Ref<HighSpeedCameraViewRef> }
) {
  return <NativeView {...props} />;
}
