/**
 * Simple usage example for Google Veo MCP Server
 *
 * This demonstrates basic usage patterns for video generation.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function generateAndWaitForVideo(
  client: Client,
  prompt: string,
  options?: {
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    resolution?: '720p' | '1080p' | '4k';
  }
) {
  // Generate video
  console.log(`Generating video: "${prompt}"`);
  const generateResult = await client.callTool({
    name: 'generate_video',
    arguments: {
      prompt,
      ...options,
    },
  });

  if (!Array.isArray(generateResult.content) || generateResult.content.length === 0) {
    throw new Error('Invalid response from generate_video');
  }
  const generateContent = generateResult.content[0];
  if (generateContent.type !== 'text') throw new Error('Expected text content');
  const { videoId } = JSON.parse(generateContent.text);
  console.log(`Video ID: ${videoId}`);

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5 second intervals)

  while (attempts < maxAttempts) {
    const statusResult = await client.callTool({
      name: 'get_video_status',
      arguments: { videoId },
    });

    if (!Array.isArray(statusResult.content) || statusResult.content.length === 0) {
      throw new Error('Invalid response from get_video_status');
    }
    const statusContent = statusResult.content[0];
    if (statusContent.type !== 'text') throw new Error('Expected text content');
    const status = JSON.parse(statusContent.text);

    if (status.status === 'completed') {
      console.log(`Video completed! URL: ${status.videoUrl}`);
      return status;
    } else if (status.status === 'failed') {
      throw new Error(`Video generation failed: ${status.error}`);
    }

    console.log(`Status: ${status.status}, Progress: ${status.progress || 0}%`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Video generation timed out');
}

async function main() {
  // Create client with stdio transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js'],
  });

  const client = new Client(
    { name: 'simple-usage-example', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);

  try {
    // Example: Generate a simple video
    const video = await generateAndWaitForVideo(
      client,
      'A peaceful forest with sunlight filtering through the trees',
      {
        duration: 5,
        aspectRatio: '16:9',
        resolution: '1080p',
      }
    );

    console.log('Final video details:', video);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
