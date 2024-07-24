import colors from 'ansi-colors';
import ADB from 'appium-adb';

import Logger from '../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {Options, Platform} from '../interfaces';
import {getSubcommandOptionsHelp} from '../utils/common';
import {execBinarySync} from '../utils/sdk';

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

function showHelp(subcommand: string) {
  const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

  Logger.log(`Usage: ${colors.cyan(`npx @nightwatch/mobile-helper android ${subcommand} [options]`)}\n`);
  Logger.log(colors.yellow('Options:'));

  const help = getSubcommandOptionsHelp(subcmd);
  Logger.log(help);
  Logger.log();
}

export function verifyOptions(subcommand: string, options: Options): boolean {
  const optionsPassed = Object.keys(options).filter(option => options[option] !== false);
  const availableOptions = AVAILABLE_SUBCOMMANDS[subcommand].options;

  const availableOptionsNames = availableOptions.map(option => option.name);

  // Divide the optionsPassed array in two arrays: mainOptionsPassed and valuedOptionsPassed.
  // mainOptionsPassed contains the main option that is available for the subcommand.
  // valuedOptionsPassed contains the options with string values corresponding to the main option.

  const mainOptionsPassed = optionsPassed.filter(option => availableOptionsNames.includes(option));
  const valuedOptionsPassed = optionsPassed.filter(option => !availableOptionsNames.includes(option));

  if (mainOptionsPassed.length > 1) {
    // A subcommand can only have one main option.
    Logger.log(`${colors.red('Too many options passed:')} ${mainOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (mainOptionsPassed.length === 0) {
    // If the main option is not present, then any other options present are invalid.
    Logger.log(`${colors.red('Unknown option(s) passed:')} ${valuedOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  }

  const mainOption = mainOptionsPassed[0];
  const availableValuedOptions = availableOptions.find(option => option.name === mainOption)?.valuedOptions;

  if (availableValuedOptions?.length) {
    // If the main option has valued options, then check if the passed valued options are valid.
    const valuedOptionsNames = availableValuedOptions.map(option => option.name);
    const valuedOptionsAliases: string[] = [];

    availableValuedOptions.forEach(option => valuedOptionsAliases.push(...option.alias));
    valuedOptionsNames.push(...valuedOptionsAliases);

    const unknownValuedOptions = valuedOptionsPassed.filter(option => !valuedOptionsNames.includes(option));

    if (unknownValuedOptions.length) {
      Logger.log(`${colors.red('Unknown option(s) passed:')} ${unknownValuedOptions.join(', ')}`);
      showHelp(subcommand);

      return false;
    }
  } else if (!availableValuedOptions?.length && valuedOptionsPassed.length) {
    // If the main option does not have valued options, then all the other options present are invalid.
    Logger.log(`${colors.red('Unknown option(s) passed:')} ${valuedOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  }

  return true;
}

export async function showConnectedRealDevices() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedDevices = await adb.getConnectedDevices();
    const connectedRealDevices = connectedDevices.filter((device) => !device.udid.includes('emulator'));

    if (connectedRealDevices.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Connected Real Devices:'));

    connectedRealDevices.forEach((device) => {
      Logger.log(`  ${device.udid} - ${device.state}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while showing connected real devices.'));
    console.error(error);

    return false;
  }
}

export async function showRunningAVDs() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedAVDs = await adb.getConnectedEmulators();

    if (connectedAVDs.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Running AVDs:'));

    connectedAVDs.forEach((avd) => {
      Logger.log(`  ${avd.udid} - ${avd.state}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while showing running AVDs.'));
    console.error(error);

    return false;
  }
}

