import { wrapped_in_parenthesis } from "../helpers.js";

export default {

  // Base _show_statement — overridden in index.js to add Databricks extensions
  _show_statement: $ => seq(
    $.keyword_show,
    choice(
      $._show_create,
      $.keyword_all,
      $._show_tables,
    ),
  ),

  _show_create: $ => seq(
    $.keyword_create,
    choice(
      // Trino/Presto/MySQL
      $.keyword_schema,
      $.keyword_table,
      seq(optional($.keyword_materialized), $.keyword_view),
      // MySQL
      $.keyword_user,
      $.keyword_trigger,
      $.keyword_procedure,
      $.keyword_function
    ),
    $.object_reference
  ),

  _show_tables: $ => seq(
    $.keyword_tables,
    optional(seq($.keyword_from, $._qualified_field)),
    optional(seq($.keyword_like, $._expression))
  ),

  // athena
  _unload_statement: $ => seq(
    $.keyword_unload,
    wrapped_in_parenthesis($._select_statement),
    $.keyword_to,
    $._single_quote_string,
    $.storage_parameters,
  ),

};
