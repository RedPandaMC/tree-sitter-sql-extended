import base from '../grammar.js';
import { optional_parenthesis, comma_list, make_keyword } from '../grammar/helpers.js';
import db2_modules_rules from './grammar/modules.js';
import db2_data_control_rules from './grammar/data_control.js';
import db2_isolation_rules from './grammar/isolation.js';
import db2_special_register_rules from './grammar/special_registers.js';

export default grammar(base, {
  name: 'db2_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.create_function],
    [$.from],
  ],

  rules: {

    // Extend _ddl_statement to add Db2-specific DDL
    _ddl_statement: $ => choice(
      $._create_statement,
      $._alter_statement,
      $._drop_statement,
      $._rename_statement,
      $._merge_statement,
      $._refresh_statement,
      $.set_statement,
      $.transfer_ownership,
    ),

    // Extend _create_statement to add Db2-specific CREATE statements
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
        $.create_trigger,
        $.create_wrapper,
        $.create_server,
        $.create_nickname,
        $.create_module,
        $.create_mask,
        $.create_permission,
        prec.left(seq(
          $.create_schema,
          repeat($._create_statement),
        )),
      ),
    ),

    // Extend set_statement to add SET CURRENT SCHEMA = value
    set_statement: $ => seq(
      $.keyword_set,
      choice(
        seq($.keyword_constraints, choice($.keyword_all, comma_list($.identifier, true)), choice($.keyword_deferred, $.keyword_immediate)),
        seq($.keyword_transaction, $._transaction_mode),
        seq($.keyword_transaction, $.keyword_snapshot, $._transaction_mode),
        seq($.keyword_session, $.keyword_characteristics, $.keyword_as, $.keyword_transaction, $._transaction_mode),
        seq($.special_register, '=', $._expression),
        seq($.object_reference, '=', $._expression),
      ),
    ),

    // Extend FROM to support OPTIMIZE FOR n ROWS and WITH isolation level at end
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
        ),
      ),
      optional($.where),
      optional($.group_by),
      optional($.having),
      optional($.window_clause),
      optional($.order_by),
      optional($.limit),
      optional($.optimize_for_clause),
      optional($.with_isolation_clause),
    ),

    // Db2-specific keywords — token(prec(1,...)) needed so lexer prefers
    // these over base _identifier when both are valid in the same state.
    keyword_wrapper:    _ => token(prec(1, make_keyword("wrapper"))),
    keyword_nickname:   _ => token(prec(1, make_keyword("nickname"))),
    keyword_module:     _ => token(prec(1, make_keyword("module"))),
    keyword_server:     _ => token(prec(1, make_keyword("server"))),
    keyword_mask:       _ => token(prec(1, make_keyword("mask"))),
    keyword_permission: _ => token(prec(1, make_keyword("permission"))),
    keyword_transfer:   _ => token(prec(1, make_keyword("transfer"))),
    keyword_ownership:  _ => token(prec(1, make_keyword("ownership"))),
    keyword_enforced:   _ => token(prec(1, make_keyword("enforced"))),
    keyword_ur:         _ => token(prec(1, make_keyword("ur"))),
    keyword_cs:         _ => token(prec(1, make_keyword("cs"))),
    keyword_rs:         _ => token(prec(1, make_keyword("rs"))),
    keyword_rr:         _ => token(prec(1, make_keyword("rr"))),

    ...db2_modules_rules,
    ...db2_data_control_rules,
    ...db2_isolation_rules,
    ...db2_special_register_rules,

  },
});
