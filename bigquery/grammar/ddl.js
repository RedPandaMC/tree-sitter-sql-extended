import { comma_list, paren_list, wrapped_in_parenthesis } from '../../grammar/helpers.js';

export default {

  // OPTIONS (key = value, ...)
  bq_options_clause: $ => seq(
    $.keyword_options,
    '(',
    comma_list(
      seq(field('key', $.identifier), '=', field('value', $._expression)),
      true,
    ),
    ')',
  ),

  // Override: CREATE [TEMP] TABLE ... [column_defs] [OPTIONS (...)] [AS query]
  create_table: $ => prec.left(
    seq(
      $.keyword_create,
      optional(
        choice(
          $._temporary,
          $.keyword_unlogged,
          $.keyword_external,
        ),
      ),
      $.keyword_table,
      optional($._if_not_exists),
      $.object_reference,
      seq(
        optional($.column_definitions),
        optional($.bq_options_clause),
        optional(seq($.keyword_as, $.create_query)),
      ),
    ),
  ),

  // Override: CREATE [OR REPLACE] [TEMP] VIEW ... [OPTIONS (...)] AS query
  create_view: $ => prec.right(
    seq(
      $.keyword_create,
      optional($._or_replace),
      optional($._temporary),
      optional($.keyword_recursive),
      $.keyword_view,
      optional($._if_not_exists),
      $.object_reference,
      optional(paren_list($.identifier)),
      optional($.bq_options_clause),
      $.keyword_as,
      $.create_query,
    ),
  ),

  // CREATE [OR REPLACE] MODEL [IF NOT EXISTS] ref [OPTIONS (...)] AS query
  bq_create_model: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_model,
    optional($._if_not_exists),
    $.object_reference,
    optional($.bq_options_clause),
    $.keyword_as,
    $.create_query,
  ),

  // EXPORT DATA [WITH CONNECTION ref] [OPTIONS (...)] AS query
  bq_export_data: $ => seq(
    $.keyword_export,
    $.keyword_data,
    optional(seq($.keyword_with, $.keyword_connection, $.object_reference)),
    optional($.bq_options_clause),
    $.keyword_as,
    $.create_query,
  ),

  // ASSERT expr [AS 'message']
  bq_assert: $ => seq(
    $.keyword_assert,
    field('condition', $._expression),
    optional(seq($.keyword_as, alias($._literal_string, $.literal))),
  ),

};
