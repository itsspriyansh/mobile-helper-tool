import inquirer from 'inquirer';
import colors from 'ansi-colors';

import {launchAVD} from '../../adb';
import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getBinaryLocation} from '../../utils/common';

export async function connectAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);

  if (!avdmanagerLocation) {
    Logger.log(`${colors.red('avdmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

    return false;
  }

  const availableAVDs = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');

  if (availableAVDs) {
    const avdAnswer = await inquirer.prompt({
      type: 'list',
      name: 'avdName',
      message: 'Select the AVD to connect:',
      choices: availableAVDs.split('\n').filter(avd => avd !== '')
    });
    const avdName = avdAnswer.avdName;

    Logger.log();
    Logger.log(`Connecting to ${avdName}...`);
    const connectingAvd = await launchAVD(sdkRoot, platform, avdName);

    if (connectingAvd) {
      return true;
    }

    return false;
  } else {
    Logger.log(`${colors.red('No AVDs found!')} Use ${colors.magenta('--setup')} flag with the main command to setup missing requirements.`);
  }

  return false;
}