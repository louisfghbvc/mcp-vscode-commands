#!/usr/bin/env node

/**
 * WebSocket 到 stdio 橋接器
 * 這個腳本讓 Cursor 可以通過 WebSocket 連接到 VSCode 擴展的 MCP 服務器
 */

const WebSocket = require('ws');

if (process.argv.length < 3) {
    console.error('Usage: node websocket-client.js <websocket-url>');
    process.exit(1);
}

const wsUrl = process.argv[2] || 'ws://localhost:3001/mcp';

console.error(`Connecting to ${wsUrl}...`);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.error('Connected to MCP WebSocket server');
    
    // 將 stdin 轉發到 WebSocket
    process.stdin.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });
    
    // 將 WebSocket 消息轉發到 stdout
    ws.on('message', (data) => {
        process.stdout.write(data);
    });
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    process.exit(1);
});

ws.on('close', () => {
    console.error('WebSocket connection closed');
    process.exit(0);
});

// 優雅關閉
process.on('SIGINT', () => {
    console.error('Closing connection...');
    ws.close();
});

process.on('SIGTERM', () => {
    ws.close();
});
