import { comma_list, paren_list } from '../../grammar/helpers.js';

export default {

  // DECLARE x [, y] [TYPE] [DEFAULT expr];
  bq_declare_statement: $ => seq(
    $.keyword_declare,
    comma_list($.identifier, true),
    optional($._type),
    optional(seq($.keyword_default, $._expression)),
  ),

  // SET x = expr;  or  SET (x, y) = (e1, e2);
  bq_set_statement: $ => seq(
    $.keyword_set,
    choice(
      seq($.identifier, '=', $._expression),
      seq(
        paren_list($.identifier, true),
        '=',
        paren_list($._expression, true),
      ),
    ),
  ),

  // BEGIN [stmts] [EXCEPTION WHEN ERROR THEN stmts] END
  bq_begin_block: $ => seq(
    $.keyword_begin,
    repeat(seq($.statement, ';')),
    optional($.bq_exception_clause),
    $.keyword_end,
  ),

  // EXCEPTION WHEN ERROR THEN stmts
  bq_exception_clause: $ => seq(
    $.keyword_exception,
    $.keyword_when,
    $.keyword_error,
    $.keyword_then,
    repeat(seq($.statement, ';')),
  ),

  // FOR r IN (SELECT ...) DO stmts END FOR
  bq_for_statement: $ => seq(
    $.keyword_for,
    field('variable', $.identifier),
    $.keyword_in,
    $.subquery,
    $.keyword_do,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_for,
  ),

  // WHILE expr DO stmts END WHILE
  bq_while_statement: $ => seq(
    $.keyword_while,
    field('condition', $._expression),
    $.keyword_do,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_while,
  ),

  // LOOP stmts END LOOP
  bq_loop_statement: $ => seq(
    $.keyword_loop,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_loop,
  ),

  // IF expr THEN stmts [ELSEIF expr THEN stmts]* [ELSE stmts] END IF
  bq_if_statement: $ => seq(
    $.keyword_if,
    field('condition', $._expression),
    $.keyword_then,
    repeat(seq($.statement, ';')),
    repeat($.bq_elseif_clause),
    optional($.bq_else_clause),
    $.keyword_end,
    $.keyword_if,
  ),

  bq_elseif_clause: $ => seq(
    $.keyword_elseif,
    field('condition', $._expression),
    $.keyword_then,
    repeat(seq($.statement, ';')),
  ),

  bq_else_clause: $ => seq(
    $.keyword_else,
    repeat(seq($.statement, ';')),
  ),

  // LEAVE  (exit innermost loop/begin)
  bq_leave_statement: $ => $.keyword_leave,

  // CONTINUE / ITERATE  (next loop iteration)
  bq_continue_statement: $ => choice($.keyword_continue, $.keyword_iterate),

};
