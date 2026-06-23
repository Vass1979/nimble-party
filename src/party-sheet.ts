import { MODULE_ID } from './constants.js';
import { buildMemberRows, dumpGroup, ejectMember, resolveMemberActor } from './groups.js';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Read-only "container" sheet: one row per merged token showing live HP / wounds
 * / mana / AC / conditions, with a click-through to each member's real sheet and
 * per-row eject + a dump-all control.
 */
export class NimblePartySheet extends HandlebarsApplicationMixin(ActorSheetV2) {
	static DEFAULT_OPTIONS = {
		classes: ['nimble', 'nimble-party', 'sheet', 'actor'],
		position: { width: 540, height: 'auto' as const },
		window: { resizable: true, icon: 'fa-solid fa-people-group' },
		actions: {
			openMember: NimblePartySheet.onOpenMember,
			ejectMember: NimblePartySheet.onEjectMember,
			dumpAll: NimblePartySheet.onDumpAll,
		},
	};

	static PARTS = {
		body: { template: `modules/${MODULE_ID}/templates/party-sheet.hbs` },
	};

	get title(): string {
		return this.actor?.name ?? 'Party';
	}

	async _prepareContext(_options: unknown) {
		const rows = buildMemberRows(this.actor);
		const aggregate = this.actor?.system?.aggregate?.hp ?? { value: 0, max: 0 };
		const pct = aggregate.max > 0 ? Math.max(0, Math.min(100, Math.round((aggregate.value / aggregate.max) * 100))) : 0;

		return {
			actor: this.actor,
			isGM: game.user?.isGM ?? false,
			rows,
			memberCount: rows.length,
			aggregate: { ...aggregate, pct },
		};
	}

	/* --------------------------------------------------------------- */

	private static memberIndex(target: HTMLElement): number {
		const row = target.closest<HTMLElement>('[data-index]');
		return Number(row?.dataset.index ?? '-1');
	}

	static async onOpenMember(this: NimblePartySheet, _event: Event, target: HTMLElement) {
		const index = NimblePartySheet.memberIndex(target);
		const member = this.actor.system.members?.[index];
		const actor = resolveMemberActor(member);
		if (actor) actor.sheet.render(true);
		else ui.notifications?.info(game.i18n.localize('NIMBLE_PARTY.notifications.noLiveActor'));
	}

	static async onEjectMember(this: NimblePartySheet, _event: Event, target: HTMLElement) {
		const index = NimblePartySheet.memberIndex(target);
		await ejectMember(this.actor, index);
	}

	static async onDumpAll(this: NimblePartySheet) {
		await dumpGroup(this.actor);
	}
}
