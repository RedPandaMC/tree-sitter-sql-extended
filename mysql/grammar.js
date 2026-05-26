import base from '../grammar.js';
import { comma_list, wrapped_in_parenthesis, make_keyword, paren_list } from '../grammar/helpers.js';
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

    // MySQL: override _column_constraint to add AUTO_INCREMENT, STORED, VIRTUAL
    _column_constraint: $ => prec.left(choice(
      choice(
        $.keyword_null,
        $._not_null,
      ),
      seq(
        $.keyword_references,
        $.object_reference,
        paren_list($.identifier, true),
        repeat(
          seq(
            $.keyword_on,
            choice($.keyword_delete, $.keyword_update),
            choice(
              seq($.keyword_no, $.keyword_action),
              $.keyword_restrict,
              $.keyword_cascade,
              seq(
                $.keyword_set,
                choice($.keyword_null, $.keyword_default),
                  optional(paren_list($.identifier, true))
              ),
            ),
          ),
        ),
      ),
      $._default_expression,
      $._primary_key,
      $.keyword_auto_increment,
      $.direction,
      $._column_comment,
      $._check_constraint,
      seq(
        optional(seq($.keyword_generated, $.keyword_always)),
        $.keyword_as,
        $._expression,
      ),
      choice(
        $.keyword_stored,
        $.keyword_virtual,
      ),
      $.keyword_unique
    )),

    // MySQL: override table_option to support ENGINE=
    table_option: $ => choice(
      seq($.keyword_default, $.keyword_character, $.keyword_set, $.identifier),
      seq($.keyword_collate, $.identifier),
      field('name', $.keyword_default),
      seq(
        field('name', choice($.keyword_engine, $.identifier, $._literal_string)),
        '=',
        field('value', choice($.identifier, $._literal_string, alias($._integer, $.literal))),
      ),
    ),

    // MySQL-specific keywords (not ANSI)
    keyword_auto_increment: _ => make_keyword("auto_increment"),
    keyword_stored:         _ => make_keyword("stored"),
    keyword_virtual:        _ => make_keyword("virtual"),
    keyword_optimize:       _ => make_keyword("optimize"),
    keyword_engine:         _ => make_keyword("engine"),
    keyword_high_priority:  _ => make_keyword("high_priority"),
    keyword_low_priority:   _ => make_keyword("low_priority"),
    keyword_delayed:        _ => make_keyword("delayed"),
    keyword_rlike:          _ => choice(make_keyword("rlike"), make_keyword("regexp")),
    keyword_split:          _ => make_keyword("split"),
    keyword_tablets:        _ => make_keyword("tablets"),
    keyword_ignore:         _ => make_keyword("ignore"),
    keyword_fields:         _ => make_keyword("fields"),
    keyword_terminated:     _ => make_keyword("terminated"),
    keyword_lines:          _ => make_keyword("lines"),

    ...mysql_create_rules,
    ...mysql_optimize_rules,

  },
});
