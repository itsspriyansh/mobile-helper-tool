import inquirer from 'inquirer';

import {createAvd} from './avd';
import {installApp} from './app';
import {verifyOptions} from '../common';
import Logger from '../../../../logger';
import {installSystemImage} from './system-image';
import {Options, Platform} from '../../interfaces';

export async function install(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('install', options);

  if (!optionsVerified) {
    return false;
  } else if (typeof optionsVerified !== 'boolean') {
    await optionsPrompt(options);
  }

  if (options.avd) {
    return await createAvd(sdkRoot, platform);
  } else if (options.app) {
    return await installApp(options, sdkRoot, platform);
  } else if (options['system-image']) {
    return await installSystemImage(sdkRoot, platform);
  }

  return false;
}

async function optionsPrompt(options: Options) {
  const connectOptionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'connectOption',
    message: 'Select the item you want to install:',
    choices: ['AVD', 'System Image', 'APK']
  });

  const connectOption = connectOptionAnswer.connectOption;
  if (connectOption === 'AVD') {
    options.avd = true;
  } else if (connectOption === 'System Image') {
    options['system-image'] = true;
  } else if (connectOption === 'APK') {
    options.app = true;
  }

  Logger.log();
}
