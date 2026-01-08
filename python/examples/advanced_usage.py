#!/usr/bin/env python3
"""
Advanced MCP Client Usage Examples for Google Veo

This file demonstrates various real-world usage patterns for the MCP client.
"""

import asyncio
import json
import sys
from contextlib import AsyncExitStack
from typing import List, Dict, Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


def extract_text_content(result: Any) -> str:
    """Helper function to safely extract text content from MCP response"""
    if not result.content:
        raise ValueError("Invalid response: no content")
    content = result.content[0]
    if not hasattr(content, 'text'):
        raise ValueError("Expected text content")
    return content.text


async def create_client() -> tuple[ClientSession, AsyncExitStack]:
    """Helper function to create and connect to the MCP server"""
    stack = AsyncExitStack()

    server_params = StdioServerParameters(
        command="python3",
        args=["src/server.py"],
        env=None,
    )

    stdio_transport = await stack.enter_async_context(stdio_client(server_params))
    stdio, write = stdio_transport
    session = await stack.enter_async_context(ClientSession(stdio, write))

    await session.initialize()

    return session, stack


async def example1_generate_single_video():
    """Example 1: Generate a single video and wait for completion"""
    print("\n=== Example 1: Generate a Single Video ===\n")

    session, stack = await create_client()

    async with stack:
        try:
            # Generate video
            generate_result = await session.call_tool(
                "generate_video",
                arguments={
                    "prompt": "A time-lapse of a flower blooming in spring",
                    "duration": 5,
                    "aspectRatio": "16:9",
                    "resolution": "1080p",
                },
            )

            video_data = json.loads(extract_text_content(generate_result))
            print(f"✓ Video generation started")
            print(f"  Video ID: {video_data['videoId']}")
            print(f"  Initial Status: {video_data['status']}")

            # Poll for completion
            completed = False
            attempts = 0
            max_attempts = 60

            while not completed and attempts < max_attempts:
                await asyncio.sleep(2)

                status_result = await session.call_tool(
                    "get_video_status",
                    arguments={"videoId": video_data["videoId"]},
                )

                status = json.loads(extract_text_content(status_result))

                if status["status"] == "completed":
                    print(f"✓ Video generation complete!")
                    print(f"  Video URL: {status['videoUrl']}")
                    completed = True
                elif status["status"] == "failed":
                    print(f"✗ Video generation failed: {status.get('error')}")
                    break
                else:
                    print(f"  Progress: {status.get('progress', 0)}%")

                attempts += 1

            if not completed and attempts >= max_attempts:
                print("✗ Timeout waiting for video completion")

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)


async def example2_generate_multiple_videos():
    """Example 2: Generate multiple videos in parallel"""
    print("\n=== Example 2: Generate Multiple Videos in Parallel ===\n")

    session, stack = await create_client()

    async with stack:
        try:
            prompts = [
                "A serene mountain lake at sunrise",
                "City traffic time-lapse at night",
                "Waves crashing on a rocky shore",
            ]

            # Start all video generations
            print("Starting video generations...")
            video_ids: List[str] = []

            for prompt in prompts:
                result = await session.call_tool(
                    "generate_video",
                    arguments={
                        "prompt": prompt,
                        "duration": 5,
                        "aspectRatio": "16:9",
                    },
                )

                video_data = json.loads(extract_text_content(result))
                video_ids.append(video_data["videoId"])
                print(f'✓ Started: "{prompt}" ({video_data["videoId"]})')

            # Poll all videos until completion
            print("\nWaiting for completions...")
            completed_videos: Dict[str, Any] = {}

            while len(completed_videos) < len(video_ids):
                await asyncio.sleep(2)

                for video_id in video_ids:
                    if video_id in completed_videos:
                        continue

                    status_result = await session.call_tool(
                        "get_video_status",
                        arguments={"videoId": video_id},
                    )

                    status = json.loads(extract_text_content(status_result))

                    if status["status"] == "completed":
                        completed_videos[video_id] = status
                        print(f"✓ Completed: {video_id}")
                        print(f"  URL: {status['videoUrl']}")
                    elif status["status"] == "failed":
                        completed_videos[video_id] = status
                        print(f"✗ Failed: {video_id}")

            print(f"\n✓ All {len(completed_videos)} videos processed!")

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)


async def example3_list_models():
    """Example 3: List models and check capabilities"""
    print("\n=== Example 3: List Available Models ===\n")

    session, stack = await create_client()

    async with stack:
        try:
            result = await session.call_tool("list_models", arguments={})

            models_data = json.loads(extract_text_content(result))

            print("Available Models:")
            for model in models_data["models"]:
                print(f"\n  {model['displayName']} ({model['name']})")
                print(f"    {model['description']}")
                print(f"    Methods: {', '.join(model['supportedGenerationMethods'])}")

            if "note" in models_data:
                print(f"\nNote: {models_data['note']}")

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)


async def example4_error_handling():
    """Example 4: Error handling and retries"""
    print("\n=== Example 4: Error Handling ===\n")

    session, stack = await create_client()

    async with stack:
        try:
            # Example: Try to get status for non-existent video
            print("Attempting to get status for non-existent video...")

            try:
                result = await session.call_tool(
                    "get_video_status",
                    arguments={"videoId": "invalid_video_id"},
                )

                response = json.loads(extract_text_content(result))

                if "error" in response:
                    print(f"✓ Error handled correctly: {response['error']}")

            except Exception as error:
                print(f"✗ Unexpected error: {error}")

            # Example: Retry logic for video generation
            print("\nGenerating video with retry logic...")
            retries = 0
            max_retries = 3
            success = False

            while retries < max_retries and not success:
                try:
                    result = await session.call_tool(
                        "generate_video",
                        arguments={"prompt": "A beautiful landscape"},
                    )

                    video_data = json.loads(extract_text_content(result))
                    print(f"✓ Video generation started: {video_data['videoId']}")
                    success = True

                except Exception as error:
                    retries += 1
                    print(f"Attempt {retries} failed, retrying...")
                    await asyncio.sleep(1 * retries)

            if not success:
                print("✗ Failed after all retries")

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)


async def example5_different_configurations():
    """Example 5: Using different video configurations"""
    print("\n=== Example 5: Different Video Configurations ===\n")

    session, stack = await create_client()

    async with stack:
        try:
            configurations = [
                {
                    "name": "Vertical (9:16) - Mobile optimized",
                    "prompt": "A smartphone product showcase",
                    "aspectRatio": "9:16",
                    "resolution": "1080p",
                },
                {
                    "name": "Square (1:1) - Social media",
                    "prompt": "A coffee being poured into a cup",
                    "aspectRatio": "1:1",
                    "resolution": "720p",
                },
                {
                    "name": "Widescreen (16:9) - Cinematic",
                    "prompt": "An epic mountain vista",
                    "aspectRatio": "16:9",
                    "resolution": "4k",
                    "duration": 8,
                },
            ]

            for config in configurations:
                print(f"\n{config['name']}:")
                print(f"  Prompt: \"{config['prompt']}\"")
                print(f"  Aspect Ratio: {config['aspectRatio']}")
                print(f"  Resolution: {config['resolution']}")
                print(f"  Duration: {config.get('duration', 5)}s")

                result = await session.call_tool(
                    "generate_video",
                    arguments={
                        "prompt": config["prompt"],
                        "aspectRatio": config["aspectRatio"],
                        "resolution": config["resolution"],
                        "duration": config.get("duration", 5),
                    },
                )

                video_data = json.loads(extract_text_content(result))
                print(f"  ✓ Video ID: {video_data['videoId']}")

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)


async def main():
    """Main function - run all examples"""
    print("╔═══════════════════════════════════════════════════════╗")
    print("║   Google Veo MCP Client - Advanced Usage Examples    ║")
    print("╚═══════════════════════════════════════════════════════╝")

    try:
        # Run individual examples
        await example1_generate_single_video()
        await example2_generate_multiple_videos()
        await example3_list_models()
        await example4_error_handling()
        await example5_different_configurations()

        print("\n╔═══════════════════════════════════════════════════════╗")
        print("║              All Examples Completed! ✓                ║")
        print("╚═══════════════════════════════════════════════════════╝\n")

    except Exception as error:
        print(f"\nFatal error: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    # Allow running specific examples
    if len(sys.argv) > 1:
        example_map = {
            "1": example1_generate_single_video,
            "2": example2_generate_multiple_videos,
            "3": example3_list_models,
            "4": example4_error_handling,
            "5": example5_different_configurations,
        }

        example_fn = example_map.get(sys.argv[1])
        if example_fn:
            print(f"Running example {sys.argv[1]}...\n")
            asyncio.run(example_fn())
        else:
            print("Usage: python3 advanced_usage.py [1-5]")
            print("  1: Generate a single video")
            print("  2: Generate multiple videos in parallel")
            print("  3: List available models")
            print("  4: Error handling examples")
            print("  5: Different video configurations")
            print("  (no argument): Run all examples")
    else:
        asyncio.run(main())
