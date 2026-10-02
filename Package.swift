// swift-tools-version:5.3

import PackageDescription

let sources = ["src/parser.c", "src/scanner.c"]

let package = Package(
    name: "TreeSitterRake",
    products: [
        .library(name: "TreeSitterRake", targets: ["TreeSitterRake"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterRake",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterRakeTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterRake",
            ],
            path: "bindings/swift/TreeSitterRakeTests"
        )
    ],
    cLanguageStandard: .c11
)
