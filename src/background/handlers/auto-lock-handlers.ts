// Auto-lock handlers
import { SessionManager } from '../session-manager';
import { getAutoLockSettings, saveAutoLockSettings } from '../../shared/storage';
import type { AutoLockSettings } from '../../shared/types';

/**
 * Get auto-lock settings
 */
export async function handleGetAutoLockSettings(): Promise<AutoLockSettings> {
  try {
    return await getAutoLockSettings();
  } catch (error: any) {
    throw new Error(`Failed to get auto-lock settings: ${error.message}`);
  }
}

/**
 * Update auto-lock settings
 */
export async function handleUpdateAutoLockSettings(
  data: Partial<AutoLockSettings>,
  sessionManager: SessionManager
): Promise<void> {
  try {
    const currentSettings = await getAutoLockSettings();
    const updatedSettings: AutoLockSettings = {
      ...currentSettings,
      ...data,
    };
    await saveAutoLockSettings(updatedSettings);

    // Update SessionManager with new timeout
    if (updatedSettings.timeoutMinutes) {
      await sessionManager.updateTimeoutSetting(updatedSettings.timeoutMinutes);
    }

    console.log('✅ Auto-lock settings updated:', updatedSettings);
  } catch (error: any) {
    throw new Error(`Failed to update auto-lock settings: ${error.message}`);
  }
}
