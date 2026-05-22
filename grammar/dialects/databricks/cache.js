export default {

  // CACHE [LAZY] TABLE name [OPTIONS (...)] [AS query]
  cache_table: $ => prec.left(seq(
    $.keyword_cache,
    optional($.keyword_lazy),
    $.keyword_table,
    $.object_reference,
    optional($.storage_parameters),
    optional(seq($.keyword_as, $._dml_read)),
  )),

  // UNCACHE TABLE [IF EXISTS] name
  uncache_table: $ => seq(
    $.keyword_uncache,
    $.keyword_table,
    optional($._if_exists),
    $.object_reference,
  ),

  // CLEAR CACHE
  clear_cache: $ => seq(
    $.keyword_clear,
    $.keyword_cache,
  ),

  // REFRESH TABLE name
  refresh_table_databricks: $ => seq(
    $.keyword_refresh,
    $.keyword_table,
    $.object_reference,
  ),

  // REFRESH FUNCTION name
  refresh_function: $ => seq(
    $.keyword_refresh,
    $.keyword_function,
    $.object_reference,
  ),

};
