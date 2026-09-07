const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const os = require('os');

const PORT = 18080;

// ESC/POS Commands
const CMD = {
    INIT: Buffer.from([0x1B, 0x40]), // Initialize
    ALIGN_LEFT: Buffer.from([0x1B, 0x61, 0x00]),
    ALIGN_CENTER: Buffer.from([0x1B, 0x61, 0x01]),
    ALIGN_RIGHT: Buffer.from([0x1B, 0x61, 0x02]),
    BOLD_ON: Buffer.from([0x1B, 0x45, 0x01]),
    BOLD_OFF: Buffer.from([0x1B, 0x45, 0x00]),
    DOUBLE_HW: Buffer.from([0x1D, 0x21, 0x11]), // Double height & width
    NORMAL_HW: Buffer.from([0x1D, 0x21, 0x00]), // Normal
    CUT: Buffer.from([0x1D, 0x56, 0x42, 0x00]), // Cut paper GS V 66 0
    NEWLINE: Buffer.from([0x0A]),
};

function getPrinters() {
    let printers = [];
    let defaultPrinter = '';
    
    try {
        if (os.platform() === 'win32') {
            const stdout = execSync('wmic printer get name,default /value', { encoding: 'utf-8' });
            const lines = stdout.split('\n');
            let current = {};
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                const [key, val] = line.split('=');
                if (key === 'Default') {
                    current.default = val.toUpperCase() === 'TRUE';
                } else if (key === 'Name') {
                    current.name = val;
                    printers.push(current.name);
                    if (current.default) defaultPrinter = current.name;
                    current = {};
                }
            }
        } else {
            const stdout = execSync('lpstat -p', { encoding: 'utf-8' });
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.startsWith('printer ')) {
                    const match = line.match(/^printer\s+([^\s]+)/);
                    if (match) printers.push(match[1]);
                }
            }
            try {
                const defaultStdout = execSync('lpstat -d', { encoding: 'utf-8' });
                const dMatch = defaultStdout.match(/system default destination: (.*)/);
                if (dMatch) defaultPrinter = dMatch[1];
            } catch (e) {}
        }
    } catch (e) {
        console.error("Error getting printers:", e.message);
    }
    
    return { printers, defaultPrinter };
}

function detectPrinter() {
    const { printers, defaultPrinter } = getPrinters();
    const keywords = ['TVS', 'CHAMP', 'RP', 'STAR', 'POS', 'THERMAL', 'RECEIPT'];
    
    let matched = printers.find(p => keywords.some(k => p.toUpperCase().includes(k)));
    return matched || defaultPrinter || (printers.length > 0 ? printers[0] : 'Unknown');
}

function executePrint(buffer, printerName) {
    return new Promise((resolve, reject) => {
        const tmpFile = path.join(os.tmpdir(), `print_${Date.now()}.bin`);
        fs.writeFileSync(tmpFile, buffer);
        
        console.log(`Printing to ${printerName} ...`);
        
        if (os.platform() === 'win32') {
            const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", ExactSpelling = true, SetLastError = true, CharSet = CharSet.Ansi, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);
    
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    
    public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        bool bSuccess = false;
        di.pDocName = "Node POS Print";
        di.pDataType = "RAW";
        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    byte[] bytes = System.IO.File.ReadAllBytes(szFileName);
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten;
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return bSuccess;
    }
}
"@
[RawPrint]::SendFileToPrinter('${printerName}', '${tmpFile}')
            `;
            const psFile = path.join(os.tmpdir(), `print_${Date.now()}.ps1`);
            fs.writeFileSync(psFile, psScript);
            
            exec(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, (err) => {
                fs.unlinkSync(tmpFile);
                fs.unlinkSync(psFile);
                if (err) return reject(err);
                resolve();
            });
        } else {
            exec(`lp -d "${printerName}" -o raw "${tmpFile}"`, (err) => {
                try { fs.unlinkSync(tmpFile); } catch (e) {}
                if (err) return reject(err);
                resolve();
            });
        }
    });
}

function buildKOTBuffer(data) {
    let bufs = [];
    bufs.push(CMD.INIT);
    
    bufs.push(CMD.ALIGN_CENTER);
    bufs.push(CMD.DOUBLE_HW);
    bufs.push(Buffer.from("*** K O T ***\n"));
    bufs.push(CMD.NORMAL_HW);
    bufs.push(CMD.BOLD_ON);
    bufs.push(Buffer.from("Sukoon Cafe & Bar\n"));
    bufs.push(CMD.BOLD_OFF);
    bufs.push(CMD.NEWLINE);
    
    bufs.push(CMD.ALIGN_LEFT);
    bufs.push(Buffer.from(`Table #: ${data.tableNumber || '-'}\n`));
    bufs.push(Buffer.from(`Order #: ${data.kotNumber || '-'}\n`));
    bufs.push(Buffer.from(`Time:    ${new Date().toLocaleTimeString()}\n`));
    if (data.guestName) bufs.push(Buffer.from(`Guest:   ${data.guestName}\n`));
    bufs.push(Buffer.from("-".repeat(48) + "\n"));
    
    bufs.push(CMD.BOLD_ON);
    bufs.push(Buffer.from("QTY  ITEM\n"));
    bufs.push(CMD.BOLD_OFF);
    bufs.push(Buffer.from("-".repeat(48) + "\n"));
    
    if (data.items && Array.isArray(data.items)) {
        data.items.forEach(item => {
            bufs.push(CMD.BOLD_ON);
            const qty = (item.quantity + "x").padEnd(4, " ");
            bufs.push(Buffer.from(`${qty} ${item.name}\n`));
            bufs.push(CMD.BOLD_OFF);
            if (item.notes) {
                bufs.push(Buffer.from(`     -> ${item.notes}\n`));
            }
        });
    }
    
    bufs.push(Buffer.from("-".repeat(48) + "\n"));
    if (data.instructions) {
        bufs.push(Buffer.from(`Notes: ${data.instructions}\n`));
        bufs.push(Buffer.from("-".repeat(48) + "\n"));
    }
    
    bufs.push(CMD.ALIGN_CENTER);
    bufs.push(Buffer.from("*** END OF KOT ***\n"));
    bufs.push(Buffer.from("KITCHEN USE ONLY - NO PRICES\n"));
    
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.CUT);
    
    return Buffer.concat(bufs);
}

function buildTestBuffer() {
    let bufs = [];
    bufs.push(CMD.INIT);
    bufs.push(CMD.ALIGN_CENTER);
    bufs.push(CMD.DOUBLE_HW);
    bufs.push(Buffer.from("BRIDGE TEST\n"));
    bufs.push(CMD.NORMAL_HW);
    bufs.push(Buffer.from("TVS Champ RP Star - Print Bridge\n"));
    bufs.push(Buffer.from(`Port: ${PORT}\n`));
    bufs.push(Buffer.from(`Time: ${new Date().toLocaleString()}\n`));
    bufs.push(CMD.NEWLINE);
    bufs.push(Buffer.from("Successfully connected to bridge!\n"));
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.NEWLINE);
    bufs.push(CMD.CUT);
    return Buffer.concat(bufs);
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            status: 'online',
            printer: detectPrinter(),
            os: os.platform(),
            port: PORT
        }));
        return;
    }

    if (req.url === '/printers' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...getPrinters() }));
        return;
    }

    const processBody = () => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch (e) { resolve({}); }
        });
        req.on('error', reject);
    });

    if (req.method === 'POST') {
        const body = await processBody();
        const printer = detectPrinter();
        
        if (!printer) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'No printer found' }));
            return;
        }

        try {
            let buffer;
            if (req.url === '/print-kot') {
                buffer = buildKOTBuffer(body);
            } else if (req.url === '/print-bill') {
                // Not fully implemented, just reuse KOT format for now or a generic one
                buffer = buildKOTBuffer({ ...body, instructions: 'BILL RECEIPT' });
            } else if (req.url === '/test') {
                buffer = buildTestBuffer();
            } else {
                res.writeHead(404);
                res.end();
                return;
            }

            await executePrint(buffer, printer);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Print job sent successfully' }));
        } catch (error) {
            console.error("Print Error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n=========================================================`);
    console.log(`  TVS Electronics CHAMP RP STAR - Print Bridge`);
    console.log(`=========================================================`);
    console.log(`Bridge listening on http://127.0.0.1:${PORT}`);
    console.log(`Detected OS: ${os.platform()}`);
    console.log(`Target Printer: ${detectPrinter()}`);
    console.log(`\nWaiting for print jobs...`);
});
