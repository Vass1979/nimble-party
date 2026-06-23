# Changelog

## 1.2.1

- Fix: copied member inventory could fail to appear on the group actor (so token actions like lighting a torch didn't work). Items are now copied one at a time with fresh ids, and character-building item types (class, subclass, ancestry, background) are skipped — these assume character-only data and could abort the whole copy batch, taking the usable gear down with them. A console line reports how many items were copied.

## 1.2.0

- Group tokens and actors now use bundled custom art by disposition: friendly groups get the party portrait + token, every other disposition gets the enemy portrait + token.
- Added module settings (Configure Settings → Nimble Party) to override each image — party portrait, party token, enemy portrait, enemy token — via a file picker. Blank uses the bundled default.

## 1.1.0

- Group actors now hold a copy of every member's inventory/items, so token actions (e.g. lighting a torch) can be invoked from the group token while merged. The copies are never shown on the container sheet and are removed automatically on dump — the members' originals are never touched.
- Removed the per-row "Pan to & select token" button from the container sheet.

## 1.0.2

- Fix: creating a group could fail with `Cannot read properties of undefined (reading 'sizeCategory')`. The Nimble system reads `system.attributes.sizeCategory` and `system.attributes.hp` on every actor during data preparation; the group data model now provides a compatible `attributes` block (with HP populated from the member aggregate), so group actors prepare cleanly.

## 1.0.1

- Fix: merging from the scene-control toolbar button could fire twice on a single click (the tool wired both `onClick` and `onChange`), creating a duplicate, actor-less "ghost" group token. Removed the redundant handler and added an in-flight operation lock so no merge/dump can run concurrently.
- Fix: a failed merge now also removes the group token it had already placed, not just the group actor, so a mid-merge error can never leave an orphaned token behind.
- Hardening: the merge step only deletes original tokens that still exist on the scene.

## 1.0.0

Initial release.

- Merge selected tokens into a shared group token, split automatically by disposition.
- Container sheet with live per-member HP (incl. temp), wounds, mana (casters), AC and condition count.
- Member portrait click-through to the real sheet, ping-to-locate, and per-member eject.
- Dump the whole group back onto the scene (ring fan-out or original positions).
- Aggregate party HP bar on the group token.
- Friendly group tokens are owned by all players and granted vision; enemy groups stay GM-controlled.
- Scene-control button, Alt+G keybinding, contextual token-HUD button, and an auto-created hotbar macro.
- Crash-safe snapshotting; tokens already in combat are skipped.
