import { paren_list } from '../../grammar/helpers.js';

export default {

  // Override row_format to add SERDE support (Spark only has DELIMITED)
  row_format: $ => seq(
    $.keyword_row,
    $.keyword_format,
    choice(
      seq(
        $.keyword_delimited,
        optional(seq(
          $.keyword_fields, $.keyword_terminated, $.keyword_by,
          field('fields_terminated_char', alias($._literal_string, $.literal)),
          optional(seq(
            $.keyword_escaped, $.keyword_by,
            field('escaped_char', alias($._literal_string, $.literal)),
          )),
        )),
        optional(seq(
          $.keyword_lines, $.keyword_terminated, $.keyword_by,
          field('row_terminated_char', alias($._literal_string, $.literal)),
        )),
      ),
      seq(
        $.keyword_serde,
        field('class', alias($._literal_string, $.literal)),
        optional(seq(
          $.keyword_with, $.keyword_serdeproperties,
          paren_list(seq($._literal_string, '=', $._literal_string), true),
        )),
      ),
    ),
  ),

  // STORED BY 'handler' [WITH SERDEPROPERTIES (...)]
  stored_by: $ => seq(
    $.keyword_stored,
    $.keyword_by,
    field('handler', alias($._literal_string, $.literal)),
    optional(seq(
      $.keyword_with, $.keyword_serdeproperties,
      paren_list(seq($._literal_string, '=', $._literal_string), true),
    )),
  ),


};
