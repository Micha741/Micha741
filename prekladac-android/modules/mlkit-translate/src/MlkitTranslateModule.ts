// Offline překlad v telefonu (Google ML Kit). V Expo Go a na webu modul není → null.
import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class MlkitTranslateModule extends NativeModule<{}> {
  supportedLanguages(): string[];
  identifyLanguage(text: string): Promise<string>;
  downloadedLanguages(): Promise<string[]>;
  downloadLanguage(code: string, wifiOnly: boolean): Promise<boolean>;
  deleteLanguage(code: string): Promise<boolean>;
  translate(texts: string[], source: string, target: string, wifiOnly: boolean): Promise<string[]>;
}

export default requireOptionalNativeModule<MlkitTranslateModule>('MlkitTranslate');
