import type { StyleProp, ViewStyle } from 'react-native';

export type VideoMode = { width: number; height: number; fps: number };

export type CameraInfo = {
  id: string;
  facing: 'back' | 'front' | 'external';
  hardwareLevel: string;
  /** Telefon zpřístupňuje aplikacím high-speed záznam (120/240/480 fps). */
  highSpeedSupported: boolean;
  highSpeedModes: VideoMode[];
  normalModes: VideoMode[];
  focalLengths: number[];
  flashAvailable: boolean;
  sensorOrientation: number;
  evMin: number;
  evMax: number;
  evStep: number;
};

export type RecordingFile = {
  path: string;
  uri: string;
  name: string;
  sizeBytes: number;
  modified: number;
  durationMs: number | null;
  frameCount: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
};

export type CameraReadyEvent = VideoMode & { cameraId: string; highSpeed: boolean };
export type CameraErrorEvent = { message: string };
/** Hotový záznam: metadata souboru + parametry, se kterými se nahrávalo. */
export type RecordingFinishedEvent = Omit<RecordingFile, 'durationMs' | 'frameCount' | 'rotation'> & {
  durationMs: number;
  frameCount?: number;
  rotation?: number;
  fps: number;
  highSpeed: boolean;
};

export type HighSpeedCameraViewProps = {
  cameraId: string | null;
  videoWidth: number;
  videoHeight: number;
  fps: number;
  highSpeed: boolean;
  torch?: boolean;
  /** Korekce expozice v krocích kamery (viz CameraInfo.evStep). */
  exposureCompensation?: number;
  aeLock?: boolean;
  /** Datový tok v bit/s, 0 = automaticky. */
  bitRate?: number;
  onCameraReady?: (event: { nativeEvent: CameraReadyEvent }) => void;
  onCameraError?: (event: { nativeEvent: CameraErrorEvent }) => void;
  onRecordingFinished?: (event: { nativeEvent: RecordingFinishedEvent }) => void;
  style?: StyleProp<ViewStyle>;
};

export type HighSpeedCameraViewRef = {
  startRecording(): Promise<string>;
  stopRecording(): Promise<RecordingFinishedEvent>;
};

export type StorageInfo = {
  recordingsDir: string;
  recordingsCount: number;
  recordingsBytes: number;
  freeBytes: number;
};

export type TrackOptions = {
  path: string;
  /** Střed sledované oblasti, normalizovaně 0..1 v zobrazeném videu. */
  centerX: number;
  centerY: number;
  /** Velikost oblasti jako podíl kratší strany videa (např. 0.08). */
  roiSize: number;
  /** Max. posun mezi snímky v px. */
  searchRadius: number;
  startMs: number;
  durationMs: number;
};

export type TrackResult = {
  /** Čas každého snímku od začátku úseku [ms] (skutečné časové značky videa). */
  timesMs: number[];
  /** Posun vůči prvnímu snímku [px], osy zobrazeného videa (x doprava, y dolů). */
  dx: number[];
  dy: number[];
  /** Průměrná odchylka vzoru (nižší = lepší shoda). */
  score: number[];
  displayWidth: number;
  displayHeight: number;
  roiPx: number;
};
