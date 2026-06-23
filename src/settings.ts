import { KEYBIND_MERGE_DUMP, MODULE_ID, SETTINGS } from './constants.js';
import { toggleMergeDump } from './groups.js';

function t(key: string): string {
	return game.i18n.localize(`NIMBLE_PARTY.${key}`);
}

export function registerSettings(): void {
	game.settings.register(MODULE_ID, SETTINGS.dumpPlacement, {
		name: t('settings.dumpPlacement.name'),
		hint: t('settings.dumpPlacement.hint'),
		scope: 'world',
		config: true,
		type: String,
		choices: {
			ring: t('settings.dumpPlacement.ring'),
			original: t('settings.dumpPlacement.original'),
		},
		default: 'ring',
	});

	game.settings.register(MODULE_ID, SETTINGS.groupVision, {
		name: t('settings.groupVision.name'),
		hint: t('settings.groupVision.hint'),
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
	});

	game.settings.register(MODULE_ID, SETTINGS.aggregateHpBar, {
		name: t('settings.aggregateHpBar.name'),
		hint: t('settings.aggregateHpBar.hint'),
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
	});

	game.settings.register(MODULE_ID, SETTINGS.autoMacro, {
		name: t('settings.autoMacro.name'),
		hint: t('settings.autoMacro.hint'),
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
	});

	game.settings.register(MODULE_ID, SETTINGS.partyPortrait, {
		name: t('settings.partyPortrait.name'),
		hint: t('settings.partyPortrait.hint'),
		scope: 'world',
		config: true,
		type: String,
		default: '',
		filePicker: 'imagevideo',
	});

	game.settings.register(MODULE_ID, SETTINGS.partyToken, {
		name: t('settings.partyToken.name'),
		hint: t('settings.partyToken.hint'),
		scope: 'world',
		config: true,
		type: String,
		default: '',
		filePicker: 'imagevideo',
	});

	game.settings.register(MODULE_ID, SETTINGS.enemyPortrait, {
		name: t('settings.enemyPortrait.name'),
		hint: t('settings.enemyPortrait.hint'),
		scope: 'world',
		config: true,
		type: String,
		default: '',
		filePicker: 'imagevideo',
	});

	game.settings.register(MODULE_ID, SETTINGS.enemyToken, {
		name: t('settings.enemyToken.name'),
		hint: t('settings.enemyToken.hint'),
		scope: 'world',
		config: true,
		type: String,
		default: '',
		filePicker: 'imagevideo',
	});
}

export function registerKeybindings(): void {
	game.keybindings.register(MODULE_ID, KEYBIND_MERGE_DUMP, {
		name: t('keybindings.mergeDump.name'),
		hint: t('keybindings.mergeDump.hint'),
		editable: [{ key: 'KeyG', modifiers: ['Alt'] }],
		restricted: true, // GM only
		onDown: () => {
			void toggleMergeDump();
			return true;
		},
	});
}
