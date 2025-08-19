#!/usr/bin/env node

/**
 * Test script for the standalone stdio MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

async function testStandaloneServer() {
    console.log('🧪 Testing Standalone Stdio MCP Server...');
    
    const serverPath = path.join(__dirname, 'out', 'mcp-stdio-server-standalone.js');
    console.log('📁 Server path:', serverPath);
    
    // Test 1: Check if server file exists
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
        console.error('❌ Server file not found:', serverPath);
        return false;
    }
    console.log('✅ Server file exists');
    
    // Test 2: Try to start server
    console.log('🚀 Starting standalone server...');
    
    const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
    });
    
    let serverOutput = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
        serverOutput += data.toString();
    });
    
    server.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('📋 Server log:', data.toString().trim());
    });
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Send a list_tools request
    console.log('📤 Sending list_tools request...');
    
    const listToolsRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Send a tool call request
    console.log('📤 Sending executeCommand tool call...');
    
    const toolCallRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
            name: 'vscode.executeCommand',
            arguments: {
                commandId: 'editor.action.formatDocument'
            }
        }
    };
    
    server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clean shutdown
    server.kill('SIGTERM');
    
    console.log('📊 Test Results:');
    console.log('- Server Output Length:', serverOutput.length);
    console.log('- Error Output (logs):', errorOutput.slice(0, 500) + (errorOutput.length > 500 ? '...' : ''));
    
    if (errorOutput.includes('Starting VSCode Commands MCP Server') && 
        errorOutput.includes('ES modules loaded successfully') &&
        errorOutput.includes('Server connected and ready')) {
        console.log('✅ Standalone server started successfully!');
        return true;
    } else {
        console.log('❌ Server failed to start properly');
        return false;
    }
}

// Run the test
testStandaloneServer().then(success => {
    if (success) {
        console.log('🎉 Standalone server test passed!');
        process.exit(0);
    } else {
        console.log('💥 Standalone server test failed!');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
});
