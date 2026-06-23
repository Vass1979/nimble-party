import { GROUP_TYPE, MODULE_ID, SETTINGS, SYSTEM_ID } from './constants.js';
import { addSceneControlButton, addTokenHudButtons, ensurePartyMacro } from './controls.js';
import { NimblePartyGroupModel } from './group-data-model.js';
import { dumpGroup, mergeControlledTokens, toggleMergeDump } from './groups.js';
import { NimblePartySheet } from './party-sheet.js';
import { registerKeybindings, registerSettings } from './settings.js';

Hooks.once('init', () => {
	console.log(`${MODULE_ID} | Initialising`);

	if (game.system?.id !== SYSTEM_ID) {
		console.warn(`${MODULE_ID} | Active system is not "${SYSTEM_ID}"; some features may not work.`);
	}

	// Register the group sub-type data model (additively — never clobber the system's).
	CONFIG.Actor.dataModels ??= {};
	CONFIG.Actor.dataModels[GROUP_TYPE] = NimblePartyGroupModel;

	// Make aggregate HP selectable as a token bar for our type.
	CONFIG.Actor.trackableAttributes ??= {};
	CONFIG.Actor.trackableAttributes[GROUP_TYPE] = { bar: ['aggregate.hp'], value: [] };

	// Register the container sheet for the group type.
	foundry.documents.collections.Actors.registerSheet(MODULE_ID, NimblePartySheet, {
		types: [GROUP_TYPE],
		makeDefault: true,
		label: 'NIMBLE_PARTY.sheet.label',
	});

	registerSettings();
	registerKeybindings();
});

Hooks.once('ready', async () => {
	// Public API for macros / other modules.
	const module = game.modules.get(MODULE_ID);
	if (module) {
		module.api = {
			toggleMergeDump,
			mergeControlledTokens,
			dumpGroup,
			GROUP_TYPE,
		};
	}

	if (game.user?.isGM && game.settings.get(MODULE_ID, SETTINGS.autoMacro)) {
		await ensurePartyMacro();
	}

	console.log(`${MODULE_ID} | Ready`);
});

Hooks.on('getSceneControlButtons', (controls: any) => addSceneControlButton(controls));
Hooks.on('renderTokenHUD', (hud: any, html: any, data: any) => addTokenHudButtons(hud, html, data));
