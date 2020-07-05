const hasOwnProperty = require('has-own-prop')
const {isObject, isArray} = require('core-util-is')

const PREFIX_BEFORE = 'before'
const PREFIX_AFTER_PROP = 'after-prop'
const PREFIX_AFTER_COLON = 'after-colon'
const PREFIX_AFTER_VALUE = 'after-value'
const PREFIX_AFTER_COMMA = 'after-comma'

const SYMBOL_PREFIXES = [
  PREFIX_BEFORE,
  PREFIX_AFTER_PROP,
  PREFIX_AFTER_COLON,
  PREFIX_AFTER_VALUE,
  PREFIX_AFTER_COMMA
]

const COLON = ':'
const UNDEFINED = undefined

const symbol = (prefix, key) => Symbol.for(prefix + COLON + key)

const assign_comments = (
  target, source, target_key, source_key, prefix, remove_source
) => {
  const source_prop = symbol(prefix, source_key)
  if (!hasOwnProperty(source, source_prop)) {
    return
  }

  const target_prop = target_key === source_key
    ? source_prop
    : symbol(prefix, target_key)

  target[target_prop] = source[source_prop]

  if (remove_source) {
    delete source[source_prop]
  }
}

// Assign keys and comments
const assign = (target, source, keys) => {
  keys.forEach(key => {
    if (!hasOwnProperty(source, key)) {
      return
    }

    target[key] = source[key]
    SYMBOL_PREFIXES.forEach(prefix => {
      assign_comments(target, source, key, key, prefix)
    })
  })

  return target
}

const swap_comments = (array, from, to) => {
  if (from === to) {
    return
  }

  SYMBOL_PREFIXES.forEach(prefix => {
    const target_prop = symbol(prefix, to)
    if (!hasOwnProperty(array, target_prop)) {
      assign_comments(array, array, to, from, prefix)
      return
    }

    const comments = array[target_prop]
    assign_comments(array, array, to, from, prefix)
    array[symbol(prefix, from)] = comments
  })
}

const reverse_comments = array => {
  const {length} = array
  let i = 0
  const max = length / 2

  for (; i < max; i ++) {
    swap_comments(array, i, length - i - 1)
  }
}

const move_comment = (target, source, i, offset, remove) => {
  SYMBOL_PREFIXES.forEach(prefix => {
    assign_comments(target, source, i + offset, i, prefix, remove)
  })
}

const move_comments = (
  // `Array` target array
  target,
  // `Array` source array
  source,
  // `number` start index
  start,
  // `number` number of indexes to move
  count,
  // `number` offset to move
  offset,
  // `boolean` whether should remove the comments from source
  remove
) => {
  if (offset > 0) {
    let i = count
    //         |   count   | offset |
    // source: -------------
    // target:          -------------
    //         | remove |
    // => remove === offset

    // From [count - 1, 0]
    while (i -- > 0) {
      move_comment(target, source, start + i, offset, remove && i < offset)
    }
    return
  }

  let i = 0
  const min_remove = count + offset
  // | remove  |  count    |
  //           -------------
  // -------------
  //             | offset  |

  // From [0, count - 1]
  while (i < count) {
    const ii = i ++
    move_comment(target, source, start + ii, offset, remove && i >= min_remove)
  }
}

class CommentArray extends Array {
  // - deleteCount + items.length

  // We should avoid `splice(begin, deleteCount, ...items)`,
  // because `splice(0, undefined)` is not equivalent to `splice(0)`,
  // as well as:
  // - slice
  splice (...args) {
    const {length} = this
    const ret = super.splice(...args)

    // #16
    // If no element removed, we might still need to move comments,
    //   because splice could add new items

    // if (!ret.length) {
    //   return ret
    // }

    // JavaScript syntax is silly
    // eslint-disable-next-line prefer-const
    let [begin, deleteCount, ...items] = args

    if (begin < 0) {
      begin += length
    }

    if (arguments.length === 1) {
      deleteCount = length - begin
    } else {
      deleteCount = Math.min(length - begin, deleteCount)
    }

    const {
      length: item_length
    } = items

    // itemsToDelete: -
    // itemsToAdd: +
    //        |    dc      |  count   |
    // =======-------------============
    // =======++++++============
    //        | il |
    const offset = item_length - deleteCount
    const start = begin + deleteCount
    const count = length - start

    move_comments(this, this, start, count, offset, true)

    return ret
  }

  slice (...args) {
    const {length} = this
    const array = super.slice(...args)
    if (!array.length) {
      return new CommentArray()
    }

    let [begin, before] = args

    // Ref:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    if (before === UNDEFINED) {
      before = length
    } else if (before < 0) {
      before += length
    }

    if (begin < 0) {
      begin += length
    } else if (begin === UNDEFINED) {
      begin = 0
    }

    move_comments(array, this, begin, before - begin, - begin)

    return array
  }

  unshift (...items) {
    const {length} = this
    const ret = super.unshift(...items)
    const {
      length: items_length
    } = items

    if (items_length > 0) {
      move_comments(this, this, 0, length, items_length, true)
    }

    return ret
  }

  shift () {
    const ret = super.shift()
    const {length} = this

    move_comments(this, this, 1, length, - 1, true)

    return ret
  }

  reverse () {
    super.reverse()

    reverse_comments(this)

    return this
  }

  pop () {
    const ret = super.pop()

    // Removes comments
    const {length} = this
    SYMBOL_PREFIXES.forEach(prefix => {
      const prop = symbol(prefix, length)
      delete this[prop]
    })

    return ret
  }

  concat (...items) {
    let {length} = this
    const ret = super.concat(...items)

    if (!items.length) {
      return ret
    }

    items.forEach(item => {
      const prev = length
      length += isArray(item)
        ? item.length
        : 1

      if (!(item instanceof CommentArray)) {
        return
      }

      move_comments(ret, item, 0, item.length, prev)
    })

    return ret
  }
}

module.exports = {
  CommentArray,
  assign (target, source, keys) {
    if (!isObject(target)) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    if (!isObject(source)) {
      return target
    }

    if (keys === UNDEFINED) {
      keys = Object.keys(source)
    } else if (!isArray(keys)) {
      throw new TypeError('keys must be array or undefined')
    }

    return assign(target, source, keys)
  },

  PREFIX_BEFORE,
  PREFIX_AFTER_PROP,
  PREFIX_AFTER_COLON,
  PREFIX_AFTER_VALUE,
  PREFIX_AFTER_COMMA,

  COLON,
  UNDEFINED
}
