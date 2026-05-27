import base from '../grammar.js';
import { optional_parenthesis, comma_list, make_keyword } from '../grammar/helpers.js';
import oracle_hierarchical_rules from './grammar/hierarchical.js';
import oracle_plsql_rules from './grammar/plsql_blocks.js';
import oracle_bulk_rules from './grammar/bulk_ops.js';
import oracle_merge_rules from './grammar/merge_ext.js';

export default grammar(base, {
  name: 'oracle_sql',

  precedences: $ => [
    [
      'binary_is',
      'unary_not',
      'binary_exp',
      'binary_times',
      'binary_plus',
      'unary_other',
      'unary_prior',
      'binary_other',
      'binary_in',
      'binary_compare',
      'binary_relation',
      'pattern_matching',
      'between',
      'clause_connective',
      'clause_disjunctive',
    ],
  ],

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.create_function],
    [$.connect_by_clause],
    [$.plsql_block],
    [$.time],
    [$.timestamp],
  ],

  rules: {

    // Extend statement to add PL/SQL blocks, FORALL, EXECUTE IMMEDIATE
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
        $.plsql_block,
        $.forall_statement,
        $.execute_immediate_statement,
      ),
    ),

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
      optional($.connect_by_clause),
      optional($.group_by),
      optional($.having),
      optional($.window_clause),
      optional($.order_siblings_by),
      optional($.order_by),
      optional($.limit),
    ),

    // Extend unary_expression to include Oracle PRIOR operator
    unary_expression: $ => choice(
      ...[
        [$.keyword_not, 'unary_not'],
        [$.bang, 'unary_not'],
        [$.keyword_any, 'unary_not'],
        [$.keyword_some, 'unary_not'],
        [$.keyword_all, 'unary_not'],
        [$.op_unary_other, 'unary_other'],
        [$.keyword_prior, 'unary_prior'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('operator', operator),
          field('operand', $._expression)
        ))
      ),
    ),

    // Oracle-specific keywords — token(prec(1,...)) needed so lexer prefers
    // these over base _identifier when both are valid in the same state.
    keyword_exceptions: _ => token(prec(1, make_keyword("exceptions"))),
    keyword_connect:  _ => token(prec(1, make_keyword("connect"))),
    keyword_prior:    _ => token(prec(1, make_keyword("prior"))),
    keyword_nocycle:  _ => token(prec(1, make_keyword("nocycle"))),
    keyword_siblings: _ => token(prec(1, make_keyword("siblings"))),
    keyword_forall:   _ => token(prec(1, make_keyword("forall"))),
    keyword_bulk:     _ => token(prec(1, make_keyword("bulk"))),
    keyword_collect:  _ => token(prec(1, make_keyword("collect"))),
    keyword_indices:  _ => token(prec(1, make_keyword("indices"))),
    keyword_rowtype:  _ => token(prec(1, make_keyword("rowtype"))),
    keyword_save:     _ => token(prec(1, make_keyword("save"))),
    keyword_target:   _ => token(prec(1, make_keyword("target"))),
    keyword_rownum:   _ => token(prec(1, make_keyword("rownum"))),
    keyword_dual:     _ => token(prec(1, make_keyword("dual"))),

    ...oracle_hierarchical_rules,
    ...oracle_plsql_rules,
    ...oracle_bulk_rules,
    ...oracle_merge_rules,

  },
});
