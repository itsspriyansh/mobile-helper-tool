import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getInstalledSystemImages} from '../common';
import {getBinaryLocation} from '../../utils/common';

export async function createAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);

    if (!avdmanagerLocation) {
      Logger.log(`${colors.red('avdmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }

    if (!sdkmanagerLocation) {
      Logger.log(`${colors.red('sdkmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }

    const installedAvds = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
    if (!installedAvds) {
      Logger.log(`${colors.yellow('Failed to fetch installed AVDs.')} Please try again.`);

      return false;
    }

    const avdNameAnswer = await inquirer.prompt({
      type: 'input',
      name: 'avdName',
      message: 'Enter a name for the AVD:'
    });
    const avdName = avdNameAnswer.avdName;

    Logger.log();

    if (installedAvds.includes(avdName)) {
      Logger.log(colors.yellow('AVD with the same name already exists!\n'));

      const overwriteAnswer = await inquirer.prompt({
        type: 'list',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing AVD?',
        choices: ['Yes', 'No']
      });

      if (overwriteAnswer.overwrite === 'No') {
        return false;
      }
      Logger.log();
    }

    const installedSystemImages: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);
    if (installedSystemImages.length === 0) {

      return false;
    }

    const systemImageAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImage',
      message: 'Select the system image to use for AVD:',
      choices: installedSystemImages
    });
    const systemImage = systemImageAnswer.systemImage;

    Logger.log();

    const deviceTypeAnswer = await inquirer.prompt({
      type: 'list',
      name: 'deviceType',
      message: 'Select the device type for AVD:',
      choices: ['Nexus', 'Pixel', 'Wear OS', 'Android TV', 'Desktop', 'Others']
    });
    const deviceType = deviceTypeAnswer.deviceType;

    const deviceTypesToGrepCommand: {[key: string]: string} = {
      'Nexus': 'nexus',
      'Pixel': 'pixel',
      'Wear OS': 'wear',
      'Android TV': 'tv',
      'Desktop': 'desktop',
      'Others': '-Ev "wear|Nexus|pixel|tv|desktop"'
    };

    Logger.log();

    const availableDevices = execBinarySync(avdmanagerLocation, 'avdmanager', platform, `list devices -c | grep ${deviceTypesToGrepCommand[deviceType]}`);

    if (!availableDevices) {
      Logger.log(`${colors.red('No devices found!')} Please try again.`);

      return false;
    }
    const availableDevicesList = availableDevices.split('\n').filter(device => device !== '');

    const deviceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'device',
      message: 'Select the device profile for AVD:',
      choices: availableDevicesList
    });
    const device = deviceAnswer.device;

    Logger.log();

    execBinarySync(avdmanagerLocation, 'avdmanager', platform, `create avd --name '${avdName}' --package '${systemImage}' --device '${device}' --force`);

    const installedAvdsAfterCreate = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');

    if (!installedAvdsAfterCreate) {
      Logger.log(`${colors.yellow('Failed to confirm AVD creation!')} Please try launching the AVD using ${colors.cyan('npx @nightwatch/mobile-helper android connect --avd')} to confirm.\n`);

      return false;
    } else if (!installedAvdsAfterCreate.includes(avdName)) {
      Logger.log(`${colors.red('Failed to create AVD!')} Please try again.`);

      return false;
    }

    Logger.log(`${colors.green('AVD created successfully!')}`);

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while creating AVD.'));
    console.error(error);

    return false;
  }
}