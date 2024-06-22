import ADB from 'appium-adb';
import inquirer from 'inquirer';
import colors from 'ansi-colors';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getBinaryLocation} from '../../utils/common';

export async function disconnect(sdkRoot: string, platform: Platform) {
  const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
  const adb = await ADB.createADB({allowOfflineDevices: true});
  const devices = await adb.getConnectedDevices();

  if (devices.length === 0) {
    Logger.log(`${colors.yellow('No device found running.')}`);

    return true;
  }

  const deviceAnswer = await inquirer.prompt({
    type: 'list',
    name: 'device',
    message: 'Select the device to disconnect:',
    choices: devices.map((device) => device.udid)
  });
  const deviceId = deviceAnswer.device;

  let disconnecting;
  if (deviceId.includes('emulator')) {
    disconnecting = execBinarySync(adbLocation, 'adb', platform, `-s ${deviceId} emu kill`);
  } else {
    disconnecting = execBinarySync(adbLocation, 'adb', platform, `disconnect ${deviceId}`);
  }
  console.log(disconnecting);

  return false;
}