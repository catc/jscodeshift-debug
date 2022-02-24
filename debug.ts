import chalk from 'chalk'
import j, { ASTPath, Node } from 'jscodeshift'

chalk.level = 1

type NodePath = ASTPath<Node>

const SUPPORTED_PROPS = new Set([
  'property',
  'callee',
  'object',
  'type',
  'name',
  'arguments',
])
const SUPPORTED_ARG_PROPS = new Set(['type', 'value', 'name'])

interface Options {
  spacing: number
}

export function debug(n: Node | ASTPath<Node>, options?: Options) {
  const type = n.constructor?.name
  if (type !== 'NodePath' && type !== 'Node') {
    throw new Error(`Must provide Node or NodePath, provided: "${type}"`)
  }
  const node: Node = type === 'Node' ? (n as Node) : (n as NodePath).node

  const ast = j(``)

  // add node
  const np = ast.find(j.Program).get(0)
  // @ts-ignore
  np.node.body.push(j.expressionStatement(node))

  const tree = walk(node)

  console.debug(
    chalk.green('Node tree is:\n\n'),
    JSON.stringify(tree, null, options?.spacing || 4),
    chalk.green('\n\n\nNode to source:\n\n'),
    // https://github.com/benjamn/recast/blob/master/lib/options.ts
    ast.toSource({})
  )
}

function walk(node) {
  const o = {}
  Object.keys(node).forEach((k) => {
    if (SUPPORTED_PROPS.has(k)) {
      const val = node[k]
      if (typeof val === 'object') {
        if (k === 'arguments') {
          o[k] = val.map(parseArg)
        } else {
          o[k] = walk(val)
        }
      } else {
        o[k] = node[k]
      }
    }
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
