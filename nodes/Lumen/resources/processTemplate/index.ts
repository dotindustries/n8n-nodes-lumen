import type { INodeProperties } from 'n8n-workflow';
import { cursorPagination, itemsRootProperty, processTemplateLocator } from '../shared';

const showOnlyForProcessTemplates = {
	resource: ['processTemplate'],
};

const showOnlyForProcessTemplateGetAll = {
	resource: ['processTemplate'],
	operation: ['getAll'],
};

const showOnlyForProcessTemplateGetSchema = {
	resource: ['processTemplate'],
	operation: ['getSchema'],
};

const showOnlyForProcessTemplateGetOrGetSchema = {
	resource: ['processTemplate'],
	operation: ['get', 'getSchema'],
};

export const processTemplateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForProcessTemplates,
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a process template',
				description: 'Get one process template by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/process/{{ encodeURIComponent($parameter["processTemplate"]) }}',
					},
				},
			},
			{
				name: 'Get Form Schema',
				value: 'getSchema',
				action: 'Get the form schema of a process template',
				description:
					'Get the JSON Schema describing the fields needed to create a request from a process template',
				routing: {
					request: {
						method: 'GET',
						url: '=/process/{{ encodeURIComponent($parameter["processTemplate"]) }}/schema',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many process templates',
				description: 'List the process templates of the organization',
				routing: {
					request: {
						method: 'GET',
						url: '/process',
					},
					output: {
						postReceive: [itemsRootProperty],
					},
				},
			},
		],
		default: 'getAll',
	},
	processTemplateLocator({ displayOptions: { show: showOnlyForProcessTemplateGetOrGetSchema } }),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: showOnlyForProcessTemplateGetSchema },
		options: [
			{
				displayName: 'Step',
				name: 'step',
				type: 'string',
				default: '',
				description:
					'Step ID (prs_...) or zero-based step index whose form schema to return. Defaults to the first step.',
				routing: {
					send: {
						type: 'query',
						property: 'step',
						value: '={{ $value || undefined }}',
					},
				},
			},
			{
				displayName: 'Template Version',
				name: 'version',
				type: 'string',
				default: '',
				description: 'Version of the process template. Defaults to the latest version.',
				routing: {
					send: {
						type: 'query',
						property: 'version',
						value: '={{ $value || undefined }}',
					},
				},
			},
		],
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: showOnlyForProcessTemplateGetAll },
		routing: {
			send: {
				type: 'query',
				property: 'limit',
				value: '={{ $value ? 100 : undefined }}',
				paginate: '={{ $value }}',
			},
			operations: {
				pagination: cursorPagination(['limit', 'search']),
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				...showOnlyForProcessTemplateGetAll,
				returnAll: [false],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 'limit',
				value: '={{ $value }}',
			},
		},
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		description: 'Only return process templates whose name or code contains this text',
		displayOptions: { show: showOnlyForProcessTemplateGetAll },
		routing: {
			send: {
				type: 'query',
				property: 'search',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
