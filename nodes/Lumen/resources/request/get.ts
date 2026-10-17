import type { INodeProperties } from 'n8n-workflow';

export const requestGetDescription: INodeProperties[] = [
	{
		displayName: 'Request ID or Display Code',
		name: 'requestId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. req_01hzx... or BREP-42',
		description: 'The request ID (req_...) or its display code as shown in Lumen',
		displayOptions: {
			show: {
				resource: ['request'],
				operation: ['get'],
			},
		},
	},
];
