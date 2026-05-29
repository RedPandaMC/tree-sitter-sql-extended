; inherits: sql

; T-SQL @variable references
(tsql_variable) @variable

; T-SQL-specific keywords
[
  (keyword_top)
  (keyword_output)
  (keyword_inserted)
  (keyword_deleted)
  (keyword_raiserror)
  (keyword_throw)
  (keyword_try)
  (keyword_catch)
  (keyword_go)
  (keyword_bulk)
  (keyword_nolock)
  (keyword_rowlock)
  (keyword_updlock)
  (keyword_readpast)
  (keyword_tablock)
  (keyword_tablockx)
  (keyword_distribution)
  (keyword_round_robin)
  (keyword_replicate)
  (keyword_shortcut)
  (keyword_target)
  (keyword_print)
  (keyword_break)
  (keyword_log)
  (keyword_seterror)
  (keyword_continue)
] @keyword

; T-SQL-specific types
[
  (tsql_datetime2)
  (tsql_smalldatetime)
  (tsql_money_type)
  (tsql_uniqueidentifier)
] @type.builtin

; T-SQL type keywords
[
  (keyword_datetime2)
  (keyword_smalldatetime)
  (keyword_money)
  (keyword_smallmoney)
  (keyword_uniqueidentifier)
] @type.builtin
