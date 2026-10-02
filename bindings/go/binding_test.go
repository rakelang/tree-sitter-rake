package tree_sitter_rake_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_rake "github.com/rakelang/tree-sitter-rake/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_rake.Language())
	if language == nil {
		t.Errorf("Error loading Rake grammar")
	}
}
