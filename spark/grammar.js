import base from '../grammar.js';
import { paren_list, optional_parenthesis, comma_list } from '../grammar/helpers.js';
import spark_create_rules from './grammar/create.js';
import spark_optimize_rules from './grammar/optimize.js';
import spark_spark4_rules from './grammar/spark4.js'; // TODO change file name
import spark_scripting_rules from './grammar/scripting.js';

export default grammar(base, {
  name: 'spark_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.from],
    [$.create_function],
    [$.term],
    [$.var_declarations],
    [$.lateral_cross_join],
    [$.values],
    [$.select_expression],
    [$.set_operation],
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
        $.block,
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

    // Override set_statement to add scripting assignment: SET var = expr
    set_statement: $ => prec.right(choice(
      seq($.keyword_set, $.keyword_constraints, choice($.keyword_all, comma_list($.identifier, true)), choice($.keyword_deferred, $.keyword_immediate)),
      seq($.keyword_set, $.keyword_transaction, $._transaction_mode),
      seq($.keyword_set, $.keyword_transaction, $.keyword_snapshot, $._transaction_mode),
      seq($.keyword_set, $.keyword_session, $.keyword_characteristics, $.keyword_as, $.keyword_transaction, $._transaction_mode),
      seq($.keyword_set, $.object_reference, '=', $._expression),
    )),

    // Override _type to add VARIANT
    _type: $ => prec.left(
      choice(
        $.keyword_variant,
        $.keyword_boolean,
        $.bit,
        $.binary,
        $.varbinary,
        $.smallint,
        $.int,
        $.bigint,
        $.decimal,
        $.numeric,
        $.double,
        $.float,
        $.char,
        $.varchar,
        $.nchar,
        $.nvarchar,
        $.keyword_date,
        $.time,
        $.timestamp,
        $.keyword_interval,
        $.keyword_json,
        $.keyword_xml,
        $.keyword_string,
        $.enum,
        field("custom_type", $.object_reference),
      ),
    ),

    // Override _expression to add collate and variant_path
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
      $.collate_expression,
      $.variant_path_expression,
    )),

    // Override when_clause to allow bare INSERT (no values) for MERGE BY SOURCE
    when_clause: $ => prec.left(seq(
      $.keyword_when,
      optional($.keyword_not),
      $.keyword_matched,
      optional(seq(
        $.keyword_by,
        $.keyword_source,
      )),
      optional(seq(
        $.keyword_and,
        optional_parenthesis(field("predicate", $._expression)),
      )),
      $.keyword_then,
      choice(
        $.keyword_delete,
        seq($.keyword_update, $._set_values),
        seq($.keyword_insert, optional($._insert_values)),
        optional($.where),
      ),
    )),

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
