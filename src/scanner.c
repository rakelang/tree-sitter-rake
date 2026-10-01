// Rake's layout tokens, as the compiler's Layout_tokens filter produces them:
// a newline ends a logical line, an indent opens a deeper body and a dedent
// closes one. The parser never asks for a newline inside parentheses,
// brackets or braces, so those lines continue the logical line. Comments and
// blank lines don't affect indentation. Every token is zero-width: the
// characters scanned to find the next line's indentation are left for the
// ordinary lexer, which treats them as whitespace and comments.

#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <stdint.h>
#include <string.h>

enum TokenType { NEWLINE, INDENT, DEDENT, ERROR_SENTINEL };

typedef struct {
    Array(uint16_t) indents;
} Scanner;

static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

// Skips a nested (* ... *) comment whose "(" has been consumed and whose "*"
// is the lookahead. Returns whether a newline appeared inside it.
static bool skip_block_comment(TSLexer *lexer, bool *newline) {
    unsigned depth = 1;
    skip(lexer);
    while (depth > 0) {
        if (lexer->eof(lexer)) return false;
        int32_t c = lexer->lookahead;
        skip(lexer);
        if (c == '\n') *newline = true;
        else if (c == '(' && lexer->lookahead == '*') { skip(lexer); depth++; }
        else if (c == '*' && lexer->lookahead == ')') { skip(lexer); depth--; }
    }
    return true;
}

bool tree_sitter_rake_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;
    // During error recovery every token is valid; layout tokens then add nothing.
    if (valid_symbols[ERROR_SENTINEL]) return false;
    if (!valid_symbols[NEWLINE] && !valid_symbols[INDENT] && !valid_symbols[DEDENT]) return false;

    lexer->mark_end(lexer);
    bool end_of_line = false;
    uint32_t indent = 0;
    for (;;) {
        int32_t c = lexer->lookahead;
        if (lexer->eof(lexer)) {
            end_of_line = true;
            indent = 0;
            break;
        }
        if (c == '\n') {
            end_of_line = true;
            skip(lexer);
        } else if (c == ' ' || c == '\t' || c == '\r' || c == '\f') {
            skip(lexer);
        } else if (c == '~') {
            skip(lexer);
            if (lexer->lookahead != '~') return false;
            while (!lexer->eof(lexer) && lexer->lookahead != '\n') skip(lexer);
        } else if (c == '(') {
            uint32_t column = lexer->get_column(lexer);
            skip(lexer);
            if (lexer->lookahead != '*') {
                indent = column;
                break;
            }
            if (!skip_block_comment(lexer, &end_of_line)) return false;
        } else {
            indent = lexer->get_column(lexer);
            break;
        }
    }
    if (!end_of_line) return false;

    uint16_t current = scanner->indents.size > 0 ? *array_back(&scanner->indents) : 0;
    if (valid_symbols[INDENT] && indent > current) {
        array_push(&scanner->indents, (uint16_t)indent);
        lexer->result_symbol = INDENT;
        return true;
    }
    if (valid_symbols[DEDENT] && indent < current && scanner->indents.size > 0) {
        array_pop(&scanner->indents);
        lexer->result_symbol = DEDENT;
        return true;
    }
    if (valid_symbols[NEWLINE]) {
        lexer->result_symbol = NEWLINE;
        return true;
    }
    return false;
}

void *tree_sitter_rake_external_scanner_create(void) {
    Scanner *scanner = ts_calloc(1, sizeof(Scanner));
    array_init(&scanner->indents);
    return scanner;
}

void tree_sitter_rake_external_scanner_destroy(void *payload) {
    Scanner *scanner = (Scanner *)payload;
    array_delete(&scanner->indents);
    ts_free(scanner);
}

unsigned tree_sitter_rake_external_scanner_serialize(void *payload, char *buffer) {
    Scanner *scanner = (Scanner *)payload;
    unsigned size = scanner->indents.size * sizeof(uint16_t);
    if (size > TREE_SITTER_SERIALIZATION_BUFFER_SIZE) return 0;
    if (size > 0) memcpy(buffer, scanner->indents.contents, size);
    return size;
}

void tree_sitter_rake_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
    array_clear(&scanner->indents);
    unsigned count = length / sizeof(uint16_t);
    if (count > 0) {
        array_reserve(&scanner->indents, count);
        memcpy(scanner->indents.contents, buffer, count * sizeof(uint16_t));
        scanner->indents.size = count;
    }
}
