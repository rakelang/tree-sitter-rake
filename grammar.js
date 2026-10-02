// Tree-sitter grammar for Rake's canonical source language.
// The generated parser is syntax-only; semantic and target guarantees remain
// compiler checks. Indentation is structural: src/scanner.c supplies the
// newline, indent and dedent tokens the compiler's layout filter produces, and
// lines inside parentheses, brackets or braces continue the logical line.

const PREC = {
  conditional: 0,
  or: 1,
  and: 2,
  compare: 3,
  add: 4,
  multiply: 5,
  unary: 6,
  call: 8,
  postfix: 9,
  static_call: 10,
};

export default grammar({
  name: 'rake',

  externals: $ => [$._newline, $._indent, $._dedent, $._error_sentinel, $.block_comment],

  extras: $ => [/[\s﻿⁠​]/, $.line_comment, $.block_comment],
  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      seq($.stack_definition, $._newline),
      seq($.record_definition, $._newline),
      $.crunch_definition,
      $.rake_definition,
      $.run_definition,
      $.slow_definition,
      seq($.extern_definition, $._newline),
      seq($.state_definition, $._newline),
      seq($.embed_definition, $._newline),
      seq($.const_definition, $._newline),
    ),

    line_comment: _ => /~~[^\n]*/,

    stack_definition: $ => seq(
      'stack',
      field('name', $.type_identifier),
      '{',
      repeat1($.field_group),
      '}',
    ),

    field_group: $ => seq(
      field('type', $.storage_type),
      ':',
      commaSep1(field('name', $.identifier)),
      ';',
    ),

    record_definition: $ => seq(
      'record',
      field('name', $.type_identifier),
      optional(seq('from', field('header', $.string_literal))),
      '{',
      repeat1($.record_field_group),
      '}',
    ),

    record_field_group: $ => seq(
      field('type', $.type),
      ':',
      commaSep1(field('name', $.identifier)),
      ';',
    ),

    crunch_definition: $ => seq(
      'crunch',
      field('name', $.identifier),
      $.parameter_list,
      '->',
      field('result', $.type),
      $._block,
    ),

    rake_definition: $ => seq(
      'rake',
      field('name', $.identifier),
      $.parameter_list,
      '->',
      field('result', $.type),
      ':',
      $._newline,
      $._indent,
      repeat(seq($.let_statement, $._newline)),
      repeat1($.tine_declaration),
      repeat1($.through_statement),
      $.return_sweep_statement,
      $._dedent,
    ),

    run_definition: $ => seq(
      'run',
      field('name', $.identifier),
      $.parameter_list,
      optional(seq('->', field('result', $.type))),
      $._block,
    ),

    slow_definition: $ => seq(
      'slow',
      field('name', $.identifier),
      $.parameter_list,
      optional(seq('->', field('result', $.type))),
      $._block,
    ),

    extern_definition: $ => seq(
      'extern',
      'slow',
      field('name', $.identifier),
      $.parameter_list,
      optional(seq('->', field('result', $.type))),
      'from',
      field('header', $.string_literal),
    ),

    state_definition: $ => seq(
      'state',
      field('name', $.identifier),
      ':',
      field('type', $.type),
      optional(seq(':=', field('value', $.expression))),
    ),

    embed_definition: $ => seq(
      'embed',
      field('name', $.identifier),
      'from',
      field('file', $.string_literal),
    ),

    const_definition: $ => seq(
      'const',
      field('name', $.identifier),
      ':',
      field('type', $.type),
      '=',
      field('value', $.expression),
    ),

    parameter_list: $ => seq('(', commaSep($.parameter), ')'),

    parameter: $ => choice(
      $.value_parameter,
      $.scalar_parameter,
    ),

    value_parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type),
    ),

    scalar_parameter: $ => seq(
      '<',
      field('name', alias($.identifier, $.scalar_name)),
      ':',
      field('type', $.type),
      '>',
    ),

    type: $ => choice(
      $.storage_type,
      $.rack_type,
      $.mask_type,
      $.pack_type,
      $.stack_type,
      $.array_type,
      $.view_type,
      $.pointer_type,
      $.mutable_type,
      $.type_identifier,
    ),

    storage_type: _ => choice(
      'f32', 'f64',
      'i8', 'i16', 'i32', 'i64',
      'u8', 'u16', 'u32', 'u64',
      'bool',
    ),

    rack_type: _ => choice(
      'f32s', 'f64s',
      'i8s', 'i16s', 'i32s', 'i64s',
      'u8s', 'u16s', 'u32s', 'u64s',
      'bools',
    ),

    mask_type: _ => 'mask',
    pack_type: $ => seq('pack', field('schema', $.type_identifier)),
    stack_type: $ => seq('stack', field('schema', $.type_identifier)),
    array_type: $ => seq('[', field('count', $.integer_literal), ']', field('element', $.type)),
    view_type: $ => seq('[', ']', field('element', $.type)),
    pointer_type: $ => seq('ptr', field('target', $.type)),
    mutable_type: $ => seq('mut', field('target', $.type)),

    // A body: a line ending in ':' followed by indented statements.
    _block: $ => seq(':', $._newline, $._indent, repeat1($._statement), $._dedent),

    _statement: $ => choice(
      seq($.block_comment, optional($._newline)),
      seq($._simple_statement, $._newline),
      $._compound_statement,
    ),

    _simple_statement: $ => choice(
      $.let_statement,
      $.uniform_binding,
      $.fused_binding,
      $.mutable_binding,
      $.assignment_statement,
      $.return_statement,
      $.yield_statement,
      $.break_statement,
      $.continue_statement,
      $.expression_statement,
    ),

    _compound_statement: $ => choice(
      $.if_statement,
      $.while_statement,
      $.traversal_statement,
      $.for_statement,
      $.repeat_statement,
    ),

    let_statement: $ => seq(
      'let',
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
      '=',
      field('value', $.expression),
    ),

    uniform_binding: $ => seq(
      'let',
      '<',
      field('name', alias($.identifier, $.scalar_name)),
      ':',
      field('type', $.type),
      '>',
      '=',
      field('value', $.expression),
    ),

    fused_binding: $ => seq(
      '|',
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
      '<|',
      field('value', $.expression),
    ),

    mutable_binding: $ => choice(
      seq(
        field('name', $.identifier),
        optional(seq(':', field('type', $.type))),
        ':=',
        field('value', $.expression),
      ),
      seq(
        '(',
        field('name', $.identifier),
        ':',
        field('type', $.type),
        ')',
        ':=',
        field('value', $.expression),
      ),
    ),

    assignment_statement: $ => seq(
      field('target', $._postfix_expression),
      '<-',
      field('value', $.expression),
    ),

    expression_statement: $ => $.expression,

    return_statement: $ => seq('return', optional(field('value', $.expression))),
    yield_statement: $ => seq('yield', field('value', $.expression)),
    break_statement: _ => 'break',
    continue_statement: _ => 'continue',

    if_statement: $ => seq(
      'if',
      field('condition', $.expression),
      $._block,
      optional($.else_clause),
    ),

    else_clause: $ => seq('else', choice($._block, $.if_statement)),

    while_statement: $ => seq('while', field('condition', $.expression), $._block),

    traversal_statement: $ => seq(
      'for',
      field('binding', $.identifier),
      'in',
      field('pack', $.identifier),
      'using',
      field('domain', $.rack_type),
      'up',
      'to',
      field('count', $._simple_value),
      $._block,
    ),

    for_statement: $ => seq(
      'for',
      field('variable', $._loop_variable),
      'from',
      field('start', $.expression),
      'up',
      'to',
      field('end', $.expression),
      optional(seq('by', field('step', $.expression))),
      $._block,
    ),

    repeat_statement: $ => seq(
      'repeat',
      field('variable', $._loop_variable),
      'from',
      field('start', $.expression),
      'up',
      'to',
      field('end', $.expression),
      $._block,
    ),

    _loop_variable: $ => choice($.identifier, $.scalar_variable),

    scalar_variable: $ => seq(
      '<',
      field('name', alias($.identifier, $.scalar_name)),
      ':',
      field('type', $.type),
      '>',
    ),

    tine_declaration: $ => seq(
      'tine',
      field('name', $.tine),
      'when',
      field('condition', $.predicate),
      $._newline,
    ),

    predicate: $ => choice(
      prec.left(1, seq($.predicate, 'or', $.predicate)),
      prec.left(2, seq($.predicate, 'and', $.predicate)),
      prec.right(3, seq('not', $.predicate)),
      prec.left(4, seq(
        $.predicate_arithmetic,
        choice('<', '<=', '>', '>=', '=', '!='),
        $.predicate_arithmetic,
      )),
      $.tine,
      seq('(', $.predicate, ')'),
    ),

    predicate_arithmetic: $ => choice(
      prec.left(5, seq($.predicate_arithmetic, choice('+', '-'), $.predicate_arithmetic)),
      prec.left(6, seq($.predicate_arithmetic, choice('*', '/', '%'), $.predicate_arithmetic)),
      prec.right(7, seq('-', $.predicate_arithmetic)),
      $.predicate_atom,
    ),

    predicate_atom: $ => choice(
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      $.scalar_expression,
      prec.left(9, seq($.predicate_atom, '.', $.identifier)),
      seq('(', $.predicate_arithmetic, ')'),
    ),

    through_statement: $ => seq(
      'through',
      field('mask', choice($.tine, seq('(', $.predicate, ')'))),
      'else',
      field('passthrough', $._simple_value),
      'into',
      field('name', $.identifier),
      ':',
      $._newline,
      $._indent,
      repeat(seq(choice($.let_statement, $.fused_binding), $._newline)),
      field('value', $.expression),
      $._newline,
      $._dedent,
    ),

    _simple_value: $ => choice(
      $.scalar_expression,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
    ),

    return_sweep_statement: $ => seq(
      'return',
      'sweep',
      ':',
      $._newline,
      $._indent,
      repeat1($.sweep_arm),
      $._dedent,
    ),

    sweep_arm: $ => seq(
      '|',
      field('selector', choice($.tine, '_')),
      '=>',
      field('value', $.expression),
      $._newline,
    ),

    expression: $ => choice(
      $.slow_block,
      $.conditional_expression,
      $.binary_expression,
      $.unary_expression,
      $._postfix_expression,
    ),

    slow_block: $ => seq(
      'slow', '{',
      choice(
        optional($._slow_contents),
        $._newline,
        seq($._newline, $._indent, optional($._slow_contents), $._dedent),
      ),
      '}',
    ),

    _slow_contents: $ => choice(seq(
      repeat1(choice(
        seq($._simple_statement, choice($._newline, seq(';', repeat($._newline)))),
        $._compound_statement,
      )),
      optional($._simple_statement),
    ), $._simple_statement),

    _postfix_expression: $ => choice(
      $.field_expression,
      $.index_expression,
      $.shuffle_expression,
      $.static_move_expression,
      $.call_expression,
      $.conversion_expression,
      $.record_expression,
      $.array_expression,
      $.scalar_expression,
      $.tine,
      $.primary_expression,
    ),

    conditional_expression: $ => prec.right(PREC.conditional, seq(
      'if',
      field('condition', $.expression),
      'then',
      field('consequence', $.expression),
      'else',
      field('alternative', $.expression),
    )),

    binary_expression: $ => choice(
      prec.left(PREC.or, seq($.expression, 'or', $.expression)),
      prec.left(PREC.and, seq($.expression, 'and', $.expression)),
      prec.left(PREC.compare, seq($.expression, choice('<', '<=', '>', '>=', '=', '!='), $.expression)),
      prec.left(PREC.add, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(PREC.multiply, seq($.expression, choice('*', '/', '%'), $.expression)),
    ),

    unary_expression: $ => prec.right(PREC.unary, seq(choice('-', 'not'), $.expression)),

    call_expression: $ => prec(PREC.call, seq(
      field('function', choice($.identifier, 'fma')),
      '(',
      commaSep($.expression),
      ')',
    )),

    // i32(x) checks the value fits; wrap(u8, x) keeps the low bits;
    // bitcast(u32, x) reinterprets an equal-width value.
    conversion_expression: $ => prec(PREC.call, choice(
      seq(field('type', $.storage_type), '(', field('value', $.expression), ')'),
      seq(
        field('kind', choice('wrap', 'bitcast')),
        '(',
        field('type', $.type),
        ',',
        field('value', $.expression),
        ')',
      ),
    )),

    record_expression: $ => seq(
      field('record', $.type_identifier),
      '{',
      commaSep($.field_initializer),
      '}',
    ),

    field_initializer: $ => seq(
      field('field', $.identifier),
      ':',
      field('value', $.expression),
    ),

    array_expression: $ => choice(
      seq('[', commaSep1($.expression), ']'),
      seq('[', field('value', $.expression), ';', field('count', $.integer_literal), ']'),
    ),

    shuffle_expression: $ => prec(PREC.static_call, seq(
      'shuffle',
      '(',
      field('value', $.expression),
      ',',
      optional(seq(field('second_value', $.expression), ',')),
      '[',
      commaSep1(field('index', $.integer_literal)),
      ']',
      ')',
    )),

    static_move_expression: $ => prec(PREC.static_call, seq(
      field('function', choice(
        'shift_left', 'shift_right', 'rotate_left', 'rotate_right',
      )),
      '(',
      field('value', $.expression),
      ',',
      field('amount', $.integer_literal),
      ')',
    )),

    field_expression: $ => prec.left(PREC.postfix, seq(
      field('value', $._postfix_expression),
      '.',
      field('field', $.identifier),
    )),

    index_expression: $ => prec.left(PREC.postfix, seq(
      field('value', $._postfix_expression),
      '[',
      optional('unchecked'),
      field('index', $.expression),
      ']',
    )),

    scalar_expression: $ => seq(
      '<',
      field('value', $.scalar_value),
      '>',
    ),

    scalar_value: $ => choice(
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      seq('-', choice($.integer_literal, $.float_literal)),
      prec.left(PREC.postfix, seq($.scalar_value, '.', $.identifier)),
      prec.left(PREC.postfix, seq($.scalar_value, '[', optional('unchecked'), $.expression, ']')),
    ),

    tine: $ => seq(
      '#',
      alias(token.immediate(/[a-zA-Z_][a-zA-Z0-9_]*/), $.tine_name),
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      $.string_literal,
      $.lane_index,
      $.lanes,
      seq('(', $.expression, ')'),
    ),

    // An identifier starting in upper case is a type name, as in the compiler's lexer.
    identifier: _ => /[a-z_][a-zA-Z0-9_]*/,
    type_identifier: _ => /[A-Z][a-zA-Z0-9_]*/,
    integer_literal: _ => /0x[0-9a-fA-F]+|[0-9]+/,
    float_literal: _ => /([0-9]+\.[0-9]*([eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+)/,
    string_literal: _ => /"([^"\\\n]|\\.)*"/,
    boolean_literal: _ => choice('true', 'false'),
    lane_index: _ => '@',
    lanes: _ => 'lanes',
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
