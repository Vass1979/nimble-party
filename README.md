# Nimble Party

A Foundry VTT v13 module for the [Nimble](https://github.com/Nimble-Co/FoundryVTT-Nimble) system that collapses a crowd of tokens into a single, shared **group token** so map travel stays tidy — then spills everyone back out in one click when an encounter starts.

Select your heroes, hit the button, and they merge into one token everyone can move. The group token's sheet is a container showing one row per member with their **live HP (and temp), wounds, mana, Armor and active conditions**, a click-through to each character's real sheet, and a per-member eject. Press the button again with the group token selected to dump everyone back onto the scene and dissolve the group.

It works for any disposition, so you can bundle enemies into an "Enemy Group" the same way — selections are automatically split by disposition into separate groups.

## Features

- **Merge** the selected tokens into a shared group token (parties are owned by all players so anyone can move them; enemy groups stay GM-controlled).
- **Container sheet** with live per-member HP / wounds / mana / AC / conditions, member portraits, sheet click-through, ping-to-locate, and eject.
- **Dump** the whole group back onto the scene, fanned out around the group token (or restored to original positions — your choice).
- **Disposition-aware**: friendly, hostile, neutral and secret selections form separate groups.
- **Aggregate HP bar** on the group token, summed from members, for an at-a-glance travel health read.
- **Custom group art**: set your own party and enemy portraits + tokens (used automatically by disposition) from the module settings with a file picker. Ships with no bundled artwork — group tokens use Foundry's built-in icons until you supply your own.
- **Vision** on friendly group tokens so players aren't blinded while travelling.
- Triggerable from the **scene controls** toolbar, a **keybinding** (Alt+G by default), the **token HUD** (a contextual merge/dump button), or a **hotbar macro** created for you on first load.
- Lossless and crash-safe: each token is fully snapshotted before anything is deleted, and the snapshot is stored on the group actor (so dumps survive reloads). Tokens already in combat are skipped to avoid orphaning their combatant.
