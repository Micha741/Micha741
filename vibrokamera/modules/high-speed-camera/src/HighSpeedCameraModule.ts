import { NativeModule, requireNativeModule } from 'expo';

import type { CameraInfo, RecordingFile, StorageInfo } from './HighSpeedCamera.types';

declare class HighSpeedCameraModule extends NativeModule<{}> {
  getCamerasAsync(): Promise<CameraInfo[]>;
  listRecordingsAsync(): Promise<RecordingFile[]>;
  deleteRecordingAsync(path: string): Promise<boolean>;
  /** Zkopíruje video do galerie (Movies/VibroKamera) a vrátí content:// URI. */
  saveToGalleryAsync(path: string): Promise<string>;
  getStorageInfoAsync(): Promise<StorageInfo>;
  /** Uloží text do Stažené/VibroKamera a vrátí relativní cestu. */
  exportTextAsync(fileName: string, content: string, mimeType: string): Promise<string>;
}

export default requireNativeModule<HighSpeedCameraModule>('HighSpeedCamera');
