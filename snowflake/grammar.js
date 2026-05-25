import base from '../grammar.js';
import { paren_list, optional_parenthesis, comma_list, wrapped_in_parenthesis } from '../grammar/helpers.js';

import sf_qualify_rules     from './grammar/qualify.js';
import sf_pivot_rules       from './grammar/pivot.js';
import sf_match_rec_rules   from './grammar/match_recognize.js';
import sf_time_travel_rules from './grammar/time_travel.js';
import sf_variant_rules     from './grammar/variant.js';
import sf_scripting_rules   from './grammar/scripting.js';
import sf_execute_rules     from './grammar/execute.js';
import sf_copy_rules        from './grammar/copy.js';
import sf_create_rules      from './grammar/create.js';
import sf_alter_rules       from './grammar/alter.js';
import sf_use_rules         from './grammar/use.js';

export default grammar(base, {
  name: 'snowflake_sql',

  conflicts: $ => [
    // Inherited base conflicts
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.create_function],
    // Snowflake-specific conflicts
    [$._function_return, $.sf_return_statement],
  ],

  rules: {

    // ── Program: add scripting top-level blocks ─────────────────────────────
    program: $ => seq(
      repeat(seq(
        choice(
          $.transaction,
          $.statement,
          $.sf_declare_block,
          $.sf_begin_block,
        ),
        ';',
      )),
      optional($.statement),
    ),

    // ── Statement: add scripting statements ────────────────────────────────
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
        $.sf_let_statement,
        $.sf_return_statement,
        $.sf_raise_statement,
        $.sf_for_statement,
      ),
    ),

    // ── DDL: add Snowflake-specific statements ──────────────────────────────
    _ddl_statement: $ => choice(
      // base ANSI DDL
      $._create_statement,
      $._alter_statement,
      $._drop_statement,
      $._rename_statement,
      $._optimize_statement,
      $._merge_statement,
      $._refresh_statement,
      $.set_statement,
      // Snowflake additions
      $.sf_execute_immediate,
      $.sf_execute_task,
      $.sf_copy_into,
      $.sf_use_secondary_roles,
    ),

    // ── CREATE: add Snowflake CREATE types ─────────────────────────────────
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
        // Snowflake-specific
        $.sf_create_stream,
        $.sf_create_task,
        $.sf_create_dynamic_table,
        $.sf_create_secure_view,
        $.sf_create_masking_policy,
        $.sf_create_row_access_policy,
      ),
    ),

    // ── ALTER: add ALTER SESSION + masking policy alter ─────────────────────
    _alter_statement: $ => seq(
      choice(
        // base (re-enumerated from grammar/statements/alter.js)
        $.alter_table,
        $.alter_view,
        $.alter_materialized_view,
        $.alter_schema,
        $.alter_type,
        $.alter_index,
        $.alter_database,
        $.alter_role,
        $.alter_sequence,
        // Snowflake-specific
        $.sf_alter_session,
        $.sf_alter_table_masking,
      ),
    ),

    // ── SELECT / FROM: add QUALIFY after HAVING ─────────────────────────────
    from: $ => seq(
      $.keyword_from,
      optional($.keyword_only),
      comma_list($.relation, true),
      optional($.index_hint),
      repeat(choice(
        $.join,
        $.cross_join,
        $.lateral_join,
        $.lateral_cross_join,
      )),
      optional($.where),
      optional($.group_by),
      optional($.having),
      optional($.sf_qualify_clause),
      optional($.window_clause),
      optional($.order_by),
      optional($.limit),
    ),

    // ── relation: add time travel, PIVOT, UNPIVOT, MATCH_RECOGNIZE ──────────
    relation: $ => prec.right(
      seq(
        choice(
          $.subquery,
          $.invocation,
          $.object_reference,
          wrapped_in_parenthesis($.values),
        ),
        optional($.sf_time_travel_clause),
        optional($.tablesample),
        optional(choice(
          $.sf_pivot_clause,
          $.sf_unpivot_clause,
        )),
        optional($.sf_match_recognize_clause),
        optional(seq(
          $._alias,
          optional(alias($._column_list, $.list)),
        )),
      ),
    ),

    // ── _expression: add variant colon-path access ──────────────────────────
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
      // Snowflake-specific
      $.sf_variant_access,
    )),

    // ── Spread all Snowflake rule modules ───────────────────────────────────
    ...sf_qualify_rules,
    ...sf_pivot_rules,
    ...sf_match_rec_rules,
    ...sf_time_travel_rules,
    ...sf_variant_rules,
    ...sf_scripting_rules,
    ...sf_execute_rules,
    ...sf_copy_rules,
    ...sf_create_rules,
    ...sf_alter_rules,
    ...sf_use_rules,

  },
});
