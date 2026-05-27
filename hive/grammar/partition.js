import { paren_list } from '../../grammar/helpers.js';

export default {

  // MSCK REPAIR TABLE t [ADD/DROP/SYNC PARTITIONS]
  msck_repair_statement: $ => seq(
    $.keyword_msck,
    $.keyword_repair,
    $.keyword_table,
    field('name', $.object_reference),
    optional(seq(
      choice($.keyword_add, $.keyword_drop, $.keyword_sync),
      $.keyword_partitions,
    )),
  ),

  // SKEWED BY (cols) ON (vals) [STORED AS DIRECTORIES]
  skewed_by: $ => seq(
    $.keyword_skewed,
    $.keyword_by,
    paren_list($.identifier, true),
    $.keyword_on,
    paren_list($._expression, true),
    optional(seq($.keyword_stored, $.keyword_as, $.keyword_directories)),
  ),


};
