export default {

  // DECLARE section (top-level, before a BEGIN block)
  // DECLARE
  //   var1 TYPE [DEFAULT expr];
  //   var2 TYPE [DEFAULT expr];
  sf_declare_block: $ => seq(
    $.keyword_declare,
    repeat1(seq($.sf_var_decl, ';')),
  ),

  sf_var_decl: $ => seq(
    $.identifier,
    optional($._type),
    optional(seq($.keyword_default, $._expression)),
  ),

  // BEGIN
  //   statements;
  //   [EXCEPTION WHEN condition THEN statements;]
  // END
  sf_begin_block: $ => seq(
    $.keyword_begin,
    repeat(seq($.statement, ';')),
    optional($.sf_exception_clause),
    $.keyword_end,
  ),

  // EXCEPTION WHEN condition THEN statement; [WHEN ...]
  sf_exception_clause: $ => seq(
    $.keyword_exception,
    repeat1($.sf_when_handler),
  ),

  sf_when_handler: $ => seq(
    $.keyword_when,
    $.identifier,
    $.keyword_then,
    repeat(seq($.statement, ';')),
  ),

  // LET var [TYPE] := expr
  sf_let_statement: $ => seq(
    $.keyword_let,
    $.identifier,
    optional($._type),
    ':=',
    $._expression,
  ),

  // FOR var IN start TO end DO statements; END FOR
  // FOR var IN (query) DO statements; END FOR
  sf_for_statement: $ => seq(
    $.keyword_for,
    field('variable', $.identifier),
    $.keyword_in,
    choice(
      seq($._expression, $.keyword_to, $._expression),
      $._dml_read,
    ),
    $.keyword_do,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_for,
  ),

  // RAISE [exception_name]
  sf_raise_statement: $ => seq(
    $.keyword_raise,
    optional($.identifier),
  ),

  // RETURN [expr]
  sf_return_statement: $ => seq(
    $.keyword_return,
    optional($._expression),
  ),

};
