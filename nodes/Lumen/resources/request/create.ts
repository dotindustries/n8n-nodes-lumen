import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
	ResourceMapperValue,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { processTemplateLocator } from '../shared';
import {
	formatAllowedValues,
	stripMultiValueSuffix,
	type LumenMapperField,
} from '../../methods/schemaToFields';

const showOnlyForRequestCreate = {
	resource: ['request'],
	operation: ['create'],
};

export async function buildCreateRequestBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const processId = this.getNodeParameter('processTemplate', '', { extractValue: true }) as string;
	if (!processId) {
		throw new NodeOperationError(this.getNode(), 'Process Template is required');
	}
	const fields = this.getNodeParameter('fields', {}) as Partial<ResourceMapperValue>;
	const additionalFields = this.getNodeParameter('additionalFields', {}) as {
		version?: string;
		metadata?: string | IDataObject;
	};

	let data: IDataObject = {};
	if (fields.mappingMode === 'autoMapInputData') {
		const item = this.getInputData().json;
		const knownIds = new Set((fields.schema ?? []).map((field) => field.id));
		for (const [key, value] of Object.entries(item)) {
			if (knownIds.size === 0 || knownIds.has(key)) data[key] = value as IDataObject[string];
		}
	} else {
		data = { ...(fields.value ?? {}) } as IDataObject;
	}
	for (const key of Object.keys(data)) {
		if (data[key] === undefined || data[key] === null) delete data[key];
	}
	for (const field of (fields.schema ?? []) as LumenMapperField[]) {
		if (!field.lumenMultiValue || !(field.id in data)) continue;
		const values = normalizeMultiValue.call(this, field, data[field.id]);
		if (values.length === 0) {
			delete data[field.id];
			continue;
		}
		data[field.id] = field.lumenMultiValue === 'array' ? values : values.join(',');
	}

	const body: IDataObject = {
		process: {
			id: processId,
			...(additionalFields.version ? { version: additionalFields.version } : {}),
		},
		data,
	};

	if (additionalFields.metadata !== undefined && additionalFields.metadata !== '') {
		let metadata = additionalFields.metadata;
		if (typeof metadata === 'string') {
			try {
				metadata = JSON.parse(metadata) as IDataObject;
			} catch {
				throw new NodeOperationError(this.getNode(), 'Metadata must be valid JSON');
			}
		}
		body.metadata = metadata;
	}

	return { ...requestOptions, body };
}

function normalizeMultiValue(
	this: IExecuteSingleFunctions,
	field: LumenMapperField,
	raw: unknown,
): string[] {
	const label = stripMultiValueSuffix(field.displayName);
	const options = field.options ?? [];
	const allowed = new Set(options.map((option) => String(option.value)));
	let values: string[];
	if (Array.isArray(raw)) {
		values = raw.map((value) => String(value).trim());
	} else if (typeof raw === 'string') {
		values = raw.split(',').map((value) => value.trim());
	} else if (raw === undefined || raw === null) {
		values = [];
	} else {
		throw new NodeOperationError(
			this.getNode(),
			`Field "${label}" must be a comma-separated string or an array of values. Allowed values: ${formatAllowedValues(options)}`,
		);
	}
	values = [...new Set(values.filter((value) => value !== ''))];
	const invalid = values.filter((value) => !allowed.has(value));
	if (invalid.length > 0) {
		const list = invalid.map((value) => `"${value}"`).join(', ');
		throw new NodeOperationError(
			this.getNode(),
			`Field "${label}" does not allow ${list}. Allowed values: ${formatAllowedValues(options)}`,
		);
	}
	return values;
}

export const requestCreateDescription: INodeProperties[] = [
	processTemplateLocator({ displayOptions: { show: showOnlyForRequestCreate } }),
	{
		displayName: 'Form Fields',
		name: 'fields',
		type: 'resourceMapper',
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		noDataExpression: true,
		required: true,
		displayOptions: { show: showOnlyForRequestCreate },
		typeOptions: {
			loadOptionsDependsOn: ['processTemplate.value', 'additionalFields.version'],
			resourceMapper: {
				resourceMapperMethod: 'getProcessTemplateFields',
				mode: 'add',
				fieldWords: {
					singular: 'field',
					plural: 'fields',
				},
				addAllFields: true,
				supportAutoMap: true,
				noFieldsError: 'Select a process template to load its form fields',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForRequestCreate },
		options: [
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '',
				description:
					'Arbitrary JSON object stored on the request, for example references to the originating system',
			},
			{
				displayName: 'Template Version',
				name: 'version',
				type: 'string',
				default: '',
				description:
					'Version of the process template to use. Defaults to the latest version.',
			},
		],
	},
];
