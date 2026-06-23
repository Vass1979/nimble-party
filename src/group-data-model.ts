import { DEFAULT_GROUP_IMAGE } from './constants.js';

/**
 * Data model for the `nimble-party.group` Actor sub-type.
 *
 * A group actor is a lightweight, transient "container". It does not hold any
 * resources of its own — it stores a snapshot of each merged token so the dump
 * operation is lossless, and derives an aggregate HP pool (used to drive the
 * group token's health bar) from its members.
 *
 * Member stats shown on the sheet are read *live* from the linked world actor
 * wherever possible; the stored `snapshot` is only a fallback for unlinked
 * tokens (e.g. duplicated enemies) whose stats live in their token delta and
 * have no persistent world actor to read once the token leaves the canvas.
 */

const fields = foundry.data.fields;

function memberSchema() {
	return new fields.SchemaField({
		/** World actor id for linked members; '' for unlinked (snapshot-only). */
		actorId: new fields.StringField({ required: true, initial: '', nullable: false }),
		/** Whether the source token was actor-linked at merge time. */
		isLinked: new fields.BooleanField({ required: true, initial: false }),
		name: new fields.StringField({ required: true, initial: 'Unknown', nullable: false }),
		img: new fields.StringField({ required: true, initial: DEFAULT_GROUP_IMAGE, nullable: false }),
		/** Full `TokenDocument#toObject()` snapshot used to recreate the token on dump. */
		tokenData: new fields.ObjectField({ required: true, nullable: false }),
		/** Stat snapshot taken at merge time — fallback display for unlinked members. */
		snapshot: new fields.SchemaField({
			hpValue: new fields.NumberField({ required: true, initial: 0, nullable: false }),
			hpMax: new fields.NumberField({ required: true, initial: 0, nullable: false }),
			hpTemp: new fields.NumberField({ required: true, initial: 0, nullable: false }),
			wounds: new fields.NumberField({ required: true, initial: 0, nullable: false }),
			woundsMax: new fields.NumberField({ required: true, initial: 0, nullable: true }),
			armor: new fields.NumberField({ required: true, initial: 0, nullable: true }),
			manaValue: new fields.NumberField({ required: false, initial: null, nullable: true }),
			manaMax: new fields.NumberField({ required: false, initial: null, nullable: true }),
		}),
	});
}

export class NimblePartyGroupModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		return {
			/**
			 * The Nimble system's base Actor class reads `system.attributes.sizeCategory`
			 * and `system.attributes.hp.{value,max}` for EVERY actor during data
			 * preparation (it assumes all actors share that shape). We therefore
			 * surface a compatible `attributes` block. `hp` is populated from the
			 * aggregate in prepareDerivedData and also drives the group token bar.
			 */
			attributes: new fields.SchemaField({
				sizeCategory: new fields.StringField({ required: false, initial: '', nullable: true }),
				hp: new fields.SchemaField({
					value: new fields.NumberField({ required: true, initial: 0, nullable: false }),
					max: new fields.NumberField({ required: true, initial: 0, nullable: false }),
					temp: new fields.NumberField({ required: true, initial: 0, nullable: false }),
				}),
			}),
			members: new fields.ArrayField(memberSchema(), { required: true, initial: [] }),
			/** TOKEN_DISPOSITIONS value the group was formed from. */
			disposition: new fields.NumberField({ required: true, initial: 0, nullable: false }),
			/** Scene the group was created on (for context / safety). */
			originSceneId: new fields.StringField({ required: true, initial: '', nullable: false }),
			/** Free-text note, currently unused but handy for macros. */
			note: new fields.StringField({ required: false, initial: '', nullable: false }),
		};
	}

	declare attributes: { sizeCategory: string; hp: { value: number; max: number; temp: number } };
	declare members: any[];
	declare disposition: number;
	declare originSceneId: string;
	declare aggregate: { hp: { value: number; max: number } };

	/**
	 * Sum member HP into `system.attributes.hp` (drives the group token bar and
	 * keeps the system's base data prep happy) plus a convenience `aggregate`.
	 */
	prepareDerivedData() {
		let current = 0;
		let temp = 0;
		let max = 0;

		for (const member of this.members ?? []) {
			const live = member.isLinked && member.actorId ? game?.actors?.get(member.actorId) : null;

			if (live) {
				current += Number(foundry.utils.getProperty(live, 'system.attributes.hp.value')) || 0;
				temp += Number(foundry.utils.getProperty(live, 'system.attributes.hp.temp')) || 0;
				max += Number(foundry.utils.getProperty(live, 'system.attributes.hp.max')) || 0;
			} else {
				current += Number(member.snapshot?.hpValue) || 0;
				temp += Number(member.snapshot?.hpTemp) || 0;
				max += Number(member.snapshot?.hpMax) || 0;
			}
		}

		this.attributes.hp.value = current;
		this.attributes.hp.temp = temp;
		this.attributes.hp.max = max;
		this.aggregate = { hp: { value: current + temp, max } };
	}
}
