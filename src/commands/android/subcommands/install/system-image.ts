import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {AvailableSystemImages, Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getBinaryLocation} from '../../utils/common';
import {APILevelNames} from '../../constants';

export async function installSystemImage(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);

    if (!sdkmanagerLocation) {
      Logger.log(`${colors.red('sdkmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }

    const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list | grep "system-images;"');

    if (!stdout) {
      Logger.log(`${colors.red('Failed to fetch system images!')} Please try again.`);

      return false;
    }

    const images = stdout.split('\n').sort();
    const imageNames = new Set<string>();

    images.forEach(image => {
      const imageName = image.split('|')[0].trim();
      imageNames.add(imageName);
    });

    const availableSystemImages: AvailableSystemImages = {};

    imageNames.forEach(image => {
      if (!image.includes('system-image')) {
        return;
      }

      const imageSplit = image.split(';');
      const apiLevel = imageSplit[1];
      const type = imageSplit[2];
      const arch = imageSplit[3];

      if (!availableSystemImages[apiLevel]) {
        availableSystemImages[apiLevel] = [];
      }

      const imageType = availableSystemImages[apiLevel].find(image => image.type === type);

      if (!imageType) {
        availableSystemImages[apiLevel].push({
          type: type,
          archs: [arch]
        });
      } else {
        imageType.archs.push(arch);
      }
    });

    const apiLevelsWithNames = Object.keys(availableSystemImages).map(apiLevel => {
      if (APILevelNames[apiLevel]) {

        return `${apiLevel} - ${APILevelNames[apiLevel].name} (v${APILevelNames[apiLevel].version})`;
      }

      return apiLevel;
    });

    const androidVersionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'androidVersion',
      message: 'Select the Android version for system image:',
      choices: apiLevelsWithNames
    });
    const apiLevel = androidVersionAnswer.androidVersion.split(' ')[0];

    Logger.log();

    const systemImageTypeAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImageType',
      message: `Select the system image type for ${colors.cyan(apiLevel)}:`,
      choices: availableSystemImages[apiLevel].map(image => image.type)
    });

    Logger.log();

    const systemImageArchAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImageArch',
      message: 'Select the architecture for the system image:',
      choices: availableSystemImages[apiLevel].find(image => image.type === systemImageTypeAnswer.systemImageType)?.archs
    });

    const systemImageFullName = `system-images;${apiLevel};${systemImageTypeAnswer.systemImageType};${systemImageArchAnswer.systemImageArch}`;

    Logger.log();
    Logger.log(`Downloading ${colors.cyan(systemImageFullName)}...\n`);

    const downloading = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `'${systemImageFullName}'`);

    if (downloading) {
      Logger.log(`${colors.green('System image downloaded successfully!')}`);

      return true;
    }

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while installing system image.'));
    console.error(error);

    return false;
  }
}