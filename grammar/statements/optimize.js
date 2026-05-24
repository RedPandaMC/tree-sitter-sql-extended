export default {

  _optimize_statement: $ => choice(
    $._optimize_table,
  ),

  _optimize_table: $ => seq(
    $.keyword_optimize,
    $.object_reference,
    $.keyword_rewrite,
    $.keyword_data,
    optional(seq($.keyword_using, $.keyword_bin_pack)),
    optional($.where),
  ),

};
