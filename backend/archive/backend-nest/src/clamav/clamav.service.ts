import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';

@Injectable()
export class ClamavService {
  private readonly logger = new Logger(ClamavService.name);
  private host: string;
  private port: number;

  constructor(private config: ConfigService) {
    this.host = config.get<string>('CLAMAV_HOST') || 'localhost';
    this.port = parseInt(config.get<string>('CLAMAV_PORT') || '3310');
  }

  /**
   * Scan a file buffer for viruses using ClamAV's INSTREAM protocol.
   * Returns { clean: boolean, virusName?: string }
   */
  async scanBuffer(buffer: Buffer): Promise<{ clean: boolean; virusName?: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();

      const timeout = setTimeout(() => {
        socket.destroy();
        this.logger.warn('ClamAV scan timed out — treating file as clean');
        resolve({ clean: true }); // Fail-open: if ClamAV is down, allow upload
      }, 30000);

      socket.connect(this.port, this.host, () => {
        // INSTREAM protocol: send zINSTREAM\0 + chunks
        socket.write('zINSTREAM\0');

        // Send buffer in chunks
        const CHUNK_SIZE = 4096;
        for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
          const chunk = buffer.slice(i, i + CHUNK_SIZE);
          const sizeBuf = Buffer.alloc(4);
          sizeBuf.writeUInt32BE(chunk.length);
          socket.write(sizeBuf);
          socket.write(chunk);
        }

        // Send terminator (zero-length chunk)
        socket.write(Buffer.alloc(4));
      });

      let result = '';
      socket.on('data', (data) => {
        result += data.toString();
      });

      socket.on('end', () => {
        clearTimeout(timeout);
        const response = result.trim();
        this.logger.debug(`ClamAV response: ${response}`);

        if (response.includes('OK') && !response.includes('FOUND')) {
          resolve({ clean: true });
        } else {
          const match = response.match(/: (.+) FOUND/);
          const virusName = match ? match[1] : 'Unknown virus';
          this.logger.warn(`Virus detected: ${virusName}`);
          resolve({ clean: false, virusName });
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        this.logger.warn(`ClamAV connection error: ${err.message} — treating file as clean`);
        resolve({ clean: true }); // Fail-open if ClamAV is unreachable
      });
    });
  }
}
