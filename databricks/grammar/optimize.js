import { paren_list } from "../../grammar/helpers.js";

export default {

  _delta_optimize: $ => seq(
    $.keyword_optimize,
    $.object_reference,
    optional($.where),
    optional(seq(
      $.keyword_zorder,
      $.keyword_by,
      paren_list($.field, true),
    )),
  ),

};
