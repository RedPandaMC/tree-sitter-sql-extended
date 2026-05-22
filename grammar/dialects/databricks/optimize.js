import { paren_list } from "../../helpers.js";

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

  _spark_analyze: $ => prec.left(1, choice(
    // ANALYZE TABLE t [PARTITION (...)] COMPUTE STATISTICS [NOSCAN | FOR COLUMNS ... | FOR ALL COLUMNS]
    seq(
      $.keyword_analyze,
      $.keyword_table,
      $.object_reference,
      optional($._partition_spec),
      $.keyword_compute,
      optional($.keyword_delta),
      $.keyword_statistics,
      optional(choice(
        $.keyword_noscan,
        seq($.keyword_for, $.keyword_columns, repeat1(seq(optional(','), $.field))),
        seq($.keyword_for, $.keyword_all, $.keyword_columns),
      )),
    ),
    // ANALYZE TABLES [FROM db] COMPUTE [DELTA] STATISTICS [NOSCAN]
    seq(
      $.keyword_analyze,
      $.keyword_tables,
      optional(seq($.keyword_from, $.object_reference)),
      $.keyword_compute,
      optional($.keyword_delta),
      $.keyword_statistics,
      optional($.keyword_noscan),
    ),
    // ANALYZE TABLES IN db COMPUTE [DELTA] STATISTICS [NOSCAN]
    prec.left(2, seq(
      $.keyword_analyze,
      $.keyword_tables,
      $.keyword_in,
      $.object_reference,
      $.keyword_compute,
      optional($.keyword_delta),
      $.keyword_statistics,
      optional($.keyword_noscan),
    )),
  )),

};
