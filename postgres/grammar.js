import base from '../grammar.js';
import pg_copy_rules from './grammar/copy.js';
import pg_optimize_rules from './grammar/optimize.js';
import pg_create_rules from './grammar/create.js';
import pg_alter_rules from './grammar/alter.js';
import pg_drop_rules from './grammar/drop.js';

export default grammar(base, {
  name: 'postgres_sql',

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

    ...pg_copy_rules,
    ...pg_optimize_rules,
    ...pg_create_rules,
    ...pg_alter_rules,
    ...pg_drop_rules,

  },
});
