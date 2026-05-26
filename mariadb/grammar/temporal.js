import { comma_list, wrapped_in_parenthesis } from "../../grammar/helpers.js";

export default {

  // FOR SYSTEM_TIME clause on a table reference (system-versioned temporal queries)
  _for_system_time: $ => seq(
    $.keyword_for,
    $.keyword_system_time,
    choice(
      seq($.keyword_as, $.keyword_of, $._expression),
      seq($.keyword_between, $._expression, $.keyword_and, $._expression),
      seq($.keyword_from, $._expression, $.keyword_to, $._expression),
      $.keyword_all,
    ),
  ),

  // Override relation to add optional FOR SYSTEM_TIME clause
  relation: $ => prec.right(
    seq(
      choice(
        $.subquery,
        $.invocation,
        $.json_table,
        $.object_reference,
        wrapped_in_parenthesis($.values),
      ),
      optional($.tablesample),
      optional($._for_system_time),
      optional(
        seq(
          $._alias,
          optional(alias($._column_list, $.list)),
        ),
      ),
    ),
  ),

};
