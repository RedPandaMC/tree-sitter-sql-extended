export default {

  // ALTER SESSION SET param = value
  sf_alter_session: $ => seq(
    $.keyword_alter,
    $.keyword_session,
    $.keyword_set,
    $.identifier,
    '=',
    $._expression,
  ),

  // ALTER TABLE t MODIFY COLUMN col SET MASKING POLICY policy_name
  sf_alter_table_masking: $ => seq(
    $.keyword_alter,
    $.keyword_table,
    $.object_reference,
    $.keyword_modify,
    $.keyword_column,
    $.identifier,
    $.keyword_set,
    $.keyword_masking,
    $.keyword_policy,
    $.object_reference,
  ),

};
