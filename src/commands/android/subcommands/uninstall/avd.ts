import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {execBinarySync} from '../../utils/sdk';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';

export async function deleteAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    if (!avdmanagerLocation) {
      Logger.log(`${colors.red('avdmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }

    const installedAvds = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
    if (!installedAvds) {
      Logger.log(`${colors.yellow('Failed to fetch installed AVDs.')} Please try again.`);

      return false;
    }

    const avdAnswer = await inquirer.prompt({
      type: 'list',
      name: 'avdName',
      message: 'Select the AVD to delete:',
      choices: installedAvds.split('\n').filter(avd => avd !== '')
    });
    const avdName = avdAnswer.avdName;

    Logger.log();
    Logger.log(`Deleting ${colors.cyan(avdName)}...\n`);

    execBinarySync(avdmanagerLocation, 'avdmanager', platform, `delete avd --name '${avdName}'`);

    const installedAvdsAfterDelete = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');

    if (installedAvdsAfterDelete?.includes(avdName)) {
      Logger.log(`${colors.red('Failed to delete AVD!')} Please try again.`);

      return false;
    }

    Logger.log(`${colors.green('AVD deleted successfully!')}`);

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while deleting AVD.'));
    console.error(error);

    return false;
  }
}