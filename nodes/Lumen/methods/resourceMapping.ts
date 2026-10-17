import { NodeOperationError, type ILoadOptionsFunctions, type ResourceMapperFields } from 'n8n-workflow';
import { lumenApiRequest } from '../transport';
import { jsonSchemaToResourceMapperFields, type JsonSchemaObject } from './schemaToFields';

export async function getProcessTemplateFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const processId = this.getNodeParameter('processTemplate', '', { extractValue: true }) as string;
	if (!processId) {
		throw new NodeOperationError(this.getNode(), 'Select a process template first', {
			level: 'warning',
		});
	}
	const additionalFields = this.getNodeParameter('additionalFields', {}) as { version?: string };
	const qs = additionalFields.version ? { version: additionalFields.version } : undefined;
	const schema = (await lumenApiRequest.call(
		this,
		'GET',
		`/process/${encodeURIComponent(processId)}/schema`,
		qs,
	)) as JsonSchemaObject;
	const fields = jsonSchemaToResourceMapperFields(schema);
	return {
		fields,
		emptyFieldsNotice: fields.length === 0 ? 'This process template has no form fields' : undefined,
	};
}
