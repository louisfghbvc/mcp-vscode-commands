# MCP VSCode Commands Extension

A VSCode extension that allows LLMs to directly execute VSCode commands through the **Model Context Protocol (MCP)**.

## ✨ Features

- 🔧 **Execute VSCode Commands**: Run any VSCode built-in or extension commands via MCP
- 📋 **List Available Commands**: Dynamically retrieve all available commands with filtering support
- 🔒 **Safe Execution**: Complete error handling and result serialization
- 🚀 **Real-time Communication**: MCP protocol implementation over stdio

## 🛠️ MCP Tools

### `vscode.executeCommand`
Execute a specified VSCode command
- **Parameters**: `commandId` (required), `args` (optional)
- **Examples**: Format document, open settings, save files, etc.

### `vscode.listCommands`  
List all available VSCode commands
- **Parameters**: `filter` (optional) - Filter string
- **Returns**: Filtered list of commands

## 📦 Installation & Usage

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Project
```bash
npm run compile
```

### 3. Launch Extension
1. Open this project in VSCode
2. Press `F5` to open Extension Development Host
3. In the new window, the extension will automatically start the MCP server

### 4. Connect LLM
The MCP server communicates with LLMs via **stdio**. LLMs can use the following tools:

## 🎯 Usage Examples

### List Editor-Related Commands
```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "editor"
  }
}
```

### Format Current Document
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "editor.action.formatDocument"
  }
}
```

### Open Settings Page
```json
{
  "name": "vscode.executeCommand", 
  "arguments": {
    "commandId": "workbench.action.openSettings"
  }
}
```

### Execute Command with Arguments
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "vscode.open",
    "args": ["file:///path/to/file.txt"]
  }
}
```

## 🔧 Configuration Options

Configure in VSCode settings:
- `mcpVscodeCommands.autoStart`: Auto-start MCP server (default: true)
- `mcpVscodeCommands.logLevel`: Log level (default: info)

## 📚 Common Commands

### Editor Operations
- `editor.action.formatDocument` - Format current document
- `editor.action.organizeImports` - Organize imports
- `editor.action.commentLine` - Comment/uncomment lines
- `editor.action.duplicateSelection` - Duplicate selection

### Workspace Operations
- `workbench.action.files.save` - Save current file
- `workbench.action.files.saveAll` - Save all files
- `workbench.action.closeActiveEditor` - Close current editor
- `workbench.action.openSettings` - Open settings

### Navigation Operations
- `workbench.action.quickOpen` - Quick open files
- `workbench.action.showCommands` - Show command palette
- `workbench.action.gotoSymbol` - Go to symbol

### Terminal Operations
- `workbench.action.terminal.new` - Open new terminal
- `workbench.action.terminal.toggleTerminal` - Toggle terminal

## ⚠️ Error Handling

If a command execution fails, an error message is returned:

```json
{
  "content": [{
    "type": "text", 
    "text": "❌ Error: Command 'invalid.command' does not exist"
  }],
  "isError": true
}
```

## 📖 More Examples

For detailed usage examples, see [examples/basic-usage.md](./examples/basic-usage.md)

## 🏗️ Development

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for development plan and architecture design.

## 🐛 Debugging

Check VSCode Developer Tools console for detailed logging information.

## 📝 License

MIT License