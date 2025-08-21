#!/usr/bin/env node

/**
 * Stdio Bridge for MCP VSCode Commands
 * 
 * This lightweight bridge connects Cursor's MCP API to the
 * MCP server running within the VS Code extension.
 * 
 * Communication Flow:
 * Cursor ↔ stdio-bridge.js ↔ [IPC] ↔ Extension (MCP Server)
 */

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Bridge configuration
const BRIDGE_PORT = 19847; // Fixed port for internal communication
const TIMEOUT = 10000; // 10 seconds timeout
const RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 1000; // 1 second

class StdioBridge {
    private client: net.Socket | null = null;
    private isConnected = false;
    private retryCount = 0;

    constructor() {
        this.setupStdioForwarding();
    }

    private async setupStdioForwarding(): Promise<void> {
        await this.connectWithRetry();
    }

    private async connectWithRetry(): Promise<void> {
        while (this.retryCount < RETRY_ATTEMPTS && !this.isConnected) {
            try {
                await this.connectToExtension();
                break;
            } catch (error) {
                this.retryCount++;
                if (this.retryCount >= RETRY_ATTEMPTS) {
                    console.error(`[Bridge] Failed to connect after ${RETRY_ATTEMPTS} attempts`);
                    this.exitWithError(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
                } else {
                    console.error(`[Bridge] Connection attempt ${this.retryCount} failed, retrying in ${RETRY_DELAY}ms...`);
                    await this.sleep(RETRY_DELAY);
                }
            }
        }
    }

    private connectToExtension(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Connect to the extension's MCP server
            this.client = net.createConnection(BRIDGE_PORT, 'localhost');
            
            this.client.on('connect', () => {
                console.error('[Bridge] ✅ Connected to extension MCP server');
                this.isConnected = true;
                
                // Set up bidirectional forwarding
                this.setupBidirectionalForwarding();
                resolve();
            });
            
            this.client.on('error', (error) => {
                console.error('[Bridge] Connection error:', error.message);
                reject(error);
            });
            
            this.client.on('close', () => {
                console.error('[Bridge] Connection closed');
                if (this.isConnected) {
                    process.exit(0);
                }
            });
            
            // Connection timeout
            setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('Connection timeout'));
                }
            }, TIMEOUT);
        });
    }

    private setupBidirectionalForwarding(): void {
        if (!this.client) return;

        // Forward stdin to extension
        process.stdin.pipe(this.client);
        
        // Forward extension responses to stdout
        this.client.pipe(process.stdout);
        
        // Handle process termination
        process.stdin.on('end', () => {
            console.error('[Bridge] stdin closed, terminating');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.error('[Bridge] Received SIGTERM, terminating');
            this.cleanup();
            process.exit(0);
        });
        
        process.on('SIGINT', () => {
            console.error('[Bridge] Received SIGINT, terminating');
            this.cleanup();
            process.exit(0);
        });
    }

    private cleanup(): void {
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private exitWithError(message: string): void {
        console.error(`[Bridge] ❌ ${message}`);
        console.error('[Bridge] 💡 確保 VS Code 中已安裝並啟動 MCP VSCode Commands 擴展');
        process.exit(1);
    }
}

// Start the bridge
if (require.main === module) {
    console.error('[Bridge] 🚀 Starting stdio bridge...');
    new StdioBridge();
}

export { StdioBridge };
