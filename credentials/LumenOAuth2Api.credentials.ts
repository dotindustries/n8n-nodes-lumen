import type {
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

const authHost = '{{$self["baseUrl"].replace(/\\/+$/, "").replace(/\\/v\\d+$/, "")}}';

export class LumenOAuth2Api implements ICredentialType {
	name = 'lumenOAuth2Api';

	extends = ['oAuth2Api'];

	icon: Icon = {
		light: 'file:../nodes/Lumen/lumen.svg',
		dark: 'file:../nodes/Lumen/lumen.dark.svg',
	};

	displayName = 'Lumen OAuth2 API';

	documentationUrl =
		'https://github.com/dotindustries/n8n-nodes-lumen?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://api.lumen.run/v1',
			description:
				'Lumen public API base URL. Use https://api-qa.lumen.run/v1 for the Lumen staging environment. The OAuth endpoints are derived from this URL.',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'pkce',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: `=${authHost}/api/auth/oauth2/authorize`,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: `=${authHost}/api/auth/oauth2/token`,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'openid offline_access read write',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/me',
			method: 'GET',
		},
	};
}
