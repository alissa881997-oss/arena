# ԱՐԵՆԱ • 10 ԿԱՅԱՆ

Run (needs Node 18+, no installs):

    node server.js

Open the address it prints on the TV/laptop (use the Wi-Fi address, not "localhost", so the QR works on phones).
Phones must be on the same Wi-Fi, or host the folder on any Node host (Render, Railway, a VPS) and set:

    HOST_PASSWORD=yourpassword  PUBLIC_URL=https://your-site  node server.js

Pages: /  (main)  /tv  /host  /coord  /team  /wordle  /photo
Host password default: arena2026.  Station and team PINs are shown only in /host.
Game state is saved to data.json (survives a restart). Delete it for a clean start.
