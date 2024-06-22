import inquirer from 'inquirer';
import colors from 'ansi-colors';

import {createAvd} from './avd';
import {installApp} from './app';
import {Options, Platform} from '../../interfaces';
import {installSystemImage} from './system-image';
import {AVAILABLE_SUBCOMMANDS} from '../../constants';
import Logger from '../../../../logger';

export async function install(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  await verifyOptions(options);

  if (options.avd) {
    return await createAvd(sdkRoot, platform);
  } else if (options.app) {
    return await installApp(options, sdkRoot, platform);
  } else if (options['system-image']) {
    return await installSystemImage(sdkRoot, platform);
  }

  return false;
}

async function verifyOptions(options: Options): Promise<boolean> {
  const availableOptions = AVAILABLE_SUBCOMMANDS['install'].options.map(option => option.name);
  const optionsPassed = availableOptions.filter(option => options[option] === true);

  if (optionsPassed.length > 1) {
    Logger.log(colors.red('Too many options passed!'));

    return false;
  }

  if (optionsPassed.length === 0) {
    const connectOptionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'connectOption',
      message: 'Select which item you want to install:',
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

  return true;
}