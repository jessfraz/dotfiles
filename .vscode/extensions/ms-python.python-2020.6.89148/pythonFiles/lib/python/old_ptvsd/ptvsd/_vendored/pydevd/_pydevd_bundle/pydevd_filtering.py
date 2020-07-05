import fnmatch
import glob
import os.path
import sys

from _pydev_bundle import pydev_log
import pydevd_file_utils
import json
from collections import namedtuple
from _pydev_imps._pydev_saved_modules import threading

try:
    xrange  # noqa
except NameError:
    xrange = range  # noqa

ExcludeFilter = namedtuple('ExcludeFilter', 'name, exclude, is_path')


def _convert_to_str_and_clear_empty(roots):
    if sys.version_info[0] <= 2:
        # In py2 we need bytes for the files.
        roots = [
            root if not isinstance(root, unicode) else root.encode(sys.getfilesystemencoding())
            for root in roots
        ]

    new_roots = []
    for root in roots:
        assert isinstance(root, str), '%s not str (found: %s)' % (root, type(root))
        if root:
            new_roots.append(root)
    return new_roots


def _check_matches(patterns, paths):
    if not patterns and not paths:
        # Matched to the end.
        return True

    if (not patterns and paths) or (patterns and not paths):
        return False

    pattern = patterns[0]
    path = paths[0]

    if not glob.has_magic(pattern):

        if pattern != path:
            return False

    elif pattern == '**':
        if len(patterns) == 1:
            return True  # if ** is the last one it matches anything to the right.

        for i in xrange(len(paths)):
            # Recursively check the remaining patterns as the
            # current pattern could match any number of paths.
            if _check_matches(patterns[1:], paths[i:]):
                return True

    elif not fnmatch.fnmatch(path, pattern):
        # Current part doesn't match.
        return False

    return _check_matches(patterns[1:], paths[1:])


def glob_matches_path(path, pattern, sep=os.sep, altsep=os.altsep):
    if altsep:
        pattern = pattern.replace(altsep, sep)
        path = path.replace(altsep, sep)

    drive = ''
    if len(path) > 1 and path[1] == ':':
        drive, path = path[0], path[2:]

    if drive and len(pattern) > 1:
        if pattern[1] == ':':
            if drive.lower() != pattern[0].lower():
                return False
            pattern = pattern[2:]

    patterns = pattern.split(sep)
    paths = path.split(sep)
    if paths:
        if paths[0] == '':
            paths = paths[1:]
    if patterns:
        if patterns[0] == '':
            patterns = patterns[1:]

    return _check_matches(patterns, paths)


class FilesFiltering(object):
    '''
    Note: calls at FilesFiltering are uncached.

    The actual API used should be through PyDB.
    '''

    def __init__(self):
        self._exclude_filters = []
        self._project_roots = []
        self._library_roots = []

        # Filter out libraries?
        self._use_libraries_filter = False
        self.require_module = False  # True if some exclude filter filters by the module.

        self.set_use_libraries_filter(os.getenv('PYDEVD_FILTER_LIBRARIES') is not None)

        project_roots = os.getenv('IDE_PROJECT_ROOTS', None)
        if project_roots is not None:
            project_roots = project_roots.split(os.pathsep)
        else:
            project_roots = []
        self.set_project_roots(project_roots)

        library_roots = os.getenv('LIBRARY_ROOTS', None)
        if library_roots is not None:
            library_roots = library_roots.split(os.pathsep)
        else:
            library_roots = self._get_default_library_roots()
        self.set_library_roots(library_roots)

        # Stepping filters.
        pydevd_filters = os.getenv('PYDEVD_FILTERS', '')
        if pydevd_filters:
            pydev_log.debug("PYDEVD_FILTERS %s", (pydevd_filters,))
            if pydevd_filters.startswith('{'):
                # dict(glob_pattern (str) -> exclude(True or False))
                exclude_filters = []
                for key, val in json.loads(pydevd_filters).items():
                    exclude_filters.append(ExcludeFilter(key, val, True))
                self._exclude_filters = exclude_filters
            else:
                # A ';' separated list of strings with globs for the
                # list of excludes.
                filters = pydevd_filters.split(';')
                new_filters = []
                for new_filter in filters:
                    if new_filter.strip():
                        new_filters.append(ExcludeFilter(new_filter.strip(), True, True))
                self._exclude_filters = new_filters

    @classmethod
    def _get_default_library_roots(cls):
        # Provide sensible defaults if not in env vars.
        import site

        roots = []

        try:
            import sysconfig  # Python 2.7 onwards only.
        except ImportError:
            pass
        else:
            for path_name in set(('stdlib', 'platstdlib', 'purelib', 'platlib')) & set(sysconfig.get_path_names()):
                roots.append(sysconfig.get_path(path_name))

        # Make sure we always get at least the standard library location (based on the `os` and
        # `threading` modules -- it's a bit weird that it may be different on the ci, but it happens).
        roots.append(os.path.dirname(os.__file__))
        roots.append(os.path.dirname(threading.__file__))

        if hasattr(site, 'getusersitepackages'):
            site_paths = site.getusersitepackages()
            if isinstance(site_paths, (list, tuple)):
                for site_path in site_paths:
                    roots.append(site_path)
            else:
                roots.append(site_paths)

        if hasattr(site, 'getsitepackages'):
            site_paths = site.getsitepackages()
            if isinstance(site_paths, (list, tuple)):
                for site_path in site_paths:
                    roots.append(site_path)
            else:
                roots.append(site_paths)

        for path in sys.path:
            if os.path.exists(path) and os.path.basename(path) == 'site-packages':
                roots.append(path)

        roots.extend([os.path.realpath(path) for path in roots])

        return sorted(set(roots))

    def _normpath(self, filename):
        return pydevd_file_utils.get_abs_path_real_path_and_base_from_file(filename)[0]

    def _fix_roots(self, roots):
        roots = _convert_to_str_and_clear_empty(roots)
        new_roots = []
        for root in roots:
            new_roots.append(self._normpath(root))
        return new_roots

    def set_project_roots(self, project_roots):
        self._project_roots = self._fix_roots(project_roots)
        pydev_log.debug("IDE_PROJECT_ROOTS %s\n" % project_roots)

    def _get_project_roots(self):
        return self._project_roots

    def set_library_roots(self, roots):
        self._library_roots = self._fix_roots(roots)
        pydev_log.debug("LIBRARY_ROOTS %s\n" % roots)

    def _get_library_roots(self):
        return self._library_roots

    def in_project_roots(self, filename):
        '''
        Note: don't call directly. Use PyDb.in_project_scope (no caching here).
        '''
        if filename.startswith('<'):  # Note: always use only startswith (pypy can have: "<builtin>some other name").
            # This is a dummy filename that is usually used for eval or exec. Assume
            # that it is user code, with one exception: <frozen ...> is used in the
            # standard library.
            in_project = not filename.startswith('<frozen ')
            return in_project

        project_roots = self._get_project_roots()

        filename = self._normpath(filename)

        found_in_project = []
        for root in project_roots:
            if root and filename.startswith(root):
                found_in_project.append(root)

        found_in_library = []
        library_roots = self._get_library_roots()
        for root in library_roots:
            if root and filename.startswith(root):
                found_in_library.append(root)

        if not project_roots:
            # If we have no project roots configured, consider it being in the project
            # roots if it's not found in site-packages (because we have defaults for those
            # and not the other way around).
            in_project = not found_in_library
        else:
            in_project = False
            if found_in_project:
                if not found_in_library:
                    in_project = True
                else:
                    # Found in both, let's see which one has the bigger path matched.
                    if max(len(x) for x in found_in_project) > max(len(x) for x in found_in_library):
                        in_project = True

        return in_project

    def use_libraries_filter(self):
        '''
        Should we debug only what's inside project folders?
        '''
        return self._use_libraries_filter

    def set_use_libraries_filter(self, use):
        pydev_log.debug("pydevd: Use libraries filter: %s\n" % use)
        self._use_libraries_filter = use

    def use_exclude_filters(self):
        # Enabled if we have any filters registered.
        return len(self._exclude_filters) > 0

    def exclude_by_filter(self, filename, module_name):
        '''
        :return: True if it should be excluded, False if it should be included and None
            if no rule matched the given file.
        '''
        for exclude_filter in self._exclude_filters:  # : :type exclude_filter: ExcludeFilter
            if exclude_filter.is_path:
                if glob_matches_path(filename, exclude_filter.name):
                    return exclude_filter.exclude
            else:
                # Module filter.
                if exclude_filter.name == module_name or module_name.startswith(exclude_filter.name + '.'):
                    return exclude_filter.exclude
        return None

    def set_exclude_filters(self, exclude_filters):
        '''
        :param list(ExcludeFilter) exclude_filters:
        '''
        self._exclude_filters = exclude_filters
        self.require_module = False
        for exclude_filter in exclude_filters:
            if not exclude_filter.is_path:
                self.require_module = True
                break
