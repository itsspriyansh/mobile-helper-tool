import inquirer from 'inquirer';

import {deleteAvd} from './avd';
import {uninstallApp} from './app';
import Logger from '../../../../logger';
import {verifyOptions} from '../common';
import {deleteSystemImage} from './system-image';
import {Options, Platform} from '../../interfaces';

export async function uninstall(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsPassed = Object.keys(options).filter(option => options[option] !== false);

  if (optionsPassed.length === 0) {
    // if no option is passed then prompt the user to select one.
    await optionsPrompt(options);
  } else {
    // verify the options passed.
    const optionsVerified = verifyOptions('uninstall', options);
    if (!optionsVerified) {
      return false;
    }
  }

  if (options.avd) {
    return await deleteAvd(sdkRoot, platform);
  } else if (options.app) {
    return await uninstallApp(options, sdkRoot, platform);
  } else if (options['system-image']) {
    return await deleteSystemImage(sdkRoot, platform);
  }

  return false;
}

async function optionsPrompt(options: Options) {
  const connectOptionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'connectOption',
    message: 'Select the item you want to uninstall:',
    choices: ['AVD', 'System Image', 'App']
  });

  const connectOption = connectOptionAnswer.connectOption;
  if (connectOption === 'AVD') {
    options.avd = true;
  } else if (connectOption === 'System Image') {
    options['system-image'] = true;
  } else if (connectOption === 'App') {
    options.app = true;
  }

  Logger.log();
}
