# Tree-sitter Rake

This repository provides the Tree-sitter grammar and highlighting queries for
[Rake](https://rake-lang.org), together with C, Go, Node.js, Python, Rust and
Swift bindings generated from Tree-sitter's package templates.

`nix develop` supplies the pinned local package-check tools. Cargo output uses
this project's own directory under the host's target root, or an explicitly
announced cache-directory fallback. Swift checks use the Apple toolchain on
the macOS GitHub runner.

```sh
npm test
npm run test:differential
```

The first command regenerates the parser and runs its corpus and highlighting
tests. The differential check parses every source file in Rake's compiler test
manifest with both Tree-sitter and the current compiler, then compares whether
each parser accepts it.

## Publishing

Run package checks before uploading to a registry. The `Check generated
bindings` workflow runs on source changes and is also a prerequisite of
`Publish language packages`. A failed check prevents every upload.

The npm check installs the actual tarball in a fresh Node consumer and runs
the binding test. Python builds a wheel from the source archive, checks the
distribution metadata, then installs and tests each artifact in a fresh
environment. Rust builds and tests both the checkout and packaged crate.
Go and Swift bindings run their own checks too.

Publish the tested npm and Python artifacts. Cargo uses `cargo package` to
verify its archive matches the tested crate before requesting registry credentials.
Successful uploads establish publication only. Our checks are completed
before upload, without using a registry's acceptance checks as a smoke suite.

The publishing workflow accepts `source_ref` for a checked release tag or
commit. Its package checks and publishing jobs all use that source, so a
workflow repair can publish an existing release without changing its tag.
