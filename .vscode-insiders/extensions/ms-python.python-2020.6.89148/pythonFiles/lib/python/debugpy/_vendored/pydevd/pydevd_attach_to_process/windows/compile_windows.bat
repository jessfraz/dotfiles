call "C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat" x86

cl -DUNICODE -D_UNICODE /EHsc /Zi /O1 /LD /MD attach.cpp /link /DEBUG /OPT:REF /OPT:ICF /out:attach_x86.dll
copy attach_x86.dll ..\attach_x86.dll /Y
copy attach_x86.pdb ..\attach_x86.pdb /Y

cl -DUNICODE -D_UNICODE /EHsc /Zi /O1 /LD /MD /D BITS_32 run_code_on_dllmain.cpp /link /DEBUG /OPT:REF /OPT:ICF /out:run_code_on_dllmain_x86.dll
copy run_code_on_dllmain_x86.dll ..\run_code_on_dllmain_x86.dll /Y
copy run_code_on_dllmain_x86.pdb ..\run_code_on_dllmain_x86.pdb /Y

cl /EHsc /Zi /O1 inject_dll.cpp /link /DEBUG  /OPT:REF /OPT:ICF /out:inject_dll_x86.exe
copy inject_dll_x86.exe ..\inject_dll_x86.exe /Y
copy inject_dll_x86.pdb ..\inject_dll_x86.pdb /Y

call "C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat" x86_amd64
cl -DUNICODE -D_UNICODE /EHsc /Zi /O1 /W3 /LD /MD attach.cpp /link /DEBUG /OPT:REF /OPT:ICF /out:attach_amd64.dll
copy attach_amd64.dll ..\attach_amd64.dll /Y
copy attach_amd64.pdb ..\attach_amd64.pdb /Y

cl -DUNICODE -D_UNICODE /EHsc /Zi /O1 /LD /MD /D BITS_64 run_code_on_dllmain.cpp /link /DEBUG /OPT:REF /OPT:ICF /out:run_code_on_dllmain_amd64.dll
copy run_code_on_dllmain_amd64.dll ..\run_code_on_dllmain_amd64.dll /Y
copy run_code_on_dllmain_amd64.pdb ..\run_code_on_dllmain_amd64.pdb /Y

cl /EHsc /Zi /O1 inject_dll.cpp /link /DEBUG  /OPT:REF /OPT:ICF /out:inject_dll_amd64.exe
copy inject_dll_amd64.exe ..\inject_dll_amd64.exe /Y
copy inject_dll_amd64.pdb ..\inject_dll_amd64.pdb /Y

del *.exe
del *.lib
del *.obj
del *.pdb
del *.dll
del *.exp