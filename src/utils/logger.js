import chalk from 'chalk';

export const log = console.log;
export const info = (msg) => log(chalk.blue(`[INFO] ${msg}`));
export const success = (msg) => log(chalk.green(`[SUCCESS] ${msg}`));
export const warning = (msg) => log(chalk.yellow(`[WARNING] ${msg}`));
export const error = (msg) => log(chalk.red(`[ERROR] ${msg}`));