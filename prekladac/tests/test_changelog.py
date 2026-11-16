"""Historie verzí: nahoře „Nová verze“ (číslo dosadí sestavení na GitHubu), pod ní vydané verze od nejnovější."""
import re
from pathlib import Path

CHANGELOG = Path(__file__).resolve().parents[1] / "assets" / "changelog.md"


def test_history_has_new_version_on_top_and_descending_numbers():
    text = CHANGELOG.read_text(encoding="utf-8")
    hist = text.split("# Historie verzí", 1)[1].split("\n# ", 1)[0]
    heads = re.findall(r"^\*\*(.+?)\*\*", hist, re.M)
    assert heads[0] == "Nová verze" and text.count("**Nová verze**") == 1
    nums = [int(m.group(1)) for h in heads[1:] if (m := re.match(r"1\.0\.(\d+)", h))]
    assert nums == sorted(nums, reverse=True) and len(nums) >= 10


def test_workflow_stamps_new_version():
    wf = (CHANGELOG.parents[2] / ".github" / "workflows" / "prekladac.yml").read_text(encoding="utf-8")
    assert '"**Nová verze**"' in wf and "assets\\changelog.md" in wf
