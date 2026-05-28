import { comma_list, paren_list } from '../../grammar/helpers.js';

export default {

  // Override relation to support T-SQL table hints: FROM t [AS alias] WITH (NOLOCK)
  // T-SQL syntax: table_name [[AS] alias] [WITH (hint [,...])]
  relation: $ => prec.right(
    seq(
      choice(
        $.subquery,
        $.invocation,
        $.object_reference,
      ),
      optional($.tablesample),
      optional(
        seq(
          $._alias,
          optional(alias($._column_list, $.list)),
        ),
      ),
      optional($.tsql_table_hints),
    ),
  ),

  // WITH ( hint [, ...] )
  tsql_table_hints: $ => seq(
    $.keyword_with,
    '(',
    comma_list($.tsql_table_hint, true),
    ')',
  ),

  tsql_table_hint: $ => choice(
    $.keyword_nolock,
    $.keyword_rowlock,
    $.keyword_updlock,
    $.keyword_readpast,
    $.keyword_tablock,
    $.keyword_tablockx,
    // INDEX = name  or  INDEX ( name [, ...] )
    seq($.keyword_index, '=', $.identifier),
    seq($.keyword_index, paren_list($.identifier, true)),
    // Catch-all: FORCESCAN, HOLDLOCK, KEEPIDENTITY, NOWAIT, PAGLOCK, READCOMMITTED, etc.
    $.identifier,
  ),

};
