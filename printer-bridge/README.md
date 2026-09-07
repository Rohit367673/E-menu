# TVS Thermal Print Bridge

Local bridge to enable direct thermal printing (without browser dialogs) to a TVS Champ RP Star printer.

## Hardware Setup
1. Connect the TVS Champ RP Star printer to power (24V).
2. Connect it to your computer via USB.
3. Turn on the printer.
4. Ensure the drivers are installed (it should show up in your OS Printer settings).

## Starting the Bridge

### Windows
Double-click `start-bridge.bat`. Keep the command prompt window open.

### macOS / Linux
Open a terminal in this directory and run `./start-bridge.sh`. Keep the terminal open.

## How it works
The bridge runs a local webserver on `http://127.0.0.1:18080`.
The Sukoon Cafe E-Menu (Chrome browser) automatically communicates with this server to send RAW ESC/POS print commands directly to the hardware for instantaneous, silent printing and automatic paper cutting.
