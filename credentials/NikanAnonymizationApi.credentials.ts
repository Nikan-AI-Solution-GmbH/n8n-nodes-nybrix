import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  Icon,
  INodeProperties,
} from "n8n-workflow";

export class NikanAnonymizationApi implements ICredentialType {
  name = "nybrixAnonymisationApi";

  displayName = "Nybrix Anonymisation API";

  icon: Icon = {
    light: "file:../nodes/Anonymization/nybrix.light.svg",
    dark: "file:../nodes/Anonymization/nybrix.dark.svg",
  };

  documentationUrl = "https://github.com/Nikan-AI-Solution-GmbH/n8n-nodes-nybrix#credentials";

  properties: INodeProperties[] = [
    {
      displayName: "Base URL",
      name: "apiUrl",
      type: "string",
      default: "https://api.nybrix.ai",
      placeholder: "https://api.nybrix.ai",
      description: "Base URL of the nybrix Anonymisation API server",
    },
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      description: "The X-API-Key used to authenticate requests",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "X-API-Key": "={{$credentials?.apiKey}}",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials?.apiUrl}}",
      url: "/mcp",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "n8n-nybrix-anonymisation", version: "1.0" },
        },
      },
    },
  };
}
