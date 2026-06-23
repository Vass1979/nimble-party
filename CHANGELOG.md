# Changelog

## 1.0.0

First public release.

- Merge the selected tokens into a single shared group token to declutter map travel, then dump them all back onto the scene with one click to start an encounter.
- Selections are split by disposition, so friendlies and hostiles form separate groups (party vs. enemy group).
- Container sheet showing one row per member with live HP (and temp), wounds, mana (casters), AC and active conditions, a click-through to each member's sheet, and a per-member eject.
- Set your own party and enemy portraits + tokens (applied automatically by disposition) in the module settings; ships with no bundled artwork and falls back to Foundry's built-in icons.
- Member inventory is copied onto the group actor so token actions (e.g. lighting a torch) work while merged, then cleaned up on dump.
- Aggregate party HP bar on the group token.
- Trigger from the scene-control toolbar, an Alt+G keybinding, a hotbar macro, or a contextual token-HUD button.
- GM-only merge/dump; party group tokens are owned by all players so anyone can move them. Vision is granted to party tokens, and tokens already in combat are skipped to protect the tracker.
