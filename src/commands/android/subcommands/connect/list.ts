import ADB from 'appium-adb';
import Logger from '../../../../logger';
import colors from 'ansi-colors';

export async function listRunningDevices() {
  const adb = await ADB.createADB({allowOfflineDevices: true});
  const devices = await adb.getConnectedDevices();

  if (devices.length === 0) {
    Logger.log('No device connected.');

    return true;
  }

  Logger.log(colors.bold('Connected Devices:'));

  const maxUdidLength = devices.reduce(
    (max, device) => Math.max(max, device.udid.length),
    0
  );
  const paddedLength = maxUdidLength + 2;

  devices.forEach((device) => {
    const paddedUdid = device.udid.padEnd(paddedLength);
    Logger.log(`${paddedUdid}${device.state}`);
  });

  return true;
}