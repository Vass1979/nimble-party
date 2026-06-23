import { ASSETS, DEFAULT_GROUP_IMAGE, GROUP_TYPE, MODULE_ID, NIMBLE_PATHS, SETTINGS } from './constants.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function t(key: string, data?: Record<string, unknown>): string {
	const full = `NIMBLE_PARTY.${key}`;
	return data ? game.i18n.format(full, data) : game.i18n.localize(full);
}

function setting<T = unknown>(key: string): T {
	try {
		return game.settings.get(MODULE_ID, key) as T;
	} catch {
		return undefined as unknown as T;
	}
}

function firstNumber(obj: unknown, paths: readonly string[]): number | null {
	for (const path of paths) {
		const raw = foundry.utils.getProperty(obj, path);
		const num = Number(raw);
		if (Number.isFinite(num)) return num;
	}
	return null;
}

export function isGroupToken(token: any): boolean {
	return token?.actor?.type === GROUP_TYPE || token?.document?.actor?.type === GROUP_TYPE;
}

export function isGroupActor(actor: any): boolean {
	return actor?.type === GROUP_TYPE;
}

/** Disposition → human label + css modifier. */
function dispositionInfo(disposition: number): { label: string; key: string } {
	const D = CONST.TOKEN_DISPOSITIONS;
	switch (disposition) {
		case D.FRIENDLY:
			return { label: t('groupName.friendly'), key: 'friendly' };
		case D.HOSTILE:
			return { label: t('groupName.hostile'), key: 'hostile' };
		case D.SECRET:
			return { label: t('groupName.secret'), key: 'secret' };
		default:
			return { label: t('groupName.neutral'), key: 'neutral' };
	}
}

/* ------------------------------------------------------------------ */
/* Live stat resolution (used by the sheet + snapshots)               */
/* ------------------------------------------------------------------ */

export interface MemberStats {
	hpValue: number;
	hpMax: number;
	hpTemp: number;
	wounds: number;
	woundsMax: number | null;
	armor: number | null;
	manaValue: number | null;
	manaMax: number | null;
}

/** Read the Nimble stat block off any actor (character / npc / minion / solo). */
export function readActorStats(actor: any): MemberStats {
	const hpValue = Number(foundry.utils.getProperty(actor, NIMBLE_PATHS.hpValue)) || 0;
	const hpMax = Number(foundry.utils.getProperty(actor, NIMBLE_PATHS.hpMax)) || 0;
	const hpTemp = Number(foundry.utils.getProperty(actor, NIMBLE_PATHS.hpTemp)) || 0;
	const wounds = Number(foundry.utils.getProperty(actor, NIMBLE_PATHS.wounds)) || 0;
	const woundsMaxRaw = foundry.utils.getProperty(actor, NIMBLE_PATHS.woundsMax);
	const armorRaw = foundry.utils.getProperty(actor, NIMBLE_PATHS.armor);

	const manaValue = firstNumber(actor, NIMBLE_PATHS.manaValue);
	const manaMax = firstNumber(actor, NIMBLE_PATHS.manaMax);

	return {
		hpValue,
		hpMax,
		hpTemp,
		wounds,
		woundsMax: Number.isFinite(Number(woundsMaxRaw)) ? Number(woundsMaxRaw) : null,
		armor: Number.isFinite(Number(armorRaw)) ? Number(armorRaw) : null,
		// Only surface mana when the actor actually has a pool (casters).
		manaValue: manaMax && manaMax > 0 ? (manaValue ?? 0) : null,
		manaMax: manaMax && manaMax > 0 ? manaMax : null,
	};
}

function countConditions(actor: any): number {
	const effects = actor?.effects?.contents ?? actor?.effects ?? [];
	let count = 0;
	for (const effect of effects) {
		if (effect?.disabled) continue;
		if (effect?.isSuppressed) continue;
		count += 1;
	}
	return count;
}

/** Resolve the world actor for a stored member (linked members only). */
export function resolveMemberActor(member: any): any | null {
	if (member?.isLinked && member?.actorId) return game.actors?.get(member.actorId) ?? null;
	return null;
}

/* ------------------------------------------------------------------ */
/* Sheet rows                                                         */
/* ------------------------------------------------------------------ */

export interface MemberRow {
	index: number;
	name: string;
	img: string;
	actorId: string;
	canOpen: boolean;
	isLinked: boolean;
	live: boolean;
	hp: { value: number; max: number; temp: number; pct: number; bloodied: boolean };
	wounds: { value: number; max: number | null };
	mana: { value: number; max: number } | null;
	armor: number | null;
	conditions: number;
}

export function buildMemberRows(groupActor: any): MemberRow[] {
	const members: any[] = groupActor?.system?.members ?? [];

	return members.map((member, index): MemberRow => {
		const live = resolveMemberActor(member);
		const stats: MemberStats = live
			? readActorStats(live)
			: {
					hpValue: member.snapshot?.hpValue ?? 0,
					hpMax: member.snapshot?.hpMax ?? 0,
					hpTemp: member.snapshot?.hpTemp ?? 0,
					wounds: member.snapshot?.wounds ?? 0,
					woundsMax: member.snapshot?.woundsMax ?? null,
					armor: member.snapshot?.armor ?? null,
					manaValue: member.snapshot?.manaValue ?? null,
					manaMax: member.snapshot?.manaMax ?? null,
				};

		const conditions = live ? countConditions(live) : 0;
		const totalHp = stats.hpValue + stats.hpTemp;
		const pct = stats.hpMax > 0 ? Math.max(0, Math.min(100, Math.round((totalHp / stats.hpMax) * 100))) : 0;

		return {
			index,
			name: member.name,
			img: member.img || DEFAULT_GROUP_IMAGE,
			actorId: member.actorId,
			canOpen: Boolean(live),
			isLinked: member.isLinked,
			live: Boolean(live),
			hp: { value: stats.hpValue, max: stats.hpMax, temp: stats.hpTemp, pct, bloodied: stats.hpMax > 0 && totalHp <= stats.hpMax / 2 },
			wounds: { value: stats.wounds, max: stats.woundsMax },
			mana: stats.manaMax && stats.manaMax > 0 ? { value: stats.manaValue ?? 0, max: stats.manaMax } : null,
			armor: stats.armor,
			conditions,
		};
	});
}

/* ------------------------------------------------------------------ */
/* Placement                                                          */
/* ------------------------------------------------------------------ */

/** A square-spiral generator yielding grid-cell offsets: (0,0), then ring by ring. */
function* spiralOffsets(): Generator<{ col: number; row: number }> {
	yield { col: 0, row: 0 };
	for (let ring = 1; ring < 64; ring += 1) {
		let col = ring;
		let row = -ring + 1;
		// right edge (top→bottom)
		for (; row <= ring; row += 1) yield { col, row };
		// bottom edge (right→left)
		for (col = ring - 1; col >= -ring; col -= 1) yield { col, row };
		// left edge (bottom→top)
		for (row = ring - 1; row >= -ring; row -= 1) yield { col, row };
		// top edge (left→right)
		for (col = -ring + 1; col <= ring; col += 1) yield { col, row };
	}
}

/**
 * Compute grid-snapped top-left coordinates fanning out around a centre point,
 * skipping the centre cell (where the group token sat).
 */
function computeRingPlacements(centerX: number, centerY: number, count: number): Array<{ x: number; y: number }> {
	const grid = canvas?.grid?.size ?? 100;
	const baseX = Math.round(centerX / grid) * grid - grid / 2;
	const baseY = Math.round(centerY / grid) * grid - grid / 2;

	const placements: Array<{ x: number; y: number }> = [];
	const gen = spiralOffsets();
	// Skip the very centre so members ring the spot rather than stack on it.
	gen.next();
	while (placements.length < count) {
		const { value } = gen.next();
		if (!value) break;
		placements.push({ x: baseX + value.col * grid, y: baseY + value.row * grid });
	}
	return placements;
}

/* ------------------------------------------------------------------ */
/* Eligibility                                                        */
/* ------------------------------------------------------------------ */

function activeCombatTokenIds(): Set<string> {
	const ids = new Set<string>();
	for (const combat of game.combats?.contents ?? []) {
		if (!combat.scene || combat.scene.id !== canvas.scene?.id) continue;
		for (const combatant of combat.combatants?.contents ?? []) {
			if (combatant.tokenId) ids.add(combatant.tokenId);
		}
	}
	return ids;
}

/* ------------------------------------------------------------------ */
/* MERGE                                                              */
/* ------------------------------------------------------------------ */

function buildMemberFromToken(token: any) {
	const doc = token.document ?? token;
	const actor = token.actor ?? doc.actor;
	const stats = actor ? readActorStats(actor) : null;

	return {
		actorId: doc.actorLink ? (actor?.id ?? '') : '',
		isLinked: Boolean(doc.actorLink),
		name: doc.name || actor?.name || 'Unknown',
		img: doc.texture?.src || actor?.img || DEFAULT_GROUP_IMAGE,
		tokenData: doc.toObject(),
		snapshot: {
			hpValue: stats?.hpValue ?? 0,
			hpMax: stats?.hpMax ?? 0,
			hpTemp: stats?.hpTemp ?? 0,
			wounds: stats?.wounds ?? 0,
			woundsMax: stats?.woundsMax ?? null,
			armor: stats?.armor ?? null,
			manaValue: stats?.manaValue ?? null,
			manaMax: stats?.manaMax ?? null,
		},
	};
}

function centreOf(tokens: any[]): { x: number; y: number } {
	const grid = canvas?.grid?.size ?? 100;
	let sx = 0;
	let sy = 0;
	for (const token of tokens) {
		const doc = token.document ?? token;
		const w = (doc.width ?? 1) * grid;
		const h = (doc.height ?? 1) * grid;
		sx += doc.x + w / 2;
		sy += doc.y + h / 2;
	}
	return { x: sx / tokens.length, y: sy / tokens.length };
}

/**
 * Item types that are part of character *building* rather than usable gear/actions.
 * They assume character-only system data (classData, etc.) and will error when
 * attached to a group actor — and you'd never invoke them as a token action.
 */
const NON_INVENTORY_ITEM_TYPES = new Set(['class', 'subclass', 'ancestry', 'background']);

/**
 * Copy every member's usable items onto the group actor so token actions
 * (lighting a torch, drinking a potion, etc.) work while merged. Copies are
 * deduplicated, never shown on the container sheet, and vanish with the group
 * actor on dump. Items are created one at a time so a single incompatible item
 * can't abort the whole batch — the torch still lands even if a feature doesn't.
 */
async function copyMemberItemsToGroup(tokens: any[], groupActor: any): Promise<number> {
	const itemData: any[] = [];
	const seenIds = new Set<string>();

	for (const token of tokens) {
		const actor = token.actor ?? (token.document ?? token).actor;
		const items = actor?.items?.contents ?? actor?.items ?? [];
		for (const item of items) {
			if (NON_INVENTORY_ITEM_TYPES.has(item.type)) continue;
			const obj = item.toObject();
			if (obj._id) {
				if (seenIds.has(obj._id)) continue;
				seenIds.add(obj._id);
			}
			delete obj._id; // fresh ids — avoids keepId validation/collisions on the group actor
			itemData.push(obj);
		}
	}

	let created = 0;
	for (const data of itemData) {
		try {
			await groupActor.createEmbeddedDocuments('Item', [data]);
			created += 1;
		} catch (error) {
			console.warn(`[${MODULE_ID}] Skipped copying item "${data?.name ?? '?'}" to the group`, error);
		}
	}
	return created;
}

async function createGroupFromTokens(tokens: any[], disposition: number): Promise<void> {
	const scene = canvas.scene;
	const info = dispositionInfo(disposition);
	const D = CONST.TOKEN_DISPOSITIONS;
	const isParty = disposition === D.FRIENDLY;

	// 1. Snapshot members BEFORE deleting anything (lossless + crash-safe).
	const members = tokens.map(buildMemberFromToken);
	const centre = centreOf(tokens);

	const giveVision = isParty && setting<boolean>(SETTINGS.groupVision) !== false;
	const aggregateBar = setting<boolean>(SETTINGS.aggregateHpBar) !== false;

	// Friendly groups use the party art; every other disposition uses the enemy
	// art. The GM can override each path in settings; blank falls back to the
	// bundled default.
	const portraitImage = isParty
		? setting<string>(SETTINGS.partyPortrait) || ASSETS.partyPortrait
		: setting<string>(SETTINGS.enemyPortrait) || ASSETS.enemyPortrait;
	const tokenImage = isParty
		? setting<string>(SETTINGS.partyToken) || ASSETS.partyToken
		: setting<string>(SETTINGS.enemyToken) || ASSETS.enemyToken;

	// 2. Create the container actor.
	const ownership = isParty
		? { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
		: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE };

	let groupActor: any = null;
	let createdTokenIds: string[] = [];
	try {
		groupActor = await Actor.create({
			name: info.label,
			type: GROUP_TYPE,
			img: portraitImage,
			ownership,
			system: {
				members,
				disposition,
				originSceneId: scene.id,
			},
			prototypeToken: {
				name: info.label,
				actorLink: true,
				disposition,
				displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
				displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
				texture: { src: tokenImage },
				sight: { enabled: giveVision },
				bar1: { attribute: aggregateBar ? 'aggregate.hp' : null },
				flags: { [MODULE_ID]: { group: true } },
			},
		});
		if (!groupActor) throw new Error('Actor.create returned null');

		// 2.5 Copy member inventory/items onto the group actor so token actions
		//     (e.g. lighting a torch) can be invoked while merged. These are
		//     throwaway copies — never rendered on the container sheet, and
		//     removed automatically when the group is dumped (the actor is
		//     deleted, and the members' originals were never touched).
		const copiedItemCount = await copyMemberItemsToGroup(tokens, groupActor);
		console.log(`[${MODULE_ID}] Copied ${copiedItemCount} item(s) onto "${info.label}"`);

		// 3. Place the group token where the cluster was.
		const tokenDoc = await groupActor.getTokenDocument({ x: Math.round(centre.x - (canvas.grid.size / 2)), y: Math.round(centre.y - (canvas.grid.size / 2)) });
		const created = await scene.createEmbeddedDocuments('Token', [tokenDoc.toObject()]);
		if (!created?.length) throw new Error('Failed to place group token');
		createdTokenIds = created.map((doc: any) => doc.id);

		// 4. Only now remove the originals — and only the ones that still exist
		//    (defends against a stale selection or a concurrent operation).
		const originalIds = tokens
			.map((token) => (token.document ?? token).id)
			.filter((id: string) => scene.tokens.has(id));
		if (originalIds.length) await scene.deleteEmbeddedDocuments('Token', originalIds);

		ui.notifications?.info(t('notifications.merged', { name: info.label, count: members.length }));
	} catch (error) {
		console.error(`[${MODULE_ID}] Merge failed`, error);
		ui.notifications?.error(t('notifications.mergeFailed'));
		// Roll back the half-built group so we never orphan an actor *or* a token.
		if (createdTokenIds.length) {
			await scene.deleteEmbeddedDocuments('Token', createdTokenIds).catch(() => undefined);
		}
		if (groupActor) await groupActor.delete().catch(() => undefined);
	}
}

/** Core: merge the currently controlled tokens, split by disposition. */
async function runMerge(): Promise<void> {
	if (!game.user?.isGM) return void ui.notifications?.warn(t('notifications.gmOnly'));
	if (!canvas?.scene) return;

	const controlled: any[] = canvas.tokens?.controlled ?? [];
	if (controlled.length < 2) return void ui.notifications?.warn(t('notifications.selectTwo'));

	// Never swallow a token that's mid-combat — it would orphan its combatant.
	const inCombat = activeCombatTokenIds();
	const eligible = controlled.filter((token) => !inCombat.has((token.document ?? token).id) && !isGroupToken(token));
	if (eligible.length < controlled.length) ui.notifications?.warn(t('notifications.skippedCombat'));
	if (eligible.length < 2) return void ui.notifications?.warn(t('notifications.selectTwo'));

	// Split by disposition so friendlies and hostiles form separate groups.
	const buckets = new Map<number, any[]>();
	for (const token of eligible) {
		const disposition = Number((token.document ?? token).disposition) || 0;
		if (!buckets.has(disposition)) buckets.set(disposition, []);
		buckets.get(disposition)!.push(token);
	}

	let skippedSingletons = false;
	for (const [disposition, bucket] of buckets) {
		if (bucket.length < 2) {
			skippedSingletons = true;
			continue;
		}
		await createGroupFromTokens(bucket, disposition);
	}
	if (skippedSingletons) ui.notifications?.info(t('notifications.skippedSingletons'));
}

/* ------------------------------------------------------------------ */
/* DUMP / EJECT                                                       */
/* ------------------------------------------------------------------ */

function placedMemberData(members: any[], placements: Array<{ x: number; y: number }>, useOriginal: boolean) {
	return members.map((member, i) => {
		const data = foundry.utils.deepClone(member.tokenData);
		delete data._id; // let Foundry assign fresh ids
		if (!useOriginal && placements[i]) {
			data.x = placements[i].x;
			data.y = placements[i].y;
		}
		return data;
	});
}

/** Find the on-canvas token for a group actor, if present. */
function findGroupToken(groupActor: any): any | null {
	const scene = canvas.scene;
	const tokenDoc = scene?.tokens?.find((td: any) => td.actorId === groupActor.id);
	return tokenDoc ?? null;
}

/** Core: dump every member of a group back onto the scene and delete the group. */
async function runDump(groupActor: any): Promise<void> {
	if (!game.user?.isGM) return void ui.notifications?.warn(t('notifications.gmOnly'));
	if (!isGroupActor(groupActor)) return;

	const scene = canvas.scene;
	const members: any[] = groupActor.system?.members ?? [];
	const groupTokenDoc = findGroupToken(groupActor);

	const grid = canvas?.grid?.size ?? 100;
	const centreX = groupTokenDoc ? groupTokenDoc.x + ((groupTokenDoc.width ?? 1) * grid) / 2 : (canvas.dimensions?.width ?? 0) / 2;
	const centreY = groupTokenDoc ? groupTokenDoc.y + ((groupTokenDoc.height ?? 1) * grid) / 2 : (canvas.dimensions?.height ?? 0) / 2;

	const useOriginal = setting<string>(SETTINGS.dumpPlacement) === 'original';
	const placements = computeRingPlacements(centreX, centreY, members.length);

	try {
		if (members.length) {
			await scene.createEmbeddedDocuments('Token', placedMemberData(members, placements, useOriginal));
		}
		if (groupTokenDoc) await scene.deleteEmbeddedDocuments('Token', [groupTokenDoc.id]);
		await groupActor.delete();
		ui.notifications?.info(t('notifications.dumped', { count: members.length }));
	} catch (error) {
		console.error(`[${MODULE_ID}] Dump failed`, error);
		ui.notifications?.error(t('notifications.dumpFailed'));
	}
}

/** Core: pop a single member out next to the group token. Auto-dumps the rest if <2 remain. */
async function runEject(groupActor: any, index: number): Promise<void> {
	if (!game.user?.isGM) return void ui.notifications?.warn(t('notifications.gmOnly'));
	if (!isGroupActor(groupActor)) return;

	const members: any[] = foundry.utils.deepClone(groupActor.system?.members ?? []);
	const member = members[index];
	if (!member) return;

	const scene = canvas.scene;
	const groupTokenDoc = findGroupToken(groupActor);
	const grid = canvas?.grid?.size ?? 100;
	const centreX = groupTokenDoc ? groupTokenDoc.x + ((groupTokenDoc.width ?? 1) * grid) / 2 : 0;
	const centreY = groupTokenDoc ? groupTokenDoc.y + ((groupTokenDoc.height ?? 1) * grid) / 2 : 0;
	const [spot] = computeRingPlacements(centreX, centreY, 1);

	try {
		const data = foundry.utils.deepClone(member.tokenData);
		delete data._id;
		if (spot) {
			data.x = spot.x;
			data.y = spot.y;
		}
		await scene.createEmbeddedDocuments('Token', [data]);

		members.splice(index, 1);
		// A group of one is pointless — dump whatever's left and dissolve.
		if (members.length < 2) {
			await groupActor.update({ 'system.members': members });
			await runDump(groupActor);
			return;
		}
		await groupActor.update({ 'system.members': members });
		ui.notifications?.info(t('notifications.ejected', { name: member.name }));
	} catch (error) {
		console.error(`[${MODULE_ID}] Eject failed`, error);
		ui.notifications?.error(t('notifications.ejectFailed'));
	}
}

/* ------------------------------------------------------------------ */
/* Smart toggle (the "press the button again" behaviour)              */
/* ------------------------------------------------------------------ */

/**
 * If the selection contains group tokens, dump them; otherwise merge the
 * selected tokens. This is what the scene-control button, keybind and macro
 * all call.
 */
async function runToggle(): Promise<void> {
	const controlled: any[] = canvas?.tokens?.controlled ?? [];
	const groups = controlled.filter((token) => isGroupToken(token));

	if (groups.length) {
		for (const token of groups) await runDump(token.actor);
		return;
	}
	await runMerge();
}

/* ------------------------------------------------------------------ */
/* Public, re-entrancy-guarded entry points                           */
/* ------------------------------------------------------------------ */

/**
 * A single in-flight lock. A double-fired UI control (e.g. a scene-control tool
 * that invokes both onClick and onChange) or an impatient double-click can no
 * longer run two merges/dumps at once — the second call is dropped while the
 * first is still resolving.
 */
let operationLock = false;

async function runExclusive(fn: () => Promise<void>): Promise<void> {
	if (operationLock) return;
	operationLock = true;
	try {
		await fn();
	} finally {
		operationLock = false;
	}
}

export const mergeControlledTokens = (): Promise<void> => runExclusive(runMerge);
export const dumpGroup = (groupActor: any): Promise<void> => runExclusive(() => runDump(groupActor));
export const ejectMember = (groupActor: any, index: number): Promise<void> =>
	runExclusive(() => runEject(groupActor, index));
export const toggleMergeDump = (): Promise<void> => runExclusive(runToggle);
