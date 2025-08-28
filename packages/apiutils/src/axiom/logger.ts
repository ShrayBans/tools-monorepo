interface AxiomLogEntry {
  _time: number;
  level: 'info' | 'debug' | 'warn' | 'error';
  message: string;
  context?: any;
  metadata?: {
    caller?: {
      function: string;
      file: string;
      line: string;
      column: string;
    };
    requestContext?: any;
    environment?: string;
  };
}

class AxiomApplicationLogger {
  private axiomDataset: string = 'shray';
  private axiomToken: string = 'xaat-dcb421e2-ad83-4f1f-b955-2b029fa0335f';
  private axiomEndpoint = 'https://api.axiom.co';
  private version = '1.0.0';
  private batch: AxiomLogEntry[] = [];
  private batchTimeout: any = null;
  private maxBatchSize = 10; // Smaller batch size for edge environments
  private flushInterval = 5000; // 5 seconds

  constructor() {
    // Don't set up auto-flush in Cloudflare Workers environment
    // Logs will be flushed manually or when batch size is reached
  }

  private scheduleFlush(): void {
    // Only schedule flush in non-Cloudflare environments
    if (typeof process !== 'undefined' && process.env && this.batchTimeout === null) {
      this.batchTimeout = setTimeout(() => {
        this.flush();
        this.scheduleFlush();
      }, this.flushInterval);
    }
  }

  private async sendLogs(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const logs = this.batch;
    this.batch = [];


    try {
      const url = `${this.axiomEndpoint}/v1/datasets/${this.axiomDataset}/ingest`;
      const body = logs.map(log => JSON.stringify(log)).join('\n');


      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/x-ndjson',
          Authorization: `Bearer ${this.axiomToken}`,
          'User-Agent': `shray-application-logger/${this.version}`
        }
      });


      if (!response.ok) {
        const responseText = await response.text();
        console.error('Failed to send logs to Axiom:', response.status, response.statusText, responseText);
        // Put logs back for retry
        this.batch.unshift(...logs);
      } else {
      }
    } catch (error) {
      console.error('Error sending logs to Axiom:', error);
      // Put logs back for retry
      this.batch.unshift(...logs);
    }
  }

  log(level: 'info' | 'debug' | 'warn' | 'error', message: string, context?: any, metadata?: any): void {
    const logEntry: AxiomLogEntry = {
      _time: Date.now(),
      level,
      message,
      context,
      metadata
    };

    this.batch.push(logEntry);

    // Auto-flush if batch is getting large
    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  info(message: string, context?: any, metadata?: any): void {
    this.log('info', message, context, metadata);
  }

  debug(message: string, context?: any, metadata?: any): void {
    this.log('debug', message, context, metadata);
  }

  warn(message: string, context?: any, metadata?: any): void {
    this.log('warn', message, context, metadata);
  }

  error(message: string, context?: any, metadata?: any): void {
    this.log('error', message, context, metadata);
  }

  async flush(): Promise<void> {
    await this.sendLogs();
  }

  // Create a logger with predefined context
  with(context: any) {
    return {
      info: (message: string, ctx?: any) => this.info(message, { ...context, ...ctx }),
      debug: (message: string, ctx?: any) => this.debug(message, { ...context, ...ctx }),
      warn: (message: string, ctx?: any) => this.warn(message, { ...context, ...ctx }),
      error: (message: string, ctx?: any) => this.error(message, { ...context, ...ctx }),
      flush: () => this.flush(),
    };
  }
}

// Singleton instance
const axiomLogger = new AxiomApplicationLogger();

export { AxiomApplicationLogger, axiomLogger };
export type { AxiomLogEntry };