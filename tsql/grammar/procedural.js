import { comma_list, optional_parenthesis } from '../../grammar/helpers.js';

export default {

  // DECLARE @var1 type [= expr] [, @var2 type [= expr], ...]
  declare_statement: $ => seq(
    $.keyword_declare,
    comma_list($.variable_declaration, true),
  ),

  variable_declaration: $ => seq(
    $.variable,
    optional($.keyword_as),
    $._type,
    optional(seq(
      choice('=', $.keyword_default),
      $._expression,
    )),
  ),

  // IF condition compound_statement [ELSE compound_statement]
  if_statement: $ => prec.right(seq(
    $.keyword_if,
    optional_parenthesis($._expression),
    $.compound_statement,
    optional(seq(
      $.keyword_else,
      $.compound_statement,
    )),
  )),

  // WHILE condition compound_statement
  while_statement: $ => seq(
    $.keyword_while,
    optional_parenthesis($._expression),
    $.compound_statement,
  ),

  // BEGIN statement; [statement;]* END
  // Requires explicit BEGIN...END delimiters; bare single-statement bodies
  // cause irresolvable shift/reduce conflicts with the program-level rule.
  compound_statement: $ => seq(
    $.keyword_begin,
    repeat(seq($.statement, ';')),
    $.keyword_end,
  ),

  // BEGIN TRY statement; [statement;]* END TRY BEGIN CATCH ... END CATCH
  try_catch_statement: $ => seq(
    $.keyword_begin,
    $.keyword_try,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_try,
    $.keyword_begin,
    $.keyword_catch,
    repeat(seq($.statement, ';')),
    $.keyword_end,
    $.keyword_catch,
  ),

  // RAISERROR ( { msg_id | msg_str }, severity, state [, arg [,...]] )
  // [WITH LOG | SETERROR | NOWAIT]
  raiserror_statement: $ => seq(
    $.keyword_raiserror,
    '(',
    $._expression,
    ',',
    $._expression,
    ',',
    $._expression,
    repeat(seq(',', $._expression)),
    ')',
    optional(seq(
      $.keyword_with,
      comma_list(choice(
        $.keyword_log,
        $.keyword_seterror,
        $.keyword_nowait,
      ), true),
    )),
  ),

  // THROW [ error_number , message , state ]
  throw_statement: $ => seq(
    $.keyword_throw,
    optional(seq(
      $._expression,
      ',',
      $._expression,
      ',',
      $._expression,
    )),
  ),

  // PRINT expression
  print_statement: $ => seq(
    $.keyword_print,
    $._expression,
  ),

};
