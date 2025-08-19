/**
 * Mock VSCode API for testing outside of VSCode environment
 */

interface MockExtension {
  id: string;
  isActive: boolean;
  activate(): Promise<void>;
}

interface MockExtensions {
  getExtension(id: string): MockExtension | undefined;
}

export const extensions: MockExtensions = {
  getExtension(id: string): MockExtension | undefined {
    if (id === 'louisfghbvc.mcp-vscode-commands') {
      return {
        id,
        isActive: true,
        async activate() {
          // Mock activation
        }
      };
    }
    return undefined;
  }
};

// Mock other VSCode APIs as needed
export const workspace = {
  name: 'test-workspace',
  workspaceFolders: []
};

export const window = {
  showInformationMessage: (message: string) => {
    console.log('Info:', message);
  },
  showErrorMessage: (message: string) => {
    console.error('Error:', message);
  }
};

export const commands = {
  executeCommand: async (command: string, ...args: any[]) => {
    console.log(`Mock executeCommand: ${command}`, args);
    return true;
  },
  getCommands: async (filterInternal?: boolean) => {
    return [
      'editor.action.formatDocument',
      'editor.action.commentLine',
      'workbench.action.quickOpen',
      'workbench.action.files.save'
    ];
  }
};

// Export everything as default for compatibility
export default {
  extensions,
  workspace,
  window,
  commands
};
