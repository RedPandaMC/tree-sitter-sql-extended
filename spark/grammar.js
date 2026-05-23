import base from '../grammar.js';
import { paren_list } from '../grammar/helpers.js';
import spark_create_rules from './grammar/create.js';
import spark_optimize_rules from './grammar/optimize.js';

export default grammar(base, {
  name: 'spark_sql',

  rules: {

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

  },
});
