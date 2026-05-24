import { optional_parenthesis, comma_list, paren_list } from "../../grammar/helpers.js";

export default {

  block: $ => seq(
    $.keyword_begin,
    optional(seq($.keyword_atomic)),
    repeat(
      seq(
        $.statement,
        ';',
      ),
    ),
    $.keyword_end,
  ),

  if_statement: $ => seq(
    $.keyword_if,
    $._expression,
    $.keyword_then,
    repeat(seq($.statement, ';')),
    optional(seq(
      $.keyword_elseif,
      $._expression,
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

  for_statement: $ => seq(
    $.keyword_for,
    field('variable', $.identifier),
    $.keyword_in,
    $._dml_read,
    $.keyword_do,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_for,
  ),

  while_statement: $ => seq(
    $.keyword_while,
    optional_parenthesis($._expression),
    $.keyword_do,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_while,
  ),

  loop_statement: $ => seq(
    optional(seq(field('label', $.identifier), ':')),
    $.keyword_loop,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_loop,
  ),

  repeat_statement: $ => seq(
    $.keyword_repeat,
    repeat(seq($.statement, ';')),
    $.keyword_until,
    $._expression,
    $.keyword_end,
    $.keyword_repeat,
  ),

  leave_statement: $ => seq(
    $.keyword_leave,
    field('label', $.identifier),
  ),

  iterate_statement: $ => seq(
    $.keyword_iterate,
    field('label', $.identifier),
  ),

  signal_statement: $ => seq(
    $.keyword_signal,
    optional(seq(
      $.keyword_sqlstate,
      alias($._single_quote_string, $.literal),
    )),
    optional(seq(
      $.keyword_set,
      $.keyword_message,
      $.keyword_text,
      '=',
      alias($._single_quote_string, $.literal),
    )),
  ),

  resignal_statement: $ => seq(
    $.keyword_resignal,
    optional(seq(
      $.keyword_sqlstate,
      alias($._single_quote_string, $.literal),
    )),
    optional(seq(
      $.keyword_set,
      $.keyword_message,
      $.keyword_text,
      '=',
      alias($._single_quote_string, $.literal),
    )),
  ),

  get_diagnostics_statement: $ => seq(
    $.keyword_get,
    $.keyword_diagnostics,
    field('variable', $.identifier),
    '=',
    choice(
      $.keyword_returned_sqlstate,
      $.keyword_message_text,
      seq($.keyword_condition, field('condition_number', alias($._integer, $.literal))),
    ),
  ),

};