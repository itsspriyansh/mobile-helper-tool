import inquirer from 'inquirer';
import colors from 'ansi-colors';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getInstalledSystemImages} from '../common';
import {getBinaryLocation} from '../../utils/common';

export async function deleteSystemImage(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);

    if (!sdkmanagerLocation) {
      Logger.log(`${colors.red('sdkmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }
    const installedImages: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);

    if (installedImages.length === 0) {

      return false;
    }

    const systemImageAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImage',
      message: 'Select the system image to uninstall:',
      choices: installedImages
    });

    Logger.log();
    Logger.log(`Uninstalling ${colors.cyan(systemImageAnswer.systemImage)}...\n`);

    execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `--uninstall '${systemImageAnswer.systemImage}'`);

    const installedImagesAfterDelete: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);

    if (installedImagesAfterDelete.includes(systemImageAnswer.systemImage)) {
      Logger.log(`${colors.red('Failed to uninstall system image!')} Please try again.`);

      return false;
    }

    Logger.log(`${colors.green('System image uninstalled successfully!')}`);

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while uninstalling system image.'));
    console.error(error);

    return false;
  }
}