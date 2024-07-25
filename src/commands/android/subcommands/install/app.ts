import colors from 'ansi-colors';
import ADB from 'appium-adb';
import {existsSync} from 'fs';
import inquirer from 'inquirer';
import {homedir} from 'os';
import path from 'path';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation, getBinaryNameForOS} from '../../utils/common';
import {exec} from 'child_process';
// import {execBinarySync} from '../../utils/sdk';

export const execBinaryAsync = (
  binaryLocation: string,
  binaryName: string,
  platform: Platform,
  args: string
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    let cmd: string;
    if (binaryLocation === 'PATH') {
      const binaryFullName = getBinaryNameForOS(platform, binaryName);
      cmd = `${binaryFullName} ${args}`;
    } else {
      const binaryFullName = path.basename(binaryLocation);
      const binaryDirPath = path.dirname(binaryLocation);

      if (platform === 'windows') {
        cmd = `${binaryFullName} ${args}`;
      } else {
        cmd = `./${binaryFullName} ${args}`;
      }

      cmd = `cd ${binaryDirPath} && ${cmd}`;
    }

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log(
          `  ${colors.red(symbols().fail)} Failed to run ${colors.cyan(cmd)}`
        );
        reject(stderr);
      } else {
        resolve(stdout.toString());
      }
    });
  });
};

export async function installApp(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (!adbLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('adb')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (!devices.length) {
      Logger.log(`${colors.red('No device found running.')} Please connect a device to install the APK.`);
      Logger.log(`Use ${colors.cyan('npx @nightwatch/mobile-helper android connect')} to connect to a device.\n`);

      return true;
    } else if (devices.length === 1) {
      // if only one device is connected, then set that device's id to options.deviceId
      options.deviceId = devices[0].udid;
    }

    if (options.deviceId && devices.length > 1) {
      // If device id is passed and there are multiple devices connected then
      // check if the id is valid. If not then prompt user to select a device.
      const deviceConnected = devices.find(device => device.udid === options.deviceId);
      if (!deviceConnected) {
        Logger.log(`${colors.yellow('Invalid device Id passed!')}\n`);

        options.deviceId = '';
      }
    }

    if (!options.deviceId) {
      // if device id not found, or invalid device id is found, then prompt the user
      // to select a device from the list of running devices.
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to install the APK:',
        choices: devices.map(device => device.udid)
      });
      options.deviceId = deviceAnswer.device;
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

    Logger.log('Installing APK...');

    // const installationStatus = execBinarySync(adbLocation, 'adb', platform, `-s ${options.deviceId} install ${options.path}`);
    const installationStatus = await execBinaryAsync(adbLocation, 'adb', platform, `-s ${options.deviceId} install ${options.path}`);
    if (installationStatus?.includes('Success')) {
      Logger.log(colors.green('APK installed successfully!\n'));

      return true;
    }

    Logger.log(colors.red('Failed to install APK!'));
    console.log(installationStatus);

    return false;
  } catch (error) {
    Logger.log('Error occured while installing APK');
    console.error('Error:', error);

    return false;
  }
}

