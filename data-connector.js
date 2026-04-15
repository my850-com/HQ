/**
 * MY850 HQ Dashboard Data Connector
 * Unified data access layer for Listings, Buyer Leads, and Lis Pendens
 */

(function(global) {
  'use strict';

  // Data source URLs
  const DATA_SOURCES = {
    listings: 'https://docs.google.com/spreadsheets/d/1d_UzZrIs4oO5Z3Nshc_UO4Fcorbimmm6rKovIyybdcg/gviz/tq?tqx=out:csv&sheet=Listings',
    buyerLeads: 'https://docs.google.com/spreadsheets/d/1d_UzZrIs4oO5Z3Nshc_UO4Fcorbimmm6rKovIyybdcg/gviz/tq?tqx=out:csv&sheet=Buyer%20Leads',
    lisPendens: 'https://docs.google.com/spreadsheets/d/1d_UzZrIs4oO5Z3Nshc_UO4Fcorbimmm6rKovIyybdcg/gviz/tq?tqx=out:csv&sheet=Lis%20Pendens%20Data'
  };

  // Cache configuration
  const CACHE_CONFIG = {
    countsTTL: 120000,    // 2 minutes
    dataTTL: 300000       // 5 minutes
  };

  // Retry configuration
  const RETRY_CONFIG = {
    maxRetries: 3,
    delays: [1000, 2000, 4000]  // Exponential backoff: 1s, 2s, 4s
  };

  // In-memory caches
  let countsCache = {
    timestamp: 0,
    data: {
      listingCount: 0,
      buyerLeadsCount: 0,
      lisPendensCount: 0,
      lisPendensGradedCount: 0
    }
  };

  let dataCache = {
    listings: { timestamp: 0, data: [] },
    buyerLeads: { timestamp: 0, data: [] },
    lisPendens: { timestamp: 0, data: [] }
  };

  /**
   * CSV Parser - Handles Google Sheets CSV quirks
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') {
      return [];
    }
    
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) {
      return [];
    }
    
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      const row = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Clean up quoted values and handle empty strings
        row[header] = value.replace(/^"|"$/g, '');
      });
      
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Sleep utility for retry delays
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch data from URL with retry logic
   */
  async function fetchWithRetry(url, retryCount = 0) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      return text;
    } catch (error) {
      if (retryCount < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.delays[retryCount] || 4000;
        console.warn(`[DataConnector] Retry ${retryCount + 1}/${RETRY_CONFIG.maxRetries} for ${url} after ${delay}ms`);
        await sleep(delay);
        return fetchWithRetry(url, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Count rows from CSV text (header excluded)
   */
  function countRowsFromCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') {
      return 0;
    }
    
    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim());
    
    // Subtract 1 for header, minimum 0
    return Math.max(0, lines.length - 1);
  }

  /**
   * Count graded Lis Pendens rows (Score > 0 or Priority filled)
   */
  function countGradedLisPendens(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return 0;
    }
    
    return rows.filter(row => {
      // Check Score column (numeric > 0)
      const score = parseFloat(row.Score || row.score || 0);
      if (score > 0) return true;
      
      // Check Priority column (non-empty string)
      const priority = (row.Priority || row.priority || '').trim();
      if (priority && priority.toLowerCase() !== 'none') return true;
      
      return false;
    }).length;
  }

  /**
   * Dispatch counts updated event
   */
  function dispatchCountsUpdated(counts) {
    if (typeof window !== 'undefined' && window.CustomEvent) {
      window.dispatchEvent(new CustomEvent('dataConnector:countsUpdated', {
        detail: { counts: counts }
      }));
    }
  }

  /**
   * DataConnector API
   */
  const DataConnector = {
    /**
     * Get all counts (with caching)
     * @returns {Promise<Object>} Counts for all data sources
     */
    async getCounts() {
      const now = Date.now();
      
      // Return cached counts if still valid
      if (now - countsCache.timestamp < CACHE_CONFIG.countsTTL) {
        return { ...countsCache.data };
      }
      
      try {
        // Fetch all CSVs in parallel
        const [listingsCSV, buyerLeadsCSV, lisPendensCSV] = await Promise.all([
          fetchWithRetry(DATA_SOURCES.listings).catch(err => {
            console.error('[DataConnector] Failed to fetch listings:', err.message);
            return null;
          }),
          fetchWithRetry(DATA_SOURCES.buyerLeads).catch(err => {
            console.error('[DataConnector] Failed to fetch buyer leads:', err.message);
            return null;
          }),
          fetchWithRetry(DATA_SOURCES.lisPendens).catch(err => {
            console.error('[DataConnector] Failed to fetch Lis Pendens:', err.message);
            return null;
          })
        ]);
        
        // Calculate counts
        const listingCount = listingsCSV ? countRowsFromCSV(listingsCSV) : countsCache.data.listingCount;
        const buyerLeadsCount = buyerLeadsCSV ? countRowsFromCSV(buyerLeadsCSV) : countsCache.data.buyerLeadsCount;
        const lisPendensCount = lisPendensCSV ? countRowsFromCSV(lisPendensCSV) : countsCache.data.lisPendensCount;
        
        // Calculate graded count for Lis Pendens
        let lisPendensGradedCount = countsCache.data.lisPendensGradedCount;
        if (lisPendensCSV) {
          const lisPendensRows = parseCSV(lisPendensCSV);
          lisPendensGradedCount = countGradedLisPendens(lisPendensRows);
        }
        
        const counts = {
          listingCount: listingCount || 0,
          buyerLeadsCount: buyerLeadsCount || 0,
          lisPendensCount: lisPendensCount || 0,
          lisPendensGradedCount: lisPendensGradedCount || 0
        };
        
        // Update cache
        countsCache = {
          timestamp: now,
          data: counts
        };
        
        // Dispatch event
        dispatchCountsUpdated(counts);
        
        return counts;
      } catch (error) {
        console.error('[DataConnector] Error fetching counts:', error);
        
        // Return cached data if available, otherwise zeros
        if (countsCache.timestamp > 0) {
          return { ...countsCache.data };
        }
        
        return {
          listingCount: 0,
          buyerLeadsCount: 0,
          lisPendensCount: 0,
          lisPendensGradedCount: 0
        };
      }
    },

    /**
     * Get cached counts immediately (no fetch)
     * @returns {Object} Cached counts (may be stale)
     */
    getCountsCached() {
      return { ...countsCache.data };
    },

    /**
     * Get full data for a specific source
     * @param {string} source - 'listings', 'buyerLeads', or 'lisPendens'
     * @returns {Promise<Array>} Array of parsed row objects
     */
    async getData(source) {
      const validSources = ['listings', 'buyerLeads', 'lisPendens'];
      
      if (!validSources.includes(source)) {
        console.error(`[DataConnector] Invalid source: ${source}. Use: ${validSources.join(', ')}`);
        return [];
      }
      
      const now = Date.now();
      const cacheKey = source;
      
      // Return cached data if still valid
      if (now - dataCache[cacheKey].timestamp < CACHE_CONFIG.dataTTL) {
        return [...dataCache[cacheKey].data];
      }
      
      try {
        const csvText = await fetchWithRetry(DATA_SOURCES[source]);
        const rows = parseCSV(csvText);
        
        // Update cache
        dataCache[cacheKey] = {
          timestamp: now,
          data: rows
        };
        
        return rows;
      } catch (error) {
        console.error(`[DataConnector] Error fetching ${source}:`, error.message);
        
        // Return cached data if available, else empty array
        if (dataCache[cacheKey].timestamp > 0) {
          return [...dataCache[cacheKey].data];
        }
        
        return [];
      }
    },

    /**
     * Clear all caches (useful for testing)
     */
    clearCache() {
      countsCache = {
        timestamp: 0,
        data: {
          listingCount: 0,
          buyerLeadsCount: 0,
          lisPendensCount: 0,
          lisPendensGradedCount: 0
        }
      };
      
      dataCache = {
        listings: { timestamp: 0, data: [] },
        buyerLeads: { timestamp: 0, data: [] },
        lisPendens: { timestamp: 0, data: [] }
      };
      
      console.log('[DataConnector] Cache cleared');
    },

    /**
     * Get cache status (for debugging)
     * @returns {Object} Current cache timestamps and ages
     */
    getCacheStatus() {
      const now = Date.now();
      return {
        counts: {
          timestamp: countsCache.timestamp,
          age: now - countsCache.timestamp,
          isValid: now - countsCache.timestamp < CACHE_CONFIG.countsTTL
        },
        data: {
          listings: {
            timestamp: dataCache.listings.timestamp,
            age: now - dataCache.listings.timestamp,
            isValid: now - dataCache.listings.timestamp < CACHE_CONFIG.dataTTL
          },
          buyerLeads: {
            timestamp: dataCache.buyerLeads.timestamp,
            age: now - dataCache.buyerLeads.timestamp,
            isValid: now - dataCache.buyerLeads.timestamp < CACHE_CONFIG.dataTTL
          },
          lisPendens: {
            timestamp: dataCache.lisPendens.timestamp,
            age: now - dataCache.lisPendens.timestamp,
            isValid: now - dataCache.lisPendens.timestamp < CACHE_CONFIG.dataTTL
          }
        }
      };
    }
  };

  // Export to global scope
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataConnector;
  }
  
  if (typeof window !== 'undefined') {
    window.DataConnector = DataConnector;
  }
  
  global.DataConnector = DataConnector;

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {});
