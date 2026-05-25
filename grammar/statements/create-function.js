import { paren_list, wrapped_in_parenthesis } from "../helpers.js";

export default {

  create_function: $ => prec.left(seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_function,
    optional($._if_not_exists),
    $.object_reference,
    choice(
      // Standard form: FUNCTION name(args) RETURNS type [options] body
      seq(
        $.function_arguments,
        optional(seq(
          $.keyword_returns,
          choice(
            $._type,
            seq($.keyword_setof, $._type),
            seq($.keyword_table, $.column_definitions),
            $.keyword_trigger,
          ),
        )),
        repeat(
          choice(
            $.function_language,
            $.function_volatility,
            $.function_leakproof,
            $.function_security,
            $.function_safety,
            $.function_strictness,
            $.function_cost,
            $.function_rows,
            $.function_support,
            $.function_handler,
            $.function_environment,
            $.function_parameter_style,
          ),
        ),
        optional($.function_body),
        repeat(
          choice(
            $.function_language,
            $.function_volatility,
            $.function_leakproof,
            $.function_security,
            $.function_safety,
            $.function_strictness,
            $.function_cost,
            $.function_rows,
            $.function_support,
            $.function_handler,
            $.function_environment,
            $.function_parameter_style,
          ),
        ),
      ),
      // Hive/Databricks class-backed UDF: FUNCTION name AS 'java.class.Name' [USING jar]
      seq(
        $.keyword_as,
        field('class', alias($._literal_string, $.literal)),
        optional(seq($.keyword_using, $.keyword_jar, field('jar', alias($._literal_string, $.literal)))),
      ),
    ),
  )),

  _argmode: $ => choice(
    $.keyword_in,
    $.keyword_out,
    $.keyword_inout,
    $.keyword_variadic,
    seq($.keyword_in, $.keyword_out),
  ),

  function_argument: $ => seq(
    optional($._argmode),
    optional($.identifier),
    $._type,
    optional(
      seq(
        choice($.keyword_default, '='),
        $.literal,
      ),
    ),
  ),

    function_arguments: $ => paren_list(
      $.function_argument,
      false,
    ),

  _function_return: $ => seq(
    $.keyword_return,
    $._expression,
  ),

  function_declaration: $ => seq(
    $.identifier,
    $._type,
    optional(
      seq(
        ':=',
        choice(
          wrapped_in_parenthesis($.statement),
          // TODO are there more possibilities here? We can't use `_expression` since
          // that includes subqueries
          $.literal,
        ),
      ),
    ),
    ';',
  ),

  _function_body_statement: $ => choice(
    $.statement,
    $._function_return,
  ),

  function_body: $ => choice(
    seq(
      $._function_return,
      ';'
    ),
    seq(
      $.keyword_begin,
      $.keyword_atomic,
      repeat1(
        seq(
          $._function_body_statement,
          ';',
        ),
      ),
      $.keyword_end,
    ),
    seq(
      $.keyword_as,
      alias($._single_quote_string, $.literal),
    ),
  ),

  function_language: $ => seq(
    $.keyword_language,
    // TODO Maybe we should do different version of function_body_statement in
    // regard to the defined language to match either sql, plsql or
    // plpgsql. Currently the function_body_statement support only sql.  And
    // maybe for other language the function_body should be a string.
    $.identifier
  ),

  function_volatility: $ => choice(
    $.keyword_immutable,
    $.keyword_stable,
    $.keyword_volatile,
  ),

  function_leakproof: $ => seq(
    optional($.keyword_not),
    $.keyword_leakproof,
  ),

  function_security: $ => seq(
    optional($.keyword_external),
    $.keyword_security,
    choice($.keyword_invoker, $.keyword_definer),
  ),

  function_safety: $ => seq(
    $.keyword_parallel,
    choice(
      $.keyword_safe,
      $.keyword_unsafe,
      $.keyword_restricted,
    ),
  ),

  function_strictness: $ => choice(
    seq(
      choice(
        $.keyword_called,
        seq(
          $.keyword_returns,
          $.keyword_null,
        ),
      ),
      $.keyword_on,
      $.keyword_null,
      $.keyword_input,
    ),
    $.keyword_strict,
  ),

  function_cost: $ => seq(
    $.keyword_cost,
    $._natural_number,
  ),

  function_rows: $ => seq(
    $.keyword_rows,
    $._natural_number,
  ),

  function_support: $ => seq(
    $.keyword_support,
    alias($._literal_string, $.literal),
  ),

  function_handler: $ => seq(
    $.keyword_handler,
    alias($._literal_string, $.literal),
  ),

  function_environment: $ => seq(
    $.keyword_environment,
    '(',
    repeat(seq($.identifier, '=', alias($._literal_string, $.literal), optional(','))),
    ')',
  ),

  function_parameter_style: $ => seq(
    $.keyword_parameter,
    $.keyword_style,
    $.identifier,
  ),

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
