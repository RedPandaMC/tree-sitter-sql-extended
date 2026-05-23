export default {

  _optimize_statement: $ => choice(
    $._optimize_table,
  ),

  // Athena/Iceberg
  _optimize_table: $ => seq(
    $.keyword_optimize,
    $.object_reference,
    $.keyword_rewrite,
    $.keyword_data,
    $.keyword_using,
    $.keyword_bin_pack,
    optional($.where),
  ),

};
