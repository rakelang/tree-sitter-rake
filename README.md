# Tree-sitter Rake

This repository provides the Tree-sitter grammar and highlighting queries for
[Rake](https://rake-lang.org), together with C, Go, Node.js, Python, Rust and
Swift bindings generated from Tree-sitter's package templates.

```sh
npm test
npm run test:differential
```

The first command regenerates the parser and runs its corpus and highlighting
tests. The differential check parses every source file in Rake's compiler test
manifest with both Tree-sitter and the current compiler, then compares whether
each parser accepts it.
