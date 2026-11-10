import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { addImage, bookStats, insertImage, pruneImages, type Book } from './src/core/book';
import { toBase64 } from './src/core/bytes';
import { OUTPUT_FORMATS, type OutputFormat } from './src/core/formats';
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL, ENGINES, LANGUAGES, makeTranslator, translateBook, type EngineId } from './src/core/translate';
import { loadSettings, makeOutput, pickBook, pickImage, saveOutputToFolder, saveSettings, shareOutput, type Output, type Settings } from './src/platform';

const C = { bg: '#f1f5f9', card: '#ffffff', text: '#0f172a', muted: '#64748b', primary: '#2563eb', primaryText: '#ffffff', border: '#e2e8f0', danger: '#dc2626', ok: '#16a34a', chip: '#e0e7ff' };

type Tab = 'kniha' | 'psat' | 'nastaveni';

export default function App() {
  const [tab, setTab] = useState<Tab>('kniha');
  const [settings, setSettings] = useState<Settings>({});
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);
  const update = (s: Partial<Settings>) => {
    const next = { ...settings, ...s };
    setSettings(next);
    saveSettings(next).catch(() => undefined);
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={st.root} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={st.header}>
          <Text style={st.headerTitle}>📘 Překladač knih</Text>
        </View>
        <View style={{ flex: 1 }}>
          {tab === 'kniha' && <BookScreen settings={settings} update={update} goSettings={() => setTab('nastaveni')} />}
          {tab === 'psat' && <WriteScreen />}
          {tab === 'nastaveni' && <SettingsScreen settings={settings} update={update} />}
        </View>
        <View style={st.tabs}>
          {([['kniha', '📚', 'Převod a překlad'], ['psat', '✍️', 'Napsat knihu'], ['nastaveni', '⚙️', 'Nastavení']] as const).map(([id, icon, label]) => (
            <Pressable key={id} style={st.tab} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
              <Text style={[st.tabText, tab === id && { color: C.primary, fontWeight: '700' }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ------------------------------------------------------------ hlavní obrazovka
function BookScreen({ settings, update, goSettings }: { settings: Settings; update: (s: Partial<Settings>) => void; goSettings: () => void }) {
  const [book, setBook] = useState<Book | null>(null);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [translate, setTranslate] = useState(false);
  const [imgPick, setImgPick] = useState<Uint8Array | null>(null);
  const abort = useRef<AbortController | null>(null);
  const engine = (settings.engine as EngineId) || 'google';
  const target = settings.target || 'cs';
  const fmt = (settings.format as OutputFormat) || 'epub';
  const say = (m: string) => setLog((l) => [...l.slice(-30), m]);
  const fail = (e: unknown) => Alert.alert('Chyba', e instanceof Error ? e.message : String(e));

  const open = async () => {
    try {
      setBusy('Načítám knihu…');
      const b = await pickBook();
      if (b) {
        setBook(b);
        setOutput(null);
        setLog([]);
        const s = bookStats(b);
        say(`Otevřeno: ${b.source} – ${s.chapters} kapitol, ${s.words.toLocaleString('cs')} slov, ${s.images} obrázků.`);
      }
    } catch (e) {
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
    try {
      const data = await pickImage();
      if (!data || !book) return;
      book.cover = addImage(book, data, 'image/jpeg');
      pruneImages(book);
      changed(book);
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
        const tr = makeTranslator(engine, target, settings);
        result = await translateBook(book, tr, target, (p) => setProgress(p.done / Math.max(1, p.total)), ctrl.signal);
        say('✓ Přeloženo.');
      }
      setBusy(`Ukládám ${OUTPUT_FORMATS.find((f) => f.id === fmt)!.label}…`);
      const out = await makeOutput(result, fmt);
      setOutput(out);
      say(`✓ Hotovo: ${out.name}`);
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

  const missingKey = ENGINES.find((e) => e.id === engine)?.needs;
  const keyMissing = translate && missingKey && !settings[missingKey];
  const stats = book ? bookStats(book) : null;

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      {!book ? (
        <View style={st.card}>
          <Text style={st.h2}>Otevřete knihu nebo dokument</Text>
          <Text style={st.muted}>EPUB, DOCX, TXT, MOBI, PDB nebo projekt .kniha.json z Překladače na počítači. Pak ji můžete přeložit, převést do jiného formátu, přidat obálku nebo obrázky.</Text>
          <Btn label="📂 Otevřít soubor" onPress={open} big disabled={!!busy} />
        </View>
      ) : (
        <>
          <View style={st.card}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={setCover} style={st.coverBox} accessibilityLabel="Změnit obálku">
                {book.cover && book.images[book.cover] ? (
                  <Image source={{ uri: `data:${book.images[book.cover].mime};base64,${toBase64(book.images[book.cover].data)}` }} style={st.cover} resizeMode="cover" />
                ) : (
                  <Text style={[st.muted, { textAlign: 'center' }]}>＋{'\n'}obálka</Text>
                )}
              </Pressable>
              <View style={{ flex: 1 }}>
                <TextInput style={st.titleInput} value={book.title} onChangeText={(t) => changed({ ...book, title: t })} placeholder="Název knihy" />
                <TextInput style={st.input} value={book.author} onChangeText={(t) => changed({ ...book, author: t })} placeholder="Autor" />
                <Text style={st.muted}>{stats!.chapters} kapitol · {stats!.words.toLocaleString('cs')} slov · {stats!.images} obrázků</Text>
              </View>
            </View>
            <View style={st.row}>
              <Btn label="🖼 Obálka" onPress={setCover} small />
              {book.cover ? <Btn label="Odebrat obálku" onPress={() => { book.cover = undefined; pruneImages(book); changed(book); }} small ghost /> : null}
              <Btn label="➕ Vložit obrázek" onPress={startInsert} small />
              <Btn label="📂 Jiná kniha" onPress={open} small ghost />
            </View>
          </View>

          <View style={st.card}>
            <Pressable style={st.switchRow} onPress={() => setTranslate(!translate)} accessibilityRole="switch" accessibilityState={{ checked: translate }}>
              <Text style={st.h2}>🌍 Přeložit</Text>
              <Text style={[st.toggle, translate && st.toggleOn]}>{translate ? 'ANO' : 'NE – jen převod'}</Text>
            </Pressable>
            {translate && (
              <>
                <Text style={st.label}>Do jazyka</Text>
                <Chips items={LANGUAGES.map((l) => ({ id: l.code, label: l.name }))} value={target} onChange={(v) => update({ target: v })} />
                <Text style={st.label}>Překladač</Text>
                <Chips items={ENGINES.map((e) => ({ id: e.id, label: e.name }))} value={engine} onChange={(v) => update({ engine: v })} />
                <Text style={st.muted}>{ENGINES.find((e) => e.id === engine)?.hint}</Text>
                {keyMissing ? (
                  <Pressable onPress={goSettings}>
                    <Text style={{ color: C.danger, marginTop: 6 }}>Chybí klíč pro tento překladač – klepnutím otevřete Nastavení.</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          <View style={st.card}>
            <Text style={st.h2}>💾 Uložit jako</Text>
            <Chips items={OUTPUT_FORMATS.map((f) => ({ id: f.id, label: f.label }))} value={fmt} onChange={(v) => update({ format: v })} />
            <Text style={st.muted}>{OUTPUT_FORMATS.find((f) => f.id === fmt)?.hint}</Text>
            {busy ? (
              <View style={{ marginTop: 12 }}>
                <View style={st.row}>
                  <ActivityIndicator color={C.primary} />
                  <Text style={{ color: C.text, flex: 1 }}>{busy}</Text>
                </View>
                {translate ? (
                  <View style={st.bar}>
                    <View style={[st.barFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                ) : null}
                <Btn label="⏹ Zastavit" onPress={() => abort.current?.abort()} ghost />
              </View>
            ) : (
              <Btn label={translate ? '▶ Přeložit a uložit' : '▶ Převést'} onPress={run} big disabled={!!keyMissing} />
            )}
            {output && !busy ? (
              <View style={st.result}>
                <Text style={{ color: C.ok, fontWeight: '700' }}>✓ {output.name}</Text>
                <View style={st.row}>
                  <Btn label="📤 Sdílet / poslat" onPress={() => shareOutput(output).catch(fail)} />
                  <Btn label="📁 Uložit do složky" onPress={() => saveOutputToFolder(output).then((n) => say(`📁 Uloženo: ${n}`)).catch(fail)} ghost />
                </View>
              </View>
            ) : null}
          </View>

          {log.length ? (
            <View style={st.card}>
              {log.map((l, i) => (
                <Text key={i} style={st.log}>{l}</Text>
              ))}
            </View>
          ) : null}

          <Modal visible={!!imgPick} animationType="slide" transparent onRequestClose={() => setImgPick(null)}>
            <View style={st.modalBack}>
              <View style={st.modal}>
                <Text style={st.h2}>Kam vložit obrázek?</Text>
                <ScrollView style={{ maxHeight: 420 }}>
                  {book.chapters.map((c, i) => (
                    <View key={i} style={st.chapterRow}>
                      <Text style={{ flex: 1, color: C.text }} numberOfLines={2}>{i + 1}. {c.title}</Text>
                      <Btn label="začátek" onPress={() => insertInto(i, 'start')} small ghost />
                      <Btn label="konec" onPress={() => insertInto(i, 'end')} small />
                    </View>
                  ))}
                </ScrollView>
                <Btn label="Zrušit" onPress={() => setImgPick(null)} ghost />
              </View>
            </View>
          </Modal>
        </>
      )}
      {busy && !book ? <ActivityIndicator style={{ marginTop: 16 }} color={C.primary} /> : null}
    </ScrollView>
  );
}

function WriteScreen() {
  return (
    <ScrollView contentContainerStyle={st.page}>
      <View style={st.card}>
        <Text style={st.h2}>✍️ Napsat knihu</Text>
        <Text style={st.muted}>
          Psaní knihy s umělou inteligencí (popis → osnova → kapitoly) přijde v další verzi aplikace. Rozepsanou knihu z počítače
          (.kniha.json) už teď otevřete na kartě Převod a překlad a uložíte do EPUB, MOBI, PDF…
        </Text>
      </View>
    </ScrollView>
  );
}

// ------------------------------------------------------------ nastavení
function SettingsScreen({ settings, update }: { settings: Settings; update: (s: Partial<Settings>) => void }) {
  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <View style={st.card}>
        <Text style={st.h2}>🔑 Klíče k překladačům</Text>
        <Text style={st.muted}>Klíče se ukládají zašifrovaně jen v tomto telefonu (Android Keystore). Google (zdarma) klíč nepotřebuje.</Text>
        <Field label="Claude – API klíč (console.anthropic.com)" value={settings.claudeKey} onChange={(v) => update({ claudeKey: v })} secret />
        <Text style={st.label}>Model Claude</Text>
        <Chips items={CLAUDE_MODELS.map((m) => ({ id: m.id, label: m.name }))} value={settings.claudeModel || DEFAULT_CLAUDE_MODEL} onChange={(v) => update({ claudeModel: v })} />
        <Field label="Google Gemini – API klíč (aistudio.google.com)" value={settings.geminiKey} onChange={(v) => update({ geminiKey: v })} secret />
        <Field label="Model Gemini" value={settings.geminiModel} placeholder={DEFAULT_GEMINI_MODEL} onChange={(v) => update({ geminiModel: v })} />
        <Field label="DeepL – API klíč (Free končí na :fx)" value={settings.deeplKey} onChange={(v) => update({ deeplKey: v })} secret />
        <Field label="OpenRouter / OpenAI-kompatibilní – API klíč" value={settings.openaiKey} onChange={(v) => update({ openaiKey: v })} secret />
        <Field label="Adresa API" value={settings.openaiBase} placeholder="https://openrouter.ai/api/v1" onChange={(v) => update({ openaiBase: v })} />
        <Field label="Model" value={settings.openaiModel} placeholder="deepseek/deepseek-chat" onChange={(v) => update({ openaiModel: v })} />
      </View>
      <View style={st.card}>
        <Text style={st.h2}>ℹ️ O aplikaci</Text>
        <Text style={st.muted}>Překladač knih pro Android 1.0 · © 2026 Micha741 · zdarma pro osobní použití.{'\n'}
          Otevře EPUB, DOCX, TXT, MOBI, PDB a projekty z Překladače na počítači; uloží EPUB, MOBI, PDF, DOCX, PDB, TXT.
          AZW3, KFX a PDF jako vstup zatím převádějte na počítači.</Text>
      </View>
    </ScrollView>
  );
}

// ------------------------------------------------------------ drobné prvky
function Btn({ label, onPress, big, small, ghost, disabled }: { label: string; onPress: () => void; big?: boolean; small?: boolean; ghost?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [st.btn, big && st.btnBig, small && st.btnSmall, ghost && st.btnGhost, (pressed || disabled) && { opacity: 0.6 }]}>
      <Text style={[st.btnText, ghost && { color: C.primary }, small && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
}

function Chips({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={st.chips}>
      {items.map((it) => (
        <Pressable key={it.id} onPress={() => onChange(it.id)} style={[st.chip, value === it.id && st.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: value === it.id }}>
          <Text style={[st.chipText, value === it.id && { color: C.primaryText }]}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, value, onChange, secret, placeholder }: { label: string; value?: string; onChange: (v: string) => void; secret?: boolean; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={st.label}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput
          style={[st.input, { flex: 1 }]}
          value={value ?? ''}
          onChangeText={(t) => onChange(t.trim())}
          secureTextEntry={secret && !show}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
        />
        {secret ? <Btn label={show ? '🙈' : '👁'} onPress={() => setShow(!show)} small ghost /> : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.border, backgroundColor: C.card },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, minHeight: 56 },
  tabText: { fontSize: 12, color: C.muted },
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: C.border },
  h2: { fontSize: 17, fontWeight: '700', color: C.text },
  muted: { color: C.muted, fontSize: 13, lineHeight: 18 },
  label: { color: C.text, fontWeight: '600', marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 6 },
  btn: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  btnBig: { paddingVertical: 14, marginTop: 10 },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 10, minHeight: 36 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.primary },
  btnText: { color: C.primaryText, fontWeight: '700', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: C.chip, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  chipOn: { backgroundColor: C.primary },
  chipText: { color: C.text, fontSize: 13 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: C.text, backgroundColor: '#fff', marginTop: 4 },
  titleInput: { fontSize: 17, fontWeight: '700', color: C.text, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 4 },
  coverBox: { width: 84, height: 120, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cover: { width: '100%', height: '100%' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { backgroundColor: C.chip, color: C.text, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', fontSize: 13 },
  toggleOn: { backgroundColor: C.ok, color: '#fff', fontWeight: '700' },
  bar: { height: 8, backgroundColor: C.border, borderRadius: 4, marginVertical: 8, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: C.primary },
  result: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#f0fdf4', gap: 4 },
  log: { color: C.text, fontSize: 12, fontFamily: 'monospace' },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 10 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderColor: C.border },
});
