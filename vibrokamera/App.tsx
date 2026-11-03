import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { RecordingFile } from './modules/high-speed-camera';
import CameraScreen from './src/screens/CameraScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import RecordingsScreen from './src/screens/RecordingsScreen';

type Screen =
  | { name: 'camera' }
  | { name: 'recordings' }
  | { name: 'player'; recording: RecordingFile; from: 'camera' | 'recordings' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'camera' });

  const goBack = () => {
    if (screen.name === 'player') setScreen(screen.from === 'camera' ? { name: 'camera' } : { name: 'recordings' });
    else if (screen.name === 'recordings') setScreen({ name: 'camera' });
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen.name === 'camera') return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen.name === 'camera' && (
        <CameraScreen
          onOpenRecordings={() => setScreen({ name: 'recordings' })}
          onRecordingFinished={(e) =>
            setScreen({
              name: 'player',
              from: 'camera',
              recording: {
                ...e,
                frameCount: e.frameCount ?? null,
                rotation: e.rotation ?? null,
              },
            })
          }
        />
      )}
      {screen.name === 'recordings' && (
        <RecordingsScreen
          onBack={goBack}
          onOpen={(recording) => setScreen({ name: 'player', recording, from: 'recordings' })}
        />
      )}
      {screen.name === 'player' && <PlayerScreen recording={screen.recording} onBack={goBack} />}
    </SafeAreaProvider>
  );
}
