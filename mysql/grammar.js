import base from '../grammar.js';
import { comma_list, wrapped_in_parenthesis } from '../grammar/helpers.js';
import mysql_create_rules from './grammar/create.js';
import mysql_optimize_rules from './grammar/optimize.js';

export default grammar(base, {
  name: 'mysql_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.create_function],
  ],

  rules: {

    create_table: $ => prec.left(
      seq(
        $.keyword_create,
        optional($._temporary),
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

    _optimize_statement: $ => $._mariadb_optimize_table,

    _ddl_statement: $ => choice(
      $._create_statement,
      $._alter_statement,
      $._drop_statement,
      $._rename_statement,
      $._optimize_statement,
      $._merge_statement,
      $._refresh_statement,
      $.set_statement,
    ),

    insert: $ => seq(
      choice(
        $.keyword_insert,
        $.keyword_replace,
      ),
      optional(
        choice(
          $.keyword_low_priority,
          $.keyword_delayed,
          $.keyword_high_priority,
        ),
      ),
      optional($.keyword_ignore),
      optional($.keyword_into),
      $.object_reference,
      optional(
        seq(
          $.keyword_as,
          field('alias', $.identifier),
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

    from: $ => seq(
      $.keyword_from,
      optional($.keyword_only),
      comma_list($.relation, true),
      optional($.index_hint),
      repeat(
        choice(
          $.join,
          $.cross_join,
          $.lateral_join,
          $.lateral_cross_join,
        ),
      ),
      optional($.where),
      optional($.group_by),
      optional($.having),
      optional($.window_clause),
      optional($.order_by),
      optional($.limit),
    ),

    join: $ => seq(
      optional($.keyword_natural),
      optional(
        choice(
          $.keyword_left,
          seq($.keyword_full, $.keyword_outer),
          seq($.keyword_left, $.keyword_outer),
          $.keyword_right,
          seq($.keyword_right, $.keyword_outer),
          $.keyword_inner,
          $.keyword_full,
        ),
      ),
      $.keyword_join,
      $.relation,
      optional($.index_hint),
      optional($.join),
      choice(
        seq(
          $.keyword_on,
          field('predicate', $._expression),
        ),
        seq(
          $.keyword_using,
          alias($._column_list, $.list),
        ),
      ),
    ),

    _backtick_quoted_string: _ => /`[^`]*`/,

    identifier: $ => choice(
      $._identifier,
      $._double_quote_string,
      $._backtick_quoted_string,
      seq("`", $._identifier, "`"),
    ),

    ...mysql_create_rules,
    ...mysql_optimize_rules,

  },
});
