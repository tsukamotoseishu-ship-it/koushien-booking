# Fill in the three values below, then double-click this file (or right-click
# -> Run with PowerShell) to start the print relay. Leave this window open -
# it needs to keep running. See README.md to make it start automatically.

$env:API_BASE = "https://koushien-booking.onrender.com"
$env:PRINT_RELAY_TOKEN = "PUT_THE_TOKEN_HERE"
$env:PRINTER_NAME = "PUT_THE_EXACT_WINDOWS_PRINTER_NAME_HERE"

node "$PSScriptRoot\relay.js"
