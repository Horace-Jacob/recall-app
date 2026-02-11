# ============================================================================
# REQUIRED INCLUDES
# ============================================================================
!include "WordFunc.nsh"
!insertmacro WordReplace

# ============================================================================
# Custom Install Macro
# ============================================================================
!macro customInstall
  DetailPrint "Registering native messaging host..."

  # Define variables
  !define HOST_NAME "com.recall.native_host"
  !define CHROME_EXTENSION_ID "jkoekcdligppajejbhfofemcjnbhljik"
  !define FIREFOX_EXTENSION_ID "memory-layer@lon.com"

  # Get AppData path
  ReadEnvStr $0 APPDATA
  StrCpy $1 "$0\memory-layer"

  # Create directory
  CreateDirectory "$1"

  # Get native-host.exe path and convert backslashes to forward slashes
  StrCpy $3 "$INSTDIR\native-host.exe"
  ${WordReplace} $3 "\" "/" "+" $3

  # ========================================
  # Create Chrome/Edge manifest JSON file
  # ========================================
  FileOpen $2 "$1\native-host-manifest.json" w

  FileWrite $2 '{$\r$\n'
  FileWrite $2 '  "name": "${HOST_NAME}",$\r$\n'
  FileWrite $2 '  "description": "Memory Layer Desktop Native Messaging Host",$\r$\n'
  FileWrite $2 '  "path": "$3",$\r$\n'
  FileWrite $2 '  "type": "stdio",$\r$\n'
  FileWrite $2 '  "allowed_origins": [$\r$\n'
  FileWrite $2 '    "chrome-extension://${CHROME_EXTENSION_ID}/"$\r$\n'
  FileWrite $2 '  ]$\r$\n'
  FileWrite $2 '}$\r$\n'

  FileClose $2

  # ========================================
  # Create Firefox manifest JSON file
  # ========================================
  FileOpen $4 "$1\firefox-host-manifest.json" w

  FileWrite $4 '{$\r$\n'
  FileWrite $4 '  "name": "${HOST_NAME}",$\r$\n'
  FileWrite $4 '  "description": "Memory Layer Desktop Native Messaging Host",$\r$\n'
  FileWrite $4 '  "path": "$3",$\r$\n'
  FileWrite $4 '  "type": "stdio",$\r$\n'
  FileWrite $4 '  "allowed_extensions": [$\r$\n'
  FileWrite $4 '    "${FIREFOX_EXTENSION_ID}"$\r$\n'
  FileWrite $4 '  ]$\r$\n'
  FileWrite $4 '}$\r$\n'

  FileClose $4

  # ========================================
  # Register in Chrome
  # ========================================
  WriteRegStr HKCU "Software\Google\Chrome\NativeMessagingHosts\${HOST_NAME}" "" "$1\native-host-manifest.json"

  # ========================================
  # Register in Edge
  # ========================================
  WriteRegStr HKCU "Software\Microsoft\Edge\NativeMessagingHosts\${HOST_NAME}" "" "$1\native-host-manifest.json"

  # ========================================
  # Register in Firefox
  # ========================================
  WriteRegStr HKCU "Software\Mozilla\NativeMessagingHosts\${HOST_NAME}" "" "$1\firefox-host-manifest.json"

  DetailPrint "Native messaging host registered for Chrome, Edge, and Firefox"

!macroend

!macro customUnInstall
  DetailPrint "Unregistering native messaging host..."

  !define HOST_NAME "com.recall.native_host"

  # Remove registry keys
  DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\${HOST_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Edge\NativeMessagingHosts\${HOST_NAME}"
  DeleteRegKey HKCU "Software\Mozilla\NativeMessagingHosts\${HOST_NAME}"

  # Remove manifest files
  ReadEnvStr $0 APPDATA
  Delete "$0\memory-layer\native-host-manifest.json"
  Delete "$0\memory-layer\firefox-host-manifest.json"

  DetailPrint "Native messaging host unregistered"

!macroend