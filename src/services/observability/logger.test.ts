import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, LogLevel } from './logger';

describe('Logger Service', () => {
  beforeEach(() => {
    // Reset logger state
    logger.setMinLevel(LogLevel.DEBUG);
    logger.setConsole(false); // Desabilitar console nos testes
    logger.setPersistence(false); // Desabilitar Firestore nos testes
  });

  describe('Log Levels', () => {
    it('should log debug messages when min level is DEBUG', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);
      logger.setMinLevel(LogLevel.DEBUG);

      logger.debug('Debug message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not log debug messages when min level is INFO', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);
      logger.setMinLevel(LogLevel.INFO);

      logger.debug('Debug message');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log all levels when min level is DEBUG', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);
      logger.setMinLevel(LogLevel.DEBUG);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.critical('Critical');

      expect(consoleSpy).toHaveBeenCalledTimes(5);
      consoleSpy.mockRestore();
    });

    it('should only log ERROR and CRITICAL when min level is ERROR', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);
      logger.setMinLevel(LogLevel.ERROR);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.critical('Critical');

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });
  });

  describe('Context Logging', () => {
    it('should log with context object', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      const context = {
        userId: 'user123',
        component: 'TestComponent',
        action: 'test-action',
      };

      logger.info('Test message', context);

      expect(consoleSpy).toHaveBeenCalledWith('Context:', expect.objectContaining(context));
      consoleSpy.mockRestore();
    });

    it('should log errors with stack trace', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.setConsole(true);

      const error = new Error('Test error');

      logger.error('Error occurred', error);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String),
        })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Metrics', () => {
    it('should log metric with value', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      logger.metric('evaluations_created', 5);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Metric: evaluations_created = 5'),
        expect.any(String),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });

    it('should log duration with operation name', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      logger.duration('database_query', 125.5);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duration: database_query = 125.5ms'),
        expect.any(String),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Measure Helpers', () => {
    it('should measure synchronous function duration', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      const result = logger.measure('sync_operation', () => {
        return 42;
      });

      expect(result).toBe(42);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duration: sync_operation'),
        expect.any(String),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });

    it('should measure async function duration', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      const result = await logger.measureAsync('async_operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duration: async_operation'),
        expect.any(String),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });

    it('should log error when measured function throws', () => {
      const errorSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      expect(() => {
        logger.measure('failing_operation', () => {
          throw new Error('Operation failed');
        });
      }).toThrow('Operation failed');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('failing_operation failed'),
        expect.any(String),
        expect.any(String)
      );
      errorSpy.mockRestore();
    });

    it('should log error when measured async function rejects', async () => {
      const errorSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      await expect(
        logger.measureAsync('failing_async_operation', async () => {
          throw new Error('Async operation failed');
        })
      ).rejects.toThrow('Async operation failed');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('failing_async_operation failed'),
        expect.any(String),
        expect.any(String)
      );
      errorSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should not log to console when disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(false);

      logger.info('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should allow changing min level dynamically', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.setConsole(true);

      logger.setMinLevel(LogLevel.DEBUG);
      logger.debug('Debug 1');
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      logger.setMinLevel(LogLevel.ERROR);
      logger.debug('Debug 2');
      expect(consoleSpy).toHaveBeenCalledTimes(1); // Não incrementa

      logger.error('Error 1');
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });
});
