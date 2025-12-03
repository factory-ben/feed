const fs = require('fs').promises;
const path = require('path');
const { filterNewItems, saveFeed, saveSeen, initStorage, loadFeed } = require('../src/storage');

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

describe('Storage Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('filterNewItems', () => {
    it('should return only items that are not in the seen set', () => {
      const items = [
        { id: '1', content: 'test1' },
        { id: '2', content: 'test2' },
        { id: '3', content: 'test3' }
      ];
      const seen = new Set(['1']);

      const result = filterNewItems(items, seen);
      
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: '2', content: 'test2' },
        { id: '3', content: 'test3' }
      ]);
    });

    it('should return all items if seen set is empty', () => {
      const items = [{ id: '1' }];
      const seen = new Set();
      expect(filterNewItems(items, seen)).toHaveLength(1);
    });

    it('should return empty array if all items are seen', () => {
      const items = [{ id: '1' }];
      const seen = new Set(['1']);
      expect(filterNewItems(items, seen)).toHaveLength(0);
    });
  });

  describe('saveFeed', () => {
    it('should save the feed sorted by timestamp desc and trimmed to 100 items', async () => {
      // Create 110 items with timestamps
      const items = Array.from({ length: 110 }, (_, i) => ({
        id: i.toString(),
        timestamp: new Date(2023, 0, 1, 10, i).toISOString() // Increasing time
      }));

      await saveFeed(items);

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      
      // Get the data passed to writeFile
      const [filePath, content] = fs.writeFile.mock.calls[0];
      
      expect(filePath).toContain('feed.json');
      
      const savedFeed = JSON.parse(content);
      expect(savedFeed).toHaveLength(100);
      
      // Verify sorting: first item should be the latest (highest index)
      expect(savedFeed[0].id).toBe('109');
      expect(savedFeed[99].id).toBe('10'); // 110 items (0-109), remove 10 oldest (0-9)
    });
  });

  describe('initStorage', () => {
    it('should create data directory', async () => {
      fs.access.mockRejectedValue(new Error('Not found')); // Simulate files not existing
      
      await initStorage();
      
      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('data'), { recursive: true });
      // Should try to access feed.json and seen.json, and write if fail
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });
  });
});
