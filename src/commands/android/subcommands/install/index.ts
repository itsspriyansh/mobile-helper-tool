import inquirer from 'inquirer';

import {createAvd} from './avd';
import {installApp} from './app';
import {verifyOptions} from '../common';
import {installSystemImage} from './system-image';
import {Options, Platform} from '../../interfaces';

export async function install(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsPassed = Object.keys(options).filter(option => options[option] !== false);

  if (optionsPassed.length === 0) {
    // if no option is passed then prompt the user to select one.
    await optionsPrompt(options);
  } else {
    // verify the options passed.
    const optionsVerified = verifyOptions('install', options);
    if (!optionsVerified) {
      return false;
    }
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
}
