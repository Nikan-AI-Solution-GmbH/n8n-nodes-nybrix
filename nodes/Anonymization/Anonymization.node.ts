import { delay as lodashDelay } from "lodash";
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from "n8n-workflow";
import { NodeConnectionTypes, NodeOperationError } from "n8n-workflow";
import { mcpInitialize, mcpToolCall } from "./transport";

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => lodashDelay(resolve, ms));

export class Anonymization implements INodeType {
	description: INodeTypeDescription = {
		displayName: "nybrix Anonymisation",
		name: "anonymization",
		icon: { light: "file:nybrix.svg", dark: "file:nybrix.svg" },
		group: ["transform"],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			"Anonymise or deanonymise text using the nybrix Anonymisation API",
		defaults: {
			name: "nybrix Anonymisation",
		},
		codex: {
			categories: ["AI", "Transform"],
			subcategories: {
				AI: ["Text Processing"],
			},
			resources: {
				primaryDocumentation: [
					{
						url: "https://github.com/nikan-ai/n8n-nodes-nybrix-anonymisation",
					},
				],
			},
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: "nybrixAnonymisationApi",
				required: true,
			},
		],
		properties: [
			{
				displayName: "Operation",
				name: "operation",
				type: "options",
				noDataExpression: true,
				options: [
					{
						name: "Anonymise",
						value: "anonymise",
						description: "Replace sensitive entities in text with pseudonyms",
						action: "Anonymise text",
					},
					{
						name: "Deanonymise",
						value: "deanonymise",
						description: "Restore original text from an anonymised version",
						action: "Deanonymise text",
					},
				],
				default: "anonymise",
			},
			{
				displayName: "Text",
				name: "text",
				type: "string",
				typeOptions: { rows: 4 },
				default: "",
				required: true,
				description: "The text to process",
			},
			{
				displayName: "Options",
				name: "options",
				type: "collection",
				placeholder: "Add Option",
				default: {},
				options: [
					{
						displayName: "Max Retries",
						name: "maxRetries",
						type: "number",
						default: 60,
						typeOptions: { minValue: 1 },
						description: "Maximum number of status checks before timing out",
					},
					{
						displayName: "Polling Interval (Ms)",
						name: "pollingInterval",
						type: "number",
						default: 1000,
						typeOptions: { minValue: 100 },
						description: "Milliseconds to wait between status checks",
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
				const operation = this.getNodeParameter("operation", i) as string;
				const text = this.getNodeParameter("text", i) as string;
				const options = this.getNodeParameter("options", i, {}) as {
					pollingInterval?: number;
					maxRetries?: number;
				};
				const pollingInterval = options.pollingInterval ?? 1000;
				const maxRetries = options.maxRetries ?? 60;

				const mode = operation === "anonymise" ? "1" : "2";
				const encodedText = Buffer.from(text, "utf-8").toString("base64");

				const sessionId = await mcpInitialize.call(this);

				let startResult: string;
				try {
					startResult = await mcpToolCall.call(
						this,
						"start_transformation",
						{ text: encodedText, mode },
						sessionId,
					);
				} catch (err) {
					if (/quota exceeded/i.test((err as Error).message)) {
						throw new NodeOperationError(
							this.getNode(),
							"API key quota exceeded. Please rebalance your subscription or contact support at support@nikan.ai.",
							{ itemIndex: i },
						);
					}
					throw new NodeOperationError(this.getNode(), err as Error, {
						itemIndex: i,
					});
				}

				if (startResult === "Unauthorized") {
					throw new NodeOperationError(
						this.getNode(),
						"Authentication failed. Check your API key.",
						{ itemIndex: i },
					);
				}

				const requestId = startResult;
				let result: string | undefined;

				for (let attempt = 0; attempt < maxRetries; attempt++) {
					await sleep(pollingInterval);

					const pollResult = await mcpToolCall.call(
						this,
						"retrieve_result",
						{ request_id: requestId },
						sessionId,
					);

					if (pollResult === "Still processing.") {
						continue;
					}

					if (pollResult === "Request ID not found.") {
						throw new NodeOperationError(
							this.getNode(),
							"Request ID not found on server. The job may have expired.",
							{ itemIndex: i },
						);
					}

					result = pollResult.replace(
						/\n\nFictitious Entity Maps:[\s\S]*$/,
						"",
					);
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
					throw new NodeOperationError(this.getNode(), error as Error, {
						itemIndex: i,
					});
				}
			}
		}

		return [returnData];
	}
}
