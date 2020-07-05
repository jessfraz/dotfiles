

def attach(port, host, client, log_dir):
    try:
        import sys
        if 'threading' not in sys.modules:
            try:

                def on_warn(msg):
                    import ptvsd.log
                    ptvsd.log.warn(msg)

                def on_exception(msg):
                    import ptvsd.log
                    ptvsd.log.exception(msg)

                def on_critical(msg):
                    import ptvsd.log
                    ptvsd.log.error(msg)

                import os
                sys.path.append(
                    os.path.join(
                        os.path.dirname(__file__),
                        '_vendored',
                        'pydevd',
                        'pydevd_attach_to_process'))

                # Note that it's not a part of the pydevd PYTHONPATH
                import attach_script
                attach_script.fix_main_thread_id(
                    on_warn=on_warn, on_exception=on_exception, on_critical=on_critical)
            except:
                import ptvsd.log
                ptvsd.log.exception()

        if not log_dir:
            log_dir = None

        import ptvsd.options
        ptvsd.options.log_dir = log_dir
        ptvsd.options.client = client
        ptvsd.options.host = host
        ptvsd.options.port = port

        import ptvsd.log
        ptvsd.log.to_file()
        ptvsd.log.info("Debugger successfully injected")

        if ptvsd.options.client:
            from ptvsd._remote import attach
            attach((host, port))
        else:
            ptvsd.enable_attach((host, port))

    except:
        import traceback
        traceback.print_exc()
