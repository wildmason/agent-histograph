@echo off
REM ===================================================================
REM  Histograph desktop launcher (Windows)
REM
REM  Starts the frameless Tauri board, resolving the Python backend
REM  (AGENTLOG_HOME) relative to THIS script, so it works from any
REM  checkout location with no hard-coded paths.
REM
REM  Ledger: defaults to %USERPROFILE%\.agent-histograph (the histograph
REM  namespace). To point the board at a different ledger, set
REM  AGENTLOG_DIR before launching -- the simplest way is a personal,
REM  gitignored run-histograph.local.cmd that sets it and calls this.
REM ===================================================================
setlocal
set "REPO=%~dp0"
set "AGENTLOG_HOME=%REPO%agentlog"
if not defined AGENTLOG_DIR set "AGENTLOG_DIR=%USERPROFILE%\.agent-histograph"

set "EXE=%REPO%agentlog\desktop\src-tauri\target\release\histograph.exe"
if not exist "%EXE%" (
  echo [run-histograph] Desktop build not found:
  echo                  "%EXE%"
  echo [run-histograph] Build it:        cd agentlog\desktop ^&^& cargo tauri build
  echo [run-histograph] Or run unbuilt:  cd agentlog\desktop ^&^& cargo tauri dev
  endlocal ^& exit /b 1
)

echo [run-histograph] AGENTLOG_DIR  = %AGENTLOG_DIR%
echo [run-histograph] AGENTLOG_HOME = %AGENTLOG_HOME%
echo [run-histograph] launching "%EXE%"
start "" "%EXE%"
endlocal
