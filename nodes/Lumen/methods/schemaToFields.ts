import type { FieldType, INodePropertyOptions, ResourceMapperField } from 'n8n-workflow';

type EnumValue = string | number | boolean;

type JsonSchemaProperty = {
	type?: string | string[];
	title?: string;
	description?: string;
	format?: string;
	enum?: EnumValue[];
	oneOf?: Array<{ const?: EnumValue; title?: string }>;
	default?: unknown;
	items?: JsonSchemaProperty;
	'x-lumen-order'?: number;
	'x-lumen-options'?: EnumValue[];
	'x-lumen-multiple'?: boolean;
	'x-lumen-enum-labels'?: Record<string, string>;
};

export type JsonSchemaObject = {
	properties?: Record<string, JsonSchemaProperty | null>;
	required?: string[];
};

export type MultiValueEncoding = 'array' | 'csv';

export interface LumenMapperField extends ResourceMapperField {
	lumenMultiValue?: MultiValueEncoding;
}

function primaryType(type: string | string[] | undefined): string | undefined {
	if (Array.isArray(type)) {
		return type.find((t) => t !== 'null');
	}
	return type;
}

function toFieldType(property: JsonSchemaProperty): FieldType {
	const type = primaryType(property.type);
	if (type === 'string' && (property.format === 'date-time' || property.format === 'date')) {
		return 'dateTime';
	}
	switch (type) {
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'array':
			return 'array';
		case 'object':
			return 'object';
		default:
			return 'string';
	}
}

function isEnumValue(value: unknown): value is EnumValue {
	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function hasChoices(property: JsonSchemaProperty | undefined): boolean {
	if (!property) return false;
	return (
		(property.oneOf?.length ?? 0) > 0 ||
		(property.enum?.length ?? 0) > 0 ||
		(property['x-lumen-options']?.length ?? 0) > 0
	);
}

function toOptions(property: JsonSchemaProperty): INodePropertyOptions[] | undefined {
	const source = hasChoices(property) ? property : property.items;
	if (!source || !hasChoices(source)) return undefined;
	const labels: Record<string, string> = {
		...(property.items?.['x-lumen-enum-labels'] ?? {}),
		...(property['x-lumen-enum-labels'] ?? {}),
	};
	if (source.oneOf && source.oneOf.length > 0) {
		const options = source.oneOf
			.filter((entry) => isEnumValue(entry.const))
			.map((entry) => ({
				name: entry.title ?? labels[String(entry.const)] ?? String(entry.const),
				value: entry.const as EnumValue,
			}));
		return options.length > 0 ? options : undefined;
	}
	const values = (source.enum ?? source['x-lumen-options'] ?? []).filter(
		(value) => isEnumValue(value) && value !== '',
	);
	if (values.length === 0) return undefined;
	return values.map((value) => ({ name: labels[String(value)] ?? String(value), value }));
}

function multiValueEncoding(property: JsonSchemaProperty): MultiValueEncoding | undefined {
	if (primaryType(property.type) === 'array') return 'array';
	if (property['x-lumen-multiple'] === true) return 'csv';
	return undefined;
}

export function formatAllowedValues(options: INodePropertyOptions[]): string {
	return options
		.map((option) =>
			option.name === String(option.value)
				? String(option.value)
				: `${String(option.value)} (${option.name})`,
		)
		.join(', ');
}

export function multiValueDisplayName(title: string, options: INodePropertyOptions[]): string {
	return `${title} (any of: ${options.map((option) => String(option.value)).join(', ')})`;
}

export function stripMultiValueSuffix(displayName: string): string {
	return displayName.replace(/ \(any of: .*\)$/, '');
}

function toDefaultValue(value: unknown): string | number | boolean | null | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	if (Array.isArray(value) && value.every(isEnumValue)) {
		return value.map(String).join(',');
	}
	return undefined;
}

function sortOrder(property: JsonSchemaProperty): number {
	const explicit = property['x-lumen-order'];
	if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
	const match = /sortOrder:\s*(-?\d+)/.exec(property.description ?? '');
	return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function jsonSchemaToResourceMapperFields(schema: JsonSchemaObject): LumenMapperField[] {
	const required = new Set(schema.required ?? []);
	const entries = Object.entries(schema.properties ?? {}).filter(
		(entry): entry is [string, JsonSchemaProperty] => entry[1] !== null && typeof entry[1] === 'object',
	);
	entries.sort((a, b) => sortOrder(a[1]) - sortOrder(b[1]) || a[0].localeCompare(b[0]));
	return entries.map(([id, property]) => {
		const options = toOptions(property);
		const title = property.title ?? id;
		const field: LumenMapperField = {
			id,
			displayName: title,
			required: required.has(id),
			defaultMatch: false,
			canBeUsedToMatch: false,
			display: true,
			type: toFieldType(property),
			defaultValue: toDefaultValue(property.default),
		};
		if (!options) return field;
		const encoding = multiValueEncoding(property);
		if (encoding) {
			return {
				...field,
				type: 'string',
				displayName: multiValueDisplayName(title, options),
				options,
				lumenMultiValue: encoding,
			};
		}
		return { ...field, type: 'options', options };
	});
}
