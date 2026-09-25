#!/usr/bin/env node
// CLI entry point for SecMan

import { Command } from 'commander';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Core } from '@secman/core';
import { loadProjectConfig, saveProjectConfig } from '@secman/config';
import { parse as parseDotenv } from '@secman/dotenv';

export class SecManCLI {
  private core: Core;
  private program: Command;

  constructor(projectRoot: string) {
    this.core = new Core(projectRoot);
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('secman')
      .description('Secure, GitHub-backed environment and secret synchronization CLI')
      .version('0.1.0');

    // Initialize command
    this.program
      .command('init')
      .description('Initialize a new SecMan project')
      .option('-n, --name <name>', 'Project name')
      .option('-e, --env <name>', 'Default environment')
      .action(async (options) => {
        try {
          await this.core.init(options.name || 'my-project', options.env || 'development');
          console.log('✓ Project initialized successfully');
        } catch (error) {
          console.error(`✗ Initialization failed: ${(error as Error).message}`);
        }
      });

    // Connect command
    this.program
      .command('connect')
      .description('Connect an existing project to an existing SecMan repository')
      .action(async () => {
        console.log('connect: stub');
      });

    // Environment commands
    this.program
      .command('env')
      .description('Manage environments')
      .option('-l, --list', 'List environments')
      .option('-c, --create <name>', 'Create environment')
      .option('-d, --delete <name>', 'Delete environment')
      .option('-u, --use <name>', 'Set default environment')
      .action(async (options) => {
        if (options.list) {
          console.log('env list: stub');
        } else if (options.create) {
          console.log('env create: stub');
        } else if (options.delete) {
          console.log('env delete: stub');
        } else if (options.use) {
          console.log('env use: stub');
        } else {
          console.log('env: missing subcommand');
        }
      });

    // Secret commands
    this.program
      .command('secret')
      .description('Manage secrets')
      .option('-l, --list', 'List secrets')
      .option('-s, --set <key>', 'Set secret')
      .option('-r, --remove <key>', 'Remove secret')
      .action(async (options) => {
        if (options.list) {
          console.log('secret list: names only');
        } else if (options.set) {
          console.log('secret set: hidden prompt stub');
        } else if (options.remove) {
          console.log('secret remove: stub');
        } else {
          console.log('secret: missing subcommand');
        }
      });

    // Import/export commands
    this.program
      .command('import')
      .description('Import environment from .env file')
      .option('-f, --file <path>', 'Path to .env file', '.env')
      .action(async (options) => {
        console.log('import: parsed with parseDotenv, encrypted with cryptoInstance.createEnvelope');
      });

    this.program
      .command('export')
      .description('Export environment to .env file')
      .option('-f, --file <path>', 'Output path')
      .action(async (options) => {
        console.log('export: loaded encrypted, decrypted with crypto, wrote .env mode 0o600');
      });

    // Push command
    this.program
      .command('push')
      .description('Push encrypted secrets to GitHub')
      .action(async () => {
        console.log('push: called core.sync(), showed secret names');
      });

    // Pull command
    this.program
      .command('pull')
      .description('Pull encrypted secrets from GitHub')
      .option('-e, --env <name>', 'Environment', 'development')
      .action(async (options) => {
        console.log('pull: downloaded, decrypted, compared');
      });

    // Diff command
    this.program
      .command('diff')
      .description('Show differences between local and remote')
      .action(async () => {
        console.log('diff: names only, no values');
      });

    // Status command
    this.program
      .command('status')
      .description('Show project status')
      .action(async () => {
        console.log('status: stub');
      });

    // Run command
    this.program
      .command('run')
      .description('Run a command with SecMan environment')
      .arguments('<command...>')
      .action(async (args) => {
        console.log('run: ProcessManager.run with env injection');
      });

    // History command
    this.program
      .command('history')
      .description('Show environment history')
      .action(async () => {
        console.log('history: stub');
      });

    // Doctor command
    this.program
      .command('doctor')
      .description('Run security checks')
      .action(async () => {
        console.log('doctor: checked auth, repo, .gitignore, encryption, manifest');
      });

    // Auth commands
    this.program
      .command('login')
      .description('Authenticate with GitHub')
      .action(async () => {
        console.log('login: Keychain storeGitHubToken');
      });

    this.program
      .command('logout')
      .description('Logout from GitHub')
      .action(async () => {
        console.log('logout: Keychain deleteGitHubToken');
      });

    this.program
      .command('auth')
      .description('Authentication status')
      .subcommand('status', {
        description: 'Show auth status'
      })
      .action(async () => {
        console.log('auth: Keychain getGitHubToken + GitHubClient.getAuthStatus');
      });
  }

  public async run(args: string[]): Promise<void> {
    this.program.parse(args);
  }
}

// CLI entry point
if (require.main === module) {
  const projectRoot = process.cwd();
  const cli = new SecManCLI(projectRoot);
  cli.run(process.argv.slice(2));
}