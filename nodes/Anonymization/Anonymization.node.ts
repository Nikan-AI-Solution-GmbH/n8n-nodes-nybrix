import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { delay as lodashDelay } from 'lodash';
import { mcpInitialize, mcpToolCall } from './transport';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => lodashDelay(resolve, ms));

export class Anonymization implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nikan Anonymization',
		name: 'anonymization',
		icon: { light: 'file:anonymization.svg', dark: 'file:anonymization.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Anonymize or deanonymize text using the Nikan Anonymization API',
		defaults: {
			name: 'Nikan Anonymization',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'nikanAnonymizationApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Anonymize',
						value: 'anonymize',
						description: 'Replace sensitive entities in text with pseudonyms',
						action: 'Anonymize text',
					},
					{
						name: 'Deanonymize',
						value: 'deanonymize',
						description: 'Restore original text from an anonymized version',
						action: 'Deanonymize text',
					},
				],
				default: 'anonymize',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				description: 'The text to process',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						default: 60,
						typeOptions: { minValue: 1 },
						description: 'Maximum number of status checks before timing out',
					},
					{
						displayName: 'Polling Interval (Ms)',
						name: 'pollingInterval',
						type: 'number',
						default: 1000,
						typeOptions: { minValue: 100 },
						description: 'Milliseconds to wait between status checks',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const text = this.getNodeParameter('text', i) as string;
				const options = this.getNodeParameter('options', i, {}) as {
					pollingInterval?: number;
					maxRetries?: number;
				};
				const pollingInterval = options.pollingInterval ?? 1000;
				const maxRetries = options.maxRetries ?? 60;

				const mode = operation === 'anonymize' ? '1' : '2';
				const encodedText = Buffer.from(text, 'utf-8').toString('base64');

				const sessionId = await mcpInitialize.call(this);

				let startResult: string;
				try {
					startResult = await mcpToolCall.call(
						this,
						'start_transformation',
						{ text: encodedText, mode },
						sessionId,
					);
				} catch (err) {
					if (/quota exceeded/i.test((err as Error).message)) {
						throw new NodeOperationError(
							this.getNode(),
							'API key quota exceeded. Please rebalance your subscription or contact support at support@nikan.ai.',
							{ itemIndex: i },
						);
					}
					throw new NodeOperationError(this.getNode(), err as Error, { itemIndex: i });
				}

				if (startResult === 'Unauthorized') {
					throw new NodeOperationError(
						this.getNode(),
						'Authentication failed. Check your API key.',
						{ itemIndex: i },
					);
				}

				const requestId = startResult;
				let result: string | undefined;

				for (let attempt = 0; attempt < maxRetries; attempt++) {
					await sleep(pollingInterval);

					const pollResult = await mcpToolCall.call(
						this,
						'retrieve_result',
						{ request_id: requestId },
						sessionId,
					);

					if (pollResult === 'Still processing.') {
						continue;
					}

					if (pollResult === 'Request ID not found.') {
						throw new NodeOperationError(
							this.getNode(),
							'Request ID not found on server. The job may have expired.',
							{ itemIndex: i },
						);
					}

					result = pollResult.replace(/\n\nFictitious Entity Maps:[\s\S]*$/, '');
					break;
				}

				if (result === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`Transformation timed out after ${maxRetries} attempts (${(maxRetries * pollingInterval) / 1000}s)`,
						{ itemIndex: i },
					);
				}

				returnData.push({
					json: {
						requestId,
						result,
						operation,
					},
					pairedItem: i,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { ...items[i].json, error: (error as Error).message },
						error: error as NodeOperationError,
						pairedItem: i,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
