import type {
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

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
				'Lumen public API base URL. Use https://api-qa.lumen.run/v1 for the Lumen staging environment.',
		},
		{
			displayName: 'Auth Base URL',
			name: 'authBaseUrl',
			type: 'string',
			required: true,
			default: 'https://app.lumen.run/api/auth',
			description:
				'Base URL of the Lumen OAuth2 authorization server (the issuer). Use https://app-qa.lumen.run/api/auth for the Lumen staging environment.',
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
			default: '={{$self["authBaseUrl"].replace(/\\/+$/, "")}}/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '={{$self["authBaseUrl"].replace(/\\/+$/, "")}}/oauth2/token',
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
