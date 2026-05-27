import base from '../grammar.js';
import { paren_list, comma_list, optional_parenthesis, wrapped_in_parenthesis, make_keyword } from '../grammar/helpers.js';

import bq_select_rules    from './grammar/select.js';
import bq_expr_rules      from './grammar/expressions.js';
import bq_string_rules    from './grammar/strings.js';
import bq_scripting_rules from './grammar/scripting.js';
import bq_ddl_rules       from './grammar/ddl.js';
import bq_ml_rules        from './grammar/ml.js';

export default grammar(base, {
  name: 'bigquery_sql',

  conflicts: $ => [
    // Inherited base conflicts
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.create_function],
    // BigQuery-specific
    [$.all_fields, $.bq_all_fields_except],
  ],

  rules: {

    // ── Program: add scripting top-level blocks ─────────────────────────────
    program: $ => seq(
      repeat(seq(
        choice(
          $.transaction,
          $.statement,
          $.bq_begin_block,
        ),
        ';',
      )),
      optional($.statement),
    ),

    // ── Statement: add BigQuery scripting statements ────────────────────────
    statement: $ => seq(
      optional(seq(
        $.keyword_explain,
        optional($.keyword_analyze),
        optional($.keyword_verbose),
      )),
      choice(
        $._ddl_statement,
        $._dml_write,
        optional_parenthesis($._dml_read),
        $.bq_declare_statement,
        $.bq_set_statement,
        $.bq_for_statement,
        $.bq_while_statement,
        $.bq_loop_statement,
        $.bq_if_statement,
        $.bq_leave_statement,
        $.bq_continue_statement,
      ),
    ),

    // ── DDL: add BigQuery-specific statements ───────────────────────────────
    _ddl_statement: $ => choice(
      // base ANSI DDL
      $._create_statement,
      $._alter_statement,
      $._drop_statement,
      $._rename_statement,
      $._merge_statement,
      $._refresh_statement,
      $.set_statement,
      // BigQuery additions
      $.bq_export_data,
      $.bq_assert,
    ),

    // ── CREATE: add BigQuery CREATE types ──────────────────────────────────
    _create_statement: $ => seq(
      choice(
        // base (re-enumerated from grammar/statements/create.js)
        $.create_table,
        $.create_view,
        $.create_materialized_view,
        $.create_index,
        $.create_function,
        $.create_procedure,
        $.create_type,
        $.create_database,
        $.create_role,
        $.create_sequence,
        $.create_trigger,
        prec.left(seq(
          $.create_schema,
          repeat($._create_statement),
        )),
        // BigQuery-specific
        $.bq_create_model,
      ),
    ),

    // ── term: allow SELECT * EXCEPT / REPLACE ──────────────────────────────
    term: $ => seq(
      field(
        'value',
        choice(
          $.all_fields,
          $.bq_all_fields_except,
          $.bq_all_fields_replace,
          $._expression,
        ),
      ),
      optional($._alias),
    ),

    // ── _expression: add BQ struct, array, typed literal, triple-string ────
    _expression: $ => prec(1, choice(
      $.literal,
      alias($._qualified_field, $.field),
      $.parameter,
      $.list,
      $.case,
      $.window_function,
      $.subquery,
      $.cast,
      $.exists,
      $.invocation,
      $.binary_expression,
      $.subscript,
      $.unary_expression,
      $.array,
      $.interval,
      $.between_expression,
      $.parenthesized_expression,
      // BigQuery-specific
      $.bq_struct,
      $.bq_typed_literal,
      $.bq_triple_double_quoted_string,
      $.bq_triple_single_quoted_string,
      $.bq_ml_function,
    )),

    // BigQuery-specific keywords (not ANSI)
    keyword_struct:    _ => make_keyword("struct"),
    keyword_export:    _ => make_keyword("export"),
    keyword_model:     _ => make_keyword("model"),
    keyword_ml:        _ => make_keyword("ml"),
    keyword_predict:   _ => make_keyword("predict"),
    keyword_evaluate:  _ => make_keyword("evaluate"),
    keyword_assert:    _ => make_keyword("assert"),
    keyword_continue:  _ => make_keyword("continue"),
    keyword_error:     _ => make_keyword("error"),
    keyword_exception: _ => make_keyword("exception"),
    keyword_qualify:   _ => make_keyword("qualify"),
    keyword_string:    _ => make_keyword("string"),
    keyword_while:     _ => make_keyword("while"),
    keyword_loop:      _ => make_keyword("loop"),
    keyword_leave:     _ => make_keyword("leave"),
    keyword_iterate:   _ => make_keyword("iterate"),
    keyword_elseif:    _ => make_keyword("elseif"),
    keyword_source:    _ => make_keyword("source"),
    keyword_options:   _ => make_keyword("options"),

    // ── Spread all BigQuery rule modules ────────────────────────────────────
    ...bq_select_rules,
    ...bq_expr_rules,
    ...bq_string_rules,
    ...bq_scripting_rules,
    ...bq_ddl_rules,
    ...bq_ml_rules,

  },
});
