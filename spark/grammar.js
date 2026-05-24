import base from '../grammar.js';
import { paren_list, optional_parenthesis } from '../grammar/helpers.js';
import spark_create_rules from './grammar/create.js';
import spark_optimize_rules from './grammar/optimize.js';
import spark_spark4_rules from './grammar/spark4.js'; // TODO change file name
import spark_scripting_rules from './grammar/scripting.js';

export default grammar(base, {
  name: 'spark_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.time],
    [$.timestamp],
    [$.from],
    [$.create_sequence],
    [$.alter_sequence],
    [$.create_function],
    [$._truncate_statement],
    [$.signal_statement],
    [$.resignal_statement],
    [$.term],
    [$.var_declarations],
    [$.loop_statement],
    [$.lateral_cross_join],
    [$.select_except_clause],
    [$.values],
    [$.select_expression],
    [$.select_expression, $._select_statement],
    [$.set_operation],
    [$.set_operation, $._select_statement],
    [$.group_by],
    [$.subquery, $.lateral_subquery],
    [$.order_target],
  ],

  rules: {
    // Re-add $.block to program (removed from base — procedural blocks are Spark-specific)
    program: $ => seq(
      repeat(
        seq(
          choice(
            $.transaction,
            $.statement,
            $.block,
          ),
          ';',
        ),
      ),
      optional(
        $.statement,
      ),
    ),

    // Override base statement to include Spark scripting constructs
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
        $.while_statement,
        $.if_statement,
        $.for_statement,
        $.loop_statement,
        $.repeat_statement,
        $.leave_statement,
        $.iterate_statement,
        $.signal_statement,
        $.resignal_statement,
        $.get_diagnostics_statement,
      ),
    ),

    create_table: $ => prec.left(
      seq(
        $.keyword_create,
        optional(
          choice(
            $._temporary,
            $.keyword_unlogged,
            $.keyword_external,
          )
        ),
        $.keyword_table,
        optional($._if_not_exists),
        $.object_reference,
        seq(
          optional($.column_definitions),
          repeat($._table_settings),
          optional(seq($.keyword_as, $.create_query)),
        ),
      ),
    ),

    alter_view: $ => seq(
      $.keyword_alter,
      $.keyword_view,
      optional($._if_exists),
      $.object_reference,
      choice(
        $.rename_object,
        $.rename_column,
        $.set_schema,
        $.change_ownership,
        seq($.keyword_as, $._dml_read),
        seq($.keyword_set, $.keyword_tblproperties, paren_list($.table_option, true)),
        seq($.keyword_unset, $.keyword_tblproperties, paren_list($._expression, true)),
      ),
    ),

    _optimize_statement: $ => choice(
      $._optimize_table,
      $._compute_stats,
      $._spark_analyze,
    ),

    // Override _ddl_statement to add Spark 4.0 variable statements
    _ddl_statement: $ => choice(
      $._create_statement,
      $._alter_statement,
      $._drop_statement,
      $._rename_statement,
      $._optimize_statement,
      $._merge_statement,
      $._refresh_statement,
      $.comment_statement,
      $.set_statement,
      $.reset_statement,
      $.use_statement,
      $.declare_variable_statement,
      $.set_variable_statement,
    ),

    // Spark SQL: INSERT OVERWRITE ... PARTITION (...)
    insert: $ => seq(
      choice(
        $.keyword_insert,
        $.keyword_replace
      ),
      optional(
        choice(
          $.keyword_low_priority,
          $.keyword_delayed,
          $.keyword_high_priority,
        ),
      ),
      optional($.keyword_ignore),
      optional(
        choice(
          $.keyword_into,
          $.keyword_overwrite,
        ),
      ),
      $.object_reference,
      optional($.table_partition),
      optional(
        seq(
          $.keyword_as,
          field('alias', $.identifier)
        ),
      ),
      choice(
        $._insert_values,
        $._set_values,
      ),
      optional(
        choice(
          $._on_conflict,
          $._on_duplicate_key_update,
        ),
      ),
    ),

    // Override term to support SELECT * EXCEPT
    term: $ => seq(
      field(
        'value',
        choice(
          $.all_fields,
          $._expression,
        ),
      ),
      optional($._alias),
      optional($.select_except_clause),
    ),

    // Override relation to support standalone LATERAL subquery
    relation: $ => prec.right(
      seq(
        choice(
          $.subquery,
          $.invocation,
          $.object_reference,
          $.lateral_subquery,
          $.values,
        ),
        optional($.tablesample),
        optional(
          seq(
            $._alias,
            optional(alias($._column_list, $.list)),
          ),
        ),
      ),
    ),

    ...spark_create_rules,
    ...spark_optimize_rules,
    ...spark_spark4_rules,
    ...spark_scripting_rules,
  },
});
