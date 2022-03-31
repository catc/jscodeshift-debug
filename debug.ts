import chalk from 'chalk'
import j, { ASTPath, BlockStatement, Node, VariableDeclarator } from 'jscodeshift'

chalk.level = 1

type NodePath = ASTPath<Node>

const SUPPORTED_PROPS = new Set([
  'property',
  'callee',
  'object',
  'expression',
  'type',
  'name',
  'arguments',
  'left',
  'right',
  'kind',
  'init',
  'id',
  'properties',
  'declarations',
  'source',
  'value',
  'specifiers',
  'local',
  'key',
  'body',
  // 'comments',
])
const SUPPORTED_ARG_PROPS = new Set(['type', 'value', 'name'])

const DEFAULT_DEBUG_STRING = 'DEBUG'

export interface Options {
  spacing: number
}

/**
 * @description logs a node tree
 * @example
 * // basic usage
 * debug(someNode)
 * // use debug string
 * debug('[DEBUG]', someNode)
 * // use debug string + options
 * debug('[DEBUG]', someNode, options)
 * @param {Node | NodePath | string} [debugStringOrNode] - node or nodepath to log
 * @param {Node | NodePath | Options} [nodeOrOptions] - node or nodepath to log
 * @param {Object} [options] - options
 * @param {number} [options.spacing] - json.stringify spacing
 */
export default function debug(
  a: string | Node | ASTPath<Node>,
  b?: Node | ASTPath<Node> | Options,
  options?: Options
) {
  if (a && b && options) {
    if (typeof a !== 'string') {
      throw new Error('First arg must be a debug string')
    }
    if (validateNode(b)) {
      return print(a, b, options)
    }
  }

  if (a && b) {
    // debug string + node
    if (typeof a === 'string' && validateNode(b)) {
      return print(a, b)
    } else if (validateNode(a)) {
      // node + options
      return print(DEFAULT_DEBUG_STRING, a, b as Options)
    }
  }

  if (a && validateNode(a)) {
    return print(DEFAULT_DEBUG_STRING, a)
  }
}

function validateNode(n: unknown): n is Node | ASTPath<Node> {
  if (Array.isArray(n)) {
    throw new Error('[debug] Must provide single path')
  }
  const cn = n.constructor?.name
  if (cn !== 'NodePath' && cn !== 'Node' && !(n as any).type) {
    throw new Error(
      `[debug] Must provide Node or NodePath, provided: "${cn || (n as any).type}"`
    )
  }
  return true
}

function print(debugString: string, n: Node | ASTPath<Node>, options?: Options) {
  const cn = n.constructor?.name
  let isNode = cn === 'Node'
  let node: Node
  if (cn === 'NodePath') {
    isNode = false
    node = (n as NodePath).node
  } else {
    node = n as Node
  }

  // create makeshift tree to push node to and retrieve source
  const ast = j(``)
  const { type } = node

  let toInsert
  switch (type) {
    case 'ImportDeclaration':
    case 'VariableDeclaration':
      toInsert = node
      break
    case 'BlockStatement':
      toInsert = j.expressionStatement(
        j.arrowFunctionExpression([], node as BlockStatement)
      )
      break
    case 'VariableDeclarator':
      toInsert = j.variableDeclaration('const', [node as VariableDeclarator])
      break
    default: {
      if (type !== 'ExpressionStatement') {
        toInsert = j.expressionStatement(node as any)
      } else {
        toInsert = node
      }
    }
  }
  ast.find(j.Program).get('body', 0).insertBefore(toInsert)

  const tree = walk(node)

  console.debug(
    chalk.bold(chalk.yellowBright(`[${debugString}]`)),
    chalk.green(`Node tree for ${isNode ? 'node' : 'node path'} is:\n\n`),
    JSON.stringify(tree, null, options?.spacing || 4),
    chalk.green('\n\n\nNode to source:\n\n'),
    // https://github.com/benjamn/recast/blob/master/lib/options.ts
    ast.toSource({}).trim()
  )
}

function walk(node) {
  if (!node) return
  const o = {}
  Object.keys(node).forEach((k) => {
    if (!SUPPORTED_PROPS.has(k)) return
    const val = node[k]

    if (Array.isArray(val)) {
      if (k === 'arguments') {
        o[k] = val.map(parseArg)
        return
      }
      o[k] = val.map(walk)
      return
    } else if (typeof val === 'object') {
      o[k] = walk(val)
      return
    }

    // primitives
    o[k] = node[k]
  })
  return o
}

function parseArg(arg) {
  return Object.keys(arg).reduce((obj, k) => {
    if (SUPPORTED_ARG_PROPS.has(k)) {
      obj[k] = arg[k]
    }
    return obj
  }, {})
}
