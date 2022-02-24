import { ASTPath, Node } from 'jscodeshift';
interface Options {
    spacing: number;
}
export declare function debug(n: Node | ASTPath<Node>, options?: Options): void;
export {};
