export default {

  // SHOW TABLES [FROM table] [LIKE pattern]
  _show_tables: $ => seq(
    $.keyword_tables,
    optional(seq($.keyword_from, $._qualified_field)),
    optional(seq($.keyword_like, $._expression))
  ),

};
