import colors from 'ansi-colors';

import Logger from '../../../logger';
import {Options, Platform} from '../interfaces';
import {execBinarySync} from '../utils/sdk';
import {AVAILABLE_SUBCOMMANDS} from '../constants';

export async function getInstalledSystemImages(sdkmanagerLocation: string, platform: Platform): Promise<string[]> {
  const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list');

  if (!stdout) {
    Logger.log(`${colors.red('Failed to fetch system images!')} Please try again.`);

    return [];
  }
  const lines = stdout.split('\n');
  const installedImages: string[] = [];

  for (const line of lines) {
    if (line.includes('Available Packages:')) {
      break;
    }
    if (line.includes('system-images')) {
      installedImages.push(line.split('|')[0].trim());
    }
  }

  return installedImages;
}

function showHelp(subcommand: string, unknownOption?: string) {
  if (unknownOption) {
    Logger.log(`${colors.red(`unknown option passed: ${unknownOption}`)}`);
  }

  const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

  Logger.log(`Usage: ${colors.cyan(`npx @nightwatch/mobile-helper android ${subcommand} [options]`)}`);
  Logger.log();
  Logger.log(colors.yellow('Options:'));

  const longest = (xs: string[]) => Math.max.apply(null, xs.map(x => x.length));

  if (subcmd.options && subcmd.options.length > 0) {
    const optionLongest = longest(subcmd.options.map(option => `--${option.name}`));
    subcmd.options.forEach(option => {
      const optionStr = `--${option.name}`;
      const optionPadding = new Array(Math.max(optionLongest - optionStr.length + 3, 0)).join('.');
      Logger.log(`    ${optionStr} ${colors.grey(optionPadding)} ${colors.gray(option.description)}`);
    });
  }
}

export function verifyOptions(subcommand: string, options: Options): boolean | [] {
  const optionsPassed = Object.keys(options).filter(option => options[option] === true);

  if (optionsPassed.length === 0) {
    return [];
  } else if (optionsPassed.length > 1) {
    Logger.log(`${colors.red('Too many options passed:')} ${optionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (options.help) {
    showHelp(subcommand);

    return false;
  }

  const availableOptions = AVAILABLE_SUBCOMMANDS[subcommand].options.map(option => option.name);

  if (!availableOptions.includes(optionsPassed[0])) {
    showHelp(subcommand, optionsPassed[0]);

    return false;
  }

  return true;
}
