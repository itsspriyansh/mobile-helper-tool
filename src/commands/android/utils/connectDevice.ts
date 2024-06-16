import {AvailableSystemImages, Options, Platform} from '../interfaces';
import {execBinarySync} from './sdk';
import Logger from '../../../logger';
import inquirer from 'inquirer';
import colors from 'ansi-colors';
import { getBinaryLocation } from './common';
import { launchAVD } from '../adb';
import ADB from 'appium-adb';
import { APILevelNames } from '../constants';
import { homedir } from 'os';
import path from 'path';
import { existsSync } from 'fs';

export async function connectWirelessAdb(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (adbLocation === '') {
      Logger.log(`${colors.red('ADB not found!')} Use ${colors.magenta('--setup')} flag with the main command to setup missing requirements.`);

      return false;
    }

    Logger.log(`${colors.yellow('Note: This feature is available only for Android 11 and above.\n')}`);

    Logger.log(`${colors.bold('Follow the below steps to connect to your device wirelessly:')}\n`);

    Logger.log(`1.Connect your device to the same network as your computer.`)
    Logger.log(`${colors.grey('You may connect your device to your computer\'s hotspot')}\n`);

    Logger.log(`2.Enable developer options on your device by going to:`);
    Logger.log(`${colors.cyan('Settings > About Phone > Build Number')}`);
    Logger.log(`Tap on build number 7 times until you see the message ${colors.bold('You are now a developer!')}\n`);

    Logger.log(`3.Enable wireless debugging on your device by searching ${colors.bold('wireless debugging')} in the search bar or by going to:`);
    Logger.log(`${colors.cyan('Settings > Developer Options > Wireless Debugging')}\n`);

    Logger.log(`4.Find the IP address and port number of your device on the wireless debugging screen`);
    Logger.log(`${colors.grey('IP address and port number are separated by \':\' in the format <ip_address:port>\nwhere IP address comes before \':\' and port number comes after \':\'')}\n`);
  
    const deviceIPAnswer = await inquirer.prompt({
      type: 'input',
      name: 'deviceIP',
      message: 'Enter the IP address of your device:'
    });
    const deviceIP = deviceIPAnswer.deviceIP;

    const portAnswer = await inquirer.prompt({
      type: 'input',
      name: 'port',
      message: 'Enter the port number:'
    });
    const port = portAnswer.port;

    Logger.log();
    Logger.log(`5.Now find your device's pairing code and pairing port number by going to:`);
    Logger.log(`${colors.cyan('Settings > Wireless Debugging > Pair device with pairing code')}`);
    Logger.log(`${colors.grey('Here you will find a pairing code and a')} ${colors.magenta('IP address:port')} ${colors.grey('combination.\nThe port number associated with the IP address is the required pairing port number.\n')}`);

    const pairingCodeAnswer = await inquirer.prompt({
      type: 'input',
      name: 'pairingCode',
      message: 'Enter the pairing code displayed on your device:'
    });
    const pairingCode = pairingCodeAnswer.pairingCode;

    const pairingPortAnswer = await inquirer.prompt({
      type: 'input',
      name: 'pairingPort',
      message: 'Enter the pairing port number displayed on your device:'
    });
    const pairingPort = pairingPortAnswer.pairingPort;

    Logger.log();
    Logger.log('Pairing your device with your computer...\n');

    const pairing = execBinarySync(adbLocation, 'adb', platform, `pair ${deviceIP}:${pairingPort} ${pairingCode}`);
    if (pairing) {
      Logger.log(`${colors.green('Pairing successful!')} Now connecting to device wirelessly...\n`);
    } else {
      Logger.log(`${colors.red('Pairing failed!')} Please try again.`);

      return false;
    }

    const connecting = execBinarySync(adbLocation, 'adb', platform, `connect ${deviceIP}:${port}`);
    if (connecting?.includes('connected')) {
      Logger.log(colors.green('Connected to device wirelessly.'));
    } else {
      Logger.log(`${colors.red('Failed to connect!')} Please try again.`);

      return false;
    }

    return true;
  } catch (error) {
    Logger.log('Error connecting to wifi ADB');
    console.error('Error:', error);

    return false;
  }
}

export async function connectAvd (sdkRoot: string, platform: Platform): Promise<boolean> {
  const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
  const availableAVDsDetails = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd');

  if (availableAVDsDetails) {
    Logger.log('Available AVDs:');
    Logger.log(availableAVDsDetails);
  }

  const availableAVDs = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');

  if (availableAVDs) {
    const avdAnswer = await inquirer.prompt({
      type: 'list',
      name: 'avdName',
      message: 'Select the AVD to connect:',
      choices: availableAVDs.split('\n').filter(avd => avd !== '')
    });
    const avdName = avdAnswer.avdName;

    Logger.log(`Connecting to ${avdName}...`);
    const connectingAvd = await launchAVD(sdkRoot, platform, avdName);

    if (connectingAvd) {
      return true;
    }

    return false;
  } else {
    Logger.log(`${colors.red('No AVDs found!')} Use ${colors.magenta('--setup')} flag with the main command to setup missing requirements.`);
  }
  return false;
}

export async function disconnectDevice (sdkRoot: string, platform: Platform) {
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
      choices: devices.map(device => device.udid)
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

export async function listRunningDevices() {
    const adb = await ADB.createADB({ allowOfflineDevices: true });
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
        Logger.log(`No device connected.`);
        return true;
    }

    Logger.log(colors.bold('Connected Devices:'));

    const maxUdidLength = devices.reduce((max, device) => Math.max(max, device.udid.length), 0);
    const paddedLength = maxUdidLength + 2;

    devices.forEach((device) => {
        const paddedUdid = device.udid.padEnd(paddedLength);
        Logger.log(`${paddedUdid}${device.state}`);
    });

    return true;
}

export async function defaultConnectFlow(sdkRoot: string, platform: Platform) {
    await listRunningDevices();
    
    Logger.log();

    const connectAnswer = await inquirer.prompt({
      type: 'list',
      name: 'connectOption',
      message: 'Select the type of device to connect:',
      choices: ['Real Device', 'AVD']
    });
    const connectOption = connectAnswer.connectOption;
    
    Logger.log();

    switch (connectOption) {
      case 'Real Device':
        return await connectWirelessAdb(sdkRoot, platform);
      case 'AVD':
        return await connectAvd(sdkRoot, platform);
      default:
        Logger.log('Invalid option selected.');
        return false;
    }
}

export async function getSystemImages(sdkRoot: string, platform: Platform): Promise<boolean> {
  const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
  
  if (!sdkmanagerLocation) {
    Logger.log(`${colors.red('sdkmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);
    
    return false;
  }

  const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list | grep "system-images;"');

  if (!stdout) {
    Logger.log(`${colors.red('Failed to fetch system images!')} Please try again.`);

    return false;
  }

  const images = stdout.split('\n').sort();
  const imageNames = new Set<string>();

  images.forEach(image => {
    const imageName = image.split('|')[0].trim();
    imageNames.add(imageName);
  });

  const availableSystemImages: AvailableSystemImages = {};

  imageNames.forEach(image => {
    if (!image.includes('system-image')) return;

    const imageSplit = image.split(';');
    const apiLevel = imageSplit[1];
    const type = imageSplit[2];
    const arch = imageSplit[3];

    if (!availableSystemImages[apiLevel]) {
      availableSystemImages[apiLevel] = [];
    }

    const imageType = availableSystemImages[apiLevel].find(image => image.type === type);

    if (!imageType) {
      availableSystemImages[apiLevel].push({
        type: type,
        archs: [arch]
      })
    } else {
      imageType.archs.push(arch);
    }
  });

  const apiLevelsWithNames = Object.keys(availableSystemImages).map(apiLevel => {
    if (APILevelNames[apiLevel]) {

      return `${apiLevel} - ${APILevelNames[apiLevel].name} (v${APILevelNames[apiLevel].version})`;
    }
    return apiLevel;
  })

  const androidVersionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'androidVersion',
    message: 'Select the Android version for system image:',
    choices: apiLevelsWithNames
  });
  const apiLevel = androidVersionAnswer.androidVersion.split(' ')[0];

  Logger.log();

  const systemImageTypeAnswer = await inquirer.prompt({
    type: 'list',
    name: 'systemImageType',
    message: `Select the system image type for ${colors.cyan(apiLevel)}:`,
    choices: availableSystemImages[apiLevel].map(image => image.type)
  });

  Logger.log();

  const systemImageArchAnswer = await inquirer.prompt({
    type: 'list',
    name: 'systemImageArch',
    message: `Select the architecture for the system image:`,
    choices: availableSystemImages[apiLevel].find(image => image.type === systemImageTypeAnswer.systemImageType)?.archs
  });

  const systemImageFullName = `system-images;${apiLevel};${systemImageTypeAnswer.systemImageType};${systemImageArchAnswer.systemImageArch}`;

  Logger.log();
  Logger.log(`Downloading ${colors.cyan(systemImageFullName)}...\n`);

  const downloading = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `'${systemImageFullName}'`);

  if (downloading) {
    Logger.log(`${colors.green('System image downloaded successfully!')}`);
    
    return true;
  }

  return false;
}

export async function deleteSystemImage (sdkRoot: string, platform: Platform): Promise<boolean> {
  const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);

  if (!sdkmanagerLocation) {
    Logger.log(`${colors.red('sdkmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

    return false;
  }
  const installedImages: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);

  if (installedImages.length === 0) {

    return false;
  }

  const systemImageAnswer = await inquirer.prompt({
    type: 'list',
    name: 'systemImage',
    message: 'Select the system image to uninstall:',
    choices: installedImages
  });

  Logger.log();
  Logger.log(`Uninstalling ${colors.cyan(systemImageAnswer.systemImage)}...\n`);

  execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `--uninstall '${systemImageAnswer.systemImage}'`);

  const installedImagesAfterDelete: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);

  if (installedImagesAfterDelete.includes(systemImageAnswer.systemImage)) {
    Logger.log(`${colors.red('Failed to uninstall system image!')} Please try again.`);

    return false;
  }

  Logger.log(`${colors.green('System image uninstalled successfully!')}`);

  return false; 
}

export async function installApk (options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (!adbLocation) {
      Logger.log(`${colors.red('ADB not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

      return false;
    }

    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
      Logger.log(`${colors.red('No device found running.')} Please connect a device to install the APK.`);
      Logger.log(`Use ${colors.cyan('npx @nightwatch/mobile-helper android connect')} to connect to a device.\n`);

      return true;
    } else if (devices.length === 1) {
      // if only one device is connected, then set that device's id to options.s
      options.s = devices[0].udid;
    }

    if (options.s && devices.length > 1) {
      // If device id is passed and there are multiple devices connected then 
      // check if the id is valid. If not then prompt user to select a device.
      const device = devices.find(device => device.udid === options.s);
      if (!device) {
        Logger.log(`${colors.yellow('Invalid device Id!')} Please select a valid running device.\n`);

        options.s = '';
      }
    }

    if (!options.s) {
      // if device id not found, or invalid device id is found, then prompt the user 
      // to select a device from the list of running devices.
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to install the APK:',
        choices: devices.map(device => device.udid)
      });
      options.s = deviceAnswer.device;
     
      Logger.log();
    }

    if (!options.path) {
      // if path to APK is not provided, then prompt the user to enter the path.
      const apkPathAnswer = await inquirer.prompt({
        type: 'input',
        name: 'apkPath',
        message: 'Enter the path to the APK file:'
      });
      options.path = apkPathAnswer.apkPath;

      Logger.log();
    }

    // convert to absolute path
    options.path = path.resolve(homedir(), options.path as string);

    if (!existsSync(options.path)) {
      Logger.log(`${colors.red('APK file not found!')} Please provide a valid path to the APK file.\n`);
      
      return false;
    }

    execBinarySync(adbLocation, 'adb', platform, `-s ${options.s} install ${options.path}`);

    return true;
  } catch (error) {
    Logger.log('Error installing APK');
    console.error('Error:', error);

    return false;
  }
}

export async function createAvd (sdkRoot: string, platform: Platform): Promise<boolean> {
  const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
  const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true); 

  if (!avdmanagerLocation) {
    Logger.log(`${colors.red('avdmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

    return false;
  }

  if (!sdkmanagerLocation) {
    Logger.log(`${colors.red('sdkmanager not found!')} Use ${colors.magenta('--standalone')} flag with the main command to setup missing requirements.`);

    return false;
  }

  const installedAvds = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
  if (!installedAvds) {
    Logger.log(`${colors.yellow('Failed to fetch installed AVDs.')} Please try again.`)
  
    return false;
  }

  const avdNameAnswer = await inquirer.prompt({
    type: 'input',
    name: 'avdName',
    message: 'Enter a name for the AVD:'
  });
  const avdName = avdNameAnswer.avdName;

  Logger.log();

  if (installedAvds.includes(avdName)) {
    Logger.log(colors.yellow('AVD with the same name already exists!\n'));

    const overwriteAnswer = await inquirer.prompt({
      type: 'list',
      name: 'overwrite',
      message: 'Do you want to overwrite the existing AVD?',
      choices: ['Yes', 'No']
    });

    if (overwriteAnswer.overwrite === 'No') {   
      return false;
    }
    Logger.log();
  }

  const installedSystemImages: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);
  if (installedSystemImages.length === 0) {

    return false;
  }

  const systemImageAnswer = await inquirer.prompt({
    type: 'list',
    name: 'systemImage',
    message: 'Select the system image to be used for AVD:',
    choices: installedSystemImages
  });
  const systemImage = systemImageAnswer.systemImage;

  Logger.log();

  const availableDevices = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list devices -c');

  if (!availableDevices) {
    Logger.log(`${colors.red('No devices found!')} Please try again.`);

    return false;
  }

  const deviceAnswer = await inquirer.prompt({
    type: 'list',
    name: 'device',
    message: 'Select the device profile for AVD:',
    choices: [...availableDevices.split('\n').filter(device => device !== ''), 'default']
  });
  const device = deviceAnswer.device;

  Logger.log();

  execBinarySync(avdmanagerLocation, 'avdmanager', platform, `create avd --name '${avdName}' --package '${systemImage}' ${device==='default' ? '' : `--device '${device}'`} --force`);

  const installedAvdsAfterCreate = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');

  if (!installedAvdsAfterCreate) {
    Logger.log(`${colors.yellow('Failed to confirm AVD creation!')} Please try launching the AVD using ${colors.cyan('npx @nightwatch/mobile-helper android connect --avd')} to confirm.\n`);

    return false;
  } else if (!installedAvdsAfterCreate.includes(avdName)) {
    Logger.log(`${colors.red('Failed to create AVD!')} Please try again.`);

    return false;
  }

  Logger.log(`${colors.green('AVD created successfully!')}`);

  return true;
}

async function getInstalledSystemImages (sdkmanagerLocation: string, platform: Platform): Promise<string[]> {
  const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list');

  if (!stdout) {
    Logger.log(`${colors.red('Failed to fetch system images!')} Please try again.`);

    return [];
  }
  const lines = stdout.split('\n');
  const installedImages: string[] = [];

  for (const line of lines) {
    if (line.includes('Available Packages:')) {
      break;
    }
    if (line.includes('system-images')) {
      installedImages.push(line.split('|')[0].trim());
    }
  }

  return installedImages;
}

export async function defaultInstallFlow(sdkRoot: string, platform: Platform) {
  const installAnswer = await inquirer.prompt({
    type: 'list',
    name: 'installOption',
    message: 'What would you like to install:',
    choices: ['APK', 'System Image', 'AVD']
  });
  const installOption = installAnswer.installOption;

  Logger.log();

  switch (installOption) {
    case 'APK':
      return await installApk({}, sdkRoot, platform);
    case 'System Image':
      return await getSystemImages(sdkRoot, platform);
    case 'AVD':
      return await createAvd(sdkRoot, platform);
    default:
      Logger.log('Invalid option selected.');
      return false;
  }
}
