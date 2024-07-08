import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {verifyOptions} from '../common';
import {connectAVD} from './emulator';
import {connectWirelessAdb} from './wireless';

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
  } else if (options.emulator) {
    return await connectAVD(options, sdkRoot, platform);
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
    options.emulator = true;
  }

  Logger.log();
}