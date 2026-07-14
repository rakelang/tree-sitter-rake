; Rake canonical syntax highlighting

(comment) @comment

[
  "stack"
  "crunch"
  "rake"
  "run"
  "let"
  "return"
  "yield"
] @keyword

[
  "tine"
  "when"
  "through"
  "else"
  "into"
  "sweep"
  "for"
  "in"
  "using"
  "up"
  "to"
] @keyword

[
  "pack"
  "stack"
] @keyword

(storage_type) @type.builtin
(rack_type) @type.builtin
(mask_type) @type.builtin
(type_identifier) @type

(stack_definition name: (type_identifier) @type)
(crunch_definition name: (identifier) @function)
(rake_definition name: (identifier) @function)
(run_definition name: (identifier) @function)
(call_expression function: (identifier) @function)
(shuffle_expression "shuffle" @function)
(static_move_expression function: _ @function)

(field_group name: (identifier) @property)
(field_expression field: (identifier) @property)

(value_parameter name: (identifier) @variable.parameter)
(pack_parameter name: (identifier) @variable.parameter)
(scalar_parameter name: (scalar_name) @variable.parameter)

(let_statement name: (identifier) @variable)
(fused_binding name: (identifier) @variable)
(mutable_binding name: (identifier) @variable)
(assignment_statement name: (identifier) @variable)
(through_statement name: (identifier) @variable)
(traversal_statement binding: (identifier) @variable)

(tine "#" @punctuation.special (tine_name) @tag)
(scalar_parameter "<" @punctuation.special ">" @punctuation.special)
(scalar_expression "<" @punctuation.special ">" @punctuation.special) @constant

(fused_binding "|" @punctuation.special "<|" @operator)
(sweep_arm "|" @punctuation.special "=>" @operator)

[
  "->"
  ":="
  "<-"
  "="
  "+"
  "-"
  "*"
  "/"
  "%"
  "<"
  "<="
  ">"
  ">="
  "!="
  "and"
  "or"
  "not"
] @operator

(integer_literal) @number
(float_literal) @number
(boolean_literal) @boolean
(lanes) @constant.builtin
(lane_index) @constant.builtin

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
  ";"
  ":"
  "."
] @punctuation.delimiter

(identifier) @variable
