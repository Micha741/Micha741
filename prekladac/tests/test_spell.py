import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import spell  # noqa: E402

WORDS = ["kniha", "knihovna", "knihomil", "Praha", "drak", "večer", "přijel", "Knihová"]


def make_dict(folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "cs_CZ.aff").write_text("SET UTF-8\nTRY aeiouykhnr\n", encoding="utf-8")
    (folder / "cs_CZ.dic").write_text(f"{len(WORDS)}\n" + "\n".join(WORDS) + "\n", encoding="utf-8")
    return folder / "cs_CZ"


@pytest.fixture
def sp(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    make_dict(tmp_path / "appdata" / "Prekladac" / "dict")
    base = spell.find_dictionary()
    assert base is not None
    return spell.Speller(base)


def test_check_and_suggest(sp):
    assert sp.check("kniha") and sp.check("Praha") and sp.check("Kniha")
    assert not sp.check("knyha")
    assert "kniha" in sp.suggest("knyha")
    assert sp.check("DPH")  # zkratky velkými písmeny se nekontrolují


def test_user_dictionary_persists(sp, tmp_path):
    assert not sp.check("Ferda")
    sp.add_word("Ferda")
    assert sp.check("Ferda")
    assert "Ferda" in spell.user_dict_path().read_text(encoding="utf-8")
    again = spell.Speller(spell.find_dictionary())
    assert again.check("Ferda")
    sp.ignore("xyzw")
    assert sp.check("xyzw")


def test_completions_prefer_text_and_case(sp):
    learned = spell.learn_words("Kniha ležela na stole. Knihovnice přinesla knihovnu.")
    out = sp.completions("knih", learned)
    assert out[0] == "kniha"            # z textu; velké K jen kvůli začátku věty
    assert "knihovnu" in out and "knihovna" in out
    assert out.index("knihovna") < out.index("Knihová")  # obecná slova před příjmeními
    assert sp.completions("Knih", learned)[0] == "Kniha"
    assert sp.completions("kn") == []    # od 3 písmen


def test_match_case():
    assert spell.match_case("PRA", "Praha") == "PRAHA"
    assert spell.match_case("pra", "Praha") == "Praha"
    assert spell.match_case("Kni", "kniha") == "Kniha"
