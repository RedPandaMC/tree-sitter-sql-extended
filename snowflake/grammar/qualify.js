export default {

  // QUALIFY window_expr — post-window filter (Snowflake extension to SELECT)
  sf_qualify_clause: $ => seq(
    $.keyword_qualify,
    field('predicate', $._expression),
  ),

};
