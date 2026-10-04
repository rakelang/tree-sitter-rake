from unittest import TestCase

from tree_sitter import Language, Parser, Query
import tree_sitter_rake


class TestLanguage(TestCase):
    def test_can_parse_packaged_grammar_and_load_highlighting(self):
        language = Language(tree_sitter_rake.language())
        parser = Parser(language)
        tree = parser.parse(b"scratch identity(values: f32s) -> f32s:\n  values\n")
        self.assertFalse(tree.root_node.has_error)
        Query(language, tree_sitter_rake.HIGHLIGHTS_QUERY)
