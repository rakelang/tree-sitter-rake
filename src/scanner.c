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

enum TokenType { NEWLINE, INDENT, DEDENT, ERROR_SENTINEL, BLOCK_COMMENT };

typedef struct {
    Array(uint16_t) indents;
    bool pending_block_comment;
} Scanner;

static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }
static void take(TSLexer *lexer) { lexer->advance(lexer, false); }

static bool scan_block_comment(TSLexer *lexer) {
    if (lexer->lookahead != '(') return false;
    take(lexer);
    if (lexer->lookahead != '*') return false;
    take(lexer);
    unsigned depth = 1;
    int32_t previous = 0;
    while (true) {
        if (lexer->eof(lexer)) return false;
        int32_t c = lexer->lookahead;
        take(lexer);
        if (previous == '(' && c == '*') {
            depth++;
        } else if (previous == '*' && c == ')') {
            depth--;
            if (depth == 0) break;
        }
        previous = c;
    }
    lexer->mark_end(lexer);
    lexer->result_symbol = BLOCK_COMMENT;
    return true;
}

bool tree_sitter_rake_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;
    lexer->mark_end(lexer);
    if (scanner->pending_block_comment) {
        while (lexer->lookahead == '\n' || lexer->lookahead == ' ' ||
               lexer->lookahead == '\t' || lexer->lookahead == '\r' ||
               lexer->lookahead == '\f') {
            skip(lexer);
        }
        scanner->pending_block_comment = false;
        return valid_symbols[BLOCK_COMMENT] && scan_block_comment(lexer);
    }
    if (valid_symbols[BLOCK_COMMENT]) {
        while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
               lexer->lookahead == '\r' || lexer->lookahead == '\f') {
            skip(lexer);
        }
        if (lexer->lookahead == '(') return scan_block_comment(lexer);
    }
    // During error recovery every token is valid; layout tokens then add nothing.
    if (valid_symbols[ERROR_SENTINEL]) return false;
    if (!valid_symbols[NEWLINE] && !valid_symbols[INDENT] && !valid_symbols[DEDENT]) return false;

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
        } else if (c == '(' && end_of_line) {
            indent = lexer->get_column(lexer);
            skip(lexer);
            scanner->pending_block_comment = lexer->lookahead == '*';
            break;
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
        (void)array_pop(&scanner->indents);
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
    unsigned size = 1 + scanner->indents.size * sizeof(uint16_t);
    if (size > TREE_SITTER_SERIALIZATION_BUFFER_SIZE) return 0;
    buffer[0] = scanner->pending_block_comment ? 1 : 0;
    if (scanner->indents.size > 0) {
        memcpy(buffer + 1, scanner->indents.contents, scanner->indents.size * sizeof(uint16_t));
    }
    return size;
}

void tree_sitter_rake_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
    array_clear(&scanner->indents);
    scanner->pending_block_comment = length > 0 && buffer[0] != 0;
    unsigned count = length > 0 ? (length - 1) / sizeof(uint16_t) : 0;
    if (count > 0) {
        array_reserve(&scanner->indents, count);
        memcpy(scanner->indents.contents, buffer + 1, count * sizeof(uint16_t));
        scanner->indents.size = count;
    }
}
