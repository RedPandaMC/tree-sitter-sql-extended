import { paren_list, comma_list, optional_parenthesis } from "../../grammar/helpers.js";

export default {

  apply_changes_statement: $ => seq(
    $.keyword_apply,
    $.keyword_changes,
    $.keyword_into,
    optional($.keyword_table),
    field('target', $.object_reference),
    $.keyword_from,
    field('source', choice($.subquery, $.object_reference)),
    optional(seq(
      choice($.keyword_view, $.keyword_flow),
    )),
    optional(seq(
      $.keyword_keys,
      paren_list($.identifier, true),
    )),
    optional(seq(
      $.keyword_sequence,
      $.keyword_by,
      $.identifier,
    )),
    optional(seq(
      $.keyword_columns,
      choice(
        $.keyword_all,
        paren_list($._column_mapping, true),
      ),
    )),
    optional(seq(
      $.keyword_when,
      $.keyword_matched,
      optional(seq(
        $.keyword_and,
        optional_parenthesis($._expression),
      )),
      $.keyword_then,
      choice(
        $.keyword_delete,
        seq($.keyword_update, $._set_values),
        seq($.keyword_upsert, $._set_values),
      ),
    )),
    optional(seq(
      $.keyword_when,
      $.keyword_not,
      $.keyword_matched,
      optional(seq(
        $.keyword_and,
        optional_parenthesis($._expression),
      )),
      $.keyword_then,
      $.keyword_insert,
      optional($._insert_values),
    )),
  ),

  _column_mapping: $ => seq(
    field('target', $.identifier),
    $.keyword_as,
    field('source', $._expression),
  ),

};
