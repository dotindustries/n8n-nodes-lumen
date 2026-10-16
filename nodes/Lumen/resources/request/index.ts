import type { INodeProperties } from 'n8n-workflow';
import { buildCreateRequestBody, requestCreateDescription } from './create';
import { requestGetDescription } from './get';
import { requestGetAllDescription } from './getAll';
import { itemsRootProperty } from '../shared';

const showOnlyForRequests = {
	resource: ['request'],
};

export const requestDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForRequests,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a request',
				description: 'Start a new request from a process template',
				routing: {
					request: {
						method: 'POST',
						url: '/request',
					},
					send: {
						preSend: [buildCreateRequestBody],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a request',
				description: 'Get a request by ID or display code',
				routing: {
					request: {
						method: 'GET',
						url: '=/request/{{ encodeURIComponent($parameter["requestId"]) }}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many requests',
				description: 'List requests, newest updates first',
				routing: {
					request: {
						method: 'GET',
						url: '/request',
					},
					output: {
						postReceive: [itemsRootProperty],
					},
				},
			},
		],
		default: 'create',
	},
	...requestCreateDescription,
	...requestGetDescription,
	...requestGetAllDescription,
];
