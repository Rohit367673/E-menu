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

/**
 * Builds standard ESC/POS binary buffer for TVS Champ RP Star (80mm roll).
 * Features bold items, clear kitchen quantities, special notes, and auto-cutter command.
 * Strictly 0 prices.
 */
export function buildKOTEscPosBytes(kotData: any): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const add = (...bytes: number[]) => parts.push(new Uint8Array(bytes));
  const addText = (text: string) => parts.push(encoder.encode(text));

  // Initialize printer
  add(0x1b, 0x40);

  // Header (Center, Double Size, Bold)
  add(0x1b, 0x61, 0x01); // Center
  add(0x1b, 0x45, 0x01); // Bold On
  add(0x1d, 0x21, 0x11); // Double height & width
  addText('★ K O T ★\n');
  add(0x1d, 0x21, 0x00); // Normal size
  addText('KITCHEN ORDER TICKET\n');
  addText('Sukoon Cafe & Bar\n');
  add(0x1b, 0x45, 0x00); // Bold Off
  addText('------------------------------------------------\n');

  // Meta (Left align)
  add(0x1b, 0x61, 0x00);
  add(0x1b, 0x45, 0x01);
  add(0x1d, 0x21, 0x01); // Double height
  addText(`TABLE: ${kotData.tableNumber}     ROUND: ${kotData.round}\n`);
  add(0x1d, 0x21, 0x00); // Normal size
  add(0x1b, 0x45, 0x00);
  addText(`KOT #: ${kotData.kotNumber}     Time: ${kotData.time}\n`);
  addText(`Order: ${kotData.orderNumber}     Guest: ${kotData.customerName || 'Guest'}\n`);
  addText('------------------------------------------------\n');

  // Items Header
  add(0x1b, 0x45, 0x01);
  addText('ITEM                                         QTY\n');
  add(0x1b, 0x45, 0x00);
  addText('------------------------------------------------\n');

  // Items (NO PRICES)
  if (Array.isArray(kotData.items)) {
    kotData.items.forEach((it: any) => {
      add(0x1b, 0x45, 0x01);
      add(0x1d, 0x21, 0x01); // Large readable size for kitchen
      const qtyStr = `${it.quantity}x`;
      const name = it.name || 'Item';
      const spaceCount = Math.max(1, 38 - name.length - qtyStr.length);
      addText(`${name}${' '.repeat(spaceCount)}${qtyStr}\n`);
      add(0x1d, 0x21, 0x00);
      add(0x1b, 0x45, 0x00);
      if (it.notes) {
        addText(`  -> Note: ${it.notes}\n`);
      }
    });
  }

  addText('------------------------------------------------\n');

  // Special Instructions
  if (kotData.specialInstructions) {
    add(0x1b, 0x45, 0x01);
    addText(`SPECIAL INSTRUCTIONS:\n${kotData.specialInstructions}\n`);
    add(0x1b, 0x45, 0x00);
    addText('------------------------------------------------\n');
  }

  // Footer
  add(0x1b, 0x61, 0x01); // Center
  addText('*** END OF KOT ***\n');
  addText('KITCHEN USE ONLY - NO PRICES\n\n');

  // Feed 4 lines & Auto-Cut
  add(0x1b, 0x64, 0x04);
  add(0x1d, 0x56, 0x42, 0x00); // GS V 'B' 0 (Feed and cut for TVS auto-cutter)

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
