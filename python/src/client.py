#!/usr/bin/env python3
"""
MCP Client for Google Veo

This client demonstrates how to interact with the Google Veo MCP Server.
"""

import asyncio
import json
import sys
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    """Example client that demonstrates using the Google Veo MCP Server"""
    print("Starting Google Veo MCP Client...\n")

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

        print("Connected to Google Veo MCP Server\n")

        try:
            # List available tools
            print("=== Available Tools ===")
            tools_result = await session.list_tools()
            for tool in tools_result.tools:
                print(f"- {tool.name}: {tool.description}")
            print()

            # Example 1: List available models
            print("=== Listing Available Models ===")
            models_result = await session.call_tool("list_models", arguments={})
            if models_result.content:
                content = models_result.content[0]
                if hasattr(content, 'text'):
                    print(content.text)
            print()

            # Example 2: Generate a video
            print("=== Generating Video ===")
            prompt = "A serene sunset over a calm ocean with gentle waves"
            print(f'Prompt: "{prompt}"')

            generate_result = await session.call_tool(
                "generate_video",
                arguments={
                    "prompt": prompt,
                    "duration": 5,
                    "aspectRatio": "16:9",
                    "resolution": "1080p",
                },
            )

            if generate_result.content:
                content = generate_result.content[0]
                if hasattr(content, 'text'):
                    video_data = json.loads(content.text)
                    print(f"Video ID: {video_data['videoId']}")
                    print(f"Status: {video_data['status']}")
            print()

            # Example 3: Check video status
            print("=== Checking Video Status ===")
            status_result = await session.call_tool(
                "get_video_status",
                arguments={"videoId": video_data["videoId"]},
            )

            if status_result.content:
                content = status_result.content[0]
                if hasattr(content, 'text'):
                    status_data = json.loads(content.text)
                    print(f"Video ID: {status_data['videoId']}")
                    print(f"Status: {status_data['status']}")
                    print(f"Progress: {status_data.get('progress', 0)}%")
                    if status_data.get('videoUrl'):
                        print(f"Video URL: {status_data['videoUrl']}")
            print()

            # Wait a bit and check status again
            print("=== Waiting 6 seconds and checking status again ===")
            await asyncio.sleep(6)

            final_status_result = await session.call_tool(
                "get_video_status",
                arguments={"videoId": video_data["videoId"]},
            )

            if final_status_result.content:
                content = final_status_result.content[0]
                if hasattr(content, 'text'):
                    final_status_data = json.loads(content.text)
                    print(f"Video ID: {final_status_data['videoId']}")
                    print(f"Status: {final_status_data['status']}")
                    print(f"Progress: {final_status_data.get('progress', 0)}%")
                    if final_status_data.get('videoUrl'):
                        print(f"Video URL: {final_status_data['videoUrl']}")
            print()

            print("=== Client Demo Complete ===")

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
