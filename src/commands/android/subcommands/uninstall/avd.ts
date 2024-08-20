import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync, execBinaryAsync} from '../../utils/sdk';
import {showMissingBinaryHelp} from '../common';

export async function deleteAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    if (!avdmanagerLocation) {
      showMissingBinaryHelp('avdmanager');

      return false;
    }

    const installedAvds = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
    if (!installedAvds) {
      Logger.log(`${colors.yellow('Failed to fetch installed AVDs.')} Please try again.\n`);
      Logger.log('Alternatively, to see the list of installed AVDs, run the following command:');
      Logger.log(colors.cyan('  npx @nightwatch/mobile-helper android list --avd\n'));

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

    const deleteStatus = await execBinaryAsync(avdmanagerLocation, 'avdmanager', platform, `delete avd --name '${avdName}'`);

    if (deleteStatus?.includes('deleted')) {
      Logger.log(colors.green('AVD deleted successfully!\n'));

      return true;
    }

    Logger.log(`${colors.red('Something went wrong while deleting AVD.')}`);
    Logger.log(`Please run ${colors.cyan('npx @nightwatch/mobile-helper android list -avd')} to check if the AVD was deleted.`);
    Logger.log('If the AVD is still present, please try deleting the AVD again.\n');

    Logger.log('Error message:');
    Logger.log(deleteStatus);
    Logger.log();

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while deleting AVD.'));
    console.error(error);

    return false;
  }
}
