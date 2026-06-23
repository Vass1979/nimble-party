/** Static identifiers shared across the module. */

export const MODULE_ID = 'nimble-party';

/** The Nimble *system* id we depend on. */
export const SYSTEM_ID = 'nimble';

/**
 * Foundry namespaces module-defined sub-types as `${moduleId}.${type}`.
 * Our group container Actor therefore has the document type `nimble-party.group`.
 */
export const GROUP_TYPE = `${MODULE_ID}.group`;

/** Default artwork for a freshly created group token / actor. */
export const DEFAULT_GROUP_IMAGE = 'icons/svg/mystery-man.svg';

/**
 * Default art by disposition. These point at Foundry's built-in core icons so
 * the module ships with no bundled artwork. Drop your own human-made art in via
 * the module settings (party/enemy portrait + token), or replace these paths.
 */
export const ASSETS = {
	partyPortrait: 'icons/svg/mystery-man.svg',
	partyToken: 'icons/svg/mystery-man.svg',
	enemyPortrait: 'icons/svg/terror.svg',
	enemyToken: 'icons/svg/terror.svg',
} as const;

/** Settings keys. */
export const SETTINGS = {
	dumpPlacement: 'dumpPlacement', // 'ring' | 'original'
	groupVision: 'groupVision', // boolean – give friendly groups token vision
	aggregateHpBar: 'aggregateHpBar', // boolean – drive token bar1 from summed party HP
	autoMacro: 'autoMacro', // boolean – create a hotbar macro on first load
	// Image overrides (blank = use the bundled default above).
	partyPortrait: 'partyPortrait',
	partyToken: 'partyToken',
	enemyPortrait: 'enemyPortrait',
	enemyToken: 'enemyToken',
} as const;

/** Keybinding action id. */
export const KEYBIND_MERGE_DUMP = 'merge-dump';

/**
 * The Nimble data paths we read for the per-member rows. Centralised so a future
 * Nimble schema change only needs touching here.
 */
export const NIMBLE_PATHS = {
	hpValue: 'system.attributes.hp.value',
	hpMax: 'system.attributes.hp.max',
	hpTemp: 'system.attributes.hp.temp',
	wounds: 'system.attributes.wounds.value',
	woundsMax: 'system.attributes.wounds.max', // derived by Nimble
	armor: 'system.attributes.armor.value',
	// Mana lives under resources (derived) with an attributes fallback.
	manaValue: ['system.resources.mana.value', 'system.attributes.mana.current'],
	manaMax: ['system.resources.mana.max', 'system.attributes.mana.baseMax'],
} as const;
