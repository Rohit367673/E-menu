import { useState, useEffect } from 'react';
import { Printer, Settings, FileText, TestTube2, Info, CheckCircle2, Usb } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  checkBridgeHealth,
  testBridgePrint,
  isWebSerialConnected,
  connectWebSerialPrinter,
  disconnectWebSerialPrinter,
  printKOTViaWebSerial,
} from '../../services/printBridge';

const STORAGE_KEYS = {
  paperSize: 'sukoon_paper_size',
  autoPrintKOT: 'sukoon_auto_print_kot',
  kotSound: 'sukoon_kot_sound',
  showRestaurantOnKOT: 'sukoon_show_restaurant_kot',
};

export default function PrinterSettingsPage() {
  const [paperSize, setPaperSize] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.paperSize) || '80mm'
  );
  const [autoPrintKOT, setAutoPrintKOT] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.autoPrintKOT) !== 'false'
  );
  const [kotSound, setKotSound] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.kotSound) !== 'false'
  );
  const [showRestaurantOnKOT, setShowRestaurantOnKOT] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.showRestaurantOnKOT) !== 'false'
  );
  const [saved, setSaved] = useState(false);
  
  const [bridgeOnline, setBridgeOnline] = useState(false);

  const [isSerialConnected, setIsSerialConnected] = useState(isWebSerialConnected());
  const [isConnectingSerial, setIsConnectingSerial] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.paperSize, paperSize);
    localStorage.setItem(STORAGE_KEYS.autoPrintKOT, String(autoPrintKOT));
    localStorage.setItem(STORAGE_KEYS.kotSound, String(kotSound));
    localStorage.setItem(STORAGE_KEYS.showRestaurantOnKOT, String(showRestaurantOnKOT));
  }, [paperSize, autoPrintKOT, kotSound, showRestaurantOnKOT]);

  useEffect(() => {
    const checkBridge = async () => {
      const health = await checkBridgeHealth();
      setBridgeOnline(health.online);
    };
    checkBridge();
    const interval = setInterval(checkBridge, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectSerial = async () => {
    setIsConnectingSerial(true);
    const res = await connectWebSerialPrinter();
    setIsConnectingSerial(false);
    setIsSerialConnected(isWebSerialConnected());
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleDisconnectSerial = async () => {
    await disconnectWebSerialPrinter();
    setIsSerialConnected(false);
    toast.success('Disconnected USB printer');
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('Printer settings saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestKOTPrint = async () => {
    if (isSerialConnected) {
      const sampleKOT = {
        kotNumber: 'KOT-TEST',
        tableNumber: 'TEST',
        round: 1,
        orderNumber: '#000',
        customerName: 'TVS Champ RP Star Test',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        items: [
          { name: 'Cold Brew (USB Test)', quantity: 2, notes: 'Less ice' },
          { name: 'Avocado Toast', quantity: 1, notes: 'Extra crispy' },
        ],
        specialInstructions: 'TVS Auto-Cutter and 80mm Roll Test OK',
      };
      const res = await printKOTViaWebSerial(sampleKOT);
      if (res.success) {
        toast.success('Printed test KOT directly via Chrome USB!');
      } else {
        toast.error(`Print failed: ${res.message}`);
      }
      return;
    }

    if (bridgeOnline) {
      const res = await testBridgePrint();
      if (res.success) {
        toast.success('Test KOT printed successfully via Bridge!');
      } else {
        toast.error(`Bridge print failed: ${res.message}`);
      }
    } else {
      toast.success('Printing test KOT to TVS Champ RP Star (80mm)...');
      document.body.classList.add('printing-kot');
      window.print();
      setTimeout(() => document.body.classList.remove('printing-kot'), 1000);
    }
  };

  const handleTestBillPrint = () => {
    toast.success('Printing test customer bill to TVS Champ RP Star (80mm)...');
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-receipt'), 1000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              Printer & KOT Settings
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Configure thermal printer, KOT auto-print, and paper size
            </p>
          </div>
        </div>
      </div>

      {/* Configured Hardware Profile */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-500 shadow-sm bg-gradient-to-r from-emerald-50/50 via-white to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Printer className="w-24 h-24 text-emerald-900" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex w-2.5 h-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Configured Hardware Profile
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Active Hardware
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Device</p>
              <p className="text-xs font-black text-stone-900">TVS Champ RP Star</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Paper Width</p>
              <p className="text-xs font-bold text-stone-800">80mm (72mm print)</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Power</p>
              <p className="text-xs font-bold text-stone-800">DC 24V, 1.5A</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Auto-Cutter</p>
              <p className="text-xs font-bold text-emerald-700">Supported ✓</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Connection</p>
              <p className="text-xs font-bold text-stone-800">USB / LAN</p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Resolution</p>
              <p className="text-xs font-bold text-stone-800">203 DPI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chrome Direct USB Connection (Zero Installation) */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-xs">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900">Chrome In-Browser USB Bridge</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Zero Installation
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                No terminal commands or software installation required on the client machine
              </p>
            </div>
          </div>
          {isSerialConnected ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
              Not Connected
            </span>
          )}
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Plug your <strong>TVS CHAMP RP STAR</strong> USB cable into this computer. Click the button below to pair it directly with Google Chrome. The browser will remember permission and send tickets directly down the USB cable when orders arrive.
        </p>

        <div className="flex items-center gap-3">
          {!isSerialConnected ? (
            <button
              type="button"
              disabled={isConnectingSerial}
              onClick={handleConnectSerial}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isConnectingSerial ? 'Connecting...' : '🔌 Connect TVS USB Printer in Chrome'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisconnectSerial}
              className="py-2.5 px-4 rounded-xl font-bold text-xs text-red-600 border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
            >
              Disconnect USB
            </button>
          )}

          <button
            type="button"
            onClick={handleTestKOTPrint}
            className="py-3 px-4 rounded-xl font-bold text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <TestTube2 className="w-4 h-4 text-emerald-600" />
            <span>Test Print</span>
          </button>
        </div>
      </div>

      {/* KOT Settings */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <FileText className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-stone-900">Kitchen Order Ticket (KOT)</h2>
        </div>

        {/* Auto-Print KOT */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-stone-900">Auto-Print KOT on New Order</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Automatically open the KOT print dialog when a new order arrives from customer or POS
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoPrintKOT(!autoPrintKOT)}
            className={`admin-toggle ${autoPrintKOT ? 'active' : 'inactive'}`}
          />
        </div>

        {/* KOT Sound */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-stone-900">KOT Sound Alert</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Play a chime sound when a new KOT is generated
            </p>
          </div>
          <button
            type="button"
            onClick={() => setKotSound(!kotSound)}
            className={`admin-toggle ${kotSound ? 'active' : 'inactive'}`}
          />
        </div>

        {/* Show Restaurant Name */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-stone-900">Show Restaurant Name on KOT</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Display "Sukoon Cafe & Bar" at the top of kitchen tickets
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRestaurantOnKOT(!showRestaurantOnKOT)}
            className={`admin-toggle ${showRestaurantOnKOT ? 'active' : 'inactive'}`}
          />
        </div>
      </div>

      {/* Paper & Printer Settings */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Settings className="w-4 h-4 text-stone-600" />
          <h2 className="text-sm font-bold text-stone-900">Paper & Printer Configuration</h2>
        </div>

        {/* Paper Size */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-stone-900">Thermal Paper Size</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Select the paper width of your thermal receipt printer
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {['58mm', '80mm'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPaperSize(size)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperSize === size
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Printer Connection Info */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h4 className="text-xs font-bold text-blue-900">Printer Connection Guide</h4>
          </div>
          <ul className="text-[11px] text-blue-800 space-y-1 pl-6 list-disc">
            <li>Connect your thermal printer via <strong>USB</strong> to this computer/tablet</li>
            <li>The browser will detect it as a system printer in the print dialog</li>
            <li>Select your thermal printer in the browser's print dialog when printing KOT or Bill</li>
            <li>For <strong>LAN/Wi-Fi</strong> printers: Add it as a network printer in your OS settings first</li>
            <li>For <strong>Bluetooth</strong> printers: Pair it in your device's Bluetooth settings first</li>
          </ul>
        </div>
      </div>

      {/* Test Prints */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <TestTube2 className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-stone-900">Test Print</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestKOTPrint}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Test KOT Print</span>
          </button>
          <button
            type="button"
            onClick={handleTestBillPrint}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-2xs cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-amber-700" />
            <span>Test Bill Print</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          <span>{saved ? 'Settings Saved!' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
