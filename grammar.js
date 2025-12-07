// Tree-sitter grammar for Rake 0.2.0
// A vector-first language for CPU SIMD with divergent control flow

module.exports = grammar({
  name: 'rake',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    // cmp_operand and expression share common terms
    [$.cmp_operand, $.expression],
  ],

  externals: $ => [],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.stack_def,
      $.single_def,
      $.type_def,
      $.crunch_def,
      $.rake_def,
      $.run_def,
    ),

    // Comments: ~~ rake marks in sand
    comment: $ => /~~[^\n]*/,

    // Stack type definition (SoA layout)
    stack_def: $ => seq(
      'stack',
      field('name', $.type_identifier),
      '{',
      commaSep($.field_def),
      '}'
    ),

    // Single type definition (uniform/scalar struct)
    single_def: $ => seq(
      'single',
      field('name', $.type_identifier),
      '{',
      commaSep($.field_def),
      '}'
    ),

    // Type alias
    type_def: $ => seq(
      'type',
      field('name', $.type_identifier),
      '=',
      $.type
    ),

    field_def: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    // Crunch: pure vector computation
    crunch_def: $ => seq(
      'crunch',
      field('name', $.identifier),
      repeat($.parameter),
      '->',
      field('result', $.result_spec),
      ':',
      repeat($._statement)
    ),

    // Rake: divergent computation with tines
    rake_def: $ => seq(
      'rake',
      field('name', $.identifier),
      repeat($.parameter),
      '->',
      field('result', $.result_spec),
      ':',
      repeat($.let_statement),  // setup
      repeat1($.tine_decl),
      repeat1($.through_block),
      $.sweep_block
    ),

    // Run: sequential orchestration
    run_def: $ => seq(
      'run',
      field('name', $.identifier),
      repeat($.parameter),
      '->',
      field('result', $.result_spec),
      ':',
      repeat($._statement)
    ),

    // Parameters
    parameter: $ => choice(
      $.rack_param,
      $.scalar_param
    ),

    rack_param: $ => choice(
      $.identifier,
      seq('(', $.identifier, ':', $.type, ')')
    ),

    scalar_param: $ => choice(
      $.scalar_expression,
      seq('(', $.scalar_expression, ':', $.type, ')')
    ),

    result_spec: $ => choice(
      $.identifier,
      seq('(', $.identifier, ':', $.type, ')'),
      seq('(', commaSep1($.identifier), ')')
    ),

    // Types
    type: $ => choice(
      $.primitive_type,
      $.compound_type,
      $.rack_type,
      $.stack_type,
      $.single_type,
      $.pack_type,
      $.mask_type,
      $.function_type,
      $.tuple_type,
      $.unit_type
    ),

    primitive_type: $ => choice(
      'float', 'double',
      'int', 'int8', 'int16', 'int64',
      'uint', 'uint8', 'uint16', 'uint64',
      'bool'
    ),

    compound_type: $ => choice('vec2', 'vec3', 'vec4', 'mat3', 'mat4'),

    rack_type: $ => seq(choice($.primitive_type, $.compound_type), 'rack'),
    stack_type: $ => seq($.type_identifier, 'stack'),
    single_type: $ => seq($.type_identifier, 'single'),
    pack_type: $ => seq($.type_identifier, 'pack'),
    mask_type: $ => 'mask',
    function_type: $ => seq('(', commaSep($.type), ')', '->', $.type),
    tuple_type: $ => seq('(', commaSep1($.type), ')'),
    unit_type: $ => seq('(', ')'),

    // Tine declaration: | #name := (predicate)
    tine_decl: $ => seq(
      '|',
      $.tine_ref,
      ':=',
      '(',
      $.predicate,
      ')'
    ),

    // Tine reference: #name
    tine_ref: $ => seq('#', $.identifier),

    // Predicates
    predicate: $ => choice(
      $.predicate_or
    ),

    predicate_or: $ => choice(
      seq($.predicate_or, choice('||', 'or'), $.predicate_and),
      $.predicate_and
    ),

    predicate_and: $ => choice(
      seq($.predicate_and, choice('&&', 'and'), $.predicate_not),
      $.predicate_not
    ),

    predicate_not: $ => choice(
      seq(choice('!', 'not'), $.predicate_not),
      $.predicate_cmp
    ),

    predicate_cmp: $ => choice(
      seq($.cmp_operand, $.comparison_op, $.cmp_operand),
      $.tine_ref,
      seq('(', $.predicate, ')')
    ),

    // Expression that can be used in comparisons (no comparison ops to avoid ambiguity)
    cmp_operand: $ => choice(
      $.cmp_binary,
      $.unary_expression,
      $.call_expression,
      $.field_expression,
      $.scalar_expression,
      $.record_expression,
      $.reduce_expression,
      $.scan_expression,
      $.shuffle_expression,
      $.primary_expression
    ),

    cmp_binary: $ => choice(
      prec.left(5, seq($.cmp_operand, choice('+', '-'), $.cmp_operand)),
      prec.left(6, seq($.cmp_operand, choice('*', '/', '%'), $.cmp_operand)),
      prec.left(7, seq($.cmp_operand, choice('<<', '>>', '<<<', '>>>'), $.cmp_operand)),
      prec.left(8, seq($.cmp_operand, '><', $.cmp_operand)),
    ),

    comparison_op: $ => choice('<', '<=', '>', '>=', '=', '!=', 'is', /is\s+not/),

    // Through block: masked computation
    through_block: $ => seq(
      'through',
      $.tine_ref_expr,
      optional($.else_clause),
      ':',
      repeat($.let_statement),
      $.expression,
      '->',
      field('binding', $.identifier)
    ),

    tine_ref_expr: $ => choice(
      $.tine_ref,
      seq('(', $.predicate, ')')
    ),

    else_clause: $ => seq('else', $.simple_expression),

    // Sweep block: collect results
    sweep_block: $ => seq(
      'sweep',
      ':',
      repeat1($.sweep_arm),
      '->',
      field('binding', $.identifier)
    ),

    sweep_arm: $ => seq(
      '|',
      choice($.tine_ref, '_'),
      '->',
      $.expression
    ),

    // Statements
    _statement: $ => choice(
      $.let_statement,
      $.assign_statement,
      $.over_statement,
      $.expression_statement
    ),

    // Over loop: iterate over pack in SIMD-width chunks
    // Body is a single expression (use let-in for multiple bindings)
    over_statement: $ => prec.right(seq(
      'over',
      field('pack', $.expression),
      ',',
      field('count', $.scalar_expression),
      '|>',
      field('binding', $.identifier),
      ':',
      field('body', $.expression)
    )),

    let_statement: $ => seq(
      'let',
      field('name', $.identifier),
      optional(seq(':', $.type)),
      '=',
      $.expression
    ),

    assign_statement: $ => seq(
      $.identifier,
      '<-',
      $.expression
    ),

    expression_statement: $ => $.expression,

    // Expressions
    expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.field_expression,
      $.scalar_expression,
      $.record_expression,
      $.reduce_expression,
      $.scan_expression,
      $.shuffle_expression,
      $.lambda_expression,
      $.let_expression,
      $.primary_expression
    ),

    binary_expression: $ => choice(
      prec.left(1, seq($.expression, '|>', $.expression)),
      prec.left(2, seq($.expression, choice('||', 'or'), $.expression)),
      prec.left(3, seq($.expression, choice('&&', 'and'), $.expression)),
      prec.left(4, seq($.expression, choice('<', '<=', '>', '>=', '=', '!='), $.expression)),
      prec.left(5, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(6, seq($.expression, choice('*', '/', '%'), $.expression)),
      prec.left(7, seq($.expression, choice('<<', '>>', '<<<', '>>>'), $.expression)),
      prec.left(8, seq($.expression, '><', $.expression)),
    ),

    unary_expression: $ => prec.right(9, seq(choice('-', '!', 'not'), $.expression)),

    call_expression: $ => prec(10, seq(
      field('function', $.identifier),
      '(',
      commaSep($.expression),
      ')'
    )),

    field_expression: $ => prec.left(11, seq($.expression, '.', $.identifier)),

    // Scalar/broadcast expression: <name>, <name.field>, <1.0>
    // All scalar values use angle bracket syntax
    scalar_expression: $ => seq(
      '<',
      $.scalar_inner,
      '>'
    ),

    scalar_inner: $ => prec.left(choice(
      $.identifier,
      seq($.scalar_inner, '.', $.identifier),
      $.integer_literal,
      $.float_literal,
      seq('-', $.integer_literal),
      seq('-', $.float_literal)
    )),

    record_expression: $ => seq(
      $.type_identifier,
      '{',
      commaSep($.field_init),
      '}'
    ),

    field_init: $ => seq($.identifier, ':=', $.expression),

    reduce_expression: $ => prec.left(12, seq($.expression, $.reduce_op)),
    reduce_op: $ => choice('\\+/', '\\*/', '\\min/', '\\max/', '\\|/', '\\&/'),

    scan_expression: $ => prec.left(12, seq($.expression, $.scan_op)),
    scan_op: $ => choice('\\+\\', '\\*\\', '\\min\\', '\\max\\'),

    shuffle_expression: $ => prec.left(11, seq($.expression, '~>', '[', commaSep($.integer_literal), ']')),

    lambda_expression: $ => prec.right(0, seq('fun', repeat1($.parameter), '->', $.expression)),

    let_expression: $ => prec.right(1, seq('let', $.identifier, '=', $.expression, 'in', $.expression)),

    primary_expression: $ => choice(
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      $.lane_index,
      $.lanes,
      $.unit,
      seq('(', $.expression, ')'),
      seq('(', commaSep1($.expression), ')'),  // tuple
    ),

    simple_expression: $ => choice(
      $.scalar_expression,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal
    ),

    // Terminals
    identifier: $ => /[a-z_][a-zA-Z0-9_]*/,
    type_identifier: $ => /[A-Z][a-zA-Z0-9_]*/,
    integer_literal: $ => /-?[0-9]+/,
    float_literal: $ => /-?[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?/,
    boolean_literal: $ => choice('true', 'false'),
    lane_index: $ => '@',
    lanes: $ => 'lanes',
    unit: $ => seq('(', ')'),
  }
});

// Helper functions
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
