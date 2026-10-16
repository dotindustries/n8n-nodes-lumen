import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { lumenApiRequest } from '../transport';

type ProcessTemplateSummary = {
	id: string;
	name: string;
	description?: string | null;
	version?: string;
};

export async function processTemplateSearch(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const qs: IDataObject = { limit: 100 };
	if (filter) qs.search = filter;
	if (paginationToken) qs.cursor = paginationToken;
	const response = (await lumenApiRequest.call(this, 'GET', '/process', qs)) as {
		items?: ProcessTemplateSummary[];
		nextCursor?: string | null;
	};
	return {
		results: (response.items ?? []).map((template) => ({
			name: template.version ? `${template.name} (v${template.version})` : template.name,
			value: template.id,
			description: template.description ?? undefined,
		})),
		paginationToken: response.nextCursor ?? undefined,
	};
}
