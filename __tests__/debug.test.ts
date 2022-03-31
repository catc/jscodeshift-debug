import chalk from 'chalk'
import j from 'jscodeshift'

import debug from '../debug'

// remove colors from output to compare logged strings
chalk.level = 0

const cdbg = jest.spyOn(console, 'debug')

beforeEach(() => {
  cdbg.mockClear().mockImplementation(() => { })
})

function getSource() {
  return cdbg.mock.calls[0][4]
}

describe('debug signature', () => {
  const node = j.identifier('foo')

  it('handles node', () => {
    expect(() => {
      debug(node)
    }).not.toThrow()
  })

  it('handles string, node', () => {
    expect(() => {
      debug('some string', node)
    }).not.toThrow()
    expect(cdbg).toHaveBeenCalledWith(
      expect.stringContaining('some string'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String)
    )
  })

  it('handles string, node, options', () => {
    expect(() => {
      debug('some string', node, { spacing: 2 })
    }).not.toThrow()
    expect(cdbg).toHaveBeenCalledWith(
      expect.stringContaining('some string'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String)
    )
  })

  it('throws if string only', () => {
    expect(() => {
      debug('some string')
    }).toThrow()
  })
})

describe('supports different node types', () => {
  const foo = j.identifier('foo')
  const bar = j.identifier('bar')

  it('handles identifiers', () => {
    const node = foo
    debug(node)
    expect(getSource()).toEqual('foo;')
  })

  it('handles call expressions', () => {
    const node = j.callExpression(foo, [bar])
    debug(node)
    expect(getSource()).toEqual('foo(bar);')
  })

  it('handles import statements', () => {
    const node = j.importDeclaration(
      [j.importDefaultSpecifier(foo), j.importSpecifier(bar)],
      j.literal('./path')
    )
    debug(node)
    expect(getSource()).toEqual('import foo, { bar } from "./path";')
  })

  const variableDeclarator = j.variableDeclarator(foo, j.callExpression(bar, []))

  it('handles variable declarator', () => {
    const node = variableDeclarator
    debug(node)
    expect(getSource()).toEqual('const foo = bar();')
  })

  it('handles variable declarations', () => {
    const node = j.variableDeclaration('const', [variableDeclarator])
    debug(node)
    expect(getSource()).toEqual('const foo = bar();')
  })

  it('handles member expression', () => {
    const node = j.memberExpression(foo, bar)
    debug(node)
    expect(getSource()).toEqual('foo.bar;')
  })

  it('handles expression statements', () => {
    const node = j.expressionStatement(j.callExpression(foo, []))
    debug(node)
    expect(getSource()).toEqual('foo();')
  })

  it('handles block statements', () => {
    const node = j.blockStatement([j.expressionStatement(foo)])
    debug(node)
    expect(getSource()).toEqual(
      `
() => {
  foo;
};
    `.trim()
    )
  })
})
