import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class NikanAnonymizationApi implements ICredentialType {
	name = 'nikanAnonymizationApi';

	displayName = 'Nikan Anonymization API';

	icon: Icon = {
		light: 'file:../nodes/Anonymization/anonymization.svg',
		dark: 'file:../nodes/Anonymization/anonymization.dark.svg',
	};

	documentationUrl = 'https://github.com/nikan-ai/n8n-nodes-nikan-anonymization#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'apiUrl',
			type: 'string',
			default: 'http://localhost:8000',
			placeholder: 'https://api.your-org.example.com',
			description: 'Base URL of the Nikan Anonymization MCP server',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'The X-API-Key used to authenticate requests',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.apiUrl}}',
			url: '/mcp',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json, text/event-stream',
			},
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
		},
	};
}
