import { createHmac, timingSafeEqual } from 'node:crypto';

import type { INodePropertyOptions } from 'n8n-workflow';

export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export const LUMEN_EVENT_TYPES: INodePropertyOptions[] = [
	{
		name: 'Request Cancelled',
		value: 'request.cancelled',
		description: 'A request was cancelled',
	},
	{
		name: 'Request Completed',
		value: 'request.completed',
		description: 'All steps of a request are done',
	},
	{
		name: 'Request Created',
		value: 'request.created',
		description: 'A new request was created (status draft)',
	},
	{
		name: 'Request Rejected',
		value: 'request.rejected',
		description: 'A request was rejected during validation',
	},
	{
		name: 'Request Status Changed',
		value: 'request.status_changed',
		description: 'Any request status transition (carries previousStatus)',
	},
	{
		name: 'Step Assigned',
		value: 'step.assigned',
		description: 'A step was assigned (one event per assignment)',
	},
	{
		name: 'Step Completed',
		value: 'step.completed',
		description: 'A step, action or reference process was completed',
	},
];

export function isNotFoundError(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) {
		return false;
	}
	const { httpCode } = error as { httpCode?: unknown };
	return httpCode === '404' || httpCode === 404;
}

export function sameEventSet(a: unknown, b: string[]): boolean {
	if (!Array.isArray(a)) {
		return false;
	}
	const left = new Set(a.map(String));
	const right = new Set(b);
	if (left.size !== right.size) {
		return false;
	}
	for (const value of left) {
		if (!right.has(value)) {
			return false;
		}
	}
	return true;
}

export interface SvixSignatureInput {
	secret: string;
	messageId: string;
	timestamp: string;
	signatureHeader: string;
	payload: string;
}

export function verifySvixSignature(input: SvixSignatureInput, nowSeconds: number): boolean {
	const { secret, messageId, timestamp, signatureHeader, payload } = input;
	if (!secret || !messageId || !timestamp || !signatureHeader) {
		return false;
	}
	if (!/^\d+$/.test(timestamp)) {
		return false;
	}
	const skew = Math.abs(nowSeconds - Number(timestamp));
	if (skew > SIGNATURE_TOLERANCE_SECONDS) {
		return false;
	}

	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
	if (key.length === 0) {
		return false;
	}
	const expected = Buffer.from(
		createHmac('sha256', key).update(`${messageId}.${timestamp}.${payload}`).digest('base64'),
	);

	return signatureHeader.split(' ').some((entry) => {
		const [version, signature] = entry.split(',');
		if (version !== 'v1' || !signature) {
			return false;
		}
		const candidate = Buffer.from(signature);
		return candidate.length === expected.length && timingSafeEqual(candidate, expected);
	});
}
