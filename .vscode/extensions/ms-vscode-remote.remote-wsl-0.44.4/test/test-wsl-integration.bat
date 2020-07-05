@echo off	
setlocal	

pushd %~dp0\..

 wsl.exe bash -i -c ./tests/test-wsl-integration.sh	

 popd	

 endlocal