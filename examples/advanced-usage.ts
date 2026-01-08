#!/usr/bin/env node
/**
 * Advanced MCP Client Usage Examples for Google Veo
 *
 * This file demonstrates various real-world usage patterns for the MCP client.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Helper function to safely extract text content from MCP response
 */
function extractTextContent(result: any): string {
  if (!Array.isArray(result.content) || result.content.length === 0) {
    throw new Error('Invalid response: no content');
  }
  const content = result.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text content');
  }
  return content.text;
}

/**
 * Helper function to create and connect to the MCP server
 */
async function createClient(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js'],
  });

  const client = new Client(
    { name: 'advanced-veo-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  return client;
}

/**
 * Example 1: Generate a single video and wait for completion
 */
async function example1_generateSingleVideo() {
  console.log('\n=== Example 1: Generate a Single Video ===\n');

  const client = await createClient();

  try {
    // Generate video
    const generateResult = await client.callTool({
      name: 'generate_video',
      arguments: {
        prompt: 'A time-lapse of a flower blooming in spring',
        duration: 5,
        aspectRatio: '16:9',
        resolution: '1080p',
      },
    });

    const videoData = JSON.parse(extractTextContent(generateResult));
    console.log(`✓ Video generation started`);
    console.log(`  Video ID: ${videoData.videoId}`);
    console.log(`  Initial Status: ${videoData.status}`);

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResult = await client.callTool({
        name: 'get_video_status',
        arguments: { videoId: videoData.videoId },
      });

      const status = JSON.parse(extractTextContent(statusResult));

      if (status.status === 'completed') {
        console.log(`✓ Video generation complete!`);
        console.log(`  Video URL: ${status.videoUrl}`);
        completed = true;
      } else if (status.status === 'failed') {
        console.error(`✗ Video generation failed: ${status.error}`);
        break;
      } else {
        console.log(`  Progress: ${status.progress || 0}%`);
      }

      attempts++;
    }

    if (!completed && attempts >= maxAttempts) {
      console.error('✗ Timeout waiting for video completion');
    }
  } finally {
    await client.close();
  }
}

/**
 * Example 2: Generate multiple videos in parallel
 */
async function example2_generateMultipleVideos() {
  console.log('\n=== Example 2: Generate Multiple Videos in Parallel ===\n');

  const client = await createClient();

  try {
    const prompts = [
      'A serene mountain lake at sunrise',
      'City traffic time-lapse at night',
      'Waves crashing on a rocky shore',
    ];

    // Start all video generations in parallel
    console.log('Starting video generations...');
    const videoIds: string[] = [];

    for (const prompt of prompts) {
      const result = await client.callTool({
        name: 'generate_video',
        arguments: {
          prompt,
          duration: 5,
          aspectRatio: '16:9',
        },
      });

      const videoData = JSON.parse(extractTextContent(result));
      videoIds.push(videoData.videoId);
      console.log(`✓ Started: "${prompt}" (${videoData.videoId})`);
    }

    // Poll all videos until completion
    console.log('\nWaiting for completions...');
    const completedVideos = new Map<string, any>();

    while (completedVideos.size < videoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (const videoId of videoIds) {
        if (completedVideos.has(videoId)) continue;

        const statusResult = await client.callTool({
          name: 'get_video_status',
          arguments: { videoId },
        });

        const status = JSON.parse(extractTextContent(statusResult));

        if (status.status === 'completed') {
          completedVideos.set(videoId, status);
          console.log(`✓ Completed: ${videoId}`);
          console.log(`  URL: ${status.videoUrl}`);
        } else if (status.status === 'failed') {
          completedVideos.set(videoId, status);
          console.error(`✗ Failed: ${videoId}`);
        }
      }
    }

    console.log(`\n✓ All ${completedVideos.size} videos processed!`);
  } finally {
    await client.close();
  }
}

/**
 * Example 3: List models and check capabilities
 */
async function example3_listModels() {
  console.log('\n=== Example 3: List Available Models ===\n');

  const client = await createClient();

  try {
    const result = await client.callTool({
      name: 'list_models',
      arguments: {},
    });

    const modelsData = JSON.parse(extractTextContent(result));

    console.log('Available Models:');
    for (const model of modelsData.models) {
      console.log(`\n  ${model.displayName} (${model.name})`);
      console.log(`    ${model.description}`);
      console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
    }

    if (modelsData.note) {
      console.log(`\nNote: ${modelsData.note}`);
    }
  } finally {
    await client.close();
  }
}

/**
 * Example 4: Error handling and retries
 */
async function example4_errorHandling() {
  console.log('\n=== Example 4: Error Handling ===\n');

  const client = await createClient();

  try {
    // Example: Try to get status for non-existent video
    console.log('Attempting to get status for non-existent video...');

    try {
      const result = await client.callTool({
        name: 'get_video_status',
        arguments: { videoId: 'invalid_video_id' },
      });

      const response = JSON.parse(extractTextContent(result));

      if (response.error) {
        console.log(`✓ Error handled correctly: ${response.error}`);
      }
    } catch (error) {
      console.error(`✗ Unexpected error: ${error}`);
    }

    // Example: Retry logic for video generation
    console.log('\nGenerating video with retry logic...');
    let retries = 0;
    const maxRetries = 3;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        const result = await client.callTool({
          name: 'generate_video',
          arguments: {
            prompt: 'A beautiful landscape',
          },
        });

        const videoData = JSON.parse(extractTextContent(result));
        console.log(`✓ Video generation started: ${videoData.videoId}`);
        success = true;
      } catch (error) {
        retries++;
        console.log(`Attempt ${retries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    if (!success) {
      console.error('✗ Failed after all retries');
    }
  } finally {
    await client.close();
  }
}

/**
 * Example 5: Using different video configurations
 */
async function example5_differentConfigurations() {
  console.log('\n=== Example 5: Different Video Configurations ===\n');

  const client = await createClient();

  try {
    const configurations = [
      {
        name: 'Vertical (9:16) - Mobile optimized',
        prompt: 'A smartphone product showcase',
        aspectRatio: '9:16' as const,
        resolution: '1080p' as const,
      },
      {
        name: 'Square (1:1) - Social media',
        prompt: 'A coffee being poured into a cup',
        aspectRatio: '1:1' as const,
        resolution: '720p' as const,
      },
      {
        name: 'Widescreen (16:9) - Cinematic',
        prompt: 'An epic mountain vista',
        aspectRatio: '16:9' as const,
        resolution: '4k' as const,
        duration: 8,
      },
    ];

    for (const config of configurations) {
      console.log(`\n${config.name}:`);
      console.log(`  Prompt: "${config.prompt}"`);
      console.log(`  Aspect Ratio: ${config.aspectRatio}`);
      console.log(`  Resolution: ${config.resolution}`);
      console.log(`  Duration: ${config.duration || 5}s`);

      const result = await client.callTool({
        name: 'generate_video',
        arguments: {
          prompt: config.prompt,
          aspectRatio: config.aspectRatio,
          resolution: config.resolution,
          duration: config.duration || 5,
        },
      });

      const videoData = JSON.parse(extractTextContent(result));
      console.log(`  ✓ Video ID: ${videoData.videoId}`);
    }
  } finally {
    await client.close();
  }
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Google Veo MCP Client - Advanced Usage Examples    ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Run individual examples
    await example1_generateSingleVideo();
    await example2_generateMultipleVideos();
    await example3_listModels();
    await example4_errorHandling();
    await example5_differentConfigurations();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║              All Examples Completed! ✓                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

// Allow running specific examples
const exampleArg = process.argv[2];
if (exampleArg) {
  const exampleMap: Record<string, () => Promise<void>> = {
    '1': example1_generateSingleVideo,
    '2': example2_generateMultipleVideos,
    '3': example3_listModels,
    '4': example4_errorHandling,
    '5': example5_differentConfigurations,
  };

  const exampleFn = exampleMap[exampleArg];
  if (exampleFn) {
    console.log(`Running example ${exampleArg}...\n`);
    exampleFn().catch(console.error);
  } else {
    console.log('Usage: node advanced-usage.js [1-5]');
    console.log('  1: Generate a single video');
    console.log('  2: Generate multiple videos in parallel');
    console.log('  3: List available models');
    console.log('  4: Error handling examples');
    console.log('  5: Different video configurations');
    console.log('  (no argument): Run all examples');
  }
} else {
  main();
}
