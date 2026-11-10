package expo.modules.mlkittranslate

import com.google.android.gms.tasks.Tasks
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class UnsupportedLanguageException(lang: String) :
  CodedException("Jazyk „$lang“ překlad v telefonu (ML Kit) nepodporuje.")

/**
 * Offline překlad v telefonu přes Google ML Kit. Jazykové modely (~30 MB na jazyk) se stáhnou
 * jednou a pak se překládá bez internetu. AsyncFunction běží mimo hlavní vlákno, proto Tasks.await.
 */
class MlkitTranslateModule : Module() {
  private val translators = HashMap<String, Translator>()

  private fun lang(code: String): String =
    TranslateLanguage.fromLanguageTag(code) ?: throw UnsupportedLanguageException(code)

  private fun translator(source: String, target: String): Translator {
    val key = "$source>$target"
    return synchronized(translators) {
      translators.getOrPut(key) {
        Translation.getClient(
          TranslatorOptions.Builder().setSourceLanguage(lang(source)).setTargetLanguage(lang(target)).build()
        )
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MlkitTranslate")

    Function("supportedLanguages") {
      TranslateLanguage.getAllLanguages()
    }

    AsyncFunction("identifyLanguage") { text: String ->
      val client = LanguageIdentification.getClient()
      try {
        Tasks.await(client.identifyLanguage(text.take(2000)))
      } finally {
        client.close()
      }
    }

    AsyncFunction("downloadedLanguages") {
      val models = Tasks.await(RemoteModelManager.getInstance().getDownloadedModels(TranslateRemoteModel::class.java))
      models.map { it.language }
    }

    AsyncFunction("downloadLanguage") { code: String, wifiOnly: Boolean ->
      val conditions = DownloadConditions.Builder().apply { if (wifiOnly) requireWifi() }.build()
      val model = TranslateRemoteModel.Builder(lang(code)).build()
      Tasks.await(RemoteModelManager.getInstance().download(model, conditions))
      true
    }

    AsyncFunction("deleteLanguage") { code: String ->
      val model = TranslateRemoteModel.Builder(lang(code)).build()
      Tasks.await(RemoteModelManager.getInstance().deleteDownloadedModel(model))
      true
    }

    AsyncFunction("translate") { texts: List<String>, source: String, target: String, wifiOnly: Boolean ->
      val t = translator(source, target)
      val conditions = DownloadConditions.Builder().apply { if (wifiOnly) requireWifi() }.build()
      Tasks.await(t.downloadModelIfNeeded(conditions))
      texts.map { if (it.isBlank()) it else Tasks.await(t.translate(it)) }
    }

    OnDestroy {
      synchronized(translators) {
        translators.values.forEach { it.close() }
        translators.clear()
      }
    }
  }
}
