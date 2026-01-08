# MCP Client Usage Guide for Google Veo

This guide shows you how to use the MCP client to interact with the Google Veo server in both TypeScript and Python.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Usage](#basic-usage)
3. [Advanced Examples](#advanced-examples)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)

---

## Quick Start

### TypeScript/Node.js

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the basic client demo
npm run client

# Run advanced examples
node dist/examples/advanced-usage.js
```

### Python

```bash
# Navigate to Python directory
cd python

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the basic client demo
python3 src/client.py

# Run advanced examples
python3 examples/advanced_usage.py
```

---

## Basic Usage

### 1. Connecting to the Server

#### TypeScript

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Create transport
const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/server.js'],
});

// Create and connect client
const client = new Client(
  { name: 'my-veo-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);
```

#### Python

```python
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Set up server parameters
server_params = StdioServerParameters(
    command="python3",
    args=["src/server.py"],
    env=None,
)

# Create client session
async with AsyncExitStack() as stack:
    stdio_transport = await stack.enter_async_context(
        stdio_client(server_params)
    )
    stdio, write = stdio_transport
    session = await stack.enter_async_context(ClientSession(stdio, write))

    await session.initialize()

    # Use the session here
```

### 2. Generating a Video

#### TypeScript

```typescript
// Generate video
const result = await client.callTool({
  name: 'generate_video',
  arguments: {
    prompt: 'A beautiful sunset over the ocean',
    duration: 5,
    aspectRatio: '16:9',
    resolution: '1080p',
  },
});

// Extract response
const content = result.content[0];
if (content.type === 'text') {
  const videoData = JSON.parse(content.text);
  console.log(`Video ID: ${videoData.videoId}`);
  console.log(`Status: ${videoData.status}`);
}
```

#### Python

```python
# Generate video
result = await session.call_tool(
    "generate_video",
    arguments={
        "prompt": "A beautiful sunset over the ocean",
        "duration": 5,
        "aspectRatio": "16:9",
        "resolution": "1080p",
    },
)

# Extract response
content = result.content[0]
video_data = json.loads(content.text)
print(f"Video ID: {video_data['videoId']}")
print(f"Status: {video_data['status']}")
```

### 3. Checking Video Status

#### TypeScript

```typescript
const statusResult = await client.callTool({
  name: 'get_video_status',
  arguments: {
    videoId: 'veo_1234567890_abc123',
  },
});

const content = statusResult.content[0];
if (content.type === 'text') {
  const status = JSON.parse(content.text);
  console.log(`Status: ${status.status}`);
  console.log(`Progress: ${status.progress}%`);
  if (status.videoUrl) {
    console.log(`URL: ${status.videoUrl}`);
  }
}
```

#### Python

```python
status_result = await session.call_tool(
    "get_video_status",
    arguments={"videoId": "veo_1234567890_abc123"},
)

content = status_result.content[0]
status = json.loads(content.text)
print(f"Status: {status['status']}")
print(f"Progress: {status['progress']}%")
if status.get('videoUrl'):
    print(f"URL: {status['videoUrl']}")
```

### 4. Listing Available Models

#### TypeScript

```typescript
const modelsResult = await client.callTool({
  name: 'list_models',
  arguments: {},
});

const content = modelsResult.content[0];
if (content.type === 'text') {
  const modelsData = JSON.parse(content.text);
  for (const model of modelsData.models) {
    console.log(`${model.displayName}: ${model.description}`);
  }
}
```

#### Python

```python
models_result = await session.call_tool("list_models", arguments={})

content = models_result.content[0]
models_data = json.loads(content.text)
for model in models_data["models"]:
    print(f"{model['displayName']}: {model['description']}")
```

---

## Advanced Examples

### Polling for Video Completion

#### TypeScript

```typescript
async function waitForVideoCompletion(
  client: Client,
  videoId: string,
  timeoutSeconds: number = 300
): Promise<any> {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    const result = await client.callTool({
      name: 'get_video_status',
      arguments: { videoId },
    });

    const content = result.content[0];
    if (content.type === 'text') {
      const status = JSON.parse(content.text);

      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Video generation failed: ${status.error}`);
      }

      console.log(`Progress: ${status.progress || 0}%`);
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Timeout waiting for video completion');
}

// Usage
const videoData = await generateVideo(client, 'A scenic landscape');
const completedVideo = await waitForVideoCompletion(client, videoData.videoId);
console.log(`Video ready: ${completedVideo.videoUrl}`);
```

#### Python

```python
async def wait_for_video_completion(
    session: ClientSession,
    video_id: str,
    timeout_seconds: int = 300
) -> dict:
    """Poll for video completion with timeout"""
    import time
    start_time = time.time()

    while time.time() - start_time < timeout_seconds:
        result = await session.call_tool(
            "get_video_status",
            arguments={"videoId": video_id},
        )

        content = result.content[0]
        status = json.loads(content.text)

        if status["status"] == "completed":
            return status
        elif status["status"] == "failed":
            raise ValueError(f"Video generation failed: {status.get('error')}")

        print(f"Progress: {status.get('progress', 0)}%")

        # Wait 2 seconds before next poll
        await asyncio.sleep(2)

    raise TimeoutError("Timeout waiting for video completion")

# Usage
video_data = await generate_video(session, "A scenic landscape")
completed_video = await wait_for_video_completion(session, video_data["videoId"])
print(f"Video ready: {completed_video['videoUrl']}")
```

### Generating Multiple Videos

#### TypeScript

```typescript
async function generateMultipleVideos(
  client: Client,
  prompts: string[]
): Promise<Map<string, any>> {
  // Start all generations
  const videoIds: string[] = [];

  for (const prompt of prompts) {
    const result = await client.callTool({
      name: 'generate_video',
      arguments: { prompt },
    });

    const content = result.content[0];
    if (content.type === 'text') {
      const videoData = JSON.parse(content.text);
      videoIds.push(videoData.videoId);
    }
  }

  // Poll all until complete
  const completed = new Map<string, any>();

  while (completed.size < videoIds.length) {
    for (const videoId of videoIds) {
      if (completed.has(videoId)) continue;

      const result = await client.callTool({
        name: 'get_video_status',
        arguments: { videoId },
      });

      const content = result.content[0];
      if (content.type === 'text') {
        const status = JSON.parse(content.text);
        if (status.status === 'completed' || status.status === 'failed') {
          completed.set(videoId, status);
        }
      }
    }

    if (completed.size < videoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return completed;
}

// Usage
const prompts = [
  'A mountain landscape',
  'Ocean waves',
  'City at night',
];
const videos = await generateMultipleVideos(client, prompts);
console.log(`Generated ${videos.size} videos`);
```

#### Python

```python
async def generate_multiple_videos(
    session: ClientSession,
    prompts: list[str]
) -> dict[str, dict]:
    """Generate multiple videos and wait for all to complete"""
    # Start all generations
    video_ids = []

    for prompt in prompts:
        result = await session.call_tool(
            "generate_video",
            arguments={"prompt": prompt},
        )

        content = result.content[0]
        video_data = json.loads(content.text)
        video_ids.append(video_data["videoId"])

    # Poll all until complete
    completed = {}

    while len(completed) < len(video_ids):
        for video_id in video_ids:
            if video_id in completed:
                continue

            result = await session.call_tool(
                "get_video_status",
                arguments={"videoId": video_id},
            )

            content = result.content[0]
            status = json.loads(content.text)

            if status["status"] in ("completed", "failed"):
                completed[video_id] = status

        if len(completed) < len(video_ids):
            await asyncio.sleep(2)

    return completed

# Usage
prompts = [
    "A mountain landscape",
    "Ocean waves",
    "City at night",
]
videos = await generate_multiple_videos(session, prompts)
print(f"Generated {len(videos)} videos")
```

---

## Error Handling

### Handling Tool Errors

#### TypeScript

```typescript
try {
  const result = await client.callTool({
    name: 'generate_video',
    arguments: { prompt: 'My video' },
  });

  const content = result.content[0];
  if (content.type === 'text') {
    const response = JSON.parse(content.text);

    // Check for error in response
    if (response.error) {
      console.error(`Server error: ${response.error}`);
      return;
    }

    console.log(`Success: ${response.videoId}`);
  }
} catch (error) {
  console.error(`Client error: ${error}`);
}
```

#### Python

```python
try:
    result = await session.call_tool(
        "generate_video",
        arguments={"prompt": "My video"},
    )

    content = result.content[0]
    response = json.loads(content.text)

    # Check for error in response
    if "error" in response:
        print(f"Server error: {response['error']}")
        return

    print(f"Success: {response['videoId']}")

except Exception as error:
    print(f"Client error: {error}")
```

### Retry Logic

#### TypeScript

```typescript
async function callToolWithRetry(
  client: Client,
  toolName: string,
  args: any,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.callTool({
        name: toolName,
        arguments: args,
      });
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError || new Error('All retries failed');
}
```

#### Python

```python
async def call_tool_with_retry(
    session: ClientSession,
    tool_name: str,
    args: dict,
    max_retries: int = 3
) -> Any:
    """Call a tool with automatic retry logic"""
    last_error = None

    for i in range(max_retries):
        try:
            return await session.call_tool(tool_name, arguments=args)
        except Exception as error:
            last_error = error
            print(f"Attempt {i + 1} failed, retrying...")
            await asyncio.sleep(1 * (i + 1))

    raise last_error or Exception("All retries failed")
```

---

## Best Practices

### 1. Always Close Connections

#### TypeScript

```typescript
const client = await createClient();
try {
  // Use client
} finally {
  await client.close();
}
```

#### Python

```python
async with AsyncExitStack() as stack:
    # Client automatically closed when exiting context
    session, _ = await create_client(stack)
    # Use session
```

### 2. Handle Timeouts

Set reasonable timeouts when polling for video completion to avoid infinite loops.

### 3. Validate Responses

Always check the response structure and handle errors gracefully:

```typescript
const content = result.content[0];
if (content.type !== 'text') {
  throw new Error('Expected text content');
}
const data = JSON.parse(content.text);
if (data.error) {
  throw new Error(data.error);
}
```

### 4. Use Environment Variables

Store your API key in `.env` files, never in code:

```bash
GOOGLE_AI_API_KEY=your_api_key_here
```

### 5. Implement Proper Logging

Log important events for debugging:

```typescript
console.log(`Video generation started: ${videoId}`);
console.log(`Status: ${status.status}, Progress: ${status.progress}%`);
```

---

## Running the Examples

### All Examples

**TypeScript:**
```bash
npm run build
node dist/examples/advanced-usage.js
```

**Python:**
```bash
python3 examples/advanced_usage.py
```

### Individual Examples

**TypeScript:**
```bash
node dist/examples/advanced-usage.js 1  # Run example 1
node dist/examples/advanced-usage.js 2  # Run example 2
# etc.
```

**Python:**
```bash
python3 examples/advanced_usage.py 1  # Run example 1
python3 examples/advanced_usage.py 2  # Run example 2
# etc.
```

### Available Examples

1. Generate a single video with status polling
2. Generate multiple videos in parallel
3. List available models
4. Error handling and retries
5. Different video configurations (aspect ratios, resolutions)

---

## Troubleshooting

### "Cannot connect to server"

Make sure the server is properly built/installed:
- **TypeScript:** Run `npm run build`
- **Python:** Ensure dependencies are installed with `pip install -r requirements.txt`

### "GOOGLE_AI_API_KEY not found"

Create a `.env` file with your API key:
```bash
echo "GOOGLE_AI_API_KEY=your_key_here" > .env
```

### "Video ID not found"

The video ID may have been from a previous server session. The server stores videos in memory, so they're lost when the server restarts.

---

## Next Steps

- Review the [main README](README.md) for installation instructions
- Check out the [Python README](python/README.md) for Python-specific info
- Explore the example files in `examples/` and `python/examples/`
- Integrate the client into your own applications

For more information, see the [Model Context Protocol documentation](https://modelcontextprotocol.io).
