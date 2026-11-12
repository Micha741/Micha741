import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useKeepAwake } from 'expo-keep-awake';
import { blockText, bookProgress, chapterHtml, DEFAULT_PREFS, parseReaderMessage, searchBook, THEMES, TURNS, type ReaderPrefs, type ReaderTheme, type ReaderTurn, type StartAt } from './src/core/reader';
import { addVocab, MARK_COLORS, vocabText, type Highlight, type LibraryEntry, type MarkColor, type VocabItem } from './src/core/library';
import * as Speech from 'expo-speech';
import { addToHistory, googleBooksSuggestUrl, googleBooksUrl, parseGoogleBooksFull, type StoreBook, gutendexUrl, KIND_LABEL, mergeSuggestions, openLibrarySuggestUrl, parseGoogleBooks, parseGutendex, parseOpenLibrary, SOURCES, suggestionQuery, type FoundBook, type SourceKind, type Suggestion } from './src/core/sources';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { addImage, bookStats, insertImage, pruneImages, type Book } from './src/core/book';
import { toBase64 } from './src/core/bytes';
import { OUTPUT_FORMATS, type OutputFormat } from './src/core/formats';
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL, ENGINES, LANGUAGES, makeTranslator, setOfflineBackend, translateBook, type EngineId } from './src/core/translate';
import Mlkit from './modules/mlkit-translate/src/MlkitTranslateModule';
import { BUILTIN_SKINS, type Skin } from './src/core/skins';
import { addToLibrary, downloadBook, installSkinFromPicker, loadInstalledSkins, loadLibrary, loadLibraryBook, loadSettings, makeOutput, openBookUri, pickBook, pickImage, removeFromLibrary, removeSkin, reopenPdf, saveOutputToFolder, saveSettings, saveVocab, loadVocab, shareOutput, shareText, updateEntry, type Output, type Settings } from './src/platform';

import appConfig from './app.json';

const VERSION = appConfig.expo.version; // číslo verze jen na jednom místě (app.json)

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

// ---- heslo k PDF: okno s dotazem (otevírá ho App), funkce použitelná ze všech obrazovek
let askPassword: (wrong: boolean) => Promise<string | null> = async () => null;
async function withPassword<T>(fn: () => Promise<T>): Promise<T | Book | null> {
  try {
    return await fn();
  } catch (e: any) {
    if (!e?.needsPassword) throw e;
    let wrong = false;
    for (;;) {
      const pw = await askPassword(wrong);
      if (pw === null) return null;
      try {
        return await reopenPdf(pw);
      } catch (e2: any) {
        if (!e2?.needsPassword) throw e2;
        wrong = true;
      }
    }
  }
}

function PasswordModal() {
  const [state, setState] = useState<{ wrong: boolean; resolve: (v: string | null) => void } | null>(null);
  const [pw, setPw] = useState('');
  useEffect(() => {
    askPassword = (wrong) => new Promise((resolve) => {
      setPw('');
      setState({ wrong, resolve });
    });
  }, []);
  const done = (v: string | null) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <Modal visible={!!state} transparent animationType="fade" onRequestClose={() => done(null)}>
      <View style={[st.modalBack, { justifyContent: 'center', padding: 20 }]}>
        <View style={[st.modal, { borderRadius: 14 }]}>
          <Text style={st.boxTitle}>🔒 PDF je chráněné heslem</Text>
          <Text style={[st.hint, state?.wrong && { color: C.danger }]}>{state?.wrong ? 'Heslo nesouhlasí. Zkuste ho zadat znovu.' : 'Zadejte heslo k otevření souboru (nebo heslo vlastníka).'}</Text>
          <TextInput style={st.input} value={pw} onChangeText={setPw} secureTextEntry autoFocus autoCapitalize="none" autoCorrect={false} placeholder="Heslo" placeholderTextColor={C.disabled} onSubmitEditing={() => done(pw)} />
          <View style={[st.row, { justifyContent: 'flex-end' }]}>
            <Btn label="Zrušit" onPress={() => done(null)} />
            <Btn label="Otevřít" onPress={() => done(pw)} primary />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const SERIF = Platform.select({ android: 'serif', default: 'Georgia' });

type Tab = 'cist' | 'kniha' | 'hledat' | 'nastaveni';

export default function App() {
  const [tab, setTab] = useState<Tab>('cist');
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [reading, setReading] = useState<Reading | null>(null);
  const [libBusy, setLibBusy] = useState('');
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
    loadLibrary().then(setLibrary);
  }, []);

  // ---- čtečka: otevření knihy z knihovny, z jiné aplikace nebo po překladu
  const openEntry = async (e: LibraryEntry) => {
    try {
      setLibBusy(`Otevírám: ${e.title}…`);
      const book = await loadLibraryBook(e.id);
      const original = e.originalId ? await loadLibraryBook(e.originalId).catch(() => null) : null;
      setReading({ entry: e, book, original });
    } catch (err: any) {
      Alert.alert('Knihovna', String(err?.message ?? err));
    } finally {
      setLibBusy('');
    }
  };
  const readBookNow = async (book: Book, original?: Book) => {
    setLibBusy('Ukládám do knihovny…');
    try {
      const orig = original ? await addToLibrary(original) : undefined;
      const entry = await addToLibrary(book, orig?.id);
      setLibrary(await loadLibrary());
      setTab('cist');
      setReading({ entry, book, original: original ?? null });
    } catch (err: any) {
      Alert.alert('Knihovna', String(err?.message ?? err));
    } finally {
      setLibBusy('');
    }
  };
  const pickToLibrary = async () => {
    try {
      setLibBusy('Načítám knihu…');
      const b = (await withPassword(() => pickBook())) as Book | null;
      if (b) await readBookNow(b);
    } catch (err: any) {
      Alert.alert('Otevřít knihu', String(err?.message ?? err));
    } finally {
      setLibBusy('');
    }
  };
  const removeEntry = (e: LibraryEntry) =>
    Alert.alert('Odebrat z knihovny?', e.title, [
      { text: 'Zrušit', style: 'cancel' },
      { text: 'Odebrat', style: 'destructive', onPress: async () => { await removeFromLibrary(e.id); setLibrary(await loadLibrary()); } },
    ]);
  // soubor otevřený z jiné aplikace („Otevřít v Překladači“)
  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url || !/^(content|file):/i.test(url)) return;
      try {
        setLibBusy('Otevírám soubor…');
        const b = (await withPassword(() => openBookUri(url))) as Book | null;
        if (b) await readBookNow(b);
      } catch (err: any) {
        Alert.alert('Otevřít knihu', String(err?.message ?? err));
      } finally {
        setLibBusy('');
      }
    };
    Linking.getInitialURL().then(handle).catch(() => undefined);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
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
        {reading ? (
          <ReaderView
            reading={reading}
            settings={settings}
            update={update}
            onEntry={(e) => setLibrary((l) => l.map((x) => (x.id === e.id ? e : x)))}
            onClose={() => {
              setReading(null);
              loadLibrary().then(setLibrary);
            }}
          />
        ) : (
        <>
        <View style={st.header}>
          <Image source={currentSkin.logo ? { uri: currentSkin.logo } : require('./assets/logo.png')} style={st.logo} />
          <View style={{ flex: 1 }}>
            <Text style={st.appName}>Překladač</Text>
            <Text style={st.appVersion}>verze {VERSION} · Android</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {tab === 'cist' && <LibraryScreen list={library} onOpen={openEntry} onRemove={removeEntry} onPick={pickToLibrary} busy={libBusy} />}
          {tab === 'kniha' && <BookScreen settings={settings} update={update} goSettings={() => setTab('nastaveni')} onRead={readBookNow} />}
          {tab === 'hledat' && <SearchScreen onBook={(b) => readBookNow(b)} settings={settings} update={update} library={library} />}
          {tab === 'nastaveni' && <SettingsScreen settings={settings} update={update} skin={skinApi} />}
        </View>
        <View style={st.nav}>
          {([['cist', '📖', 'Číst'], ['kniha', '🌍', 'Překlad'], ['hledat', '🔎', 'Hledat'], ['nastaveni', '⚙️', 'Nastavení']] as const).map(([id, icon, label]) => (
            <Pressable key={id} style={[st.navItem, tab === id && st.navItemOn]} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <Text style={[st.navText, tab === id && { color: C.accentText, fontWeight: '600' }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        </>
        )}
        <PasswordModal />
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
function BookScreen({ settings, update, goSettings, onRead }: { settings: Settings; update: (s: Partial<Settings>) => void; goSettings: () => void; onRead: (book: Book, original?: Book) => Promise<void> }) {
  const [book, setBook] = useState<Book | null>(null);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [translated, setTranslated] = useState<Book | null>(null);
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
      const b = (await withPassword(() => pickBook())) as Book | null;
      if (b) {
        setBook(b);
        setOutput(null);
        setTranslated(null);
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
    setTranslated(null);
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
        setTranslated(result);
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
              <Big icon="📖" label="Číst" onPress={() => { if (book) onRead(translated ?? book, translated ? book : undefined).catch(fail); }} disabled={!book || !!busy} />
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
              <Text style={st.paperHint}>Otevřete knihu: EPUB, PDF, DOCX, TXT, MOBI, PDB nebo projekt .kniha.json z Překladače na počítači. Pak ji přeložíte, převedete do jiného formátu nebo přidáte obálku a obrázky.</Text>
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
              <Btn label="📖 Číst" onPress={() => { (translated ? onRead(translated, book ?? undefined) : book ? onRead(book) : Promise.resolve()).catch(fail); }} />
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
              Čte, překládá a převádí knihy: otevře EPUB, PDF, DOCX, TXT, MOBI, PDB a projekty z Překladače na počítači; uloží EPUB, MOBI, PDF, DOCX, PDB, TXT. Převody používají stejná pravidla jako
              verze pro Windows. AZW3 a KFX jako vstup a skeny PDF (OCR) zatím převádějte na počítači.
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

function VoicePicker({ visible, lang, value, onPick, onClose }: { visible: boolean; lang: string; value: string; onPick: (id: string) => void; onClose: () => void }) {
  const [voices, setVoices] = useState<Speech.Voice[] | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => {
    if (visible) Speech.getAvailableVoicesAsync().then(setVoices).catch(() => setVoices([]));
  }, [visible]);
  const base = lang.slice(0, 2).toLowerCase();
  const mine = (voices ?? []).filter((v) => v.language.toLowerCase().replace('_', '-').startsWith(base));
  const shown = all ? voices ?? [] : mine;
  const sample: Record<string, string> = { cs: 'Dobrý den, takhle zní můj hlas.', sk: 'Dobrý deň, takto znie môj hlas.', de: 'Guten Tag, so klingt meine Stimme.', en: 'Hello, this is how my voice sounds.' };
  const label = (v: Speech.Voice, i: number) => {
    const local = /local/i.test(v.identifier) ? 'v telefonu' : /network/i.test(v.identifier) ? 'přes internet' : '';
    return `Hlas ${i + 1}${v.quality === 'Enhanced' ? ' · vylepšený' : ''}${local ? ` · ${local}` : ''}`;
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.modalBack} onPress={onClose}>
        <Pressable style={[st.modal, { maxHeight: '80%' }]} onPress={() => undefined}>
          <Text style={st.boxTitle}>🗣 Hlas pro čtení nahlas</Text>
          <Text style={st.hint}>
            Hlasy jsou z Androidu. Android neříká, který hlas je mužský a který ženský – klepnutím si hlas poslechnete a vyberete. Další hlasy přidáte v
            Nastavení Androidu → Převod textu na řeč (Google) → Nainstalovat hlasová data.
          </Text>
          <ScrollView>
            <Pressable onPress={() => onPick('')} style={st.chapterRow}>
              <Text style={[st.btnText, { flex: 1 }, !value && { fontWeight: '700', color: C.accent }]}>Výchozí hlas pro jazyk knihy</Text>
            </Pressable>
            {voices === null ? <ActivityIndicator color={C.accent} /> : null}
            {voices !== null && !shown.length ? <Text style={st.hint}>Pro tento jazyk není v telefonu žádný hlas – použije se výchozí.</Text> : null}
            {shown.map((v, i) => (
              <Pressable key={v.identifier} onPress={() => { onPick(v.identifier); Speech.stop().then(() => Speech.speak(sample[v.language.slice(0, 2).toLowerCase()] ?? v.name, { voice: v.identifier, language: v.language })).catch(() => undefined); }} style={st.chapterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.btnText, v.identifier === value && { fontWeight: '700', color: C.accent }]}>{label(v, i)}</Text>
                  <Text style={st.hint} numberOfLines={1}>{v.language} · {v.name}</Text>
                </View>
                <Text style={{ color: C.accent }}>▶</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={st.row}>
            <Btn small label={all ? 'Jen hlasy jazyka knihy' : 'Ukázat všechny hlasy'} onPress={() => setAll(!all)} />
            <Btn small label="Hotovo" primary onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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

// ------------------------------------------------------------ Číst: knihovna
type Reading = { entry: LibraryEntry; book: Book; original: Book | null };

function VocabModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [list, setList] = useState<VocabItem[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (visible) loadVocab().then(setList);
  }, [visible]);
  const shown = q.trim() ? list.filter((v) => `${v.word} ${v.translation}`.toLowerCase().includes(q.trim().toLowerCase())) : list;
  const remove = (v: VocabItem) => {
    const next = list.filter((x) => x !== v);
    setList(next);
    saveVocab(next);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.modalBack} onPress={onClose}>
        <Pressable style={[st.modal, { maxHeight: '85%' }]} onPress={() => undefined}>
          <View style={[st.row, { justifyContent: 'space-between' }]}>
            <Text style={st.boxTitle}>📒 Slovníček ({list.length})</Text>
            <View style={st.row}>
              {list.length ? <Btn small label="📤 Sdílet" onPress={() => shareText('Slovníček', vocabText(list)).catch(() => undefined)} /> : null}
              <Btn small label="✖" onPress={onClose} />
            </View>
          </View>
          {list.length > 8 ? <TextInput style={st.input} value={q} onChangeText={setQ} placeholder="Hledat ve slovníčku" placeholderTextColor={C.disabled} /> : null}
          <ScrollView>
            {!list.length ? <Text style={st.hint}>Slova, která si ve čtečce přeložíte (dvojité klepnutí na slovo → Přeložit slovo), se ukládají sem i s větou, ve které byla.</Text> : null}
            {shown.map((v) => (
              <View key={`${v.word}${v.at}`} style={st.chapterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.btnText}><Text style={{ fontWeight: '700' }}>{v.word}</Text> – {v.translation}</Text>
                  {v.sentence ? <Text style={[st.hint, { fontStyle: 'italic' }]} numberOfLines={2}>{v.sentence}</Text> : null}
                  <Text style={st.hint} numberOfLines={1}>{v.book}</Text>
                </View>
                <Btn small label="✖" onPress={() => remove(v)} />
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LibraryScreen({ list, onOpen, onRemove, onPick, busy }: { list: LibraryEntry[]; onOpen: (e: LibraryEntry) => void; onRemove: (e: LibraryEntry) => void; onPick: () => void; busy: string }) {
  const [vocab, setVocab] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: C.window }}>
      <View style={[st.settingsHead, { paddingBottom: 10 }]}>
        <View style={[st.row, { justifyContent: 'space-between' }]}>
          <Text style={st.pageTitle}>Knihovna</Text>
          <View style={st.row}>
            <Btn label="📒" onPress={() => setVocab(true)} small />
            <Btn label="📂 Otevřít knihu" onPress={onPick} primary small disabled={!!busy} />
          </View>
        </View>
        {busy ? <Text style={st.hint}>{busy}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
        {list.length === 0 ? (
          <View style={st.box}>
            <Text style={st.boxTitle}>Zatím tu nejsou žádné knihy</Text>
            <Text style={st.hint}>
              Otevřete knihu tlačítkem nahoře (EPUB, PDF, MOBI, DOCX, TXT, PDB), najděte ji na kartě Hledat, nebo klepněte na stažený soubor v telefonu a zvolte
              „Otevřít v Překladači“. Přeloženou knihu otevřete na kartě Překlad tlačítkem 📖 Číst – u odstavců pak uvidíte i originál.
            </Text>
          </View>
        ) : null}
        {list.map((e) => (
          <Pressable key={e.id} onPress={() => onOpen(e)} onLongPress={() => onRemove(e)} style={({ pressed }) => [st.libRow, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`${e.title}, přečteno ${Math.round(e.progress * 100)} %`}>
            {e.cover ? <Image source={{ uri: e.cover }} style={st.libCover} /> : <View style={[st.libCover, st.libNoCover]}><Text style={{ fontSize: 22 }}>📖</Text></View>}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.libTitle} numberOfLines={2}>{e.title}</Text>
              {e.author ? <Text style={st.hint} numberOfLines={1}>{e.author}</Text> : null}
              <Text style={st.hint}>
                {e.originalId ? '🌍 překlad · ' : ''}{e.language ? `${e.language} · ` : ''}{Math.round(e.progress * 100)} %{e.bookmarks.length ? ` · 🔖 ${e.bookmarks.length}` : ''}
              </Text>
              <View style={[st.bar, { height: 4, marginTop: 4 }]}><View style={[st.barFill, { height: 4, width: `${Math.round(e.progress * 100)}%` }]} /></View>
            </View>
          </Pressable>
        ))}
        {list.length ? <Text style={[st.hint, { textAlign: 'center' }]}>Podržením prstu na knize ji odeberete z knihovny. 📒 = slovníček přeložených slov.</Text> : null}
      </ScrollView>
      <VocabModal visible={vocab} onClose={() => setVocab(false)} />
    </View>
  );
}

// ------------------------------------------------------------ Číst: čtečka
type Sheet = { kind: 'para' | 'word'; i: number; text: string; word?: string } | null;

function ReaderView({ reading, settings, update, onClose, onEntry }: { reading: Reading; settings: Settings; update: (s: Partial<Settings>) => void; onClose: () => void; onEntry: (e: LibraryEntry) => void }) {
  useKeepAwake();
  const { book, original } = reading;
  const [entry, setEntry] = useState(reading.entry);
  const [chapter, setChapter] = useState(Math.min(reading.entry.chapter, Math.max(0, book.chapters.length - 1)));
  const [start, setStart] = useState<StartAt>(reading.entry.fraction || 'start');
  const [pos, setPos] = useState({ page: 0, pages: 1 });
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<'' | 'menu' | 'look'>('');
  const [menuTab, setMenuTab] = useState<'toc' | 'search' | 'marks'>('toc');
  const [query, setQuery] = useState('');
  const hits = useMemo(() => (menuTab === 'search' ? searchBook(book, query) : []), [book, query, menuTab]);
  const openMenu = (t: 'toc' | 'search' | 'marks') => {
    setMenuTab(t);
    setMenu(false);
    setPanel('menu');
  };
  const [sheet, setSheet] = useState<Sheet>(null);
  const [tr, setTr] = useState<{ busy: boolean; text: string }>({ busy: false, text: '' });
  const prefs: ReaderPrefs = { ...DEFAULT_PREFS, ...(settings.reader ?? {}) };
  const theme = THEMES[prefs.theme];
  const web = useRef<WebView>(null);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const html = useMemo(
    () => chapterHtml(book, chapter, prefs, start, (entry.highlights ?? []).filter((h) => h.chapter === chapter).map((h) => ({ i: h.i, color: h.color }))),
    [book, chapter, JSON.stringify({ ...prefs, ttsRate: 0 }), start], // označení a rychlost hlasu se mění bez načtení stránky
  );

  const persist = (patch: Partial<LibraryEntry>) => {
    const next = { ...entry, ...patch, lastRead: Date.now() };
    setEntry(next);
    onEntry(next);
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => updateEntry(next.id, next).catch(() => undefined), 600);
  };
  const fraction = pos.pages > 1 ? pos.page / (pos.pages - 1) : 0;
  const setPrefs = (p: Partial<ReaderPrefs>) => {
    setStart(fraction); // po změně písma zůstat na stejném místě kapitoly
    update({ reader: { ...prefs, ...p } });
  };
  const goChapter = (i: number, at: StartAt = 'start') => {
    if (i < 0 || i >= book.chapters.length) return;
    setStart(at);
    setChapter(i);
    setPanel('');
    setMenu(false);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) setSheet(null);
      else if (panel) setPanel('');
      else if (menu) setMenu(false);
      else onClose();
      return true;
    });
    return () => sub.remove();
  }, [sheet, panel, menu]);

  const onMessage = (ev: WebViewMessageEvent) => {
    const m = parseReaderMessage(ev.nativeEvent.data);
    if (!m) return;
    if (m.type === 'first') {
      speakFromRef.current(m.i);
      return;
    }
    if (m.type === 'pos') {
      if (pendingSpeak.current) {
        pendingSpeak.current = false;
        setTimeout(() => speakFromRef.current(0), 50);
      }
      setPos({ page: m.page, pages: m.pages });
      const f = m.pages > 1 ? m.page / (m.pages - 1) : 0;
      persist({ chapter, fraction: f, progress: bookProgress(book, chapter, f) });
    } else if (m.type === 'next') {
      if (chapter < book.chapters.length - 1) goChapter(chapter + 1, 'start');
      else persist({ progress: 1 });
    } else if (m.type === 'prev') goChapter(chapter - 1, 'end');
    else if (m.type === 'menu') setMenu((v) => !v);
    else if (m.type === 'para') {
      setTr({ busy: false, text: '' });
      setNoteDraft(markOf(m.i)?.note ?? '');
      setSheet({ kind: 'para', i: m.i, text: m.text });
    } else if (m.type === 'word') {
      setTr({ busy: false, text: '' });
      setSheet({ kind: 'word', i: m.i, text: m.text, word: m.word });
    }
  };

  const engine = (settings.engine as EngineId) || 'google';
  const target = settings.target || 'cs';
  const translateNow = async () => {
    if (!sheet) return;
    setTr({ busy: true, text: '' });
    try {
      const t = makeTranslator(engine, target, settings);
      const [out] = await t.translate([sheet.kind === 'word' ? sheet.word! : sheet.text]);
      setTr({ busy: false, text: out });
      if (sheet.kind === 'word' && out.trim()) {
        const sentence = (sheet.text.match(new RegExp(`[^.!?…]*${sheet.word!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?…]*[.!?…]?`, 'i'))?.[0] ?? '').trim().slice(0, 240);
        const item: VocabItem = { word: sheet.word!, translation: out.trim(), sentence, book: book.title, from: book.language, to: target, at: Date.now() };
        loadVocab().then((list) => saveVocab(addVocab(list, item))).catch(() => undefined);
      }
    } catch (e: any) {
      setTr({ busy: false, text: `⚠ ${e?.message ?? e}` });
    }
  };
  const origText = sheet ? blockText(original, chapter, sheet.i) : '';
  const addBookmark = () => {
    const label = `${book.chapters[chapter]?.title ?? 'Kapitola'} – ${Math.round(fraction * 100)} %`;
    persist({ bookmarks: [...entry.bookmarks, { chapter, fraction, label, at: Date.now() }] });
    Alert.alert('Záložka', `Uloženo: ${label}`);
  };
  const percent = Math.round(bookProgress(book, chapter, fraction) * 100);
  const highlights = entry.highlights ?? [];
  const markOf = (i: number) => highlights.find((h) => h.chapter === chapter && h.i === i);
  /** Označí odstavec barvou (null = zrušit označení) a uloží poznámku. */
  const setMark = (i: number, text: string, color: MarkColor | null, note?: string) => {
    const old = markOf(i);
    const rest = highlights.filter((h) => !(h.chapter === chapter && h.i === i));
    const next: Highlight[] = color ? [...rest, { chapter, i, text: text.slice(0, 160), at: old?.at ?? Date.now(), color, note: note ?? old?.note }] : rest;
    persist({ highlights: next });
    web.current?.injectJavaScript(`window.readerMark&&window.readerMark(${i},${color ? `'${color}'` : 'false'});true;`);
  };
  const [noteDraft, setNoteDraft] = useState('');

  // ---- čtení nahlas (hlas Androidu, i bez internetu); čte odstavec po odstavci a otáčí stránky
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const pendingSpeak = useRef(false);
  const speakFromRef = useRef<(i: number, part?: number) => void>(() => undefined);
  const ttsLang = ({ cs: 'cs-CZ', sk: 'sk-SK', en: 'en-US', de: 'de-DE', pl: 'pl-PL', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', ru: 'ru-RU', uk: 'uk-UA', hu: 'hu-HU' } as Record<string, string>)[book.language] ?? (book.language || 'cs-CZ');
  const stopSpeaking = () => {
    speakingRef.current = false;
    pendingSpeak.current = false;
    pausedRef.current = false;
    setPaused(false);
    setSpeaking(false);
    Speech.stop().catch(() => undefined);
    web.current?.injectJavaScript('window.readerSpeak&&window.readerSpeak(-1);true;');
  };
  // místo čtení: odstavec a věta (Android neumí hlas pozastavit – pokračuje se od věty, kde se zastavil)
  const speakAt = useRef({ block: 0, part: 0 });
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  speakFromRef.current = (from: number, fromPart = 0) => {
    if (!speakingRef.current || pausedRef.current) return;
    const blocks = book.chapters[chapter]?.blocks ?? [];
    let i = from;
    while (i < blocks.length && !((blocks[i].type === 'p' || blocks[i].type === 'h') && (blocks[i] as { text: string }).text.trim())) i++;
    if (i >= blocks.length) {
      if (chapter < book.chapters.length - 1) {
        pendingSpeak.current = true;
        goChapter(chapter + 1, 'start');
      } else stopSpeaking();
      return;
    }
    const text = (blocks[i] as { text: string }).text;
    web.current?.injectJavaScript(`window.readerSpeak&&window.readerSpeak(${i});true;`);
    // odstavec po větách (krátké věty dohromady), aby šlo pokračovat od věty
    const parts: string[] = [];
    let cur = '';
    for (const sent of text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text]) {
      if ((cur + sent).length > 280 && cur) {
        parts.push(cur);
        cur = '';
      }
      cur += sent;
    }
    if (cur.trim()) parts.push(cur);
    const say = (k: number) => {
      if (!speakingRef.current || pausedRef.current) return;
      if (k >= parts.length) return speakFromRef.current(i + 1);
      speakAt.current = { block: i, part: k };
      Speech.speak(parts[k], {
        language: ttsLang,
        voice: prefs.ttsVoice || undefined,
        rate: prefs.ttsRate ?? 1,
        onDone: () => say(k + 1),
        onError: () => stopSpeaking(),
      });
    };
    say(Math.min(fromPart, Math.max(0, parts.length - 1)));
  };
  const pauseSpeaking = () => {
    pausedRef.current = true;
    setPaused(true);
    Speech.stop().catch(() => undefined);
  };
  const resumeSpeaking = () => {
    pausedRef.current = false;
    setPaused(false);
    speakFromRef.current(speakAt.current.block, speakAt.current.part);
  };
  const [voicePick, setVoicePick] = useState(false);
  const startSpeaking = () => {
    speakingRef.current = true;
    pausedRef.current = false;
    setPaused(false);
    setSpeaking(true);
    setMenu(false);
    setPanel('');
    web.current?.injectJavaScript('window.readerFirst&&window.readerFirst();true;');
  };
  useEffect(() => () => {
    speakingRef.current = false;
    Speech.stop().catch(() => undefined);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <WebView
        key={`${chapter}:${typeof start === 'number' ? start.toFixed(4) : JSON.stringify(start)}:${JSON.stringify({ ...prefs, ttsRate: 0 })}`}
        ref={web}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={{ flex: 1, backgroundColor: theme.bg }}
        setSupportMultipleWindows={false}
        overScrollMode="never"
        textZoom={100}
      />
      {/* tenký řádek průběhu dole (jako v čtečkách) */}
      <View style={[st.readerFoot, { backgroundColor: theme.bg }]}>
        <Text style={[st.readerFootText, { color: theme.muted }]} numberOfLines={1}>
          {book.chapters[chapter]?.title ?? ''} · {pos.page + 1}/{pos.pages} · {percent} %
        </Text>
      </View>
      {speaking ? (
        <View style={[st.ttsBar, { backgroundColor: theme.bg, borderColor: theme.muted + '55' }]}>
          <Pressable onPress={() => (paused ? resumeSpeaking() : pauseSpeaking())} hitSlop={8} accessibilityLabel={paused ? 'Pokračovat ve čtení' : 'Pozastavit čtení'}>
            <Text style={{ color: theme.fg, fontSize: 17 }}>{paused ? '▶' : '⏸'}</Text>
          </Pressable>
          <Pressable onPress={() => update({ reader: { ...prefs, ttsRate: Math.max(0.5, Math.round(((prefs.ttsRate ?? 1) - 0.1) * 10) / 10) } })} hitSlop={8}><Text style={{ color: theme.fg, fontSize: 17 }}>−</Text></Pressable>
          <Text style={{ color: theme.muted, fontVariant: ['tabular-nums'] }}>{(prefs.ttsRate ?? 1).toFixed(1)}×</Text>
          <Pressable onPress={() => update({ reader: { ...prefs, ttsRate: Math.min(2, Math.round(((prefs.ttsRate ?? 1) + 0.1) * 10) / 10) } })} hitSlop={8}><Text style={{ color: theme.fg, fontSize: 17 }}>+</Text></Pressable>
          <Pressable onPress={() => setVoicePick(true)} hitSlop={8} accessibilityLabel="Vybrat hlas"><Text style={{ color: theme.fg, fontSize: 17 }}>🗣</Text></Pressable>
          <Pressable onPress={stopSpeaking} hitSlop={8} accessibilityLabel="Zastavit čtení"><Text style={{ color: theme.fg, fontSize: 17 }}>⏹</Text></Pressable>
        </View>
      ) : null}
      <VoicePicker visible={voicePick} lang={ttsLang} value={prefs.ttsVoice ?? ''} onClose={() => setVoicePick(false)}
        onPick={(id) => {
          update({ reader: { ...prefs, ttsVoice: id } });
          if (speakingRef.current && !pausedRef.current) {
            // hned dál novým hlasem od stejné věty
            pausedRef.current = true;
            Speech.stop().then(() => { pausedRef.current = false; setTimeout(() => speakFromRef.current(speakAt.current.block, speakAt.current.part), 50); }).catch(() => undefined);
          }
        }} />
      <Pressable onPress={() => openMenu('toc')} style={[st.burger, { backgroundColor: theme.bg, borderColor: theme.muted + '55' }]} accessibilityRole="button" accessibilityLabel="Nabídka: kapitoly, hledat, označené" hitSlop={8}>
        <Text style={{ color: theme.fg, fontSize: 20, lineHeight: 22 }}>☰</Text>
      </Pressable>
      {menu ? (
        <>
          <View style={[st.readerBar, { top: 0 }]}>
            <Pressable onPress={onClose} style={st.readerBtn} accessibilityLabel="Zpět do knihovny"><Text style={st.readerBtnText}>←</Text></Pressable>
            <Text style={[st.readerBtnText, { flex: 1, fontSize: 15 }]} numberOfLines={1}>{book.title}</Text>
          </View>
          <View style={[st.readerBar, { bottom: 0, justifyContent: 'space-around' }]}>
            <Pressable onPress={() => goChapter(chapter - 1, 'start')} style={st.readerBtn} disabled={chapter === 0}><Text style={st.readerBtnText}>⏮</Text></Pressable>
            <Pressable onPress={() => openMenu('toc')} style={st.readerBtn}><Text style={st.readerBtnText}>☰ Obsah</Text></Pressable>
            <Pressable onPress={() => openMenu('search')} style={st.readerBtn}><Text style={st.readerBtnText}>🔎</Text></Pressable>
            <Pressable onPress={addBookmark} style={st.readerBtn}><Text style={st.readerBtnText}>🔖</Text></Pressable>
            <Pressable onPress={() => (speaking ? stopSpeaking() : startSpeaking())} style={st.readerBtn} accessibilityLabel="Číst nahlas"><Text style={st.readerBtnText}>{speaking ? '⏹' : '🔊'}</Text></Pressable>
            <Pressable onPress={() => setPanel('look')} style={st.readerBtn}><Text style={st.readerBtnText}>Aa</Text></Pressable>
            <Pressable onPress={() => goChapter(chapter + 1, 'start')} style={st.readerBtn} disabled={chapter >= book.chapters.length - 1}><Text style={st.readerBtnText}>⏭</Text></Pressable>
          </View>
        </>
      ) : null}

      <Modal visible={panel === 'menu'} transparent animationType="fade" onRequestClose={() => setPanel('')}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }} onPress={() => setPanel('')} accessibilityLabel="Zavřít nabídku" />
          <View style={st.sideMenu}>
            <View style={[st.row, { justifyContent: 'space-between' }]}>
              <Text style={[st.boxTitle, { flex: 1 }]} numberOfLines={2}>{book.title}</Text>
              <Btn small label="✖" onPress={() => setPanel('')} />
            </View>
            <View style={[st.row, { gap: 6 }]}>
              <Btn small label={speaking ? '⏹ Nahlas' : '🔊 Nahlas'} onPress={() => (speaking ? stopSpeaking() : startSpeaking())} />
              <Btn small label="🔖 Záložka" onPress={() => { addBookmark(); }} />
              <Btn small label="Aa Vzhled" onPress={() => setPanel('look')} />
              <Btn small label="← Knihovna" onPress={() => { setPanel(''); onClose(); }} />
            </View>
            <Chips items={[{ id: 'toc', label: 'Kapitoly' }, { id: 'search', label: '🔎 Hledat' }, { id: 'marks', label: `🖍 Označené (${highlights.length + entry.bookmarks.length})` }]} value={menuTab} onChange={(v) => setMenuTab(v as typeof menuTab)} />
            {menuTab === 'search' ? (
              <TextInput style={st.input} value={query} onChangeText={setQuery} placeholder="Hledat v celé knize…" placeholderTextColor={C.disabled} autoFocus returnKeyType="search" />
            ) : null}
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              {menuTab === 'toc' &&
                book.chapters.map((c, i) => (
                  <Pressable key={i} onPress={() => goChapter(i)} style={st.chapterRow}>
                    <Text style={[st.btnText, { flex: 1 }, i === chapter && { fontWeight: '700', color: C.accent }]} numberOfLines={2}>{i + 1}. {c.title}</Text>
                  </Pressable>
                ))}
              {menuTab === 'search' ? (
                <>
                  {query.trim().length >= 2 ? <Text style={st.hint}>{hits.length >= 200 ? 'Více než 200 nálezů – upřesněte hledání.' : `Nalezeno: ${hits.length}`}</Text> : <Text style={st.hint}>Napište aspoň 2 písmena. Na velikosti písmen ani háčcích a čárkách nezáleží.</Text>}
                  {hits.map((h, k) => (
                    <Pressable key={k} onPress={() => goChapter(h.chapter, { block: h.i })} style={st.chapterRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={st.hint} numberOfLines={1}>{book.chapters[h.chapter]?.title}</Text>
                        <Text style={st.btnText}>{h.before}<Text style={{ fontWeight: '700', backgroundColor: '#fff2a8', color: '#111827' }}>{h.match}</Text>{h.after}</Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : null}
              {menuTab === 'marks' ? (
                <>
                  {!highlights.length && !entry.bookmarks.length ? <Text style={st.hint}>Zatím nic. Odstavec označíte podržením prstu na něm a výběrem barvy, můžete k němu připsat poznámku. Záložku přidáte tlačítkem 🔖 nahoře.</Text> : null}
                  {highlights.length ? (
                    <Btn small label="📤 Sdílet označené a poznámky" onPress={() => shareText(`${book.title} – poznámky`, [...highlights].sort((a, b) => a.chapter - b.chapter || a.i - b.i).map((h) => `${book.chapters[h.chapter]?.title ?? ''}\n„${blockText(book, h.chapter, h.i)}“${h.note ? `\nPoznámka: ${h.note}` : ''}\n`).join('\n')).catch(() => undefined)} />
                  ) : null}
                  {[...highlights].sort((a, b) => a.chapter - b.chapter || a.i - b.i).map((h) => (
                    <View key={`h${h.at}`} style={st.chapterRow}>
                      <Pressable style={{ flex: 1 }} onPress={() => goChapter(h.chapter, { block: h.i })}>
                        <View style={st.row}>
                          <View style={[st.colorDot, { width: 14, height: 14, backgroundColor: MARK_COLORS[h.color ?? 'y'].day }]} />
                          <Text style={[st.hint, { flex: 1 }]} numberOfLines={1}>{book.chapters[h.chapter]?.title}</Text>
                        </View>
                        <Text style={st.btnText} numberOfLines={3}>{h.text}</Text>
                        {h.note ? <Text style={[st.hint, { fontStyle: 'italic' }]}>📝 {h.note}</Text> : null}
                      </Pressable>
                      <Btn small label="✖" onPress={() => { persist({ highlights: highlights.filter((x) => x !== h) }); if (h.chapter === chapter) web.current?.injectJavaScript(`window.readerMark&&window.readerMark(${h.i},false);true;`); }} />
                    </View>
                  ))}
                  {entry.bookmarks.map((b, k) => (
                    <View key={`b${b.at}`} style={st.chapterRow}>
                      <Pressable style={{ flex: 1 }} onPress={() => goChapter(b.chapter, b.fraction)}><Text style={st.btnText}>🔖 {b.label}</Text></Pressable>
                      <Btn small label="✖" onPress={() => persist({ bookmarks: entry.bookmarks.filter((_, j) => j !== k) })} />
                    </View>
                  ))}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={panel === 'look'} transparent animationType="slide" onRequestClose={() => setPanel('')}>
        <Pressable style={st.modalBack} onPress={() => setPanel('')}>
          <Pressable style={st.modal} onPress={() => undefined}>
            <Text style={st.boxTitle}>Vzhled stránky</Text>
            <Text style={st.label}>Barvy</Text>
            <Chips items={(Object.keys(THEMES) as ReaderTheme[]).map((k) => ({ id: k, label: THEMES[k].name }))} value={prefs.theme} onChange={(v) => setPrefs({ theme: v as ReaderTheme })} />
            <Text style={st.label}>Listování</Text>
            <Chips items={(Object.keys(TURNS) as ReaderTurn[]).map((k) => ({ id: k, label: TURNS[k] }))} value={prefs.turn} onChange={(v) => setPrefs({ turn: v as ReaderTurn })} />
            <Text style={st.label}>Písmo</Text>
            <Chips items={[{ id: 'serif', label: 'Patkové' }, { id: 'sans', label: 'Bezpatkové' }]} value={prefs.font} onChange={(v) => setPrefs({ font: v as 'serif' | 'sans' })} />
            <View style={[st.row, { marginTop: 6 }]}>
              <Text style={st.label}>Velikost {prefs.size}</Text>
              <Btn small label="A−" onPress={() => setPrefs({ size: Math.max(12, prefs.size - 1) })} />
              <Btn small label="A+" onPress={() => setPrefs({ size: Math.min(34, prefs.size + 1) })} />
            </View>
            <Text style={st.label}>Řádkování</Text>
            <Chips items={[{ id: '1.3', label: 'těsné' }, { id: '1.55', label: 'běžné' }, { id: '1.8', label: 'volné' }]} value={String(prefs.line)} onChange={(v) => setPrefs({ line: Number(v) })} />
            <Text style={st.label}>Okraje</Text>
            <Chips items={[{ id: '12', label: 'úzké' }, { id: '22', label: 'střední' }, { id: '34', label: 'široké' }]} value={String(prefs.margin)} onChange={(v) => setPrefs({ margin: Number(v) })} />
            <Text style={st.label}>Zarovnání</Text>
            <Chips items={[{ id: 'j', label: 'do bloku' }, { id: 'l', label: 'vlevo' }]} value={prefs.justify ? 'j' : 'l'} onChange={(v) => setPrefs({ justify: v === 'j' })} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={st.modalBack} onPress={() => setSheet(null)}>
          <Pressable style={[st.modal, { maxHeight: '75%' }]} onPress={() => undefined}>
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {sheet?.kind === 'word' ? <Text style={[st.pageTitle, { fontSize: 22 }]} selectable>{sheet.word}</Text> : null}
              {origText && origText !== sheet?.text ? (
                <>
                  <Text style={st.label}>Originál</Text>
                  <Text style={st.sheetText} selectable>{origText}</Text>
                  <Text style={st.label}>Překlad</Text>
                </>
              ) : null}
              {sheet?.kind === 'para' || origText ? <Text style={st.sheetText} selectable>{sheet?.text}</Text> : null}
              {tr.text ? (
                <>
                  <Text style={st.label}>Přeloženo ({ENGINES.find((e) => e.id === engine)?.name} → {LANGUAGES.find((l) => l.code === target)?.name})</Text>
                  <Text style={st.sheetText} selectable>{tr.text}</Text>
                </>
              ) : null}
              <View style={[st.row, { marginTop: 4 }]}>
                {tr.busy ? <ActivityIndicator color={C.accent} /> : <Btn label={sheet?.kind === 'word' ? '🌍 Přeložit slovo' : '🌍 Přeložit odstavec'} onPress={translateNow} primary />}
                {sheet?.kind === 'word' && tr.text && !tr.text.startsWith('⚠') ? <Text style={st.hint}>📒 Uloženo do slovníčku</Text> : null}
                <Btn label="Zavřít" onPress={() => setSheet(null)} />
              </View>
              {sheet && sheet.kind === 'para' && sheet.i >= 0 ? (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={st.label}>🖍 Označit barvou</Text>
                  <View style={st.row}>
                    {(Object.keys(MARK_COLORS) as MarkColor[]).map((k) => (
                      <Pressable key={k} onPress={() => setMark(sheet.i, sheet.text, k, noteDraft || undefined)} accessibilityLabel={`Označit: ${MARK_COLORS[k].name}`}
                        style={[st.colorDot, { backgroundColor: MARK_COLORS[k].day }, markOf(sheet.i)?.color === k || (!markOf(sheet.i)?.color && markOf(sheet.i) && k === 'y') ? { borderColor: C.accent, borderWidth: 3 } : null]} />
                    ))}
                    {markOf(sheet.i) ? <Btn small label="Zrušit" onPress={() => { setMark(sheet.i, sheet.text, null); setNoteDraft(''); }} /> : null}
                  </View>
                  <TextInput style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]} multiline value={noteDraft} onChangeText={setNoteDraft} placeholder="📝 Poznámka k odstavci (nepovinné)" placeholderTextColor={C.disabled} />
                  {noteDraft !== (markOf(sheet.i)?.note ?? '') ? <Btn small label="💾 Uložit poznámku" onPress={() => setMark(sheet.i, sheet.text, markOf(sheet.i)?.color ?? 'y', noteDraft)} /> : null}
                </View>
              ) : null}
              <Text style={st.hint}>Překladač a cílový jazyk se nastavují na kartě Překlad. Text jde označit a zkopírovat.</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ------------------------------------------------------------ Hledat knihy
function SearchScreen({ onBook, settings, update, library }: { onBook: (b: Book) => Promise<void>; settings: Settings; update: (s: Partial<Settings>) => void; library: LibraryEntry[] }) {
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('');
  const [found, setFound] = useState<FoundBook[] | null>(null);
  const [store, setStore] = useState<StoreBook[] | null>(null);
  const [open, setOpen] = useState('');
  const [busy, setBusy] = useState('');
  const [link, setLink] = useState('');
  const [focus, setFocus] = useState(false);
  const [web, setWeb] = useState<Suggestion[]>([]);
  // našeptávač: dřívější hledání a knihy z knihovny hned, katalog knih z internetu po krátké pauze v psaní
  useEffect(() => {
    const t = q.trim();
    if (t.length < 3) {
      setWeb([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(googleBooksSuggestUrl(t, lang), { signal: ctrl.signal });
        if (!r.ok) throw new Error(String(r.status));
        setWeb(parseGoogleBooks(await r.json()));
      } catch {
        if (ctrl.signal.aborted) return;
        try {
          const r = await fetch(openLibrarySuggestUrl(t), { signal: ctrl.signal });
          setWeb(r.ok ? parseOpenLibrary(await r.json()) : []);
        } catch {
          setWeb([]);
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, lang]);
  const local: Suggestion[] = [
    ...(settings.searchHistory ?? []).map((h) => ({ title: h, author: '', from: 'history' as const })),
    ...library.map((e) => ({ title: e.title, author: e.author, from: 'library' as const })),
  ];
  const suggestions = focus ? (q.trim() ? mergeSuggestions(q, local, web) : local.filter((s) => s.from === 'history').slice(0, 6)) : [];
  const search = async (query = q) => {
    const text = query.trim();
    if (!text) return;
    setQ(text);
    setFocus(false);
    update({ searchHistory: addToHistory(settings.searchHistory, text) });
    setBusy('Hledám knihy…');
    // katalog Google Books (obchody, ukázky, volná díla) souběžně s Project Gutenberg
    fetch(googleBooksUrl(text, lang))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setStore(j ? parseGoogleBooksFull(j) : []))
      .catch(() => setStore([]));
    try {
      const res = await fetch(gutendexUrl(text, lang));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFound(parseGutendex(await res.json()).books.slice(0, 30));
    } catch (e: any) {
      setFound([]);
      Alert.alert('Hledání', `Project Gutenberg teď neodpovídá (${e?.message ?? e}). Zkuste to za chvíli nebo použijte obchody a knihovny níže.`);
    } finally {
      setBusy('');
    }
  };
  const get = async (url: string, label: string) => {
    setBusy(`Stahuji: ${label}…`);
    try {
      const b = (await withPassword(() => downloadBook(url))) as Book | null;
      if (b) await onBook(b);
    } catch (e: any) {
      Alert.alert('Stažení', String(e?.message ?? e));
    } finally {
      setBusy('');
    }
  };
  const kinds: SourceKind[] = ['free', 'social', 'library', 'drm'];
  return (
    <View style={{ flex: 1, backgroundColor: C.window }}>
      <View style={[st.settingsHead, { paddingBottom: 10, gap: 6 }]}>
        <Text style={st.pageTitle}>Hledat knihy</Text>
        <View style={st.row}>
          <TextInput style={[st.input, { flex: 1, marginTop: 0 }]} value={q} onChangeText={(t) => { setQ(t); setFocus(true); }} placeholder="Název nebo autor" placeholderTextColor={C.disabled} returnKeyType="search" onSubmitEditing={() => search()} onFocus={() => setFocus(true)} />
          <Btn label="🔎" onPress={() => search()} primary disabled={!!busy || !q.trim()} />
        </View>
        {suggestions.length ? (
          <View style={st.suggestBox}>
            {suggestions.map((s, i) => (
              <Pressable key={`${s.from}${i}`} onPress={() => search(suggestionQuery(s))} style={({ pressed }) => [st.suggestRow, pressed && { backgroundColor: C.hover }]} accessibilityRole="button">
                <Text style={{ width: 22 }}>{s.from === 'history' ? '🕘' : s.from === 'library' ? '📖' : '🔎'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.btnText} numberOfLines={1}>{s.title}</Text>
                  {s.author ? <Text style={st.hint} numberOfLines={1}>{s.author}</Text> : null}
                </View>
              </Pressable>
            ))}
            {!q.trim() && settings.searchHistory?.length ? (
              <Pressable onPress={() => update({ searchHistory: [] })} style={st.suggestRow}><Text style={st.hint}>Smazat historii hledání</Text></Pressable>
            ) : null}
          </View>
        ) : null}
        <Chips items={[{ id: '', label: 'všechny jazyky' }, { id: 'cs', label: 'čeština' }, { id: 'en', label: 'angličtina' }, { id: 'de', label: 'němčina' }, { id: 'fr', label: 'francouzština' }]} value={lang} onChange={setLang} />
        {busy ? <View style={st.row}><ActivityIndicator color={C.accent} /><Text style={st.hint}>{busy}</Text></View> : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }} keyboardShouldPersistTaps="handled">
        {store && store.length ? (
          <Box title={`Knihy v katalogu Google Books – ${store.length}`}>
            {store.map((b) => (
              <View key={b.id} style={[st.chapterRow, { alignItems: 'flex-start' }]}>
                {b.cover ? <Image source={{ uri: b.cover }} style={[st.libCover, { width: 52, height: 76 }]} /> : <View style={[st.libCover, st.libNoCover, { width: 52, height: 76 }]}><Text>📖</Text></View>}
                <View style={{ flex: 1, gap: 2 }}>
                  <Pressable onPress={() => setOpen(open === b.id ? '' : b.id)}>
                    <Text style={st.btnText} numberOfLines={open === b.id ? undefined : 2}>{b.title}</Text>
                    <Text style={st.hint} numberOfLines={1}>{b.authors}{b.language ? ` · ${b.language}` : ''}{b.price ? ` · ${b.price}` : ''}</Text>
                    {b.description ? <Text style={st.hint} numberOfLines={open === b.id ? undefined : 2}>{b.description}</Text> : null}
                  </Pressable>
                  <View style={[st.row, { gap: 6 }]}>
                    {b.download ? <Btn small primary label="⬇ Číst" onPress={() => get(b.download!, b.title)} disabled={!!busy} /> : null}
                    {b.preview ? <Btn small label="👁 Ukázka" onPress={() => Linking.openURL(b.preview!)} /> : null}
                    {b.buy ? <Btn small label="🛒 Koupit" onPress={() => Linking.openURL(b.buy!)} /> : null}
                  </View>
                  {open === b.id ? (
                    <View style={[st.row, { gap: 6 }]}>
                      <Text style={st.hint}>Najít v:</Text>
                      {SOURCES.filter((x) => ['alza', 'kosmas', 'palmknihy', 'martinus'].includes(x.id)).map((x) => (
                        <Btn key={x.id} small label={x.name} onPress={() => Linking.openURL(x.url(`${b.title} ${b.authors.split(',')[0] ?? ''}`.trim()))} />
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
            <Text style={st.hint}>Klepnutím na název se ukáže celý popis a odkazy do českých obchodů. Ukázky a nákup se otevřou v prohlížeči; soubor stažený z obchodu pak otevřete „Otevřít v Překladači“.</Text>
          </Box>
        ) : null}
        {found ? (
          <Box title={`Project Gutenberg – ${found.length ? `${found.length} knih zdarma` : 'nic nenalezeno'}`}>
            {found.map((b) => (
              <Pressable key={b.id} onPress={() => b.epub && get(b.epub, b.title)} style={({ pressed }) => [st.libRow, { borderWidth: 0, padding: 4 }, pressed && { opacity: 0.7 }]} disabled={!!busy}>
                {b.cover ? <Image source={{ uri: b.cover }} style={[st.libCover, { width: 44, height: 64 }]} /> : <View style={[st.libCover, st.libNoCover, { width: 44, height: 64 }]}><Text>📖</Text></View>}
                <View style={{ flex: 1 }}>
                  <Text style={st.btnText} numberOfLines={2}>{b.title}</Text>
                  <Text style={st.hint} numberOfLines={1}>{b.authors}{b.languages.length ? ` · ${b.languages.join(', ')}` : ''}</Text>
                </View>
                <Text style={{ color: C.accent, fontWeight: '600' }}>⬇ Číst</Text>
              </Pressable>
            ))}
          </Box>
        ) : null}
        {kinds.map((k) => (
          <Box key={k} title={KIND_LABEL[k]}>
            {SOURCES.filter((s) => s.kind === k).map((s) => (
              <Pressable key={s.id} onPress={() => (q.trim() ? Linking.openURL(s.url(q.trim())) : Alert.alert('Hledat', 'Nejdřív napište název nebo autora.'))} style={({ pressed }) => [st.chapterRow, pressed && { opacity: 0.6 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={st.btnText}>{s.name} ↗</Text>
                  <Text style={st.hint}>{s.note}</Text>
                </View>
              </Pressable>
            ))}
          </Box>
        ))}
        <Box title="Stáhnout z odkazu">
          <Text style={st.hint}>Máte odkaz přímo na soubor knihy nebo ukázky (končí .epub, .pdf, .mobi…)? Vložte ho sem. Stažený soubor v telefonu otevřete klepnutím a volbou „Otevřít v Překladači“.</Text>
          <View style={st.row}>
            <TextInput style={[st.input, { flex: 1 }]} value={link} onChangeText={(t) => setLink(t.trim())} placeholder="https://…/kniha.epub" placeholderTextColor={C.disabled} autoCapitalize="none" autoCorrect={false} />
            <Btn label="⬇" onPress={() => get(link, 'kniha z odkazu')} disabled={!!busy || !/^https?:\/\//.test(link)} />
          </View>
        </Box>
        <Text style={[st.hint, { textAlign: 'center' }]}>Knihy se zašifrováním (Amazon Kindle, Adobe DRM .acsm, Google Play) Překladač neotevře – čtěte je v aplikaci obchodu.</Text>
      </ScrollView>
    </View>
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
  libRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10 },
  libCover: { width: 56, height: 80, borderRadius: 3, backgroundColor: C.paper },
  libNoCover: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.paperBorder },
  libTitle: { fontFamily: SERIF, fontSize: 16, color: C.strong },
  readerFoot: { paddingHorizontal: 14, paddingVertical: 4 },
  readerFootText: { fontSize: 11.5, textAlign: 'center' },
  readerBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: 'rgba(17,24,39,0.92)' },
  readerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  readerBtnText: { color: '#f8fafc', fontSize: 17 },
  sheetText: { fontFamily: SERIF, fontSize: 16, lineHeight: 23, color: C.text },
  colorDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.inputBorder },
  ttsBar: { position: 'absolute', top: 6, left: 8, height: 40, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, opacity: 0.92 },
  burger: { position: 'absolute', top: 6, right: 8, width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
  sideMenu: { width: '86%', maxWidth: 420, backgroundColor: C.surface, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10, gap: 8 },
  suggestBox: { borderWidth: 1, borderColor: C.inputBorder, borderRadius: 8, backgroundColor: C.surface, overflow: 'hidden' },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderColor: C.border, minHeight: 44 },
  });
}
let st = makeStyles();
