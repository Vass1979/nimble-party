# Nimble Party

A Foundry VTT v13 module for the [Nimble](https://github.com/Nimble-Co/FoundryVTT-Nimble) system that collapses a crowd of tokens into a single, shared **group token** so map travel stays tidy — then spills everyone back out in one click when an encounter starts.

Select your heroes, hit the button, and they merge into one token everyone can move. The group token's sheet is a container showing one row per member with their **live HP (and temp), wounds, mana, AC and active conditions**, a click-through to each character's real sheet, and a per-member eject. Press the button again with the group token selected to dump everyone back onto the scene and dissolve the group.

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

## Install

Use the manifest URL (after you publish a release):

```
https://github.com/Vass1979/nimble-party/releases/latest/download/module.json
```

## Usage

1. Drag-select two or more tokens on the canvas.
2. Click **Merge / Dump Party** in the Tokens toolbar, press **Alt+G**, use the token-HUD button, or run the macro. The tokens collapse into a group token (split by disposition).
3. Double-click the group token to open the container sheet and review the party.
4. When you're ready for combat, select the group token and trigger the action again (or click **Dump group** on the sheet) to drop everyone back onto the scene.

GM only for merging/dumping; players can move party group tokens once they exist.

## Build

```bash
npm install
npm run build      # → dist/nimble-party.js
npm run dev        # watch mode
npm run typecheck
```

Tagging a release (`vX.Y.Z`) runs the GitHub Actions workflow, which builds, stamps `module.json`, zips the module and publishes a release.

## Architecture notes

- The group token is backed by a dedicated module Actor sub-type, `nimble-party.group`, registered additively into `CONFIG.Actor.dataModels` (the system's own models are left untouched).
- Member stats on the sheet are read **live** from the linked world actor wherever possible. Unlinked tokens (e.g. duplicated enemies) have no persistent world actor once off-canvas, so their row uses a **snapshot taken at merge time** — restoration is always lossless via the stored token data either way.
- The sheet is an `ApplicationV2` / `ActorSheetV2`, and the UI consumes the Nimble system's `--nimble-*` design tokens so it reads as native.
- Foundry namespaces module sub-types as `module.type`; this module's type is therefore `nimble-party.group`.

> The bundled Foundry typings are intentionally minimal (`src/shim.d.ts`) so the project builds without the heavy `fvtt-types` dependency. Swap that in if you want full type coverage.
