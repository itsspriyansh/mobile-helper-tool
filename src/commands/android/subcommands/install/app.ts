import path from 'path';
import {homedir} from 'os';
import ADB from 'appium-adb';
import {existsSync} from 'fs';
import inquirer from 'inquirer';
import colors from 'ansi-colors';

import Logger from '../../../../logger';
import {execBinarySync} from '../../utils/sdk';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';

export async function installApp(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (!adbLocation) {
      Logger.log(`${colors.red('ADB not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }

    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
      Logger.log(`${colors.red('No device found running.')} Please connect a device to install the APK.`);
      Logger.log(`Use ${colors.cyan('npx @nightwatch/mobile-helper android connect')} to connect to a device.\n`);

      return true;
    } else if (devices.length === 1) {
      // if only one device is connected, then set that device's id to options.s
      options.s = devices[0].udid;
    }

    if (options.s && devices.length > 1) {
      // If device id is passed and there are multiple devices connected then
      // check if the id is valid. If not then prompt user to select a device.
      const device = devices.find(device => device.udid === options.s);
      if (!device) {
        Logger.log(`${colors.yellow('Invalid device Id!')} Please select a valid running device.\n`);

        options.s = '';
      }
    }

    if (!options.s) {
      // if device id not found, or invalid device id is found, then prompt the user
      // to select a device from the list of running devices.
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to install the APK:',
        choices: devices.map(device => device.udid)
      });
      options.s = deviceAnswer.device;

      Logger.log();
    }

    if (!options.path) {
      // if path to APK is not provided, then prompt the user to enter the path.
      const apkPathAnswer = await inquirer.prompt({
        type: 'input',
        name: 'apkPath',
        message: 'Enter the path to the APK file:'
      });
      options.path = apkPathAnswer.apkPath;

      Logger.log();
    }

    // convert to absolute path
    options.path = path.resolve(homedir(), options.path as string);

    if (!existsSync(options.path)) {
      Logger.log(`${colors.red('APK file not found!')} Please provide a valid path to the APK file.\n`);

      return false;
    }

    execBinarySync(adbLocation, 'adb', platform, `-s ${options.s} install ${options.path}`);

    return true;
  } catch (error) {
    Logger.log('Error occured while installing APK');
    console.error('Error:', error);

    return false;
  }
}