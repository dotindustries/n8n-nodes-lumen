import type { INodeProperties } from 'n8n-workflow';

export const PROCESS_ID_REGEX = '^prc_[A-Za-z0-9]+$';

export function processTemplateLocator(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Process Template',
		name: 'processTemplate',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The Lumen process template to use',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'processTemplateSearch',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. prc_01hzx...',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: PROCESS_ID_REGEX,
							errorMessage: 'Not a valid Lumen process template ID (expected prc_...)',
						},
					},
				],
			},
		],
		...overrides,
	};
}

export function cursorPagination(queryParameters: string[]) {
	const qs: Record<string, string> = {
		cursor: '={{ $response.body?.nextCursor }}',
	};
	for (const name of queryParameters) {
		qs[name] = `={{ $request.qs?.${name} }}`;
	}
	return {
		type: 'generic' as const,
		properties: {
			continue: '={{ !!$response.body?.nextCursor }}',
			request: {
				qs,
			},
		},
	};
}

export const itemsRootProperty = {
	type: 'rootProperty' as const,
	properties: {
		property: 'items',
	},
};
