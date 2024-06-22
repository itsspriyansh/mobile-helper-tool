import path from 'path';
import colors from 'ansi-colors';
import * as dotenv from 'dotenv';

import {connect} from './connect';
import {install} from './install';
import Logger from '../../../logger';
import {uninstall} from './uninstall';
import {disconnect} from './disconnect';
import {getPlatformName} from '../../../utils';
import {Options, Platform} from '../interfaces';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {checkJavaInstallation, getSdkRootFromEnv, showSubcommandHelp} from '../utils/common';

export class AndroidSubcommand {
  sdkRoot: string;
  options: Options;
  subcommand: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(subcommand: string, options: Options, rootDir = process.cwd()) {
    this.sdkRoot = '';
    this.options = options;
    this.subcommand = subcommand;
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    if (!Object.keys(AVAILABLE_SUBCOMMANDS).includes(this.subcommand)) {
      showSubcommandHelp(this.subcommand);

      return false;
    }

    const javaInstalled = checkJavaInstallation(this.rootDir);
    if (!javaInstalled) {
      return false;
    }

    this.loadEnvFromDotEnv();
    const sdkRootEnv = getSdkRootFromEnv(this.androidHomeInGlobalEnv, this.rootDir);

    if (!sdkRootEnv) {
      Logger.log(`Use ${colors.magenta('--standalone')} flag with the main command to setup the Android SDK.`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    this.executeSdkScript();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;
    dotenv.config({path: path.join(this.rootDir, '.env')});
  }

  async executeSdkScript(): Promise<boolean> {
    if (this.subcommand === 'connect') {
      return await connect(this.options, this.sdkRoot, this.platform);
    } else if (this.subcommand === 'disconnect') {
      return await disconnect(this.sdkRoot, this.platform);
    } else if (this.subcommand === 'install') {
      return await install(this.options, this.sdkRoot, this.platform);
    } else if (this.subcommand === 'uninstall') {
      return await uninstall(this.options, this.sdkRoot, this.platform);
    }

    return false;
  }
}
