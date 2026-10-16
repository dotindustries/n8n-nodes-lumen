import type { FieldType, INodePropertyOptions, ResourceMapperField } from 'n8n-workflow';

type JsonSchemaProperty = {
	type?: string | string[];
	title?: string;
	description?: string;
	format?: string;
	enum?: Array<string | number | boolean>;
	default?: unknown;
	items?: JsonSchemaProperty;
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

function toOptions(property: JsonSchemaProperty): INodePropertyOptions[] | undefined {
	const values = property.enum ?? property.items?.enum;
	if (!values || values.length === 0) return undefined;
	return values.map((value) => ({ name: String(value), value: value as string | number | boolean }));
}

function toDefaultValue(value: unknown): string | number | boolean | null | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	return undefined;
}

function sortOrder(property: JsonSchemaProperty): number {
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
