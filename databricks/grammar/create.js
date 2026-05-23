export default {

  // CREATE [OR REPLACE] NAMESPACE [IF NOT EXISTS] name [COMMENT str] [LOCATION path]
  create_namespace: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_namespace,
    optional($._if_not_exists),
    $.object_reference,
    optional(seq($.keyword_comment, $._literal_string)),
    optional(seq($.keyword_location, $._literal_string)),
  ),

};
