@ECHO OFF
setlocal EnableExtensions

rem get unique file name 
:uniqLoop
set VSCODE_SSH_ASKPASS_RESULT=%tmp%\vscode-ssh-askpass-result-%RANDOM%.tmp
if exist "%VSCODE_SSH_ASKPASS_RESULT%" goto :uniqLoop

"%VSCODE_SSH_ASKPASS_NODE%" "%VSCODE_SSH_ASKPASS_MAIN%" %*
if exist %VSCODE_SSH_ASKPASS_RESULT% (
    type "%VSCODE_SSH_ASKPASS_RESULT%""
    del %VSCODE_SSH_ASKPASS_RESULT%
)
