#!/usr/bin/env python3
"""
Simple usage example for Google Veo MCP Server

This demonstrates basic usage patterns for video generation.
"""

import asyncio
import json
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def generate_and_wait_for_video(
    session: ClientSession,
    prompt: str,
    duration: int = 5,
    aspect_ratio: str = "16:9",
    resolution: str = "1080p",
) -> dict:
    """Generate a video and wait for completion"""

    # Generate video
    print(f'Generating video: "{prompt}"')
    generate_result = await session.call_tool(
        "generate_video",
        arguments={
            "prompt": prompt,
            "duration": duration,
            "aspectRatio": aspect_ratio,
            "resolution": resolution,
        },
    )

    if not generate_result.content:
        raise ValueError("Invalid response from generate_video")

    content = generate_result.content[0]
    if not hasattr(content, 'text'):
        raise ValueError("Expected text content")

    video_data = json.loads(content.text)
    video_id = video_data["videoId"]
    print(f"Video ID: {video_id}")

    # Poll for completion
    max_attempts = 60  # 5 minutes max (5 second intervals)

    for attempt in range(max_attempts):
        status_result = await session.call_tool(
            "get_video_status",
            arguments={"videoId": video_id},
        )

        if not status_result.content:
            raise ValueError("Invalid response from get_video_status")

        status_content = status_result.content[0]
        if not hasattr(status_content, 'text'):
            raise ValueError("Expected text content")

        status = json.loads(status_content.text)

        if status["status"] == "completed":
            print(f"Video completed! URL: {status.get('videoUrl')}")
            return status
        elif status["status"] == "failed":
            raise ValueError(f"Video generation failed: {status.get('error')}")

        print(f"Status: {status['status']}, Progress: {status.get('progress', 0)}%")
        await asyncio.sleep(5)

    raise TimeoutError("Video generation timed out")


async def main():
    """Main function"""

    # Server parameters
    server_params = StdioServerParameters(
        command="python3",
        args=["src/server.py"],
        env=None,
    )

    async with AsyncExitStack() as stack:
        # Connect to server
        stdio_transport = await stack.enter_async_context(stdio_client(server_params))
        stdio, write = stdio_transport
        session = await stack.enter_async_context(ClientSession(stdio, write))

        # Initialize the session
        await session.initialize()

        try:
            # Example: Generate a simple video
            video = await generate_and_wait_for_video(
                session,
                "A peaceful forest with sunlight filtering through the trees",
                duration=5,
                aspect_ratio="16:9",
                resolution="1080p",
            )

            print("Final video details:", json.dumps(video, indent=2))

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
