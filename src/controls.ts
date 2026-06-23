import { MODULE_ID } from './constants.js';
import { dumpGroup, isGroupToken, mergeControlledTokens, toggleMergeDump } from './groups.js';

function t(key: string): string {
	return game.i18n.localize(`NIMBLE_PARTY.${key}`);
}

/* ------------------------------------------------------------------ */
/* Scene controls                                                     */
/* ------------------------------------------------------------------ */

/**
 * Add a single smart "Merge / Dump party" tool to the Tokens control group.
 * v13 may hand us `controls` as an array or as a keyed record, so we handle both
 * (mirroring how the Nimble system guards this).
 */
export function addSceneControlButton(controls: any): void {
	if (!game.user?.isGM) return;

	const tool = {
		name: 'nimble-party-merge',
		title: t('controls.toggle'),
		icon: 'fa-solid fa-people-group',
		button: true,
		visible: true,
		order: 99,
		// Only one handler — wiring both onClick and onChange double-fires the
		// merge on a single toolbar click. The operation lock guards this too.
		onClick: () => void toggleMergeDump(),
	};

	// Record form (Foundry v13 canonical).
	if (!Array.isArray(controls)) {
		const tokenControl = controls.tokens ?? controls.token;
		if (!tokenControl) return;
		tokenControl.tools ??= {};
		if (Array.isArray(tokenControl.tools)) tokenControl.tools.push(tool);
		else tokenControl.tools[tool.name] = tool;
		return;
	}

	// Array form (defensive).
	const tokenControl = controls.find((c: any) => c.name === 'token' || c.name === 'tokens');
	if (!tokenControl) return;
	tokenControl.tools ??= [];
	if (Array.isArray(tokenControl.tools)) tokenControl.tools.push(tool);
	else tokenControl.tools[tool.name] = tool;
}

/* ------------------------------------------------------------------ */
/* Token HUD                                                          */
/* ------------------------------------------------------------------ */

/**
 * Add a contextual button to the token HUD:
 *  - on a group token → "Dump"
 *  - otherwise, when 2+ tokens are selected → "Merge"
 */
export function addTokenHudButtons(hud: any, html: any, tokenData: any): void {
	if (!game.user?.isGM) return;

	const root: HTMLElement = html instanceof HTMLElement ? html : html?.[0];
	if (!root) return;

	const token = hud?.object;
	const column = root.querySelector('.col.left') ?? root.querySelector('.col.right') ?? root;

	const makeButton = (icon: string, title: string, onClick: () => void) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'control-icon nimble-party-hud';
		button.dataset.tooltip = title;
		button.setAttribute('aria-label', title);
		button.innerHTML = `<i class="${icon}"></i>`;
		button.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			onClick();
		});
		return button;
	};

	if (isGroupToken(token)) {
		column.appendChild(makeButton('fa-solid fa-people-arrows', t('controls.dump'), () => void dumpGroup(token.actor)));
		return;
	}

	const controlledCount = canvas?.tokens?.controlled?.length ?? 0;
	if (controlledCount >= 2) {
		column.appendChild(makeButton('fa-solid fa-people-group', t('controls.merge'), () => void mergeControlledTokens()));
	}
}

/* ------------------------------------------------------------------ */
/* Hotbar macro                                                       */
/* ------------------------------------------------------------------ */

const MACRO_COMMAND = `// Nimble Party — merge selected tokens, or dump the selected group token.
game.modules.get('${MODULE_ID}')?.api?.toggleMergeDump();`;

/** Ensure a reusable "Nimble Party" script macro exists (GM only, once). */
export async function ensurePartyMacro(): Promise<void> {
	if (!game.user?.isGM) return;
	const name = t('macro.name');
	const existing = game.macros?.find((m: any) => m.name === name && m.getFlag(MODULE_ID, 'partyMacro'));
	if (existing) return;

	await Macro.create({
		name,
		type: 'script',
		img: 'icons/svg/combat.svg',
		command: MACRO_COMMAND,
		flags: { [MODULE_ID]: { partyMacro: true } },
	}).catch(() => undefined);
}
