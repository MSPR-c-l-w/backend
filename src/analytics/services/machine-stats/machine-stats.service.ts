import { Injectable } from '@nestjs/common';
import os from 'node:os';

type CpuTimes = { idle: number; total: number };

function snapshotCpu(): CpuTimes {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    idle += c.times.idle;
    total +=
      c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq;
  }
  return { idle, total };
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

@Injectable()
export class MachineStatsService {
  private cpuPercent: number = 0;
  private lastCpu: CpuTimes = snapshotCpu();
  private readonly startedAt = Date.now();

  constructor() {
    // Échantillonnage léger (1s) pour approx CPU%.
    setInterval(() => {
      const next = snapshotCpu();
      const idleDelta = next.idle - this.lastCpu.idle;
      const totalDelta = next.total - this.lastCpu.total;
      if (totalDelta > 0) {
        const usage = 1 - idleDelta / totalDelta;
        this.cpuPercent = Math.max(0, Math.min(100, Math.round(usage * 100)));
      }
      this.lastCpu = next;
    }, 1000).unref();
  }

  getStats(): {
    cpuPercent: number;
    memoryPercent: number;
    loadAvg1m: number;
    uptime: string;
    lastRestart: string;
  } {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const used = Math.max(0, totalMem - freeMem);
    const memoryPercent =
      totalMem > 0 ? Math.round((used / totalMem) * 100) : 0;
    const loadAvg1m = os.loadavg()[0] ?? 0;

    const uptimeSeconds = process.uptime();
    const uptime = formatDuration(uptimeSeconds);
    const sinceStartSeconds = (Date.now() - this.startedAt) / 1000;
    const lastRestart = `Il y a ${formatDuration(sinceStartSeconds)}`;

    return {
      cpuPercent: this.cpuPercent,
      memoryPercent,
      loadAvg1m: Math.round(loadAvg1m * 100) / 100,
      uptime,
      lastRestart,
    };
  }
}
