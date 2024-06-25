import inquirer from 'inquirer';

import {deleteAvd} from './avd';
import {uninstallApp} from './app';
import Logger from '../../../../logger';
import {verifyOptions} from '../common';
import {deleteSystemImage} from './system-image';
import {Options, Platform} from '../../interfaces';

export async function uninstall(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('uninstall', options);

  if (!optionsVerified) {
    return false;
  } else if (typeof optionsVerified !== 'boolean') {
    await optionsPrompt(options);
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
