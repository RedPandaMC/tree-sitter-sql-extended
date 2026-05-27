import base from '../grammar.js';
import { optional_parenthesis, comma_list, make_keyword, wrapped_in_parenthesis } from '../grammar/helpers.js';
import sqlite_pragma_rules from './grammar/pragma.js';
import sqlite_attach_rules from './grammar/attach.js';
import sqlite_virtual_table_rules from './grammar/virtual_table.js';

export default grammar(base, {
  name: 'sqlite_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.create_function],
  ],

  rules: {

    // Extend statement to add SQLite-specific top-level statements
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
        $.pragma_statement,
        $.attach_statement,
        $.detach_statement,
        $.vacuum_statement,
        $.reindex_statement,
      ),
    ),

    // Extend _create_statement to add CREATE VIRTUAL TABLE
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
        $.create_virtual_table,
        prec.left(seq(
          $.create_schema,
          repeat($._create_statement),
        )),
      ),
    ),

    // Override create_table to support WITHOUT ROWID and STRICT table options
    create_table: $ => prec.left(
      seq(
        $.keyword_create,
        optional($._temporary),
        $.keyword_table,
        optional($._if_not_exists),
        $.object_reference,
        seq(
          optional($.column_definitions),
          optional(seq($.keyword_as, $.create_query)),
        ),
        optional(choice(
          seq($.keyword_without, $.keyword_rowid),
          $.keyword_strict,
          seq($.keyword_without, $.keyword_rowid, ',', $.keyword_strict),
          seq($.keyword_strict, ',', $.keyword_without, $.keyword_rowid),
        )),
      ),
    ),

    // VACUUM [schema] [INTO 'file']
    vacuum_statement: $ => seq(
      $.keyword_vacuum,
      optional(field('schema', $.identifier)),
      optional(seq($.keyword_into, field('path', alias($._literal_string, $.literal)))),
    ),

    // REINDEX [schema.name]
    reindex_statement: $ => seq(
      $.keyword_reindex,
      optional(field('name', $.object_reference)),
    ),

    // SQLite-specific keywords
    keyword_pragma:        _ => make_keyword("pragma"),
    keyword_attach:        _ => make_keyword("attach"),
    keyword_detach:        _ => make_keyword("detach"),
    keyword_rowid:         _ => make_keyword("rowid"),
    keyword_reindex:       _ => make_keyword("reindex"),
    keyword_indexed:       _ => make_keyword("indexed"),
    keyword_autoincrement: _ => make_keyword("autoincrement"),

    ...sqlite_pragma_rules,
    ...sqlite_attach_rules,
    ...sqlite_virtual_table_rules,

  },
});
