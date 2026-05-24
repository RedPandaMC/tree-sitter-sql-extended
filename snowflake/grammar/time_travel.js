export default {

  // AT ( TIMESTAMP => expr | OFFSET => expr | STATEMENT => 'id' )
  // BEFORE ( STATEMENT => 'id' )
  sf_time_travel_clause: $ => choice(
    seq($.keyword_at, '(', $.sf_time_travel_spec, ')'),
    seq($.keyword_before, '(', $.sf_time_travel_spec, ')'),
  ),

  sf_time_travel_spec: $ => seq(
    choice(
      $.keyword_timestamp,
      $.keyword_offset,
      $.keyword_statement,
    ),
    '=>',
    $._expression,
  ),

};
