# MCP Server for Google Veo (Python)

A Model Context Protocol (MCP) server that provides integration with Google Veo, Google's advanced video generation AI model. This is the Python implementation.

## Features

- **Video Generation**: Generate videos from text prompts using Google Veo
- **Status Tracking**: Monitor the progress of video generation jobs
- **Model Discovery**: List available Google AI models
- **MCP Compliant**: Fully compatible with the Model Context Protocol specification
- **Async/Await**: Built with modern Python asyncio for efficient concurrent operations

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

- Python 3.10 or higher
- pip
- Google AI API key with Veo access

### Setup

1. Navigate to the Python directory:
```bash
cd python
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Add your Google AI API key to `.env`:
```
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

## Usage

### Running the Server

The MCP server communicates over stdio:

```bash
python3 src/server.py
```

### Running the Demo Client

To see the server in action with a demo client:

```bash
python3 src/client.py
```

This will:
1. Connect to the MCP server
2. List available tools
3. Generate a sample video
4. Check the video generation status
5. Display the results

### Running the Simple Example

For a simpler example with polling:

```bash
python3 examples/simple_usage.py
```

### Integration with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-veo": {
      "command": "python3",
      "args": ["/absolute/path/to/MCP_server_veo/python/src/server.py"],
      "env": {
        "GOOGLE_AI_API_KEY": "your_google_ai_api_key_here"
      }
    }
  }
}
```

Replace `/absolute/path/to/MCP_server_veo` with the actual path to this repository.

**Note:** Make sure the Python interpreter has access to the installed dependencies. If using a virtual environment, use the full path to the Python interpreter in the venv:

```json
{
  "mcpServers": {
    "google-veo": {
      "command": "/absolute/path/to/MCP_server_veo/python/venv/bin/python3",
      "args": ["/absolute/path/to/MCP_server_veo/python/src/server.py"],
      "env": {
        "GOOGLE_AI_API_KEY": "your_google_ai_api_key_here"
      }
    }
  }
}
```

### Integration with Other MCP Clients

Any MCP-compatible client can connect to this server via stdio. Example using the MCP Python SDK:

```python
import asyncio
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="python3",
        args=["src/server.py"],
        env={"GOOGLE_AI_API_KEY": "your_api_key_here"},
    )

    async with AsyncExitStack() as stack:
        stdio_transport = await stack.enter_async_context(
            stdio_client(server_params)
        )
        stdio, write = stdio_transport
        session = await stack.enter_async_context(ClientSession(stdio, write))

        await session.initialize()

        # Use the tools
        result = await session.call_tool(
            "generate_video",
            arguments={
                "prompt": "A beautiful mountain landscape at dawn",
                "duration": 5,
                "aspectRatio": "16:9",
            },
        )

asyncio.run(main())
```

## API Access Notes

**Important:** As of early 2025, Google Veo API access is limited and may require:
- Waitlist approval
- Access through Google Cloud Vertex AI
- Specific API credentials

This implementation provides the MCP server structure and demonstrates the workflow. For production use, you'll need to:

1. Obtain proper Veo API access from Google
2. Update the `_generate_video()` method in `src/server.py` to use the actual Veo API endpoints
3. Implement proper authentication and error handling for the Veo service

The current implementation includes placeholder/simulation logic for demonstration purposes.

## Development

### Project Structure

```
python/
├── src/
│   ├── __init__.py    # Package initialization
│   ├── server.py      # MCP server implementation
│   └── client.py      # Demo client
├── examples/
│   └── simple_usage.py # Additional usage example
├── requirements.txt   # Python dependencies
├── setup.py          # Package setup
├── .env.example      # Environment variables template
└── README.md         # This file
```

### Running Tests

To test the implementation:

```bash
# Run the demo client (tests all functionality)
python3 src/client.py

# Run the simple example
python3 examples/simple_usage.py
```

### Type Checking

Install development dependencies for type checking:

```bash
pip install mypy
mypy src/
```

## Troubleshooting

### "GOOGLE_AI_API_KEY environment variable is required"

Make sure you've created a `.env` file with your Google AI API key:

```
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

### Import Errors

Make sure all dependencies are installed:

```bash
pip install -r requirements.txt
```

If using a virtual environment, make sure it's activated.

### Connection Issues

Ensure the server is running and accessible. The server uses stdio for communication, so it should be started as a subprocess by MCP clients.

### Video Generation Fails

- Verify your Google AI API key has access to Veo
- Check the error messages in stderr
- Ensure your API quota hasn't been exceeded

## Comparison with TypeScript Version

Both Python and TypeScript versions provide identical functionality:

- **Python**: Better for ML/AI workflows, easier integration with Python-based tools
- **TypeScript**: Better for Node.js environments, strong typing out of the box

Choose based on your development environment and preferences.

## License

MIT License - See ../LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Google AI Python SDK](https://github.com/google/generative-ai-python)
- [Google Veo Information](https://deepmind.google/technologies/veo/)
