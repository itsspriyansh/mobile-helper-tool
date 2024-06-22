import inquirer from 'inquirer';
import colors from 'ansi-colors';

import Logger from '../../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../../constants';
import {Options, Platform} from '../../interfaces';
import {connectAvd} from './avd';
import {listRunningDevices} from './list';
import {connectWirelessAdb} from './wireless';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  await verifyOptions(options);

  if (options.wireless) {
    return await connectWirelessAdb(sdkRoot, platform);
  } else if (options.avd) {
    return await connectAvd(sdkRoot, platform);
  } else if (options.list) {
    return await listRunningDevices();
  }

  return false;
}

async function verifyOptions(options: Options): Promise<boolean> {
  const availableOptions = AVAILABLE_SUBCOMMANDS['connect'].options.map(option => option.name);
  const optionsPassed = availableOptions.filter(option => options[option] === true);

  if (optionsPassed.length > 1) {
    Logger.log(colors.red('Too many options passed!'));

    return false;
  }

  if (optionsPassed.length === 0) {
    const connectOptionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'connectOption',
      message: 'Select the type of device to connect:',
      choices: ['Real Device', 'AVD']
    });

    const connectOption = connectOptionAnswer.connectOption;
    if (connectOption === 'Real Device') {
      options.wireless = true;
    } else if (connectOption === 'AVD') {
      options.avd = true;
    }

    Logger.log();
  }

  return true;
}