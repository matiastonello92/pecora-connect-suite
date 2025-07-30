/**
 * EventBus Tests
 * Test suite for high-performance event communication
 */

import { EventBus } from '../../src/core/events/EventBus';
import { EventBusConfig } from '../../src/core/types/core';

const defaultConfig: EventBusConfig = {
  maxListeners: 100,
  batchSize: 10,
  batchTimeout: 50,
  enableDebugging: false,
  memoryLimit: 10, // MB
};

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus(defaultConfig);
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe('Event Emission and Handling', () => {
    it('should emit and handle events', () => {
      const handler = jest.fn();
      
      eventBus.on('test.event', handler);
      eventBus.emit({
        type: 'test.event',
        payload: { data: 'test' },
        source: 'TestSuite',
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          payload: { data: 'test' },
          source: 'TestSuite',
        })
      );
    });

    it('should support wildcard patterns', () => {
      const handler = jest.fn();
      
      eventBus.on('test.*', handler);
      eventBus.emit({
        type: 'test.specific',
        payload: {},
        source: 'TestSuite',
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle high-priority events immediately', () => {
      const handler = jest.fn();
      
      eventBus.on('priority.event', handler);
      eventBus.emit({
        type: 'priority.event',
        payload: {},
        source: 'TestSuite',
        priority: 10,
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle high event throughput', () => {
      const handler = jest.fn();
      eventBus.on('performance.*', handler);

      // Emit 1000 events
      for (let i = 0; i < 1000; i++) {
        eventBus.emit({
          type: 'performance.test',
          payload: { id: i },
          source: 'PerformanceTest',
        });
      }

      const metrics = eventBus.getMetrics();
      expect(metrics.eventsProcessed).toBe(1000);
    });

    it('should batch process events efficiently', (done) => {
      const handler = jest.fn();
      eventBus.on('batch.*', handler);

      // Emit events rapidly
      for (let i = 0; i < 5; i++) {
        eventBus.emit({
          type: 'batch.test',
          payload: { id: i },
          source: 'BatchTest',
        });
      }

      // Events should be batched
      setTimeout(() => {
        expect(handler).toHaveBeenCalledTimes(5);
        done();
      }, 100);
    });
  });
});