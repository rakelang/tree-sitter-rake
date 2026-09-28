// Tree-sitter grammar for Rake's canonical source language.
// The generated parser is syntax-only; semantic and target guarantees remain
// compiler checks.

module.exports = grammar({
  name: 'rake',

  extras: $ => [/[\s\uFEFF\u2060\u200B]/, $.comment],
  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.stack_definition,
      $.crunch_definition,
      $.rake_definition,
      $.run_definition,
    ),

    comment: _ => choice(/~~[^\n]*/, /\(\*([^*]|\*[^)])*\*\)/),

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

    crunch_definition: $ => seq(
      'crunch',
      field('name', $.identifier),
      $.parameter_list,
      '->',
      field('result', $.type),
      ':',
      repeat($._statement),
      $.return_statement,
    ),

    rake_definition: $ => seq(
      'rake',
      field('name', $.identifier),
      $.parameter_list,
      '->',
      field('result', $.type),
      ':',
      repeat($._statement),
      repeat1($.tine_declaration),
      repeat1($.through_statement),
      $.return_sweep_statement,
    ),

    run_definition: $ => seq(
      'run',
      field('name', $.identifier),
      $.parameter_list,
      '->',
      field('result', $.storage_type),
      ':',
      $.traversal_statement,
    ),

    parameter_list: $ => seq('(', commaSep($.parameter), ')'),

    parameter: $ => choice(
      $.value_parameter,
      $.scalar_parameter,
      $.pack_parameter,
    ),

    value_parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', choice($.rack_type, $.mask_type)),
    ),

    scalar_parameter: $ => seq(
      '<',
      field('name', alias($.identifier, $.scalar_name)),
      ':',
      field('type', $.storage_type),
      '>',
    ),

    pack_parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.pack_type),
    ),

    type: $ => choice(
      $.storage_type,
      $.rack_type,
      $.mask_type,
      $.pack_type,
      $.stack_type,
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

    _statement: $ => choice(
      $._binding_statement,
      $.mutable_binding,
      $.assignment_statement,
      $.expression_statement,
    ),

    _binding_statement: $ => choice($.let_statement, $.fused_binding),

    let_statement: $ => seq(
      'let',
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
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

    mutable_binding: $ => seq(
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
      ':=',
      field('value', $.expression),
    ),

    assignment_statement: $ => seq(
      field('name', $.identifier),
      '<-',
      field('value', $.expression),
    ),

    expression_statement: $ => $.expression,

    return_statement: $ => seq('return', field('value', $.expression)),

    tine_declaration: $ => seq(
      'tine',
      field('name', $.tine),
      'when',
      field('condition', $.predicate),
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
      field('mask', $.tine),
      'else',
      field('passthrough', $.scalar_expression),
      'into',
      field('name', $.identifier),
      ':',
      repeat($._binding_statement),
      field('value', $.expression),
    ),

    return_sweep_statement: $ => seq(
      'return',
      'sweep',
      ':',
      repeat1($.sweep_arm),
    ),

    sweep_arm: $ => seq(
      '|',
      field('selector', choice($.tine, '_')),
      '=>',
      field('value', $.expression),
    ),

    traversal_statement: $ => seq(
      'for',
      field('binding', $.identifier),
      'in',
      field('pack', $.identifier),
      'using',
      field('domain', $.rack_type),
      'up',
      'to',
      field('count', $.scalar_expression),
      ':',
      repeat($._statement),
      $.yield_statement,
    ),

    yield_statement: $ => seq('yield', field('value', $.expression)),

    expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.shuffle_expression,
      $.static_move_expression,
      $.call_expression,
      $.field_expression,
      $.index_expression,
      $.scalar_expression,
      $.tine,
      $.primary_expression,
    ),

    binary_expression: $ => choice(
      prec.left(1, seq($.expression, 'or', $.expression)),
      prec.left(2, seq($.expression, 'and', $.expression)),
      prec.left(3, seq($.expression, choice('<', '<=', '>', '>=', '=', '!='), $.expression)),
      prec.left(4, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(5, seq($.expression, choice('*', '/', '%'), $.expression)),
    ),

    unary_expression: $ => prec.right(6, seq(choice('-', 'not'), $.expression)),

    call_expression: $ => prec(8, seq(
      field('function', $.identifier),
      '(',
      commaSep($.expression),
      ')',
    )),

    shuffle_expression: $ => prec(10, seq(
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

    static_move_expression: $ => prec(10, seq(
      field('function', choice(
        'shift_left', 'shift_right', 'rotate_left', 'rotate_right',
      )),
      '(',
      field('value', $.expression),
      ',',
      field('amount', $.integer_literal),
      ')',
    )),

    field_expression: $ => prec.left(9, seq(
      field('value', $.expression),
      '.',
      field('field', $.identifier),
    )),

    index_expression: $ => prec.left(9, seq(
      field('value', $.expression),
      '[',
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
      prec.left(9, seq($.scalar_value, '.', $.identifier)),
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
      $.lane_index,
      $.lanes,
      seq('(', $.expression, ')'),
    ),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    type_identifier: _ => /[A-Z][a-zA-Z0-9_]*/,
    integer_literal: _ => /0x[0-9a-fA-F]+|[0-9]+/,
    float_literal: _ => /([0-9]+\.[0-9]*([eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+)/,
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
