/**
 * MCP SSE Server 測試工具
 * 用於測試 VSCode MCP 擴展的 SSE server 連接
 */

const http = require('http');

// 測試 SSE 連接
function testSSEConnection(port) {
    console.log(`🔍 測試 SSE 連接到 port ${port}...`);
    
    const options = {
        hostname: '127.0.0.1',
        port: port,
        path: '/mcp/sse',
        method: 'GET',
        headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`✅ SSE 連接成功! 狀態碼: ${res.statusCode}`);
        console.log('📡 Response Headers:');
        Object.entries(res.headers).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        console.log('');
        
        let dataCount = 0;
        res.on('data', (chunk) => {
            dataCount++;
            const data = chunk.toString().trim();
            if (data) {
                console.log(`📥 收到數據 #${dataCount}:`, data);
            }
        });
        
        res.on('end', () => {
            console.log('🔚 SSE 連接結束');
        });
        
        // 10秒後關閉測試
        setTimeout(() => {
            req.destroy();
            console.log('⏹️  測試完成 - 連接已關閉');
            process.exit(0);
        }, 10000);
    });

    req.on('error', (err) => {
        console.error(`❌ 連接錯誤 (port ${port}):`, err.message);
        
        // 如果是連接被拒絕，提示用戶先啟動 server
        if (err.code === 'ECONNREFUSED') {
            console.log('');
            console.log('💡 解決方法:');
            console.log('   1. 在 VSCode 中執行命令 "Start MCP Server"');
            console.log('   2. 檢查 VSCode 開發者控制台中的 server URL');
            console.log('   3. 使用正確的端口號重新測試');
        }
    });

    req.setTimeout(5000, () => {
        console.log('⏰ 連接超時');
        req.destroy();
    });

    req.end();
}

// 掃描端口範圍
function scanPorts(startPort, endPort) {
    console.log(`🔍 掃描端口範圍 ${startPort}-${endPort}...`);
    
    for (let port = startPort; port <= endPort; port++) {
        const options = {
            hostname: '127.0.0.1',
            port: port,
            path: '/mcp/sse',
            method: 'HEAD',
            timeout: 1000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200 || res.statusCode === 405) {
                console.log(`✅ 找到 MCP Server 在 port ${port}`);
                testSSEConnection(port);
                return;
            }
        });

        req.on('error', () => {
            // 忽略連接錯誤，繼續掃描
        });

        req.setTimeout(1000, () => {
            req.destroy();
        });

        req.end();
    }
    
    // 給掃描一些時間
    setTimeout(() => {
        console.log('❌ 未找到運行中的 MCP Server');
        console.log('請先在 VSCode 中執行 "Start MCP Server" 命令');
    }, 2000);
}

// 主程式
console.log('🚀 MCP SSE Server 測試工具');
console.log('================================');

// 檢查命令行參數
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('💡 使用方法:');
    console.log('   node test-sse-server.js <port>     # 測試特定端口');
    console.log('   node test-sse-server.js scan       # 自動掃描端口');
    console.log('');
    console.log('🔍 自動掃描常用端口...');
    scanPorts(3000, 3010);
} else if (args[0] === 'scan') {
    const startPort = parseInt(args[1]) || 3000;
    const endPort = parseInt(args[2]) || 8080;
    scanPorts(startPort, endPort);
} else {
    const port = parseInt(args[0]);
    if (isNaN(port) || port < 1 || port > 65535) {
        console.error('❌ 無效的端口號:', args[0]);
        console.log('端口號必須在 1-65535 之間');
        process.exit(1);
    }
    testSSEConnection(port);
}