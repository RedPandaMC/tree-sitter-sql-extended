import { paren_list } from "../../grammar/helpers.js";

export default {
  _vacuum_table: $ => prec.left(seq(
    $.keyword_vacuum,
    optional($._vacuum_option),
    $.object_reference,
    optional(paren_list($.field)),
  )),

  _vacuum_option: $ => choice(
    seq($.keyword_full, optional(choice($.keyword_true, $.keyword_false))),
    seq($.keyword_parallel, optional(choice($.keyword_true, $.keyword_false))),
    seq($.keyword_analyze, optional(choice($.keyword_true, $.keyword_false))),
  ),
};
