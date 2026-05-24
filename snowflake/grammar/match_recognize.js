import { comma_list } from '../../grammar/helpers.js';

export default {

  // MATCH_RECOGNIZE (
  //   [PARTITION BY ...]  [ORDER BY ...]
  //   [MEASURES ...]
  //   [ONE ROW PER MATCH | ALL ROWS PER MATCH]
  //   [AFTER MATCH SKIP ...]
  //   PATTERN ( pattern_expr )
  //   DEFINE var AS expr [, ...]
  // )
  sf_match_recognize_clause: $ => seq(
    $.keyword_match_recognize,
    '(',
    optional($.partition_by),
    optional($.order_by),
    optional($.sf_measures_clause),
    optional($.sf_rows_per_match),
    optional($.sf_after_match_skip),
    $.sf_pattern_clause,
    $.sf_define_clause,
    ')',
  ),

  // MEASURES expr AS alias [, ...]
  sf_measures_clause: $ => seq(
    $.keyword_measures,
    comma_list($.sf_measure_item, true),
  ),

  sf_measure_item: $ => seq(
    $._expression,
    $.keyword_as,
    field('alias', $.identifier),
  ),

  // ONE ROW PER MATCH | ALL ROWS PER MATCH
  sf_rows_per_match: $ => seq(
    choice(
      seq($.keyword_one, $.keyword_row),
      seq($.keyword_all, $.keyword_rows),
    ),
    $.keyword_per,
    $.keyword_match,
  ),

  // AFTER MATCH SKIP { PAST LAST ROW | TO NEXT ROW | TO FIRST var | TO LAST var }
  sf_after_match_skip: $ => seq(
    $.keyword_after,
    $.keyword_match,
    $.keyword_skip,
    choice(
      seq($.keyword_past, $.keyword_last, $.keyword_row),
      seq($.keyword_to, $.keyword_next, $.keyword_row),
      seq($.keyword_to, $.keyword_first, $.identifier),
      seq($.keyword_to, $.keyword_last, $.identifier),
    ),
  ),

  // PATTERN ( pattern_terms )
  sf_pattern_clause: $ => seq(
    $.keyword_pattern,
    '(',
    repeat1($.sf_pattern_term),
    ')',
  ),

  // A single pattern term: IDENTIFIER[quantifier]  or  ( terms )[quantifier]
  sf_pattern_term: $ => seq(
    choice(
      $.identifier,
      seq('(', repeat1($.sf_pattern_term), ')'),
    ),
    optional(choice('+', '*', '?')),
  ),

  // DEFINE var AS expr [, ...]
  sf_define_clause: $ => seq(
    $.keyword_define,
    comma_list($.sf_define_item, true),
  ),

  sf_define_item: $ => seq(
    $.identifier,
    $.keyword_as,
    $._expression,
  ),

};
