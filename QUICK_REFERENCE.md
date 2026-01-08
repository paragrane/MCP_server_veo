# Quick Reference - MCP Google Veo Client

## Setup

### TypeScript
```bash
npm install && npm run build
```

### Python
```bash
cd python
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

## Connect to Server

### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/server.js'],
});

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);
```

### Python
```python
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="python3",
    args=["src/server.py"],
)

async with AsyncExitStack() as stack:
    transport = await stack.enter_async_context(stdio_client(server_params))
    stdio, write = transport
    session = await stack.enter_async_context(ClientSession(stdio, write))
    await session.initialize()
```

## Generate Video

### TypeScript
```typescript
const result = await client.callTool({
  name: 'generate_video',
  arguments: {
    prompt: 'A beautiful sunset',
    duration: 5,
    aspectRatio: '16:9',
    resolution: '1080p',
  },
});

const videoData = JSON.parse(result.content[0].text);
console.log(videoData.videoId);
```

### Python
```python
result = await session.call_tool(
    "generate_video",
    arguments={
        "prompt": "A beautiful sunset",
        "duration": 5,
        "aspectRatio": "16:9",
        "resolution": "1080p",
    },
)

video_data = json.loads(result.content[0].text)
print(video_data["videoId"])
```

## Check Status

### TypeScript
```typescript
const result = await client.callTool({
  name: 'get_video_status',
  arguments: { videoId: 'veo_123_abc' },
});

const status = JSON.parse(result.content[0].text);
console.log(status.status, status.progress);
```

### Python
```python
result = await session.call_tool(
    "get_video_status",
    arguments={"videoId": "veo_123_abc"},
)

status = json.loads(result.content[0].text)
print(status["status"], status["progress"])
```

## List Models

### TypeScript
```typescript
const result = await client.callTool({
  name: 'list_models',
  arguments: {},
});

const models = JSON.parse(result.content[0].text);
```

### Python
```python
result = await session.call_tool("list_models", arguments={})
models = json.loads(result.content[0].text)
```

## Run Examples

### TypeScript
```bash
# All examples
node dist/examples/advanced-usage.js

# Specific example
node dist/examples/advanced-usage.js 1
```

### Python
```bash
# All examples
python3 examples/advanced_usage.py

# Specific example
python3 examples/advanced_usage.py 1
```

## Common Patterns

### Poll Until Complete (TypeScript)
```typescript
while (true) {
  const result = await client.callTool({
    name: 'get_video_status',
    arguments: { videoId },
  });

  const status = JSON.parse(result.content[0].text);

  if (status.status === 'completed') {
    console.log(status.videoUrl);
    break;
  }

  await new Promise(r => setTimeout(r, 2000));
}
```

### Poll Until Complete (Python)
```python
while True:
    result = await session.call_tool(
        "get_video_status",
        arguments={"videoId": video_id},
    )

    status = json.loads(result.content[0].text)

    if status["status"] == "completed":
        print(status["videoUrl"])
        break

    await asyncio.sleep(2)
```

## Available Parameters

### generate_video
- `prompt` (required): Video description
- `duration` (optional): 1-8 seconds (default: 5)
- `aspectRatio` (optional): "16:9", "9:16", "1:1" (default: "16:9")
- `resolution` (optional): "720p", "1080p", "4k" (default: "1080p")

### get_video_status
- `videoId` (required): ID from generate_video

### list_models
- No parameters

## Status Values
- `pending`: Queued
- `processing`: In progress
- `completed`: Done (videoUrl available)
- `failed`: Error (error message available)

## More Info
- [Full Usage Guide](USAGE_GUIDE.md)
- [TypeScript README](README.md)
- [Python README](python/README.md)
