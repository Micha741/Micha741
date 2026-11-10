import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { addImage, bookStats, insertImage, pruneImages, type Book } from './src/core/book';
import { toBase64 } from './src/core/bytes';
import { OUTPUT_FORMATS, type OutputFormat } from './src/core/formats';
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL, ENGINES, LANGUAGES, makeTranslator, setOfflineBackend, translateBook, type EngineId } from './src/core/translate';
import Mlkit from './modules/mlkit-translate/src/MlkitTranslateModule';
import { BUILTIN_SKINS, type Skin } from './src/core/skins';
import { installSkinFromPicker, loadInstalledSkins, loadSettings, makeOutput, pickBook, pickImage, removeSkin, saveOutputToFolder, saveSettings, shareOutput, type Output, type Settings } from './src/platform';

const VERSION = '1.0';

// Barvy ze skinu – stejné názvy jako ve Windows verzi (prekladac/assets/skins/builtin.json)
function colorsFor(skin: Skin) {
  const k = skin.colors;
  return {
    sidebar: k.sidebar, sideText: k.sidebar_item, sideMuted: k.sidebar_muted, sideHover: k.sidebar_hover, sideTitle: k.sidebar_title,
    accent: k.accent, accentDark: k.accent_hover, accentText: k.accent_text, window: k.window, canvas: k.canvas, paper: k.paper, paperBorder: k.paper_border,
    text: k.text, strong: k.heading, muted: k.muted, border: k.border, inputBorder: k.input_border, ribbonBorder: k.ribbon_border,
    bigBg: k.soft, bigBorder: k.soft_border, bigText: k.soft_text, hover: k.tool_hover, checked: k.tool_checked, hoverBorder: k.hover_border, docHeading: k.doc_heading,
    docText: k.doc_text, paperMuted: k.paper_muted, surface: k.surface, infobar: k.infobar, groupTitle: k.group_title, disabled: k.disabled_text,
    ok: k.ok, warn: k.warn, danger: k.danger_text, dangerBg: k.danger_bg,
  };
}
let C = colorsFor(BUILTIN_SKINS[0]);
let currentSkin: Skin = BUILTIN_SKINS[0];
function useSkin(skin: Skin) {
  currentSkin = skin;
  C = colorsFor(skin);
  st = makeStyles();
}
function isDark(hex: string) {
  const n = parseInt(hex.slice(1, 7), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 140;
}
if (Mlkit) {
  const m = Mlkit;
  setOfflineBackend({ identifyLanguage: (t) => m.identifyLanguage(t), translate: (x, a, b, w) => m.translate(x, a, b, w) });
}

const SERIF = Platform.select({ android: 'serif', default: 'Georgia' });

type Tab = 'kniha' | 'psat' | 'nastaveni';

export default function App() {
  const [tab, setTab] = useState<Tab>('kniha');
  const [settings, setSettings] = useState<Settings>({});
  const [skins, setSkins] = useState<Skin[]>(BUILTIN_SKINS);
  const [, redraw] = useState(0);
  useEffect(() => {
    Promise.all([loadSettings(), loadInstalledSkins()]).then(([s, inst]) => {
      const all = [...BUILTIN_SKINS, ...inst];
      setSkins(all);
      useSkin(all.find((k) => k.id === s.skin) ?? BUILTIN_SKINS[0]);
      setSettings(s);
    });
  }, []);
  const update = (s: Partial<Settings>) => {
    const next = { ...settings, ...s };
    setSettings(next);
    saveSettings(next).catch(() => undefined);
  };
  const chooseSkin = (skin: Skin) => {
    useSkin(skin);
    update({ skin: skin.id });
    redraw((n) => n + 1);
  };
  const skinApi = {
    skins,
    current: currentSkin,
    choose: chooseSkin,
    install: async () => {
      try {
        const skin = await installSkinFromPicker();
        if (!skin) return;
        const inst = await loadInstalledSkins();
        setSkins([...BUILTIN_SKINS, ...inst]);
        chooseSkin(skin);
      } catch (e: any) {
        Alert.alert('Skin nejde nainstalovat', String(e?.message ?? e));
      }
    },
    remove: async (skin: Skin) => {
      removeSkin(skin);
      setSkins([...BUILTIN_SKINS, ...(await loadInstalledSkins())]);
      chooseSkin(BUILTIN_SKINS[0]);
    },
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={st.root} edges={['top', 'bottom']}>
        <StatusBar style={isDark(C.sidebar) ? 'light' : 'dark'} />
        <View style={st.header}>
          <Image source={currentSkin.logo ? { uri: currentSkin.logo } : require('./assets/logo.png')} style={st.logo} />
          <View style={{ flex: 1 }}>
            <Text style={st.appName}>Překladač</Text>
            <Text style={st.appVersion}>verze {VERSION} · Android</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {tab === 'kniha' && <BookScreen settings={settings} update={update} goSettings={() => setTab('nastaveni')} />}
          {tab === 'psat' && <WriteScreen />}
          {tab === 'nastaveni' && <SettingsScreen settings={settings} update={update} skin={skinApi} />}
        </View>
        <View style={st.nav}>
          {([['kniha', '🌍', 'Překlad'], ['psat', '✍️', 'Napsat knihu'], ['nastaveni', '⚙️', 'Nastavení']] as const).map(([id, icon, label]) => (
            <Pressable key={id} style={[st.navItem, tab === id && st.navItemOn]} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <Text style={[st.navText, tab === id && { color: C.accentText, fontWeight: '600' }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ------------------------------------------------------------ pás karet (jako ve Windows)
function Ribbon({ tabs, active, onTab, children, actions }: { tabs: string[]; active: number; onTab: (i: number) => void; children: ReactNode; actions?: ReactNode }) {
  return (
    <View style={st.ribbon}>
      <View style={st.ribbonTabs}>
        {tabs.map((t, i) => (
          <Pressable key={t} onPress={() => onTab(i)} style={[st.ribbonTab, active === i && st.ribbonTabOn]} accessibilityRole="tab" accessibilityState={{ selected: active === i }}>
            <Text style={[st.ribbonTabText, active === i && { color: C.accent, fontWeight: '600' }]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.ribbonRow} style={{ flex: 1 }}>
          {children}
        </ScrollView>
        {actions ? <View style={st.ribbonActions}>{actions}</View> : null}
      </View>
    </View>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={st.group}>
      <View style={st.groupBody}>{children}</View>
      <Text style={st.groupLabel}>{label}</Text>
    </View>
  );
}

function Big({ icon, label, onPress, primary, disabled, on }: { icon: string; label: string; onPress: () => void; primary?: boolean; disabled?: boolean; on?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [st.big, primary && st.bigPrimary, on && st.bigOn, pressed && { backgroundColor: C.hover }, disabled && { opacity: 0.45 }]}>
      <Text style={st.bigIcon}>{icon}</Text>
      <Text style={[st.bigText, primary && { color: C.bigText, fontWeight: '600' }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------ Překlad a převod
function BookScreen({ settings, update, goSettings }: { settings: Settings; update: (s: Partial<Settings>) => void; goSettings: () => void }) {
  const [book, setBook] = useState<Book | null>(null);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [translate, setTranslate] = useState(true);
  const [imgPick, setImgPick] = useState<Uint8Array | null>(null);
  const [rtab, setRtab] = useState(1);
  const abort = useRef<AbortController | null>(null);
  const engine = (settings.engine as EngineId) || 'google';
  const target = settings.target || 'cs';
  const fmt = (settings.format as OutputFormat) || 'epub';
  const say = (m: string) => setLog((l) => [...l.slice(-40), m]);
  const fail = (e: unknown) => Alert.alert('Chyba', e instanceof Error ? e.message : String(e));

  const open = async () => {
    try {
      setBusy('Načítám knihu…');
      const b = await pickBook();
      if (b) {
        setBook(b);
        setOutput(null);
        const s = bookStats(b);
        say(`Otevřeno: ${b.source} – ${s.chapters} kapitol, ${s.words.toLocaleString('cs')} slov, ${s.images} obrázků.`);
      }
    } catch (e) {
      say(`✗ ${e instanceof Error ? e.message : String(e)}`);
      fail(e);
    } finally {
      setBusy('');
    }
  };

  const changed = (b: Book) => {
    setBook({ ...b });
    setOutput(null);
  };

  const setCover = async () => {
    if (!book) return;
    try {
      const data = await pickImage();
      if (!data) return;
      book.cover = addImage(book, data, 'image/jpeg');
      pruneImages(book);
      changed(book);
      say('🖼 Obálka nastavena.');
    } catch (e) {
      fail(e);
    }
  };

  const startInsert = async () => {
    try {
      const data = await pickImage();
      if (data) setImgPick(data);
    } catch (e) {
      fail(e);
    }
  };

  const insertInto = (chapter: number, where: 'start' | 'end') => {
    if (!book || !imgPick) return;
    insertImage(book, chapter, addImage(book, imgPick, 'image/jpeg'), where);
    setImgPick(null);
    changed(book);
    say(`🖼 Obrázek vložen na ${where === 'start' ? 'začátek' : 'konec'} kapitoly ${chapter + 1}.`);
  };

  const run = async () => {
    if (!book) return;
    const ctrl = new AbortController();
    abort.current = ctrl;
    setOutput(null);
    setProgress(0);
    try {
      let result = book;
      if (translate) {
        const lang = LANGUAGES.find((l) => l.code === target)!;
        setBusy(`Překládám do: ${lang.name}…`);
        say(`🌍 Překlad (${ENGINES.find((e) => e.id === engine)!.name}) do: ${lang.name}`);
        result = await translateBook(book, makeTranslator(engine, target, settings), target, (p) => setProgress(p.done / Math.max(1, p.total)), ctrl.signal);
        say('✓ Přeloženo.');
      }
      setBusy(`Ukládám ${OUTPUT_FORMATS.find((f) => f.id === fmt)!.label}…`);
      const out = await makeOutput(result, fmt);
      setOutput(out);
      say(`✓ Uloženo: ${out.name}`);
    } catch (e) {
      if (ctrl.signal.aborted) say('Zastaveno.');
      else {
        say(`✗ ${e instanceof Error ? e.message : String(e)}`);
        fail(e);
      }
    } finally {
      setBusy('');
      abort.current = null;
    }
  };

  const need = ENGINES.find((e) => e.id === engine)?.needs;
  const keyMissing = !!(translate && need && !settings[need]);
  const stats = book ? bookStats(book) : null;
  const cover = book?.cover ? book.images[book.cover] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: C.window }}>
      <Ribbon
        tabs={['Soubor', 'Překlad', 'Uložit jako', 'Obrázky']}
        active={rtab}
        onTab={setRtab}
        actions={
          busy ? (
            <Big icon="⏹" label="Zastavit" onPress={() => abort.current?.abort()} />
          ) : (
            <Big icon="▶️" label={translate ? 'Přeložit' : 'Převést'} onPress={run} primary disabled={!book || keyMissing} />
          )
        }>
        {rtab === 0 && (
          <>
            <Group label="Kniha">
              <Big icon="📂" label="Otevřít…" onPress={open} disabled={!!busy} />
            </Group>
            <Group label="Výsledek">
              <Big icon="📤" label="Sdílet" onPress={() => output && shareOutput(output).catch(fail)} disabled={!output} />
              <Big icon="📁" label="Do složky" onPress={() => output && saveOutputToFolder(output).then((n) => say(`📁 Uloženo: ${n}`)).catch(fail)} disabled={!output} />
            </Group>
          </>
        )}
        {rtab === 1 && (
          <>
            <Group label="Režim">
              <Big icon="🌍" label="Přeložit" onPress={() => setTranslate(true)} on={translate} />
              <Big icon="🔄" label="Jen převod" onPress={() => setTranslate(false)} on={!translate} />
            </Group>
            <Group label="Cílový jazyk">
              <Chips items={LANGUAGES.map((l) => ({ id: l.code, label: l.name }))} value={target} onChange={(v) => update({ target: v })} rows={2} />
            </Group>
            <Group label="Překladač">
              <Chips items={ENGINES.map((e) => ({ id: e.id, label: e.name }))} value={engine} onChange={(v) => update({ engine: v })} rows={2} />
            </Group>
          </>
        )}
        {rtab === 2 && (
          <Group label="Výstupní formát">
            <Chips items={OUTPUT_FORMATS.map((f) => ({ id: f.id, label: f.label }))} value={fmt} onChange={(v) => update({ format: v })} rows={2} />
          </Group>
        )}
        {rtab === 3 && (
          <>
            <Group label="Obálka">
              <Big icon="🖼️" label="Obálka…" onPress={setCover} disabled={!book} />
              <Big icon="✖️" label="Odebrat" onPress={() => { if (book) { book.cover = undefined; pruneImages(book); changed(book); } }} disabled={!book?.cover} />
            </Group>
            <Group label="Vložení">
              <Big icon="➕" label="Obrázek…" onPress={startInsert} disabled={!book} />
            </Group>
          </>
        )}
      </Ribbon>

      {/* informační řádek pod pásem (jako ve Windows) */}
      <View style={st.infoBar}>
        <Text style={[st.infoText, keyMissing && { color: C.warn }]} numberOfLines={2} onPress={keyMissing ? goSettings : undefined}>
          {translate
            ? keyMissing
              ? `⚠ ${ENGINES.find((e) => e.id === engine)?.name}: chybí klíč – klepněte pro Nastavení`
              : `✓ ${ENGINES.find((e) => e.id === engine)?.name} → ${LANGUAGES.find((l) => l.code === target)?.name} · ${OUTPUT_FORMATS.find((f) => f.id === fmt)?.label}`
            : `ℹ Jen převod → ${OUTPUT_FORMATS.find((f) => f.id === fmt)?.label} (${OUTPUT_FORMATS.find((f) => f.id === fmt)?.hint})`}
        </Text>
      </View>

      <ScrollView style={st.canvas} contentContainerStyle={st.canvasContent} keyboardShouldPersistTaps="handled">
        <View style={st.paper}>
          {!book ? (
            <>
              <Text style={st.docHeading}>Kniha</Text>
              <Text style={st.paperHint}>Otevřete knihu: EPUB, DOCX, TXT, MOBI, PDB nebo projekt .kniha.json z Překladače na počítači. Pak ji přeložíte, převedete do jiného formátu nebo přidáte obálku a obrázky.</Text>
              <Btn label="📂 Otevřít knihu" onPress={open} primary disabled={!!busy} />
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <Pressable onPress={setCover} style={st.coverBox} accessibilityLabel="Změnit obálku">
                  {cover ? (
                    <Image source={{ uri: `data:${cover.mime};base64,${toBase64(cover.data)}` }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={[st.paperHint, { textAlign: 'center' }]}>＋{'\n'}obálka</Text>
                  )}
                </Pressable>
                <View style={{ flex: 1, gap: 4 }}>
                  <TextInput style={st.titleInput} value={book.title} onChangeText={(t) => changed({ ...book, title: t })} placeholder="Název knihy" multiline />
                  <TextInput style={st.authorInput} value={book.author} onChangeText={(t) => changed({ ...book, author: t })} placeholder="Autor" />
                  <Text style={st.paperHint}>{stats!.chapters} kapitol · {stats!.words.toLocaleString('cs')} slov · {stats!.images} obrázků</Text>
                </View>
              </View>
              <Text style={[st.docHeading, { marginTop: 18 }]}>Kapitoly</Text>
              {book.chapters.slice(0, 200).map((c, i) => (
                <Text key={i} style={st.chapterLine} numberOfLines={1}>
                  {i + 1}. {c.title}
                  {c.blocks.some((b) => b.type === 'img') ? '  🖼' : ''}
                </Text>
              ))}
            </>
          )}
        </View>

        {output && !busy ? (
          <View style={[st.paper, { borderColor: C.ok }]}>
            <Text style={{ color: C.ok, fontWeight: '600' }}>✓ Hotovo: {output.name}</Text>
            <View style={st.row}>
              <Btn label="📤 Sdílet / poslat" onPress={() => shareOutput(output).catch(fail)} primary />
              <Btn label="📁 Uložit do složky" onPress={() => saveOutputToFolder(output).then((n) => say(`📁 Uloženo: ${n}`)).catch(fail)} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* průběh a záznam dole (jako ve Windows) */}
      {busy || log.length ? (
        <View style={st.work}>
          {busy ? (
            <View style={st.row}>
              <ActivityIndicator color={C.accent} size="small" />
              <Text style={{ color: C.text, flex: 1 }}>{busy}</Text>
            </View>
          ) : null}
          {busy && translate ? (
            <View style={st.bar}>
              <View style={[st.barFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          ) : null}
          <ScrollView style={{ maxHeight: 92 }}>
            {log.slice(-6).map((l, i) => (
              <Text key={i} style={[st.log, l.startsWith('✗') && { color: C.danger }, l.startsWith('✓') && { color: C.ok }]}>{l}</Text>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Modal visible={!!imgPick} animationType="slide" transparent onRequestClose={() => setImgPick(null)}>
        <View style={st.modalBack}>
          <View style={st.modal}>
            <Text style={st.docHeading}>Kam vložit obrázek?</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {book?.chapters.map((c, i) => (
                <View key={i} style={st.chapterRow}>
                  <Text style={{ flex: 1, color: C.text }} numberOfLines={2}>{i + 1}. {c.title}</Text>
                  <Btn label="začátek" onPress={() => insertInto(i, 'start')} small />
                  <Btn label="konec" onPress={() => insertInto(i, 'end')} small primary />
                </View>
              ))}
            </ScrollView>
            <Btn label="Zrušit" onPress={() => setImgPick(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function WriteScreen() {
  return (
    <ScrollView style={st.canvas} contentContainerStyle={st.canvasContent}>
      <View style={st.paper}>
        <Text style={st.docHeading}>Napsat knihu</Text>
        <Text style={st.hint}>
          Psaní knihy s umělou inteligencí (popis → osnova → kapitoly) přijde v další verzi. Rozepsanou knihu z počítače (.kniha.json)
          už teď otevřete na kartě Překlad a uložíte do EPUB, MOBI, PDF…
        </Text>
      </View>
    </ScrollView>
  );
}

// ------------------------------------------------------------ Nastavení (jako záložky ve Windows)
type SkinApi = { skins: Skin[]; current: Skin; choose: (s: Skin) => void; install: () => void; remove: (s: Skin) => void };

function SettingsScreen({ settings, update, skin }: { settings: Settings; update: (s: Partial<Settings>) => void; skin: SkinApi }) {
  const [tab, setTab] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: C.window }}>
      <View style={st.settingsHead}>
        <Text style={st.pageTitle}>Nastavení</Text>
        <Text style={st.hint}>Klíče se ukládají zašifrovaně jen v tomto telefonu (Android Keystore).</Text>
        <View style={[st.ribbonTabs, { paddingHorizontal: 0, marginTop: 6 }]}>
          {['Služby a klíče', 'Vzhled', 'Info'].map((t, i) => (
            <Pressable key={t} onPress={() => setTab(i)} style={[st.ribbonTab, tab === i && st.ribbonTabOn]}>
              <Text style={[st.ribbonTabText, tab === i && { color: C.accent, fontWeight: '600' }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
        {tab === 0 ? (
          <>
            <Box title="Claude (Anthropic)">
              <Field label="API klíč (console.anthropic.com)" value={settings.claudeKey} onChange={(v) => update({ claudeKey: v })} secret />
              <Text style={st.label}>Model</Text>
              <Chips items={CLAUDE_MODELS.map((m) => ({ id: m.id, label: m.name }))} value={settings.claudeModel || DEFAULT_CLAUDE_MODEL} onChange={(v) => update({ claudeModel: v })} />
            </Box>
            <Box title="Google Gemini">
              <Field label="API klíč (aistudio.google.com)" value={settings.geminiKey} onChange={(v) => update({ geminiKey: v })} secret />
              <Field label="Model" value={settings.geminiModel} placeholder={DEFAULT_GEMINI_MODEL} onChange={(v) => update({ geminiModel: v })} />
            </Box>
            <Box title="Google Cloud Translation">
              <Field label="API klíč (console.cloud.google.com → Credentials)" value={settings.googleCloudKey} onChange={(v) => update({ googleCloudKey: v })} secret />
              <Text style={st.hint}>Zdarma 500 000 znaků měsíčně. V projektu zapněte „Cloud Translation API“ a propojte fakturaci (Google to vyžaduje i pro bezplatnou část).</Text>
            </Box>
            <Box title="DeepL">
              <Field label="API klíč (Free končí na :fx)" value={settings.deeplKey} onChange={(v) => update({ deeplKey: v })} secret />
            </Box>
            <Box title="OpenRouter / OpenAI-kompatibilní (DeepSeek, Mistral…)">
              <Field label="API klíč" value={settings.openaiKey} onChange={(v) => update({ openaiKey: v })} secret />
              <Field label="Adresa API" value={settings.openaiBase} placeholder="https://openrouter.ai/api/v1" onChange={(v) => update({ openaiBase: v })} />
              <Field label="Model" value={settings.openaiModel} placeholder="deepseek/deepseek-chat" onChange={(v) => update({ openaiModel: v })} />
            </Box>
            <OfflineBox settings={settings} update={update} />
            <Box title="Google (zdarma)">
              <Text style={[st.hint, { color: C.ok }]}>✓ Klíč není potřeba.</Text>
            </Box>
          </>
        ) : tab === 1 ? (
          <SkinsBox api={skin} />
        ) : (
          <Box title="O programu">
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Image source={require('./assets/logo.png')} style={{ width: 56, height: 56 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: C.strong }}>Překladač knih a dokumentů</Text>
                <Text style={st.hint}>Verze programu: {VERSION} (Android)</Text>
                <Text style={st.hint}>© 2026 Micha741 · zdarma pro osobní použití</Text>
              </View>
            </View>
            <Text style={[st.hint, { marginTop: 8 }]}>
              Otevře EPUB, DOCX, TXT, MOBI, PDB a projekty z Překladače na počítači; uloží EPUB, MOBI, PDF, DOCX, PDB, TXT. Převody používají stejná pravidla jako
              verze pro Windows. AZW3, KFX a PDF jako vstup zatím převádějte na počítači.
            </Text>
          </Box>
        )}
      </ScrollView>
    </View>
  );
}

function OfflineBox({ settings, update }: { settings: Settings; update: (s: Partial<Settings>) => void }) {
  const [have, setHave] = useState<string[] | null>(null);
  const [busy, setBusy] = useState('');
  const refresh = () => Mlkit?.downloadedLanguages().then(setHave).catch(() => setHave([]));
  useEffect(() => {
    refresh();
  }, []);
  if (!Mlkit) {
    return (
      <Box title="Offline v telefonu (Google ML Kit)">
        <Text style={st.hint}>Funguje jen v nainstalované aplikaci (APK), ne v Expo Go.</Text>
      </Box>
    );
  }
  const wifi = settings.offlineWifiOnly !== false;
  const act = async (code: string, del: boolean) => {
    setBusy(code);
    try {
      if (del) await Mlkit!.deleteLanguage(code);
      else await Mlkit!.downloadLanguage(code, wifi);
      await refresh();
    } catch (e: any) {
      Alert.alert('Offline v telefonu', del ? String(e?.message ?? e) : `Jazyk se nepodařilo stáhnout${wifi ? ' – jste připojeni k Wi-Fi?' : '.'}\n\n${e?.message ?? e}`);
    } finally {
      setBusy('');
    }
  };
  return (
    <Box title="Offline v telefonu (Google ML Kit)">
      <Text style={st.hint}>
        Překládá přímo v telefonu bez internetu a bez klíče. Každý jazyk (asi 30 MB) se stáhne jednou – stačí ho stáhnout tady, nebo se stáhne sám při
        prvním překladu. Jazyk knihy se pozná automaticky. Kvalita odpovídá běžnému Google Překladači; pro knihy je lepší Claude nebo Gemini.
      </Text>
      <Text style={st.label}>Stahovat jazyky</Text>
      <Chips items={[{ id: 'wifi', label: 'jen přes Wi-Fi' }, { id: 'any', label: 'i přes mobilní data' }]} value={wifi ? 'wifi' : 'any'} onChange={(v) => update({ offlineWifiOnly: v === 'wifi' })} />
      <Text style={st.label}>Jazyky v telefonu</Text>
      {LANGUAGES.map((l) => {
        const on = !!have?.includes(l.code);
        return (
          <View key={l.code} style={[st.row, { justifyContent: 'space-between', marginTop: 4 }]}>
            <Text style={st.btnText}>{on ? '✓ ' : ''}{l.name}</Text>
            {busy === l.code ? (
              <ActivityIndicator color={C.accent} />
            ) : l.code === 'en' && on ? (
              <Text style={st.hint}>vždy (přes ni se překládá)</Text>
            ) : (
              <Btn small label={on ? '🗑️ Smazat' : '⬇ Stáhnout'} onPress={() => act(l.code, on)} disabled={!!busy || have === null} />
            )}
          </View>
        );
      })}
    </Box>
  );
}

function SkinSwatch({ skin }: { skin: Skin }) {
  const k = skin.colors;
  return (
    <View style={{ width: 64, height: 40, flexDirection: 'row', borderWidth: 1, borderColor: k.border, backgroundColor: k.canvas, overflow: 'hidden', borderRadius: 3 }}>
      <View style={{ width: 14, backgroundColor: k.sidebar, paddingTop: 6, alignItems: 'center' }}>
        <View style={{ width: 8, height: 5, backgroundColor: k.accent }} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ height: 9, backgroundColor: k.surface }} />
        <View style={{ flex: 1, margin: 4, marginLeft: 10, backgroundColor: k.paper, padding: 3, gap: 4 }}>
          {[0, 1, 2].map((i) => <View key={i} style={{ height: 1, backgroundColor: k.doc_text }} />)}
        </View>
      </View>
    </View>
  );
}

function SkinsBox({ api }: { api: SkinApi }) {
  return (
    <Box title="Vzhled (skin)">
      <Text style={st.hint}>Skin mění barvy a logo aplikace – stejné soubory .skin fungují i ve Windows verzi. Vzhled se změní hned.</Text>
      {api.skins.map((s) => {
        const on = s.id === api.current.id;
        return (
          <Pressable key={s.id} onPress={() => api.choose(s)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={[st.skinRow, on && { borderColor: C.accent, backgroundColor: C.bigBg }]}>
            <SkinSwatch skin={s} />
            <View style={{ flex: 1 }}>
              <Text style={[st.btnText, on && { fontWeight: '700' }]}>{s.name}{s.author && !s.builtin ? `  –  ${s.author}` : ''}</Text>
              {s.description ? <Text style={st.hint} numberOfLines={2}>{s.description}</Text> : null}
            </View>
            {!s.builtin ? <Btn label="🗑️" small onPress={() => Alert.alert('Odebrat skin?', s.name, [{ text: 'Zrušit', style: 'cancel' }, { text: 'Odebrat', style: 'destructive', onPress: () => api.remove(s) }])} /> : null}
          </Pressable>
        );
      })}
      <View style={[st.row, { marginTop: 6 }]}>
        <Btn label="📥 Instalovat skin…" onPress={api.install} />
      </View>
      <Text style={st.hint}>Vlastní skin vytvoříte ve Windows verzi: Nastavení → Vzhled → Uložit jako šablonu (uvnitř je návod).</Text>
    </Box>
  );
}

// ------------------------------------------------------------ drobné prvky
function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={st.box}>
      <Text style={st.boxTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Btn({ label, onPress, primary, small, disabled }: { label: string; onPress: () => void; primary?: boolean; small?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [st.btn, primary && st.btnPrimary, small && st.btnSmall, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}>
      <Text style={[st.btnText, primary && { color: C.accentText, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

function Chips({ items, value, onChange, rows }: { items: { id: string; label: string }[]; value: string; onChange: (v: string) => void; rows?: number }) {
  const perRow = rows ? Math.ceil(items.length / rows) : items.length;
  const lines = rows ? Array.from({ length: rows }, (_, r) => items.slice(r * perRow, (r + 1) * perRow)) : [items];
  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, k) => (
        <View key={k} style={[st.chips, !rows && { flexWrap: 'wrap' }]}>
          {line.map((it) => (
            <Pressable key={it.id} onPress={() => onChange(it.id)} style={[st.chip, value === it.id && st.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: value === it.id }}>
              <Text style={[st.chipText, value === it.id && { color: C.accentText, fontWeight: '600' }]}>{it.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function Field({ label, value, onChange, secret, placeholder }: { label: string; value?: string; onChange: (v: string) => void; secret?: boolean; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput style={[st.input, { flex: 1 }]} value={value ?? ''} onChangeText={(t) => onChange(t.trim())} secureTextEntry={secret && !show} autoCapitalize="none" autoCorrect={false} placeholder={placeholder} placeholderTextColor={C.disabled} />
        {secret ? <Btn label={show ? '🙈' : '👁'} onPress={() => setShow(!show)} small /> : null}
      </View>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.sidebar },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.sidebar },
  logo: { width: 34, height: 34, borderRadius: 6 },
  appName: { color: C.sideTitle, fontSize: 16, fontWeight: '700' },
  appVersion: { color: C.sideMuted, fontSize: 11 },
  nav: { flexDirection: 'row', backgroundColor: C.sidebar, paddingHorizontal: 6, paddingVertical: 6, gap: 6 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, minHeight: 52, justifyContent: 'center' },
  navItemOn: { backgroundColor: C.accent },
  navText: { fontSize: 11.5, color: C.sideText, marginTop: 2 },
  ribbon: { backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.ribbonBorder },
  ribbonTabs: { flexDirection: 'row', paddingHorizontal: 6, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  ribbonTab: { paddingHorizontal: 12, paddingVertical: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1, borderColor: 'transparent', marginBottom: -1 },
  ribbonTabOn: { borderColor: C.border, borderBottomColor: C.surface, backgroundColor: C.surface },
  ribbonTabText: { color: C.text, fontSize: 13.5 },
  ribbonRow: { paddingHorizontal: 6, paddingVertical: 6, gap: 4, alignItems: 'stretch' },
  ribbonActions: { borderLeftWidth: 1, borderColor: C.border, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  group: { paddingHorizontal: 6, borderRightWidth: 1, borderColor: C.border, justifyContent: 'space-between' },
  groupBody: { flexDirection: 'row', gap: 4, alignItems: 'center', flex: 1 },
  groupLabel: { color: C.muted, fontSize: 10.5, textAlign: 'center', marginTop: 3 },
  big: { width: 76, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 4, paddingVertical: 4 },
  bigPrimary: { backgroundColor: C.bigBg, borderColor: C.bigBorder },
  bigOn: { backgroundColor: C.checked, borderColor: C.hoverBorder },
  bigIcon: { fontSize: 22 },
  bigText: { fontSize: 11.5, color: C.text, textAlign: 'center', marginTop: 2 },
  infoBar: { backgroundColor: C.infobar, borderBottomWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6 },
  infoText: { color: C.text, fontSize: 12.5 },
  canvas: { flex: 1, backgroundColor: C.canvas },
  canvasContent: { padding: 12, gap: 12, paddingBottom: 24 },
  paper: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.paperBorder, borderRadius: 2, paddingHorizontal: 20, paddingVertical: 18, gap: 8 },
  docHeading: { fontFamily: SERIF, fontSize: 21, color: C.docHeading },
  hint: { color: C.muted, fontSize: 13, lineHeight: 18 },
  paperHint: { color: C.paperMuted, fontSize: 13, lineHeight: 18 },
  skinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderWidth: 1, borderColor: C.border, borderRadius: 8, marginTop: 6 },
  coverBox: { width: 86, height: 124, borderRadius: 2, borderWidth: 1, borderColor: C.paperBorder, backgroundColor: C.infobar, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  titleInput: { fontFamily: SERIF, fontSize: 19, color: C.strong, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 2 },
  authorInput: { fontFamily: SERIF, fontSize: 15, color: C.text, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 2 },
  chapterLine: { fontFamily: SERIF, fontSize: 15, color: C.text, paddingVertical: 3, borderLeftWidth: 3, borderColor: C.border, paddingLeft: 10 },
  work: { backgroundColor: C.surface, borderTopWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  bar: { height: 10, backgroundColor: C.border, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: C.accent, borderRadius: 6 },
  log: { color: C.text, fontSize: 11.5, fontFamily: Platform.select({ android: 'monospace', default: 'Menlo' }) },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  btn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 6, paddingVertical: 9, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  btnPrimary: { backgroundColor: C.accent, borderColor: C.accent },
  btnSmall: { paddingVertical: 5, paddingHorizontal: 10, minHeight: 34 },
  btnText: { color: C.text, fontSize: 14 },
  chips: { flexDirection: 'row', gap: 4 },
  chip: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, minHeight: 32, justifyContent: 'center' },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.text, fontSize: 12.5 },
  settingsHead: { backgroundColor: C.surface, paddingHorizontal: 14, paddingTop: 10, borderBottomWidth: 1, borderColor: C.ribbonBorder },
  pageTitle: { fontSize: 20, fontWeight: '600', color: C.strong },
  box: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, gap: 4 },
  boxTitle: { color: C.groupTitle, fontWeight: '600', fontSize: 14.5 },
  label: { color: C.text, fontWeight: '600', marginTop: 4, fontSize: 13 },
  input: { borderWidth: 1, borderColor: C.inputBorder, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 7, color: C.text, backgroundColor: C.surface, marginTop: 3 },
  modalBack: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 16, gap: 10 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderColor: C.border },
  });
}
let st = makeStyles();
