import type {
	IDataObject,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { lumenApiRequest } from '../Lumen/transport';
import {
	LUMEN_EVENT_TYPES,
	isNotFoundError,
	sameEventSet,
	verifySvixSignature,
} from './GenericFunctions';

export class LumenTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lumen Trigger',
		name: 'lumenTrigger',
		icon: { light: 'file:../Lumen/lumen.svg', dark: 'file:../Lumen/lumen.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a Lumen request or step event happens',
		defaults: {
			name: 'Lumen Trigger',
		},
		inputs: [],
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
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				responseData: 'noData',
				path: 'webhook',
			},
		],
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
				displayName: 'Event Names or IDs',
				name: 'events',
				type: 'multiOptions',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getEventTypes',
					loadOptionsDependsOn: ['authentication'],
				},
				default: [],
				description:
					'The Lumen request and step events that start this workflow. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Process Template ID',
				name: 'processId',
				type: 'string',
				default: '',
				placeholder: 'prc_...',
				description:
					'Optional. Only trigger for requests created from this process template. Events for other templates are acknowledged but ignored.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getEventTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const response = await lumenApiRequest.call(this, 'GET', '/webhooks/event-types');
					const items = Array.isArray(response.items) ? (response.items as IDataObject[]) : [];
					const options = items
						.filter((item) => typeof item.name === 'string' && item.name !== '')
						.map((item) => {
							const value = String(item.name);
							const known = LUMEN_EVENT_TYPES.find((entry) => entry.value === value);
							return {
								name: known?.name ?? value,
								value,
								description: String(item.description ?? known?.description ?? ''),
							};
						})
						.sort((a, b) => a.name.localeCompare(b.name));
					if (options.length > 0) {
						return options;
					}
				} catch (error) {
					this.logger.warn(
						`Lumen Trigger: could not load event types from the API, using the built-in list (${String(
							(error as Error).message,
						)})`,
					);
				}
				return LUMEN_EVENT_TYPES;
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;
				if (!webhookId) {
					return false;
				}

				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events', []) as string[];

				let existing: IDataObject;
				try {
					existing = await lumenApiRequest.call(
						this,
						'GET',
						`/webhooks/${encodeURIComponent(webhookId)}`,
					);
				} catch (error) {
					if (isNotFoundError(error)) {
						this.logger.info(
							`Lumen Trigger: webhook ${webhookId} no longer exists in Lumen, it will be re-created`,
						);
						delete staticData.webhookId;
						delete staticData.webhookSecret;
						return false;
					}
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}

				if (existing.url === webhookUrl && sameEventSet(existing.events, events)) {
					return true;
				}

				this.logger.info(
					`Lumen Trigger: webhook ${webhookId} has a different URL or event list, re-creating it`,
				);
				try {
					await lumenApiRequest.call(
						this,
						'DELETE',
						`/webhooks/${encodeURIComponent(webhookId)}`,
					);
				} catch (error) {
					if (!isNotFoundError(error)) {
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
					this.logger.info(`Lumen Trigger: webhook ${webhookId} was already deleted`);
				}
				delete staticData.webhookId;
				delete staticData.webhookSecret;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) {
					throw new NodeOperationError(this.getNode(), 'Could not determine the webhook URL');
				}
				const events = this.getNodeParameter('events', []) as string[];
				if (events.length === 0) {
					throw new NodeOperationError(this.getNode(), 'Select at least one event');
				}

				const workflow = this.getWorkflow();
				const response = await lumenApiRequest.call(this, 'POST', '/webhooks', undefined, {
					url: webhookUrl,
					events,
					description: `n8n workflow ${workflow.id ?? 'unsaved'}: ${workflow.name ?? this.getNode().name}`,
				});

				if (typeof response.id !== 'string' || typeof response.secret !== 'string') {
					throw new NodeOperationError(
						this.getNode(),
						'Lumen did not return a webhook id and signing secret',
					);
				}

				const staticData = this.getWorkflowStaticData('node');
				staticData.webhookId = response.id;
				staticData.webhookSecret = response.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;
				if (!webhookId) {
					return true;
				}

				try {
					await lumenApiRequest.call(
						this,
						'DELETE',
						`/webhooks/${encodeURIComponent(webhookId)}`,
					);
				} catch (error) {
					if (!isNotFoundError(error)) {
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
					this.logger.info(`Lumen Trigger: webhook ${webhookId} was already deleted in Lumen`);
				}

				delete staticData.webhookId;
				delete staticData.webhookSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();
		const headers = this.getHeaderData();
		const staticData = this.getWorkflowStaticData('node');
		const secret = staticData.webhookSecret as string | undefined;

		const headerValue = (name: string): string => {
			const value = headers[name];
			return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
		};

		const rawBody = req.rawBody;
		const payload = Buffer.isBuffer(rawBody)
			? rawBody.toString('utf8')
			: typeof rawBody === 'string'
				? rawBody
				: JSON.stringify(this.getBodyData());

		const valid =
			secret !== undefined &&
			verifySvixSignature(
				{
					secret,
					messageId: headerValue('svix-id'),
					timestamp: headerValue('svix-timestamp'),
					signatureHeader: headerValue('svix-signature'),
					payload,
				},
				Math.floor(Date.now() / 1000),
			);

		if (!valid) {
			res.status(401).send('Unauthorized').end();
			return { noWebhookResponse: true };
		}

		const body = this.getBodyData();
		const processId = (this.getNodeParameter('processId', '') as string).trim();
		if (processId) {
			const request = (body.data as IDataObject | undefined)?.request as IDataObject | undefined;
			if (request?.processId !== processId) {
				return {};
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
