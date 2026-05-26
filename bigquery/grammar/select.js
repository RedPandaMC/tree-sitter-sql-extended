import { paren_list } from '../../grammar/helpers.js';

export default {

  // SELECT * EXCEPT (col1, col2) FROM t
  bq_all_fields_except: $ => seq(
    optional(seq($.object_reference, '.')),
    '*',
    $.keyword_except,
    paren_list($.identifier, true),
  ),

  // SELECT * REPLACE (expr AS col) FROM t
  bq_all_fields_replace: $ => seq(
    optional(seq($.object_reference, '.')),
    '*',
    $.keyword_replace,
    paren_list(
      seq(field('value', $._expression), $.keyword_as, field('alias', $.identifier)),
      true,
    ),
  ),

};
