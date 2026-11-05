import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { RecordingFile } from './modules/high-speed-camera';
import { SettingsProvider, useSettings } from './src/lib/settings';
import AnalysisScreen from './src/screens/AnalysisScreen';
import CameraScreen from './src/screens/CameraScreen';
import PlayerScreen, { type AnalysisRequest } from './src/screens/PlayerScreen';
import RecordingsScreen from './src/screens/RecordingsScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Screen =
  | { name: 'camera' }
  | { name: 'recordings' }
  | { name: 'settings' }
  | { name: 'results'; from: 'camera' | 'settings' }
  | { name: 'player'; recording: RecordingFile; from: 'camera' | 'recordings' }
  | { name: 'analysis'; request: AnalysisRequest; player: Extract<Screen, { name: 'player' }> };

function Navigator() {
  const { isDark, colors } = useSettings();
  const [screen, setScreen] = useState<Screen>({ name: 'camera' });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  const goBack = () => {
    switch (screen.name) {
      case 'analysis':
        setScreen(screen.player);
        break;
      case 'player':
        setScreen(screen.from === 'camera' ? { name: 'camera' } : { name: 'recordings' });
        break;
      case 'results':
        setScreen(screen.from === 'settings' ? { name: 'settings' } : { name: 'camera' });
        break;
      default:
        setScreen({ name: 'camera' });
    }
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
    <>
      {/* Na kameře je vždy tmavé pozadí → světlé ikony stavového řádku. */}
      <StatusBar style={screen.name === 'camera' || isDark ? 'light' : 'dark'} />
      {screen.name === 'camera' && (
        <CameraScreen
          onOpenRecordings={() => setScreen({ name: 'recordings' })}
          onOpenResults={() => setScreen({ name: 'results', from: 'camera' })}
          onOpenSettings={() => setScreen({ name: 'settings' })}
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
      {screen.name === 'settings' && (
        <SettingsScreen onBack={goBack} onOpenResults={() => setScreen({ name: 'results', from: 'settings' })} />
      )}
      {screen.name === 'results' && <ResultsScreen onBack={goBack} />}
      {screen.name === 'player' && (
        <PlayerScreen
          recording={screen.recording}
          onBack={goBack}
          onAnalyzed={(request) => setScreen({ name: 'analysis', request, player: screen })}
        />
      )}
      {screen.name === 'analysis' && <AnalysisScreen request={screen.request} onBack={goBack} />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Navigator />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
