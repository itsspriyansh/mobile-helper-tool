import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {connectAvd} from './avd';
import {listRunningDevices} from './list';
import {connectWirelessAdb} from './wireless';
import {verifyOptions} from '../common';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('connect', options);

  if (!optionsVerified) {
    return false;
  } else if (typeof optionsVerified !== 'boolean') {
    await optionsPrompt(options);
  }

  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  } else if (options.avd) {
    return await connectAvd(sdkRoot, platform);
  } else if (options.list) {
    return await listRunningDevices();
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