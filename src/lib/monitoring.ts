import { CONFIG } from './config';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private maxStoredMetrics = 1000;
  private maxStoredErrors = 100;

  private constructor() {
    this.setupPerformanceObserver();
    this.setupErrorHandling();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: entry.startTime,
            metadata: {
              entryType: entry.entryType,
              startTime: entry.startTime,
              duration: entry.duration
            }
          });
        }
      });

      observer.observe({ entryTypes: ['resource', 'navigation', 'longtask'] });
    }
  }

  private setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        metadata: {
          type: 'unhandledrejection',
          reason: event.reason
        }
      });
    });
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift();
    }
  }

  recordError(error: ErrorReport) {
    this.errors.push(error);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }
    console.error('Application Error:', error);
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clearMetrics() {
    this.metrics = [];
  }

  clearErrors() {
    this.errors = [];
  }
}

export const monitoring = MonitoringService.getInstance();