r'''
Copyright: Brainwy Software Ltda.

License: EPL.
=============

Works for Windows by using an executable that'll inject a dll to a process and call a function.

Note: https://github.com/fabioz/winappdbg is used just to determine if the target process is 32 or 64 bits.

Works for Linux relying on gdb.

Limitations:
============

    Linux:
    ------

        1. It possible that ptrace is disabled: /etc/sysctl.d/10-ptrace.conf

        Note that even enabling it in /etc/sysctl.d/10-ptrace.conf (i.e.: making the
        ptrace_scope=0), it's possible that we need to run the application that'll use ptrace (or
        gdb in this case) as root (so, we must sudo the python which'll run this module).

        2. It currently doesn't work in debug builds (i.e.: python_d)


Other implementations:
- pyrasite.com:
    GPL
    Windows/linux (in Linux it also uses gdb to connect -- although specifics are different as we use a dll to execute
    code with other threads stopped). It's Windows approach is more limited because it doesn't seem to deal properly with
    Python 3 if threading is disabled.

- https://github.com/google/pyringe:
    Apache v2.
    Only linux/Python 2.

- http://pytools.codeplex.com:
    Apache V2
    Windows Only (but supports mixed mode debugging)
    Our own code relies heavily on a part of it: http://pytools.codeplex.com/SourceControl/latest#Python/Product/PyDebugAttach/PyDebugAttach.cpp
    to overcome some limitations of attaching and running code in the target python executable on Python 3.
    See: attach.cpp

Linux: References if we wanted to use a pure-python debugger:
    https://bitbucket.org/haypo/python-ptrace/
    http://stackoverflow.com/questions/7841573/how-to-get-an-error-message-for-errno-value-in-python
    Jugaad:
        https://www.defcon.org/images/defcon-19/dc-19-presentations/Jakhar/DEFCON-19-Jakhar-Jugaad-Linux-Thread-Injection.pdf
        https://github.com/aseemjakhar/jugaad

Something else (general and not Python related):
- http://www.codeproject.com/Articles/4610/Three-Ways-to-Inject-Your-Code-into-Another-Proces

Other references:
- https://github.com/haypo/faulthandler
- http://nedbatchelder.com/text/trace-function.html
- https://github.com/python-git/python/blob/master/Python/sysmodule.c (sys_settrace)
- https://github.com/python-git/python/blob/master/Python/ceval.c (PyEval_SetTrace)
- https://github.com/python-git/python/blob/master/Python/thread.c (PyThread_get_key_value)


To build the dlls needed on windows, visual studio express 13 was used (see compile_dll.bat)

See: attach_pydevd.py to attach the pydev debugger to a running python process.
'''

# Note: to work with nasm compiling asm to code and decompiling to see asm with shellcode:
# x:\nasm\nasm-2.07-win32\nasm-2.07\nasm.exe
# nasm.asm&x:\nasm\nasm-2.07-win32\nasm-2.07\ndisasm.exe -b arch nasm
import ctypes
import os
import struct
import subprocess
import sys
import time
from contextlib import contextmanager

try:
    TimeoutError = TimeoutError  # @ReservedAssignment
except NameError:

    class TimeoutError(RuntimeError):  # @ReservedAssignment
        pass


@contextmanager
def _create_win_event(name):
    from winappdbg.win32.kernel32 import CreateEventA, WaitForSingleObject, CloseHandle

    manual_reset = False  # i.e.: after someone waits it, automatically set to False.
    initial_state = False
    if not isinstance(name, bytes):
        name = name.encode('utf-8')
    event = CreateEventA(None, manual_reset, initial_state, name)
    if not event:
        raise ctypes.WinError()

    class _WinEvent(object):

        def wait_for_event_set(self, timeout=None):
            '''
            :param timeout: in seconds
            '''
            if timeout is None:
                timeout = 0xFFFFFFFF
            else:
                timeout = int(timeout * 1000)
            ret = WaitForSingleObject(event, timeout)
            if ret in (0, 0x80):
                return True
            elif ret == 0x102:
                # Timed out
                return False
            else:
                raise ctypes.WinError()

    try:
        yield _WinEvent()
    finally:
        CloseHandle(event)


def is_python_64bit():
    return (struct.calcsize('P') == 8)


def is_mac():
    import platform
    return platform.system() == 'Darwin'


def run_python_code_windows(pid, python_code, connect_debugger_tracing=False, show_debug_info=0):
    assert '\'' not in python_code, 'Having a single quote messes with our command.'
    from winappdbg.process import Process
    if not isinstance(python_code, bytes):
        python_code = python_code.encode('utf-8')

    process = Process(pid)
    bits = process.get_bits()
    is_64 = bits == 64

    # Note: this restriction no longer applies (we create a process with the proper bitness from
    # this process so that the attach works).
    # if is_64 != is_python_64bit():
    #     raise RuntimeError("The architecture of the Python used to connect doesn't match the architecture of the target.\n"
    #     "Target 64 bits: %s\n"
    #     "Current Python 64 bits: %s" % (is_64, is_python_64bit()))

    with _acquire_mutex('_pydevd_pid_attach_mutex_%s' % (pid,), 10):
        print('--- Connecting to %s bits target (current process is: %s) ---' % (bits, 64 if is_python_64bit() else 32))

        with _win_write_to_shared_named_memory(python_code, pid):

            filedir = os.path.dirname(__file__)
            if is_64:
                suffix = 'amd64'
            else:
                suffix = 'x86'

            target_executable = os.path.join(filedir, 'inject_dll_%s.exe' % suffix)
            if not os.path.exists(target_executable):
                raise RuntimeError('Could not find exe file to inject: %s' % target_executable)

            name = 'attach_%s.dll' % suffix
            target_dll = os.path.join(filedir, name)
            if not os.path.exists(target_dll):
                raise RuntimeError('Could not find dll file to inject: %s' % target_dll)

            print('\n--- Injecting attach dll: %s into pid: %s ---' % (name, pid))
            args = [target_executable, str(pid), target_dll]
            subprocess.check_call(args)

            # Now, if the first injection worked, go on to the second which will actually
            # run the code.
            name = 'run_code_on_dllmain_%s.dll' % suffix
            target_dll = os.path.join(filedir, name)
            if not os.path.exists(target_dll):
                raise RuntimeError('Could not find dll file to inject: %s' % target_dll)

            with _create_win_event('_pydevd_pid_event_%s' % (pid,)) as event:
                print('\n--- Injecting run code dll: %s into pid: %s ---' % (name, pid))
                args = [target_executable, str(pid), target_dll]
                subprocess.check_call(args)

                if not event.wait_for_event_set(10):
                    print('Timeout error: the attach may not have completed.')
            print('--- Finished dll injection ---\n')

    return 0


@contextmanager
def _acquire_mutex(mutex_name, timeout):
    '''
    Only one process may be attaching to a pid, so, create a system mutex
    to make sure this holds in practice.
    '''
    from winappdbg.win32.kernel32 import CreateMutex, GetLastError, CloseHandle
    from winappdbg.win32.defines import ERROR_ALREADY_EXISTS

    initial_time = time.time()
    while True:
        mutex = CreateMutex(None, True, mutex_name)
        acquired = GetLastError() != ERROR_ALREADY_EXISTS
        if acquired:
            break
        if time.time() - initial_time > timeout:
            raise TimeoutError('Unable to acquire mutex to make attach before timeout.')
        time.sleep(.2)

    try:
        yield
    finally:
        CloseHandle(mutex)


@contextmanager
def _win_write_to_shared_named_memory(python_code, pid):
    # Use the definitions from winappdbg when possible.
    from winappdbg.win32 import defines
    from winappdbg.win32.kernel32 import (
        CreateFileMapping,
        MapViewOfFile,
        CloseHandle,
        UnmapViewOfFile,
    )

    memmove = ctypes.cdll.msvcrt.memmove
    memmove.argtypes = [
        ctypes.c_void_p,
        ctypes.c_void_p,
        defines.SIZE_T,
    ]
    memmove.restype = ctypes.c_void_p

    # Note: BUFSIZE must be the same from run_code_in_memory.hpp
    BUFSIZE = 2048
    assert isinstance(python_code, bytes)
    assert len(python_code) > 0, 'Python code must not be empty.'
    # Note: -1 so that we're sure we'll add a \0 to the end.
    assert len(python_code) < BUFSIZE - 1, 'Python code must have at most %s bytes (found: %s)' % (BUFSIZE - 1, len(python_code))

    python_code += b'\0' * (BUFSIZE - len(python_code))
    assert python_code.endswith(b'\0')

    INVALID_HANDLE_VALUE = -1
    PAGE_READWRITE = 0x4
    FILE_MAP_WRITE = 0x2
    filemap = CreateFileMapping(
        INVALID_HANDLE_VALUE, 0, PAGE_READWRITE, 0, BUFSIZE, u"__pydevd_pid_code_to_run__%s" % (pid,))

    if filemap == INVALID_HANDLE_VALUE or filemap is None:
        raise Exception("Failed to create named file mapping (ctypes: CreateFileMapping): %s" % (filemap,))
    try:
        view = MapViewOfFile(filemap, FILE_MAP_WRITE, 0, 0, 0)
        if not view:
            raise Exception("Failed to create view of named file mapping (ctypes: MapViewOfFile).")

        try:
            memmove(view, python_code, BUFSIZE)
            yield
        finally:
            UnmapViewOfFile(view)
    finally:
        CloseHandle(filemap)


def run_python_code_linux(pid, python_code, connect_debugger_tracing=False, show_debug_info=0):
    assert '\'' not in python_code, 'Having a single quote messes with our command.'
    filedir = os.path.dirname(__file__)

    # Valid arguments for arch are i386, i386:x86-64, i386:x64-32, i8086,
    #   i386:intel, i386:x86-64:intel, i386:x64-32:intel, i386:nacl,
    #   i386:x86-64:nacl, i386:x64-32:nacl, auto.

    if is_python_64bit():
        suffix = 'amd64'
        arch = 'i386:x86-64'
    else:
        suffix = 'x86'
        arch = 'i386'

    print('Attaching with arch: %s' % (arch,))

    target_dll = os.path.join(filedir, 'attach_linux_%s.so' % suffix)
    target_dll = os.path.abspath(os.path.normpath(target_dll))
    if not os.path.exists(target_dll):
        raise RuntimeError('Could not find dll file to inject: %s' % target_dll)

    # Note: we currently don't support debug builds
    is_debug = 0
    # Note that the space in the beginning of each line in the multi-line is important!
    cmd = [
        'gdb',
        '--nw',  # no gui interface
        '--nh',  # no ~/.gdbinit
        '--nx',  # no .gdbinit
#         '--quiet',  # no version number on startup
        '--pid',
        str(pid),
        '--batch',
#         '--batch-silent',
    ]

    cmd.extend(["--eval-command='set scheduler-locking off'"])  # If on we'll deadlock.

    cmd.extend(["--eval-command='set architecture %s'" % arch])

    cmd.extend([
        "--eval-command='call (void*)dlopen(\"%s\", 2)'" % target_dll,
        "--eval-command='call (int)DoAttach(%s, \"%s\", %s)'" % (
            is_debug, python_code, show_debug_info)
    ])

    # print ' '.join(cmd)

    env = os.environ.copy()
    # Remove the PYTHONPATH (if gdb has a builtin Python it could fail if we
    # have the PYTHONPATH for a different python version or some forced encoding).
    env.pop('PYTHONIOENCODING', None)
    env.pop('PYTHONPATH', None)
    print('Running: %s' % (' '.join(cmd)))
    p = subprocess.Popen(
        ' '.join(cmd),
        shell=True,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    print('Running gdb in target process.')
    out, err = p.communicate()
    print('stdout: %s' % (out,))
    print('stderr: %s' % (err,))
    return out, err


def find_helper_script(filedir, script_name):
    target_filename = os.path.join(filedir, 'linux_and_mac', script_name)
    target_filename = os.path.normpath(target_filename)
    if not os.path.exists(target_filename):
        raise RuntimeError('Could not find helper script: %s' % target_filename)

    return target_filename


def run_python_code_mac(pid, python_code, connect_debugger_tracing=False, show_debug_info=0):
    assert '\'' not in python_code, 'Having a single quote messes with our command.'
    filedir = os.path.dirname(__file__)

    # Valid arguments for arch are i386, i386:x86-64, i386:x64-32, i8086,
    #   i386:intel, i386:x86-64:intel, i386:x64-32:intel, i386:nacl,
    #   i386:x86-64:nacl, i386:x64-32:nacl, auto.

    if is_python_64bit():
        suffix = 'x86_64.dylib'
        arch = 'i386:x86-64'
    else:
        suffix = 'x86.dylib'
        arch = 'i386'

    print('Attaching with arch: %s' % (arch,))

    target_dll = os.path.join(filedir, 'attach_%s' % suffix)
    target_dll = os.path.normpath(target_dll)
    if not os.path.exists(target_dll):
        raise RuntimeError('Could not find dll file to inject: %s' % target_dll)

    lldb_prepare_file = find_helper_script(filedir, 'lldb_prepare.py')
    # Note: we currently don't support debug builds

    is_debug = 0
    # Note that the space in the beginning of each line in the multi-line is important!
    cmd = [
        'lldb',
        '--no-lldbinit',  # Do not automatically parse any '.lldbinit' files.
        # '--attach-pid',
        # str(pid),
        # '--arch',
        # arch,
        '--script-language',
        'Python'
        #         '--batch-silent',
    ]

    cmd.extend([
        "-o 'process attach --pid %d'" % pid,
        "-o 'command script import \"%s\"'" % (lldb_prepare_file,),
        "-o 'load_lib_and_attach \"%s\" %s \"%s\" %s'" % (target_dll,
            is_debug, python_code, show_debug_info),
    ])

    cmd.extend([
        "-o 'process detach'",
        "-o 'script import os; os._exit(1)'",
    ])

    # print ' '.join(cmd)

    env = os.environ.copy()
    # Remove the PYTHONPATH (if gdb has a builtin Python it could fail if we
    # have the PYTHONPATH for a different python version or some forced encoding).
    env.pop('PYTHONIOENCODING', None)
    env.pop('PYTHONPATH', None)
    print('Running: %s' % (' '.join(cmd)))
    p = subprocess.Popen(
        ' '.join(cmd),
        shell=True,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        )
    print('Running lldb in target process.')
    out, err = p.communicate()
    print('stdout: %s' % (out,))
    print('stderr: %s' % (err,))
    return out, err


if sys.platform == 'win32':
    run_python_code = run_python_code_windows
elif is_mac():
    run_python_code = run_python_code_mac
else:
    run_python_code = run_python_code_linux


def test():
    print('Running with: %s' % (sys.executable,))
    code = '''
import os, time, sys
print(os.getpid())
#from threading import Thread
#Thread(target=str).start()
if __name__ == '__main__':
    while True:
        time.sleep(.5)
        sys.stdout.write('.\\n')
        sys.stdout.flush()
'''

    p = subprocess.Popen([sys.executable, '-u', '-c', code])
    try:
        code = 'print("It worked!")\n'

        # Real code will be something as:
        # code = '''import sys;sys.path.append(r'X:\winappdbg-code\examples'); import imported;'''
        run_python_code(p.pid, python_code=code)
        print('\nRun a 2nd time...\n')
        run_python_code(p.pid, python_code=code)

        time.sleep(3)
    finally:
        p.kill()


def main(args):
    # Otherwise, assume the first parameter is the pid and anything else is code to be executed
    # in the target process.
    pid = int(args[0])
    del args[0]
    python_code = ';'.join(args)

    # Note: on Linux the python code may not have a single quote char: '
    run_python_code(pid, python_code)


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        print('Expected pid and Python code to execute in target process.')
    else:
        if '--test' == args[0]:
            test()
        else:
            main(args)

