export default {

  // Override _column_constraint to add INVISIBLE / VISIBLE column option.
  // MariaDB allows marking a column invisible so it is excluded from SELECT *
  // but can still be referenced explicitly.
  _column_constraint: $ => prec.left(choice(
    choice(
      $.keyword_null,
      $._not_null,
    ),
    seq(
      $.keyword_references,
      $.object_reference,
      seq('(', $.identifier, ')'),
    ),
    $._default_expression,
    $._primary_key,
    $.direction,
    $._column_comment,
    $._check_constraint,
    seq(
      optional(seq($.keyword_generated, $.keyword_always)),
      $.keyword_as,
      $._expression,
    ),
    $.keyword_unique,
    // MariaDB: INVISIBLE / VISIBLE
    $.keyword_invisible,
    $.keyword_visible,
  )),

};
