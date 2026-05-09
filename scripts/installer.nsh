; ── Custom NSIS include for Offline POS ────────────────────────────────────
; Adds a "Launch Offline POS on Windows startup" checkbox to the installer.

!macro customHeader
  ; Declare the checkbox state variable
  Var StartupCheckbox
!macroend

!macro customInstall
  ; ── Add auto-launch registry entry if checkbox is checked ──────────────────
  ${If} $StartupCheckbox == 1
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
      "Offline POS" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ${EndIf}

  ; ── Create uninstall registry keys ─────────────────────────────────────────
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" \
    "Publisher" "Offline POS"
!macroend

!macro customUnInstall
  ; ── Remove auto-launch registry entry on uninstall ─────────────────────────
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Offline POS"
!macroend

!macro customWelcomePage
  ; ── Custom page: "Launch on startup" checkbox ──────────────────────────────
  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateCheckbox} 0 0 100% 12u "Launch Offline POS automatically when Windows starts"
  Pop $StartupCheckbox

  ; Default: unchecked
  ${NSD_SetState} $StartupCheckbox ${BST_UNCHECKED}

  nsDialogs::Show
!macroend
