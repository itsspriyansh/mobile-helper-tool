import colors from 'ansi-colors';
import ADB from 'appium-adb';

import Logger from '../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {Options, Platform, verifyOptionsResult} from '../interfaces';
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

export function showHelp(subcommand: string) {
  const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

  Logger.log(`Usage: ${colors.cyan(`npx @nightwatch/mobile-helper android ${subcommand} [options]`)}\n`);
  Logger.log(colors.yellow('Options:'));

  const help = getSubcommandOptionsHelp(subcmd);
  Logger.log(help);
  Logger.log();
}

export function verifyOptions(subcommand: string, options: Options): false | verifyOptionsResult {
  const optionsPassed = Object.keys(options).filter(option => options[option] !== false);
  const availableOptions = AVAILABLE_SUBCOMMANDS[subcommand].options;

  const availableOptionsNames = availableOptions.map(option => option.name);

  // Divide the mainOptionsPassed array in two arrays: mainOptionsPassed and optionFlagsPassed.
  // mainOptionsPassed contains the main option that is available for the subcommand.
  // optionFlagsPassed contains the options with string or boolean values corresponding to the main option.

  const mainOptionsPassed = optionsPassed.filter(option => availableOptionsNames.includes(option));
  const optionFlagsPassed = optionsPassed.filter(option => !availableOptionsNames.includes(option));

  if (mainOptionsPassed.length > 1) {
    // A subcommand can only have one main option.
    Logger.log(`${colors.red(`Too many options passed for subcommand ${subcommand}:`)} ${mainOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (mainOptionsPassed.length === 0 && optionFlagsPassed.length) {
    // If the main option is not present, then any other options present are invalid.
    Logger.log(`${colors.red(`Unknown option(s) passed for subcommand ${subcommand}:`)} ${optionFlagsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (mainOptionsPassed.length === 0 && optionFlagsPassed.length === 0) {
    // If no options are passed, then we simply return and continue with the default subcommand flow.
    return {
      mainOption: '',
      flags: []
    };
  }

  const mainOption = mainOptionsPassed[0];
  const availableOptionFlags = availableOptions.find(option => option.name === mainOption)?.flags;

  if (availableOptionFlags?.length) {
    // If the main option has flags, then check if the passed flags are valid.
    const flagsNames = availableOptionFlags.map(flag => flag.name);
    const flagsAliases: string[] = [];

    availableOptionFlags.forEach(option => flagsAliases.push(...option.alias));
    flagsNames.push(...flagsAliases);

    const unknownFlags = optionFlagsPassed.filter(option => !flagsNames.includes(option));

    if (unknownFlags.length) {
      Logger.log(`${colors.red(`Unknown flag(s) passed for ${mainOption} option:`)} ${unknownFlags.join(', ')}`);
      Logger.log(`(Allowed flags: ${(flagsNames.join(', '))})\n`);
      showHelp(subcommand);

      return false;
    }
  } else if (!availableOptionFlags?.length && optionFlagsPassed.length) {
    // If the main option does not have flags, then all the other options present are invalid.
    Logger.log(`${colors.red(`Unknown flag(s) passed for ${mainOption} option:`)} ${optionFlagsPassed.join(', ')}`);
    Logger.log('(none expected)\n');
    showHelp(subcommand);

    return false;
  }

  return {
    mainOption: mainOption,
    flags: optionFlagsPassed
  };
}

const deviceStateWithColor = (state: string) => {
  switch (state) {
    case 'device':
      return colors.green(state) + colors.gray(' (online)');
    case 'offline':
      return colors.red(state);
    default:
      return colors.gray(state);
  }
};

export async function showConnectedRealDevices() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedDevices = await adb.getConnectedDevices();
    const connectedRealDevices = connectedDevices.filter((device) => {
      return !device.udid.includes('emulator') && !device.udid.includes('_adb-tls-connect');
    });

    if (connectedRealDevices.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Connected Real Devices:'));

    connectedRealDevices.forEach((device, index) => {
      Logger.log(`  ${index+1}. udid/deviceId: ${colors.green(device.udid)} / state: ${deviceStateWithColor(device.state)}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occurred while showing connected real devices.'));
    console.error(error);

    return false;
  }
}

export async function showConnectedEmulators() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedEmulators = await adb.getConnectedEmulators();

    if (connectedEmulators.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Connected Emulators:'));

    connectedEmulators.forEach((emu, index) => {
      Logger.log(`  ${index+1}. udid/deviceId: ${colors.green(emu.udid)} / state: ${deviceStateWithColor(emu.state)}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occurred while showing connected emulators.'));
    console.error(error);

    return false;
  }
}

