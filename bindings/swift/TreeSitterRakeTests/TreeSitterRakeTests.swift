import XCTest
import SwiftTreeSitter
import TreeSitterRake

final class TreeSitterRakeTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_rake())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Rake grammar")
    }
}
