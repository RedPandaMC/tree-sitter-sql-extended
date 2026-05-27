import spark from '../spark/grammar.js';
import { paren_list, optional_parenthesis, comma_list, make_keyword } from '../grammar/helpers.js';
import hive_storage_rules from './grammar/storage.js';
import hive_partition_rules from './grammar/partition.js';
import hive_lateral_view_rules from './grammar/lateral_view.js';

export default grammar(spark, {
  name: 'hive_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
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
    [$.iceberg_write_order],
    [$.lateral_view],
    [$.stored_by],
    [$.row_format],
    [$.skewed_by],
  ],

  rules: {

    // Extend _ddl_statement to add MSCK REPAIR TABLE
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
      $.call_statement,
      $.msck_repair_statement,
    ),

    // Extend _table_settings to add STORED BY and SKEWED BY
    _table_settings: $ => choice(
      $.table_partition,
      $.stored_as,
      $.stored_by,
      $.storage_location,
      $.table_sort,
      $.table_cluster,
      $.row_format,
      $.skewed_by,
      seq($.keyword_tblproperties, paren_list($.table_option, true)),
      seq($.keyword_without, $.keyword_oids),
      $.storage_parameters,
      $.shallow_clone,
      $.table_option,
    ),

    // Extend from to support LATERAL VIEW
    from: $ => seq(
      $.keyword_from,
      optional($.keyword_only),
      comma_list($.relation, true),
      repeat(
        choice(
          $.join,
          $.cross_join,
          $.lateral_join,
          $.lateral_cross_join,
          $.lateral_view,
        ),
      ),
      optional($.where),
      optional($.group_by),
      optional($.having),
      optional($.window_clause),
      optional($.order_by),
      optional($.limit),
    ),

    // Hive-specific keywords — need token(prec(1,...)) so the lexer prefers
    // these over the base _identifier pattern when both are valid.
    keyword_serde:           _ => token(prec(1, make_keyword("serde"))),
    keyword_serdeproperties: _ => token(prec(1, make_keyword("serdeproperties"))),
    keyword_skewed:          _ => token(prec(1, make_keyword("skewed"))),
    keyword_directories:     _ => token(prec(1, make_keyword("directories"))),

    ...hive_storage_rules,
    ...hive_partition_rules,
    ...hive_lateral_view_rules,

  },
});
