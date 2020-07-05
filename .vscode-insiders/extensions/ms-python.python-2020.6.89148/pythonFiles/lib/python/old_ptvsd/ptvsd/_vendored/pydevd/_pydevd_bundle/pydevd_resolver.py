from _pydev_bundle import pydev_log
try:
    import StringIO
except:
    import io as StringIO
import traceback
from os.path import basename

from functools import partial
from _pydevd_bundle.pydevd_constants import dict_iter_items, dict_keys, xrange
from _pydevd_bundle.pydevd_safe_repr import SafeRepr

# Note: 300 is already a lot to see in the outline (after that the user should really use the shell to get things)
# and this also means we'll pass less information to the client side (which makes debugging faster).
MAX_ITEMS_TO_HANDLE = 300

TOO_LARGE_MSG = 'Too large to show contents. Max items to show: ' + str(MAX_ITEMS_TO_HANDLE)
TOO_LARGE_ATTR = 'Unable to handle:'


#=======================================================================================================================
# UnableToResolveVariableException
#=======================================================================================================================
class UnableToResolveVariableException(Exception):
    pass


#=======================================================================================================================
# InspectStub
#=======================================================================================================================
class InspectStub:

    def isbuiltin(self, _args):
        return False

    def isroutine(self, object):
        return False


try:
    import inspect
except:
    inspect = InspectStub()

try:
    from collections import OrderedDict
except:
    OrderedDict = dict

try:
    import java.lang  # @UnresolvedImport
except:
    pass

# types does not include a MethodWrapperType
try:
    MethodWrapperType = type([].__str__)
except:
    MethodWrapperType = None

#=======================================================================================================================
# See: pydevd_extension_api module for resolver interface
#=======================================================================================================================


def sorted_attributes_key(attr_name):
    if attr_name.startswith('__'):
        if attr_name.endswith('__'):
            # __ double under before and after __
            return (3, attr_name)
        else:
            # __ double under before
            return (2, attr_name)
    elif attr_name.startswith('_'):
        # _ single under
        return (1, attr_name)
    else:
        # Regular (Before anything)
        return (0, attr_name)


#=======================================================================================================================
# DefaultResolver
#=======================================================================================================================
class DefaultResolver:
    '''
        DefaultResolver is the class that'll actually resolve how to show some variable.
    '''

    def resolve(self, var, attribute):
        return getattr(var, attribute)

    def get_contents_debug_adapter_protocol(self, obj, fmt=None):
        if MethodWrapperType:
            dct, used___dict__ = self._get_py_dictionary(obj)
        else:
            dct = self._get_jy_dictionary(obj)[0]

        lst = sorted(dict_iter_items(dct), key=lambda tup: sorted_attributes_key(tup[0]))
        if used___dict__:
            return [(attr_name, attr_value, '.__dict__[%s]' % attr_name) for (attr_name, attr_value) in lst]
        else:
            return [(attr_name, attr_value, '.%s' % attr_name) for (attr_name, attr_value) in lst]

    def get_dictionary(self, var, names=None, used___dict__=False):
        if MethodWrapperType:
            return self._get_py_dictionary(var, names, used___dict__=used___dict__)[0]
        else:
            return self._get_jy_dictionary(var)[0]

    def _get_jy_dictionary(self, obj):
        ret = {}
        found = java.util.HashMap()

        original = obj
        if hasattr(obj, '__class__') and obj.__class__ == java.lang.Class:

            # get info about superclasses
            classes = []
            classes.append(obj)
            c = obj.getSuperclass()
            while c != None:
                classes.append(c)
                c = c.getSuperclass()

            # get info about interfaces
            interfs = []
            for obj in classes:
                interfs.extend(obj.getInterfaces())
            classes.extend(interfs)

            # now is the time when we actually get info on the declared methods and fields
            for obj in classes:

                declaredMethods = obj.getDeclaredMethods()
                declaredFields = obj.getDeclaredFields()
                for i in xrange(len(declaredMethods)):
                    name = declaredMethods[i].getName()
                    ret[name] = declaredMethods[i].toString()
                    found.put(name, 1)

                for i in xrange(len(declaredFields)):
                    name = declaredFields[i].getName()
                    found.put(name, 1)
                    # if declaredFields[i].isAccessible():
                    declaredFields[i].setAccessible(True)
                    # ret[name] = declaredFields[i].get( declaredFields[i] )
                    try:
                        ret[name] = declaredFields[i].get(original)
                    except:
                        ret[name] = declaredFields[i].toString()

        # this simple dir does not always get all the info, that's why we have the part before
        # (e.g.: if we do a dir on String, some methods that are from other interfaces such as
        # charAt don't appear)
        try:
            d = dir(original)
            for name in d:
                if found.get(name) != 1:
                    ret[name] = getattr(original, name)
        except:
            # sometimes we're unable to do a dir
            pass

        return ret

    def get_names(self, var):
        used___dict__ = False
        try:
            names = dir(var)
        except TypeError:
            names = []
        if not names:
            if hasattr(var, '__dict__'):
                names = dict_keys(var.__dict__)
                used___dict__ = True
        return names, used___dict__

    def _get_py_dictionary(self, var, names=None, used___dict__=False):
        '''
        :return tuple(names, used___dict__), where used___dict__ means we have to access
        using obj.__dict__[name] instead of getattr(obj, name)
        '''

        # TODO: Those should be options (would fix https://github.com/Microsoft/ptvsd/issues/66).
        filter_private = False
        filter_special = True
        filter_function = True
        filter_builtin = True

        if not names:
            names, used___dict__ = self.get_names(var)
        d = {}

        # Be aware that the order in which the filters are applied attempts to
        # optimize the operation by removing as many items as possible in the
        # first filters, leaving fewer items for later filters

        if filter_builtin or filter_function:
            for name in names:
                try:
                    name_as_str = name
                    if name_as_str.__class__ != str:
                        name_as_str = '%r' % (name_as_str,)

                    if filter_special:
                        if name_as_str.startswith('__') and name_as_str.endswith('__'):
                            continue

                    if filter_private:
                        if name_as_str.startswith('_') or name_as_str.endswith('__'):
                            continue
                    if not used___dict__:
                        attr = getattr(var, name)
                    else:
                        attr = var.__dict__[name]

                    # filter builtins?
                    if filter_builtin:
                        if inspect.isbuiltin(attr):
                            continue

                    # filter functions?
                    if filter_function:
                        if inspect.isroutine(attr) or isinstance(attr, MethodWrapperType):
                            continue
                except:
                    # if some error occurs getting it, let's put it to the user.
                    strIO = StringIO.StringIO()
                    traceback.print_exc(file=strIO)
                    attr = strIO.getvalue()

                d[name_as_str] = attr

        return d, used___dict__


#=======================================================================================================================
# DictResolver
#=======================================================================================================================
class DictResolver:

    def resolve(self, dict, key):
        if key in ('__len__', TOO_LARGE_ATTR):
            return None

        if '(' not in key:
            # we have to treat that because the dict resolver is also used to directly resolve the global and local
            # scopes (which already have the items directly)
            try:
                return dict[key]
            except:
                return getattr(dict, key)

        # ok, we have to iterate over the items to find the one that matches the id, because that's the only way
        # to actually find the reference from the string we have before.
        expected_id = int(key.split('(')[-1][:-1])
        for key, val in dict_iter_items(dict):
            if id(key) == expected_id:
                return val

        raise UnableToResolveVariableException()

    def key_to_str(self, key, fmt=None):
        if fmt is not None:
            if fmt.get('hex', False):
                safe_repr = SafeRepr()
                safe_repr.convert_to_hex = True
                return safe_repr(key)
        return '%r' % (key,)

    def init_dict(self):
        return {}

    def get_contents_debug_adapter_protocol(self, dct, fmt=None):
        '''
        This method is to be used in the case where the variables are all saved by its id (and as
        such don't need to have the `resolve` method called later on, so, keys don't need to
        embed the reference in the key).

        Note that the return should be ordered.

        :return list(tuple(name:str, value:object, evaluateName:str))
        '''
        ret = []

        i = 0
        for key, val in dict_iter_items(dct):
            i += 1
            key_as_str = self.key_to_str(key, fmt)
            eval_key_str = self.key_to_str(key)  # do not format the key
            ret.append((key_as_str, val, '[%s]' % (eval_key_str,)))
            if i > MAX_ITEMS_TO_HANDLE:
                ret.append((TOO_LARGE_ATTR, TOO_LARGE_MSG, None))
                break

        ret.append(('__len__', len(dct), partial(_apply_evaluate_name, evaluate_name='len(%s)')))
        # in case the class extends built-in type and has some additional fields
        from_default_resolver = defaultResolver.get_contents_debug_adapter_protocol(dct, fmt)

        if from_default_resolver:
            ret = from_default_resolver + ret

        return sorted(ret, key=lambda tup: sorted_attributes_key(tup[0]))

    def get_dictionary(self, dict):
        ret = self.init_dict()

        i = 0
        for key, val in dict_iter_items(dict):
            i += 1
            # we need to add the id because otherwise we cannot find the real object to get its contents later on.
            key = '%s (%s)' % (self.key_to_str(key), id(key))
            ret[key] = val
            if i > MAX_ITEMS_TO_HANDLE:
                ret[TOO_LARGE_ATTR] = TOO_LARGE_MSG
                break

        ret['__len__'] = len(dict)
        # in case if the class extends built-in type and has some additional fields
        additional_fields = defaultResolver.get_dictionary(dict)
        ret.update(additional_fields)
        return ret


def _apply_evaluate_name(parent_name, evaluate_name):
    return evaluate_name % (parent_name,)


#=======================================================================================================================
# TupleResolver
#=======================================================================================================================
class TupleResolver:  # to enumerate tuples and lists

    def resolve(self, var, attribute):
        '''
            @param var: that's the original attribute
            @param attribute: that's the key passed in the dict (as a string)
        '''
        if attribute in ('__len__', TOO_LARGE_ATTR):
            return None
        try:
            return var[int(attribute)]
        except:
            return getattr(var, attribute)

    def get_contents_debug_adapter_protocol(self, lst, fmt=None):
        '''
        This method is to be used in the case where the variables are all saved by its id (and as
        such don't need to have the `resolve` method called later on, so, keys don't need to
        embed the reference in the key).

        Note that the return should be ordered.

        :return list(tuple(name:str, value:object, evaluateName:str))
        '''
        l = len(lst)
        ret = []

        format_str = '%0' + str(int(len(str(l - 1)))) + 'd'
        if fmt is not None and fmt.get('hex', False):
            format_str = '0x%0' + str(int(len(hex(l).lstrip('0x')))) + 'x'

        for i, item in enumerate(lst):
            ret.append((format_str % i, item, '[%s]' % i))

            if i > MAX_ITEMS_TO_HANDLE:
                ret.append((TOO_LARGE_ATTR, TOO_LARGE_MSG, None))
                break

        ret.append(('__len__', len(lst), partial(_apply_evaluate_name, evaluate_name='len(%s)')))
        # Needed in case the class extends the built-in type and has some additional fields.
        from_default_resolver = defaultResolver.get_contents_debug_adapter_protocol(lst, fmt=fmt)
        if from_default_resolver:
            ret = from_default_resolver + ret
        return ret

    def get_dictionary(self, var, fmt={}):
        l = len(var)
        d = {}

        format_str = '%0' + str(int(len(str(l - 1)))) + 'd'
        if fmt is not None and fmt.get('hex', False):
            format_str = '0x%0' + str(int(len(hex(l).lstrip('0x')))) + 'x'

        for i, item in enumerate(var):
            d[format_str % i] = item

            if i > MAX_ITEMS_TO_HANDLE:
                d[TOO_LARGE_ATTR] = TOO_LARGE_MSG
                break

        d['__len__'] = len(var)
        # in case if the class extends built-in type and has some additional fields
        additional_fields = defaultResolver.get_dictionary(var)
        d.update(additional_fields)
        return d


#=======================================================================================================================
# SetResolver
#=======================================================================================================================
class SetResolver:
    '''
        Resolves a set as dict id(object)->object
    '''

    def get_contents_debug_adapter_protocol(self, obj, fmt=None):
        ret = []

        for i, item in enumerate(obj):
            ret.append((str(id(item)), item, None))

            if i > MAX_ITEMS_TO_HANDLE:
                ret.append((TOO_LARGE_ATTR, TOO_LARGE_MSG, None))
                break

        ret.append(('__len__', len(obj), partial(_apply_evaluate_name, evaluate_name='len(%s)')))
        # Needed in case the class extends the built-in type and has some additional fields.
        from_default_resolver = defaultResolver.get_contents_debug_adapter_protocol(obj, fmt=fmt)
        if from_default_resolver:
            ret = from_default_resolver + ret
        return ret

    def resolve(self, var, attribute):
        if attribute in ('__len__', TOO_LARGE_ATTR):
            return None

        try:
            attribute = int(attribute)
        except:
            return getattr(var, attribute)

        for v in var:
            if id(v) == attribute:
                return v

        raise UnableToResolveVariableException('Unable to resolve %s in %s' % (attribute, var))

    def get_dictionary(self, var):
        d = {}
        for i, item in enumerate(var):
            d[str(id(item))] = item

            if i > MAX_ITEMS_TO_HANDLE:
                d[TOO_LARGE_ATTR] = TOO_LARGE_MSG
                break

        d['__len__'] = len(var)
        # in case if the class extends built-in type and has some additional fields
        additional_fields = defaultResolver.get_dictionary(var)
        d.update(additional_fields)
        return d

    def change_var_from_name(self, container, name, new_value):
        # The name given in this case must be the id(item), so, we can actually
        # iterate in the set and see which item matches the given id.

        try:
            # Check that the new value can actually be added to a set (i.e.: it's hashable/comparable).
            set().add(new_value)
        except:
            return None

        for item in container:
            if str(id(item)) == name:
                container.remove(item)
                container.add(new_value)
                return str(id(new_value))

        return None


#=======================================================================================================================
# InstanceResolver
#=======================================================================================================================
class InstanceResolver:

    def resolve(self, var, attribute):
        field = var.__class__.getDeclaredField(attribute)
        field.setAccessible(True)
        return field.get(var)

    def get_dictionary(self, obj):
        ret = {}

        declaredFields = obj.__class__.getDeclaredFields()
        for i in xrange(len(declaredFields)):
            name = declaredFields[i].getName()
            try:
                declaredFields[i].setAccessible(True)
                ret[name] = declaredFields[i].get(obj)
            except:
                pydev_log.exception()

        return ret


#=======================================================================================================================
# JyArrayResolver
#=======================================================================================================================
class JyArrayResolver:
    '''
        This resolves a regular Object[] array from java
    '''

    def resolve(self, var, attribute):
        if attribute == '__len__':
            return None
        return var[int(attribute)]

    def get_dictionary(self, obj):
        ret = {}

        for i in xrange(len(obj)):
            ret[ i ] = obj[i]

        ret['__len__'] = len(obj)
        return ret


#=======================================================================================================================
# MultiValueDictResolver
#=======================================================================================================================
class MultiValueDictResolver(DictResolver):

    def resolve(self, dict, key):
        if key in ('__len__', TOO_LARGE_ATTR):
            return None

        # ok, we have to iterate over the items to find the one that matches the id, because that's the only way
        # to actually find the reference from the string we have before.
        expected_id = int(key.split('(')[-1][:-1])
        for key in dict_keys(dict):
            val = dict.getlist(key)
            if id(key) == expected_id:
                return val

        raise UnableToResolveVariableException()


#=======================================================================================================================
# DjangoFormResolver
#=======================================================================================================================
class DjangoFormResolver(DefaultResolver):

    def get_dictionary(self, var, names=None):
        # Do not call self.errors because it is a property and has side effects.
        names, used___dict__ = self.get_names(var)

        has_errors_attr = False
        if "errors" in names:
            has_errors_attr = True
            names.remove("errors")

        d = defaultResolver.get_dictionary(var, names=names, used___dict__=used___dict__)
        if has_errors_attr:
            try:
                errors_attr = getattr(var, "_errors")
            except:
                errors_attr = None
            d["errors"] = errors_attr
        return d


#=======================================================================================================================
# DequeResolver
#=======================================================================================================================
class DequeResolver(TupleResolver):

    def get_dictionary(self, var):
        d = TupleResolver.get_dictionary(self, var)
        d['maxlen'] = getattr(var, 'maxlen', None)
        return d


#=======================================================================================================================
# OrderedDictResolver
#=======================================================================================================================
class OrderedDictResolver(DictResolver):

    def init_dict(self):
        return OrderedDict()


#=======================================================================================================================
# FrameResolver
#=======================================================================================================================
class FrameResolver:
    '''
    This resolves a frame.
    '''

    def resolve(self, obj, attribute):
        if attribute == '__internals__':
            return defaultResolver.get_dictionary(obj)

        if attribute == 'stack':
            return self.get_frame_stack(obj)

        if attribute == 'f_locals':
            return obj.f_locals

        return None

    def get_dictionary(self, obj):
        ret = {}
        ret['__internals__'] = defaultResolver.get_dictionary(obj)
        ret['stack'] = self.get_frame_stack(obj)
        ret['f_locals'] = obj.f_locals
        return ret

    def get_frame_stack(self, frame):
        ret = []
        if frame is not None:
            ret.append(self.get_frame_name(frame))

            while frame.f_back:
                frame = frame.f_back
                ret.append(self.get_frame_name(frame))

        return ret

    def get_frame_name(self, frame):
        if frame is None:
            return 'None'
        try:
            name = basename(frame.f_code.co_filename)
            return 'frame: %s [%s:%s]  id:%s' % (frame.f_code.co_name, name, frame.f_lineno, id(frame))
        except:
            return 'frame object'


defaultResolver = DefaultResolver()
dictResolver = DictResolver()
tupleResolver = TupleResolver()
instanceResolver = InstanceResolver()
jyArrayResolver = JyArrayResolver()
setResolver = SetResolver()
multiValueDictResolver = MultiValueDictResolver()
djangoFormResolver = DjangoFormResolver()
dequeResolver = DequeResolver()
orderedDictResolver = OrderedDictResolver()
frameResolver = FrameResolver()
