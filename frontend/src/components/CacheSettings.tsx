import { useState } from 'react';

interface CacheSettingsProps {
  onApply: (settings: CacheSettings) => void;
  initialSettings?: CacheSettings;
}

export interface CacheSettings {
  maxFeedAge: number; // in hours
  maxSummaryAge: number; // in hours
  preferCache: boolean;
  autoCleanupEnabled: boolean;
  maxCacheSize: number; // in MB
}

const DEFAULT_SETTINGS: CacheSettings = {
  maxFeedAge: 24,
  maxSummaryAge: 168, // 7 days
  preferCache: true,
  autoCleanupEnabled: false,
  maxCacheSize: 5
};

export default function CacheSettings({ onApply, initialSettings = DEFAULT_SETTINGS }: CacheSettingsProps) {
  const [settings, setSettings] = useState<CacheSettings>(initialSettings);
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key: keyof CacheSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    // Save settings to localStorage
    localStorage.setItem('cache_settings', JSON.stringify(settings));
    onApply(settings);
    setIsOpen(false);
  };

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-sm btn-outline flex items-center"
        title="Configure cache settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Cache Settings
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">Cache Settings</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Maximum Feed Cache Age (hours)
                <input
                  type="range"
                  min="1"
                  max="168"
                  value={settings.maxFeedAge}
                  onChange={(e) => handleSettingChange('maxFeedAge', parseInt(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 hr</span>
                  <span>{settings.maxFeedAge} hrs</span>
                  <span>7 days</span>
                </div>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Maximum Summary Cache Age (hours)
                <input
                  type="range"
                  min="1"
                  max="720"
                  value={settings.maxSummaryAge}
                  onChange={(e) => handleSettingChange('maxSummaryAge', parseInt(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 hr</span>
                  <span>{settings.maxSummaryAge} hrs</span>
                  <span>30 days</span>
                </div>
              </label>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.preferCache}
                  onChange={(e) => handleSettingChange('preferCache', e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Prefer cache over API when available</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                When enabled, cached data will be used instead of making API requests if available.
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoCleanupEnabled}
                  onChange={(e) => handleSettingChange('autoCleanupEnabled', e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Enable automatic cache cleanup</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                When enabled, old cache entries will be automatically removed.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Maximum Cache Size (MB)
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={settings.maxCacheSize}
                  onChange={(e) => handleSettingChange('maxCacheSize', parseInt(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 MB</span>
                  <span>{settings.maxCacheSize} MB</span>
                  <span>20 MB</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="btn btn-outline mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                className="btn btn-primary"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
