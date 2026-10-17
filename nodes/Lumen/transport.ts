import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

type LumenContext = ILoadOptionsFunctions | IExecuteSingleFunctions;

export function getCredentialTypeName(this: LumenContext): string {
	const authentication = this.getNodeParameter('authentication', 'apiKey') as string;
	return authentication === 'oAuth2' ? 'lumenOAuth2Api' : 'lumenApi';
}

export async function lumenApiRequest(
	this: LumenContext,
	method: IHttpRequestMethods,
	endpoint: string,
	qs?: IDataObject,
	body?: IDataObject,
): Promise<IDataObject> {
	const credentialType = getCredentialTypeName.call(this);
	const credentials = await this.getCredentials(credentialType);
	const baseURL = String(credentials.baseUrl ?? 'https://api.lumen.run/v1').replace(/\/+$/, '');
	return (await this.helpers.httpRequestWithAuthentication.call(this, credentialType, {
		method,
		url: `${baseURL}${endpoint}`,
		qs,
		body,
		json: true,
		headers: { Accept: 'application/json' },
	})) as IDataObject;
}
