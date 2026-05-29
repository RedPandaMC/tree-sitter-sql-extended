import { comma_list, wrapped_in_parenthesis } from '../../grammar/helpers.js';

export default {

  // x -> expr  or  (x, y) -> expr
  // prec.right(-1): prefer extending the body expression over reducing lambda
  lambda_expression: $ => prec.right(-1, seq(
    choice(
      field('param', $.identifier),
      seq('(', comma_list(field('param', $.identifier), true), ')'),
    ),
    '->',
    field('body', $._expression),
  )),

  // {'key': expr, ...}
  struct_literal: $ => seq(
    '{',
    optional(comma_list(
      seq(
        field('key', alias($._literal_string, $.literal)),
        ':',
        field('value', $._expression),
      ),
      true,
    )),
    '}',
  ),

  // map {'key': val, ...}
  map_literal: $ => seq(
    $.keyword_map,
    $.struct_literal,
  ),

  // [expr FOR x IN range(...) IF cond]
  list_comprehension: $ => seq(
    '[',
    field('body', $._expression),
    $.keyword_for,
    field('var', $.identifier),
    $.keyword_in,
    field('source', $._expression),
    optional(seq($.keyword_if, field('condition', $._expression))),
    ']',
  ),

};
