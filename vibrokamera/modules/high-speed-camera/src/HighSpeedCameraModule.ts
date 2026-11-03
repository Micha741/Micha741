import { NativeModule, requireNativeModule } from 'expo';

import type { CameraInfo, RecordingFile } from './HighSpeedCamera.types';

declare class HighSpeedCameraModule extends NativeModule<{}> {
  getCamerasAsync(): Promise<CameraInfo[]>;
  listRecordingsAsync(): Promise<RecordingFile[]>;
  deleteRecordingAsync(path: string): Promise<boolean>;
  /** Zkopíruje video do galerie (Movies/VibroKamera) a vrátí content:// URI. */
  saveToGalleryAsync(path: string): Promise<string>;
}

export default requireNativeModule<HighSpeedCameraModule>('HighSpeedCamera');
