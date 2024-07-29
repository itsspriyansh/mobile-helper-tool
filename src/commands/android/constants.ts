import inquirer from 'inquirer';
import path from 'path';
import os from 'os';

import {ApiLevelNames, AvailableOptions, AvailableSubcommands, SdkBinary} from './interfaces';

export const AVAILABLE_OPTIONS: AvailableOptions = {
  help: {
    alias: ['h'],
    description: 'Help for android command.'
  },
  setup: {
    alias: ['install', 'i'],
    description: 'Automatically setup all the missing requirements.'
  },
  mode: {
    alias: ['m'],
    description: 'Verify/setup requirements for real-device or emulator. Available args: "real", "emulator", "both"'
  },
  browsers: {
    alias: ['browser', 'b'],
    description: 'Browsers to setup on Android emulator. Available args: "chrome", "firefox", "both", "none"'
  },
  appium: {
    alias: [],
    description: 'Make sure the final setup works with Appium out-of-the-box.'
  },
  standalone: {
    alias: [],
    description: 'Do standalone setup for Android Emulator (no Nightwatch-related requirements will be downloaded).'
  }
};

export const AVAILABLE_SUBCOMMANDS: AvailableSubcommands = {
  connect: {
    description: 'Connect to a device',
    options: [
      {
        name: 'wireless',
        description: 'Connect a real device wirelessly'
      },
      {
        name: 'emulator',
        description: 'Connect to an Emulator Device',
        flags: [
          {
            name: 'avd',
            alias: [],
            description: 'Name of the AVD to connect to'
          }
        ]
      }
    ]
  },
  disconnect: {
    description: 'Disconnect an AVD or a real device',
    options: [],
    flags: [
      {
        name: 'deviceId',
        alias: ['s'],
        description: 'Id of the device to disconnect to'
      }
    ]
  },
  install: {
    description: 'Install system images for Android Virtual Device',
    options: [
      {
        name: 'system-image',
        description: 'Install system image for Android Virtual Device'
      },
      {
        name: 'avd',
        description: 'Create an Android Virtual Device'
      },
      {
        name: 'app',
        description: 'Install an APK on the device',
        flags: [
          {
            name: 'path',
            alias: ['p'],
            description: 'Path to the APK file'
          },
          {
            name: 'deviceId',
            alias: ['s'],
            description: 'Id of the device to install the APK if multiple devices are connected'
          }
        ]
      }
    ]
  },
  uninstall: {
    description: 'Uninstall system images, AVDs or APKs from a device',
    options: [
      {
        name: 'system-image',
        description: 'Uninstall a currently installed system image from the device'
      },
      {
        name: 'avd',
        description: 'Delete an Android Virtual Device'
      },
      {
        name: 'app',
        description: 'Uninstall an APK from a device'
      }
    ]
  }
};

export const NIGHTWATCH_AVD = 'nightwatch-android-11';
export const DEFAULT_FIREFOX_VERSION = '105.1.0';
export const DEFAULT_CHROME_VERSIONS = ['83', '91'];

export const ABI = (() => {
  const arch = process.arch;

  if (arch === 'arm') {
    return 'armeabi-v7a';
  } else if (arch === 'arm64') {
    return 'arm64-v8a';
  } else if (['ia32', 'mips', 'ppc', 's390'].includes(arch)) {
    return 'x86';
  }

  // Handle case when Apple M1's arch is switched to x64.
  if (arch === 'x64' && os.cpus()[0].model.includes('Apple')) {
    return 'arm64-v8a';
  }

  return 'x86_64';
})();

export const SETUP_CONFIG_QUES: inquirer.QuestionCollection = [
  {
    type: 'list',
    name: 'mode',
    message: 'Select target device(s):',
    choices: [
      {name: 'Real Android Device', value: 'real'},
      {name: 'Android Emulator', value: 'emulator'},
      {name: 'Both', value: 'both'}
    ]
  },
  {
    type: 'list',
    name: 'browsers',
    message: '[Emulator] Select browser(s) to set up on Emulator:',
    choices: [
      {name: 'Google Chrome', value: 'chrome'},
      {name: 'Mozilla Firefox', value: 'firefox'},
      {name: 'Both', value: 'both'},
      {name: 'None', value: 'none'}
    ],
    when: (answers) => ['emulator', 'both'].includes(answers.mode)
  }
];

export const SDK_BINARY_LOCATIONS: Record<SdkBinary, string> = {
  sdkmanager: path.join('cmdline-tools', 'latest', 'bin'),
  avdmanager: path.join('cmdline-tools', 'latest', 'bin'),
  adb: 'platform-tools',
  emulator: 'emulator'
};

export const BINARY_TO_PACKAGE_NAME: Record<SdkBinary | typeof NIGHTWATCH_AVD, string> = {
  sdkmanager: 'cmdline-tools;latest',
  avdmanager: 'cmdline-tools;latest',
  adb: 'platform-tools',
  emulator: 'emulator',
  [NIGHTWATCH_AVD]: `system-images;android-30;google_apis;${ABI}`
};

export const APILevelNames: ApiLevelNames = {
  'android-10': {
    version: '2.3.3-2.3.7',
    name: 'Gingerbread'
  },
  'android-11': {
    version: '3.0',
    name: 'Honeycomb'
  },
  'android-12': {
    version: '3.1',
    name: 'Honeycomb'
  },
  'android-13': {
    version: '3.2',
    name: 'Honeycomb'
  },
  'android-14': {
    version: '4.0.1-4.0.2',
    name: 'Ice Cream Sandwich'
  },
  'android-15': {
    version: '4.0.3-4.0.4',
    name: 'Ice Cream Sandwich'
  },
  'android-16': {
    version: '4.1.x',
    name: 'Jelly Bean'
  },
  'android-17': {
    version: '4.2.x',
    name: 'Jelly Bean'
  },
  'android-18': {
    version: '4.3.x',
    name: 'Jelly Bean'
  },
  'android-19': {
    version: '4.4-4.4.4',
    name: 'KitKat'
  },
  'android-20': {
    version: '4.4W',
    name: 'KitKat Wear'
  },
  'android-21': {
    version: '5.0',
    name: 'Lollipop'
  },
  'android-22': {
    version: '5.1',
    name: 'Lollipop'
  },
  'android-23': {
    version: '6.0',
    name: 'Marshmallow'
  },
  'android-24': {
    version: '7.0',
    name: 'Nougat'
  },
  'android-25': {
    version: '7.1',
    name: 'Nougat'
  },
  'android-26': {
    version: '8.0',
    name: 'Oreo'
  },
  'android-27': {
    version: '8.1',
    name: 'Oreo'
  },
  'android-28': {
    version: '9.0',
    name: 'Pie'
  },
  'android-29': {
    version: '10',
    name: 'Android 10'
  },
  'android-30': {
    version: '11',
    name: 'Android 11'
  },
  'android-31': {
    version: '12',
    name: 'Android 12'
  },
  'android-32': {
    version: '12L',
    name: 'Android 12L'
  },
  'android-33': {
    version: '13',
    name: 'Android 13'
  },
  'android-34': {
    version: '14',
    name: 'Android 14'
  }
};
