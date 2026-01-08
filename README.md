# MCP Server for Google Veo

A Model Context Protocol (MCP) server that provides integration with Google Veo, Google's advanced video generation AI model.

## Available Implementations

This repository provides **two complete implementations**:

- **[TypeScript/Node.js](/)** - Located in the root directory (this README)
- **[Python](python/)** - Located in the `python/` directory

Both implementations provide identical functionality. Choose based on your development environment and preferences.

## Features

- **Video Generation**: Generate videos from text prompts using Google Veo
- **Status Tracking**: Monitor the progress of video generation jobs
- **Model Discovery**: List available Google AI models
- **MCP Compliant**: Fully compatible with the Model Context Protocol specification

## Available Tools

### 1. `generate_video`
Generate a video using Google Veo based on a text prompt.

**Parameters:**
- `prompt` (string, required): Text description of the video to generate
- `duration` (number, optional): Duration in seconds (default: 5, max: 8)
- `aspectRatio` (string, optional): One of "16:9", "9:16", "1:1" (default: "16:9")
- `resolution` (string, optional): One of "720p", "1080p", "4k" (default: "1080p")

**Returns:**
```json
{
  "videoId": "veo_1234567890_abc123",
  "status": "processing"
}
```

### 2. `get_video_status`
Check the status of a video generation job.

**Parameters:**
- `videoId` (string, required): The video ID returned from `generate_video`

**Returns:**
```json
{
  "videoId": "veo_1234567890_abc123",
  "status": "completed",
  "progress": 100,
  "videoUrl": "https://example.com/videos/veo_1234567890_abc123.mp4"
}
```

### 3. `list_models`
List available Google AI models.

**Returns:**
```json
{
  "models": [
    {
      "name": "models/gemini-pro",
      "displayName": "Gemini Pro",
      "description": "...",
      "supportedGenerationMethods": ["generateContent"]
    }
  ]
}
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google AI API key with Veo access

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd MCP_server_veo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Google AI API key to `.env`:
```
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

5. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

The MCP server communicates over stdio:

```bash
npm start
```

### Running the Demo Client

To see the server in action with a demo client:

```bash
npm run client
```

This will:
1. Connect to the MCP server
2. List available tools
3. Generate a sample video
4. Check the video generation status
5. Display the results

### Integration with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-veo": {
      "command": "node",
      "args": ["/absolute/path/to/MCP_server_veo/dist/server.js"],
      "env": {
        "GOOGLE_AI_API_KEY": "your_google_ai_api_key_here"
      }
    }
  }
}
```

Replace `/absolute/path/to/MCP_server_veo` with the actual path to this repository.

### Integration with Other MCP Clients

Any MCP-compatible client can connect to this server via stdio. Example using the MCP SDK:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

const serverProcess = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    GOOGLE_AI_API_KEY: 'your_api_key_here',
  },
});

const transport = new StdioClientTransport({
  reader: serverProcess.stdout,
  writer: serverProcess.stdin,
});

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);

// Use the tools
const result = await client.callTool({
  name: 'generate_video',
  arguments: {
    prompt: 'A beautiful mountain landscape at dawn',
    duration: 5,
    aspectRatio: '16:9',
  },
});
```

## API Access Notes

**Important:** As of early 2025, Google Veo API access is limited and may require:
- Waitlist approval
- Access through Google Cloud Vertex AI
- Specific API credentials

This implementation provides the MCP server structure and demonstrates the workflow. For production use, you'll need to:

1. Obtain proper Veo API access from Google
2. Update the `generateVideo()` function in `src/server.ts` to use the actual Veo API endpoints
3. Implement proper authentication and error handling for the Veo service

The current implementation includes placeholder/simulation logic for demonstration purposes.

## Development

### Project Structure

```
MCP_server_veo/
├── src/
│   ├── server.ts      # MCP server implementation
│   ├── client.ts      # Demo client
│   └── types.ts       # TypeScript type definitions
├── dist/              # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

### Building

```bash
npm run build
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Build and run the server
- `npm run client` - Run the demo client

## Troubleshooting

### "GOOGLE_AI_API_KEY environment variable is required"

Make sure you've created a `.env` file with your Google AI API key:

```
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

### Connection Issues

Ensure the server is running and accessible. The server uses stdio for communication, so it should be started as a subprocess by MCP clients.

### Video Generation Fails

- Verify your Google AI API key has access to Veo
- Check the error messages in the server logs
- Ensure your API quota hasn't been exceeded

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Google AI Documentation](https://ai.google.dev)
- [Google Veo Information](https://deepmind.google/technologies/veo/)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)
