; Rake 0.2.0 Syntax Highlighting
; Tree-sitter highlight queries for Neovim

; ============================================================================
; Comments - must be first to override other matches
; ============================================================================
(comment) @comment

; ============================================================================
; Keywords
; ============================================================================
[
  "stack"
  "single"
  "type"
  "crunch"
  "rake"
  "run"
  "let"
  "fun"
  "in"
] @keyword

; Control flow keywords get distinct color
[
  "through"
  "sweep"
  "over"
  "else"
] @keyword.conditional

; ============================================================================
; Tines - Rake's distinctive lane masks (#name)
; Using @tag for distinctive color in most themes
; ============================================================================
; The # and identifier together form the tine
(tine_ref
  "#" @tag
  (identifier) @tag)

; Tine declarations: | #name :=
(tine_decl
  "|" @punctuation.special)

; ============================================================================
; Scalars - broadcast values in angle brackets <...>
; Using @constant for distinctive color
; ============================================================================
(scalar_expression
  "<" @punctuation.special) @constant
(scalar_expression
  ">" @punctuation.special)

; Inside scalars, identifiers are constants
(scalar_inner
  (identifier) @constant)
(scalar_inner
  "." @punctuation.delimiter)
(scalar_inner
  (integer_literal) @number)
(scalar_inner
  (float_literal) @number.float)

; ============================================================================
; Function definitions - name should stand out
; ============================================================================
(crunch_def
  name: (identifier) @function)
(rake_def
  name: (identifier) @function)
(run_def
  name: (identifier) @function)

; Function calls
(call_expression
  function: (identifier) @function.call)

; ============================================================================
; Type definitions
; ============================================================================
(stack_def
  name: (type_identifier) @type.definition)
(single_def
  name: (type_identifier) @type.definition)
(type_def
  name: (type_identifier) @type.definition)

; ============================================================================
; Types
; ============================================================================
(primitive_type) @type.builtin
(compound_type) @type.builtin
(mask_type) @type.builtin
(type_identifier) @type

; Collection types after type name
[
  "rack"
  "pack"
] @type.builtin

; ============================================================================
; Operators
; ============================================================================
; Arrow operators
[
  "->"
  "<-"
] @keyword.operator

; Assignment
":=" @keyword.operator

; Pipe operator
"|>" @keyword.operator

; Shuffle/cross
[
  "~>"
  "><"
] @operator

; Comparison
[
  "<"
  "<="
  ">"
  ">="
  "="
  "!="
] @operator

; Logical
[
  "!"
  "&&"
  "||"
  "and"
  "or"
  "not"
  "is"
] @keyword.operator

; Arithmetic
[
  "+"
  "-"
  "*"
  "/"
  "%"
] @operator

; Reduction/scan operators
(reduce_op) @keyword.operator
(scan_op) @keyword.operator

; ============================================================================
; Variables
; ============================================================================
; Variable definitions in let
(let_statement
  name: (identifier) @variable)

; Parameters
(rack_param
  (identifier) @variable.parameter)

; Result bindings
(through_block
  binding: (identifier) @variable)
(sweep_block
  binding: (identifier) @variable)
(result_spec
  (identifier) @variable)

; General identifiers (lowest priority)
(identifier) @variable

; ============================================================================
; Fields/Properties
; ============================================================================
(field_def
  name: (identifier) @property)
(field_expression
  . (_)
  "."
  (identifier) @property)
(field_init
  (identifier) @property)

; ============================================================================
; Literals
; ============================================================================
(integer_literal) @number
(float_literal) @number.float
(boolean_literal) @boolean
(lanes) @constant.builtin
(lane_index) @constant.builtin

; ============================================================================
; Punctuation
; ============================================================================
[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  ","
] @punctuation.delimiter

; Type annotation colon
":" @punctuation.delimiter

; Tine/sweep pipe
"|" @punctuation.special

; ============================================================================
; Records
; ============================================================================
(record_expression
  (type_identifier) @type)
