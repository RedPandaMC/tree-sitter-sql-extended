import base from '../grammar.js';
import mysql_create_rules from './grammar/create.js';
import mysql_optimize_rules from './grammar/optimize.js';

export default grammar(base, {
  name: 'mysql_sql',

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
          repeat($.table_option),
          optional(seq($.keyword_as, $.create_query)),
        ),
      ),
    ),

    _optimize_statement: $ => choice(
      $._optimize_table,
      $._mariadb_optimize_table,
    ),

    ...mysql_create_rules,
    ...mysql_optimize_rules,

  },
});
