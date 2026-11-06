import { NativeModule, requireNativeModule } from 'expo';

import type { CameraInfo, DeviceInfo, RecordingFile, StorageInfo, TrackOptions, TrackResult } from './HighSpeedCamera.types';

type Events = {
  onTrackingProgress: (event: { progress: number }) => void;
};

declare class HighSpeedCameraModule extends NativeModule<Events> {
  getCamerasAsync(): Promise<CameraInfo[]>;
  listRecordingsAsync(): Promise<RecordingFile[]>;
  deleteRecordingAsync(path: string): Promise<boolean>;
  /** Zkopíruje video do galerie (Movies/VibroKamera) a vrátí content:// URI. */
  saveToGalleryAsync(path: string): Promise<string>;
  getStorageInfoAsync(): Promise<StorageInfo>;
  getDeviceInfoAsync(): Promise<DeviceInfo>;
  /** Sleduje posun zvolené oblasti ve videu (časový záznam vibrací). */
  trackMotionAsync(options: TrackOptions): Promise<TrackResult>;
  cancelTracking(): boolean;
  /** Uloží text do Stažené/VibroKamera a vrátí relativní cestu. */
  exportTextAsync(fileName: string, content: string, mimeType: string): Promise<string>;
}

export default requireNativeModule<HighSpeedCameraModule>('HighSpeedCamera');
