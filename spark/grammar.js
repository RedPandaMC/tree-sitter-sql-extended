import base from '../grammar.js';
import { paren_list, optional_parenthesis } from '../grammar/helpers.js';
import spark_create_rules from './grammar/create.js';
import spark_optimize_rules from './grammar/optimize.js';
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

    ...spark_create_rules,
    ...spark_optimize_rules,
    ...spark_scripting_rules,

  },
});
