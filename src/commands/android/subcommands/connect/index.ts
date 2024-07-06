import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {connectAvd} from './avd';
import {connectWirelessAdb} from './wireless';
import {verifyOptions} from '../common';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsPassed = Object.keys(options).filter(option => options[option] === true);

  if (optionsPassed.length === 0) {
    // if no option is passed then prompt the user to select one.
    await optionsPrompt(options);
  } else {
    // verify the options passed.
    const optionsVerified = verifyOptions('connect', optionsPassed);
    if (!optionsVerified) {
      return false;
    }
  }

  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  } else if (options.avd) {
    return await connectAvd(sdkRoot, platform);
  }

  return false;
}

async function optionsPrompt(options: Options) {
  const connectOptionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'connectOption',
    message: 'Select the type of device you want to connect:',
    choices: ['Real Device', 'AVD']
  });

  const connectOption = connectOptionAnswer.connectOption;
  if (connectOption === 'Wireless ADB') {
    options.wireless = true;
  } else if (connectOption === 'AVD') {
    options.avd = true;
  }

  Logger.log();
}