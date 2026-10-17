import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { getProcessTemplateFields, processTemplateSearch } from './methods';
import { identityDescription } from './resources/identity';
import { processTemplateDescription } from './resources/processTemplate';
import { requestDescription } from './resources/request';

export class Lumen implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lumen',
		name: 'lumen',
		icon: { light: 'file:lumen.svg', dark: 'file:lumen.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create and look up Lumen requests and process templates',
		defaults: {
			name: 'Lumen',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'lumenApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'lumenOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'apiKey',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Identity',
						value: 'identity',
					},
					{
						name: 'Process Template',
						value: 'processTemplate',
					},
					{
						name: 'Request',
						value: 'request',
					},
				],
				default: 'request',
			},
			...requestDescription,
			...processTemplateDescription,
			...identityDescription,
		],
	};

	methods = {
		listSearch: {
			processTemplateSearch,
		},
		resourceMapping: {
			getProcessTemplateFields,
		},
	};
}
