import { optional_parenthesis } from "../helpers.js";

export default {

  block: $ => seq(
    $.keyword_begin,
    optional(';'),
    repeat(
      seq(
        $.statement,
        ';'
      ),
    ),
    $.keyword_end,
  ),

  while_statement: $ => prec.left(seq(
    $.keyword_while,
    optional_parenthesis($._expression),
    choice(
      seq(
        $.statement,
        optional(';'),
      ),
      seq(
        $.keyword_begin,
        repeat($.statement),
        $.keyword_end,
      ),
    ),
  )),

  var_declarations: $ => seq($.keyword_declare, repeat1($.var_declaration)),
  var_declaration: $ => seq(
    $.identifier,
    $._type,
    optional(
      seq(
        choice($.keyword_default, '='),
        $.literal,
      ),
    ),
    optional(','),
  ),

};
