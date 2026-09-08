import type { PrintJob } from '../types/menu';

const BRIDGE_URL = 'http://127.0.0.1:18080';

export interface BridgeHealth {
  online: boolean;
  printer?: string;
  os?: string;
}

// ─── Direct In-Browser Web Serial / WebUSB Engine (Zero Installation) ─────
let activeSerialPort: any = null;

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function isWebSerialConnected(): boolean {
  return activeSerialPort !== null;
}

/**
 * 1-Click Browser Pairing with TVS USB Printer.
 * Prompts Chrome's native USB/Serial picker dialog once.
 * No terminal commands or node servers needed!
 */
export async function connectWebSerialPrinter(): Promise<{ success: boolean; message: string }> {
  if (!isWebSerialSupported()) {
    return {
      success: false,
      message: 'Web Serial is not supported in this browser. Please use Google Chrome or Microsoft Edge.',
    };
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 }); // TVS Champ RP Star standard baud
    activeSerialPort = port;
    localStorage.setItem('sukoon_web_serial_paired', 'true');
    return { success: true, message: 'TVS USB Printer connected directly in Chrome!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection cancelled or failed' };
  }
}

export async function autoReconnectWebSerial(): Promise<boolean> {
  if (!isWebSerialSupported()) return false;
  if (activeSerialPort && activeSerialPort.writable) return true;

  const wasPaired = localStorage.getItem('sukoon_web_serial_paired') === 'true';
  if (!wasPaired) return false;

  try {
    const ports = await (navigator as any).serial.getPorts();
    if (ports.length > 0) {
      const port = ports[0];
      if (!port.readable) {
        await port.open({ baudRate: 9600 });
      }
      activeSerialPort = port;
      return true;
    }
  } catch (err) {
    console.warn('Auto-reconnect to TVS USB printer failed:', err);
  }
  return false;
}

export async function disconnectWebSerialPrinter(): Promise<void> {
  if (activeSerialPort) {
    try {
      await activeSerialPort.close();
    } catch {}
    activeSerialPort = null;
    localStorage.removeItem('sukoon_web_serial_paired');
  }
}

export const POST_PRINT_COOLDOWN_MS = 800; // Post-print pause for TVS cutter motor

/**
 * Builds standard ESC/POS binary buffer for TVS Champ RP Star (80mm roll).
 * Uses strictly standard ASCII characters to avoid CP437 corruption.
 * Supports isReprint flag to label duplicate reprints clearly for the kitchen.
 * Strictly 0 prices.
 */
export function buildKOTEscPosBytes(kotData: any): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const add = (...bytes: number[]) => parts.push(new Uint8Array(bytes));
  // Clean string to strictly safe ASCII (replacing non-ASCII characters)
  const addSafeAscii = (text: string) => {
    const clean = text
      .replace(/[₹]/g, 'Rs.')
      .replace(/[^\x00-\x7F]/g, ' '); // Strip non-ASCII to prevent CP437 corrupt bytes
    parts.push(encoder.encode(clean));
  };

  // 1. Initialize printer (ESC @)
  add(0x1b, 0x40);

  // 2. Header (Center, Double Height & Width, Bold)
  add(0x1b, 0x61, 0x01); // Center
  add(0x1b, 0x45, 0x01); // Bold On
  add(0x1d, 0x21, 0x11); // Double height & width

  if (kotData.isReprint) {
    addSafeAscii('*** REPRINT ***\n');
  } else {
    addSafeAscii('*** K O T ***\n');
  }

  add(0x1d, 0x21, 0x00); // Normal size
  if (kotData.isReprint) {
    addSafeAscii('DUPLICATE TICKET - ALREADY IN KITCHEN\n');
  } else {
    addSafeAscii('KITCHEN ORDER TICKET\n');
  }
  addSafeAscii('Sukoon Cafe & Bar\n');
  add(0x1b, 0x45, 0x00); // Bold Off
  addSafeAscii('------------------------------------------------\n');

  // 3. Meta (Left align)
  add(0x1b, 0x61, 0x00);
  add(0x1b, 0x45, 0x01);
  add(0x1d, 0x21, 0x01); // Double height for table & round
  addSafeAscii(`TABLE: ${kotData.tableNumber}     ROUND: ${kotData.round}\n`);
  add(0x1d, 0x21, 0x00); // Normal size
  add(0x1b, 0x45, 0x00);
  addSafeAscii(`KOT #: ${kotData.kotNumber}     Time: ${kotData.time}\n`);
  addSafeAscii(`Order: ${kotData.orderNumber}     Guest: ${kotData.customerName || 'Guest'}\n`);
  if (kotData.printJobId) {
    addSafeAscii(`Job ID: ${kotData.printJobId}\n`);
  }
  addSafeAscii('------------------------------------------------\n');

  // 4. Items Header (Bold)
  add(0x1b, 0x45, 0x01);
  addSafeAscii('ITEM                                         QTY\n');
  add(0x1b, 0x45, 0x00);
  addSafeAscii('------------------------------------------------\n');

  // 5. Items (NO PRICES)
  if (Array.isArray(kotData.items)) {
    kotData.items.forEach((it: any) => {
      add(0x1b, 0x45, 0x01);
      add(0x1d, 0x21, 0x01); // Large readable font for cooks
      const qtyStr = `${it.quantity}x`;
      const name = (it.name || 'Item').substring(0, 36);
      const spaceCount = Math.max(1, 40 - name.length - qtyStr.length);
      addSafeAscii(`${name}${' '.repeat(spaceCount)}${qtyStr}\n`);
      add(0x1d, 0x21, 0x00); // Normal font
      add(0x1b, 0x45, 0x00);
      if (it.notes) {
        addSafeAscii(`  -> Note: ${it.notes}\n`);
      }
    });
  }

  addSafeAscii('------------------------------------------------\n');

  // 6. Special Instructions
  if (kotData.specialInstructions) {
    add(0x1b, 0x45, 0x01);
    addSafeAscii(`SPECIAL INSTRUCTIONS:\n${kotData.specialInstructions}\n`);
    add(0x1b, 0x45, 0x00);
    addSafeAscii('------------------------------------------------\n');
  }

  // 7. Footer
  add(0x1b, 0x61, 0x01); // Center
  addSafeAscii('*** END OF KOT ***\n');
  addSafeAscii('KITCHEN USE ONLY - NO PRICES\n\n');

  // 8. Feed 4 lines & Auto-Cut
  add(0x1b, 0x64, 0x04);
  add(0x1d, 0x56, 0x42, 0x00); // GS V 'B' 0 (Feed and full/partial cut for TVS)

  // Merge bytes
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

/**
 * Direct low-level transmission to the Web Serial port
 */
export async function printKOTViaWebSerial(kotData: any): Promise<{ success: boolean; message: string }> {
  if (!activeSerialPort || !activeSerialPort.writable) {
    return { success: false, message: 'USB printer not connected in browser' };
  }

  try {
    const bytes = buildKOTEscPosBytes(kotData);
    const writer = activeSerialPort.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    return { success: true, message: 'Printed directly via Chrome USB Serial!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Direct USB print failed' };
  }
}

// ─── FIFO Sequential Mutex Print Queue ─────────────────────────────────────
export interface PrintJobTask {
  job: PrintJob;
  resolve: (res: { success: boolean; message: string }) => void;
  reject: (err: any) => void;
}

const printQueue: PrintJobTask[] = [];
let isQueueProcessing = false;

/**
 * Enqueue a PrintJob into the FIFO queue.
 * Guarantees strict sequential printing with cooldown between tickets to prevent stream locking.
 */
export function queueKOTPrint(job: PrintJob): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    printQueue.push({ job, resolve, reject });
    processPrintQueue();
  });
}

export function getPendingQueueLength(): number {
  return printQueue.length;
}

async function processPrintQueue(): Promise<void> {
  if (isQueueProcessing) return;
  if (printQueue.length === 0) return;

  isQueueProcessing = true;
  const currentTask = printQueue.shift()!;

  try {
    if (isWebSerialConnected()) {
      const res = await printKOTViaWebSerial(currentTask.job);
      currentTask.resolve(res);
    } else {
      const bridgeHealth = await checkBridgeHealth();
      if (bridgeHealth.online) {
        const res = await printKOTViaBridge(currentTask.job);
        currentTask.resolve(res);
      } else {
        currentTask.resolve({
          success: false,
          message: 'TVS Thermal printer is offline. Please connect USB cable.',
        });
      }
    }
  } catch (err: any) {
    currentTask.resolve({
      success: false,
      message: err?.message || 'Print execution error',
    });
  } finally {
    // Post-print cooldown between sequential prints to allow TVS auto-cutter to cycle
    await new Promise((resolve) => setTimeout(resolve, POST_PRINT_COOLDOWN_MS));
    isQueueProcessing = false;
    processPrintQueue();
  }
}

// ─── Screen Wake Lock API (Keep POS Awake During Cafe Hours) ───────────────
let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function releaseScreenWakeLock(): void {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}

// ─── Local HTTP Bridge (Optional Fallback) ──────────────────────────────────
export async function checkBridgeHealth(): Promise<BridgeHealth> {
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      return { online: true, printer: data.printer, os: data.os };
    }
  } catch {}
  return { online: false };
}

export async function printKOTViaBridge(kotData: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BRIDGE_URL}/print-kot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kotData),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Printed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Bridge offline' };
  }
}

export async function printBillViaBridge(billData: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BRIDGE_URL}/print-bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Printed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Bridge offline' };
  }
}

export async function testBridgePrint(): Promise<{ success: boolean; message: string }> {
  // If direct Web Serial is connected, test via Web Serial
  if (isWebSerialConnected()) {
    const sampleKOT = {
      kotNumber: 'KOT-TEST',
      tableNumber: 'TEST',
      round: 1,
      orderNumber: '#000',
      customerName: 'TVS Champ RP Star Test',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      items: [
        { name: 'Cold Brew (Test Item)', quantity: 2, notes: 'Less ice' },
        { name: 'Avocado Toast', quantity: 1, notes: 'Extra crispy' },
      ],
      specialInstructions: 'TVS Auto-Cutter and 80mm Roll Test OK',
    };
    return await printKOTViaWebSerial(sampleKOT);
  }

  // Otherwise try local bridge if running
  try {
    const res = await fetch(`${BRIDGE_URL}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { success: data.success, message: data.message || 'Test printed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Bridge offline' };
  }
}
