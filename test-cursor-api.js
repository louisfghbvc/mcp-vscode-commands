#!/usr/bin/env node

/**
 * Test script for Cursor MCP Extension API integration
 * This script simulates the extension environment and tests the API integration
 */

const fs = require('fs');
const path = require('path');

// Mock vscode module for testing
const mockVSCode = {
    workspace: {
        getConfiguration: () => ({
            get: (key, defaultValue) => defaultValue
        })
    },
    window: {
        showInformationMessage: (message) => {
            console.log('📢 Info:', message);
        },
        showWarningMessage: (message) => {
            console.log('⚠️  Warning:', message);
        },
        showErrorMessage: (message) => {
            console.log('❌ Error:', message);
        }
    },
    commands: {
        registerCommand: (command, handler) => {
            console.log('📝 Registered command:', command);
            return { dispose: () => {} };
        }
    },
    // Test both scenarios: with and without Cursor API
    cursor: process.env.TEST_CURSOR_API === 'true' ? {
        mcp: {
            registerServer: (config) => {
                console.log('🚀 Cursor API: registerServer called with:', JSON.stringify(config, null, 2));
            },
            unregisterServer: (name) => {
                console.log('🛑 Cursor API: unregisterServer called with:', name);
            }
        }
    } : undefined
};

// Create mock extension context
const mockContext = {
    extensionPath: __dirname,
    subscriptions: []
};

// Load the compiled extension
const extensionPath = path.join(__dirname, 'out', 'extension.js');

if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension file not found:', extensionPath);
    process.exit(1);
}

async function testCursorAPIIntegration() {
    console.log('🧪 Testing Cursor MCP Extension API Integration...');
    
    // Mock the vscode module
    require.cache[require.resolve('vscode')] = {
        exports: mockVSCode,
        loaded: true
    };

    try {
        // Test 1: With Cursor API available
        console.log('\n🔬 Test 1: Cursor API Available');
        process.env.TEST_CURSOR_API = 'true';
        
        // Reload the extension
        delete require.cache[extensionPath];
        const extension1 = require('./out/extension.js');
        
        console.log('📋 Activating extension with Cursor API...');
        extension1.activate(mockContext);
        
        console.log('📋 Deactivating extension...');
        extension1.deactivate();
        
        // Test 2: Without Cursor API (fallback mode)
        console.log('\n🔬 Test 2: Cursor API Not Available (Fallback Mode)');
        process.env.TEST_CURSOR_API = 'false';
        
        // Create fresh mock without Cursor API
        const mockVSCodeWithoutCursor = { ...mockVSCode };
        delete mockVSCodeWithoutCursor.cursor;
        
        require.cache[require.resolve('vscode')] = {
            exports: mockVSCodeWithoutCursor,
            loaded: true
        };
        
        // Reload the extension
        delete require.cache[extensionPath];
        const extension2 = require('./out/extension.js');
        
        console.log('📋 Activating extension without Cursor API...');
        extension2.activate(mockContext);
        
        console.log('📋 Deactivating extension...');
        extension2.deactivate();
        
        console.log('\n✅ All tests completed successfully!');
        return true;
        
    } catch (error) {
        console.error('💥 Test failed:', error);
        return false;
    }
}

// Run the test
testCursorAPIIntegration().then(success => {
    if (success) {
        console.log('🎉 Cursor API integration test passed!');
        process.exit(0);
    } else {
        console.log('💥 Cursor API integration test failed!');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
});
