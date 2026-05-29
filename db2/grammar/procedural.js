import { comma_list } from '../../grammar/helpers.js';

export default {

  // [label:] BEGIN [ATOMIC] stmts END [label]
  compound_statement: $ => seq(
    optional(field('label', seq($.identifier, ':'))),
    $.keyword_begin,
    optional($.keyword_atomic),
    repeat(seq($.statement, ';')),
    $.keyword_end,
    optional(field('end_label', $.identifier)),
  ),

  // DECLARE name [, ...] type [DEFAULT expr]
  declare_statement: $ => seq(
    $.keyword_declare,
    comma_list($.identifier, true),
    $._type,
    optional(seq($.keyword_default, $._expression)),
  ),

  // SET name = expr
  set_variable_statement: $ => prec(1, seq(
    $.keyword_set,
    field('target', choice($.identifier, $._qualified_field)),
    '=',
    field('value', $._expression),
  )),

  // IF cond THEN ... [ELSEIF cond THEN ...] [ELSE ...] END IF
  if_statement: $ => seq(
    $.keyword_if,
    field('condition', $._expression),
    $.keyword_then,
    repeat(seq($.statement, ';')),
    repeat(seq(
      $.keyword_elseif,
      field('condition', $._expression),
      $.keyword_then,
      repeat(seq($.statement, ';')),
    )),
    optional(seq(
      $.keyword_else,
      repeat(seq($.statement, ';')),
    )),
    $.keyword_end,
    $.keyword_if,
  ),

  // [label:] WHILE cond DO ... END WHILE [label]
  while_statement: $ => seq(
    optional(field('label', seq($.identifier, ':'))),
    $.keyword_while,
    field('condition', $._expression),
    $.keyword_do,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_while,
    optional(field('end_label', $.identifier)),
  ),

  // [label:] LOOP ... END LOOP [label]
  loop_statement: $ => seq(
    optional(field('label', seq($.identifier, ':'))),
    $.keyword_loop,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_loop,
    optional(field('end_label', $.identifier)),
  ),

  // LEAVE label
  leave_statement: $ => seq(
    $.keyword_leave,
    field('label', $.identifier),
  ),

  // ITERATE label
  iterate_statement: $ => seq(
    $.keyword_iterate,
    field('label', $.identifier),
  ),

};
