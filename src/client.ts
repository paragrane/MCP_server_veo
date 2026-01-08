#!/usr/bin/env node

/**
 * MCP Client for Google Veo
 *
 * This client demonstrates how to interact with the Google Veo MCP Server.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Example client that demonstrates using the Google Veo MCP Server
 */
async function main() {
  console.log('Starting Google Veo MCP Client...\n');

  // Create client with stdio transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js'],
  });

  const client = new Client(
    {
      name: 'veo-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Connect to server
  await client.connect(transport);
  console.log('Connected to Google Veo MCP Server\n');

  try {
    // List available tools
    console.log('=== Available Tools ===');
    const toolsResult = await client.listTools();
    toolsResult.tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Example 1: List available models
    console.log('=== Listing Available Models ===');
    const modelsResult = await client.callTool({
      name: 'list_models',
      arguments: {},
    });
    if (Array.isArray(modelsResult.content) && modelsResult.content.length > 0) {
      const modelsContent = modelsResult.content[0];
      if (modelsContent.type === 'text') {
        console.log(modelsContent.text);
      }
    }
    console.log();

    // Example 2: Generate a video
    console.log('=== Generating Video ===');
    const prompt = 'A serene sunset over a calm ocean with gentle waves';
    console.log(`Prompt: "${prompt}"`);

    const generateResult = await client.callTool({
      name: 'generate_video',
      arguments: {
        prompt,
        duration: 5,
        aspectRatio: '16:9',
        resolution: '1080p',
      },
    });

    if (!Array.isArray(generateResult.content) || generateResult.content.length === 0) {
      throw new Error('Invalid response from generate_video');
    }
    const generateContent = generateResult.content[0];
    if (generateContent.type !== 'text') throw new Error('Expected text content');
    const videoData = JSON.parse(generateContent.text);
    console.log(`Video ID: ${videoData.videoId}`);
    console.log(`Status: ${videoData.status}`);
    console.log();

    // Example 3: Check video status
    console.log('=== Checking Video Status ===');
    const statusResult = await client.callTool({
      name: 'get_video_status',
      arguments: {
        videoId: videoData.videoId,
      },
    });

    if (!Array.isArray(statusResult.content) || statusResult.content.length === 0) {
      throw new Error('Invalid response from get_video_status');
    }
    const statusContent = statusResult.content[0];
    if (statusContent.type !== 'text') throw new Error('Expected text content');
    const statusData = JSON.parse(statusContent.text);
    console.log(`Video ID: ${statusData.videoId}`);
    console.log(`Status: ${statusData.status}`);
    console.log(`Progress: ${statusData.progress || 0}%`);
    if (statusData.videoUrl) {
      console.log(`Video URL: ${statusData.videoUrl}`);
    }
    console.log();

    // Wait a bit and check status again
    console.log('=== Waiting 6 seconds and checking status again ===');
    await new Promise((resolve) => setTimeout(resolve, 6000));

    const finalStatusResult = await client.callTool({
      name: 'get_video_status',
      arguments: {
        videoId: videoData.videoId,
      },
    });

    if (!Array.isArray(finalStatusResult.content) || finalStatusResult.content.length === 0) {
      throw new Error('Invalid response from get_video_status');
    }
    const finalStatusContent = finalStatusResult.content[0];
    if (finalStatusContent.type !== 'text') throw new Error('Expected text content');
    const finalStatusData = JSON.parse(finalStatusContent.text);
    console.log(`Video ID: ${finalStatusData.videoId}`);
    console.log(`Status: ${finalStatusData.status}`);
    console.log(`Progress: ${finalStatusData.progress || 0}%`);
    if (finalStatusData.videoUrl) {
      console.log(`Video URL: ${finalStatusData.videoUrl}`);
    }
    console.log();

    console.log('=== Client Demo Complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the client
    await client.close();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
