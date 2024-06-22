import ADB from 'appium-adb';
import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {execBinarySync} from '../../utils/sdk';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';

export async function uninstallApp(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
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

    const appNameAnswer = await inquirer.prompt({
      type: 'input',
      name: 'appName',
      message: 'Enter the name of the APK to uninstall:'
    });

    Logger.log();

    const packageNames = execBinarySync(adbLocation, 'adb', platform, `-s ${options.s} shell pm list packages '${appNameAnswer.appName}'`);
    if (!packageNames) {
      Logger.log(`${colors.red('APK not found!')} Please try again.`);

      return false;
    }

    const packagesList: string[] = [];

    packageNames.split('\n').forEach(line => {
      if (line.includes('package:')) {
        packagesList.push(line.split(':')[1].trim());
      }
    });

    let packageName = packagesList[0];

    if (packagesList.length > 1) {
      const packageNameAnswer = await inquirer.prompt({
        type: 'list',
        name: 'packageName',
        message: 'Select the package you want to uninstall:',
        choices: packagesList
      });

      packageName = packageNameAnswer.packageName;
      Logger.log();
    }

    const confirmUninstallationAnswer = await inquirer.prompt({
      type: 'list',
      name: 'confirm',
      message: `Are you sure you want to uninstall ${colors.cyan(packageName)}`,
      choices: ['Yes', 'No']
    });

    Logger.log();

    if (confirmUninstallationAnswer.confirm === 'No') {
      Logger.log('Uninstallation cancelled.');

      return false;
    }

    Logger.log(`Uninstalling ${colors.cyan(packageName)}...\n`);

    execBinarySync(adbLocation, 'adb', platform, `-s ${options.s} uninstall ${packageName}`);

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while uninstalling APK.'));
    console.error(error);

    return false;
  }
}