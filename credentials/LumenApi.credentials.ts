import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class LumenApi implements ICredentialType {
	name = 'lumenApi';

	icon: Icon = {
		light: 'file:../nodes/Lumen/lumen.svg',
		dark: 'file:../nodes/Lumen/lumen.dark.svg',
	};

	displayName = 'Lumen API';

	documentationUrl =
		'https://github.com/dotindustries/n8n-nodes-lumen?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'lum-...',
			description:
				'Personal API key created in Lumen under Settings > Developers. Keys start with "lum-".',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://api.lumen.run/v1',
			description:
				'Lumen public API base URL. Use https://api-qa.lumen.run/v1 for the Lumen staging environment.',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'string',
			default: '',
			description:
				'Optional. Sent as the x-lumen-org-id header to pick the organization when the API key belongs to more than one.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
				'x-lumen-org-id': '={{$credentials.organizationId || undefined}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/me',
			method: 'GET',
		},
	};
}
