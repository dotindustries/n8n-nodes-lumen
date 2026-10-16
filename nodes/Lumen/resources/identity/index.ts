import type { INodeProperties } from 'n8n-workflow';

export const identityDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['identity'],
			},
		},
		options: [
			{
				name: 'Get Current Actor',
				value: 'getMe',
				action: 'Get the current actor',
				description: 'Return the user or app the credential authenticates as',
				routing: {
					request: {
						method: 'GET',
						url: '/me',
					},
				},
			},
		],
		default: 'getMe',
	},
];
