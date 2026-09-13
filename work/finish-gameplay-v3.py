from pathlib import Path

p = Path(__file__).resolve().parent / "apply-gameplay-v3.py"
s = p.read_text(encoding="utf-8")
bad = 'i = index_path.read_text(encoding="utf-8")n"'
if bad not in s:
    raise RuntimeError("Expected incomplete gameplay-v3 tail not found")
tail = r'''i = index_path.read_text(encoding="utf-8")
i = regex_once(
    i,
    r'if\(new URLSearchParams\(location\.search\)\.has\("phone"\)\)\{\s*location\.replace\("outputs/dog-jeopardy\.html"\+location\.search\+location\.hash\);\s*\}',
    'const phoneParams=new URLSearchParams(location.search);\\nif(phoneParams.has("phone")){\\n  const target=phoneParams.get("mode")==="classic"?"outputs/classic-jeopardy.html":"outputs/dog-jeopardy.html";\\n  location.replace(target+location.search+location.hash);\\n}',
    "root phone mode routing",
)
index_path.write_text(i, encoding="utf-8")

# Strengthen Classic audit so these mechanics cannot silently disappear again.
ac = audit_classic_path.read_text(encoding="utf-8")
if "CLASSIC_DAILY_DOUBLE_V1" not in ac:
    ac = replace_once(
        ac,
        "  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2'\n];",
        "  'Add Player','Player Phone Preview','volumeSlider','setVolume','classicPhonePreview','CLASSIC_PARITY_V2',\n  'CLASSIC_DAILY_DOUBLE_V1','daily-wager','classic-3','mode\\\",\\\"classic'\n];",
        "classic audit feature markers",
    )
if "twoPartCount" not in ac:
    anchor = "for(const category of pack.categories){\n  if(!category.name||!Array.isArray(category.clues)||!category.clues.length)throw new Error('Invalid category in Classic question pack');\n  for(const clue of category.clues){\n    if(!Number.isFinite(clue.value)||!clue.question||!clue.answer||!Array.isArray(clue.aliases)||!clue.aliases.length)throw new Error(`Invalid clue in ${category.name}`);\n  }\n}\n"
    replacement = anchor + "const twoPartCount=pack.categories.flatMap(category=>category.clues).filter(clue=>clue.followup).length;\nif(twoPartCount<5)throw new Error('Classic pack must include at least five two-part clues');\n"
    ac = replace_once(ac, anchor, replacement, "classic two-part audit")
audit_classic_path.write_text(ac, encoding="utf-8")

print("Applied gameplay-v3 patches")
'''
s = s.replace(bad, tail, 1)
p.write_text(s, encoding="utf-8")
print("Completed gameplay-v3 script tail")
