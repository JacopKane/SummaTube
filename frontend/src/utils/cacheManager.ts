import { CacheSettings } from "@/components/CacheSettings";

export const getCacheSettings = (): CacheSettings => {
  // Default cache settings
  const defaultSettings: CacheSettings = {
    maxFeedAge: 24, // 24 hours
    maxSummaryAge: 168, // 7 days (168 hours)
    preferCache: true,
    autoCleanupEnabled: false,
    maxCacheSize: 5, // 5MB
  };

  try {
    const storedSettings = localStorage.getItem("cache_settings");
    if (storedSettings) {
      return { ...defaultSettings, ...JSON.parse(storedSettings) };
    }
  } catch (e) {
    console.error("Error retrieving cache settings", e);
  }

  return defaultSettings;
};

// Check if cache is still valid based on settings
export const isCacheValid = (
  timestamp: number,
  cacheType: "feed" | "summary"
): boolean => {
  const settings = getCacheSettings();
  const now = Date.now();
  const maxAge =
    cacheType === "feed" ? settings.maxFeedAge : settings.maxSummaryAge;

  // Convert hours to milliseconds
  const maxAgeMs = maxAge * 60 * 60 * 1000;

  return now - timestamp <= maxAgeMs;
};

// Clean up old cache entries based on settings
export const cleanupCache = (): void => {
  try {
    const settings = getCacheSettings();
    if (!settings.autoCleanupEnabled) return;

    // Clean up feed cache
    const cachedFeed = localStorage.getItem("cached_feed");
    if (cachedFeed) {
      const feedData = JSON.parse(cachedFeed);
      if (feedData.timestamp && !isCacheValid(feedData.timestamp, "feed")) {
        localStorage.removeItem("cached_feed");
      }
    }

    // Clean up summaries cache
    const cachedSummaries = localStorage.getItem("cached_summaries");
    if (cachedSummaries) {
      const summariesData = JSON.parse(cachedSummaries);
      const now = Date.now();
      let updated = false;

      // Check each summary for expiration
      Object.keys(summariesData).forEach((videoId) => {
        if (
          summariesData[videoId].timestamp &&
          !isCacheValid(summariesData[videoId].timestamp, "summary")
        ) {
          delete summariesData[videoId];
          updated = true;
        }
      });

      // Save updated summaries if any were removed
      if (updated) {
        localStorage.setItem("cached_summaries", JSON.stringify(summariesData));
      }
    }

    // Check total cache size
    checkCacheSize();
  } catch (e) {
    console.error("Error cleaning up cache:", e);
  }
};

// Check if the cache size exceeds the maximum allowed
export const checkCacheSize = (): void => {
  try {
    const settings = getCacheSettings();
    const maxSizeBytes = settings.maxCacheSize * 1024 * 1024; // Convert MB to bytes

    // Calculate current cache size
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || "";
        totalSize += value.length * 2; // Approximate size in bytes (2 bytes per character)
      }
    }

    // If exceeds limit, clean up starting with oldest summaries
    if (totalSize > maxSizeBytes && settings.autoCleanupEnabled) {
      const cachedSummaries = localStorage.getItem("cached_summaries");
      if (cachedSummaries) {
        const summariesData = JSON.parse(cachedSummaries);

        // Convert to array for sorting
        const entries = Object.entries(summariesData).map(
          ([videoId, data]) => ({
            videoId,
            timestamp: (data as any).timestamp || 0,
          })
        );

        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest entries until under limit
        let removed = 0;
        while (totalSize > maxSizeBytes && removed < entries.length) {
          const oldest = entries[removed];
          const videoId = oldest.videoId;

          // Remove from cache
          const valueSize = JSON.stringify(summariesData[videoId]).length * 2;
          delete summariesData[videoId];
          totalSize -= valueSize;
          removed++;
        }

        // Save updated summaries
        if (removed > 0) {
          localStorage.setItem(
            "cached_summaries",
            JSON.stringify(summariesData)
          );
          console.log(
            `Removed ${removed} old cache entries to stay within size limit`
          );
        }
      }
    }
  } catch (e) {
    console.error("Error checking cache size:", e);
  }
};

// Get estimated size of the cache in MB
export const getCacheSize = (): number => {
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || "";
        totalSize += value.length * 2; // Approximate size in bytes
      }
    }

    return totalSize / (1024 * 1024); // Convert to MB
  } catch (e) {
    console.error("Error calculating cache size:", e);
    return 0;
  }
};

// Track API usage to help prevent quota limits
export interface QuotaUsage {
  date: string; // Current date in YYYY-MM-DD format
  count: number; // Number of API calls made today
  lastUpdated: number; // Timestamp of last update
}

// Get current API quota usage
export const getQuotaUsage = (): QuotaUsage => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const storedUsage = localStorage.getItem("youtube_api_usage");

    if (storedUsage) {
      const usageData = JSON.parse(storedUsage) as QuotaUsage;

      // If we have data for today, return it
      if (usageData.date === today) {
        return usageData;
      }
    }

    // If no data for today, initialize new counter
    return {
      date: today,
      count: 0,
      lastUpdated: Date.now(),
    };
  } catch (e) {
    console.error("Error getting quota usage:", e);
    return {
      date: new Date().toISOString().split("T")[0],
      count: 0,
      lastUpdated: Date.now(),
    };
  }
};

// Update API quota usage counter
export const incrementQuotaUsage = (increment: number = 1): QuotaUsage => {
  const usage = getQuotaUsage();
  usage.count += increment;
  usage.lastUpdated = Date.now();

  localStorage.setItem("youtube_api_usage", JSON.stringify(usage));
  return usage;
};

// Check if we're approaching quota limits
export const isApproachingQuotaLimit = (): boolean => {
  const usage = getQuotaUsage();

  // YouTube API quota is 10,000 units per day
  // Most read operations cost 1 unit, so we'll set a warning at 80%
  return usage.count > 8000;
};
