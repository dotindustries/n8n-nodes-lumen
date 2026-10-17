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
	'x-lumen-enum-labels'?: Record<string, string>;
};

export type JsonSchemaObject = {
	properties?: Record<string, JsonSchemaProperty | null>;
	required?: string[];
};

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

function toOptions(property: JsonSchemaProperty): INodePropertyOptions[] | undefined {
	const source = property.enum || property.oneOf ? property : property.items;
	if (!source) return undefined;
	const labels = source['x-lumen-enum-labels'] ?? {};
	if (source.oneOf && source.oneOf.length > 0) {
		const options = source.oneOf
			.filter((entry) => isEnumValue(entry.const))
			.map((entry) => ({
				name: entry.title ?? labels[String(entry.const)] ?? String(entry.const),
				value: entry.const as EnumValue,
			}));
		return options.length > 0 ? options : undefined;
	}
	const values = source.enum?.filter((value) => value !== '');
	if (!values || values.length === 0) return undefined;
	return values.map((value) => ({ name: labels[String(value)] ?? String(value), value }));
}

function toDefaultValue(value: unknown): string | number | boolean | null | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	return undefined;
}

function sortOrder(property: JsonSchemaProperty): number {
	const explicit = property['x-lumen-order'];
	if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
	const match = /sortOrder:\s*(-?\d+)/.exec(property.description ?? '');
	return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function jsonSchemaToResourceMapperFields(schema: JsonSchemaObject): ResourceMapperField[] {
	const required = new Set(schema.required ?? []);
	const entries = Object.entries(schema.properties ?? {}).filter(
		(entry): entry is [string, JsonSchemaProperty] => entry[1] !== null && typeof entry[1] === 'object',
	);
	entries.sort((a, b) => sortOrder(a[1]) - sortOrder(b[1]) || a[0].localeCompare(b[0]));
	return entries.map(([id, property]) => {
		const options = toOptions(property);
		const baseType = toFieldType(property);
		return {
			id,
			displayName: property.title ?? id,
			required: required.has(id),
			defaultMatch: false,
			canBeUsedToMatch: false,
			display: true,
			type: options && baseType !== 'array' ? 'options' : baseType,
			options,
			defaultValue: toDefaultValue(property.default),
		};
	});
}
