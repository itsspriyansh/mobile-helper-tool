import { getSdkRootFromEnv, showHelp } from "./utils/common";
import { getPlatformName } from "../../utils";
import { Options, Platform } from "./interfaces";
import * as dotenv from "dotenv";
import path from "path";
import colors from "ansi-colors";
import Logger from "../../logger";
import {
  connectAvd,
  connectWirelessAdb,
  createAvd,
  defaultConnectFlow,
  defaultInstallFlow,
  deleteApk,
  deleteAvd,
  deleteSystemImage,
  disconnectDevice,
  getSystemImages,
  installApk,
  listRunningDevices,
} from "./utils/connectDevice";
import { AVAILABLE_SUBCOMMANDS } from "./constants";

export class SdkCommandExecute {
  sdkRoot: string;
  options: Options;
  subcommand: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(subcommand: string, options: Options, rootDir = process.cwd()) {
    this.sdkRoot = "";
    this.options = options;
    this.subcommand = subcommand;
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    if (!Object.keys(AVAILABLE_SUBCOMMANDS).includes(this.subcommand)) {
      showHelp([], this.subcommand);
      
      return false;
    }

    const unknownOptions = this.getUnknownOptions();
    if (unknownOptions.length) {
      showHelp(unknownOptions);

      return false;
    }

    this.loadEnvFromDotEnv();
    const sdkRootEnv = getSdkRootFromEnv(this.androidHomeInGlobalEnv, this.rootDir);

    if (!sdkRootEnv) {
      Logger.log(`Use ${colors.magenta("--standalone")} flag with the main command to setup the Android SDK.`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    this.executeSdkScript();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = "ANDROID_HOME" in process.env;

    dotenv.config({ path: path.join(this.rootDir, ".env") });
  }

  getUnknownOptions(): string[] {
    const optionsPassed = Object.keys(this.options).filter(option => this.options[option] === true);
    const availableOptions = AVAILABLE_SUBCOMMANDS[this.subcommand].options.map(option => option.name);

    return optionsPassed.filter((option) => !availableOptions.includes(option));
  }

  async executeSdkScript(): Promise<boolean> {

    if (this.subcommand === "connect") {
      if (this.options.wireless) {
        // execute script for wireless adb connection.
        return await connectWirelessAdb(this.sdkRoot, this.platform);
      } else if (this.options.avd) {
        // execute script for connecting to an AVD.
        return await connectAvd(this.sdkRoot, this.platform);
      } else if (this.options.list) {
        // execute script for listing running devices.
        return listRunningDevices();
      } else {
        // execute the default connection flow.
        return await defaultConnectFlow(this.sdkRoot, this.platform);
      }
    }

    if (this.subcommand === "disconnect") {
      // execute script for disconnecting a device.
      return await disconnectDevice(this.sdkRoot, this.platform);
    }
    
    if (this.subcommand === 'install') {
      if (this.options['system-image']) {
        // execute script for downloading system image for AVD.
        return await getSystemImages(this.sdkRoot, this.platform);
      } else if (this.options.avd) {
        // execute script for creating an AVD.
        return await createAvd(this.sdkRoot, this.platform);
      } else if (this. options.app) {
        // execute script for installing an APk on the device.
        return await installApk(this.options, this.sdkRoot, this.platform);
      } else {
        // execute the default connection flow.
        return await defaultInstallFlow(this.sdkRoot, this.platform);
      }
    }

    if (this.subcommand === 'uninstall') {
      if (this.options['system-image']) {
        // execute script for uninstalling system image from AVD.
        return await deleteSystemImage(this.sdkRoot, this.platform);
      } else if (this.options.avd) {
        // execute script for deleting an AVD.
        return await deleteAvd(this.sdkRoot, this.platform);
      } else if (this.options.app) {
        // execute script for uninstalling an APK from the device.
        return await deleteApk(this.options, this.sdkRoot, this.platform);
      }
    }

    return false;
  }
}
