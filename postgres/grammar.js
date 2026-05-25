import base from '../grammar.js';
import { wrapped_in_parenthesis } from '../grammar/helpers.js';
import pg_copy_rules from './grammar/copy.js';
import pg_optimize_rules from './grammar/optimize.js';
import pg_create_rules from './grammar/create.js';
import pg_alter_rules from './grammar/alter.js';
import pg_drop_rules from './grammar/drop.js';

export default grammar(base, {
  name: 'postgres_sql',

  externals: $ => [
    $._dollar_quoted_string_start_tag,
    $._dollar_quoted_string_end_tag,
    $._dollar_quoted_string,
  ],

  rules: {

    _dml_write: $ => seq(
      optional($._cte),
      choice(
        $._delete_statement,
        $._insert_statement,
        $._update_statement,
        $._truncate_statement,
        $._copy_statement,
      ),
    ),

    _create_statement: $ => seq(
      choice(
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
        $.create_extension,
        $.create_trigger,
        $.create_policy,
        prec.left(seq(
          $.create_schema,
          repeat($._create_statement),
        )),
      ),
    ),

    _optimize_statement: $ => choice(
      $._optimize_table,
      $._vacuum_table,
    ),

    _alter_statement: $ => seq(
      choice(
        $.alter_table,
        $.alter_view,
        $.alter_materialized_view,
        $.alter_schema,
        $.alter_type,
        $.alter_index,
        $.alter_database,
        $.alter_role,
        $.alter_sequence,
        $.alter_policy,
      ),
    ),

    _drop_statement: $ => seq(
      choice(
        $.drop_table,
        $.drop_view,
        $.drop_materialized_view,
        $.drop_index,
        $.drop_type,
        $.drop_schema,
        $.drop_database,
        $.drop_role,
        $.drop_sequence,
        $.drop_extension,
        $.drop_function,
        $.drop_procedure,
      ),
    ),

    _postgres_escape_string: _ => /(e|E)'([^']|\\')*'/,

    _literal_string: $ => prec(
      1,
      choice(
        $._single_quote_string,
        $._postgres_escape_string,
        $._dollar_quoted_string,
      ),
    ),

    _expression: $ => prec(1,
      choice(
        $.literal,
        alias($._qualified_field, $.field),
        $.parameter,
        $.list,
        $.case,
        $.window_function,
        $.subquery,
        $.cast,
        alias($.implicit_cast, $.cast),
        $.exists,
        $.invocation,
        $.binary_expression,
        $.subscript,
        $.unary_expression,
        $.array,
        $.interval,
        $.between_expression,
        $.parenthesized_expression,
        $.object_id,
      ),
    ),

    implicit_cast: $ => seq(
      $._expression,
      '::',
      $._type,
    ),

    object_id: $ => seq(
      $.keyword_object_id,
      wrapped_in_parenthesis(
        seq(
          alias($._literal_string, $.literal),
          optional(
            seq(
              ',',
              alias($._literal_string, $.literal),
            ),
          ),
        ),
      ),
    ),

    _ddl_statement: $ => choice(
      $._create_statement,
      $._alter_statement,
      $._drop_statement,
      $._rename_statement,
      $._optimize_statement,
      $._merge_statement,
      $._refresh_statement,
      $.set_statement,
      $.reset_statement,
      $.comment_statement,
      $._show_statement,
    ),

    set_statement: $ => seq(
      $.keyword_set,
      choice(
        seq($.keyword_constraints, choice($.keyword_all, $.identifier), choice($.keyword_deferred, $.keyword_immediate)),
        seq($.keyword_transaction, $._transaction_mode),
        seq($.keyword_transaction, $.keyword_snapshot, $._transaction_mode),
        seq($.keyword_session, $.keyword_characteristics, $.keyword_as, $.keyword_transaction, $._transaction_mode),
        seq(
          $.object_reference,
          choice(
            seq('=', choice($.literal, $.keyword_on, $.keyword_off, $.identifier)),
            seq($.keyword_to, choice($.literal, $.keyword_default, $.keyword_on, $.keyword_off, $.identifier)),
          ),
        ),
      ),
    ),

    reset_statement: $ => seq(
      $.keyword_reset,
      choice(
        $.object_reference,
        $.keyword_all,
        seq($.keyword_session, $.keyword_authorization),
        $.keyword_role,
      ),
    ),

    use_statement: $ => seq(
      $.keyword_use,
      optional($.keyword_schema),
      $.object_reference,
    ),

    _show_statement: $ => seq(
      $.keyword_show,
      choice(
        seq($.keyword_create, choice($.keyword_table, $.keyword_view, $.keyword_schema, $.keyword_user), $.object_reference),
        $.keyword_all,
        seq($.keyword_tables, optional(seq($.keyword_from, $.object_reference)), optional(seq($.keyword_like, alias($._literal_string, $.literal)))),
        $.object_reference,
      ),
    ),

    comment_statement: $ => seq(
      $.keyword_comment,
      $.keyword_on,
      $._comment_target,
      $.keyword_is,
      choice(
        $.keyword_null,
        alias($._literal_string, $.literal),
      ),
    ),

    _comment_target: $ => choice(
      $.cast,
      seq($.keyword_column, alias($._qualified_field, $.object_reference)),
      seq($.keyword_database, $.identifier),
      seq($.keyword_extension, $.object_reference),
      seq($.keyword_function, $.object_reference, optional($.function_arguments)),
      seq($.keyword_index, $.object_reference),
      seq($.keyword_materialized, $.keyword_view, $.object_reference),
      seq($.keyword_procedure, $.object_reference, optional($.function_arguments)),
      seq($.keyword_role, $.identifier),
      seq($.keyword_schema, $.identifier),
      seq($.keyword_sequence, $.object_reference),
      seq($.keyword_table, $.object_reference),
      seq($.keyword_tablespace, $.identifier),
      seq($.keyword_trigger, $.identifier, $.keyword_on, $.object_reference),
      seq($.keyword_type, $.identifier),
      seq($.keyword_view, $.object_reference),
    ),

    ...pg_copy_rules,
    ...pg_optimize_rules,
    ...pg_create_rules,
    ...pg_alter_rules,
    ...pg_drop_rules,

  },
});
