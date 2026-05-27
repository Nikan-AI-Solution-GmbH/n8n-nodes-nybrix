import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

interface McpToolResponse {
	jsonrpc: string;
	id: number;
	result?: { content: Array<{ type: string; text: string }> };
	error?: { code: number; message: string };
}

type McpContext = IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions;

function parseResponse(raw: unknown): McpToolResponse {
	if (typeof raw === 'string') {
		let last: McpToolResponse | null = null;
		for (const line of (raw as string).split('\n')) {
			if (line.startsWith('data:')) {
				try {
					last = JSON.parse(line.slice(5).trim()) as McpToolResponse;
				} catch {
					// skip malformed lines
				}
			}
		}
		return last ?? { jsonrpc: '2.0', id: 0 };
	}
	return raw as McpToolResponse;
}

function buildHeaders(sessionId?: string): Record<string, string> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json, text/event-stream',
	};
	if (sessionId) headers['mcp-session-id'] = sessionId;
	return headers;
}

function extractSessionId(full: unknown): string | undefined {
	if (full && typeof full === 'object' && 'headers' in full) {
		const h = (full as { headers: Record<string, string> }).headers;
		return h?.['mcp-session-id'];
	}
	return undefined;
}

export async function mcpInitialize(this: McpContext): Promise<string | undefined> {
	const credentials = await this.getCredentials('nikanAnonymizationApi');
	const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');

	const initFull = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'nikanAnonymizationApi',
		{
			method: 'POST',
			url: `${apiUrl}/mcp`,
			headers: buildHeaders(),
			body: {
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {},
					clientInfo: { name: 'n8n-nikan-anonymization', version: '1.0' },
				},
			},
			json: true,
			returnFullResponse: true,
		} as IHttpRequestOptions,
	);

	let sessionId = extractSessionId(initFull);
	console.log('[MCP] initialize full response type:', typeof initFull);
	console.log('[MCP] initialize keys:', initFull && typeof initFull === 'object' ? Object.keys(initFull as object).join(', ') : String(initFull));
	console.log('[MCP] sessionId after initialize:', sessionId);

	// Send notifications/initialized — also capture session ID from its response headers
	try {
		const notifFull = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'nikanAnonymizationApi',
			{
				method: 'POST',
				url: `${apiUrl}/mcp`,
				headers: buildHeaders(sessionId),
				body: { jsonrpc: '2.0', method: 'notifications/initialized' },
				json: true,
				returnFullResponse: true,
			} as IHttpRequestOptions,
		);
		const notifSid = extractSessionId(notifFull);
		if (notifSid) sessionId = notifSid;
		console.log('[MCP] notification response type:', typeof notifFull);
		console.log('[MCP] sessionId after notification:', sessionId);
	} catch (e) {
		console.log('[MCP] notification error (may be 202 No Content):', (e as Error).message);
	}

	return sessionId;
}

export async function mcpToolCall(
	this: McpContext,
	toolName: string,
	args: IDataObject = {},
	sessionId?: string,
): Promise<string> {
	const credentials = await this.getCredentials('nikanAnonymizationApi');
	const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${apiUrl}/mcp`,
		headers: buildHeaders(sessionId),
		body: {
			jsonrpc: '2.0',
			method: 'tools/call',
			params: { name: toolName, arguments: args },
			id: Date.now(),
		},
		json: true,
	};

	console.log(`[MCP] tool call "${toolName}" with sessionId:`, sessionId ?? '(none)');
	const rawResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'nikanAnonymizationApi',
		options,
	);
	console.log('[MCP] raw response type:', typeof rawResponse);
	if (typeof rawResponse === 'string') console.log('[MCP] raw SSE:', rawResponse.slice(0, 300));

	const response = parseResponse(rawResponse);

	if (response.error) {
		throw new NodeOperationError(
			this.getNode(),
			`MCP API error (${response.error.code}): ${response.error.message}`,
		);
	}

	return response.result?.content?.[0]?.text ?? '';
}
