import type { INodeProperties } from 'n8n-workflow';
import { cursorPagination } from '../shared';

const showOnlyForRequestGetAll = {
	resource: ['request'],
	operation: ['getAll'],
};

export const requestGetAllDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: showOnlyForRequestGetAll },
		routing: {
			send: {
				type: 'query',
				property: 'limit',
				value: '={{ $value ? 100 : undefined }}',
				paginate: '={{ $value }}',
			},
			operations: {
				pagination: cursorPagination([
					'limit',
					'status',
					'processId',
					'updatedAfter',
					'createdAfter',
				]),
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
				...showOnlyForRequestGetAll,
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
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showOnlyForRequestGetAll },
		options: [
			{
				displayName: 'Created After',
				name: 'createdAfter',
				type: 'dateTime',
				default: '',
				description: 'Only return requests created after this date and time',
				routing: {
					send: {
						type: 'query',
						property: 'createdAfter',
						value: '={{ $value ? new Date($value).toISOString() : undefined }}',
					},
				},
			},
			{
				displayName: 'Process Template ID',
				name: 'processId',
				type: 'string',
				default: '',
				placeholder: 'e.g. prc_01hzx...',
				description: 'Only return requests created from this process template',
				routing: {
					send: {
						type: 'query',
						property: 'processId',
						value: '={{ $value || undefined }}',
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				description: 'Only return requests in one of the selected statuses',
				options: [
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Completed', value: 'completed' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'New', value: 'new' },
					{ name: 'On Hold', value: 'onhold' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Running', value: 'running' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'status',
						value: '={{ $value && $value.length ? $value.join(",") : undefined }}',
					},
				},
			},
			{
				displayName: 'Updated After',
				name: 'updatedAfter',
				type: 'dateTime',
				default: '',
				description: 'Only return requests updated after this date and time',
				routing: {
					send: {
						type: 'query',
						property: 'updatedAfter',
						value: '={{ $value ? new Date($value).toISOString() : undefined }}',
					},
				},
			},
		],
	},
];
