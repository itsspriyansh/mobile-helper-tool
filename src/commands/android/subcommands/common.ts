import colors from 'ansi-colors';

import Logger from '../../../logger';
import {Platform} from '../interfaces';
import {execBinarySync} from '../utils/sdk';

export async function getInstalledSystemImages(sdkmanagerLocation: string, platform: Platform): Promise<string[]> {
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
